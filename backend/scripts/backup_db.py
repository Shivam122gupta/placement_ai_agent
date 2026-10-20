"""
Automated Database Backup and Restoration Utility.
Supports full MongoDB collection export, gzip compression, automated retention, and restoration.

Usage:
    python -m scripts.backup_db --backup
    python -m scripts.backup_db --list
    python -m scripts.backup_db --restore storage/backups/hirxora_backup_YYYYMMDD_HHMMSS.tar.gz
    python -m scripts.backup_db --retention 7
"""

import os
import sys
import json
import gzip
import tarfile
import argparse
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from bson import json_util

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.db.session import init_db, get_db_client
import logging

logger = logging.getLogger("backup_db")
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s")

BACKUP_DIR = BASE_DIR / "storage" / "backups"

COLLECTIONS_TO_BACKUP = [
    "users",
    "profiles",
    "resumes",
    "resume_versions",
    "jobs",
    "job_matches",
    "skill_gap_roadmaps",
    "agent_runs",
    "agent_tool_calls",
    "mock_interviews",
    "applications",
    "notifications",
]


def ensure_backup_dir() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    return BACKUP_DIR


async def create_backup(retention_count: int = 7) -> str:
    """
    Creates a full snapshot of all collections and packages them into a gzip tarball.
    """
    ensure_backup_dir()
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    temp_dir = BACKUP_DIR / f"temp_{timestamp}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Connecting to database {settings.MONGODB_DB_NAME}...")
    await init_db()
    client = get_db_client()
    db = client[settings.MONGODB_DB_NAME]

    total_records = 0
    exported_collections = []

    try:
        for coll_name in COLLECTIONS_TO_BACKUP:
            collection = db[coll_name]
            cursor = collection.find({})
            documents = await cursor.to_list(length=None)

            if documents:
                out_path = temp_dir / f"{coll_name}.json"
                with open(out_path, "w", encoding="utf-8") as f:
                    # Use bson json_util to preserve ObjectIds, datetimes, and binary data
                    json.dump(documents, f, default=json_util.default, indent=2)
                logger.info(f"Exported collection '{coll_name}': {len(documents)} records.")
                total_records += len(documents)
                exported_collections.append(coll_name)

        # Write metadata manifest
        manifest = {
            "app": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": settings.MONGODB_DB_NAME,
            "total_records": total_records,
            "collections": exported_collections,
        }
        with open(temp_dir / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        # Package into tar.gz
        tar_filename = f"hirxora_backup_{timestamp}.tar.gz"
        tar_path = BACKUP_DIR / tar_filename

        with tarfile.open(tar_path, "w:gz") as tar:
            for item in temp_dir.iterdir():
                tar.add(item, arcname=item.name)

        logger.info(f"Database backup created successfully: {tar_path} ({tar_path.stat().st_size / 1024:.2f} KB, {total_records} records)")

        # Enforce retention policy
        apply_retention(retention_count)
        return str(tar_path)

    finally:
        # Cleanup temp directory
        if temp_dir.exists():
            for f in temp_dir.iterdir():
                f.unlink()
            temp_dir.rmdir()


def apply_retention(retention_count: int = 7):
    """
    Deletes older backups, maintaining only the most recent retention_count files.
    """
    ensure_backup_dir()
    backups = sorted(BACKUP_DIR.glob("hirxora_backup_*.tar.gz"), key=os.path.getmtime, reverse=True)
    if len(backups) > retention_count:
        for old_backup in backups[retention_count:]:
            logger.info(f"Pruning expired backup under retention policy: {old_backup.name}")
            old_backup.unlink()


def list_backups():
    """
    Lists available backup archives with their size and modification date.
    """
    ensure_backup_dir()
    backups = sorted(BACKUP_DIR.glob("hirxora_backup_*.tar.gz"), key=os.path.getmtime, reverse=True)
    if not backups:
        print("No database backups found in storage/backups/.")
        return

    print(f"\n{'='*70}\nAvailable Hirxora Database Backups ({len(backups)} found):\n{'='*70}")
    print(f"{'Filename':<42} {'Size':<12} {'Created (UTC)'}")
    print("-" * 70)
    for b in backups:
        size_kb = b.stat().st_size / 1024
        mtime = datetime.fromtimestamp(b.stat().st_mtime, timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        print(f"{b.name:<42} {size_kb:>8.2f} KB   {mtime}")
    print("=" * 70 + "\n")


async def restore_backup(archive_path: str):
    """
    Restores collections from an existing backup archive.
    """
    archive = Path(archive_path)
    if not archive.is_absolute():
        archive = BACKUP_DIR / archive

    if not archive.exists():
        logger.error(f"Backup archive not found: {archive}")
        sys.exit(1)

    temp_dir = BACKUP_DIR / f"temp_restore_{int(datetime.now().timestamp())}"
    temp_dir.mkdir(parents=True, exist_ok=True)

    try:
        with tarfile.open(archive, "r:gz") as tar:
            tar.extractall(path=temp_dir)

        manifest_file = temp_dir / "manifest.json"
        if manifest_file.exists():
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            logger.info(f"Restoring backup from {manifest.get('timestamp')} for {manifest.get('database')}")

        await init_db()
        client = get_db_client()
        db = client[settings.MONGODB_DB_NAME]

        restored_records = 0
        for json_file in temp_dir.glob("*.json"):
            if json_file.name == "manifest.json":
                continue
            coll_name = json_file.stem
            with open(json_file, "r", encoding="utf-8") as f:
                docs = json.load(f, object_hook=json_util.object_hook)

            if docs:
                collection = db[coll_name]
                # Upsert / insert documents
                for doc in docs:
                    doc_id = doc.get("_id")
                    if doc_id:
                        await collection.replace_one({"_id": doc_id}, doc, upsert=True)
                    else:
                        await collection.insert_one(doc)
                logger.info(f"Restored {len(docs)} documents into '{coll_name}'.")
                restored_records += len(docs)

        logger.info(f"Database restoration completed successfully: {restored_records} documents restored.")

    finally:
        if temp_dir.exists():
            for f in temp_dir.iterdir():
                f.unlink()
            temp_dir.rmdir()


def main():
    parser = argparse.ArgumentParser(description="Hirxora Database Backup & Restore Utility")
    parser.add_argument("--backup", action="store_true", help="Create a new full database backup")
    parser.add_argument("--list", action="store_true", help="List all available backups")
    parser.add_argument("--restore", type=str, help="Restore database from specified backup archive")
    parser.add_argument("--retention", type=int, default=7, help="Number of latest backups to retain (default: 7)")

    args = parser.parse_args()

    if args.list:
        list_backups()
    elif args.restore:
        asyncio.run(restore_backup(args.restore))
    else:
        # Default or explicit --backup
        asyncio.run(create_backup(retention_count=args.retention))


if __name__ == "__main__":
    main()

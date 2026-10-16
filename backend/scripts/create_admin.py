import asyncio
import sys
import os
import getpass

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import init_db
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.core.security import get_password_hash


async def create_or_update_admin(email: str, password: str):
    if not email or not password:
        raise ValueError("Admin email and password must not be empty.")

    if len(password) < 8:
        raise ValueError("Admin password must be at least 8 characters long.")

    print("Initializing DB connection...")
    await init_db()
    email_clean = email.lower().strip()

    user = await UserDocument.find_one(UserDocument.email == email_clean)
    hashed_pwd = get_password_hash(password)

    if user:
        user.hashed_password = hashed_pwd
        user.role = "admin"
        user.is_verified = True
        user.is_active = True
        user.update_timestamp()
        await user.save()
        print(f"[SUCCESS] Existing user '{email_clean}' updated to ADMIN role.")
    else:
        new_admin = UserDocument(
            email=email_clean,
            hashed_password=hashed_pwd,
            role="admin",
            is_active=True,
            is_verified=True,
        )
        await new_admin.insert()

        profile = ProfileDocument(
            user_id=new_admin.id,
            full_name="System Administrator",
            contact_email=email_clean,
        )
        await profile.insert()
        print(f"[SUCCESS] New ADMIN account created successfully for: {email_clean}")


if __name__ == "__main__":
    admin_email = os.getenv("INITIAL_ADMIN_EMAIL") or (sys.argv[1] if len(sys.argv) > 1 else None)
    admin_password = os.getenv("INITIAL_ADMIN_PASSWORD") or (sys.argv[2] if len(sys.argv) > 2 else None)

    if not admin_email:
        admin_email = input("Enter admin email: ").strip()

    if not admin_password:
        admin_password = getpass.getpass("Enter secure admin password: ").strip()

    asyncio.run(create_or_update_admin(admin_email, admin_password))

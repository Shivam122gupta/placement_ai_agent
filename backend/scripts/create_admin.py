import asyncio
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import init_db
from app.models.user import UserDocument
from app.models.profile import ProfileDocument
from app.core.security import get_password_hash


async def create_or_update_admin(email: str = "admin@placement.ai", password: str = "Admin@123456"):
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
        print(f"[SUCCESS] Existing user '{email_clean}' updated to ADMIN with password: '{password}'")
    else:
        new_admin = UserDocument(
            email=email_clean,
            hashed_password=hashed_pwd,
            role="admin",
            is_active=True,
            is_verified=True
        )
        await new_admin.insert()

        profile = ProfileDocument(
            user_id=new_admin.id,
            full_name="Super Admin",
            contact_email=email_clean
        )
        await profile.insert()
        print(f"[SUCCESS] New ADMIN account created successfully!")
        print(f"Email: {email_clean}")
        print(f"Password: {password}")

if __name__ == "__main__":
    email_input = sys.argv[1] if len(sys.argv) > 1 else "admin@placement.ai"
    password_input = sys.argv[2] if len(sys.argv) > 2 else "Admin@123456"
    asyncio.run(create_or_update_admin(email_input, password_input))

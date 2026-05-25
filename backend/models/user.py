import bcrypt
from pymongo import MongoClient
from config.settings import Config
from utils.helpers import generate_uuid, get_current_timestamp

client = MongoClient(Config.MONGODB_URL)
db = client.get_database()
users_collection = db.users

def hash_password(password):
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_user(name, email, password, role='MEMBER'):
    """Create a new user."""
    now = get_current_timestamp()
    user = {
        'uuid': generate_uuid(),
        'name': name,
        'email': email.lower().strip(),
        'password_hash': hash_password(password),
        'role': role,
        'is_active': True,
        'created_at': now,
        'updated_at': now
    }
    result = users_collection.insert_one(user)
    return get_user_by_uuid(user['uuid'])

def get_user_by_uuid(uuid):
    """Get user by UUID."""
    return users_collection.find_one({'uuid': uuid, 'is_active': True}, {'password_hash': 0})

def get_user_by_email(email):
    """Get user by email (includes password for login)."""
    return users_collection.find_one({'email': email.lower().strip(), 'is_active': True})

def get_user_by_email_with_password(email):
    """Get user by email including password hash."""
    return users_collection.find_one({'email': email.lower().strip(), 'is_active': True})

def get_all_users():
    """Get all active users."""
    return list(users_collection.find({'is_active': True}, {'password_hash': 0}))

def update_user(uuid, updates):
    """Update user fields."""
    updates['updated_at'] = get_current_timestamp()
    result = users_collection.update_one(
        {'uuid': uuid},
        {'$set': updates}
    )
    if result.modified_count:
        return get_user_by_uuid(uuid)
    return None

def deactivate_user(uuid):
    """Deactivate user (soft delete)."""
    return update_user(uuid, {'is_active': False})

def user_exists(email):
    """Check if user exists by email."""
    return users_collection.count_documents({'email': email.lower().strip()}) > 0

def check_initial_admin():
    """Check if admin exists, create if configured."""
    if Config.ADMIN_EMAIL and Config.ADMIN_NAME and Config.ADMIN_PASSWORD:
        existing = users_collection.find_one({'email': Config.ADMIN_EMAIL.lower().strip()})
        if not existing:
            create_user(
                name=Config.ADMIN_NAME,
                email=Config.ADMIN_EMAIL,
                password=Config.ADMIN_PASSWORD,
                role='ADMIN'
            )
            print(f"[INIT] Created initial admin user: {Config.ADMIN_EMAIL}")
            return True
    return False

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SESSION_SECRET', 'dev-secret-key')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))

    # MongoDB
    MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017/experiment_platform')

    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

    # SMTP
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_EMAIL = os.getenv('SMTP_EMAIL', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')

    # URLs
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

    # Session
    SESSION_LIFETIME = 86400  # 24 hours in seconds
    PERMANENT_SESSION_LIFETIME = 86400

    # Invitation
    INVITE_TOKEN_LIFETIME = 604800  # 7 days

    # Rate Limiting
    RATE_LIMIT_DEFAULT = 100  # requests per minute
    RATE_LIMIT_AUTH = 5       # requests per minute
    RATE_LIMIT_SENSITIVE = 10 # requests per minute

    # Admin setup
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', '')
    ADMIN_NAME = os.getenv('ADMIN_NAME', '')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '')

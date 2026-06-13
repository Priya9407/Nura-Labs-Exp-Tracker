import uuid
from datetime import datetime, timezone, timedelta
from dateutil import parser as date_parser
from bson import ObjectId

# India timezone (Asia/Kolkata) - UTC+5:30
INDIA_TZ = timezone(timedelta(hours=5, minutes=30))

def generate_uuid():
    """Generate a UUID v4 string."""
    return str(uuid.uuid4())

def get_current_timestamp():
    """Get current India timezone timestamp."""
    return datetime.now(INDIA_TZ)

def parse_date(date_str):
    """Parse date string to datetime object."""
    if not date_str:
        return None
    if isinstance(date_str, datetime):
        return date_str
    try:
        return date_parser.parse(date_str)
    except (ValueError, TypeError):
        return None

def format_date(dt):
    """Format datetime to ISO string."""
    if not dt:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()

def serialize_datetime(obj):
    """Helper for JSON serialization."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def get_phase_display(phase):
    """Get human-readable phase name."""
    phases = {
        'IDEA': 'Idea',
        'BUILDING': 'Building',
        'WAITING_FOR_TEST': 'Waiting for Test',
        'USER_TESTING': 'User Testing',
        'DECISION_PENDING': 'Decision Pending',
        'FINISHED': 'Finished'
    }
    return phases.get(phase, phase)

def get_status_display(status):
    """Get human-readable status name."""
    statuses = {
        'ACTIVE': 'Active',
        'COMPLETED': 'Completed',
        'ARCHIVED': 'Archived',
        'CANCELLED': 'Cancelled'
    }
    return statuses.get(status, status)

def get_decision_display(decision):
    """Get human-readable decision name."""
    decisions = {
        'ADD': 'Add',
        'DROP': 'Drop',
        'ITERATE': 'Iterate'
    }
    return decisions.get(decision, decision)

def calculate_day_number(start_date, current_date=None):
    """Calculate day number relative to phase start."""
    if not start_date:
        return 1
    if not current_date:
        current_date = get_current_timestamp()
    delta = current_date - start_date
    return max(1, delta.days + 1)

def sanitize_response(data):
    """Remove internal fields from response data and convert ObjectIds to strings."""
    if isinstance(data, dict):
        return {k: sanitize_response(v) for k, v in data.items()
                if k not in ['_id', 'password_hash', 'password']}
    elif isinstance(data, list):
        return [sanitize_response(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    elif isinstance(data, datetime):
        return data.isoformat()
    return data

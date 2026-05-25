import re
from email_validator import validate_email, EmailNotValidError

def validate_email_address(email):
    """Validate email format."""
    try:
        validate_email(email)
        return True, None
    except EmailNotValidError as e:
        return False, str(e)

def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    return True, None

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present."""
    missing = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing.append(field)
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None

def validate_role(role):
    """Validate user role."""
    valid_roles = ['ADMIN', 'MEMBER']
    if role not in valid_roles:
        return False, f"Invalid role. Must be one of: {', '.join(valid_roles)}"
    return True, None

def validate_experiment_phase(phase):
    """Validate experiment phase."""
    valid_phases = [
        'IDEA', 'BUILDING', 'WAITING_FOR_TEST',
        'USER_TESTING', 'DECISION_PENDING', 'FINISHED'
    ]
    if phase not in valid_phases:
        return False, f"Invalid phase. Must be one of: {', '.join(valid_phases)}"
    return True, None

def validate_experiment_status(status):
    """Validate experiment status."""
    valid_statuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED', 'CANCELLED']
    if status not in valid_statuses:
        return False, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    return True, None

def validate_decision(decision):
    """Validate final decision value."""
    valid_decisions = ['ADD', 'DROP', 'ITERATE']
    if decision not in valid_decisions:
        return False, f"Invalid decision. Must be one of: {', '.join(valid_decisions)}"
    return True, None

def validate_phase_for_extension(phase):
    """Validate phase that can be extended."""
    valid_phases = ['build', 'testing', 'decision']
    if phase not in valid_phases:
        return False, f"Invalid phase for extension. Must be one of: {', '.join(valid_phases)}"
    return True, None

def sanitize_string(value, max_length=None):
    """Sanitize string input."""
    if not isinstance(value, str):
        return None
    value = value.strip()
    if max_length and len(value) > max_length:
        value = value[:max_length]
    return value

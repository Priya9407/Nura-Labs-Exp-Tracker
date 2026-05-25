import secrets
from flask import Blueprint, request, jsonify
from middleware.auth import require_auth
from middleware.roles import require_admin
from middleware.rate_limit import rate_limit_auth
from services.redis_service import redis_service
from services.email import email_service
from models.user import (
    create_user,
    get_user_by_email,
    get_all_users,
    user_exists
)
from utils.validators import (
    validate_email_address,
    validate_password,
    validate_role
)

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/invite', methods=['POST'])
@require_auth
@require_admin
@rate_limit_auth
def invite_user():
    """Invite a new user by email."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    email = data.get('email', '').lower().strip()
    name = data.get('name', '').strip()
    role = data.get('role', 'MEMBER')

    # Validate required fields
    if not email or not name:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Email and name are required'
            }
        }), 400

    # Validate email
    valid, error = validate_email_address(email)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_EMAIL',
                'message': error
            }
        }), 400

    # Validate role
    valid, error = validate_role(role)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_ROLE',
                'message': error
            }
        }), 400

    # Check if user already exists
    if user_exists(email):
        return jsonify({
            'success': False,
            'error': {
                'code': 'USER_EXISTS',
                'message': 'User with this email already exists'
            }
        }), 409

    # Generate invitation token
    token = secrets.token_urlsafe(32)

    # Store in Redis
    invite_data = {
        'email': email,
        'name': name,
        'role': role
    }
    redis_service.create_invitation(token, invite_data)

    # Send invitation email
    email_sent = email_service.send_invitation(email, name, token)

    if not email_sent:
        # Delete invitation if email failed
        redis_service.delete_invitation(token)
        return jsonify({
            'success': False,
            'error': {
                'code': 'EMAIL_FAILED',
                'message': 'Failed to send invitation email'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'Invitation sent successfully',
        'data': {
            'email': email,
            'name': name,
            'role': role
        }
    })

@users_bp.route('/activate', methods=['POST'])
@rate_limit_auth
def activate_user():
    """Activate user account from invitation."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    token = data.get('token', '').strip()
    password = data.get('password', '')

    if not token or not password:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Token and password are required'
            }
        }), 400

    # Validate password
    valid, error = validate_password(password)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_PASSWORD',
                'message': error
            }
        }), 400

    # Get invitation from Redis
    invite_data = redis_service.get_invitation(token)
    if not invite_data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_TOKEN',
                'message': 'Invalid or expired invitation token'
            }
        }), 400

    # Check if user already exists (edge case)
    if user_exists(invite_data['email']):
        redis_service.delete_invitation(token)
        return jsonify({
            'success': False,
            'error': {
                'code': 'USER_EXISTS',
                'message': 'User already activated'
            }
        }), 409

    # Create user
    user = create_user(
        name=invite_data['name'],
        email=invite_data['email'],
        password=password,
        role=invite_data['role']
    )

    # Delete invitation
    redis_service.delete_invitation(token)

    return jsonify({
        'success': True,
        'message': 'Account activated successfully',
        'user': {
            'uuid': user['uuid'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    })

@users_bp.route('', methods=['GET'])
@require_auth
@require_admin
def list_users():
    """List all users."""
    users = get_all_users()

    return jsonify({
        'success': True,
        'users': [{
            'uuid': u['uuid'],
            'name': u['name'],
            'email': u['email'],
            'role': u['role'],
            'is_active': u.get('is_active', True),
            'created_at': u.get('created_at')
        } for u in users]
    })

@users_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user_info():
    """Get current user info."""
    from flask import g
    user = getattr(g, 'user', None)

    return jsonify({
        'success': True,
        'user': user
    })

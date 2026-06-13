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
    get_all_users_admin,
    user_exists,
    get_user_by_uuid,
    get_user_by_uuid_admin,
    deactivate_user,
    activate_user as activate_user_model
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

    # Generate temporary password
    temp_password = email_service.generate_temp_password()

    # Create user immediately with temp password
    try:
        user = create_user(
            name=name,
            email=email,
            password=temp_password,
            role=role
        )
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'USER_CREATION_FAILED',
                'message': f'Failed to create user: {str(e)}'
            }
        }), 500

    # Send invitation email with temp password
    email_sent = email_service.send_invitation(email, name, temp_password)

    if not email_sent:
        # Delete user if email failed
        from models.user import deactivate_user
        deactivate_user(user['uuid'])
        return jsonify({
            'success': False,
            'error': {
                'code': 'EMAIL_FAILED',
                'message': 'Failed to send invitation email'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'User created and invitation sent successfully',
        'data': {
            'email': email,
            'name': name,
            'role': role,
            'temp_password': temp_password
        }
    })

@users_bp.route('/activate', methods=['POST'])
@rate_limit_auth
def activate_user():
    """
    Activate user account from invitation.

    User verifies email via token and sets their own password.
    The temp password from email is a backup but not required for activation.
    """
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

    # Create user with chosen password
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
        'message': 'Account activated successfully. You can now log in with your password.',
        'user': {
            'uuid': user['uuid'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    })

@users_bp.route('', methods=['GET'])
@require_auth
def list_users():
    """List all users. Admin sees all including inactive, members see only active."""
    from flask import g
    current_user = getattr(g, 'user', {})
    is_admin = current_user.get('role') == 'ADMIN'

    if is_admin:
        users = get_all_users_admin()
    else:
        users = get_all_users()

    return jsonify({
        'success': True,
        'users': [{
            'uuid': u['uuid'],
            'name': u['name'],
            'email': u['email'],
            'role': u['role'],
            'is_active': u.get('is_active', True),
            'deactivated_at': u.get('deactivated_at'),
            'deactivation_reason': u.get('deactivation_reason'),
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

@users_bp.route('/me', methods=['PATCH'])
@require_auth
def update_current_user_info():
    """Update current user profile."""
    from flask import g
    user = getattr(g, 'user', None)

    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    name = data.get('name', '').strip()

    if not name:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Name is required'
            }
        }), 400

    # Update user in database
    from models.user import update_user
    updated_user = update_user(user['uuid'], {'name': name})

    if not updated_user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_FAILED',
                'message': 'Failed to update profile'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'Profile updated successfully',
        'user': {
            'uuid': updated_user['uuid'],
            'name': updated_user['name'],
            'email': updated_user['email'],
            'role': updated_user['role']
        }
    })

@users_bp.route('/<uuid>/deactivate', methods=['POST'])
@require_auth
@require_admin
def deactivate_user_endpoint(uuid):
    """Deactivate a user account (admin action)."""
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    # Check if user exists (including inactive for admin)
    user = get_user_by_uuid_admin(uuid)
    if not user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'USER_NOT_FOUND',
                'message': 'User not found'
            }
        }), 404

    # Cannot deactivate self
    from flask import g
    current_user = getattr(g, 'user', None)
    if current_user and current_user['uuid'] == uuid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CANNOT_DEACTIVATE_SELF',
                'message': 'You cannot deactivate your own account'
            }
        }), 400

    # Check if already deactivated
    if not user.get('is_active', True):
        return jsonify({
            'success': False,
            'error': {
                'code': 'ALREADY_DEACTIVATED',
                'message': 'User is already deactivated'
            }
        }), 400

    # Deactivate the user
    result = deactivate_user(uuid, reason)
    if not result:
        return jsonify({
            'success': False,
            'error': {
                'code': 'DEACTIVATE_FAILED',
                'message': 'Failed to deactivate user'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'User has been deactivated successfully',
        'user': {
            'uuid': result['uuid'],
            'name': result['name'],
            'email': result['email'],
            'is_active': False,
            'deactivated_at': result.get('deactivated_at'),
            'deactivation_reason': reason or None
        }
    })


@users_bp.route('/<uuid>/activate', methods=['POST'])
@require_auth
@require_admin
def activate_user_endpoint(uuid):
    """Activate/reactivate a user account (admin action)."""
    # Check if user exists (including inactive for admin)
    user = get_user_by_uuid_admin(uuid)
    if not user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'USER_NOT_FOUND',
                'message': 'User not found'
            }
        }), 404

    # Check if already active
    if user.get('is_active', True):
        return jsonify({
            'success': False,
            'error': {
                'code': 'ALREADY_ACTIVE',
                'message': 'User is already active'
            }
        }), 400

    # Activate the user
    result = activate_user_model(uuid)
    if not result:
        return jsonify({
            'success': False,
            'error': {
                'code': 'ACTIVATE_FAILED',
                'message': 'Failed to activate user'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'User has been activated successfully',
        'user': {
            'uuid': result['uuid'],
            'name': result['name'],
            'email': result['email'],
            'is_active': True,
            'activated_at': result.get('activated_at')
        }
    })

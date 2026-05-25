import secrets
from flask import Blueprint, request, jsonify, make_response
from middleware.auth import require_auth
from middleware.rate_limit import rate_limit_auth
from services.redis_service import redis_service
from services.email import email_service
from models.user import (
    get_user_by_email_with_password,
    verify_password,
    create_user,
    user_exists
)
from utils.validators import validate_email_address, validate_password
from utils.helpers import generate_uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
@rate_limit_auth
def login():
    """Login user and create session."""
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
    password = data.get('password', '')

    if not email or not password:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_CREDENTIALS',
                'message': 'Email and password required'
            }
        }), 400

    # Validate email format
    valid, error = validate_email_address(email)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_EMAIL',
                'message': error
            }
        }), 400

    # Get user
    user = get_user_by_email_with_password(email)
    if not user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'Invalid email or password'
            }
        }), 401

    # Verify password
    if not verify_password(password, user['password_hash']):
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'Invalid email or password'
            }
        }), 401

    # Create session
    session_id = secrets.token_urlsafe(32)
    user_data = {
        'uuid': user['uuid'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role']
    }

    redis_service.create_session(session_id, user_data)

    # Set cookie
    response = make_response(jsonify({
        'success': True,
        'user': user_data
    }))

    response.set_cookie(
        'session_id',
        session_id,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='Lax',
        max_age=86400  # 24 hours
    )

    return response

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user and destroy session."""
    from flask import g
    session_id = getattr(g, 'session_id', None)

    if session_id:
        redis_service.delete_session(session_id)

    response = make_response(jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }))

    response.delete_cookie('session_id')
    return response

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """Get current user info."""
    from flask import g
    user = getattr(g, 'user', None)

    return jsonify({
        'success': True,
        'user': user
    })

@auth_bp.route('/register', methods=['POST'])
@rate_limit_auth
def register():
    """Self-registration is disabled. Use invitation flow."""
    return jsonify({
        'success': False,
        'error': {
            'code': 'REGISTRATION_DISABLED',
            'message': 'Self-registration is disabled. Please contact an administrator for an invitation.'
        }
    }), 403

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

import secrets

@auth_bp.route('/csrf', methods=['GET'])
def get_csrf_token():
    """Generate and return a CSRF token."""
    token = secrets.token_urlsafe(32)
    response = make_response(jsonify({
        'success': True,
        'csrf_token': token
    }))
    # Set CSRF token in cookie (httponly=False so JS can read it if needed)
    response.set_cookie(
        'csrf_token',
        token,
        httponly=False,  # Allow JS to read for SPA
        secure=False,    # Set to True in production with HTTPS
        samesite='Lax'
    )
    return response


@auth_bp.route('/login', methods=['POST'])
@rate_limit_auth
def login():
    """Login user and create session."""
    print("Here")
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

    # Get user (including inactive for checking deactivated status)
    from models.user import users_collection
    user = users_collection.find_one({'email': email.lower().strip()})
    if not user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'Invalid email or password'
            }
        }), 401

    # Check if user is deactivated
    if not user.get('is_active', True):
        return jsonify({
            'success': False,
            'error': {
                'code': 'ACCOUNT_DEACTIVATED',
                'message': 'Your account has been deactivated. Please contact an administrator.'
            }
        }), 403

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


@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit_auth
def forgot_password():
    """Send new temporary password to user's email."""
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

    if not email:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Email is required'
            }
        }), 400

    # Check if user exists
    from models.user import get_user_by_email, update_user, hash_password
    user = get_user_by_email(email)

    if not user:
        # Return success even if user doesn't exist (security)
        return jsonify({
            'success': True,
            'message': 'The email has not been registered. Try contacting an administrator if you need access.'
        })

    # Generate new temporary password
    new_temp_password = email_service.generate_temp_password()

    # Update user's password
    updated_user = update_user(user['uuid'], {'password_hash': hash_password(new_temp_password)})

    if not updated_user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_FAILED',
                'message': 'Failed to update password'
            }
        }), 500

    # Send email with new password
    email_sent = email_service.send_password_reset(email, user['name'], new_temp_password)

    if not email_sent:
        return jsonify({
            'success': False,
            'error': {
                'code': 'EMAIL_FAILED',
                'message': 'Failed to send password email'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'A new password has been sent to your email.'
    })


@auth_bp.route('/change-password', methods=['POST'])
@require_auth
def change_password():
    """Change user password (requires current password)."""
    from flask import g

    user = getattr(g, 'user', None)
    if not user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UNAUTHORIZED',
                'message': 'Not authenticated'
            }
        }), 401

    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_password or not new_password:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Current password and new password are required'
            }
        }), 400

    # Validate new password
    valid, error = validate_password(new_password)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_PASSWORD',
                'message': error
            }
        }), 400

    # Get user with password
    user_with_password = get_user_by_email_with_password(user['email'])
    if not user_with_password:
        return jsonify({
            'success': False,
            'error': {
                'code': 'USER_NOT_FOUND',
                'message': 'User not found'
            }
        }), 404

    # Verify current password
    if not verify_password(current_password, user_with_password['password_hash']):
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_CURRENT_PASSWORD',
                'message': 'Current password is incorrect'
            }
        }), 401

    # Update password
    from models.user import update_user, hash_password
    updated_user = update_user(user['uuid'], {'password_hash': hash_password(new_password)})

    if not updated_user:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_FAILED',
                'message': 'Failed to update password'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'Password changed successfully'
    })

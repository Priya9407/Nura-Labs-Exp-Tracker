from functools import wraps
from flask import request, jsonify, g
from services.redis_service import redis_service

def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get session ID from cookie
        session_id = request.cookies.get('session_id')

        if not session_id:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': 'Authentication required'
                }
            }), 401

        # Validate session from Redis
        user_data = redis_service.get_session(session_id)

        if not user_data:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'SESSION_EXPIRED',
                    'message': 'Session expired. Please log in again.'
                }
            }), 401

        # Extend session on activity
        redis_service.extend_session(session_id)

        # Attach user to request context
        g.user = user_data
        g.session_id = session_id

        return f(*args, **kwargs)

    return decorated_function

def get_current_user():
    """Get current authenticated user from request context."""
    return getattr(g, 'user', None)

def is_authenticated():
    """Check if current request is authenticated."""
    return get_current_user() is not None

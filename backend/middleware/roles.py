from functools import wraps
from flask import jsonify, g

def require_role(role):
    """Decorator factory to require specific role."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = getattr(g, 'user', None)

            if not user:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'UNAUTHORIZED',
                        'message': 'Authentication required'
                    }
                }), 401

            if user.get('role') != role:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'FORBIDDEN',
                        'message': f'{role} role required'
                    }
                }), 403

            return f(*args, **kwargs)

        return decorated_function
    return decorator

require_admin = require_role('ADMIN')

def require_owner_or_admin(f):
    """Decorator to require experiment owner or admin."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from models.experiment import get_experiment_by_uuid

        user = getattr(g, 'user', None)
        if not user:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': 'Authentication required'
                }
            }), 401

        # Get experiment UUID from kwargs
        exp_uuid = kwargs.get('uuid') or kwargs.get('exp_uuid')
        if not exp_uuid:
            # Try to get from request JSON
            from flask import request
            data = request.get_json() or {}
            exp_uuid = data.get('uuid') or data.get('experiment_uuid')

        if exp_uuid:
            experiment = get_experiment_by_uuid(exp_uuid)
            if experiment:
                is_owner = experiment.get('owner') == user.get('uuid')
                is_admin = user.get('role') == 'ADMIN'

                if not (is_owner or is_admin):
                    return jsonify({
                        'success': False,
                        'error': {
                            'code': 'FORBIDDEN',
                            'message': 'Only experiment owner or admin can perform this action'
                        }
                    }), 403

        return f(*args, **kwargs)

    return decorated_function

def check_ownership(experiment, user):
    """Check if user owns the experiment or is admin."""
    if not user or not experiment:
        return False
    is_owner = experiment.get('owner') == user.get('uuid')
    is_admin = user.get('role') == 'ADMIN'
    return is_owner or is_admin

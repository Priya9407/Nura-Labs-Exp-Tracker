from functools import wraps
from flask import request, jsonify
from services.redis_service import redis_service
from config.settings import Config

class RateLimiter:
    def __init__(self):
        self.limits = {
            'auth': {'max': Config.RATE_LIMIT_AUTH, 'window': 60},
            'sensitive': {'max': Config.RATE_LIMIT_SENSITIVE, 'window': 60},
            'default': {'max': Config.RATE_LIMIT_DEFAULT, 'window': 60}
        }

    def _get_client_ip(self):
        """Get client IP address."""
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        return request.remote_addr or 'unknown'

    def _make_key(self, route_type, identifier):
        """Create rate limit key."""
        return f"{route_type}:{identifier}"

    def check_limit(self, route_type='default', custom_key=None):
        """Check rate limit for current request."""
        config = self.limits.get(route_type, self.limits['default'])
        identifier = custom_key or self._get_client_ip()
        key = self._make_key(route_type, identifier)

        allowed, remaining = redis_service.check_rate_limit(
            key,
            config['max'],
            config['window']
        )

        return {
            'allowed': allowed,
            'remaining': remaining,
            'limit': config['max'],
            'window': config['window']
        }

def rate_limit(route_type='default'):
    """Decorator to apply rate limiting."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            limiter = RateLimiter()
            result = limiter.check_limit(route_type)

            if not result['allowed']:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'RATE_LIMIT_EXCEEDED',
                        'message': f'Rate limit exceeded. Try again in {result["remaining"]} seconds.'
                    }
                }), 429

            response = f(*args, **kwargs)

            # Add rate limit headers if it's a tuple (response, status)
            if isinstance(response, tuple):
                resp = response[0]
                if hasattr(resp, 'headers'):
                    resp.headers['X-RateLimit-Limit'] = str(result['limit'])
                    resp.headers['X-RateLimit-Remaining'] = str(result['remaining'])
            elif hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(result['limit'])
                response.headers['X-RateLimit-Remaining'] = str(result['remaining'])

            return response

        return decorated_function
    return decorator

# Pre-configured rate limit decorators
rate_limit_auth = rate_limit('auth')
rate_limit_sensitive = rate_limit('sensitive')
rate_limit_default = rate_limit('default')

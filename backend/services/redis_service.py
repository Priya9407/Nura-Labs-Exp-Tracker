import json
import redis
from datetime import datetime
from config.settings import Config

class RedisService:
    def __init__(self):
        self.client = redis.from_url(Config.REDIS_URL, decode_responses=True)

    def _serialize(self, data):
        """Serialize data for Redis storage."""
        if isinstance(data, dict):
            return json.dumps(data, default=lambda x: x.isoformat() if isinstance(x, datetime) else str(x))
        return data

    def _deserialize(self, data):
        """Deserialize data from Redis."""
        if not data:
            return None
        try:
            return json.loads(data)
        except json.JSONDecodeError:
            return data

    # Session Management
    def create_session(self, session_id, user_data, ttl=Config.SESSION_LIFETIME):
        """Create a new session."""
        key = f"session:{session_id}"
        self.client.setex(key, ttl, self._serialize(user_data))
        return True

    def get_session(self, session_id):
        """Get session data."""
        key = f"session:{session_id}"
        data = self.client.get(key)
        return self._deserialize(data)

    def delete_session(self, session_id):
        """Delete a session."""
        key = f"session:{session_id}"
        self.client.delete(key)
        return True

    def extend_session(self, session_id, ttl=Config.SESSION_LIFETIME):
        """Extend session TTL."""
        key = f"session:{session_id}"
        self.client.expire(key, ttl)
        return True

    # Invitation Management
    def create_invitation(self, token, invite_data, ttl=Config.INVITE_TOKEN_LIFETIME):
        """Create an invitation token."""
        key = f"invite:{token}"
        self.client.setex(key, ttl, self._serialize(invite_data))
        return True

    def get_invitation(self, token):
        """Get invitation data."""
        key = f"invite:{token}"
        data = self.client.get(key)
        return self._deserialize(data)

    def delete_invitation(self, token):
        """Delete an invitation."""
        key = f"invite:{token}"
        self.client.delete(key)
        return True

    # Rate Limiting
    def check_rate_limit(self, key, max_requests, window_seconds):
        """Check and update rate limit."""
        full_key = f"rate_limit:{key}"
        current = self.client.get(full_key)

        if current is None:
            # First request in window
            pipe = self.client.pipeline()
            pipe.setex(full_key, window_seconds, 1)
            pipe.execute()
            return True, max_requests - 1

        current = int(current)
        if current >= max_requests:
            ttl = self.client.ttl(full_key)
            return False, ttl

        # Increment counter
        self.client.incr(full_key)
        return True, max_requests - current - 1

    def get_remaining_requests(self, key):
        """Get remaining requests for rate limit."""
        full_key = f"rate_limit:{key}"
        current = self.client.get(full_key)
        if current is None:
            return None
        return int(current)

    # Temporary data storage
    def set_temp(self, key, data, ttl=3600):
        """Set temporary data with TTL."""
        full_key = f"temp:{key}"
        self.client.setex(full_key, ttl, self._serialize(data))
        return True

    def get_temp(self, key):
        """Get temporary data."""
        full_key = f"temp:{key}"
        data = self.client.get(full_key)
        return self._deserialize(data)

    def delete_temp(self, key):
        """Delete temporary data."""
        full_key = f"temp:{key}"
        self.client.delete(full_key)
        return True

# Singleton instance
redis_service = RedisService()

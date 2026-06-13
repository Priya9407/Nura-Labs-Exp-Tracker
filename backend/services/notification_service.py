"""
Notification Service Architecture

Provides foundation for future notification features.
Supports:
- Overdue observations
- Overdue builds
- Testing starting tomorrow
- Pending decisions
- Extension approvals
- Paused experiments

Architecture is designed to support multiple channels:
- Email
- In-app
- Push (future)
- Webhooks (future)

All timestamps in UTC.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from enum import Enum
from pymongo import MongoClient
from config.settings import Config
from utils.helpers import generate_uuid

client = MongoClient(Config.MONGODB_URL)
db = client.get_database()
notifications_collection = db.notifications


class NotificationType(Enum):
    """Types of notifications that can be triggered."""
    OVERDUE_OBSERVATION = "OVERDUE_OBSERVATION"
    OVERDUE_BUILD = "OVERDUE_BUILD"
    TESTING_STARTING_TOMORROW = "TESTING_STARTING_TOMORROW"
    DECISION_PENDING = "DECISION_PENDING"
    EXTENSION_APPROVED = "EXTENSION_APPROVED"
    EXPERIMENT_PAUSED = "EXPERIMENT_PAUSED"
    EXPERIMENT_RESUMED = "EXPERIMENT_RESUMED"
    ITERATION_COMPLETED = "ITERATION_COMPLETED"


class NotificationChannel(Enum):
    """Notification delivery channels."""
    EMAIL = "EMAIL"
    IN_APP = "IN_APP"
    PUSH = "PUSH"
    WEBHOOK = "WEBHOOK"


class NotificationStatus(Enum):
    """Notification delivery status."""
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    READ = "READ"


class NotificationService:
    """
    Notification service with prepared architecture.

    Even if not fully implemented, the structure supports:
    - Creating notification records
    - Queuing for delivery
    - Tracking delivery status
    - User preferences
    """

    def __init__(self):
        self._handlers = {
            NotificationChannel.EMAIL: self._send_email,
            NotificationChannel.IN_APP: self._create_in_app,
        }

    # =====================================================================
    # Core API - Routes/Controllers call these
    # =====================================================================

    def notify_observation_overdue(
        self,
        experiment_uuid: str,
        iteration_no: int,
        day_number: int,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Notify that an observation is overdue.
        Called by observation status checker.
        """
        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.OVERDUE_OBSERVATION,
            title="Observation Overdue",
            body=f"Day {day_number} observation is overdue. Please submit it soon.",
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'day_number': day_number
            },
            channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        )

    def notify_build_overdue(
        self,
        experiment_uuid: str,
        iteration_no: int,
        days_overdue: int,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Notify that build is overdue.
        """
        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.OVERDUE_BUILD,
            title="Build Overdue",
            body=f"Build phase is {days_overdue} day(s) overdue. Please complete or extend.",
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'days_overdue': days_overdue
            },
            channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        )

    def notify_testing_starting(
        self,
        experiment_uuid: str,
        iteration_no: int,
        start_date: datetime,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Notify that testing starts tomorrow.
        """
        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.TESTING_STARTING_TOMORROW,
            title="Testing Starts Tomorrow",
            body=f"User testing for your experiment starts tomorrow ({start_date.strftime('%Y-%m-%d')}).",
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'start_date': start_date.isoformat()
            },
            channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        )

    def notify_decision_pending(
        self,
        experiment_uuid: str,
        iteration_no: int,
        deadline: datetime,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Notify that decision is pending.
        """
        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.DECISION_PENDING,
            title="Decision Required",
            body=f"Testing is complete. Please submit your ADD/DROP/ITERATE decision by {deadline.strftime('%Y-%m-%d')}.",
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'deadline': deadline.isoformat()
            },
            channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        )

    def notify_extension_approved(
        self,
        experiment_uuid: str,
        iteration_no: int,
        phase: str,
        new_deadline: datetime,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Confirm extension was approved.
        """
        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.EXTENSION_APPROVED,
            title="Extension Approved",
            body=f"{phase.title()} phase extended to {new_deadline.strftime('%Y-%m-%d')}.",
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'phase': phase,
                'new_deadline': new_deadline.isoformat()
            },
            channels=[NotificationChannel.IN_APP]
        )

    def notify_experiment_paused(
        self,
        experiment_uuid: str,
        iteration_no: int,
        reason: str,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Notify that experiment was paused.
        """
        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.EXPERIMENT_PAUSED,
            title="Experiment Paused",
            body=f"Your experiment has been paused: {reason[:100]}",
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'reason': reason
            },
            channels=[NotificationChannel.IN_APP]
        )

    def notify_iteration_completed(
        self,
        experiment_uuid: str,
        iteration_no: int,
        decision: str,
        user_uuid: str
    ) -> Optional[Dict[str, Any]]:
        """
        Notify that iteration completed with decision.
        """
        messages = {
            'ADD': 'Iteration completed successfully. Feature approved!',
            'DROP': 'Iteration completed. Feature was dropped.',
            'ITERATE': f'New iteration {iteration_no + 1} created. Previous learnings preserved.'
        }

        return self._create_notification(
            user_uuid=user_uuid,
            type=NotificationType.ITERATION_COMPLETED,
            title="Iteration Complete",
            body=messages.get(decision, "Iteration completed."),
            data={
                'experiment_uuid': experiment_uuid,
                'iteration_no': iteration_no,
                'decision': decision
            },
            channels=[NotificationChannel.IN_APP]
        )

    # =====================================================================
    # User Notification Management
    # =====================================================================

    def get_user_notifications(
        self,
        user_uuid: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user."""
        query = {'user_uuid': user_uuid}
        if unread_only:
            query['status'] = {'$in': [NotificationStatus.PENDING.value, NotificationStatus.SENT.value]}

        notifications = list(
            notifications_collection
            .find(query)
            .sort('created_at', -1)
            .limit(limit)
        )

        return notifications

    def mark_as_read(self, notification_uuid: str) -> bool:
        """Mark notification as read."""
        result = notifications_collection.update_one(
            {'uuid': notification_uuid},
            {
                '$set': {
                    'status': NotificationStatus.READ.value,
                    'read_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return result.modified_count > 0

    def mark_all_as_read(self, user_uuid: str) -> int:
        """Mark all user notifications as read."""
        result = notifications_collection.update_many(
            {
                'user_uuid': user_uuid,
                'status': {'$ne': NotificationStatus.READ.value}
            },
            {
                '$set': {
                    'status': NotificationStatus.READ.value,
                    'read_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        return result.modified_count

    def get_unread_count(self, user_uuid: str) -> int:
        """Get count of unread notifications."""
        return notifications_collection.count_documents({
            'user_uuid': user_uuid,
            'status': {'$in': [NotificationStatus.PENDING.value, NotificationStatus.SENT.value]}
        })

    # =====================================================================
    # Internal Implementation
    # =====================================================================

    def _create_notification(
        self,
        user_uuid: str,
        type: NotificationType,
        title: str,
        body: str,
        data: Dict[str, Any],
        channels: List[NotificationChannel]
    ) -> Dict[str, Any]:
        """Create notification record and queue for delivery."""
        notification = {
            'uuid': generate_uuid(),
            'user_uuid': user_uuid,
            'type': type.value,
            'title': title,
            'body': body,
            'data': data,
            'channels': [c.value for c in channels],
            'status': NotificationStatus.PENDING.value,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'sent_at': None,
            'delivered_at': None,
            'read_at': None,
            'delivery_attempts': []
        }

        # Store in database
        notifications_collection.insert_one(notification)

        # Queue for immediate delivery (async in production)
        self._queue_for_delivery(notification)

        return notification

    def _queue_for_delivery(self, notification: Dict[str, Any]):
        """
        Queue notification for delivery.
        In production, this would enqueue to a job queue (Celery, RQ, etc.)
        For now, we process synchronously.
        """
        for channel_value in notification['channels']:
            channel = NotificationChannel(channel_value)
            handler = self._handlers.get(channel)
            if handler:
                try:
                    handler(notification)
                except Exception as e:
                    # Log error but don't fail
                    self._record_delivery_attempt(notification['uuid'], channel, False, str(e))

    def _send_email(self, notification: Dict[str, Any]):
        """Send email notification."""
        # TODO: Implement email sending
        # For now, just mark as sent
        self._record_delivery_attempt(notification['uuid'], NotificationChannel.EMAIL, True, None)

    def _create_in_app(self, notification: Dict[str, Any]):
        """Create in-app notification (already stored, just mark status)."""
        notifications_collection.update_one(
            {'uuid': notification['uuid']},
            {
                '$set': {
                    'status': NotificationStatus.SENT.value,
                    'sent_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        self._record_delivery_attempt(notification['uuid'], NotificationChannel.IN_APP, True, None)

    def _record_delivery_attempt(
        self,
        notification_uuid: str,
        channel: NotificationChannel,
        success: bool,
        error: Optional[str]
    ):
        """Record a delivery attempt."""
        attempt = {
            'channel': channel.value,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'success': success,
            'error': error
        }

        notifications_collection.update_one(
            {'uuid': notification_uuid},
            {'$push': {'delivery_attempts': attempt}}
        )

    # =====================================================================
    # Notification Checker (called by scheduled job)
    # =====================================================================

    def check_overdue_items(self):
        """
        Check for overdue observations and builds.
        Should be called by a scheduled job (cron).
        """
        from services.lifecycle_engine import lifecycle_engine
        from models.experiment import get_active_experiments, get_current_iteration

        now = datetime.now(timezone.utc)
        notifications_created = 0

        # Get all active experiments
        experiments = get_active_experiments()

        for exp in experiments:
            iteration = get_current_iteration(exp['uuid'])
            if not iteration:
                continue

            timeline = iteration.get('timeline', {})
            if not timeline:
                continue

            # Check for overdue build
            build = timeline.get('build', {})
            if build and not build.get('is_completed'):
                build_status = lifecycle_engine.get_build_status(timeline)
                if build_status.get('status') == 'OVERDUE':
                    # Check if already notified recently
                    if not self._recently_notified(
                        exp['uuid'], iteration['iteration_no'],
                        NotificationType.OVERDUE_BUILD
                    ):
                        self.notify_build_overdue(
                            exp['uuid'],
                            iteration['iteration_no'],
                            build_status.get('days_overdue', 1),
                            exp['owner']
                        )
                        notifications_created += 1

            # Check for overdue observations
            testing = timeline.get('testing', {})
            if testing and not testing.get('is_completed'):
                obs_status = lifecycle_engine.get_observation_status(
                    timeline, iteration.get('observations', [])
                )
                if obs_status.get('overdue_count', 0) > 0:
                    # Notify for each overdue day (once per day)
                    overdue_days = [
                        day for day in obs_status.get('days', [])
                        if day.get('is_overdue')
                    ]
                    for day in overdue_days:
                        if not self._recently_notified(
                            exp['uuid'], iteration['iteration_no'],
                            NotificationType.OVERDUE_OBSERVATION,
                            day.get('day_number')
                        ):
                            self.notify_observation_overdue(
                                exp['uuid'],
                                iteration['iteration_no'],
                                day['day_number'],
                                exp['owner']
                            )
                            notifications_created += 1

        return notifications_created

    def _recently_notified(
        self,
        experiment_uuid: str,
        iteration_no: int,
        notification_type: NotificationType,
        day_number: int = None
    ) -> bool:
        """Check if notification was sent in the last 24 hours."""
        yesterday = datetime.now(timezone.utc) - timedelta(hours=24)

        query = {
            'data.experiment_uuid': experiment_uuid,
            'data.iteration_no': iteration_no,
            'type': notification_type.value,
            'created_at': {'$gte': yesterday.isoformat()}
        }

        if day_number is not None:
            query['data.day_number'] = day_number

        return notifications_collection.count_documents(query) > 0


# Singleton
notification_service = NotificationService()

"""
Activity Log Service - Centralized Audit Trail

Tracks all significant events for:
- Audit trail
- Operational debugging
- Accountability
- History tracking

Activity Types:
- experiment_created
- phase_changed (build_started, build_completed, testing_started, testing_completed)
- extension_requested
- observation_submitted
- observation_edited
- decision_submitted (ADD, DROP, ITERATE)
- iteration_created
- experiment_cancelled
- experiment_paused
- experiment_resumed
- timeline_repaired (admin)
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from pymongo import MongoClient
from config.settings import Config
from utils.helpers import generate_uuid, INDIA_TZ

client = MongoClient(Config.MONGODB_URL)
db = client.get_database()
activity_logs_collection = db.activity_logs


class ActivityLogService:
    """Service for logging experiment activities."""

    def log_activity(
        self,
        experiment_uuid: str,
        activity_type: str,
        details: Dict[str, Any],
        user_uuid: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Log an activity.

        Args:
            experiment_uuid: UUID of the experiment
            activity_type: Type of activity (see module docstring)
            details: Activity-specific details
            user_uuid: UUID of user who performed the action
        """
        activity = {
            'uuid': generate_uuid(),
            'experiment_uuid': experiment_uuid,
            'activity_type': activity_type,
            'details': details,
            'user_uuid': user_uuid,
            'created_at': datetime.now(INDIA_TZ).isoformat()
        }

        activity_logs_collection.insert_one(activity)
        return activity

    def get_activities(
        self,
        experiment_uuid: Optional[str] = None,
        activity_types: Optional[List[str]] = None,
        iteration_no: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get activities with optional filters."""
        query = {}
        if experiment_uuid:
            query['experiment_uuid'] = experiment_uuid
        if activity_types:
            query['activity_type'] = {'$in': activity_types}
        if iteration_no:
            query['iteration_no'] = iteration_no

        activities = list(
            activity_logs_collection
            .find(query)
            .sort('created_at', -1)
            .limit(limit)
        )

        return activities

    def get_activity_timeline(
        self,
        experiment_uuid: str,
        iteration_no: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get chronological activity timeline for an experiment.
        Groups by iteration if iteration_no not specified.
        """
        query = {'experiment_uuid': experiment_uuid}
        if iteration_no:
            query['iteration_no'] = iteration_no

        activities = list(
            activity_logs_collection
            .find(query)
            .sort('created_at', 1)
        )

        return activities

    def get_recent_activities(
        self,
        limit: int = 50,
        hours: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get recent activities across all experiments.
        Useful for admin dashboards.
        """
        query = {}
        if hours:
            from datetime import timedelta
            since = datetime.now(INDIA_TZ) - timedelta(hours=hours)
            query['created_at'] = {'$gte': since.isoformat()}

        activities = list(
            activity_logs_collection
            .find(query)
            .sort('created_at', -1)
            .limit(limit)
        )

        return activities


# Singleton
activity_log_service = ActivityLogService()

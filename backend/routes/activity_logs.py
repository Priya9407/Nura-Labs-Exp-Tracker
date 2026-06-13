"""
Activity Logs Routes - Audit trail API

Provides endpoints for viewing experiment activity history.
"""
from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import check_ownership
from services.activity_log_service import activity_log_service
from models.experiment import get_experiment_by_uuid
from utils.helpers import sanitize_response

activity_logs_bp = Blueprint('activity_logs', __name__, url_prefix='/api')


@activity_logs_bp.route('/experiments/<uuid>/activities', methods=['GET'])
@require_auth
def get_experiment_activities(uuid):
    """Get activity log for an experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Experiment not found'}
        }), 404

    user = getattr(g, 'user', {})

    # Check permissions (owner or admin)
    if not check_ownership(experiment, user) and user.get('role') != 'ADMIN':
        return jsonify({
            'success': False,
            'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}
        }), 403

    # Get optional filters
    iteration_no = request.args.get('iteration', type=int)
    limit = request.args.get('limit', 100, type=int)

    activities = activity_log_service.get_activities(
        experiment_uuid=uuid,
        iteration_no=iteration_no,
        limit=limit
    )

    # Batch fetch all unique user_uuids to avoid N+1 queries
    from models.user import get_user_by_uuid
    user_uuids = list(set(a.get('user_uuid') for a in activities if a.get('user_uuid')))
    user_cache = {}
    for uid in user_uuids:
        user = get_user_by_uuid(uid)
        user_cache[uid] = user['name'] if user else 'Unknown'

    # Enrich activities
    enriched_activities = []
    for activity in activities:
        user_uuid_act = activity.get('user_uuid')
        user_name = user_cache.get(user_uuid_act, 'Unknown') if user_uuid_act else 'System'

        enriched = activity.copy()
        enriched['user_name'] = user_name
        enriched['experiment_title'] = experiment.get('title', 'Unknown')
        enriched_activities.append(enriched)

    return jsonify({
        'success': True,
        'experiment_uuid': uuid,
        'activities': sanitize_response(enriched_activities)
    })


@activity_logs_bp.route('/experiments/<uuid>/activities/timeline', methods=['GET'])
@require_auth
def get_experiment_activity_timeline(uuid):
    """Get chronological activity timeline for an experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Experiment not found'}
        }), 404

    user = getattr(g, 'user', {})
    user_uuid = user.get('uuid')

    # Check permissions
    if not check_ownership(experiment, user) and user.get('role') != 'ADMIN':
        return jsonify({
            'success': False,
            'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}
        }), 403

    iteration_no = request.args.get('iteration', type=int)

    activities = activity_log_service.get_activity_timeline(uuid, iteration_no)

    return jsonify({
        'success': True,
        'experiment_uuid': uuid,
        'iteration_filter': iteration_no,
        'activities': sanitize_response(activities)
    })


@activity_logs_bp.route('/activities/recent', methods=['GET'])
@require_auth
def get_recent_activities():
    """Get recent activities for current user."""
    user = getattr(g, 'user', {})
    user_uuid = user.get('uuid')
    is_admin = user.get('role') == 'ADMIN'

    limit = request.args.get('limit', 50, type=int)
    hours = request.args.get('hours', type=int)

    activities = activity_log_service.get_recent_activities(limit=limit, hours=hours)

    # Batch fetch all unique users and experiments to avoid N+1 queries
    from models.experiment import get_experiment_by_uuid
    from models.user import get_user_by_uuid

    user_uuids = list(set(a.get('user_uuid') for a in activities if a.get('user_uuid')))
    exp_uuids = list(set(a.get('experiment_uuid') for a in activities if a.get('experiment_uuid')))

    user_cache = {uid: get_user_by_uuid(uid) for uid in user_uuids}
    exp_cache = {eid: get_experiment_by_uuid(eid) for eid in exp_uuids}

    enriched_activities = []
    for activity in activities:
        user_uuid_act = activity.get('user_uuid')
        user_name = user_cache.get(user_uuid_act, {}).get('name', 'Unknown') if user_uuid_act else 'System'

        exp_uuid = activity.get('experiment_uuid')
        exp_title = exp_cache.get(exp_uuid, {}).get('title', 'Unknown') if exp_uuid else 'Unknown'

        enriched = activity.copy()
        enriched['user_name'] = user_name
        enriched['experiment_title'] = exp_title
        enriched_activities.append(enriched)

    return jsonify({
        'success': True,
        'activities': sanitize_response(enriched_activities)
    })


@activity_logs_bp.route('/experiments/<uuid>/iterations/<int:iteration_no>/activities', methods=['GET'])
@require_auth
def get_iteration_activities(uuid, iteration_no):
    """Get activities for a specific iteration."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Experiment not found'}
        }), 404

    user = getattr(g, 'user', {})

    # Check permissions (owner or admin)
    if not check_ownership(experiment, user) and user.get('role') != 'ADMIN':
        return jsonify({
            'success': False,
            'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}
        }), 403

    activities = activity_log_service.get_activities(
        experiment_uuid=uuid,
        iteration_no=iteration_no
    )

    # Enrich with user names
    from models.user import get_user_by_uuid
    user_uuids = list(set(a.get('user_uuid') for a in activities if a.get('user_uuid')))
    user_cache = {uid: get_user_by_uuid(uid) for uid in user_uuids}

    enriched_activities = []
    for activity in activities:
        user_uuid_act = activity.get('user_uuid')
        user_name = user_cache.get(user_uuid_act, {}).get('name', 'Unknown') if user_uuid_act else 'System'

        enriched = activity.copy()
        enriched['user_name'] = user_name
        enriched['experiment_title'] = experiment.get('title', 'Unknown')
        enriched_activities.append(enriched)

    return jsonify({
        'success': True,
        'experiment_uuid': uuid,
        'iteration_no': iteration_no,
        'activities': sanitize_response(enriched_activities)
    })

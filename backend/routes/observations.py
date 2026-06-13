"""
Observations Routes - Day-based tracking system.

Observations are stored inline in the experiment document.
"""
from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import check_ownership
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    get_experiment_by_uuid,
    submit_observation
)
from utils.helpers import sanitize_response

observations_bp = Blueprint('observations', __name__, url_prefix='/api/experiments')


@observations_bp.route('/<uuid>/observations', methods=['GET'])
@require_auth
def get_observations(uuid):
    """Get all observations for an experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Experiment not found'}
        }), 404

    observations = experiment.get('observations', [])

    return jsonify({
        'success': True,
        'observations': observations
    })


@observations_bp.route('/<uuid>/observations/schedule', methods=['GET'])
@require_auth
def get_observation_schedule(uuid):
    """
    Get observation schedule for experiment.

    Schedule is computed dynamically from timeline.testing data.
    """
    from datetime import datetime, timedelta
    from utils.helpers import INDIA_TZ

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Experiment not found'}
        }), 404

    timeline = experiment.get('timeline', {})
    testing = timeline.get('testing')

    if not testing or not testing.get('actual_start'):
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_IN_TESTING', 'message': 'Testing not started yet'}
        }), 400

    # Parse dates
    try:
        start_date = datetime.fromisoformat(testing['actual_start'])
        duration_days = testing.get('duration_days', 4)
    except:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_TIMELINE', 'message': 'Invalid timeline data'}
        }), 400

    # Get submitted observations
    observations = experiment.get('observations', [])
    submitted_days = {obs.get('day_number'): obs for obs in observations}

    # Build schedule dynamically
    now = datetime.now(INDIA_TZ)
    schedule = []

    for day_num in range(1, duration_days + 1):
        day_date = start_date + timedelta(days=day_num - 1)
        is_submitted = day_num in submitted_days
        is_past = day_date.date() < now.date()
        is_today = day_date.date() == now.date()

        # Determine status
        if is_submitted:
            status = 'completed'
        elif is_today:
            status = 'current'
        elif is_past:
            status = 'overdue'
        else:
            status = 'locked'

        schedule.append({
            'day_number': day_num,
            'date': day_date.isoformat(),
            'status': status,
            'is_submitted': is_submitted,
            'can_submit': status in ['current', 'overdue']
        })

    # Calculate current day
    days_elapsed = (now - start_date).days + 1
    current_day = min(max(days_elapsed, 1), duration_days)

    return jsonify({
        'success': True,
        'current_phase': experiment.get('current_phase'),
        'current_day': current_day,
        'duration_days': duration_days,
        'schedule': schedule
    })

"""
Experiments Routes - Simplified Single Collection Design.

Each experiment is complete. ITERATE creates new experiment with links.
"""
from flask import Blueprint, request, jsonify, g
from datetime import datetime, timezone
from utils.helpers import INDIA_TZ
from middleware.auth import require_auth
from middleware.roles import check_ownership, require_admin
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    create_experiment,
    create_raw_idea,
    take_raw_idea,
    list_raw_ideas,
    get_experiment_by_uuid,
    get_experiment_with_context,
    get_experiments_by_root,
    list_experiments,
    start_building,
    complete_building,
    start_testing,
    schedule_testing,
    edit_testing_schedule,
    complete_testing,
    submit_observation,
    submit_decision,
    extend_deadline,
    cancel_experiment,
    enrich_experiment_state,
    calculate_observation_status
)
from models.user import get_user_by_uuid
from utils.helpers import sanitize_response
from utils.validators import validate_required_fields

experiments_bp = Blueprint('experiments', __name__, url_prefix='/api/experiments')


def enrich_response(experiment):
    """Add owner info to experiment."""
    if not experiment:
        return None

    experiment = enrich_experiment_state(experiment)

    owner = get_user_by_uuid(experiment.get('owner'))
    if owner:
        experiment['owner_info'] = {
            'uuid': owner['uuid'],
            'name': owner['name'],
            'email': owner['email']
        }

    # Add creator info for raw ideas
    creator = get_user_by_uuid(experiment.get('creator'))
    if creator:
        experiment['creator_info'] = {
            'uuid': creator['uuid'],
            'name': creator['name'],
            'email': creator['email']
        }

    # Add related experiments count
    root_uuid = experiment.get('root_experiment_uuid') or experiment.get('uuid')
    from models.experiment import get_related_experiments_count
    experiment['attempts_count'] = get_related_experiments_count(root_uuid)

    return experiment


@experiments_bp.route('', methods=['POST'])
@require_auth
@rate_limit_default
def create_new_experiment():
    """Create new experiment."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_REQUEST', 'message': 'Request body required'}
        }), 400

    valid, error = validate_required_fields(data, ['title'])
    if not valid:
        return jsonify({
            'success': False,
            'error': {'code': 'MISSING_FIELDS', 'message': error}
        }), 400

    user = getattr(g, 'user', {})
    experiment = create_experiment(data, user.get('uuid'))

    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'CREATE_FAILED', 'message': 'Failed to create experiment'}
        }), 500

    return jsonify({
        'success': True,
        'message': 'Experiment created. Click "Start Building" when ready.',
        'experiment': sanitize_response(enrich_response(experiment))
    }), 201


@experiments_bp.route('', methods=['GET'])
@require_auth
def list_experiments_route():
    """List experiments with pagination."""
    # Parse pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # Validate pagination
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 1
    if per_page > 100:
        per_page = 100  # Max limit

    view = request.args.get('view', 'active')
    root_uuid = request.args.get('root_uuid')
    owner_uuid = request.args.get('owner_uuid')
    domain = request.args.get('domain')
    phase = request.args.get('phase')
    overdue = request.args.get('overdue') == 'true'
    user = getattr(g, 'user', {})
    user_uuid = user.get('uuid')
    is_admin = user.get('role') == 'ADMIN'

    # If root_uuid provided, get all attempts of same idea (no pagination for related experiments)
    if root_uuid:
        root_experiment = get_experiment_by_uuid(root_uuid)
        resolved_root_uuid = (
            root_experiment.get('root_experiment_uuid')
            if root_experiment else root_uuid
        )
        experiments = get_experiments_by_root(resolved_root_uuid)
        return jsonify({
            'success': True,
            'experiments': [sanitize_response(enrich_response(exp)) for exp in experiments]
        })

    status_filter = request.args.get('status')

    # Otherwise filter by view
    if view == 'my':
        experiments = list_experiments(owner_uuid=user_uuid, status=status_filter, view=view)
    elif view == 'active':
        experiments = list_experiments(status=status_filter or 'ACTIVE', view=view)
    elif view == 'completed':
        experiments = list_experiments(status='COMPLETED', view=view)
    elif view == 'cancelled':
        experiments = list_experiments(status='CANCELLED', view=view)
    else:
        experiments = list_experiments(status=status_filter, view=view)

    if owner_uuid:
        experiments = [
            exp for exp in experiments
            if exp.get('owner') == owner_uuid and (is_admin or owner_uuid == user_uuid)
        ]
    if domain:
        experiments = [exp for exp in experiments if exp.get('domain') == domain]
    if phase:
        experiments = [exp for exp in experiments if exp.get('current_phase') == phase]
    if overdue:
        experiments = [exp for exp in experiments if exp.get('phase_progress', {}).get('is_overdue')]

    # Apply pagination
    total = len(experiments)
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_experiments = experiments[start_idx:end_idx]

    return jsonify({
        'success': True,
        'experiments': [sanitize_response(enrich_response(exp)) for exp in paginated_experiments],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    })


@experiments_bp.route('/<uuid>', methods=['GET'])
@require_auth
def get_experiment(uuid):
    """Get single experiment with related count."""
    experiment = get_experiment_with_context(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Experiment not found'}
        }), 404

    return jsonify({
        'success': True,
        'experiment': sanitize_response(enrich_response(experiment))
    })


@experiments_bp.route('/<uuid>/start-build', methods=['POST'])
@require_auth
@rate_limit_default
def start_building_route(uuid):
    """Start building phase."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    if experiment.get('current_phase') != 'IDEA':
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Must be in IDEA phase'}
        }), 400

    user_uuid = user.get('uuid')
    updated = start_building(uuid, user_uuid)
    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to start'}}), 500

    return jsonify({
        'success': True,
        'message': 'Build phase started. You have 2 days to complete.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/complete-build', methods=['POST'])
@require_auth
@rate_limit_default
def complete_build_route(uuid):
    """Mark build as complete."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    if experiment.get('current_phase') != 'BUILDING':
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Must be in BUILDING phase'}
        }), 400

    user_uuid = user.get('uuid')
    updated = complete_building(uuid, user_uuid)
    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to complete'}}), 500

    return jsonify({
        'success': True,
        'message': 'Build completed. You can now start testing.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/start-testing', methods=['POST'])
@require_auth
@rate_limit_default
def start_testing_route(uuid):
    """Start testing phase."""
    data = request.get_json() or {}
    duration_days = data.get('duration_days', 4)

    if not isinstance(duration_days, int) or duration_days < 1 or duration_days > 14:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DURATION', 'message': 'Duration must be 1-14 days'}
        }), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    # Allow starting testing from TESTING phase (after build completes)
    if experiment.get('current_phase') not in ['BUILDING', 'TESTING']:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Must complete build first'}
        }), 400

    user_uuid = user.get('uuid')
    updated = start_testing(uuid, user_uuid, duration_days)
    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to start testing'}}), 500

    return jsonify({
        'success': True,
        'message': f'Testing started for {duration_days} days. Submit daily observations.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/schedule-testing', methods=['POST'])
@require_auth
@rate_limit_default
def schedule_testing_route(uuid):
    """Schedule testing for a future date."""
    data = request.get_json() or {}
    start_date = data.get('start_date')
    duration_days = data.get('duration_days', 4)

    if not start_date:
        return jsonify({
            'success': False,
            'error': {'code': 'MISSING_FIELDS', 'message': 'Start date is required'}
        }), 400

    if not isinstance(duration_days, int) or duration_days < 1 or duration_days > 14:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DURATION', 'message': 'Duration must be 1-14 days'}
        }), 400

    # Validate date format
    try:
        from dateutil import parser
        scheduled = parser.parse(start_date)
        if scheduled.tzinfo is None:
            scheduled = scheduled.replace(tzinfo=timezone.utc)
    except:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DATE', 'message': 'Invalid date format'}
        }), 400

    now = datetime.now(INDIA_TZ)
    if scheduled <= now:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DATE', 'message': 'Scheduled date must be in the future'}
        }), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    # Allow scheduling from BUILDING or TESTING phase
    if experiment.get('current_phase') not in ['BUILDING', 'TESTING']:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Must be in BUILDING or TESTING phase'}
        }), 400

    if ((experiment.get('timeline') or {}).get('testing') or {}).get('actual_start'):
        return jsonify({
            'success': False,
            'error': {'code': 'ALREADY_STARTED', 'message': 'Testing has already started'}
        }), 400

    from models.experiment import schedule_testing
    user_uuid = user.get('uuid')
    updated = schedule_testing(uuid, user_uuid, scheduled.isoformat(), duration_days)

    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to schedule testing'}}), 500

    return jsonify({
        'success': True,
        'message': f'Testing scheduled for {scheduled.strftime("%Y-%m-%d")}. You can start earlier when ready.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/edit-testing-schedule', methods=['POST'])
@require_auth
@rate_limit_default
def edit_testing_schedule_route(uuid):
    """Edit the scheduled testing date."""
    data = request.get_json() or {}
    new_start_date = data.get('start_date')
    duration_days = data.get('duration_days')

    if not new_start_date:
        return jsonify({
            'success': False,
            'error': {'code': 'MISSING_FIELDS', 'message': 'Start date is required'}
        }), 400

    if duration_days is not None and (not isinstance(duration_days, int) or duration_days < 1 or duration_days > 14):
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DURATION', 'message': 'Duration must be 1-14 days'}
        }), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    if not experiment.get('scheduled_testing'):
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_SCHEDULED', 'message': 'Testing is not scheduled'}
        }), 400

    from models.experiment import edit_testing_schedule
    user_uuid = user.get('uuid')
    updated = edit_testing_schedule(uuid, user_uuid, new_start_date, duration_days)

    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to update schedule'}}), 500

    scheduled_date = updated.get('scheduled_testing', {}).get('start_date', 'Unknown')
    return jsonify({
        'success': True,
        'message': f'Testing schedule updated to {scheduled_date[:10]}.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/complete-testing', methods=['POST'])
@require_auth
@rate_limit_default
def complete_testing_route(uuid):
    """Mark testing as complete."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    if experiment.get('current_phase') != 'TESTING':
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Must be in TESTING phase'}
        }), 400

    observation_status = calculate_observation_status(experiment)
    if not observation_status.get('can_complete_testing'):
        return jsonify({
            'success': False,
            'error': {
                'code': 'OBSERVATIONS_INCOMPLETE',
                'message': 'Complete all observations or wait until the testing window has passed'
            }
        }), 400

    user_uuid = user.get('uuid')
    updated = complete_testing(uuid, user_uuid)
    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to complete'}}), 500

    return jsonify({
        'success': True,
        'message': 'Testing completed. Submit decision to finish.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/extend', methods=['POST'])
@require_auth
@rate_limit_default
def extend_deadline_route(uuid):
    """Extend the active phase deadline."""
    data = request.get_json() or {}
    phase = data.get('phase', '').strip().lower()
    new_deadline_raw = data.get('new_deadline')
    reason = data.get('reason', '').strip()

    if phase not in ['build', 'testing', 'decision']:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Phase must be build, testing, or decision'}
        }), 400

    if not new_deadline_raw or not reason:
        return jsonify({
            'success': False,
            'error': {'code': 'MISSING_FIELDS', 'message': 'New deadline and reason required'}
        }), 400

    if len(reason) < 10:
        return jsonify({
            'success': False,
            'error': {'code': 'REASON_TOO_SHORT', 'message': 'Reason must be 10+ chars'}
        }), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    active_phase = {'BUILDING': 'build', 'TESTING': 'testing', 'DECISION': 'decision'}.get(experiment.get('current_phase'))
    if phase != active_phase:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': f'Can only extend the active {active_phase or "workflow"} phase'}
        }), 400

    try:
        new_deadline = datetime.fromisoformat(str(new_deadline_raw).replace('Z', '+00:00'))
        if new_deadline.tzinfo is None:
            new_deadline = new_deadline.replace(tzinfo=timezone.utc)
    except ValueError:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DATE', 'message': 'New deadline must be a valid ISO date'}
        }), 400

    updated = extend_deadline(uuid, user.get('uuid'), phase, new_deadline, reason)
    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to extend deadline'}}), 500

    return jsonify({
        'success': True,
        'message': f'{phase.title()} deadline extended.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/observations', methods=['POST'])
@require_auth
@rate_limit_default
def submit_observation_route(uuid):
    """Submit an observation."""
    data = request.get_json() or {}
    day_number = data.get('day_number')
    content = data.get('content', '').strip()

    if not day_number or not content:
        return jsonify({
            'success': False,
            'error': {'code': 'MISSING_FIELDS', 'message': 'Day number and content required'}
        }), 400

    if len(content) < 5:
        return jsonify({
            'success': False,
            'error': {'code': 'CONTENT_TOO_SHORT', 'message': 'Content must be 5+ chars'}
        }), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    if experiment.get('current_phase') not in ['TESTING', 'DECISION', 'COMPLETED']:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Must be in TESTING, DECISION, or COMPLETED phase'}
        }), 400

    try:
        day_number = int(day_number)
    except (TypeError, ValueError):
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_DAY', 'message': 'Day number must be a valid number'}
        }), 400

    observation_status = calculate_observation_status(experiment)
    day_status = next(
        (day for day in observation_status.get('days', []) if day.get('day_number') == day_number),
        None
    )
    if not day_status or not (day_status.get('can_submit') or day_status.get('is_submitted')):
        return jsonify({
            'success': False,
            'error': {'code': 'DAY_LOCKED', 'message': 'You can only submit observations for today or overdue days'}
        }), 400

    user_uuid = user.get('uuid')
    updated = submit_observation(uuid, user_uuid, day_number, content)
    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to submit'}}), 500

    return jsonify({
        'success': True,
        'message': f'Observation for Day {day_number} submitted.',
        'experiment': sanitize_response(enrich_response(updated))
    })


@experiments_bp.route('/<uuid>/observations', methods=['GET'])
@require_auth
def get_observations_route(uuid):
    """Get observations."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    observations = experiment.get('observations', [])

    return jsonify({
        'success': True,
        'observations': observations
    })


@experiments_bp.route('/<uuid>/submit-decision', methods=['POST'])
@require_auth
@rate_limit_default
def submit_decision_route(uuid):
    """Submit final decision."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': {'code': 'INVALID_REQUEST', 'message': 'Body required'}}), 400

    decision = data.get('decision', '').upper()
    reason = data.get('reason', '').strip()

    if not decision or not reason:
        return jsonify({'success': False, 'error': {'code': 'MISSING_FIELDS', 'message': 'Decision and reason required'}}), 400

    if decision not in ['ADD', 'DROP', 'ITERATE']:
        return jsonify({'success': False, 'error': {'code': 'INVALID_DECISION', 'message': 'Must be ADD, DROP, or ITERATE'}}), 400

    if len(reason) < 20:
        return jsonify({'success': False, 'error': {'code': 'REASON_TOO_SHORT', 'message': 'Reason must be 20+ chars'}}), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    if experiment.get('current_phase') != 'DECISION':
        return jsonify({'success': False, 'error': {'code': 'INVALID_PHASE', 'message': 'Must be in DECISION phase'}}), 400

    user_uuid = user.get('uuid')
    result = submit_decision(uuid, user_uuid, decision, reason)

    if not result:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to submit'}}), 500

    response = {
        'success': True,
        'experiment': sanitize_response(enrich_response(result['experiment'])),
        'decision': decision
    }

    if decision == 'ITERATE' and 'new_experiment' in result:
        response['message'] = f'New experiment {result["new_experiment"]["exp_no"]} created. Previous learnings preserved.'
        response['new_experiment'] = sanitize_response(enrich_response(result['new_experiment']))
    elif decision == 'ADD':
        response['message'] = 'Experiment completed successfully. Decision: ADD.'
    else:
        response['message'] = 'Experiment completed. Decision: DROP.'

    return jsonify(response)


@experiments_bp.route('/<uuid>/cancel', methods=['POST'])
@require_auth
@rate_limit_default
def cancel_experiment_route(uuid):
    """Cancel experiment."""
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()

    if not reason or len(reason) < 10:
        return jsonify({
            'success': False,
            'error': {'code': 'REASON_REQUIRED', 'message': 'Cancellation reason required (10+ chars)'}
        }), 400

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({'success': False, 'error': {'code': 'NOT_FOUND', 'message': 'Not found'}}), 404

    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({'success': False, 'error': {'code': 'FORBIDDEN', 'message': 'Not authorized'}}), 403

    user_uuid = user.get('uuid')
    updated = cancel_experiment(uuid, user_uuid, reason)

    if not updated:
        return jsonify({'success': False, 'error': {'code': 'FAILED', 'message': 'Failed to cancel'}}), 500

    return jsonify({
        'success': True,
        'message': 'Experiment cancelled',
        'experiment': sanitize_response(enrich_response(updated))
    })


# ========================================
# Raw Idea Routes
# ========================================

@experiments_bp.route('/raw-ideas', methods=['POST'])
@require_auth
@rate_limit_default
def create_new_raw_idea():
    """Create a new raw idea."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_REQUEST', 'message': 'Request body required'}
        }), 400

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    if not title:
        return jsonify({
            'success': False,
            'error': {'code': 'MISSING_FIELDS', 'message': 'Title is required'}
        }), 400

    user = getattr(g, 'user', {})
    raw_idea = create_raw_idea(title, description, user.get('uuid'))

    if not raw_idea:
        return jsonify({
            'success': False,
            'error': {'code': 'CREATE_FAILED', 'message': 'Failed to create raw idea'}
        }), 500

    return jsonify({
        'success': True,
        'message': 'Raw idea created successfully',
        'experiment': sanitize_response(enrich_response(raw_idea))
    }), 201


@experiments_bp.route('/raw-ideas', methods=['GET'])
@require_auth
def list_raw_ideas_route():
    """List all raw ideas."""
    raw_ideas = list_raw_ideas(status='ACTIVE')

    return jsonify({
        'success': True,
        'experiments': [sanitize_response(enrich_response(ri)) for ri in raw_ideas]
    })


@experiments_bp.route('/<uuid>/take', methods=['POST'])
@require_auth
@rate_limit_default
def take_raw_idea_route(uuid):
    """Take a raw idea and convert it to an experiment."""
    data = request.get_json() or {}

    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {'code': 'NOT_FOUND', 'message': 'Raw idea not found'}
        }), 404

    if experiment.get('current_phase') != 'RAW_IDEA':
        return jsonify({
            'success': False,
            'error': {'code': 'INVALID_PHASE', 'message': 'Not a raw idea'}
        }), 400

    if experiment.get('owner'):
        return jsonify({
            'success': False,
            'error': {'code': 'ALREADY_TAKEN', 'message': 'This idea has already been taken'}
        }), 400

    user = getattr(g, 'user', {})
    user_uuid = user.get('uuid')

    try:
        updated = take_raw_idea(uuid, user_uuid, data)

        if not updated:
            return jsonify({
                'success': False,
                'error': {'code': 'FAILED', 'message': 'Failed to take raw idea'}
            }), 500

        return jsonify({
            'success': True,
            'message': 'Raw idea taken successfully. You are now the owner.',
            'experiment': sanitize_response(enrich_response(updated))
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': {'code': 'FAILED', 'message': str(e)}
        }), 500

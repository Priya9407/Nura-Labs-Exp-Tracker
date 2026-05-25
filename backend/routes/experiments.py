from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import require_admin, check_ownership
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    create_experiment,
    get_experiment_by_uuid,
    get_all_experiments,
    get_active_experiments,
    update_experiment,
    delete_experiment
)
from models.user import get_user_by_uuid
from utils.validators import (
    validate_required_fields,
    validate_experiment_phase,
    validate_experiment_status
)
from utils.helpers import sanitize_response, get_phase_display, get_status_display

experiments_bp = Blueprint('experiments', __name__, url_prefix='/api/experiments')

def enrich_experiment(experiment):
    """Add computed fields and owner info to experiment."""
    if not experiment:
        return None

    # Get owner info
    owner = get_user_by_uuid(experiment.get('owner'))
    if owner:
        experiment['owner_info'] = {
            'uuid': owner['uuid'],
            'name': owner['name'],
            'email': owner['email']
        }

    # Add computed phase display
    experiment['phase_display'] = get_phase_display(experiment.get('current_phase', ''))
    experiment['status_display'] = get_status_display(experiment.get('status', ''))

    # Check if overdue
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    current_phase = experiment.get('current_phase', '')

    deadline = None
    if current_phase == 'BUILDING':
        deadline = experiment.get('timeline', {}).get('build', {}).get('extended_deadline') or \
                   experiment.get('timeline', {}).get('build', {}).get('deadline')
    elif current_phase == 'USER_TESTING':
        deadline = experiment.get('timeline', {}).get('testing', {}).get('extended_deadline') or \
                   experiment.get('timeline', {}).get('testing', {}).get('deadline')
    elif current_phase == 'DECISION_PENDING':
        deadline = experiment.get('timeline', {}).get('decision', {}).get('extended_deadline') or \
                   experiment.get('timeline', {}).get('decision', {}).get('deadline')

    if deadline:
        try:
            if isinstance(deadline, str):
                from dateutil import parser
                deadline = parser.parse(deadline)
            experiment['is_overdue'] = deadline < now
            experiment['days_overdue'] = max(0, (now - deadline).days) if deadline < now else 0
        except:
            experiment['is_overdue'] = False
            experiment['days_overdue'] = 0
    else:
        experiment['is_overdue'] = False
        experiment['days_overdue'] = 0

    return experiment

@experiments_bp.route('', methods=['POST'])
@require_auth
@rate_limit_default
def create_new_experiment():
    """Create a new experiment."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    # Validate required fields
    required = ['title']
    valid, error = validate_required_fields(data, required)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': error
            }
        }), 400

    # Get current user
    user = getattr(g, 'user', {})
    owner_uuid = user.get('uuid')

    # Create experiment
    experiment = create_experiment(data, owner_uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CREATE_FAILED',
                'message': 'Failed to create experiment'
            }
        }), 500

    experiment = enrich_experiment(experiment)

    return jsonify({
        'success': True,
        'experiment': sanitize_response(experiment)
    }), 201

@experiments_bp.route('', methods=['GET'])
@require_auth
def list_experiments():
    """List all experiments with optional filters."""
    status = request.args.get('status')
    phase = request.args.get('phase')
    view = request.args.get('view', 'all')  # all, active, my, archived

    user = getattr(g, 'user', {})
    user_uuid = user.get('uuid')
    user_role = user.get('role')

    if view == 'my':
        experiments = [enrich_experiment(exp) for exp in get_all_experiments() if exp.get('owner') == user_uuid]
    elif view == 'active':
        experiments = [enrich_experiment(exp) for exp in get_active_experiments()]
    elif view == 'archived':
        experiments = [enrich_experiment(exp) for exp in get_all_experiments(status='ARCHIVED')]
    else:
        experiments = [enrich_experiment(exp) for exp in get_all_experiments(status, phase)]

    # Sort by created_at desc
    experiments.sort(key=lambda x: x.get('created_at', ''), reverse=True)

    return jsonify({
        'success': True,
        'experiments': [sanitize_response(exp) for exp in experiments if exp]
    })

@experiments_bp.route('/<uuid>', methods=['GET'])
@require_auth
def get_experiment(uuid):
    """Get single experiment by UUID."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Experiment not found'
            }
        }), 404

    experiment = enrich_experiment(experiment)

    return jsonify({
        'success': True,
        'experiment': sanitize_response(experiment)
    })

@experiments_bp.route('/<uuid>', methods=['PUT'])
@require_auth
@rate_limit_default
def update_experiment_route(uuid):
    """Update experiment fields."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    # Get experiment
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Experiment not found'
            }
        }), 404

    # Check ownership
    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only owner or admin can update this experiment'
            }
        }), 403

    # Build updates
    allowed_fields = ['title', 'domain', 'assumption_statement', 'target_user']
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NO_UPDATES',
                'message': 'No valid fields to update'
            }
        }), 400

    # Update experiment
    updated = update_experiment(uuid, updates)
    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_FAILED',
                'message': 'Failed to update experiment'
            }
        }), 500

    updated = enrich_experiment(updated)

    return jsonify({
        'success': True,
        'experiment': sanitize_response(updated)
    })

@experiments_bp.route('/<uuid>', methods=['DELETE'])
@require_auth
@rate_limit_default
def delete_experiment_route(uuid):
    """Archive/soft-delete an experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Experiment not found'
            }
        }), 404

    # Check ownership
    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only owner or admin can delete this experiment'
            }
        }), 403

    # Archive instead of hard delete
    result = delete_experiment(uuid)
    if not result:
        return jsonify({
            'success': False,
            'error': {
                'code': 'DELETE_FAILED',
                'message': 'Failed to archive experiment'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'Experiment archived successfully'
    })

@experiments_bp.route('/<uuid>/cancel', methods=['POST'])
@require_auth
@rate_limit_default
def cancel_experiment(uuid):
    """Cancel an experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'Experiment not found'
            }
        }), 404

    # Check ownership
    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only owner or admin can cancel this experiment'
            }
        }), 403

    updated = update_experiment(uuid, {
        'status': 'CANCELLED',
        'current_phase': 'FINISHED'
    })

    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_FAILED',
                'message': 'Failed to cancel experiment'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': 'Experiment cancelled successfully'
    })

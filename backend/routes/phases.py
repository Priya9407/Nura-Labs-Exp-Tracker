from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import check_ownership
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    get_experiment_by_uuid,
    update_phase,
    extend_deadline
)
from utils.validators import validate_experiment_phase, validate_phase_for_extension
from utils.helpers import get_current_timestamp, sanitize_response

phases_bp = Blueprint('phases', __name__, url_prefix='/api/experiments')

# Phase progression order
PHASE_ORDER = [
    'IDEA',
    'BUILDING',
    'WAITING_FOR_TEST',
    'USER_TESTING',
    'DECISION_PENDING',
    'FINISHED'
]

@phases_bp.route('/<uuid>/phase', methods=['PATCH'])
@require_auth
@rate_limit_default
def update_experiment_phase(uuid):
    """Update experiment phase."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    new_phase = data.get('phase', '').upper()

    # Validate phase
    valid, error = validate_experiment_phase(new_phase)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_PHASE',
                'message': error
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
                'message': 'Only owner or admin can update phase'
            }
        }), 403

    # Check if already in this phase
    current_phase = experiment.get('current_phase')
    if current_phase == new_phase:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SAME_PHASE',
                'message': 'Experiment is already in this phase'
            }
        }), 400

    # Determine actual dates based on phase
    actual_dates = {}
    now = get_current_timestamp()

    if new_phase == 'BUILDING':
        actual_dates['build'] = {'actual_start': now}
    elif new_phase == 'WAITING_FOR_TEST':
        actual_dates['build'] = {'actual_end': now}
        actual_dates['testing'] = {'actual_start': now}
    elif new_phase == 'USER_TESTING':
        actual_dates['testing'] = {'actual_start': now}
    elif new_phase == 'DECISION_PENDING':
        actual_dates['testing'] = {'actual_end': now}
        actual_dates['decision'] = {'actual_start': now}
    elif new_phase == 'FINISHED':
        actual_dates['decision'] = {'actual_end': now}

    # Update phase
    updated = update_phase(uuid, new_phase, actual_dates)
    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'UPDATE_FAILED',
                'message': 'Failed to update phase'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': f'Phase updated to {new_phase}',
        'experiment': sanitize_response(updated)
    })

@phases_bp.route('/<uuid>/extend', methods=['POST'])
@require_auth
@rate_limit_default
def extend_experiment_deadline(uuid):
    """Extend deadline for a phase."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    phase = data.get('phase', '').lower()
    new_deadline_str = data.get('new_deadline')
    reason = data.get('reason', '').strip()

    # Validate phase
    valid, error = validate_phase_for_extension(phase)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_PHASE',
                'message': error
            }
        }), 400

    # Validate reason
    if not reason:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REASON_REQUIRED',
                'message': 'Reason is required for deadline extension'
            }
        }), 400

    if len(reason) < 10:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REASON_TOO_SHORT',
                'message': 'Reason must be at least 10 characters'
            }
        }), 400

    # Parse new deadline
    from dateutil import parser
    try:
        new_deadline = parser.parse(new_deadline_str)
    except:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_DATE',
                'message': 'Invalid date format for new deadline'
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
                'message': 'Only owner or admin can extend deadlines'
            }
        }), 403

    # Get current deadline to ensure new is later
    current_deadline = experiment.get('timeline', {}).get(phase, {}).get('extended_deadline') or \
                       experiment.get('timeline', {}).get(phase, {}).get('deadline')

    if current_deadline:
        try:
            if isinstance(current_deadline, str):
                current_deadline = parser.parse(current_deadline)
            if new_deadline <= current_deadline:
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'INVALID_EXTENSION',
                        'message': 'New deadline must be later than current deadline'
                    }
                }), 400
        except:
            pass

    # Extend deadline
    user_uuid = user.get('uuid')
    updated = extend_deadline(uuid, phase, new_deadline, reason, user_uuid)

    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'EXTENSION_FAILED',
                'message': 'Failed to extend deadline'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': f'{phase} deadline extended successfully',
        'experiment': sanitize_response(updated)
    })

"""
Phase-related routes - simplified for automatic lifecycle engine.

Phases are auto-calculated, not manually set.
Routes here handle transitions and extensions.
"""
from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import check_ownership
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    get_experiment_by_uuid,
    transition_phase,
    extend_deadline
)
from utils.helpers import sanitize_response

phases_bp = Blueprint('phases', __name__, url_prefix='/api/experiments')

@phases_bp.route('/<uuid>/actions', methods=['GET'])
@require_auth
def get_available_actions(uuid):
    """
    Get available actions for current experiment state.

    Returns a list of actions the user can take based on:
    - Current auto-resolved phase
    - Timeline state
    - User permissions
    """
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
    is_owner = check_ownership(experiment, user)

    allowed_actions = experiment.get('allowed_actions', [])

    # Filter actions based on permissions
    actions = []
    for action in allowed_actions:
        action_data = {
            'action': action.get('action'),
            'label': action.get('label'),
            'description': action.get('description'),
            'requires_confirmation': action.get('requires_confirmation', False),
            'requires_reason': action.get('requires_reason', False),
            'min_reason_length': action.get('min_reason_length'),
            'current_day': action.get('current_day'),
            'options': action.get('options')
        }

        # Add metadata based on action
        if action['action'] == 'start_testing' and not is_owner:
            continue  # Only owner can start testing
        if action['action'] == 'submit_decision' and not is_owner:
            continue  # Only owner can submit decision

        actions.append(action_data)

    # Add phase progress info
    phase_progress = experiment.get('phase_progress', {})

    return jsonify({
        'success': True,
        'current_phase': experiment.get('current_phase'),
        'phase_display': experiment.get('phase_display'),
        'phase_progress': phase_progress,
        'actions': actions,
        'can_edit': is_owner or user.get('role') == 'ADMIN'
    })

@phases_bp.route('/<uuid>/transition', methods=['POST'])
@require_auth
@rate_limit_default
def transition(uuid):
    """
    Execute phase transition action.

    Valid actions:
    - complete_building: Finish build, move to WAITING_FOR_TEST
    - start_testing: Begin testing, move to USER_TESTING
    """
    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    action = data.get('action')
    if not action:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_ACTION',
                'message': 'Action is required'
            }
        }), 400

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
                'message': 'Only owner or admin can transition phases'
            }
        }), 403

    user_uuid = user.get('uuid')
    updated = transition_phase(uuid, action, user_uuid)

    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'TRANSITION_FAILED',
                'message': f"Cannot perform action '{action}' from phase {experiment.get('current_phase')}"
            }
        }), 400

    from models.user import get_user_by_uuid

    # Enrich response
    owner = get_user_by_uuid(updated.get('owner'))
    if owner:
        updated['owner_info'] = {
            'uuid': owner['uuid'],
            'name': owner['name'],
            'email': owner['email']
        }

    return jsonify({
        'success': True,
        'message': f"Action '{action}' completed successfully",
        'experiment': sanitize_response(updated)
    })

@phases_bp.route('/<uuid>/extend', methods=['POST'])
@require_auth
@rate_limit_default
def extend(uuid):
    """
    Extend deadline and automatically recalculate timeline.

    The lifecycle engine shifts all future phases to maintain continuity.
    """
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

    if not phase or not new_deadline_str:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': 'Phase and new_deadline are required'
            }
        }), 400

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

    # Validate phase is extendable
    if phase not in ['build', 'testing', 'decision']:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_PHASE',
                'message': 'Can only extend build, testing, or decision phases'
            }
        }), 400

    # Get current deadline to ensure new is later
    timeline = experiment.get('timeline', {})
    phase_data = timeline.get(phase, {})
    current_deadline = phase_data.get('extended_deadline') or phase_data.get('deadline')

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

    from models.user import get_user_by_uuid

    # Enrich response
    owner = get_user_by_uuid(updated.get('owner'))
    if owner:
        updated['owner_info'] = {
            'uuid': owner['uuid'],
            'name': owner['name'],
            'email': owner['email']
        }

    return jsonify({
        'success': True,
        'message': f'{phase} deadline extended. All future phases automatically recalculated.',
        'experiment': sanitize_response(updated)
    })

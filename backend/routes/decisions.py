from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import require_admin, check_ownership
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    get_experiment_by_uuid,
    submit_decision,
    override_decision
)
from utils.validators import validate_decision
from utils.helpers import sanitize_response

decisions_bp = Blueprint('decisions', __name__, url_prefix='/api/experiments')

@decisions_bp.route('/<uuid>/decision', methods=['POST'])
@require_auth
@rate_limit_default
def submit_experiment_decision(uuid):
    """Submit final decision for experiment."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    decision = data.get('decision', '').upper()
    reason = data.get('reason', '').strip()

    # Validate decision
    valid, error = validate_decision(decision)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_DECISION',
                'message': error
            }
        }), 400

    # Validate reason
    if not reason:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REASON_REQUIRED',
                'message': 'Reason is required for final decision'
            }
        }), 400

    if len(reason) < 20:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REASON_TOO_SHORT',
                'message': 'Reason must be at least 20 characters'
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

    # Check if already has decision
    existing_decision = experiment.get('decision')
    if existing_decision and existing_decision.get('locked'):
        return jsonify({
            'success': False,
            'error': {
                'code': 'DECISION_LOCKED',
                'message': 'Decision has already been submitted and locked'
            }
        }), 403

    # Check ownership
    user = getattr(g, 'user', {})
    if not check_ownership(experiment, user):
        return jsonify({
            'success': False,
            'error': {
                'code': 'FORBIDDEN',
                'message': 'Only owner or admin can submit decision'
            }
        }), 403

    # Submit decision
    user_uuid = user.get('uuid')
    updated = submit_decision(uuid, decision, reason, user_uuid)

    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'SUBMIT_FAILED',
                'message': 'Failed to submit decision'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': f'Decision submitted: {decision}',
        'experiment': sanitize_response(updated)
    })

@decisions_bp.route('/<uuid>/decision/override', methods=['POST'])
@require_auth
@require_admin
@rate_limit_default
def override_experiment_decision(uuid):
    """Override decision (admin only)."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    new_decision = data.get('decision', '').upper()
    new_reason = data.get('reason', '').strip()

    # Validate decision
    valid, error = validate_decision(new_decision)
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_DECISION',
                'message': error
            }
        }), 400

    # Validate reason
    if not new_reason:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REASON_REQUIRED',
                'message': 'Reason is required for override'
            }
        }), 400

    if len(new_reason) < 20:
        return jsonify({
            'success': False,
            'error': {
                'code': 'REASON_TOO_SHORT',
                'message': 'Reason must be at least 20 characters'
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

    # Check if has decision
    existing_decision = experiment.get('decision')
    if not existing_decision:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NO_DECISION',
                'message': 'No decision to override'
            }
        }), 400

    # Override decision
    user_uuid = g.user.get('uuid')
    updated = override_decision(uuid, new_decision, new_reason, user_uuid)

    if not updated:
        return jsonify({
            'success': False,
            'error': {
                'code': 'OVERRIDE_FAILED',
                'message': 'Failed to override decision'
            }
        }), 500

    return jsonify({
        'success': True,
        'message': f'Decision overridden: {new_decision}',
        'experiment': sanitize_response(updated)
    })

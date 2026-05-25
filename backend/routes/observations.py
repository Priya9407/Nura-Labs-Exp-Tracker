from flask import Blueprint, request, jsonify, g
from middleware.auth import require_auth
from middleware.roles import check_ownership
from middleware.rate_limit import rate_limit_default
from models.experiment import (
    get_experiment_by_uuid,
    add_observation,
    get_observations as get_exp_observations
)
from utils.helpers import sanitize_response, get_current_timestamp
from utils.validators import validate_required_fields

observations_bp = Blueprint('observations', __name__, url_prefix='/api/experiments')

@observations_bp.route('/<uuid>/observations', methods=['POST'])
@require_auth
@rate_limit_default
def create_observation(uuid):
    """Add observation to experiment."""
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'error': {
                'code': 'INVALID_REQUEST',
                'message': 'Request body required'
            }
        }), 400

    # Validate content
    valid, error = validate_required_fields(data, ['content'])
    if not valid:
        return jsonify({
            'success': False,
            'error': {
                'code': 'MISSING_FIELDS',
                'message': error
            }
        }), 400

    content = data.get('content', '').strip()
    if len(content) < 5:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CONTENT_TOO_SHORT',
                'message': 'Observation content must be at least 5 characters'
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

    # Check if experiment is active
    if experiment.get('status') not in ['ACTIVE', 'COMPLETED']:
        return jsonify({
            'success': False,
            'error': {
                'code': 'EXPERIMENT_INACTIVE',
                'message': 'Cannot add observations to inactive experiment'
            }
        }), 400

    # Get user
    user = getattr(g, 'user', {})
    user_uuid = user.get('uuid')

    # Add observation
    metrics = data.get('metrics', {})
    observation = add_observation(uuid, content, user_uuid, metrics)

    if not observation:
        return jsonify({
            'success': False,
            'error': {
                'code': 'CREATE_FAILED',
                'message': 'Failed to add observation'
            }
        }), 500

    return jsonify({
        'success': True,
        'observation': observation
    }), 201

@observations_bp.route('/<uuid>/observations', methods=['GET'])
@require_auth
def list_observations(uuid):
    """Get all observations for experiment."""
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

    observations = get_exp_observations(uuid)
    if observations is None:
        observations = []

    # Sort by created_at desc
    observations.sort(key=lambda x: x.get('created_at', ''), reverse=True)

    # Enrich with user info
    from models.user import get_user_by_uuid
    enriched_observations = []
    for obs in observations:
        user = get_user_by_uuid(obs.get('created_by'))
        if user:
            obs['created_by_info'] = {
                'uuid': user['uuid'],
                'name': user['name']
            }
        enriched_observations.append(obs)

    return jsonify({
        'success': True,
        'observations': sanitize_response(enriched_observations)
    })

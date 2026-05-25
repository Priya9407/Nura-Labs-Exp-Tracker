from pymongo import MongoClient
from config.settings import Config
from utils.helpers import generate_uuid, get_current_timestamp, calculate_day_number

client = MongoClient(Config.MONGODB_URL)
db = client.get_database()
experiments_collection = db.experiments

def get_next_experiment_number():
    """Generate next experiment number (EXP-001, EXP-002, etc.)."""
    count = experiments_collection.count_documents({})
    return f"EXP-{count + 1:03d}"

def create_experiment(data, owner_uuid):
    """Create a new experiment."""
    now = get_current_timestamp()

    # Build timeline structure
    timeline_data = data.get('timeline', {})
    build_timeline = timeline_data.get('build', {})
    testing_timeline = timeline_data.get('testing', {})
    decision_timeline = timeline_data.get('decision', {})

    experiment = {
        'uuid': generate_uuid(),
        'exp_no': get_next_experiment_number(),
        'title': data['title'],
        'domain': data.get('domain', ''),
        'owner': owner_uuid,
        'assumption_statement': data.get('assumption_statement', ''),
        'target_user': data.get('target_user', ''),
        'status': 'ACTIVE',
        'current_phase': 'IDEA',
        'timeline': {
            'build': {
                'planned_start': build_timeline.get('planned_start'),
                'planned_end': build_timeline.get('planned_end'),
                'actual_start': None,
                'actual_end': None,
                'deadline': build_timeline.get('deadline'),
                'extended_deadline': None,
                'extension_count': 0,
                'completed_at': None
            },
            'testing': {
                'planned_start': testing_timeline.get('planned_start'),
                'planned_end': testing_timeline.get('planned_end'),
                'actual_start': None,
                'actual_end': None,
                'deadline': testing_timeline.get('deadline'),
                'extended_deadline': None,
                'extension_count': 0,
                'completed_at': None
            },
            'decision': {
                'deadline': decision_timeline.get('deadline'),
                'extended_deadline': None,
                'extension_count': 0,
                'completed_at': None
            }
        },
        'timeline_history': [],
        'observations': [],
        'decision': None,
        'created_at': now,
        'updated_at': now
    }

    result = experiments_collection.insert_one(experiment)
    return get_experiment_by_uuid(experiment['uuid'])

def get_experiment_by_uuid(uuid):
    """Get experiment by UUID."""
    return experiments_collection.find_one({'uuid': uuid})

def get_experiments_by_owner(owner_uuid):
    """Get all experiments by owner."""
    return list(experiments_collection.find({'owner': owner_uuid}))

def get_all_experiments(status=None, phase=None):
    """Get all experiments with optional filters."""
    query = {}
    if status:
        query['status'] = status
    if phase:
        query['current_phase'] = phase
    return list(experiments_collection.find(query))

def get_active_experiments():
    """Get all active experiments."""
    return list(experiments_collection.find({'status': 'ACTIVE'}))

def update_experiment(uuid, updates, user_uuid=None, reason=None):
    """Update experiment fields."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None

    updates['updated_at'] = get_current_timestamp()

    # Track changes to timeline if reason provided
    if reason and user_uuid:
        timeline_fields = ['timeline.build.deadline', 'timeline.testing.deadline', 'timeline.decision.deadline']
        for field in timeline_fields:
            if field in updates:
                phase = field.split('.')[1]
                old_value = experiment.get('timeline', {}).get(phase, {}).get('deadline')
                new_value = updates[field]

                history_entry = {
                    'uuid': generate_uuid(),
                    'phase': phase,
                    'field': 'deadline',
                    'old_value': old_value,
                    'new_value': new_value,
                    'reason': reason,
                    'updated_by': user_uuid,
                    'updated_at': get_current_timestamp()
                }

                # Add to history array
                if 'timeline_history' not in updates:
                    updates['$push'] = {'timeline_history': history_entry}

    result = experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': updates}
    )

    if result.modified_count:
        return get_experiment_by_uuid(uuid)
    return None

def update_phase(uuid, new_phase, actual_dates=None):
    """Update experiment phase."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None

    updates = {
        'current_phase': new_phase,
        'updated_at': get_current_timestamp()
    }

    # Update actual dates for phases
    if actual_dates:
        for phase_key, dates in actual_dates.items():
            if 'actual_start' in dates:
                updates[f'timeline.{phase_key}.actual_start'] = dates['actual_start']
            if 'actual_end' in dates:
                updates[f'timeline.{phase_key}.actual_end'] = dates['actual_end']
                updates[f'timeline.{phase_key}.completed_at'] = get_current_timestamp()

    result = experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': updates}
    )

    if result.modified_count:
        return get_experiment_by_uuid(uuid)
    return None

def extend_deadline(uuid, phase, new_deadline, reason, user_uuid):
    """Extend deadline for a phase."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None

    now = get_current_timestamp()
    current_deadline = experiment.get('timeline', {}).get(phase, {}).get('extended_deadline') or \
                         experiment.get('timeline', {}).get(phase, {}).get('deadline')

    current_extension_count = experiment.get('timeline', {}).get(phase, {}).get('extension_count', 0)

    updates = {
        f'timeline.{phase}.extended_deadline': new_deadline,
        f'timeline.{phase}.extension_count': current_extension_count + 1,
        'updated_at': now
    }

    # Add history entry
    history_entry = {
        'uuid': generate_uuid(),
        'phase': phase,
        'field': 'extended_deadline',
        'old_value': current_deadline,
        'new_value': new_deadline,
        'reason': reason,
        'updated_by': user_uuid,
        'updated_at': now
    }

    result = experiments_collection.update_one(
        {'uuid': uuid},
        {
            '$set': updates,
            '$push': {'timeline_history': history_entry}
        }
    )

    if result.modified_count:
        return get_experiment_by_uuid(uuid)
    return None

def add_observation(uuid, content, created_by_uuid, metrics=None):
    """Add observation to experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None

    # Calculate day number based on phase
    phase = experiment.get('current_phase', 'IDEA')
    phase_key = phase.lower().replace('_', '')
    if phase_key == 'waitingfortest':
        phase_key = 'testing'
    elif phase_key == 'usertesting':
        phase_key = 'testing'
    elif phase_key == 'decisionpending':
        phase_key = 'decision'

    phase_start = experiment.get('timeline', {}).get(phase_key, {}).get('actual_start')
    day_number = calculate_day_number(phase_start)

    observation = {
        'uuid': generate_uuid(),
        'day_number': day_number,
        'phase': phase,
        'content': content,
        'metrics': metrics or {},
        'created_by': created_by_uuid,
        'created_at': get_current_timestamp()
    }

    result = experiments_collection.update_one(
        {'uuid': uuid},
        {
            '$push': {'observations': observation},
            '$set': {'updated_at': get_current_timestamp()}
        }
    )

    if result.modified_count:
        return observation
    return None

def get_observations(uuid):
    """Get all observations for an experiment."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None
    return experiment.get('observations', [])

def submit_decision(uuid, decision, reason, submitted_by_uuid):
    """Submit final decision for experiment."""
    now = get_current_timestamp()

    decision_data = {
        'decision': decision,
        'reason': reason,
        'submitted_by': submitted_by_uuid,
        'submitted_at': now,
        'locked': True,
        'overridden_by': None,
        'overridden_at': None
    }

    result = experiments_collection.update_one(
        {'uuid': uuid},
        {
            '$set': {
                'decision': decision_data,
                'status': 'COMPLETED',
                'current_phase': 'FINISHED',
                'updated_at': now
            }
        }
    )

    if result.modified_count:
        return get_experiment_by_uuid(uuid)
    return None

def override_decision(uuid, new_decision, new_reason, overridden_by_uuid):
    """Override a decision (admin only)."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None

    now = get_current_timestamp()
    current_decision = experiment.get('decision', {})

    decision_data = {
        'decision': new_decision,
        'reason': new_reason,
        'submitted_by': current_decision.get('submitted_by'),
        'submitted_at': current_decision.get('submitted_at'),
        'locked': True,
        'overridden_by': overridden_by_uuid,
        'overridden_at': now
    }

    result = experiments_collection.update_one(
        {'uuid': uuid},
        {
            '$set': {
                'decision': decision_data,
                'updated_at': now
            }
        }
    )

    if result.modified_count:
        return get_experiment_by_uuid(uuid)
    return None

def delete_experiment(uuid):
    """Soft delete experiment by archiving it."""
    return update_experiment(uuid, {'status': 'ARCHIVED'})

def get_overdue_experiments():
    """Get experiments with overdue deadlines."""
    now = get_current_timestamp()
    # This would need aggregation to check actual vs extended deadlines
    # Simplified version here
    return list(experiments_collection.find({
        'status': 'ACTIVE',
        '$or': [
            {'timeline.build.deadline': {'$lt': now}},
            {'timeline.testing.deadline': {'$lt': now}},
            {'timeline.decision.deadline': {'$lt': now}}
        ]
    }))

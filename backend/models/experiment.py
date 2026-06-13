"""
Experiment Model - Simplified Single Collection Design

Each experiment is a complete validation cycle.
When user chooses ITERATE, a new experiment is created with links to previous.
"""
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
from config.settings import Config
from utils.helpers import generate_uuid, get_current_timestamp, INDIA_TZ

client = MongoClient(Config.MONGODB_URL)
db = client.get_database()
experiments_collection = db.experiments

PHASE_ORDER = ['IDEA', 'BUILDING', 'TESTING', 'DECISION', 'COMPLETED']

# Additional phase states for scheduling
SCHEDULED_STATUS = 'SCHEDULED'  # Testing is scheduled for a future date


def _parse_datetime(value):
    """Parse an ISO timestamp and normalize naive values to UTC."""
    if not value:
        return None

    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except ValueError:
            return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _deadline_for(phase_timeline):
    if not phase_timeline:
        return None
    return phase_timeline.get('extended_deadline') or phase_timeline.get('deadline')


def calculate_phase_progress(experiment):
    """Compute the current phase deadline, progress, and overdue status."""
    phase = experiment.get('current_phase', 'IDEA')
    timeline = experiment.get('timeline') or {}
    now = datetime.now(INDIA_TZ)

    if phase == 'IDEA':
        return {
            'phase': phase,
            'progress_percent': 0,
            'is_overdue': False,
            'deadline': None,
            'days_remaining': None,
            'days_overdue': 0
        }

    phase_key = {
        'BUILDING': 'build',
        'TESTING': 'testing',
        'DECISION': 'decision'
    }.get(phase)

    if phase == 'COMPLETED' or not phase_key:
        return {
            'phase': phase,
            'progress_percent': 100,
            'is_overdue': False,
            'deadline': None,
            'days_remaining': 0,
            'days_overdue': 0
        }

    phase_timeline = timeline.get(phase_key) or {}
    deadline_raw = _deadline_for(phase_timeline)
    deadline = _parse_datetime(deadline_raw)
    start = _parse_datetime(phase_timeline.get('actual_start'))

    is_overdue = bool(deadline and now > deadline and not phase_timeline.get('is_completed'))
    days_remaining = max(0, (deadline.date() - now.date()).days) if deadline and not is_overdue else 0
    days_overdue = max(0, (now.date() - deadline.date()).days) if deadline and is_overdue else 0

    progress_percent = 0
    if phase == 'DECISION':
        progress_percent = 75
    elif start and deadline and deadline > start:
        total_seconds = (deadline - start).total_seconds()
        elapsed_seconds = max(0, (now - start).total_seconds())
        progress_percent = min(100, int((elapsed_seconds / total_seconds) * 100))
    elif phase == 'TESTING' and phase_timeline.get('duration_days'):
        progress_percent = 50

    return {
        'phase': phase,
        'progress_percent': progress_percent,
        'is_overdue': is_overdue,
        'deadline': deadline_raw,
        'days_remaining': days_remaining,
        'days_overdue': days_overdue
    }


def calculate_build_status(experiment):
    timeline = experiment.get('timeline') or {}
    build = timeline.get('build') or {}
    progress = calculate_phase_progress(experiment)

    if not build:
        return {'status': 'NOT_STARTED', 'can_start': True}
    if build.get('is_completed') or build.get('actual_end'):
        return {'status': 'COMPLETED', 'completed': True, 'can_complete': False}

    return {
        'status': 'OVERDUE' if progress.get('is_overdue') else 'IN_PROGRESS',
        'overdue': progress.get('is_overdue', False),
        'days_overdue': progress.get('days_overdue', 0),
        'days_remaining': progress.get('days_remaining', 0),
        'deadline': progress.get('deadline'),
        'progress_percent': progress.get('progress_percent', 0),
        'can_complete': experiment.get('current_phase') == 'BUILDING',
        'can_extend': experiment.get('current_phase') == 'BUILDING'
    }


def calculate_observation_status(experiment):
    timeline = experiment.get('timeline') or {}
    testing = timeline.get('testing') or {}
    start = _parse_datetime(testing.get('actual_start'))

    if not start:
        return {
            'is_testing': False,
            'is_completed': False,
            'current_day': None,
            'duration_days': testing.get('duration_days', 4),
            'submitted_count': 0,
            'overdue_count': 0,
            'all_complete': False,
            'can_complete_testing': False,
            'progress_percent': 0,
            'days': []
        }

    now = datetime.now(INDIA_TZ)
    duration = testing.get('duration_days', 4)
    testing_completed = bool(testing.get('actual_end') or testing.get('is_completed'))
    submitted_days = {obs.get('day_number') for obs in experiment.get('observations', [])}
    elapsed_day = (now.date() - start.date()).days + 1
    current_day = min(max(elapsed_day, 1), duration)
    days = []

    for day_number in range(1, duration + 1):
        day_date = start + timedelta(days=day_number - 1)
        is_submitted = day_number in submitted_days
        is_today = day_date.date() == now.date()
        is_past = day_date.date() < now.date()
        is_overdue = is_past and not is_submitted
        is_locked = day_date.date() > now.date()

        days.append({
            'day_number': day_number,
            'date': day_date.isoformat(),
            'is_submitted': is_submitted,
            'is_current': is_today,
            'is_overdue': is_overdue,
            'is_locked': is_locked,
            'can_submit': not is_locked
        })

    submitted_count = len(submitted_days)
    overdue_count = len([day for day in days if day['is_overdue']])

    return {
        'is_testing': experiment.get('current_phase') == 'TESTING' and not testing_completed,
        'is_completed': testing_completed,
        'current_day': None if testing_completed else current_day,
        'duration_days': duration,
        'submitted_count': submitted_count,
        'overdue_count': overdue_count,
        'all_complete': submitted_count >= duration,
        'can_complete_testing': submitted_count >= duration or elapsed_day > duration,
        'progress_percent': min(100, int((submitted_count / duration) * 100)) if duration else 0,
        'days': days
    }


def get_allowed_actions(experiment):
    if experiment.get('status') != 'ACTIVE':
        return []

    phase = experiment.get('current_phase')
    actions = []

    if phase == 'IDEA':
        actions.append({
            'action': 'start_building',
            'label': 'Start Building',
            'description': 'Begin the two-day build phase.'
        })
    elif phase == 'BUILDING':
        actions.append({
            'action': 'complete_building',
            'label': 'Mark Build Complete',
            'description': 'Move the experiment into testing setup.'
        })
        actions.append({
            'action': 'extend_build',
            'label': 'Extend Build',
            'description': 'Move the build deadline with a reason.'
        })
    elif phase == 'TESTING':
        testing = (experiment.get('timeline') or {}).get('testing')
        scheduled = experiment.get('scheduled_testing')

        # If testing is scheduled for future, show different actions
        if scheduled and not testing:
            scheduled_date = _parse_datetime(scheduled.get('start_date'))
            if scheduled_date and scheduled_date > datetime.now(INDIA_TZ):
                actions.append({
                    'action': 'start_testing',
                    'label': 'Start Testing Now',
                    'description': f'Testing is scheduled for {scheduled_date.strftime("%Y-%m-%d")}. Start early?'
                })
                actions.append({
                    'action': 'edit_schedule',
                    'label': 'Edit Schedule',
                    'description': 'Change the scheduled testing date.'
                })
                return actions

        if not testing or not testing.get('actual_start'):
            actions.append({
                'action': 'start_testing',
                'label': 'Start Testing',
                'description': 'Choose a duration and begin user testing now.'
            })
            actions.append({
                'action': 'schedule_testing',
                'label': 'Schedule for Later',
                'description': 'Pick a future date to start testing.'
            })
            return actions

        observation_status = calculate_observation_status(experiment)
        if observation_status.get('can_complete_testing'):
            actions.append({
                'action': 'complete_testing',
                'label': 'Complete Testing',
                'description': 'Move to the decision phase.'
            })
        actions.append({
            'action': 'extend_testing',
            'label': 'Extend Testing',
            'description': 'Move the testing deadline with a reason.'
        })
    elif phase == 'DECISION':
        actions.append({
            'action': 'submit_decision',
            'label': 'Submit Decision',
            'description': 'Choose ADD, DROP, or ITERATE.'
        })
        actions.append({
            'action': 'extend_decision',
            'label': 'Extend Decision',
            'description': 'Move the decision deadline with a reason.'
        })

    return actions


def enrich_experiment_state(experiment):
    """Add computed fields expected by the frontend without persisting them."""
    if not experiment:
        return None

    observation_status = calculate_observation_status(experiment)
    experiment['phase_progress'] = calculate_phase_progress(experiment)
    experiment['build_status'] = calculate_build_status(experiment)
    experiment['observation_status'] = observation_status
    experiment['current_observation_day'] = observation_status.get('current_day')
    experiment['allowed_actions'] = get_allowed_actions(experiment)
    experiment['current_iteration'] = experiment.get('iteration_number', 1)
    return experiment

def get_next_experiment_number():
    """Generate next experiment number."""
    count = experiments_collection.count_documents({})
    return f"EXP-{count + 1:03d}"

def log_activity(experiment_uuid, activity_type, details, user_uuid):
    """
    Log activity for audit trail.
    Activities: phase_change, testing_started, extension, observation_submitted,
                observation_edited, decision_submitted, cancelled, experiment_created
    """
    from services.activity_log_service import activity_log_service
    return activity_log_service.log_activity(
        experiment_uuid, activity_type, details, user_uuid
    )


def create_experiment(data, owner_uuid):
    """
    Create a new experiment.
    """
    now = get_current_timestamp()
    experiment_uuid = generate_uuid()

    experiment = {
        'uuid': experiment_uuid,
        'exp_no': get_next_experiment_number(),
        'title': data['title'],
        'domain': data.get('domain', ''),
        'owner': owner_uuid,
        'assumption_statement': data.get('assumption_statement', ''),
        'target_user': data.get('target_user', ''),

        # Links (null if first experiment)
        'parent_experiment_uuid': None,
        'root_experiment_uuid': experiment_uuid,
        'iteration_number': 1,
        'created_from_decision': None,

        # Status
        'status': 'ACTIVE',
        'current_phase': 'IDEA',

        # Timeline (inline)
        'timeline': {
            'build': None,
            'testing': None,
            'decision': None
        },

        # Observations (inline)
        'observations': [],

        # Decision
        'decision': None,

        'created_at': now,
        'updated_at': now
    }

    experiments_collection.insert_one(experiment)

    # Log activity
    log_activity(experiment_uuid, 'experiment_created', {'title': data['title']}, owner_uuid)

    return experiment


def get_experiment_by_uuid(uuid):
    """Get experiment by UUID."""
    return experiments_collection.find_one({'uuid': uuid})


def get_experiments_by_root(root_uuid):
    """Get all experiments in a chain (all attempts of same idea)."""
    return list(experiments_collection.find(
        {'root_experiment_uuid': root_uuid}
    ).sort('iteration_number', 1))


def get_related_experiments_count(root_uuid):
    """Get count of attempts for this idea."""
    return experiments_collection.count_documents(
        {'root_experiment_uuid': root_uuid}
    )


# Phase Actions

def start_building(uuid, user_uuid, start_date=None):
    """Start building phase."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') != 'IDEA':
        return None

    if start_date is None:
        start_date = datetime.now(INDIA_TZ)

    # Fixed 2-day build
    deadline = start_date + timedelta(days=2)
    now = get_current_timestamp()

    timeline = {
        'build': {
            'actual_start': start_date.isoformat(),
            'actual_end': None,
            'deadline': deadline.isoformat(),
            'extended_deadline': None,
            'extension_count': 0,
            'is_completed': False
        },
        'testing': None,
        'decision': None
    }

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'current_phase': 'BUILDING',
            'timeline': timeline,
            'updated_at': now
        }}
    )

    log_activity(uuid, 'phase_changed', {
        'from': 'IDEA',
        'to': 'BUILDING',
        'timeline_start': timeline['build']['actual_start']
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def complete_building(uuid, user_uuid):
    """Complete building phase."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') != 'BUILDING':
        return None

    now = get_current_timestamp()
    actual_end = datetime.now(INDIA_TZ)

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'current_phase': 'TESTING',
            'timeline.build.actual_end': actual_end.isoformat(),
            'timeline.build.is_completed': True,
            'updated_at': now
        }}
    )

    log_activity(uuid, 'phase_changed', {
        'from': 'BUILDING',
        'to': 'TESTING',
        'build_completed_at': actual_end.isoformat()
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def start_testing(uuid, user_uuid, duration_days=4):
    """Start testing phase."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') != 'TESTING':
        return None

    if ((experiment.get('timeline') or {}).get('testing') or {}).get('actual_start'):
        return None

    now = datetime.now(INDIA_TZ)
    now_str = now.isoformat()

    deadline = now + timedelta(days=duration_days)
    decision_deadline = deadline + timedelta(days=1)

    timeline = experiment.get('timeline', {})
    timeline['testing'] = {
        'actual_start': now_str,
        'actual_end': None,
        'deadline': deadline.isoformat(),
        'duration_days': duration_days,
        'extended_deadline': None,
        'extension_count': 0,
        'is_completed': False
    }
    timeline['decision'] = {
        'deadline': decision_deadline.isoformat(),
        'extended_deadline': None
    }

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'timeline': timeline,
            'updated_at': now_str
        }}
    )

    log_activity(uuid, 'testing_started', {
        'duration_days': duration_days,
        'start': now_str,
        'end': deadline.isoformat()
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def schedule_testing(uuid, user_uuid, start_date, duration_days=4):
    """Schedule testing for a future date."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') != 'TESTING':
        return None

    if ((experiment.get('timeline') or {}).get('testing') or {}).get('actual_start'):
        return None

    # Validate the scheduled date is in the future
    scheduled = _parse_datetime(start_date)
    if not scheduled:
        return None

    now = datetime.now(INDIA_TZ)
    if scheduled <= now:
        return None

    # Calculate timeline based on scheduled date
    deadline = scheduled + timedelta(days=duration_days)
    decision_deadline = deadline + timedelta(days=1)

    scheduled_data = {
        'start_date': scheduled.isoformat(),
        'duration_days': duration_days,
        'deadline': deadline.isoformat(),
        'decision_deadline': decision_deadline.isoformat(),
        'scheduled_at': now.isoformat(),
        'scheduled_by': user_uuid
    }

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'scheduled_testing': scheduled_data,
            'updated_at': now.isoformat()
        }}
    )

    log_activity(uuid, 'testing_scheduled', {
        'start_date': scheduled.isoformat(),
        'duration_days': duration_days,
        'deadline': deadline.isoformat(),
        'decision_deadline': decision_deadline.isoformat()
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def edit_testing_schedule(uuid, user_uuid, new_start_date, duration_days=None):
    """Edit the scheduled testing date."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    scheduled = experiment.get('scheduled_testing')
    if not scheduled:
        return None

    # Validate new date is in the future
    new_scheduled = _parse_datetime(new_start_date)
    if not new_scheduled:
        return None

    now = datetime.now(INDIA_TZ)
    if new_scheduled <= now:
        return None

    # Use existing duration if not provided
    if duration_days is None:
        duration_days = scheduled.get('duration_days', 4)

    # Calculate new timeline
    deadline = new_scheduled + timedelta(days=duration_days)
    decision_deadline = deadline + timedelta(days=1)

    scheduled_data = {
        'start_date': new_scheduled.isoformat(),
        'duration_days': duration_days,
        'deadline': deadline.isoformat(),
        'decision_deadline': decision_deadline.isoformat(),
        'scheduled_at': now.isoformat(),
        'scheduled_by': user_uuid,
        'edited_at': now.isoformat(),
        'edited_by': user_uuid
    }

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'scheduled_testing': scheduled_data,
            'updated_at': now.isoformat()
        }}
    )

    log_activity(uuid, 'testing_schedule_edited', {
        'old_start_date': scheduled.get('start_date'),
        'new_start_date': new_scheduled.isoformat(),
        'duration_days': duration_days
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def submit_observation(uuid, user_uuid, day_number, content):
    """Submit an observation."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') not in ['TESTING', 'DECISION', 'COMPLETED']:
        return None

    observation_status = calculate_observation_status(experiment)
    valid_days = {
        day['day_number'] for day in observation_status.get('days', [])
        if day.get('can_submit') or day.get('is_submitted')
    }
    if day_number not in valid_days:
        return None

    now = get_current_timestamp()

    # Remove any existing observation for this day
    experiments_collection.update_one(
        {'uuid': uuid},
        {'$pull': {'observations': {'day_number': day_number}}}
    )

    # Add new observation
    observation = {
        'day_number': day_number,
        'content': content,
        'created_at': now
    }

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$push': {'observations': observation},
         '$set': {'updated_at': now}}
    )

    log_activity(uuid, 'observation_submitted', {'day_number': day_number}, user_uuid)

    return get_experiment_by_uuid(uuid)


def complete_testing(uuid, user_uuid):
    """Complete testing phase."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') != 'TESTING':
        return None

    testing = (experiment.get('timeline') or {}).get('testing')
    if not testing or not testing.get('actual_start'):
        return None

    observation_status = calculate_observation_status(experiment)
    if not observation_status.get('can_complete_testing'):
        return None

    now = datetime.now(INDIA_TZ)
    now_str = now.isoformat()

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'current_phase': 'DECISION',
            'timeline.testing.actual_end': now_str,
            'timeline.testing.is_completed': True,
            'updated_at': now_str
        }}
    )

    log_activity(uuid, 'phase_changed', {
        'from': 'TESTING',
        'to': 'DECISION',
        'testing_completed_at': now_str
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def submit_decision(uuid, user_uuid, decision, reason):
    """
    Submit final decision.
    If ITERATE, creates new experiment and returns both.
    """
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    if experiment.get('current_phase') != 'DECISION':
        return None

    now = get_current_timestamp()
    now_dt = datetime.now(INDIA_TZ)

    # Update current experiment
    decision_obj = {
        'decision': decision,
        'reason': reason,
        'submitted_at': now
    }

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'current_phase': 'COMPLETED',
            'status': 'COMPLETED' if decision in ['ADD', 'DROP'] else 'COMPLETED',
            'decision': decision_obj,
            'updated_at': now
        }}
    )

    log_activity(uuid, 'decision_submitted', {
        'decision': decision,
        'reason': reason[:100]
    }, user_uuid)

    result = {'experiment': get_experiment_by_uuid(uuid)}

    # If ITERATE, create new experiment
    if decision == 'ITERATE':
        new_exp = create_iteration_experiment(experiment, user_uuid)
        result['new_experiment'] = new_exp

    return result


def create_iteration_experiment(previous_experiment, user_uuid):
    """Create new experiment when ITERATE decision is made."""
    now = get_current_timestamp()
    new_uuid = generate_uuid()

    prev_uuid = previous_experiment['uuid']
    root_uuid = previous_experiment.get('root_experiment_uuid') or prev_uuid
    iteration_no = previous_experiment.get('iteration_number', 1) + 1

    new_experiment = {
        'uuid': new_uuid,
        'exp_no': get_next_experiment_number(),
        'title': previous_experiment['title'],
        'domain': previous_experiment.get('domain', ''),
        'owner': user_uuid,
        'assumption_statement': previous_experiment.get('assumption_statement', ''),
        'target_user': previous_experiment.get('target_user', ''),

        # Links
        'parent_experiment_uuid': prev_uuid,
        'root_experiment_uuid': root_uuid,
        'iteration_number': iteration_no,
        'created_from_decision': 'ITERATE',

        # Status
        'status': 'ACTIVE',
        'current_phase': 'IDEA',

        # Fresh timeline and observations
        'timeline': {'build': None, 'testing': None, 'decision': None},
        'observations': [],
        'decision': None,

        'created_at': now,
        'updated_at': now
    }

    experiments_collection.insert_one(new_experiment)

    log_activity(new_uuid, 'experiment_created', {
        'title': new_experiment['title'],
        'from_iteration': True,
        'previous_uuid': prev_uuid,
        'iteration_number': iteration_no
    }, user_uuid)

    return new_experiment


def extend_deadline(uuid, user_uuid, phase, new_deadline, reason):
    """Extend deadline for build or testing phase."""
    experiment = experiments_collection.find_one({'uuid': uuid})
    if not experiment:
        return None

    now = get_current_timestamp()

    # Get current timeline
    timeline = experiment.get('timeline', {})
    phase_timeline = timeline.get(phase, {})
    if not phase_timeline:
        return None

    old_deadline = phase_timeline.get('deadline')
    extension_count = phase_timeline.get('extension_count', 0) + 1

    # Update timeline
    timeline[phase]['extended_deadline'] = new_deadline.isoformat()
    timeline[phase]['extension_count'] = extension_count

    # If extending testing, also grow duration_days so observations cover new days
    if phase == 'testing':
        actual_start = _parse_datetime(phase_timeline.get('actual_start'))
        if actual_start:
            extra_days = (new_deadline.date() - actual_start.date()).days
            if extra_days > 0:
                timeline[phase]['duration_days'] = extra_days

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'timeline': timeline,
            'updated_at': now
        }}
    )

    log_activity(uuid, 'extension_granted', {
        'phase': phase,
        'old_deadline': old_deadline,
        'new_deadline': new_deadline.isoformat(),
        'reason': reason
    }, user_uuid)

    return get_experiment_by_uuid(uuid)


def cancel_experiment(uuid, user_uuid, reason):
    """Cancel experiment."""
    now = get_current_timestamp()

    experiments_collection.update_one(
        {'uuid': uuid},
        {'$set': {
            'status': 'CANCELLED',
            'current_phase': 'COMPLETED',
            'updated_at': now
        }}
    )

    log_activity(uuid, 'experiment_cancelled', {'reason': reason}, user_uuid)

    return get_experiment_by_uuid(uuid)


# Query helpers

def list_experiments(owner_uuid=None, status=None, view='active'):
    """List experiments with optional filters."""
    query = {}

    if owner_uuid:
        query['owner'] = owner_uuid

    if status:
        query['status'] = status
    elif view == 'active':
        query['status'] = {'$in': ['ACTIVE']}
    elif view == 'completed':
        query['status'] = 'COMPLETED'
    elif view == 'cancelled':
        query['status'] = 'CANCELLED'

    return list(experiments_collection.find(query).sort('created_at', -1))


def get_experiment_with_context(uuid):
    """Get experiment with related experiments count."""
    experiment = get_experiment_by_uuid(uuid)
    if not experiment:
        return None

    root_uuid = experiment.get('root_experiment_uuid') or uuid
    related_count = get_related_experiments_count(root_uuid)

    experiment['related_experiments_count'] = related_count
    return experiment

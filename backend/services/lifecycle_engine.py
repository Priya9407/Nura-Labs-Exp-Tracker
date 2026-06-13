"""
Experiment Lifecycle Engine - Centralized Workflow Control

Architecture Principles:
- ALL workflow logic lives here (no business logic in routes)
- Routes only validate requests and call engine methods
- Dynamic states are computed, never stored in DB
- All timestamps stored in UTC only

Phases:
  IDEA → BUILDING → WAITING_FOR_TEST → USER_TESTING → DECISION_PENDING → FINISHED

Experiment Statuses: ACTIVE, PAUSED, COMPLETED, CANCELLED, ARCHIVED
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
from enum import Enum
from utils.helpers import INDIA_TZ


class Phase(Enum):
    IDEA = "IDEA"
    BUILDING = "BUILDING"
    WAITING_FOR_TEST = "WAITING_FOR_TEST"
    USER_TESTING = "USER_TESTING"
    DECISION_PENDING = "DECISION_PENDING"
    FINISHED = "FINISHED"


# Fixed durations
BUILD_DURATION = 2
DEFAULT_TESTING_DURATION = 4


class ExperimentStatus(Enum):
    """Experiment-level statuses"""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ARCHIVED = "ARCHIVED"


class LifecycleEngine:
    """Automatic lifecycle calculation engine with variable testing."""

    @staticmethod
    def get_current_phase(timeline: Dict, status: str, decision: Dict = None) -> Phase:
        """Determine current phase based on timeline state."""
        if status == "COMPLETED" or status == "CANCELLED" or status == "ARCHIVED":
            return Phase.FINISHED

        if not timeline:
            return Phase.IDEA

        now = datetime.now(INDIA_TZ)

        build = timeline.get('build') or {}
        testing = timeline.get('testing') or {}

        # Get actual states
        build_started = build.get('actual_start') is not None
        build_completed = build.get('actual_end') is not None
        testing_started = testing.get('actual_start') is not None
        testing_completed = testing.get('actual_end') is not None
        testing_duration = testing.get('duration_days', DEFAULT_TESTING_DURATION)

        # Decision submitted
        if decision and decision.get('submitted_at'):
            return Phase.FINISHED

        # Testing in progress
        if testing_started and not testing_completed:
            return Phase.USER_TESTING

        # Waiting for testing to start
        if build_completed and not testing_started:
            return Phase.WAITING_FOR_TEST

        # Building in progress
        if build_started and not build_completed:
            return Phase.BUILDING

        # Not started
        return Phase.IDEA

    @staticmethod
    def generate_build_timeline(build_start_date: datetime) -> Dict[str, Any]:
        """Generate timeline for build phase (fixed 2 days)."""
        build_end = build_start_date + timedelta(days=BUILD_DURATION)

        return {
            'build': {
                'actual_start': build_start_date.isoformat(),
                'actual_end': None,
                'deadline': build_end.isoformat(),
                'extended_deadline': None,
                'extension_count': 0,
                'is_overdue': False,
                'is_completed': False
            },
            'testing': None,  # Will be set when build completes
            'decision': None
        }

    @staticmethod
    def generate_testing_timeline(build_end_date: datetime, duration_days: int = DEFAULT_TESTING_DURATION) -> Dict[str, Any]:
        """Generate timeline for testing phase with variable duration."""
        testing_start = build_end_date
        testing_end = testing_start + timedelta(days=duration_days)
        decision_deadline = testing_end + timedelta(days=1)

        return {
            'actual_start': testing_start.isoformat(),
            'actual_end': None,
            'deadline': testing_end.isoformat(),
            'extended_deadline': None,
            'extension_count': 0,
            'duration_days': duration_days,
            'is_overdue': False,
            'is_completed': False
        }, {
            'deadline': decision_deadline.isoformat(),
            'extended_deadline': None,
            'extension_count': 0
        }

    @staticmethod
    def generate_observation_schedule(testing_start: datetime, duration_days: int) -> List[Dict]:
        """
        Generate observation schedule for testing days.
        STORES ONLY: day_number and date (UTC)
        NO derived states stored (is_current, is_overdue, etc.)
        """
        schedule = []
        for day in range(1, duration_days + 1):
            observation_date = testing_start + timedelta(days=day - 1)
            schedule.append({
                'day_number': day,
                'date': observation_date.isoformat()  # UTC only
            })
        return schedule

    @staticmethod
    def get_build_status(timeline: Dict) -> Dict[str, Any]:
        """Get detailed build phase status."""
        if not timeline:
            return {'can_start': True, 'status': 'NOT_STARTED'}

        build = timeline.get('build') or {}
        if not build:
            return {'can_start': True, 'status': 'NOT_STARTED'}

        now = datetime.now(INDIA_TZ)
        start = LifecycleEngine._parse_date(build.get('actual_start'))
        deadline = LifecycleEngine._parse_date(build.get('extended_deadline') or build.get('deadline'))
        is_completed = build.get('is_completed', False) or build.get('actual_end') is not None

        if is_completed:
            return {'can_start': False, 'status': 'COMPLETED', 'completed': True}

        # Ensure both start and deadline are timezone-aware before any comparison
        if start and start.tzinfo is None:
            start = start.replace(tzinfo=INDIA_TZ)
        if deadline and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=INDIA_TZ)

        if start:
            if deadline and now > deadline:
                    return {
                        'can_start': False,
                        'status': 'OVERDUE',
                        'overdue': True,
                        'days_overdue': (now - deadline).days,
                        'deadline': build.get('deadline'),
                        'can_complete': True,
                        'can_extend': True
                    }

            days_elapsed = (now - start).days
            days_remaining = (deadline - now).days if deadline else 0

            return {
                'can_start': False,
                'status': 'IN_PROGRESS',
                'days_elapsed': days_elapsed,
                'days_remaining': max(0, days_remaining),
                'progress_percent': min(100, (days_elapsed / BUILD_DURATION) * 100),
                'deadline': build.get('deadline'),
                'can_complete': True,
                'can_extend': True
            }

        return {'can_start': True, 'status': 'NOT_STARTED'}

    @staticmethod
    def get_observation_status(timeline: Dict, observations: List[Dict]) -> Dict[str, Any]:
        """Get detailed observation status for testing phase."""
        if not timeline or not timeline.get('testing'):
            return {'is_testing': False, 'days': []}

        testing = timeline.get('testing', {})
        testing_start = LifecycleEngine._parse_date(testing.get('actual_start'))
        testing_end = LifecycleEngine._parse_date(testing.get('actual_end'))
        duration = testing.get('duration_days', DEFAULT_TESTING_DURATION)

        if not testing_start:
            return {'is_testing': False, 'days': []}

        now = datetime.now(INDIA_TZ)
        is_completed = testing_end is not None

        # Ensure testing_start is timezone-aware before any comparison
        if testing_start.tzinfo is None:
            testing_start = testing_start.replace(tzinfo=INDIA_TZ)

        # Calculate current day
        if is_completed:
            current_day = duration + 1
        else:
            current_day = (now - testing_start).days + 1
            if current_day < 1:
                current_day = 1

        # Build day status
        days = []
        submitted_days = {obs.get('day_number'): obs for obs in observations}

        for day_num in range(1, duration + 1):
            day_date = testing_start + timedelta(days=day_num - 1)
            is_submitted = day_num in submitted_days
            is_past = day_num < current_day
            is_today = day_num == current_day and not is_completed
            is_future = day_num > current_day

            days.append({
                'day_number': day_num,
                'date': day_date.isoformat(),
                'is_submitted': is_submitted,
                'is_current': is_today and not is_completed,
                'is_overdue': is_past and not is_submitted and not is_completed,
                'is_locked': is_future or is_completed,
                'can_submit': (is_today or is_past) and not is_submitted
            })

        # Count stats
        submitted_count = len([d for d in days if d['is_submitted']])
        overdue_count = len([d for d in days if d['is_overdue']])
        all_complete = submitted_count == duration

        # Calculate observation submission progress (e.g., 1 of 4 = 25%)
        submission_progress = min(100, (submitted_count / duration) * 100) if duration > 0 else 0

        return {
            'is_testing': not is_completed,
            'is_completed': is_completed,
            'current_day': min(current_day, duration) if not is_completed else None,
            'duration_days': duration,
            'submitted_count': submitted_count,
            'overdue_count': overdue_count,
            'all_complete': all_complete,
            'can_complete_testing': all_complete or (current_day > duration),
            'progress_percent': submission_progress,
            'days': days
        }

    @staticmethod
    def get_allowed_actions(experiment: Dict) -> List[Dict]:
        """Get list of allowed actions based on current state."""
        actions = []
        timeline = experiment.get('timeline')
        status = experiment.get('status', 'ACTIVE')

        if status != 'ACTIVE':
            return []

        if not timeline:
            # IDEA phase - can start building
            actions.append({
                'action': 'start_building',
                'label': 'Start Building',
                'description': 'Begin the 2-day build phase',
                'style': 'primary'
            })
            return actions

        build = timeline.get('build') or {}
        testing = timeline.get('testing', {})

        # Build phase
        if build and not build.get('is_completed') and not build.get('actual_end'):
            build_status = LifecycleEngine.get_build_status(timeline)

            if build_status['status'] == 'OVERDUE':
                actions.append({
                    'action': 'complete_building',
                    'label': 'Mark as Complete',
                    'description': 'Build is overdue but can be marked complete',
                    'style': 'success'
                })
                actions.append({
                    'action': 'extend_build',
                    'label': 'Request Extension',
                    'description': 'Extend build deadline',
                    'style': 'warning'
                })
            else:
                actions.append({
                    'action': 'complete_building',
                    'label': 'Mark as Complete',
                    'description': 'Mark build phase as complete',
                    'style': 'primary'
                })
                if build_status['days_remaining'] <= 1:
                    actions.append({
                        'action': 'extend_build',
                        'label': 'Request Extension',
                        'description': 'Extend build deadline',
                        'style': 'secondary'
                    })
            return actions

        # Waiting for test - can schedule or start now
        if build and build.get('is_completed') and not testing:
            # Check if already scheduled
            scheduled = experiment.get('scheduled_testing_start')
            if scheduled:
                actions.append({
                    'action': 'start_testing',
                    'label': 'Start Testing Now',
                    'description': f'Scheduled for {scheduled[:10]} but you can start anytime',
                    'style': 'primary',
                    'requires_input': True,
                    'input_label': 'Testing Duration (days)',
                    'input_type': 'number',
                    'input_min': 1,
                    'input_max': 14,
                    'input_default': experiment.get('scheduled_testing_duration', DEFAULT_TESTING_DURATION)
                })
                actions.append({
                    'action': 'reschedule_testing',
                    'label': 'Reschedule',
                    'description': 'Change scheduled testing date',
                    'style': 'secondary'
                })
            else:
                actions.append({
                    'action': 'start_testing',
                    'label': 'Start Testing Now',
                    'description': 'Begin testing immediately',
                    'style': 'primary',
                    'requires_input': True,
                    'input_label': 'Testing Duration (days)',
                    'input_type': 'number',
                    'input_min': 1,
                    'input_max': 14,
                    'input_default': DEFAULT_TESTING_DURATION
                })
                actions.append({
                    'action': 'schedule_testing',
                    'label': 'Schedule for Later',
                    'description': 'Plan testing for a future date',
                    'style': 'secondary'
                })
            return actions

        # Testing phase
        if testing and not testing.get('is_completed') and not testing.get('actual_end'):
            obs_status = LifecycleEngine.get_observation_status(timeline, experiment.get('observations', []))

            # Can complete if all observations done or time passed
            if obs_status['can_complete_testing']:
                actions.append({
                    'action': 'complete_testing',
                    'label': 'Complete Testing',
                    'description': 'Mark testing as complete and move to decision',
                    'style': 'success'
                })

            # Check if overdue
            testing_deadline = LifecycleEngine._parse_date(testing.get('extended_deadline') or testing.get('deadline'))
            if testing_deadline and testing_deadline.tzinfo is None:
                testing_deadline = testing_deadline.replace(tzinfo=INDIA_TZ)
            if testing_deadline and datetime.now(INDIA_TZ) > testing_deadline:
                actions.append({
                    'action': 'extend_testing',
                    'label': 'Request Extension',
                    'description': 'Testing is overdue - extend deadline',
                    'style': 'warning'
                })

            return actions

        # Decision pending
        if testing and testing.get('is_completed'):
            actions.append({
                'action': 'submit_decision',
                'label': 'Submit Decision',
                'description': 'Submit ADD/DROP/ITERATE decision',
                'style': 'primary'
            })
            return actions

        return actions

    @staticmethod
    def get_current_observation_day(timeline: Dict) -> Optional[int]:
        """Get current observation day based on testing timeline."""
        if not timeline or not timeline.get('testing'):
            return None

        testing = timeline.get('testing', {})
        testing_start = LifecycleEngine._parse_date(testing.get('actual_start'))
        testing_end = LifecycleEngine._parse_date(testing.get('actual_end'))
        duration = testing.get('duration_days', DEFAULT_TESTING_DURATION)

        if not testing_start:
            return None

        if testing_end:
            return None  # Testing completed

        now = datetime.now(INDIA_TZ)

        # Ensure testing_start is timezone-aware before comparison
        if testing_start.tzinfo is None:
            testing_start = testing_start.replace(tzinfo=INDIA_TZ)

        current_day = (now - testing_start).days + 1

        if current_day < 1:
            return 1
        if current_day > duration:
            return duration + 1  # Past all days

        return current_day

    @staticmethod
    def get_observation_schedule(timeline: Dict) -> Optional[List[Dict]]:
        """Get observation schedule with current day status."""
        if not timeline or not timeline.get('testing'):
            return None

        testing = timeline.get('testing', {})
        testing_start = LifecycleEngine._parse_date(testing.get('actual_start'))
        duration = testing.get('duration_days', DEFAULT_TESTING_DURATION)

        if not testing_start:
            return None

        now = datetime.now(INDIA_TZ)
        is_completed = testing.get('actual_end') is not None
        current_day = LifecycleEngine.get_current_observation_day(timeline)

        schedule = []
        for day_num in range(1, duration + 1):
            day_date = testing_start + timedelta(days=day_num - 1)
            is_past = day_num < (current_day or 0)
            is_today = day_num == current_day
            is_future = day_num > (current_day or 0)

            schedule.append({
                'day_number': day_num,
                'date': day_date.isoformat(),
                'is_past': is_past and not is_completed,
                'is_today': is_today and not is_completed,
                'is_future': is_future,
                'is_locked': is_future or is_completed,
                'can_submit': is_today and not is_completed
            })

        return schedule

    @staticmethod
    def extend_phase_timeline(timeline: Dict, phase: str, new_deadline: datetime, reason: str, user_uuid: str, current_phase: Phase = None) -> Optional[Dict]:
        """
        Extend deadline for a phase using Lifecycle Engine logic.
        Returns updated timeline and history entry.
        Centralized business logic for timeline extensions.

        Rule: Can ONLY extend the current active phase.
        """
        if not timeline:
            return None

        from utils.helpers import generate_uuid
        now = datetime.now(INDIA_TZ)

        # Determine which phase should be extendable based on current phase
        extendable_phase = None
        if current_phase == Phase.BUILDING:
            extendable_phase = 'build'
        elif current_phase == Phase.USER_TESTING:
            extendable_phase = 'testing'
        elif current_phase == Phase.DECISION_PENDING:
            extendable_phase = 'decision'

        # Validate: Can only extend the current active phase
        if phase != extendable_phase:
            return {
                'error': f'Can only extend the current active phase ({extendable_phase}), not {phase}'
            }

        phase_data = timeline.get(phase, {})
        current_deadline = phase_data.get('extended_deadline') or phase_data.get('deadline')

        history_entry = {
            'uuid': generate_uuid(),
            'phase': phase,
            'field': 'extended_deadline',
            'old_value': current_deadline,
            'new_value': new_deadline.isoformat(),
            'reason': reason,
            'updated_by': user_uuid,
            'updated_at': now.isoformat()
        }

        result = {
            'timeline': timeline,
            'history_entry': history_entry,
            'observation_schedule': None
        }

        if phase == 'testing':
            # Extend testing and shift decision
            old_testing_end = LifecycleEngine._parse_date(timeline['testing']['deadline'])
            extension_days = (new_deadline - old_testing_end).days

            timeline['testing']['extended_deadline'] = new_deadline.isoformat()
            timeline['testing']['extension_count'] = timeline['testing'].get('extension_count', 0) + 1

            # Shift decision deadline
            old_decision = LifecycleEngine._parse_date(timeline['decision']['deadline'])
            new_decision = old_decision + timedelta(days=extension_days)
            timeline['decision']['deadline'] = new_decision.isoformat()

            # Regenerate observation schedule
            testing_start = LifecycleEngine._parse_date(timeline['testing']['actual_start'])
            new_duration = timeline['testing'].get('duration_days', DEFAULT_TESTING_DURATION) + extension_days
            timeline['testing']['duration_days'] = new_duration

            result['observation_schedule'] = LifecycleEngine.generate_observation_schedule(
                testing_start, new_duration
            )
        else:
            # Simple extension for build/decision
            timeline[phase]['extended_deadline'] = new_deadline.isoformat()
            timeline[phase]['extension_count'] = timeline[phase].get('extension_count', 0) + 1

        return result

    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO date string to datetime."""
        if not date_str:
            return None
        try:
            if isinstance(date_str, datetime):
                return date_str.replace(tzinfo=INDIA_TZ) if date_str.tzinfo is None else date_str
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return None

    # =========================================================================
    # LIFECYCLE ACTIONS - Routes call these methods
    # =========================================================================

    @staticmethod
    def start_build(timeline: Optional[Dict], start_date: datetime) -> Dict[str, Any]:
        """
        Start building phase.
        Returns: {timeline, observation_schedule: None}
        """
        build_timeline = LifecycleEngine.generate_build_timeline(start_date)
        return {
            'timeline': build_timeline,
            'observation_schedule': None,
            'phase': Phase.BUILDING
        }

    @staticmethod
    def complete_build(timeline: Dict) -> Dict[str, Any]:
        """
        Mark build phase as complete.
        Returns: {timeline, can_start_testing: bool}
        """
        now = datetime.now(INDIA_TZ).isoformat()
        timeline['build']['actual_end'] = now
        timeline['build']['is_completed'] = True

        return {
            'timeline': timeline,
            'can_start_testing': True,
            'phase': Phase.WAITING_FOR_TEST
        }

    @staticmethod
    def start_testing(timeline: Dict, testing_start: datetime, duration_days: int) -> Dict[str, Any]:
        """
        Start testing phase with given duration.
        Returns: {timeline, observation_schedule, phase}
        """
        testing_timeline, decision_timeline = LifecycleEngine.generate_testing_timeline(
            testing_start, duration_days
        )

        timeline['testing'] = testing_timeline
        timeline['decision'] = decision_timeline

        observation_schedule = LifecycleEngine.generate_observation_schedule(
            testing_start, duration_days
        )

        return {
            'timeline': timeline,
            'observation_schedule': observation_schedule,
            'phase': Phase.USER_TESTING
        }

    @staticmethod
    def complete_testing(timeline: Dict) -> Dict[str, Any]:
        """
        Mark testing phase as complete.
        Returns: {timeline, phase}
        """
        now = datetime.now(INDIA_TZ).isoformat()
        timeline['testing']['actual_end'] = now
        timeline['testing']['is_completed'] = True

        return {
            'timeline': timeline,
            'phase': Phase.DECISION_PENDING
        }

    @staticmethod
    def submit_decision(timeline: Dict, decision: str, reason: str, submitted_by: str) -> Dict[str, Any]:
        """
        Submit final decision.
        Returns: {decision_data, should_create_iteration, should_complete_experiment}
        """
        now = datetime.now(INDIA_TZ)

        decision_data = {
            'decision': decision,
            'reason': reason,
            'submitted_by': submitted_by,
            'submitted_at': now.isoformat(),
            'locked': True
        }

        return {
            'decision_data': decision_data,
            'should_create_iteration': decision == 'ITERATE',
            'should_complete_experiment': decision in ['ADD', 'DROP'],
            'phase': Phase.FINISHED
        }

    @staticmethod
    def pause_iteration(timeline: Dict, reason: str, paused_by: str) -> Dict[str, Any]:
        """
        Pause current iteration.
        Returns: {paused_at, reason, paused_by, status}
        """
        now = datetime.now(INDIA_TZ)

        return {
            'paused_at': now.isoformat(),
            'reason': reason,
            'paused_by': paused_by,
            'status': ExperimentStatus.PAUSED.value
        }

    @staticmethod
    def resume_iteration(timeline: Dict) -> Dict[str, Any]:
        """
        Resume paused iteration.
        Returns: {resumed_at, status}
        """
        now = datetime.now(INDIA_TZ)

        return {
            'resumed_at': now.isoformat(),
            'status': ExperimentStatus.ACTIVE.value
        }

    # =========================================================================
    # TIMELINE REPAIR TOOLS (Admin use)
    # =========================================================================

    @staticmethod
    def shift_future_dates(timeline: Dict, shift_days: int) -> Dict[str, Any]:
        """
        Shift all future phase dates by given days.
        Used for operational recovery.
        """
        if not timeline:
            return {'timeline': timeline, 'shifts': []}

        shifts = []
        now = datetime.now(INDIA_TZ)

        for phase in ['build', 'testing', 'decision']:
            phase_data = timeline.get(phase)
            if not phase_data:
                continue

            # Check if phase is still active (not completed)
            is_completed = phase_data.get('is_completed', False)
            actual_end = phase_data.get('actual_end')

            if is_completed or actual_end:
                continue  # Don't shift completed phases

            # Shift deadlines
            old_deadline = LifecycleEngine._parse_date(
                phase_data.get('extended_deadline') or phase_data.get('deadline')
            )
            if old_deadline:
                new_deadline = old_deadline + timedelta(days=shift_days)
                phase_data['extended_deadline'] = new_deadline.isoformat()
                shifts.append({
                    'phase': phase,
                    'old_deadline': old_deadline.isoformat(),
                    'new_deadline': new_deadline.isoformat(),
                    'shift_days': shift_days
                })

        return {'timeline': timeline, 'shifts': shifts}

    @staticmethod
    def repair_timeline(timeline: Dict, testing_start: datetime = None, duration_days: int = None) -> Dict[str, Any]:
        """
        Repair broken timeline.
        Rebuilds observation schedule and fixes date continuity.
        """
        if not timeline:
            return {'timeline': timeline, 'observation_schedule': None}

        # Rebuild testing timeline if start date provided
        if testing_start and duration_days:
            testing_timeline, decision_timeline = LifecycleEngine.generate_testing_timeline(
                testing_start, duration_days
            )
            timeline['testing'] = testing_timeline
            timeline['decision'] = decision_timeline

            observation_schedule = LifecycleEngine.generate_observation_schedule(
                testing_start, duration_days
            )

            return {
                'timeline': timeline,
                'observation_schedule': observation_schedule,
                'repaired': True
            }

        return {'timeline': timeline, 'observation_schedule': None, 'repaired': False}

    # =========================================================================
    # OBSERVATION VALIDATION
    # =========================================================================

    @staticmethod
    def can_submit_observation(timeline: Dict, day_number: int, existing_observations: List[Dict]) -> Tuple[bool, str]:
        """
        Check if observation can be submitted for given day.
        Rules:
        - One observation per day maximum
        - No future day submissions (can submit for today or any past day)
        """
        if not timeline or not timeline.get('testing'):
            return False, "Not in testing phase"

        testing = timeline.get('testing', {})
        testing_start = LifecycleEngine._parse_date(testing.get('actual_start'))
        testing_end = LifecycleEngine._parse_date(testing.get('actual_end'))
        duration = testing.get('duration_days', DEFAULT_TESTING_DURATION)

        if not testing_start:
            return False, "Testing has not started"

        if testing_end:
            return False, "Testing phase is complete"

        # Validate day number range
        if day_number < 1 or day_number > duration:
            return False, f"Day must be between 1 and {duration}"

        # Check if already submitted
        existing = [obs for obs in existing_observations if obs.get('day_number') == day_number]
        if existing:
            return False, f"Observation for Day {day_number} already exists. Use edit instead."

        # Ensure testing_start is timezone-aware before comparison
        if testing_start.tzinfo is None:
            testing_start = testing_start.replace(tzinfo=INDIA_TZ)

        # Check if future day - can submit for today or any past day
        now = datetime.now(INDIA_TZ)
        current_day = (now - testing_start).days + 1

        if day_number > current_day:
            return False, f"Cannot submit for future Day {day_number}. Current day is {current_day}."

        return True, "Can submit"

    @staticmethod
    def can_edit_observation(observation: Dict, timeline: Dict) -> Tuple[bool, str]:
        """
        Check if observation can be edited.
        Rules:
        - Can edit if testing phase still active
        - Cannot edit if experiment completed/cancelled
        """
        if not timeline:
            return False, "No timeline"

        testing = timeline.get('testing', {})
        testing_end = testing.get('actual_end')

        if testing_end:
            return False, "Cannot edit: testing phase is complete"

        return True, "Can edit"

    @staticmethod
    def get_remaining_days(timeline: Dict, current_phase: str) -> Optional[Dict[str, int]]:
        """
        Calculate remaining days for each phase before cancellation.
        Used for activity logging.
        """
        if not timeline:
            return None

        now = datetime.now(INDIA_TZ)
        result = {}

        if current_phase == 'BUILDING' and timeline.get('build'):
            build = timeline['build']
            deadline = LifecycleEngine._parse_date(build.get('extended_deadline') or build.get('deadline'))
            if deadline:
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=INDIA_TZ)
                result['build_remaining'] = max(0, (deadline - now).days)

        elif current_phase in ['USER_TESTING', 'DECISION_PENDING'] and timeline.get('testing'):
            testing = timeline['testing']
            testing_end = LifecycleEngine._parse_date(testing.get('extended_deadline') or testing.get('deadline'))
            if testing_end:
                if testing_end.tzinfo is None:
                    testing_end = testing_end.replace(tzinfo=INDIA_TZ)
                result['testing_remaining'] = max(0, (testing_end - now).days)

            if timeline.get('decision'):
                decision_deadline = LifecycleEngine._parse_date(
                    timeline['decision'].get('extended_deadline') or timeline['decision'].get('deadline')
                )
                if decision_deadline:
                    if decision_deadline.tzinfo is None:
                        decision_deadline = decision_deadline.replace(tzinfo=INDIA_TZ)
                    result['decision_remaining'] = max(0, (decision_deadline - now).days)

        return result if result else None

    @staticmethod
    def reopen_experiment(
        timeline: Dict,
        current_phase: str,
        observation_schedule: List[Dict]
    ) -> Dict[str, Any]:
        """
        Recalculate timeline when reopening a cancelled experiment.

        Rules:
        - Preserves continuity
        - Adjusts for time passed during cancellation
        - Recalculates observation schedule if needed
        """
        if not timeline:
            return {
                'timeline': timeline,
                'observation_schedule': observation_schedule,
                'timeline_adjusted': False,
                'days_shifted': 0
            }

        now = datetime.now(INDIA_TZ)
        result = {
            'timeline': timeline,
            'observation_schedule': observation_schedule,
            'timeline_adjusted': False,
            'days_shifted': 0
        }

        # Recalculate for testing phase if needed
        if current_phase == 'USER_TESTING' and timeline.get('testing'):
            testing = timeline['testing']
            testing_start = LifecycleEngine._parse_date(testing.get('actual_start'))
            testing_end = LifecycleEngine._parse_date(
                testing.get('extended_deadline') or testing.get('deadline')
            )

            if testing_start and testing_end:
                # Ensure testing_start is timezone-aware before comparison
                if testing_start.tzinfo is None:
                    testing_start = testing_start.replace(tzinfo=INDIA_TZ)

                # Calculate how many days have passed since testing started
                days_since_start = (now - testing_start).days
                original_duration = testing.get('duration_days', DEFAULT_TESTING_DURATION)

                # If testing would have ended during cancellation, extend it
                if days_since_start >= original_duration:
                    # Testing period has passed, extend by minimum duration
                    new_duration = DEFAULT_TESTING_DURATION
                    testing['duration_days'] = new_duration
                    new_end = now + timedelta(days=new_duration)
                    testing['extended_deadline'] = new_end.isoformat()

                    # Recalculate observation schedule
                    result['observation_schedule'] = LifecycleEngine.generate_observation_schedule(
                        now, new_duration
                    )
                    result['timeline_adjusted'] = True
                    result['days_shifted'] = new_duration

        return result

    # =========================================================================
    # CANCELLATION VALIDATION
    # =========================================================================

    @staticmethod
    def can_cancel_experiment(experiment: Dict, iteration: Dict) -> Tuple[bool, str]:
        """
        Check if experiment can be cancelled.
        Rules:
        - Can cancel at any phase (IDEA through DECISION_PENDING)
        - Cannot cancel already cancelled experiments
        - Cannot cancel completed experiments
        """
        if not experiment:
            return False, "Experiment not found"

        status = experiment.get('status')
        if status == 'CANCELLED':
            return False, "Experiment already cancelled"
        if status == 'COMPLETED':
            return False, "Cannot cancel completed experiments"
        if status == 'ARCHIVED':
            return False, "Cannot cancel archived experiments"

        # Check iteration status
        iter_status = iteration.get('status')
        if iter_status == 'CANCELLED':
            return False, "Iteration already cancelled"

        return True, "Can cancel"

    @staticmethod
    def get_cancelled_display_info(experiment: Dict, iteration: Dict) -> Dict[str, Any]:
        """
        Get display info for a cancelled experiment.
        Used by frontend to show cancellation details.
        """
        exp_cancellation = experiment.get('cancellation', {})
        iter_cancellation = iteration.get('cancellation', {})

        # Use experiment-level cancellation info as primary
        return {
            'is_cancelled': True,
            'cancelled_at': experiment.get('cancelled_at') or iteration.get('cancelled_at'),
            'cancelled_by': experiment.get('cancelled_by') or iteration.get('cancelled_by'),
            'reason': experiment.get('cancellation_reason') or iteration.get('cancellation_reason'),
            'phase_at_cancellation': exp_cancellation.get('phase_at_cancellation', 'UNKNOWN'),
            'is_read_only': True
        }

    # =========================================================================
    # PAUSE / RESUME FUNCTIONALITY
    # =========================================================================

    @staticmethod
    def pause_phase(timeline: Dict, phase: str, reason: str = '') -> Dict[str, Any]:
        """
        Pause the current phase to work on higher priority tasks.

        Rules:
        - Can pause BUILDING or USER_TESTING phases
        - Stores pause timestamp and calculates remaining time
        - Cannot pause if already paused
        """
        if not timeline:
            return {'success': False, 'error': 'No timeline', 'timeline': timeline}

        phase_key = phase.lower()
        if phase_key not in ['build', 'testing']:
            return {'success': False, 'error': 'Only BUILDING and USER_TESTING phases can be paused', 'timeline': timeline}

        phase_data = timeline.get(phase_key)
        if not phase_data:
            return {'success': False, 'error': f'Phase {phase} not started', 'timeline': timeline}

        if phase_data.get('is_completed'):
            return {'success': False, 'error': 'Phase already completed', 'timeline': timeline}

        if phase_data.get('is_paused'):
            return {'success': False, 'error': 'Phase already paused', 'timeline': timeline}

        now = datetime.now(INDIA_TZ).isoformat()

        # Store pause info
        phase_data['is_paused'] = True
        phase_data['paused_at'] = now
        phase_data['pause_reason'] = reason

        return {
            'success': True,
            'message': f'{phase} phase paused successfully',
            'timeline': timeline
        }

    @staticmethod
    def resume_phase(timeline: Dict, phase: str) -> Dict[str, Any]:
        """
        Resume a paused phase.

        Rules:
        - Extends the deadline by the paused duration
        - Clears pause state
        """
        if not timeline:
            return {'success': False, 'error': 'No timeline', 'timeline': timeline}

        phase_key = phase.lower()
        if phase_key not in ['build', 'testing']:
            return {'success': False, 'error': 'Invalid phase', 'timeline': timeline}

        phase_data = timeline.get(phase_key)
        if not phase_data:
            return {'success': False, 'error': f'Phase {phase} not started', 'timeline': timeline}

        if not phase_data.get('is_paused'):
            return {'success': False, 'error': 'Phase is not paused', 'timeline': timeline}

        now = datetime.now(INDIA_TZ)
        paused_at = LifecycleEngine._parse_date(phase_data.get('paused_at'))

        if paused_at:
            # Calculate paused duration
            paused_duration = now - paused_at
            days_paused = paused_duration.days

            # Extend the deadline
            current_deadline = LifecycleEngine._parse_date(phase_data.get('deadline'))
            if current_deadline:
                new_deadline = current_deadline + timedelta(days=days_paused + 1)  # +1 to ensure full day
                phase_data['deadline'] = new_deadline.isoformat()

        # Clear pause state
        phase_data['is_paused'] = False
        phase_data['resumed_at'] = now.isoformat()

        return {
            'success': True,
            'message': f'{phase} phase resumed. Deadline extended.',
            'timeline': timeline
        }

    @staticmethod
    def get_pause_status(timeline: Dict) -> Dict[str, Any]:
        """Get pause status for all phases."""
        if not timeline:
            return {'is_paused': False}

        paused_phases = []

        for phase_key in ['build', 'testing']:
            phase_data = timeline.get(phase_key)
            if phase_data and phase_data.get('is_paused'):
                paused_phases.append({
                    'phase': phase_key.upper(),
                    'paused_at': phase_data.get('paused_at'),
                    'reason': phase_data.get('pause_reason', '')
                })

        return {
            'is_paused': len(paused_phases) > 0,
            'paused_phases': paused_phases
        }


# Singleton
lifecycle_engine = LifecycleEngine()

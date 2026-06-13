"""
API Documentation Routes - Swagger-like documentation
"""
from flask import Blueprint, jsonify
from functools import wraps

API_DOCS = {
    "auth": {
        "base_path": "/api/auth",
        "description": "Authentication endpoints",
        "routes": [
            {
                "path": "/api/auth/login",
                "method": "POST",
                "description": "Login with email and password",
                "auth_required": False,
                "request": {
                    "email": "string (required)",
                    "password": "string (required)"
                },
                "response": {
                    "success": "boolean",
                    "user": {
                        "uuid": "string",
                        "name": "string",
                        "email": "string",
                        "role": "ADMIN|MEMBER"
                    }
                },
                "errors": ["INVALID_CREDENTIALS", "MISSING_FIELDS"]
            },
            {
                "path": "/api/auth/logout",
                "method": "POST",
                "description": "Logout current user",
                "auth_required": True,
                "request": {},
                "response": {"success": "boolean"},
                "errors": ["UNAUTHORIZED"]
            },
            {
                "path": "/api/auth/me",
                "method": "GET",
                "description": "Get current authenticated user",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "user": "User object"
                },
                "errors": ["UNAUTHORIZED"]
            }
        ]
    },
    "users": {
        "base_path": "/api/users",
        "description": "User management endpoints",
        "routes": [
            {
                "path": "/api/users",
                "method": "GET",
                "description": "List all users (Admin only)",
                "auth_required": True,
                "role_required": "ADMIN",
                "request": {},
                "response": {
                    "success": "boolean",
                    "users": "Array of User objects"
                },
                "errors": ["UNAUTHORIZED", "FORBIDDEN"]
            },
            {
                "path": "/api/users/invite",
                "method": "POST",
                "description": "Invite a new user (Admin only)",
                "auth_required": True,
                "role_required": "ADMIN",
                "request": {
                    "email": "string (required)",
                    "name": "string (required)",
                    "role": "ADMIN|MEMBER (default: MEMBER)"
                },
                "response": {
                    "success": "boolean",
                    "message": "string"
                },
                "errors": ["USER_EXISTS", "INVALID_EMAIL", "EMAIL_FAILED"]
            },
            {
                "path": "/api/users/activate",
                "method": "POST",
                "description": "Activate invited user account by setting password",
                "auth_required": False,
                "request": {
                    "token": "string (required) - Invitation token from email",
                    "password": "string (required, min 8 chars) - Password to set"
                },
                "response": {
                    "success": "boolean",
                    "user": "User object"
                },
                "errors": ["INVALID_TOKEN", "INVALID_PASSWORD", "USER_EXISTS"],
                "note": "User can also login with temp password from email without activating"
            },
            {
                "path": "/api/users/me",
                "method": "GET",
                "description": "Get current user info",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "user": "User object"
                },
                "errors": ["UNAUTHORIZED"]
            }
        ]
    },
    "experiments": {
        "base_path": "/api/experiments",
        "description": "Experiment CRUD and management",
        "routes": [
            {
                "path": "/api/experiments",
                "method": "GET",
                "description": "List all experiments with optional filters",
                "auth_required": True,
                "query_params": {
                    "view": "all|active|my|archived",
                    "status": "ACTIVE|COMPLETED|ARCHIVED|CANCELLED",
                    "phase": "IDEA|BUILDING|WAITING_FOR_TEST|USER_TESTING|DECISION_PENDING|FINISHED"
                },
                "request": {},
                "response": {
                    "success": "boolean",
                    "experiments": "Array of Experiment objects"
                },
                "errors": []
            },
            {
                "path": "/api/experiments",
                "method": "POST",
                "description": "Create new experiment",
                "auth_required": True,
                "request": {
                    "title": "string (required)",
                    "domain": "string",
                    "assumption_statement": "string",
                    "target_user": "string",
                    "timeline": {
                        "build": {"planned_start": "date", "planned_end": "date", "deadline": "date"},
                        "testing": {"planned_start": "date", "planned_end": "date", "deadline": "date"},
                        "decision": {"deadline": "date"}
                    }
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["MISSING_FIELDS", "VALIDATION_ERROR"]
            },
            {
                "path": "/api/experiments/{uuid}",
                "method": "GET",
                "description": "Get single experiment by UUID",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND"]
            },
            {
                "path": "/api/experiments/{uuid}",
                "method": "PUT",
                "description": "Update experiment (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {
                    "title": "string",
                    "domain": "string",
                    "assumption_statement": "string",
                    "target_user": "string"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN"]
            },
            {
                "path": "/api/experiments/{uuid}",
                "method": "DELETE",
                "description": "Archive/soft-delete experiment (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {},
                "response": {
                    "success": "boolean",
                    "message": "string"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN"]
            },
            {
                "path": "/api/experiments/{uuid}/cancel",
                "method": "POST",
                "description": "Cancel experiment (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {},
                "response": {
                    "success": "boolean",
                    "message": "string"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN"]
            },
            {
                "path": "/api/experiments/{uuid}/phase",
                "method": "PATCH",
                "description": "Update experiment phase (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {
                    "phase": "IDEA|BUILDING|WAITING_FOR_TEST|USER_TESTING|DECISION_PENDING|FINISHED"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "SAME_PHASE"]
            },
            {
                "path": "/api/experiments/{uuid}/extend",
                "method": "POST",
                "description": "Extend deadline with reason (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {
                    "phase": "build|testing|decision",
                    "new_deadline": "date",
                    "reason": "string (required, min 10 chars)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "REASON_REQUIRED", "INVALID_EXTENSION"]
            },
            {
                "path": "/api/experiments/{uuid}/observations",
                "method": "GET",
                "description": "Get all observations for experiment",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "observations": "Array of Observation objects"
                },
                "errors": ["NOT_FOUND"]
            },
            {
                "path": "/api/experiments/{uuid}/observations",
                "method": "POST",
                "description": "Add observation to experiment",
                "auth_required": True,
                "request": {
                    "content": "string (required, min 5 chars)",
                    "metrics": "object (optional)"
                },
                "response": {
                    "success": "boolean",
                    "observation": "Observation object"
                },
                "errors": ["NOT_FOUND", "CONTENT_TOO_SHORT", "EXPERIMENT_INACTIVE"]
            },
            {
                "path": "/api/experiments/{uuid}/observations/{observation_uuid}",
                "method": "PUT",
                "description": "Edit an existing observation (Owner only, during testing phase)",
                "auth_required": True,
                "permissions": "Owner",
                "request": {
                    "content": "string (required, min 5 chars)",
                    "metrics": "object (optional)"
                },
                "response": {
                    "success": "boolean",
                    "observation": "Observation object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "EDIT_FAILED", "NOT_IN_TESTING"]
            },
            {
                "path": "/api/experiments/{uuid}/observations/{observation_uuid}",
                "method": "DELETE",
                "description": "Delete an observation (Owner only, during testing phase)",
                "auth_required": True,
                "permissions": "Owner",
                "request": {},
                "response": {
                    "success": "boolean",
                    "message": "string"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "NOT_IN_TESTING"]
            },
            {
                "path": "/api/experiments/{uuid}/observations/schedule",
                "method": "GET",
                "description": "Get observation schedule for current iteration",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "schedule": "Array of observation days"
                },
                "errors": ["NOT_FOUND", "TIMELINE_NOT_STARTED"]
            },
            {
                "path": "/api/experiments/{uuid}/iterations/{iteration_no}/observations",
                "method": "GET",
                "description": "Get observations for specific iteration",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "observations": "Array of Observation objects"
                },
                "errors": ["NOT_FOUND"]
            },
            {
                "path": "/api/experiments/{uuid}/iterations/{iteration_no}/observations/schedule",
                "method": "GET",
                "description": "Get observation schedule for specific iteration",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "schedule": "Array of observation days"
                },
                "errors": ["NOT_FOUND", "TIMELINE_NOT_STARTED"]
            },
            {
                "path": "/api/experiments/{uuid}/decision",
                "method": "POST",
                "description": "Submit final decision (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {
                    "decision": "ADD|DROP|ITERATE",
                    "reason": "string (required, min 20 chars)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "DECISION_LOCKED", "REASON_TOO_SHORT"]
            },
            {
                "path": "/api/experiments/{uuid}/decision/override",
                "method": "POST",
                "description": "Override decision (Admin only)",
                "auth_required": True,
                "role_required": "ADMIN",
                "request": {
                    "decision": "ADD|DROP|ITERATE",
                    "reason": "string (required, min 20 chars)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "NO_DECISION", "REASON_TOO_SHORT"]
            },
            {
                "path": "/api/experiments/{uuid}/start",
                "method": "POST",
                "description": "Start building phase",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "INVALID_PHASE"]
            },
            {
                "path": "/api/experiments/{uuid}/complete-build",
                "method": "POST",
                "description": "Mark build phase as complete",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "INVALID_PHASE"]
            },
            {
                "path": "/api/experiments/{uuid}/start-testing",
                "method": "POST",
                "description": "Start user testing phase",
                "auth_required": True,
                "request": {
                    "duration_days": "integer (1-14, default: 4)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "INVALID_PHASE", "INVALID_DURATION"]
            },
            {
                "path": "/api/experiments/{uuid}/schedule-testing",
                "method": "POST",
                "description": "Schedule testing for a future date",
                "auth_required": True,
                "request": {
                    "scheduled_date": "date (required)",
                    "duration_days": "integer (1-14, default: 4)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "INVALID_PHASE", "INVALID_DATE", "PAST_DATE"]
            },
            {
                "path": "/api/experiments/{uuid}/complete-testing",
                "method": "POST",
                "description": "Mark testing phase as complete",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "INVALID_PHASE"]
            },
            {
                "path": "/api/experiments/{uuid}/pause",
                "method": "POST",
                "description": "Pause experiment (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {
                    "reason": "string (required, min 10 chars)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "REASON_REQUIRED"]
            },
            {
                "path": "/api/experiments/{uuid}/resume",
                "method": "POST",
                "description": "Resume paused experiment (Owner or Admin)",
                "auth_required": True,
                "permissions": "Owner or Admin",
                "request": {},
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "NOT_PAUSED"]
            },
            {
                "path": "/api/experiments/{uuid}/reopen",
                "method": "POST",
                "description": "Reopen cancelled experiment (Admin only)",
                "auth_required": True,
                "role_required": "ADMIN",
                "request": {
                    "reason": "string (optional)"
                },
                "response": {
                    "success": "boolean",
                    "experiment": "Experiment object"
                },
                "errors": ["NOT_FOUND", "FORBIDDEN", "NOT_CANCELLED"]
            },
            {
                "path": "/api/experiments/{uuid}/iterations",
                "method": "GET",
                "description": "Get all iterations for experiment",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "iterations": "Array of Iteration objects"
                },
                "errors": ["NOT_FOUND"]
            },
            {
                "path": "/api/experiments/{uuid}/iterations/{iteration_no}",
                "method": "GET",
                "description": "Get specific iteration details",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "iteration": "Iteration object"
                },
                "errors": ["NOT_FOUND"]
            },
            {
                "path": "/api/experiments/{uuid}/activities",
                "method": "GET",
                "description": "Get activity logs for experiment",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "activities": "Array of Activity objects"
                },
                "errors": ["NOT_FOUND"]
            }
        ]
    },
    "health": {
        "base_path": "/api/health",
        "description": "Health check",
        "routes": [
            {
                "path": "/api/health",
                "method": "GET",
                "description": "Check API health status",
                "auth_required": False,
                "request": {},
                "response": {
                    "success": "boolean",
                    "status": "string",
                    "timestamp": "string",
                    "version": "string"
                },
                "errors": []
            }
        ]
    },
    "activities": {
        "base_path": "/api/activities",
        "description": "Activity logs and audit trail",
        "routes": [
            {
                "path": "/api/activities",
                "method": "GET",
                "description": "Get all activity logs (with filters)",
                "auth_required": True,
                "query_params": {
                    "experiment_uuid": "string (optional)",
                    "user_uuid": "string (optional)",
                    "activity_type": "string (optional)",
                    "limit": "integer (default: 50)",
                    "offset": "integer (default: 0)"
                },
                "request": {},
                "response": {
                    "success": "boolean",
                    "activities": "Array of Activity objects",
                    "total": "integer"
                },
                "errors": []
            },
            {
                "path": "/api/experiments/{uuid}/activities",
                "method": "GET",
                "description": "Get activities for specific experiment",
                "auth_required": True,
                "request": {},
                "response": {
                    "success": "boolean",
                    "activities": "Array of Activity objects"
                },
                "errors": ["NOT_FOUND"]
            }
        ]
    }
}

# Create Blueprint
docs_bp = Blueprint('docs', __name__, url_prefix='/api')

@docs_bp.route('/docs', methods=['GET'])
def get_api_docs():
    """Get complete API documentation."""
    return jsonify({
        'success': True,
        'api': {
            'name': 'Nura AI Labs API',
            'version': '1.0.0',
            'description': 'Experiment Lifecycle Management Platform API',
            'base_url': 'http://localhost:5000/api',
            'authentication': 'Session-based (Redis stored)'
        },
        'endpoints': API_DOCS
    })

@docs_bp.route('/docs/<category>', methods=['GET'])
def get_category_docs(category):
    """Get documentation for specific category."""
    if category not in API_DOCS:
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': f'Category "{category}" not found. Available: {", ".join(API_DOCS.keys())}'
            }
        }), 404

    return jsonify({
        'success': True,
        'category': API_DOCS[category]
    })

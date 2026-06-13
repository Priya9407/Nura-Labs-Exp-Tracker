import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
from config.settings import Config
from services.redis_service import redis_service
from models.user import check_initial_admin

# Import blueprints
from routes.auth import auth_bp
from routes.users import users_bp
from routes.experiments import experiments_bp
from routes.observations import observations_bp
from routes.activity_logs import activity_logs_bp
from routes.docs import docs_bp

# Create Flask app
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
dist_dir = os.path.join(frontend_dir, 'dist')

app = Flask(__name__, static_folder=dist_dir)
app.config['SECRET_KEY'] = Config.SECRET_KEY

# Configure CORS
CORS(app, supports_credentials=True, origins=[Config.FRONTEND_URL])

# Register blueprints BEFORE the catch-all route
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(experiments_bp)
app.register_blueprint(observations_bp)
app.register_blueprint(activity_logs_bp)
app.register_blueprint(docs_bp)

# Debug: Print registered routes
print("\nRegistered Routes:")
for rule in app.url_map.iter_rules():
    if rule.endpoint != 'static':
        print(f"  {rule.rule} [{','.join(rule.methods - {'OPTIONS', 'HEAD'})}] -> {rule.endpoint}")
print()

# Global error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': {
            'code': 'NOT_FOUND',
            'message': 'Resource not found'
        }
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        'success': False,
        'error': {
            'code': 'INTERNAL_ERROR',
            'message': 'Internal server error'
        }
    }), 500

# Health check - explicit API route
@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    print("GET /api/health called")
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# API Documentation - Swagger-like
@app.route('/api/docs')
def api_docs():
    """Return API documentation."""
    routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static' and str(rule).startswith('/api/'):
            # Get docstring from the endpoint function
            view_func = app.view_functions.get(rule.endpoint)
            doc = view_func.__doc__ if view_func else None

            routes.append({
                'path': str(rule),
                'methods': list(rule.methods - {'OPTIONS', 'HEAD'}),
                'endpoint': rule.endpoint,
                'description': doc.strip() if doc else None
            })

    return jsonify({
        'success': True,
        'api_version': '1.0.0',
        'base_url': Config.BACKEND_URL,
        'total_routes': len(routes),
        'routes': sorted(routes, key=lambda x: x['path'])
    })

# Test endpoint for debugging
@app.route('/api/test')
def test_endpoint():
    """Test endpoint to verify API is working."""
    return jsonify({
        'success': True,
        'message': 'API is working',
        'routes': [str(rule) for rule in app.url_map.iter_rules() if 'api' in str(rule)]
    })

# Serve React app - MUST BE LAST
# This catch-all must be registered after all blueprints
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React SPA - all routes return index.html for client-side routing."""
    # Check for static files (JS, CSS, images, etc.)
    if path:
        file_path = os.path.join(dist_dir, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(dist_dir, path)

    # Serve index.html for all other routes (client-side routing)
    index_path = os.path.join(dist_dir, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(dist_dir, 'index.html')

    # If dist folder doesn't exist yet, return helpful message
    return jsonify({
        'success': False,
        'error': {
            'code': 'FRONTEND_NOT_BUILT',
            'message': 'Frontend not built. Run "npm run build" in the frontend directory.'
        }
    }), 404

# Initialize
with app.app_context():
    # Check and create initial admin
    check_initial_admin()

if __name__ == '__main__':
    print(f"Starting Flask server on port {Config.FLASK_PORT}")
    print(f"Environment: {Config.FLASK_ENV}")
    print(f"Access the app at: http://0.0.0.0:{Config.FLASK_PORT}")
    print(f"For WiFi access, use your computer's IP address (e.g., http://172.31.96.72:{Config.FLASK_PORT})")
    app.run(host='0.0.0.0', port=Config.FLASK_PORT, debug=Config.FLASK_ENV == 'development')

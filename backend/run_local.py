"""
Run Flask backend locally with local MongoDB.

Prerequisites:
1. MongoDB running locally on port 27017
2. Redis running locally on port 6379 (optional)

To start MongoDB locally:
- Windows: mongod --dbpath C:\data\db
- macOS: brew services start mongodb-community
- Linux: sudo systemctl start mongod

To start Redis locally:
- Windows: redis-server
- macOS: brew services start redis
- Linux: sudo systemctl start redis
"""
import os
import sys

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
from routes.phases import phases_bp
from routes.activity_logs import activity_logs_bp
from routes.docs import docs_bp

# Create Flask app
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
dist_dir = os.path.join(frontend_dir, 'dist')

app = Flask(__name__, static_folder=dist_dir)
app.config['SECRET_KEY'] = Config.SECRET_KEY

# Configure CORS for local development
CORS(app, supports_credentials=True, origins=[
    Config.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
])

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(users_bp)
app.register_blueprint(experiments_bp)
app.register_blueprint(observations_bp)
app.register_blueprint(phases_bp)
app.register_blueprint(activity_logs_bp)
app.register_blueprint(docs_bp)

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

# Health check
@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    from datetime import datetime
    from pymongo import MongoClient

    health = {
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'services': {}
    }

    # Check MongoDB
    try:
        client = MongoClient(Config.MONGODB_URL, serverSelectionTimeoutMS=2000)
        client.server_info()
        health['services']['mongodb'] = 'connected'
    except Exception as e:
        health['services']['mongodb'] = f'disconnected: {str(e)}'
        health['status'] = 'degraded'

    # Check Redis
    try:
        redis_service.ping()
        health['services']['redis'] = 'connected'
    except Exception as e:
        health['services']['redis'] = f'disconnected: {str(e)}'

    return jsonify(health)

# API Documentation
@app.route('/api/docs')
def api_docs():
    """Return API documentation."""
    routes = []
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static' and str(rule).startswith('/api/'):
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

# Test endpoint
@app.route('/api/test')
def test_endpoint():
    """Test endpoint to verify API is working."""
    return jsonify({
        'success': True,
        'message': 'API is working',
        'routes': [str(rule) for rule in app.url_map.iter_rules() if 'api' in str(rule)]
    })

# Serve React app - MUST BE LAST
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React SPA - all routes return index.html for client-side routing."""
    if path:
        file_path = os.path.join(dist_dir, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory(dist_dir, path)

    index_path = os.path.join(dist_dir, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(dist_dir, 'index.html')

    return jsonify({
        'success': False,
        'error': {
            'code': 'FRONTEND_NOT_BUILT',
            'message': 'Frontend not built. Run "npm run build" in the frontend directory.'
        }
    }), 404


def check_services():
    """Check if required services are running."""
    from pymongo import MongoClient

    print("\n🔍 Checking services...")

    # Check MongoDB
    try:
        client = MongoClient(Config.MONGODB_URL, serverSelectionTimeoutMS=3000)
        client.server_info()
        print(f"  ✅ MongoDB: Connected to {Config.MONGODB_URL}")
    except Exception as e:
        print(f"  ❌ MongoDB: Not connected - {e}")
        print("     Make sure MongoDB is running locally:")
        print("     - Windows: mongod --dbpath C:\\data\\db")
        print("     - macOS: brew services start mongodb-community")
        print("     - Linux: sudo systemctl start mongod")
        return False

    # Check Redis (optional)
    try:
        redis_service.ping()
        print(f"  ✅ Redis: Connected to {Config.REDIS_URL}")
    except Exception as e:
        print(f"  ⚠️  Redis: Not connected (optional) - {e}")

    return True


if __name__ == '__main__':
    print("=" * 60)
    print("  🚀 Experiment Platform - Local Development Server")
    print("=" * 60)

    # Check services before starting
    if not check_services():
        print("\n⚠️  Please start MongoDB and try again.")
        sys.exit(1)

    # Initialize
    with app.app_context():
        check_initial_admin()

    print(f"\n✅ Server starting...")
    print(f"   URL: http://localhost:{Config.FLASK_PORT}")
    print(f"   API Health: http://localhost:{Config.FLASK_PORT}/api/health")
    print(f"   Environment: {Config.FLASK_ENV}")
    print("=" * 60)

    app.run(
        host='0.0.0.0',
        port=Config.FLASK_PORT,
        debug=Config.FLASK_ENV == 'development',
        threaded=True
    )

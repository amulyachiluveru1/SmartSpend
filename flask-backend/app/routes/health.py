from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify API is running"""
    return jsonify({
        'status': 'healthy',
        'message': 'API is running',
        'version': '1.0.0'
    }), 200

@health_bp.route('/health/db', methods=['GET'])
def health_db():
    """Health check that also verifies database connection"""
    from ..models import User
    from ..extensions import db
    
    try:
        # Try to query the database
        db.session.execute('SELECT 1').scalar()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'message': 'API and database are running'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'degraded',
            'database': 'disconnected',
            'error': str(e)
        }), 500
import os
from flask import Flask, jsonify
from flask_cors import CORS
from database import init_db, DB_PATH
from seed_data import seed_database
from routes import api_bp

def create_app(test_config=None):
    """Application factory for CampusPulse Flask backend."""
    app = Flask(__name__)
    
    # Enable CORS for frontend clients
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Configure database
    if not os.path.exists(DB_PATH):
        print("[App] Database not found. Initializing and seeding SQLite database...")
        seed_database(DB_PATH)

    # Register blueprints
    app.register_blueprint(api_bp)

    @app.route("/")
    def index():
        return jsonify({
            "name": "CampusPulse API Service",
            "status": "online",
            "docs": "/api/health"
        })

    return app

if __name__ == "__main__":
    # Ensure database is prepared
    if not os.path.exists(DB_PATH):
        seed_database(DB_PATH)
    
    app = create_app()
    port = int(os.environ.get("FLASK_PORT", 5000))
    print(f"[CampusPulse] Flask server starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

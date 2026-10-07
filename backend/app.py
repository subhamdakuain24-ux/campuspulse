import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
deps_dir = os.path.abspath(os.path.join(backend_dir, "..", "backend_deps"))
for p in (backend_dir, deps_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from flask import Flask, jsonify
from flask_cors import CORS

from database import init_db, DB_PATH, get_db_connection
from seed_data import seed_database
from routes import api_bp

def ensure_database_ready(db_file=None):
    """
    Ensures that the SQLite database schema is initialized and migrated,
    and all development accounts (Student, Teacher, Admin) exist.
    """
    path = db_file or DB_PATH
    init_db(path)
    
    conn = get_db_connection(path)
    cur = conn.cursor()
    try:
        cur.execute("SELECT COUNT(*) as count FROM users")
        row = cur.fetchone()
        count = row["count"] if row else 0
    except Exception:
        count = 0
    conn.close()

    if count == 0:
        print("[App] No user accounts found. Seeding development accounts...")
        seed_database(path)

def create_app(test_config=None):
    """Application factory for CampusPulse Flask backend."""
    app = Flask(__name__)
    
    # Enable CORS for frontend clients
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Ensure database schema is migrated and seeded
    ensure_database_ready(DB_PATH)

    # Register blueprints
    app.register_blueprint(api_bp)

    @app.errorhandler(500)
    def internal_error(error):
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(error)
        }), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Resource not found"
        }), 404

    @app.route("/")
    def index():
        return jsonify({
            "name": "CampusPulse API Service",
            "status": "online",
            "docs": "/api/health"
        })

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("FLASK_PORT", 5000))
    print(f"[CampusPulse] Flask server starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)

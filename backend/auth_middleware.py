import sqlite3
from datetime import datetime
from functools import wraps
from flask import request, jsonify, g
from database import get_db_connection

def extract_token(req) -> str | None:
    """Extract Bearer token from HTTP headers or request body."""
    auth_header = req.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    
    # Check X-Auth-Token header
    x_token = req.headers.get("X-Auth-Token")
    if x_token:
        return x_token.strip()
    
    # Check JSON body token
    body = req.get_json(silent=True)
    if isinstance(body, dict) and body.get("token"):
        return str(body.get("token")).strip()
        
    return None

def get_current_user_from_token(token: str) -> dict | None:
    """
    Look up active session token from auth_tokens joined with users.
    Returns user dict or None if invalid or expired.
    """
    if not token or not isinstance(token, str) or not token.strip():
        return None
        
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            t.token,
            t.expires_at,
            t.role AS session_role,
            u.id,
            u.identifier,
            u.name,
            u.email,
            u.role,
            u.department,
            u.avatar_url,
            u.phone
        FROM auth_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token = ?
        LIMIT 1
    """, (token.strip(),))
    
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
        
    # Check session token expiry
    if row.get("expires_at"):
        try:
            exp_date = datetime.strptime(row["expires_at"], "%Y-%m-%d %H:%M:%S")
            if exp_date < datetime.utcnow():
                return None
        except Exception:
            pass
            
    return dict(row)

def get_safe_user_dict(user_row: dict) -> dict:
    """
    Returns sanitized dictionary for a user record.
    Guarantees password hashes or secrets are never leaked.
    """
    safe_fields = [
        "id", "identifier", "name", "email", "role",
        "department", "avatar_url", "phone", "created_at"
    ]
    return {k: user_row[k] for k in safe_fields if k in user_row}

def require_auth(f):
    """
    Decorator requiring an active authenticated session.
    Sets g.current_user to the authenticated user dict.
    Returns 401 Unauthorized if missing, invalid, or expired.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = extract_token(request)
        if not token:
            return jsonify({
                "success": False,
                "error": "Authentication token missing or invalid format"
            }), 401
            
        user = get_current_user_from_token(token)
        if not user:
            return jsonify({
                "success": False,
                "error": "Invalid or expired session token"
            }), 401
            
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def require_role(*allowed_roles):
    """
    Reusable decorator for role-based authorization.
    Verifies user is authenticated AND has one of the specified roles.
    Backend evaluates the user's verified role from the database.
    Never trusts frontend claims or request headers.
    Returns 401 if unauthenticated, 403 Forbidden if role unauthorized.
    """
    normalized_allowed = [r.lower().strip() for r in allowed_roles]
    
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = extract_token(request)
            if not token:
                return jsonify({
                    "success": False,
                    "error": "Authentication required. Missing token."
                }), 401
                
            user = get_current_user_from_token(token)
            if not user:
                return jsonify({
                    "success": False,
                    "error": "Invalid or expired session token"
                }), 401
                
            g.current_user = user
            user_role = (user.get("role") or "").lower().strip()
            
            if user_role not in normalized_allowed:
                return jsonify({
                    "success": False,
                    "error": f"Forbidden. Role '{user_role}' lacks required permissions [{', '.join(normalized_allowed)}]."
                }), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

import json
import uuid
from datetime import datetime
from flask import request, jsonify, g
from database import get_db_connection
from auth_middleware import require_auth, require_role, extract_token, get_current_user_from_token
from . import api_bp

VALID_REQUEST_TYPES = {
    "HOSTEL_COMPLAINT",
    "FACILITY_COMPLAINT",
    "CERTIFICATE_REQUEST",
    "GATE_PASS",
    "LEAVE_REQUEST"
}

VALID_STATUSES = {
    "HOSTEL_COMPLAINT": ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    "FACILITY_COMPLAINT": ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    "CERTIFICATE_REQUEST": ["SUBMITTED", "PROCESSING", "APPROVED", "REJECTED", "COMPLETED"],
    "GATE_PASS": ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
    "LEAVE_REQUEST": ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"]
}

VALID_PRIORITIES = {"LOW", "MEDIUM", "HIGH", "URGENT"}

def calculate_time_diff_human(start_str: str, end_str: str | None = None) -> dict:
    """Calculates elapsed duration between two timestamps."""
    try:
        start_dt = datetime.strptime(start_str[:19], "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(end_str[:19], "%Y-%m-%d %H:%M:%S") if end_str else datetime.utcnow()
        diff = end_dt - start_dt
        total_seconds = max(0, int(diff.total_seconds()))
        hours = total_seconds / 3600.0
        days = total_seconds / 86400.0
        
        if total_seconds < 3600:
            formatted = f"{max(1, total_seconds // 60)}m"
        elif hours < 24:
            formatted = f"{round(hours, 1)}h"
        else:
            formatted = f"{round(days, 1)}d"
            
        return {
            "total_seconds": total_seconds,
            "hours": round(hours, 1),
            "days": round(days, 1),
            "formatted": formatted,
            "is_aged": hours >= 48.0
        }
    except Exception:
        return {
            "total_seconds": 0,
            "hours": 0.0,
            "days": 0.0,
            "formatted": "N/A",
            "is_aged": False
        }

def format_request_record(row: dict) -> dict:
    """Sanitizes and enriches a request record with calculated fields."""
    d = dict(row)
    created_at = d.get("created_at") or ""
    resolved_at = d.get("resolved_at")
    
    # Calculate age and resolution time
    d["age"] = calculate_time_diff_human(created_at)
    if resolved_at:
        d["resolution_time"] = calculate_time_diff_human(created_at, resolved_at)
    else:
        d["resolution_time"] = None
        
    # Parse meta_data JSON if present
    if d.get("meta_data"):
        try:
            d["meta"] = json.loads(d["meta_data"])
        except Exception:
            d["meta"] = {}
    else:
        d["meta"] = {}
        
    return d

@api_bp.route("/operations/requests", methods=["GET"])
@require_auth
def get_campus_requests():
    """
    List campus requests.
    Supports filters: type, status, category, priority, student_id, search.
    Students default to their own requests. Admins/Teachers see all unless filtered.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    
    req_type = request.args.get("type", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    priority = request.args.get("priority", "").strip()
    search = request.args.get("search", "").strip().lower()
    student_id = request.args.get("student_id", "").strip()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM campus_requests WHERE 1=1"
    params = []

    # If student, restrict to their own ID unless they explicitly pass an allowed filter
    if user_role == "student":
        student_id = user.get("id") or "1"
        query += " AND (student_id = ? OR student_id = '1' OR student_identifier = ?)"
        params.extend([student_id, user.get("identifier") or "CP-847291"])
    elif student_id:
        query += " AND student_id = ?"
        params.append(student_id)

    if req_type and req_type in VALID_REQUEST_TYPES:
        query += " AND request_type = ?"
        params.append(req_type)

    if status:
        query += " AND status = ?"
        params.append(status.upper())

    if category:
        query += " AND category = ?"
        params.append(category.upper())

    if priority:
        query += " AND priority = ?"
        params.append(priority.upper())

    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(public_id) LIKE ? OR LOWER(location) LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term])

    query += " ORDER BY id DESC"

    cur.execute(query, tuple(params))
    rows = cur.fetchall()
    conn.close()

    results = [format_request_record(r) for r in rows]

    return jsonify({
        "success": True,
        "count": len(results),
        "requests": results
    }), 200

@api_bp.route("/operations/requests/<ident>", methods=["GET"])
@require_auth
def get_request_detail(ident: str):
    """
    Get detailed information for a request, including its full audit timeline.
    Identifier can be internal numeric ID or human-friendly public_id (e.g. CP-10001).
    """
    conn = get_db_connection()
    cur = conn.cursor()

    if ident.isdigit():
        cur.execute("SELECT * FROM campus_requests WHERE id = ? LIMIT 1", (int(ident),))
    else:
        cur.execute("SELECT * FROM campus_requests WHERE public_id = ? LIMIT 1", (ident.strip().upper(),))

    req_row = cur.fetchone()
    if not req_row:
        conn.close()
        return jsonify({"success": False, "error": "Campus request not found"}), 404

    req_id = req_row["id"]
    public_id = req_row["public_id"]

    # Fetch audit / activity trail
    cur.execute("""
        SELECT * FROM campus_request_activities
        WHERE request_id = ? OR public_id = ?
        ORDER BY id ASC
    """, (req_id, public_id))
    activities = cur.fetchall()
    conn.close()

    result = format_request_record(req_row)
    result["activities"] = [dict(a) for a in activities]

    return jsonify({
        "success": True,
        "request": result
    }), 200

@api_bp.route("/operations/requests", methods=["POST"])
@require_auth
def create_campus_request():
    """
    Create a new campus request across any supported workflow:
    - HOSTEL_COMPLAINT
    - FACILITY_COMPLAINT
    - CERTIFICATE_REQUEST
    - GATE_PASS
    - LEAVE_REQUEST
    Automatically generates human-friendly public ID (e.g. CP-10006)
    and logs initial audit activity.
    """
    user = g.current_user
    body = request.get_json(silent=True) or {}

    req_type = str(body.get("request_type", "")).strip().upper()
    title = str(body.get("title", "")).strip()
    description = str(body.get("description", "")).strip()
    category = str(body.get("category", "")).strip().upper()
    priority = str(body.get("priority", "MEDIUM")).strip().upper()
    location = str(body.get("location", "")).strip()
    meta = body.get("meta") or {}

    if not req_type or req_type not in VALID_REQUEST_TYPES:
        return jsonify({
            "success": False,
            "error": f"Invalid request_type. Must be one of: {list(VALID_REQUEST_TYPES)}"
        }), 400

    if not title:
        return jsonify({"success": False, "error": "Title is required"}), 400

    if not description:
        return jsonify({"success": False, "error": "Description is required"}), 400

    if not category:
        category = "OTHER"

    if priority not in VALID_PRIORITIES:
        priority = "MEDIUM"

    conn = get_db_connection()
    cur = conn.cursor()

    # Generate next public_id
    cur.execute("SELECT MAX(id) as max_id FROM campus_requests")
    row = cur.fetchone()
    next_num = 10001
    if row and row.get("max_id") is not None:
        next_num = 10000 + int(row["max_id"]) + 1

    public_id = f"CP-{next_num}"
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # Determine default initial status
    initial_status = "SUBMITTED"

    student_id = str(user.get("id") or "1")
    student_name = user.get("name") or "Alex Johnson"
    student_identifier = user.get("identifier") or "CP-847291"
    department = user.get("department") or "School of Computing & Data Sciences"

    meta_str = json.dumps(meta) if meta else None

    # Insert request
    cur.execute("""
        INSERT INTO campus_requests (
            public_id, student_id, student_name, student_identifier, department,
            request_type, title, description, category, location, priority,
            status, meta_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        public_id, student_id, student_name, student_identifier, department,
        req_type, title, description, category, location, priority,
        initial_status, meta_str, now_str, now_str
    ))
    new_req_id = cur.lastrowid

    # Insert initial activity record
    cur.execute("""
        INSERT INTO campus_request_activities (
            request_id, public_id, actor_id, actor_name, actor_role,
            action, old_status, new_status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_req_id, public_id, user.get("id") or "1",
        user.get("name") or "Alex Johnson",
        user.get("role") or "student",
        "REQUEST_CREATED", None, initial_status,
        f"Request {public_id} submitted via CampusPulse portal.",
        now_str
    ))

    conn.commit()

    # Re-fetch the full created record
    cur.execute("SELECT * FROM campus_requests WHERE id = ?", (new_req_id,))
    created_row = cur.fetchone()
    conn.close()

    result = format_request_record(created_row)

    return jsonify({
        "success": True,
        "message": f"Request {public_id} successfully created",
        "public_id": public_id,
        "request": result
    }), 201

@api_bp.route("/operations/requests/<ident>", methods=["PATCH"])
@require_auth
def update_campus_request(ident: str):
    """
    Administrative update on a campus request:
    - Status change with type-specific validation
    - Department assignment
    - Staff assignment
    - Priority adjustment
    - Add operational note/comment
    - Automatic recording in audit trail
    - In-app notification generated for student
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()

    conn = get_db_connection()
    cur = conn.cursor()

    if ident.isdigit():
        cur.execute("SELECT * FROM campus_requests WHERE id = ? LIMIT 1", (int(ident),))
    else:
        cur.execute("SELECT * FROM campus_requests WHERE public_id = ? LIMIT 1", (ident.strip().upper(),))

    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"success": False, "error": "Request not found"}), 404

    req_id = existing["id"]
    public_id = existing["public_id"]
    req_type = existing["request_type"]
    old_status = existing["status"]
    student_id = existing["student_id"]
    req_title = existing["title"]

    body = request.get_json(silent=True) or {}
    new_status = body.get("status")
    assigned_dept = body.get("assigned_department")
    assigned_staff = body.get("assigned_staff")
    new_priority = body.get("priority")
    admin_note = body.get("note", "").strip()

    updates = []
    params = []
    actions_logged = []
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Status update validation
    if new_status:
        new_status = str(new_status).strip().upper()
        allowed = VALID_STATUSES.get(req_type, [])
        if new_status not in allowed:
            conn.close()
            return jsonify({
                "success": False,
                "error": f"Invalid status '{new_status}' for {req_type}. Allowed: {allowed}"
            }), 400

        if new_status != old_status:
            updates.append("status = ?")
            params.append(new_status)
            
            # If resolved or completed, mark resolved_at
            if new_status in ("RESOLVED", "COMPLETED"):
                updates.append("resolved_at = ?")
                params.append(now_str)
            elif new_status in ("IN_PROGRESS", "PROCESSING", "UNDER_REVIEW") and existing.get("resolved_at"):
                updates.append("resolved_at = NULL")

            action_type = "STATUS_CHANGED"
            if new_status == "APPROVED":
                action_type = "APPROVED"
            elif new_status == "REJECTED":
                action_type = "REJECTED"
            elif new_status == "RESOLVED":
                action_type = "RESOLVED"
            elif new_status == "CLOSED":
                action_type = "CLOSED"

            note_desc = admin_note if admin_note else f"Status updated from {old_status} to {new_status}."
            actions_logged.append({
                "action": action_type,
                "old_status": old_status,
                "new_status": new_status,
                "notes": note_desc
            })

    # 2. Assigned Department update
    if assigned_dept is not None and assigned_dept != existing.get("assigned_department"):
        updates.append("assigned_department = ?")
        params.append(assigned_dept.strip())
        actions_logged.append({
            "action": "ASSIGNED_DEPARTMENT",
            "old_status": old_status,
            "new_status": new_status or old_status,
            "notes": f"Assigned department: {assigned_dept}"
        })

    # 3. Assigned Staff update
    if assigned_staff is not None and assigned_staff != existing.get("assigned_staff"):
        updates.append("assigned_staff = ?")
        params.append(assigned_staff.strip())
        actions_logged.append({
            "action": "ASSIGNED_STAFF",
            "old_status": old_status,
            "new_status": new_status or old_status,
            "notes": f"Assigned staff: {assigned_staff}"
        })

    # 4. Priority update
    if new_priority and new_priority.upper() in VALID_PRIORITIES and new_priority.upper() != existing.get("priority"):
        updates.append("priority = ?")
        params.append(new_priority.upper())
        actions_logged.append({
            "action": "PRIORITY_CHANGED",
            "old_status": old_status,
            "new_status": new_status or old_status,
            "notes": f"Priority changed to {new_priority.upper()}"
        })

    # 5. Standalone Admin Note without status change
    if admin_note and not new_status:
        actions_logged.append({
            "action": "ADMIN_NOTE",
            "old_status": old_status,
            "new_status": old_status,
            "notes": admin_note
        })

    if not updates and not actions_logged:
        conn.close()
        return jsonify({"success": False, "error": "No valid modifications specified"}), 400

    # Always update updated_at
    updates.append("updated_at = ?")
    params.append(now_str)

    params.append(req_id)
    cur.execute(f"UPDATE campus_requests SET {', '.join(updates)} WHERE id = ?", tuple(params))

    # Record all audit actions
    actor_id = str(user.get("id") or "ADM-9901")
    actor_name = user.get("name") or "Administrator"
    actor_role = user.get("role") or "admin"

    for act in actions_logged:
        cur.execute("""
            INSERT INTO campus_request_activities (
                request_id, public_id, actor_id, actor_name, actor_role,
                action, old_status, new_status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            req_id, public_id, actor_id, actor_name, actor_role,
            act["action"], act["old_status"], act["new_status"], act["notes"], now_str
        ))

    # Automatic student notification delivery
    if new_status and new_status != old_status:
        notif_id = f"NOTIF-{public_id}-{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
        notif_title = f"{public_id}: Status changed to {new_status}"
        notif_desc = f"Your {req_type.replace('_', ' ').lower()} has been updated to '{new_status}'. {admin_note}"
        cur.execute("""
            INSERT INTO notifications (
                id, student_id, title, description, category,
                badge_type, badge_label, time_ago, unread, action_button_text, action_button_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            notif_id, student_id, notif_title, notif_desc,
            "campus", "campus", public_id, "Just now", 1,
            "View Details", "primary"
        ))

    conn.commit()

    # Re-fetch updated row and activities
    cur.execute("SELECT * FROM campus_requests WHERE id = ?", (req_id,))
    updated_row = cur.fetchone()
    cur.execute("SELECT * FROM campus_request_activities WHERE request_id = ? ORDER BY id ASC", (req_id,))
    activities = cur.fetchall()
    conn.close()

    result = format_request_record(updated_row)
    result["activities"] = [dict(a) for a in activities]

    return jsonify({
        "success": True,
        "message": f"Request {public_id} updated successfully",
        "request": result
    }), 200

@api_bp.route("/operations/stats", methods=["GET"])
@require_auth
def get_operations_stats():
    """
    Returns administrative operational KPIs:
    - Counts by status (Pending, In Progress, Resolved, etc.)
    - Counts by workflow type
    - Average resolution time (hours)
    - Complaint ageing metrics (>48 hours)
    - Department workload distribution
    """
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM campus_requests")
    all_requests = [dict(r) for r in cur.fetchall()]
    conn.close()

    total = len(all_requests)
    pending_count = 0
    in_progress_count = 0
    resolved_count = 0
    aged_count = 0
    resolution_times_hours = []

    type_counts = {}
    dept_workload = {}
    status_counts = {}

    for r in all_requests:
        status = r.get("status") or "SUBMITTED"
        req_type = r.get("request_type") or "OTHER"
        dept = r.get("assigned_department") or "Unassigned"
        
        status_counts[status] = status_counts.get(status, 0) + 1
        type_counts[req_type] = type_counts.get(req_type, 0) + 1
        dept_workload[dept] = dept_workload.get(dept, 0) + 1

        if status in ("SUBMITTED", "UNDER_REVIEW", "ASSIGNED"):
            pending_count += 1
            # Check age
            age_info = calculate_time_diff_human(r.get("created_at") or "")
            if age_info["is_aged"]:
                aged_count += 1
        elif status in ("IN_PROGRESS", "PROCESSING"):
            in_progress_count += 1
        elif status in ("RESOLVED", "APPROVED", "COMPLETED", "CLOSED"):
            resolved_count += 1
            if r.get("resolved_at"):
                res_info = calculate_time_diff_human(r.get("created_at") or "", r["resolved_at"])
                resolution_times_hours.append(res_info["hours"])

    avg_resolution_hours = 0.0
    if resolution_times_hours:
        avg_resolution_hours = round(sum(resolution_times_hours) / len(resolution_times_hours), 1)

    return jsonify({
        "success": True,
        "stats": {
            "total": total,
            "pending": pending_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count,
            "aged_complaints": aged_count,
            "avg_resolution_hours": avg_resolution_hours,
            "by_type": type_counts,
            "by_status": status_counts,
            "department_workload": dept_workload
        }
    }), 200

@api_bp.route("/operations/audit-logs", methods=["GET"])
@require_auth
def get_audit_logs():
    """Returns chronological audit activities across all requests."""
    limit = int(request.args.get("limit", 50))
    public_id = request.args.get("public_id", "").strip().upper()

    conn = get_db_connection()
    cur = conn.cursor()

    if public_id:
        cur.execute("""
            SELECT * FROM campus_request_activities
            WHERE public_id = ?
            ORDER BY id DESC LIMIT ?
        """, (public_id, limit))
    else:
        cur.execute("""
            SELECT * FROM campus_request_activities
            ORDER BY id DESC LIMIT ?
        """, (limit,))

    rows = cur.fetchall()
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "activities": [dict(r) for r in rows]
    }), 200

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
    "HOSTEL_COMPLAINT": ["PENDING", "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "CLOSED"],
    "FACILITY_COMPLAINT": ["PENDING", "SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "CLOSED"],
    "CERTIFICATE_REQUEST": ["SUBMITTED", "PENDING", "PROCESSING", "APPROVED", "REJECTED", "COMPLETED"],
    "GATE_PASS": ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
    "LEAVE_REQUEST": ["PENDING", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"]
}

VALID_PRIORITIES = {"LOW", "MEDIUM", "HIGH", "URGENT"}

def calculate_time_diff_human(start_str: str, end_str: str | None = None) -> dict:
    """Calculates elapsed duration between two timestamps in simple, understandable format."""
    try:
        start_dt = datetime.strptime(start_str[:19], "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(end_str[:19], "%Y-%m-%d %H:%M:%S") if end_str else datetime.utcnow()
        diff = end_dt - start_dt
        total_seconds = max(0, int(diff.total_seconds()))
        hours = total_seconds / 3600.0
        days = total_seconds / 86400.0
        
        mins = total_seconds // 60
        hrs = total_seconds // 3600
        rem_mins = mins % 60
        
        if total_seconds < 60:
            formatted = "Just now"
        elif total_seconds < 3600:
            formatted = f"{mins}m"
        elif hours < 24:
            if rem_mins > 0:
                formatted = f"{hrs}h {rem_mins}m"
            else:
                formatted = f"{hrs}h"
        elif int(days) == 1:
            formatted = "1 day"
        else:
            formatted = f"{int(days)} days"
            
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
    Supports filters: type, status, category, priority, department, staff, student_id, search, sort.
    Students restricted to their own requests. Admins/Teachers see all unless filtered.
    Sort supports: newest (default), oldest, ageing.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    
    req_type = request.args.get("type", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    priority = request.args.get("priority", "").strip()
    department = request.args.get("department", "").strip()
    staff = request.args.get("staff", "").strip()
    search = request.args.get("search", "").strip().lower()
    sort_by = request.args.get("sort", "newest").strip().lower()
    student_id = request.args.get("student_id", "").strip()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM campus_requests WHERE 1=1"
    params = []

    # If student, restrict to their own ID
    if user_role == "student":
        curr_id = str(user.get("id") or "")
        curr_ident = str(user.get("identifier") or "")
        if curr_id == "1" or curr_ident in ("STU-2023-8941", "CP-847291"):
            query += " AND (student_id IN ('1', 'STU-2023-8941') OR student_identifier IN ('CP-847291', 'STU-2023-8941'))"
        else:
            query += " AND (student_id = ? OR student_identifier = ?)"
            params.extend([curr_id, curr_ident])
    elif student_id:
        query += " AND student_id = ?"
        params.append(student_id)

    if req_type and req_type in VALID_REQUEST_TYPES:
        query += " AND request_type = ?"
        params.append(req_type)

    if status and status != "ALL":
        query += " AND status = ?"
        params.append(status.upper())

    if category and category != "ALL":
        query += " AND category = ?"
        params.append(category.upper())

    if priority and priority != "ALL":
        query += " AND priority = ?"
        params.append(priority.upper())

    if department and department != "ALL":
        query += " AND assigned_department = ?"
        params.append(department)

    if staff and staff != "ALL":
        query += " AND assigned_staff = ?"
        params.append(staff)

    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(public_id) LIKE ? OR LOWER(location) LIKE ? OR LOWER(student_name) LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term, term])

    # Sorting
    if sort_by == "oldest":
        query += " ORDER BY id ASC"
    elif sort_by == "ageing":
        # Unresolved requests come first, ordered from oldest to newest
        query += " ORDER BY CASE WHEN status IN ('RESOLVED','APPROVED','COMPLETED','CLOSED','REJECTED') THEN 1 ELSE 0 END ASC, id ASC"
    else:
        # Default newest
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
    Enforces RBAC: Students can only view their own requests.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()

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

    # RBAC Security Check: Student can only view their own requests
    if user_role == "student":
        allowed_student_ids = {str(user.get("id")), str(user.get("identifier"))}
        if str(user.get("id")) == "1":
            allowed_student_ids.add("STU-2023-8941")
            allowed_student_ids.add("CP-847291")
        if str(req_row["student_id"]) not in allowed_student_ids and str(req_row["student_identifier"]) not in allowed_student_ids:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Forbidden: You are not authorized to view another student's request."
            }), 403

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
    - HOSTEL_COMPLAINT / FACILITY_COMPLAINT (Initial status: PENDING)
    - CERTIFICATE_REQUEST (Initial status: SUBMITTED)
    - GATE_PASS / LEAVE_REQUEST (Initial status: PENDING)
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

    # Workflow initial statuses
    if req_type == "CERTIFICATE_REQUEST":
        initial_status = "SUBMITTED"
        initial_activity_note = "Certificate request submitted"
    elif req_type in ("GATE_PASS", "LEAVE_REQUEST"):
        initial_status = "PENDING"
        initial_activity_note = "Gate pass / leave request submitted"
    else:
        # Complaints
        initial_status = "PENDING"
        initial_activity_note = "Complaint created"

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
        initial_activity_note,
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
    Administrative / Staff update on a campus request:
    - Status change with type-specific validation
    - Department assignment
    - Staff assignment
    - Priority adjustment
    - Add operational note/comment
    - Automatic recording in audit trail
    - In-app notification generated for student
    RBAC: Students are FORBIDDEN from modifying administrative requests.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()

    # RBAC Enforcement: Students are strictly forbidden from modifying requests
    if user_role == "student":
        return jsonify({
            "success": False,
            "error": "Forbidden: Students are not permitted to modify operational requests or administrative status."
        }), 403

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
            elif new_status in ("IN_PROGRESS", "PROCESSING", "UNDER_REVIEW", "PENDING", "ASSIGNED") and existing.get("resolved_at"):
                updates.append("resolved_at = NULL")

            action_type = "STATUS_CHANGED"
            note_desc = ""
            if new_status == "ASSIGNED":
                action_type = "ASSIGNED"
                note_desc = f"Assigned to {assigned_dept or 'department'}"
            elif new_status == "IN_PROGRESS":
                action_type = "STATUS_CHANGED"
                note_desc = "Status changed to In Progress"
            elif new_status == "RESOLVED":
                action_type = "RESOLVED"
                note_desc = "Complaint resolved"
            elif new_status == "APPROVED":
                action_type = "APPROVED"
                note_desc = "Request approved"
            elif new_status == "PROCESSING":
                action_type = "STATUS_CHANGED"
                note_desc = "Moved to processing"
            elif new_status == "COMPLETED":
                action_type = "COMPLETED"
                note_desc = "Certificate completed"
            elif new_status == "REJECTED":
                action_type = "REJECTED"
                note_desc = "Request rejected"
            elif new_status == "CLOSED":
                action_type = "CLOSED"
                note_desc = "Request closed"
            else:
                note_desc = f"Status updated from {old_status} to {new_status}"

            if admin_note:
                note_desc = f"{note_desc} — {admin_note}"

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
            "notes": f"Assigned to {assigned_dept}"
        })

    # 3. Assigned Staff update
    if assigned_staff is not None and assigned_staff != existing.get("assigned_staff"):
        updates.append("assigned_staff = ?")
        params.append(assigned_staff.strip())
        actions_logged.append({
            "action": "ASSIGNED_STAFF",
            "old_status": old_status,
            "new_status": new_status or old_status,
            "notes": f"Assigned to {assigned_staff}"
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
    if admin_note and not new_status and not (assigned_dept or assigned_staff):
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

    # Automatic student notification delivery into EXISTING notifications table
    if (new_status and new_status != old_status) or (assigned_dept and not existing.get("assigned_department")):
        notif_id = f"NOTIF-{public_id}-{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
        effective_status = new_status or old_status

        # Workflow specific notification messages
        if req_type in ("HOSTEL_COMPLAINT", "FACILITY_COMPLAINT"):
            if effective_status == "ASSIGNED" or (assigned_dept and not existing.get("assigned_department")):
                notif_title = f"Your hostel complaint has been assigned."
                notif_desc = f"Complaint {public_id}: Assigned to {assigned_dept or 'Maintenance'}. {admin_note}".strip()
            elif effective_status == "IN_PROGRESS":
                notif_title = f"Your complaint is now in progress."
                notif_desc = f"Complaint {public_id}: Work has started on your complaint. {admin_note}".strip()
            elif effective_status in ("RESOLVED", "CLOSED"):
                notif_title = f"Your complaint has been resolved."
                notif_desc = f"Complaint {public_id}: Resolved. {admin_note}".strip()
            elif effective_status == "REJECTED":
                notif_title = f"Your complaint was rejected."
                notif_desc = f"Complaint {public_id}: {admin_note or 'Please contact administration.'}".strip()
            else:
                notif_title = f"{public_id}: Status changed to {effective_status}"
                notif_desc = f"Your complaint has been updated to {effective_status}. {admin_note}".strip()

        elif req_type == "CERTIFICATE_REQUEST":
            if effective_status == "PROCESSING":
                notif_title = f"Your bonafide certificate request is being processed."
                notif_desc = f"Request {public_id}: Academic records under verification. {admin_note}".strip()
            elif effective_status == "APPROVED":
                notif_title = f"Your bonafide certificate request has been approved."
                notif_desc = f"Request {public_id}: Approved by Registrar Office. {admin_note}".strip()
            elif effective_status == "COMPLETED":
                notif_title = f"Your bonafide certificate request was completed."
                notif_desc = f"Request {public_id}: Ready for collection or digital download. {admin_note}".strip()
            elif effective_status == "REJECTED":
                notif_title = f"Your bonafide certificate request was rejected."
                notif_desc = f"Request {public_id}: {admin_note or 'Application rejected by administration.'}".strip()
            else:
                notif_title = f"{public_id}: Status changed to {effective_status}"
                notif_desc = f"Your certificate request has been updated. {admin_note}".strip()

        else: # GATE_PASS or LEAVE_REQUEST
            pass_label = "gate pass" if req_type == "GATE_PASS" else "leave"
            if effective_status == "APPROVED":
                notif_title = f"Your {pass_label} request has been approved."
                notif_desc = f"Pass {public_id}: Approved by Warden. Digital pass active at gate. {admin_note}".strip()
            elif effective_status == "REJECTED":
                notif_title = f"Your {pass_label} request was rejected."
                notif_desc = f"Pass {public_id}: {admin_note or 'Request was not approved by warden.'}".strip()
            elif effective_status == "UNDER_REVIEW":
                notif_title = f"Your {pass_label} request is under review."
                notif_desc = f"Pass {public_id}: Verification in progress by warden. {admin_note}".strip()
            else:
                notif_title = f"{public_id}: Status changed to {effective_status}"
                notif_desc = f"Your {pass_label} request has been updated. {admin_note}".strip()

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
    - total
    - pending
    - in_progress
    - approved
    - resolved
    - rejected
    - unassigned
    - aged_complaints (>48 hours)
    - avg_resolution_hours
    - by_type
    - by_status
    - department_workload
    """
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM campus_requests")
    all_requests = [dict(r) for r in cur.fetchall()]
    conn.close()

    total = len(all_requests)
    pending_count = 0
    in_progress_count = 0
    approved_count = 0
    resolved_count = 0
    rejected_count = 0
    unassigned_count = 0
    aged_count = 0
    resolution_times_hours = []

    type_counts = {}
    dept_workload = {}
    status_counts = {}

    for r in all_requests:
        status = r.get("status") or "PENDING"
        req_type = r.get("request_type") or "OTHER"
        dept = r.get("assigned_department") or "Unassigned"
        
        status_counts[status] = status_counts.get(status, 0) + 1
        type_counts[req_type] = type_counts.get(req_type, 0) + 1
        dept_workload[dept] = dept_workload.get(dept, 0) + 1

        if not r.get("assigned_department") or r.get("assigned_department") in ("", "Unassigned"):
            unassigned_count += 1

        if status in ("PENDING", "SUBMITTED", "UNDER_REVIEW"):
            pending_count += 1
            # Check age
            age_info = calculate_time_diff_human(r.get("created_at") or "")
            if age_info["is_aged"]:
                aged_count += 1
        elif status in ("IN_PROGRESS", "PROCESSING", "ASSIGNED"):
            in_progress_count += 1
            age_info = calculate_time_diff_human(r.get("created_at") or "")
            if age_info["is_aged"]:
                aged_count += 1
        elif status == "APPROVED":
            approved_count += 1
        elif status in ("RESOLVED", "COMPLETED", "CLOSED"):
            resolved_count += 1
            if r.get("resolved_at"):
                res_info = calculate_time_diff_human(r.get("created_at") or "", r["resolved_at"])
                resolution_times_hours.append(res_info["hours"])
        elif status == "REJECTED":
            rejected_count += 1

    avg_resolution_hours = 0.0
    if resolution_times_hours:
        avg_resolution_hours = round(sum(resolution_times_hours) / len(resolution_times_hours), 1)

    return jsonify({
        "success": True,
        "stats": {
            "total": total,
            "pending": pending_count,
            "in_progress": in_progress_count,
            "approved": approved_count,
            "resolved": resolved_count,
            "rejected": rejected_count,
            "unassigned": unassigned_count,
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

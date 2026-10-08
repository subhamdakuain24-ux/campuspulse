import json
from datetime import datetime, date
from flask import request, jsonify, g
from database import get_db_connection
from auth_middleware import require_auth, require_role
from . import api_bp

VALID_EVENT_TYPES = [
    "Technical",
    "Cultural",
    "Sports",
    "Academic Seminar",
    "Workshop / Hands-on",
    "Hackathon & Coding",
    "Guest Lecture",
    "Social & Community",
    "Club Activity",
    "Other"
]

VALID_EVENT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"]

COMMON_VENUES = [
    "Main University Auditorium (Capacity: 1200)",
    "APJ Abdul Kalam Seminar Hall (Capacity: 250)",
    "Aryabhatta Conference Hall (Capacity: 150)",
    "Open Air Amphitheatre (Capacity: 800)",
    "Central Sports Ground (Outdoor)",
    "Indoor Sports Complex (Capacity: 500)",
    "Computer Science Lab 4 / Digital Hub (Capacity: 80)",
    "Civil & Mechanical Workshop Area",
    "Student Activity Center (SAC) Multi-Purpose Hall"
]

def resolve_student_context(user: dict) -> tuple[str, str, str]:
    s_id = str(user.get("id") or "")
    s_name = str(user.get("name") or "Student")
    s_ident = str(user.get("identifier") or s_id)
    return s_id, s_name, s_ident

@api_bp.route("/events/meta", methods=["GET"])
@require_auth
def get_events_meta():
    """
    Returns valid event categories and campus venues for form selection.
    """
    return jsonify({
        "success": True,
        "event_types": VALID_EVENT_TYPES,
        "venues": COMMON_VENUES,
        "statuses": VALID_EVENT_STATUSES
    })

@api_bp.route("/events/applications", methods=["GET"])
@require_auth
def get_event_applications():
    """
    List event applications.
    RBAC:
      - Students see ONLY their own applications.
      - Admins see all applications with search/filter capabilities.
    Filters:
      - status: PENDING, APPROVED, REJECTED, COMPLETED, ALL
      - date: YYYY-MM-DD
      - venue: venue name
      - organizing_body / department: string
      - event_type: string
      - search: string
    """
    user = g.current_user
    user_id, _, user_ident = resolve_student_context(user)
    is_admin = user.get("role") == "admin"

    status = request.args.get("status", "").strip().upper()
    filter_date = request.args.get("date", "").strip()
    venue = request.args.get("venue", "").strip()
    organizing_body = request.args.get("organizing_body", "").strip() or request.args.get("department", "").strip()
    event_type = request.args.get("event_type", "").strip()
    search = request.args.get("search", "").strip()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM event_applications WHERE 1=1"
    params = []

    # RBAC: Student can only view their own applications
    if not is_admin:
        query += " AND (student_id = ? OR student_identifier = ?)"
        params.extend([user_id, user_ident])

    if status and status != "ALL":
        if status in VALID_EVENT_STATUSES:
            query += " AND status = ?"
            params.append(status)

    if filter_date:
        query += " AND proposed_date = ?"
        params.append(filter_date)

    if venue and venue.upper() != "ALL":
        query += " AND (venue LIKE ? OR approved_venue LIKE ?)"
        v_param = f"%{venue}%"
        params.extend([v_param, v_param])

    if organizing_body and organizing_body.upper() != "ALL":
        query += " AND (organizing_body LIKE ? OR department LIKE ?)"
        o_param = f"%{organizing_body}%"
        params.extend([o_param, o_param])

    if event_type and event_type.upper() != "ALL":
        query += " AND event_type = ?"
        params.append(event_type)

    if search:
        query += " AND (event_name LIKE ? OR description LIKE ? OR organizing_body LIKE ? OR faculty_coordinator LIKE ? OR application_no LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    query += " ORDER BY CASE WHEN status = 'PENDING' THEN 0 WHEN status = 'APPROVED' THEN 1 ELSE 2 END, proposed_date ASC, created_at DESC"

    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "applications": rows
    })

@api_bp.route("/events/applications/<int:app_id>", methods=["GET"])
@require_auth
def get_event_application_detail(app_id: int):
    """
    Get detailed application record including its activity/audit history.
    Enforces student isolation: Students cannot access another student's application.
    """
    user = g.current_user
    user_id, _, user_ident = resolve_student_context(user)
    is_admin = user.get("role") == "admin"

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (app_id,))
    app_row = cur.fetchone()
    if not app_row:
        conn.close()
        return jsonify({"success": False, "error": "Event application not found"}), 404

    # RBAC: Check ownership
    if not is_admin and app_row["student_id"] != user_id and app_row["student_identifier"] != user_ident:
        conn.close()
        return jsonify({"success": False, "error": "Access denied: You cannot view another student's application"}), 403

    app_dict = dict(app_row)

    cur.execute("""
        SELECT * FROM event_application_activities
        WHERE application_id = ?
        ORDER BY created_at ASC, id ASC
    """, (app_id,))
    activities = [dict(r) for r in cur.fetchall()]
    app_dict["activities"] = activities

    conn.close()
    return jsonify({
        "success": True,
        "application": app_dict
    })

@api_bp.route("/events/applications", methods=["POST"])
@require_auth
def submit_event_application():
    """
    Student submits an event conduction application.
    Server-side validation on all required fields.
    """
    user = g.current_user
    user_id, user_name, user_ident = resolve_student_context(user)
    data = request.get_json(silent=True) or {}

    event_name = str(data.get("event_name") or "").strip()
    event_type = str(data.get("event_type") or "").strip()
    description = str(data.get("description") or "").strip()
    proposed_date = str(data.get("proposed_date") or "").strip()
    start_time = str(data.get("start_time") or "").strip()
    end_time = str(data.get("end_time") or "").strip()
    venue = str(data.get("venue") or "").strip()
    organizing_body = str(data.get("organizing_body") or "").strip()
    faculty_coordinator = str(data.get("faculty_coordinator") or "").strip()
    additional_requirements = str(data.get("additional_requirements") or "").strip() or None
    department = str(data.get("department") or user.get("department") or "").strip() or None

    try:
        expected_participants = int(data.get("expected_participants") or 50)
    except (ValueError, TypeError):
        expected_participants = 50

    errors = []
    if not event_name or len(event_name) < 3:
        errors.append("Event name must be at least 3 characters")
    if not event_type:
        errors.append("Event type is required")
    if not description or len(description) < 10:
        errors.append("Description must be at least 10 characters")
    if not proposed_date:
        errors.append("Proposed date is required (YYYY-MM-DD)")
    if not start_time:
        errors.append("Start time is required")
    if not end_time:
        errors.append("End time is required")
    if not venue:
        errors.append("Preferred venue is required")
    if not organizing_body:
        errors.append("Organizing club / department is required")
    if not faculty_coordinator:
        errors.append("Faculty coordinator contact is required")
    if expected_participants <= 0:
        errors.append("Expected participants must be greater than 0")

    if errors:
        return jsonify({"success": False, "error": "; ".join(errors)}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Generate unique application_no like EVT-2024-001
    cur.execute("SELECT COUNT(*) as count FROM event_applications")
    count = cur.fetchone()["count"]
    year = date.today().year
    application_no = f"EVT-{year}-{count + 1:04d}"

    cur.execute("""
        INSERT INTO event_applications (
            application_no, student_id, student_name, student_identifier, department,
            event_name, event_type, description, proposed_date, start_time, end_time,
            venue, expected_participants, organizing_body, faculty_coordinator,
            additional_requirements, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    """, (
        application_no, user_id, user_name, user_ident, department,
        event_name, event_type, description, proposed_date, start_time, end_time,
        venue, expected_participants, organizing_body, faculty_coordinator,
        additional_requirements
    ))
    new_id = cur.lastrowid

    # Record activity log
    cur.execute("""
        INSERT INTO event_application_activities (
            application_id, actor_id, actor_name, actor_role, action,
            old_status, new_status, notes
        ) VALUES (?, ?, ?, ?, 'SUBMITTED', NULL, 'PENDING', ?)
    """, (
        new_id, user_id, user_name, user.get("role", "student"),
        f"Event application submitted for '{event_name}' on {proposed_date} at {venue}"
    ))

    # Send confirmation notification to student
    try:
        cur.execute("""
            INSERT INTO targeted_notifications (
                title, description, category, badge_type, badge_label,
                target_type, target_value, created_by
            ) VALUES (?, ?, 'campus', 'general', 'EVENT DESK', 'STUDENT', ?, ?)
        """, (
            "Event Application Submitted",
            f"Your application #{application_no} for '{event_name}' ({proposed_date}) has been submitted and is pending administrative review.",
            user_ident,
            "Events & Dean Office"
        ))

        cur.execute("""
            INSERT INTO notifications (
                student_id, title, description, category, badge_type, badge_label, time_ago, unread
            ) VALUES (?, ?, ?, 'campus', 'general', 'EVENT DESK', 'Just now', 1)
        """, (
            user_id,
            "Event Application Submitted",
            f"Your application #{application_no} for '{event_name}' ({proposed_date}) has been submitted and is pending administrative review."
        ))
    except Exception as e:
        print("[Events] Notification dispatch warning:", e)

    conn.commit()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (new_id,))
    created_app = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Event application #{application_no} submitted successfully! Awaiting review.",
        "application": created_app
    }), 201

@api_bp.route("/events/applications/<int:app_id>/status", methods=["PUT"])
@require_role("admin")
def update_event_application_status(app_id: int):
    """
    Admin: Approve, reject, or mark event application as completed.
    Records audit activity log and sends notification to applicant.
    """
    admin_user = g.current_user
    admin_id = str(admin_user.get("id") or "")
    admin_name = str(admin_user.get("name") or "Dean Office Admin")

    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status") or "").strip().upper()
    admin_remarks = str(data.get("admin_remarks") or data.get("remarks") or "").strip() or None
    approved_venue = str(data.get("approved_venue") or "").strip() or None

    if new_status not in VALID_EVENT_STATUSES:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {', '.join(VALID_EVENT_STATUSES)}"
        }), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (app_id,))
    app_row = cur.fetchone()
    if not app_row:
        conn.close()
        return jsonify({"success": False, "error": "Event application not found"}), 404

    old_status = app_row["status"]
    final_venue = approved_venue or app_row["approved_venue"] or app_row["venue"]

    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        UPDATE event_applications
        SET status = ?, admin_remarks = ?, approved_venue = ?,
            processed_by = ?, processed_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, admin_remarks, final_venue, admin_name, now_iso, app_id))

    # Activity log
    action_type = f"STATUS_{new_status}"
    notes = admin_remarks or f"Status changed from {old_status} to {new_status}"
    if approved_venue:
        notes += f" (Venue allotted: {approved_venue})"

    cur.execute("""
        INSERT INTO event_application_activities (
            application_id, actor_id, actor_name, actor_role, action,
            old_status, new_status, notes
        ) VALUES (?, ?, ?, 'admin', ?, ?, ?, ?)
    """, (
        app_id, admin_id, admin_name, action_type, old_status, new_status, notes
    ))

    # Dispatch targeted notification to applicant student
    try:
        notif_title = f"Event Application: {new_status.capitalize()}"
        notif_desc = f"Your application for '{app_row['event_name']}' is now {new_status}."
        if new_status == "APPROVED":
            notif_desc += f" Approved Venue: {final_venue}. Date: {app_row['proposed_date']}."
        elif new_status == "REJECTED":
            notif_desc += f" Remarks: {admin_remarks or 'Proposal did not meet event conduction criteria.'}"
        elif new_status == "COMPLETED":
            notif_desc += " Conduction recorded as completed. Submit post-event report to Dean Office."

        cur.execute("""
            INSERT INTO targeted_notifications (
                title, description, category, badge_type, badge_label,
                target_type, target_value, created_by
            ) VALUES (?, ?, 'campus', 'system', 'EVENT APPROVAL', 'STUDENT', ?, ?)
        """, (
            notif_title, notif_desc,
            app_row["student_identifier"] or app_row["student_id"],
            admin_name
        ))

        cur.execute("""
            INSERT INTO notifications (
                student_id, title, description, category, badge_type, badge_label, time_ago, unread
            ) VALUES (?, ?, ?, 'campus', 'system', 'EVENT APPROVAL', 'Just now', 1)
        """, (
            app_row["student_id"],
            notif_title,
            notif_desc
        ))
    except Exception as e:
        print("[Events] Notification dispatch warning:", e)

    conn.commit()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (app_id,))
    updated_app = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Event application status updated to {new_status}",
        "application": updated_app
    })

@api_bp.route("/events/applications/<int:app_id>", methods=["PUT"])
@require_auth
def update_event_application(app_id: int):
    """
    Student can edit their application if status is still PENDING.
    Admin can edit any application.
    """
    user = g.current_user
    user_id, user_name, user_ident = resolve_student_context(user)
    is_admin = user.get("role") == "admin"

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (app_id,))
    app_row = cur.fetchone()
    if not app_row:
        conn.close()
        return jsonify({"success": False, "error": "Event application not found"}), 404

    if not is_admin:
        if app_row["student_id"] != user_id and app_row["student_identifier"] != user_ident:
            conn.close()
            return jsonify({"success": False, "error": "Access denied"}), 403
        if app_row["status"] != "PENDING":
            conn.close()
            return jsonify({"success": False, "error": f"Cannot edit application once it is {app_row['status']}"}), 400

    data = request.get_json(silent=True) or {}

    event_name = str(data.get("event_name") or app_row["event_name"]).strip()
    event_type = str(data.get("event_type") or app_row["event_type"]).strip()
    description = str(data.get("description") or app_row["description"]).strip()
    proposed_date = str(data.get("proposed_date") or app_row["proposed_date"]).strip()
    start_time = str(data.get("start_time") or app_row["start_time"]).strip()
    end_time = str(data.get("end_time") or app_row["end_time"]).strip()
    venue = str(data.get("venue") or app_row["venue"]).strip()
    organizing_body = str(data.get("organizing_body") or app_row["organizing_body"]).strip()
    faculty_coordinator = str(data.get("faculty_coordinator") or app_row["faculty_coordinator"]).strip()
    additional_requirements = str(data.get("additional_requirements") or app_row["additional_requirements"] or "").strip() or None

    try:
        expected_participants = int(data.get("expected_participants") or app_row["expected_participants"])
    except (ValueError, TypeError):
        expected_participants = app_row["expected_participants"]

    cur.execute("""
        UPDATE event_applications
        SET event_name = ?, event_type = ?, description = ?, proposed_date = ?,
            start_time = ?, end_time = ?, venue = ?, expected_participants = ?,
            organizing_body = ?, faculty_coordinator = ?, additional_requirements = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        event_name, event_type, description, proposed_date,
        start_time, end_time, venue, expected_participants,
        organizing_body, faculty_coordinator, additional_requirements,
        app_id
    ))

    cur.execute("""
        INSERT INTO event_application_activities (
            application_id, actor_id, actor_name, actor_role, action,
            old_status, new_status, notes
        ) VALUES (?, ?, ?, ?, 'EDITED', ?, ?, 'Application details revised')
    """, (
        app_id, user_id, user_name, user.get("role", "student"),
        app_row["status"], app_row["status"]
    ))

    conn.commit()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (app_id,))
    updated_app = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Application updated successfully",
        "application": updated_app
    })

@api_bp.route("/events/applications/<int:app_id>", methods=["DELETE"])
@require_auth
def delete_event_application(app_id: int):
    """
    Withdraw or delete an event application.
    Students can withdraw their own application if still PENDING.
    Admins can delete/remove any application.
    """
    user = g.current_user
    user_id, _, user_ident = resolve_student_context(user)
    is_admin = user.get("role") == "admin"

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM event_applications WHERE id = ?", (app_id,))
    app_row = cur.fetchone()
    if not app_row:
        conn.close()
        return jsonify({"success": False, "error": "Event application not found"}), 404

    if not is_admin:
        if app_row["student_id"] != user_id and app_row["student_identifier"] != user_ident:
            conn.close()
            return jsonify({"success": False, "error": "Access denied: You can only withdraw your own applications"}), 403
        if app_row["status"] not in ("PENDING", "REJECTED"):
            conn.close()
            return jsonify({"success": False, "error": f"Cannot withdraw application in status {app_row['status']}"}), 400

    cur.execute("DELETE FROM event_application_activities WHERE application_id = ?", (app_id,))
    cur.execute("DELETE FROM event_applications WHERE id = ?", (app_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Application #{app_row['application_no']} withdrawn successfully"
    })

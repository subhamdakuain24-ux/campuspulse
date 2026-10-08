import json
from datetime import datetime, date
from flask import request, jsonify, g
from database import get_db_connection
from auth_middleware import require_auth, require_role
from . import api_bp

VALID_NOTICE_TYPES = ["LOST", "FOUND"]
VALID_LF_STATUSES = ["ACTIVE", "CLAIMED", "RESOLVED", "CLOSED"]

VALID_LF_CATEGORIES = [
    "Electronics",
    "Books & Stationery",
    "ID Cards & Documents",
    "Keys & Access Cards",
    "Clothing & Accessories",
    "Bags & Wallets",
    "Water Bottles & Flasks",
    "Sports Equipment",
    "Eyewear & Watches",
    "Other"
]

def resolve_user_context(user: dict) -> tuple[str, str, str]:
    u_id = str(user.get("id") or "")
    u_name = str(user.get("name") or "Campus Member")
    u_ident = str(user.get("identifier") or u_id)
    return u_id, u_name, u_ident

def format_notice_row(row: dict) -> dict:
    item = dict(row)
    return item

@api_bp.route("/lost-found", methods=["GET"])
@require_auth
def get_lost_found_notices():
    """
    List Lost & Found notices.
    Accessible to all authenticated users (Students, Teachers, Admins).
    Supports filters:
      - notice_type: 'LOST' | 'FOUND' | 'ALL'
      - category: category name or 'ALL'
      - status: 'ACTIVE' | 'CLAIMED' | 'RESOLVED' | 'CLOSED' | 'ALL' (defaults to non-closed if not specified)
      - location: filter text
      - date: YYYY-MM-DD
      - search: text query
      - my_only: 'true' to filter only records submitted by the current user
    """
    user = g.current_user
    user_id, _, user_ident = resolve_user_context(user)
    is_admin = user.get("role") == "admin"

    notice_type = request.args.get("notice_type", "").strip().upper()
    category = request.args.get("category", "").strip()
    status = request.args.get("status", "").strip().upper()
    location = request.args.get("location", "").strip()
    item_date = request.args.get("date", "").strip()
    search = request.args.get("search", "").strip()
    my_only = request.args.get("my_only", "").strip().lower() in ("true", "1", "yes")

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM lost_found_items WHERE 1=1"
    params = []

    if my_only:
        query += " AND (student_id = ? OR student_identifier = ?)"
        params.extend([user_id, user_ident])

    if notice_type and notice_type in VALID_NOTICE_TYPES:
        query += " AND notice_type = ?"
        params.append(notice_type)

    if category and category.upper() != "ALL":
        query += " AND category = ?"
        params.append(category)

    if status and status != "ALL":
        if status in VALID_LF_STATUSES:
            query += " AND status = ?"
            params.append(status)
    elif not my_only and not is_admin:
        # Default student public view shows ACTIVE, CLAIMED, RESOLVED (hide CLOSED)
        query += " AND status != 'CLOSED'"

    if location:
        query += " AND location LIKE ?"
        params.append(f"%{location}%")

    if item_date:
        query += " AND item_date = ?"
        params.append(item_date)

    if search:
        query += " AND (item_name LIKE ? OR description LIKE ? OR location LIKE ? OR contact_info LIKE ? OR category LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    query += " ORDER BY CASE WHEN status = 'ACTIVE' THEN 0 ELSE 1 END, created_at DESC, id DESC"

    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "notices": rows
    })

@api_bp.route("/lost-found/<int:item_id>", methods=["GET"])
@require_auth
def get_lost_found_detail(item_id: int):
    """
    Get detailed view of a single Lost & Found notice including activity history.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (item_id,))
    item = cur.fetchone()
    if not item:
        conn.close()
        return jsonify({"success": False, "error": "Notice not found"}), 404

    notice_dict = dict(item)

    cur.execute("""
        SELECT * FROM lost_found_activities
        WHERE item_id = ?
        ORDER BY created_at ASC, id ASC
    """, (item_id,))
    activities = [dict(r) for r in cur.fetchall()]
    notice_dict["activities"] = activities

    conn.close()
    return jsonify({
        "success": True,
        "notice": notice_dict
    })

@api_bp.route("/lost-found", methods=["POST"])
@require_auth
def create_lost_found_notice():
    """
    Create a new Lost or Found notice.
    Accessible to authenticated students and admins.
    Server-side validates required fields.
    """
    user = g.current_user
    user_id, user_name, user_ident = resolve_user_context(user)
    data = request.get_json(silent=True) or {}

    notice_type = str(data.get("notice_type") or "").strip().upper()
    item_name = str(data.get("item_name") or "").strip()
    category = str(data.get("category") or "").strip()
    description = str(data.get("description") or "").strip()
    location = str(data.get("location") or "").strip()
    item_date = str(data.get("item_date") or data.get("date") or "").strip()
    contact_info = str(data.get("contact_info") or "").strip()
    image_url = str(data.get("image_url") or "").strip() or None

    errors = []
    if notice_type not in VALID_NOTICE_TYPES:
        errors.append("Notice type must be 'LOST' or 'FOUND'")
    if not item_name or len(item_name) < 2:
        errors.append("Item name must be at least 2 characters")
    if not category:
        errors.append("Category is required")
    if not description or len(description) < 5:
        errors.append("Description must be at least 5 characters")
    if not location:
        errors.append("Location is required")
    if not item_date:
        errors.append("Date is required (YYYY-MM-DD)")
    if not contact_info:
        errors.append("Contact information is required")

    if errors:
        return jsonify({"success": False, "error": "; ".join(errors)}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Generate public ID e.g. LF-2024-001
    cur.execute("SELECT COUNT(*) as count FROM lost_found_items")
    count = cur.fetchone()["count"]
    year = date.today().year
    public_id = f"LF-{year}-{count + 1:04d}"

    cur.execute("""
        INSERT INTO lost_found_items (
            public_id, notice_type, item_name, category, description,
            location, item_date, contact_info, image_url,
            student_id, student_name, student_identifier, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    """, (
        public_id, notice_type, item_name, category, description,
        location, item_date, contact_info, image_url,
        user_id, user_name, user_ident
    ))
    new_id = cur.lastrowid

    # Record activity log
    cur.execute("""
        INSERT INTO lost_found_activities (
            item_id, actor_id, actor_name, actor_role, action,
            old_status, new_status, notes
        ) VALUES (?, ?, ?, ?, 'CREATED', NULL, 'ACTIVE', ?)
    """, (
        new_id, user_id, user_name, user.get("role", "student"),
        f"Notice published for {notice_type.lower()} item '{item_name}' at {location}"
    ))

    conn.commit()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (new_id,))
    created_item = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"{notice_type.capitalize()} notice published successfully!",
        "notice": created_item
    }), 201

@api_bp.route("/lost-found/<int:item_id>/status", methods=["PUT"])
@require_auth
def update_lost_found_status(item_id: int):
    """
    Update status of a Lost & Found notice (ACTIVE, CLAIMED, RESOLVED, CLOSED).
    Students can only manage their own notices.
    Admins can manage any notice.
    Records activity log and sends notification to student if modified by Admin.
    """
    user = g.current_user
    user_id, user_name, user_ident = resolve_user_context(user)
    is_admin = user.get("role") == "admin"

    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status") or "").strip().upper()
    notes = str(data.get("notes") or data.get("admin_notes") or "").strip() or None

    if new_status not in VALID_LF_STATUSES:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {', '.join(VALID_LF_STATUSES)}"
        }), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (item_id,))
    item = cur.fetchone()
    if not item:
        conn.close()
        return jsonify({"success": False, "error": "Notice not found"}), 404

    # RBAC: Check ownership if not admin
    if not is_admin and item["student_id"] != user_id and item["student_identifier"] != user_ident:
        conn.close()
        return jsonify({"success": False, "error": "Access denied: You can only manage your own notices"}), 403

    old_status = item["status"]

    cur.execute("""
        UPDATE lost_found_items
        SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, notes, item_id))

    # Activity log
    cur.execute("""
        INSERT INTO lost_found_activities (
            item_id, actor_id, actor_name, actor_role, action,
            old_status, new_status, notes
        ) VALUES (?, ?, ?, ?, 'STATUS_UPDATE', ?, ?, ?)
    """, (
        item_id, user_id, user_name, user.get("role", "student"),
        old_status, new_status,
        notes or f"Status changed from {old_status} to {new_status}"
    ))

    # Targeted notification if changed by admin for student's notice
    if is_admin and (item["student_id"] != user_id):
        try:
            notif_title = f"Lost & Found Notice: {new_status.capitalize()}"
            notif_desc = f"Your notice for '{item['item_name']}' ({item['notice_type']}) has been marked as {new_status}."
            if notes:
                notif_desc += f" Note: {notes}"
            cur.execute("""
                INSERT INTO targeted_notifications (
                    title, description, category, badge_type, badge_label,
                    target_type, target_value, created_by
                ) VALUES (?, ?, 'system', 'system', 'LOST & FOUND', 'STUDENT', ?, ?)
            """, (
                notif_title, notif_desc,
                item["student_identifier"] or item["student_id"],
                user_name
            ))

            cur.execute("""
                INSERT INTO notifications (
                    student_id, title, description, category, badge_type, badge_label, time_ago, unread
                ) VALUES (?, ?, ?, 'system', 'system', 'LOST & FOUND', 'Just now', 1)
            """, (
                item["student_id"],
                notif_title,
                notif_desc
            ))
        except Exception as e:
            print("[LostFound] Notification error:", e)

    conn.commit()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (item_id,))
    updated_row = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Notice status updated to {new_status}",
        "notice": updated_row
    })

@api_bp.route("/lost-found/<int:item_id>", methods=["PUT"])
@require_auth
def update_lost_found_notice(item_id: int):
    """
    Update details of a notice.
    Students can update their own notice; Admins can update any notice.
    """
    user = g.current_user
    user_id, user_name, user_ident = resolve_user_context(user)
    is_admin = user.get("role") == "admin"

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (item_id,))
    item = cur.fetchone()
    if not item:
        conn.close()
        return jsonify({"success": False, "error": "Notice not found"}), 404

    if not is_admin and item["student_id"] != user_id and item["student_identifier"] != user_ident:
        conn.close()
        return jsonify({"success": False, "error": "Access denied: You can only edit your own notices"}), 403

    data = request.get_json(silent=True) or {}

    item_name = str(data.get("item_name") or item["item_name"]).strip()
    category = str(data.get("category") or item["category"]).strip()
    description = str(data.get("description") or item["description"]).strip()
    location = str(data.get("location") or item["location"]).strip()
    item_date = str(data.get("item_date") or data.get("date") or item["item_date"]).strip()
    contact_info = str(data.get("contact_info") or item["contact_info"]).strip()
    image_url = str(data.get("image_url") or item["image_url"] or "").strip() or None
    status = str(data.get("status") or item["status"]).strip().upper()
    admin_notes = str(data.get("admin_notes") or item["admin_notes"] or "").strip() or None

    if status not in VALID_LF_STATUSES:
        status = item["status"]

    cur.execute("""
        UPDATE lost_found_items
        SET item_name = ?, category = ?, description = ?, location = ?,
            item_date = ?, contact_info = ?, image_url = ?, status = ?,
            admin_notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (item_name, category, description, location, item_date, contact_info, image_url, status, admin_notes, item_id))

    cur.execute("""
        INSERT INTO lost_found_activities (
            item_id, actor_id, actor_name, actor_role, action,
            old_status, new_status, notes
        ) VALUES (?, ?, ?, ?, 'EDITED', ?, ?, 'Notice details updated')
    """, (
        item_id, user_id, user_name, user.get("role", "student"),
        item["status"], status
    ))

    conn.commit()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (item_id,))
    updated_item = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Notice updated successfully",
        "notice": updated_item
    })

@api_bp.route("/lost-found/<int:item_id>", methods=["DELETE"])
@require_auth
def delete_lost_found_notice(item_id: int):
    """
    Remove or close a notice.
    Students can delete their own notice. Admins can remove any notice.
    """
    user = g.current_user
    user_id, user_name, user_ident = resolve_user_context(user)
    is_admin = user.get("role") == "admin"

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM lost_found_items WHERE id = ?", (item_id,))
    item = cur.fetchone()
    if not item:
        conn.close()
        return jsonify({"success": False, "error": "Notice not found"}), 404

    if not is_admin and item["student_id"] != user_id and item["student_identifier"] != user_ident:
        conn.close()
        return jsonify({"success": False, "error": "Access denied: You can only remove your own notices"}), 403

    cur.execute("DELETE FROM lost_found_activities WHERE item_id = ?", (item_id,))
    cur.execute("DELETE FROM lost_found_items WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Notice '{item['item_name']}' removed successfully"
    })

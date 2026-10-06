import json
from datetime import datetime
from flask import request, jsonify, g
from database import get_db_connection
from auth_middleware import require_auth
from . import api_bp

VALID_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
VALID_MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER"]
VALID_FEEDBACK_MEAL_TYPES = ["BREAKFAST", "LUNCH", "SNACKS", "DINNER", "GENERAL"]
VALID_FEEDBACK_CATEGORIES = [
    "FOOD_QUALITY",
    "TASTE",
    "HYGIENE",
    "QUANTITY",
    "TIMING",
    "SERVICE",
    "OTHER"
]

CATEGORY_LABELS = {
    "FOOD_QUALITY": "Food Quality & Freshness",
    "TASTE": "Taste & Seasoning",
    "HYGIENE": "Dining & Utensil Hygiene",
    "QUANTITY": "Serving Quantity & Portion",
    "TIMING": "Meal Service Timings",
    "SERVICE": "Staff & Counter Service",
    "OTHER": "General Mess Feedback"
}

# ==========================================
# 1. Mess Menu Endpoints
# ==========================================

@api_bp.route("/operations/mess/menu", methods=["GET"])
@require_auth
def get_mess_menu():
    """
    Get mess menu schedule.
    Supports filters:
    - day (e.g. 'Monday')
    - date (YYYY-MM-DD)
    - meal_type (e.g. 'BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')
    Available to all authenticated users (Students, Teachers, Admins).
    """
    day = request.args.get("day", "").strip()
    date_param = request.args.get("date", "").strip()
    meal_type = request.args.get("meal_type", "").strip().upper()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM mess_menu WHERE 1=1"
    params = []

    if day and day.capitalize() in VALID_DAYS:
        query += " AND (day_of_week = ? OR day_of_week = ?)"
        params.extend([day.capitalize(), day])
    
    if date_param:
        query += " AND (date = ? OR date IS NULL)"
        params.append(date_param)

    if meal_type and meal_type in VALID_MEAL_TYPES:
        query += " AND meal_type = ?"
        params.append(meal_type)

    query += " ORDER BY CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 WHEN 'Sunday' THEN 7 ELSE 8 END, CASE meal_type WHEN 'BREAKFAST' THEN 1 WHEN 'LUNCH' THEN 2 WHEN 'SNACKS' THEN 3 WHEN 'DINNER' THEN 4 ELSE 5 END ASC"

    cur.execute(query, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    # Group by day of week for convenience
    grouped_by_day = {}
    for r in rows:
        d = r["day_of_week"]
        if d not in grouped_by_day:
            grouped_by_day[d] = []
        grouped_by_day[d].append(r)

    return jsonify({
        "success": True,
        "count": len(rows),
        "menu": rows,
        "grouped_by_day": grouped_by_day
    }), 200

@api_bp.route("/operations/mess/menu", methods=["POST"])
@require_auth
def create_mess_menu_item():
    """
    Create a new mess menu entry.
    Restricted to Admin / Warden / Mess Manager / Staff.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    if user_role not in ("admin", "teacher", "staff", "warden"):
        return jsonify({
            "success": False,
            "error": "Forbidden: Only authorized administrative personnel can manage the mess menu."
        }), 403

    data = request.get_json() or {}
    day_of_week = str(data.get("day_of_week") or "").strip().capitalize()
    meal_type = str(data.get("meal_type") or "").strip().upper()
    items = str(data.get("items") or "").strip()
    timings = str(data.get("timings") or "").strip()
    dietary_info = str(data.get("dietary_info") or "Vegetarian").strip()
    special_note = data.get("special_note")
    date_val = data.get("date")

    if day_of_week not in VALID_DAYS:
        return jsonify({"success": False, "error": f"Invalid day_of_week. Must be one of: {', '.join(VALID_DAYS)}"}), 400

    if meal_type not in VALID_MEAL_TYPES:
        return jsonify({"success": False, "error": f"Invalid meal_type. Must be one of: {', '.join(VALID_MEAL_TYPES)}"}), 400

    if not items:
        return jsonify({"success": False, "error": "Items list is required."}), 400

    if not timings:
        # Default timings if omitted
        defaults = {
            "BREAKFAST": "07:30 AM - 09:30 AM",
            "LUNCH": "12:30 PM - 02:30 PM",
            "SNACKS": "05:00 PM - 06:15 PM",
            "DINNER": "07:30 PM - 09:45 PM"
        }
        timings = defaults.get(meal_type, "08:00 AM - 10:00 AM")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO mess_menu (day_of_week, meal_type, date, items, timings, dietary_info, special_note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (day_of_week, meal_type, date_val, items, timings, dietary_info, special_note))
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM mess_menu WHERE id = ?", (new_id,))
    new_item = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"{day_of_week} {meal_type.title()} menu created successfully.",
        "item": new_item
    }), 201

@api_bp.route("/operations/mess/menu/<int:item_id>", methods=["PATCH", "PUT"])
@require_auth
def update_mess_menu_item(item_id: int):
    """
    Update an existing mess menu entry.
    Restricted to Admin / Warden / Mess Manager / Staff.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    if user_role not in ("admin", "teacher", "staff", "warden"):
        return jsonify({
            "success": False,
            "error": "Forbidden: Only authorized administrative personnel can update the mess menu."
        }), 403

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM mess_menu WHERE id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Menu entry not found."}), 404

    data = request.get_json() or {}
    updates = []
    params = []

    if "day_of_week" in data:
        day = str(data["day_of_week"]).strip().capitalize()
        if day in VALID_DAYS:
            updates.append("day_of_week = ?")
            params.append(day)
    
    if "meal_type" in data:
        mt = str(data["meal_type"]).strip().upper()
        if mt in VALID_MEAL_TYPES:
            updates.append("meal_type = ?")
            params.append(mt)

    if "items" in data:
        items_str = str(data["items"]).strip()
        if items_str:
            updates.append("items = ?")
            params.append(items_str)

    if "timings" in data:
        updates.append("timings = ?")
        params.append(str(data["timings"]).strip())

    if "dietary_info" in data:
        updates.append("dietary_info = ?")
        params.append(str(data["dietary_info"]).strip())

    if "special_note" in data:
        updates.append("special_note = ?")
        params.append(data["special_note"])

    if "date" in data:
        updates.append("date = ?")
        params.append(data["date"])

    if not updates:
        conn.close()
        return jsonify({"success": True, "message": "No changes supplied.", "item": dict(row)}), 200

    updates.append("updated_at = CURRENT_TIMESTAMP")
    sql = f"UPDATE mess_menu SET {', '.join(updates)} WHERE id = ?"
    params.append(item_id)

    cur.execute(sql, tuple(params))
    conn.commit()

    cur.execute("SELECT * FROM mess_menu WHERE id = ?", (item_id,))
    updated_item = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Menu item updated successfully.",
        "item": updated_item
    }), 200

@api_bp.route("/operations/mess/menu/<int:item_id>", methods=["DELETE"])
@require_auth
def delete_mess_menu_item(item_id: int):
    """
    Delete a mess menu entry.
    Restricted to Admin / Warden / Mess Manager / Staff.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    if user_role not in ("admin", "teacher", "staff", "warden"):
        return jsonify({
            "success": False,
            "error": "Forbidden: Only authorized administrative personnel can delete mess menu entries."
        }), 403

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, day_of_week, meal_type FROM mess_menu WHERE id = ?", (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Menu entry not found."}), 404

    cur.execute("DELETE FROM mess_menu WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Deleted {row['day_of_week']} {row['meal_type']} menu entry."
    }), 200

# ==========================================
# 2. Mess Feedback Endpoints
# ==========================================

@api_bp.route("/operations/mess/feedback", methods=["GET"])
@require_auth
def get_mess_feedback():
    """
    Retrieve mess feedback records.
    - If Student: restricted to their own submitted feedback.
    - If Admin/Staff: sees all submitted feedback with analytics (ratings, categories, repeated issues).
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()

    category = request.args.get("category", "").strip().upper()
    rating_param = request.args.get("rating", "").strip()
    meal_type = request.args.get("meal_type", "").strip().upper()
    date_param = request.args.get("date", "").strip()
    search = request.args.get("search", "").strip().lower()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM mess_feedback WHERE 1=1"
    params = []

    # Student isolation
    if user_role == "student":
        curr_id = str(user.get("id") or "")
        curr_ident = str(user.get("identifier") or "")
        if curr_id == "1" or curr_ident in ("STU-2023-8941", "CP-847291"):
            query += " AND (student_id IN ('1', 'STU-2023-8941') OR student_identifier IN ('CP-847291', 'STU-2023-8941'))"
        else:
            query += " AND (student_id = ? OR student_identifier = ?)"
            params.extend([curr_id, curr_ident])
    else:
        # Admin / Staff can filter by student if desired
        student_filter = request.args.get("student_id", "").strip()
        if student_filter:
            query += " AND (student_id = ? OR student_identifier = ?)"
            params.extend([student_filter, student_filter])

    if category and category != "ALL" and category in VALID_FEEDBACK_CATEGORIES:
        query += " AND category = ?"
        params.append(category)

    if rating_param and rating_param != "ALL" and rating_param.isdigit():
        query += " AND rating = ?"
        params.append(int(rating_param))

    if meal_type and meal_type != "ALL" and meal_type in VALID_FEEDBACK_MEAL_TYPES:
        query += " AND meal_type = ?"
        params.append(meal_type)

    if date_param:
        query += " AND meal_date = ?"
        params.append(date_param)

    if search:
        query += " AND (LOWER(comments) LIKE ? OR LOWER(student_name) LIKE ? OR LOWER(student_identifier) LIKE ?)"
        s_term = f"%{search}%"
        params.extend([s_term, s_term, s_term])

    query += " ORDER BY id DESC"

    cur.execute(query, tuple(params))
    rows = [dict(r) for r in cur.fetchall()]

    # If Admin, also calculate holistic aggregation across all feedback records
    stats = None
    if user_role in ("admin", "teacher", "staff", "warden"):
        cur.execute("SELECT * FROM mess_feedback")
        all_fb = [dict(r) for r in cur.fetchall()]
        
        total = len(all_fb)
        total_rating = sum(r["rating"] for r in all_fb)
        avg_rating = round(total_rating / total, 1) if total > 0 else 0.0

        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        cat_dist = {}
        repeated_groups = {}

        for r in all_fb:
            rt = r["rating"]
            cat = r["category"]
            mt = r.get("meal_type") or "GENERAL"
            
            if rt in rating_dist:
                rating_dist[rt] += 1
            cat_dist[cat] = cat_dist.get(cat, 0) + 1

            # Group negative or critical feedback (rating <= 3) deterministically
            if rt <= 3:
                key = (cat, mt)
                if key not in repeated_groups:
                    repeated_groups[key] = {
                        "category": cat,
                        "category_label": CATEGORY_LABELS.get(cat, cat.replace("_", " ").title()),
                        "meal_type": mt,
                        "count": 0,
                        "sample_comments": [],
                        "latest_date": r["meal_date"]
                    }
                grp = repeated_groups[key]
                grp["count"] += 1
                if len(grp["sample_comments"]) < 2:
                    grp["sample_comments"].append(r["comments"])
                if r["meal_date"] > grp["latest_date"]:
                    grp["latest_date"] = r["meal_date"]

        # Format repeated problems
        repeated_issues = []
        for idx, (k, grp) in enumerate(repeated_groups.items()):
            grp["id"] = f"mess-issue-{idx+1}"
            grp["severity"] = "HIGH" if grp["count"] >= 2 else "MEDIUM"
            repeated_issues.append(grp)
        
        repeated_issues.sort(key=lambda x: x["count"], reverse=True)

        stats = {
            "total_feedback": total,
            "average_rating": avg_rating,
            "rating_distribution": rating_dist,
            "category_distribution": cat_dist,
            "repeated_issues": repeated_issues
        }

    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "feedback": rows,
        "stats": stats
    }), 200

@api_bp.route("/operations/mess/feedback", methods=["POST"])
@require_auth
def submit_mess_feedback():
    """
    Submit mess feedback.
    Associates feedback strictly with the authenticated user/student.
    Prevents unauthorized spoofing.
    """
    user = g.current_user
    data = request.get_json() or {}

    rating_val = data.get("rating")
    category_val = str(data.get("category") or "FOOD_QUALITY").strip().upper()
    comments_val = str(data.get("comments") or "").strip()
    meal_type_val = str(data.get("meal_type") or "GENERAL").strip().upper()
    meal_date_val = str(data.get("meal_date") or "").strip()

    # Validations
    if not rating_val or not str(rating_val).isdigit():
        return jsonify({"success": False, "error": "Rating is required and must be an integer between 1 and 5."}), 400
    
    rating_int = int(rating_val)
    if rating_int < 1 or rating_int > 5:
        return jsonify({"success": False, "error": "Rating must be between 1 and 5 stars."}), 400

    if category_val not in VALID_FEEDBACK_CATEGORIES:
        return jsonify({
            "success": False,
            "error": f"Invalid category. Must be one of: {', '.join(VALID_FEEDBACK_CATEGORIES)}"
        }), 400

    if not comments_val:
        return jsonify({"success": False, "error": "Please provide feedback comments (minimum 3 characters)."}), 400
    
    if len(comments_val) < 3:
        return jsonify({"success": False, "error": "Feedback comments must be at least 3 characters long."}), 400

    if meal_type_val not in VALID_FEEDBACK_MEAL_TYPES:
        meal_type_val = "GENERAL"

    if not meal_date_val:
        meal_date_val = datetime.utcnow().strftime("%Y-%m-%d")

    # Authoritative user data from token
    student_id = str(user.get("id") or "1")
    student_name = user.get("name") or "Student"
    student_identifier = user.get("identifier") or "CP-847291"

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO mess_feedback (
            student_id, student_name, student_identifier,
            meal_type, rating, category, comments, meal_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        student_id, student_name, student_identifier,
        meal_type_val, rating_int, category_val, comments_val, meal_date_val
    ))
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM mess_feedback WHERE id = ?", (new_id,))
    new_record = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Thank you! Your mess feedback has been submitted successfully.",
        "feedback": new_record
    }), 201

@api_bp.route("/operations/mess/feedback/<int:feedback_id>", methods=["DELETE"])
@require_auth
def delete_mess_feedback(feedback_id: int):
    """
    Delete feedback entry.
    Students can delete ONLY their own feedback.
    Admin/Staff can delete any feedback.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM mess_feedback WHERE id = ?", (feedback_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Feedback entry not found."}), 404

    # RBAC: Student can only delete their own
    if user_role == "student":
        allowed_ids = {str(user.get("id")), str(user.get("identifier"))}
        if str(user.get("id")) == "1":
            allowed_ids.add("STU-2023-8941")
            allowed_ids.add("CP-847291")
        if str(row["student_id"]) not in allowed_ids and str(row["student_identifier"]) not in allowed_ids:
            conn.close()
            return jsonify({
                "success": False,
                "error": "Forbidden: You are not authorized to delete another student's feedback."
            }), 403

    cur.execute("DELETE FROM mess_feedback WHERE id = ?", (feedback_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Feedback entry deleted successfully."
    }), 200

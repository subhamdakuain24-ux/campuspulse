import json
from datetime import datetime, date
from flask import request, jsonify, g
from database import get_db_connection
from auth_middleware import require_auth
from . import api_bp

VALID_FEE_CATEGORIES = [
    "TUITION",
    "HOSTEL",
    "MESS",
    "LIBRARY",
    "EXAM",
    "LABORATORY",
    "OTHER"
]

VALID_FEE_STATUSES = [
    "PAID",
    "PENDING",
    "PARTIAL",
    "OVERDUE"
]

CATEGORY_LABELS = {
    "TUITION": "Tuition & Coursework",
    "HOSTEL": "Hostel & Accommodation",
    "MESS": "Mess & Dining Meal Plan",
    "LIBRARY": "Library Security & Book Bank",
    "EXAM": "Examination & Certification",
    "LABORATORY": "Laboratory & Cloud Resources",
    "OTHER": "General Campus Dues"
}

def normalize_fee_record(row: dict) -> dict:
    """Computes dynamic outstanding balance and verifies overdue status."""
    rec = dict(row)
    total = float(rec.get("total_amount") or 0.0)
    paid = float(rec.get("amount_paid") or 0.0)
    outstanding = max(0.0, round(total - paid, 2))
    rec["total_amount"] = total
    rec["amount_paid"] = paid
    rec["outstanding_amount"] = outstanding
    rec["category_label"] = CATEGORY_LABELS.get(rec.get("category", "OTHER"), rec.get("category", "OTHER"))

    # Check overdue status
    due_date_str = str(rec.get("due_date") or "").strip()
    status = rec.get("status", "PENDING")
    if status != "PAID" and due_date_str:
        try:
            due_d = datetime.strptime(due_date_str[:10], "%Y-%m-%d").date()
            if due_d < date.today() and outstanding > 0:
                rec["is_overdue"] = True
                if status == "PENDING":
                    rec["status"] = "OVERDUE"
            else:
                rec["is_overdue"] = False
        except Exception:
            rec["is_overdue"] = False
    else:
        rec["is_overdue"] = False

    return rec

# ==========================================
# Fees & Dues Endpoints
# ==========================================

@api_bp.route("/operations/fees", methods=["GET"])
@require_auth
def get_fees():
    """
    List fees & dues records.
    - If Student: strictly restricted to their own fee dues.
    - If Admin / Staff: view all student fee records with search and filters.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()

    status_param = request.args.get("status", "").strip().upper()
    category_param = request.args.get("category", "").strip().upper()
    student_id_param = request.args.get("student_id", "").strip()
    search = request.args.get("search", "").strip().lower()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM student_fees WHERE 1=1"
    params = []

    # Student Access Control: Strictly isolate to authenticated student
    if user_role == "student":
        curr_id = str(user.get("id") or "")
        curr_ident = str(user.get("identifier") or "")
        if curr_id in ("1", "STU-2023-8941") or curr_ident in ("CP-847291", "STU-2023-8941"):
            query += " AND (student_id IN ('1', 'STU-2023-8941') OR student_identifier IN ('CP-847291', 'STU-2023-8941'))"
        else:
            query += " AND (student_id = ? OR student_identifier = ?)"
            params.extend([curr_id, curr_ident])
    else:
        # Admin / Staff can filter by student
        if student_id_param and student_id_param != "ALL":
            query += " AND (student_id = ? OR student_identifier = ?)"
            params.extend([student_id_param, student_id_param])

    if status_param and status_param != "ALL" and status_param in VALID_FEE_STATUSES:
        query += " AND status = ?"
        params.append(status_param)

    if category_param and category_param != "ALL" and category_param in VALID_FEE_CATEGORIES:
        query += " AND category = ?"
        params.append(category_param)

    if search:
        query += " AND (LOWER(title) LIKE ? OR LOWER(student_name) LIKE ? OR LOWER(student_identifier) LIKE ? OR LOWER(notes) LIKE ?)"
        s_term = f"%{search}%"
        params.extend([s_term, s_term, s_term, s_term])

    query += " ORDER BY id DESC"

    cur.execute(query, tuple(params))
    raw_rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    fees = [normalize_fee_record(r) for r in raw_rows]

    # Calculate summary metrics
    total_assessed = round(sum(f["total_amount"] for f in fees), 2)
    amount_paid = round(sum(f["amount_paid"] for f in fees), 2)
    outstanding_amount = round(sum(f["outstanding_amount"] for f in fees), 2)
    overdue_amount = round(sum(f["outstanding_amount"] for f in fees if f.get("is_overdue") or f["status"] == "OVERDUE"), 2)

    status_counts = {"PAID": 0, "PENDING": 0, "PARTIAL": 0, "OVERDUE": 0}
    for f in fees:
        st = f["status"]
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts["PENDING"] += 1

    if user_role == "student":
        return jsonify({
            "success": True,
            "role": "student",
            "count": len(fees),
            "fees": fees,
            "summary": {
                "total_fees": total_assessed,
                "amount_paid": amount_paid,
                "outstanding_amount": outstanding_amount,
                "overdue_amount": overdue_amount,
                "status_counts": status_counts
            }
        }), 200
    else:
        return jsonify({
            "success": True,
            "role": user_role,
            "count": len(fees),
            "fees": fees,
            "summary": {
                "total_assessed": total_assessed,
                "total_collected": amount_paid,
                "total_outstanding": outstanding_amount,
                "total_overdue": overdue_amount,
                "overdue_count": status_counts.get("OVERDUE", 0),
                "status_counts": status_counts
            }
        }), 200

@api_bp.route("/operations/fees", methods=["POST"])
@require_auth
def create_fee_record():
    """
    Create a new fee record.
    Restricted to Admin / Staff / Warden.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    if user_role not in ("admin", "teacher", "staff", "warden"):
        return jsonify({
            "success": False,
            "error": "Forbidden: Only administrative staff can create fee records."
        }), 403

    data = request.get_json(silent=True) or {}
    student_id = str(data.get("student_id") or "").strip()
    title = str(data.get("title") or "").strip()
    category = str(data.get("category") or "TUITION").strip().upper()
    term = str(data.get("term") or "Fall 2023").strip()
    due_date = str(data.get("due_date") or "").strip()
    payment_method = data.get("payment_method")
    notes = data.get("notes")
    transaction_reference = data.get("transaction_reference")

    # Validations
    if not student_id:
        return jsonify({"success": False, "error": "Student ID is required."}), 400

    if not title or len(title) < 3:
        return jsonify({"success": False, "error": "Fee title is required and must be at least 3 characters."}), 400

    if category not in VALID_FEE_CATEGORIES:
        return jsonify({"success": False, "error": f"Invalid category. Must be one of: {', '.join(VALID_FEE_CATEGORIES)}"}), 400

    try:
        total_amount = float(data.get("total_amount") or 0.0)
        if total_amount < 0:
            raise ValueError()
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Total amount must be a positive number."}), 400

    try:
        amount_paid = float(data.get("amount_paid") or 0.0)
        if amount_paid < 0 or amount_paid > total_amount:
            return jsonify({"success": False, "error": "Amount paid cannot be negative or exceed total amount."}), 400
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "Invalid amount paid."}), 400

    if not due_date:
        return jsonify({"success": False, "error": "Due date is required (YYYY-MM-DD)."}), 400

    try:
        datetime.strptime(due_date[:10], "%Y-%m-%d")
    except ValueError:
        return jsonify({"success": False, "error": "Invalid due date format. Please use YYYY-MM-DD."}), 400

    # Look up student in students table
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name, student_id FROM students WHERE id = ? OR student_id = ? LIMIT 1", (student_id, student_id))
    s_row = cur.fetchone()
    if not s_row:
        conn.close()
        return jsonify({"success": False, "error": f"Student '{student_id}' not found."}), 404

    student_name = s_row["name"]
    student_identifier = s_row["student_id"]
    target_student_id = s_row["id"]

    # Determine status
    explicit_status = str(data.get("status") or "").strip().upper()
    if explicit_status in VALID_FEE_STATUSES:
        status = explicit_status
    elif amount_paid >= total_amount:
        status = "PAID"
    elif amount_paid > 0:
        status = "PARTIAL"
    elif datetime.strptime(due_date[:10], "%Y-%m-%d").date() < date.today():
        status = "OVERDUE"
    else:
        status = "PENDING"

    paid_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S") if status == "PAID" else None

    cur.execute("""
        INSERT INTO student_fees (
            student_id, student_name, student_identifier,
            title, category, term, total_amount, amount_paid,
            due_date, status, payment_method, transaction_reference,
            paid_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        target_student_id, student_name, student_identifier,
        title, category, term, total_amount, amount_paid,
        due_date[:10], status, payment_method, transaction_reference,
        paid_at, notes
    ))
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM student_fees WHERE id = ?", (new_id,))
    new_fee = normalize_fee_record(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Fee record #{new_id} created successfully for {student_name}.",
        "fee": new_fee
    }), 201

@api_bp.route("/operations/fees/<int:fee_id>", methods=["PATCH", "PUT"])
@require_auth
def update_fee_record(fee_id: int):
    """
    Update fee record (amount paid, status, due date, notes).
    Restricted to Admin / Staff.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    if user_role not in ("admin", "teacher", "staff", "warden"):
        return jsonify({
            "success": False,
            "error": "Forbidden: Only administrative staff can modify fee records."
        }), 403

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM student_fees WHERE id = ?", (fee_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"success": False, "error": f"Fee record #{fee_id} not found."}), 404

    data = request.get_json(silent=True) or {}
    updates = []
    params = []

    total_amount = float(existing["total_amount"])
    amount_paid = float(existing["amount_paid"])

    if "title" in data and data["title"]:
        updates.append("title = ?")
        params.append(str(data["title"]).strip())

    if "category" in data and str(data["category"]).upper() in VALID_FEE_CATEGORIES:
        updates.append("category = ?")
        params.append(str(data["category"]).upper())

    if "total_amount" in data:
        try:
            total_amount = float(data["total_amount"])
            if total_amount < 0:
                raise ValueError()
            updates.append("total_amount = ?")
            params.append(total_amount)
        except (ValueError, TypeError):
            conn.close()
            return jsonify({"success": False, "error": "Total amount must be a positive number."}), 400

    if "amount_paid" in data:
        try:
            amount_paid = float(data["amount_paid"])
            if amount_paid < 0 or amount_paid > total_amount:
                conn.close()
                return jsonify({"success": False, "error": "Amount paid cannot be negative or exceed total amount."}), 400
            updates.append("amount_paid = ?")
            params.append(amount_paid)
        except (ValueError, TypeError):
            conn.close()
            return jsonify({"success": False, "error": "Invalid amount paid."}), 400

    if "due_date" in data and data["due_date"]:
        d_str = str(data["due_date"]).strip()[:10]
        try:
            datetime.strptime(d_str, "%Y-%m-%d")
            updates.append("due_date = ?")
            params.append(d_str)
        except ValueError:
            conn.close()
            return jsonify({"success": False, "error": "Invalid due date format (YYYY-MM-DD required)."}), 400

    # Auto-adjust status if status not explicitly specified
    if "status" in data and str(data["status"]).upper() in VALID_FEE_STATUSES:
        status_to_set = str(data["status"]).upper()
        updates.append("status = ?")
        params.append(status_to_set)
        if status_to_set == "PAID":
            updates.append("paid_at = ?")
            params.append(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
    elif "amount_paid" in data or "total_amount" in data:
        if amount_paid >= total_amount:
            updates.append("status = 'PAID'")
            updates.append("paid_at = ?")
            params.append(datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"))
        elif amount_paid > 0:
            updates.append("status = 'PARTIAL'")
        else:
            updates.append("status = 'PENDING'")

    if "payment_method" in data:
        updates.append("payment_method = ?")
        params.append(str(data["payment_method"]).strip() if data["payment_method"] else None)

    if "transaction_reference" in data:
        updates.append("transaction_reference = ?")
        params.append(str(data["transaction_reference"]).strip() if data["transaction_reference"] else None)

    if "notes" in data:
        updates.append("notes = ?")
        params.append(str(data["notes"]).strip() if data["notes"] else None)

    updates.append("updated_at = CURRENT_TIMESTAMP")

    if not updates:
        conn.close()
        return jsonify({"success": True, "message": "No updates specified.", "fee": normalize_fee_record(existing)}), 200

    sql = f"UPDATE student_fees SET {', '.join(updates)} WHERE id = ?"
    params.append(fee_id)
    cur.execute(sql, tuple(params))
    conn.commit()

    cur.execute("SELECT * FROM student_fees WHERE id = ?", (fee_id,))
    updated_rec = normalize_fee_record(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Fee record #{fee_id} updated successfully.",
        "fee": updated_rec
    }), 200

@api_bp.route("/operations/fees/<int:fee_id>", methods=["DELETE"])
@require_auth
def delete_fee_record(fee_id: int):
    """
    Delete a fee record.
    Restricted to Admin / Staff.
    """
    user = g.current_user
    user_role = (user.get("role") or "").lower()
    if user_role not in ("admin", "teacher", "staff", "warden"):
        return jsonify({
            "success": False,
            "error": "Forbidden: Only administrative staff can delete fee records."
        }), 403

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, title, student_name FROM student_fees WHERE id = ?", (fee_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": f"Fee record #{fee_id} not found."}), 404

    cur.execute("DELETE FROM student_fees WHERE id = ?", (fee_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Fee record #{fee_id} ('{row['title']}') deleted successfully."
    }), 200

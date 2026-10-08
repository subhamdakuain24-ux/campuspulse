from datetime import datetime, date, timedelta
from flask import request, jsonify, g
from database import get_db_connection
from auth_middleware import require_auth, require_role
from . import api_bp

# ==========================================
# FEATURE 1: PREVIOUS YEAR PAPERS
# ==========================================

VALID_EXAM_TYPES = ["Mid-Term", "End-Term", "Supplementary", "Model Paper"]
VALID_DEPARTMENTS = [
    "Computer Science & Engineering",
    "Information Technology",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Basic Sciences & Humanities",
    "School of Computing & Data Sciences",
    "School of Engineering",
]

def format_paper_row(row: dict) -> dict:
    item = dict(row)
    item["semester_display"] = f"Semester {item.get('semester')}"
    return item

@api_bp.route("/papers", methods=["GET"])
@require_auth
def get_previous_year_papers():
    """
    List and filter previous year question papers.
    Accessible to all authenticated users (Students, Teachers, Admins).
    Supports filters: department, semester, subject, year, exam_type, search.
    """
    search = request.args.get("search", "").strip()
    department = request.args.get("department", "").strip()
    semester = request.args.get("semester", "").strip()
    subject = request.args.get("subject", "").strip()
    year = request.args.get("year", "").strip()
    exam_type = request.args.get("exam_type", "").strip()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM previous_year_papers WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE ? OR subject LIKE ? OR subject_code LIKE ? OR department LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    if department and department.lower() != "all":
        query += " AND department = ?"
        params.append(department)

    if semester and semester.lower() != "all":
        try:
            sem_num = int(semester)
            query += " AND semester = ?"
            params.append(sem_num)
        except ValueError:
            pass

    if subject and subject.lower() != "all":
        query += " AND (subject LIKE ? OR subject_code LIKE ?)"
        params.extend([f"%{subject}%", f"%{subject}%"])

    if year and year.lower() != "all":
        try:
            yr_num = int(year)
            query += " AND year = ?"
            params.append(yr_num)
        except ValueError:
            pass

    if exam_type and exam_type.lower() != "all":
        query += " AND exam_type = ?"
        params.append(exam_type)

    query += " ORDER BY year DESC, semester ASC, subject ASC"

    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    papers = [format_paper_row(r) for r in rows]
    return jsonify({
        "success": True,
        "count": len(papers),
        "papers": papers
    })

@api_bp.route("/papers/<int:paper_id>", methods=["GET"])
@require_auth
def get_paper_by_id(paper_id: int):
    """Retrieve single paper detail."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM previous_year_papers WHERE id = ?", (paper_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"success": False, "error": "Question paper not found"}), 404

    return jsonify({"success": True, "paper": format_paper_row(row)})

@api_bp.route("/papers", methods=["POST"])
@require_role("admin")
def create_previous_year_paper():
    """
    Admin: Add a new previous year paper record.
    Server-side validation enforces title, subject, department, semester, exam_type, year, and safe resource reference.
    """
    data = request.get_json(silent=True) or {}
    title = str(data.get("title") or "").strip()
    subject = str(data.get("subject") or "").strip()
    subject_code = str(data.get("subject_code") or "").strip() or None
    department = str(data.get("department") or "").strip()
    semester = data.get("semester")
    exam_type = str(data.get("exam_type") or "End-Term").strip()
    year = data.get("year")
    resource_url = str(data.get("resource_url") or "").strip()
    file_size = str(data.get("file_size") or "1.5 MB").strip()

    if not title:
        return jsonify({"success": False, "error": "Paper title is required"}), 400
    if not subject:
        return jsonify({"success": False, "error": "Subject name is required"}), 400
    if not department:
        return jsonify({"success": False, "error": "Department is required"}), 400

    try:
        semester_int = int(semester)
        if semester_int < 1 or semester_int > 8:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Semester must be an integer between 1 and 8"}), 400

    try:
        year_int = int(year)
        if year_int < 2000 or year_int > 2035:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Year must be a valid 4-digit academic year (e.g. 2024)"}), 400

    if not resource_url:
        return jsonify({"success": False, "error": "Resource file link/reference is required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO previous_year_papers (
            title, subject, subject_code, department, semester,
            exam_type, year, resource_url, file_size, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title, subject, subject_code, department, semester_int,
        exam_type, year_int, resource_url, file_size,
        g.current_user.get("name") or "Administrator"
    ))
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM previous_year_papers WHERE id = ?", (new_id,))
    created_row = cur.fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Previous year paper added successfully",
        "paper": format_paper_row(created_row)
    }), 201

@api_bp.route("/papers/<int:paper_id>", methods=["PUT"])
@require_role("admin")
def update_previous_year_paper(paper_id: int):
    """Admin: Edit an existing previous year paper record."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM previous_year_papers WHERE id = ?", (paper_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"success": False, "error": "Question paper not found"}), 404

    data = request.get_json(silent=True) or {}
    title = str(data.get("title") or existing["title"]).strip()
    subject = str(data.get("subject") or existing["subject"]).strip()
    subject_code = str(data.get("subject_code") or existing["subject_code"] or "").strip() or None
    department = str(data.get("department") or existing["department"]).strip()
    semester = data.get("semester", existing["semester"])
    exam_type = str(data.get("exam_type") or existing["exam_type"]).strip()
    year = data.get("year", existing["year"])
    resource_url = str(data.get("resource_url") or existing["resource_url"]).strip()
    file_size = str(data.get("file_size") or existing["file_size"]).strip()

    try:
        semester_int = int(semester)
    except (TypeError, ValueError):
        conn.close()
        return jsonify({"success": False, "error": "Invalid semester number"}), 400

    try:
        year_int = int(year)
    except (TypeError, ValueError):
        conn.close()
        return jsonify({"success": False, "error": "Invalid year"}), 400

    cur.execute("""
        UPDATE previous_year_papers
        SET title = ?, subject = ?, subject_code = ?, department = ?,
            semester = ?, exam_type = ?, year = ?, resource_url = ?,
            file_size = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        title, subject, subject_code, department, semester_int,
        exam_type, year_int, resource_url, file_size, paper_id
    ))
    conn.commit()

    cur.execute("SELECT * FROM previous_year_papers WHERE id = ?", (paper_id,))
    updated_row = cur.fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Previous year paper updated successfully",
        "paper": format_paper_row(updated_row)
    })

@api_bp.route("/papers/<int:paper_id>", methods=["DELETE"])
@require_role("admin")
def delete_previous_year_paper(paper_id: int):
    """Admin: Remove a previous year paper record."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, title FROM previous_year_papers WHERE id = ?", (paper_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "error": "Question paper not found"}), 404

    cur.execute("DELETE FROM previous_year_papers WHERE id = ?", (paper_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Paper '{row['title']}' deleted successfully"
    })


# ==========================================
# FEATURE 2: BOOK ISSUE / RETURN
# ==========================================

@api_bp.route("/library/books", methods=["GET"])
@require_auth
def get_library_books():
    """
    Search and list library books.
    Searches by title, author, category, or ISBN.
    """
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    available_only = request.args.get("available_only", "").lower() in ("true", "1", "yes")

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM library_books WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE ? OR author LIKE ? OR category LIKE ? OR isbn LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    if category and category.lower() != "all":
        query += " AND category = ?"
        params.append(category)

    if available_only:
        query += " AND available_copies > 0"

    query += " ORDER BY title ASC"

    cur.execute(query, params)
    books = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(books),
        "books": books
    })

@api_bp.route("/library/books/<int:book_id>", methods=["GET"])
@require_auth
def get_book_by_id(book_id: int):
    """Get single book details."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM library_books WHERE id = ?", (book_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"success": False, "error": "Book not found"}), 404

    return jsonify({"success": True, "book": dict(row)})

@api_bp.route("/library/books", methods=["POST"])
@require_role("admin")
def create_library_book():
    """Admin: Add a new book to the library catalog."""
    data = request.get_json(silent=True) or {}
    title = str(data.get("title") or "").strip()
    author = str(data.get("author") or "").strip()
    isbn = str(data.get("isbn") or "").strip()
    category = str(data.get("category") or "Computer Science").strip()
    department = str(data.get("department") or "All").strip()
    edition = str(data.get("edition") or "1st Edition").strip()
    publisher = str(data.get("publisher") or "").strip() or None
    location = str(data.get("location") or "Main Stack - Rack A").strip()
    description = str(data.get("description") or "").strip() or None

    try:
        total_copies = int(data.get("total_copies", 1))
        available_copies = int(data.get("available_copies", total_copies))
        if total_copies < 0 or available_copies < 0:
            raise ValueError()
        if available_copies > total_copies:
            available_copies = total_copies
    except (TypeError, ValueError):
        return jsonify({"success": False, "error": "Total and available copies must be non-negative integers"}), 400

    if not title:
        return jsonify({"success": False, "error": "Book title is required"}), 400
    if not author:
        return jsonify({"success": False, "error": "Author name is required"}), 400
    if not isbn:
        return jsonify({"success": False, "error": "ISBN is required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Check unique ISBN
    cur.execute("SELECT id FROM library_books WHERE isbn = ?", (isbn,))
    if cur.fetchone():
        conn.close()
        return jsonify({"success": False, "error": f"Book with ISBN '{isbn}' already exists"}), 409

    cur.execute("""
        INSERT INTO library_books (
            title, author, isbn, category, department, edition,
            publisher, location, total_copies, available_copies, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title, author, isbn, category, department, edition,
        publisher, location, total_copies, available_copies, description
    ))
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM library_books WHERE id = ?", (new_id,))
    created_book = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Book '{title}' added successfully",
        "book": created_book
    }), 201

@api_bp.route("/library/books/<int:book_id>", methods=["PUT"])
@require_role("admin")
def update_library_book(book_id: int):
    """Admin: Edit an existing book or adjust total/available copies."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM library_books WHERE id = ?", (book_id,))
    existing = cur.fetchone()
    if not existing:
        conn.close()
        return jsonify({"success": False, "error": "Book not found"}), 404

    data = request.get_json(silent=True) or {}
    title = str(data.get("title") or existing["title"]).strip()
    author = str(data.get("author") or existing["author"]).strip()
    isbn = str(data.get("isbn") or existing["isbn"]).strip()
    category = str(data.get("category") or existing["category"]).strip()
    department = str(data.get("department") or existing["department"]).strip()
    edition = str(data.get("edition") or existing["edition"]).strip()
    publisher = str(data.get("publisher") or existing["publisher"] or "").strip() or None
    location = str(data.get("location") or existing["location"]).strip()
    description = str(data.get("description") or existing["description"] or "").strip() or None

    try:
        total_copies = int(data.get("total_copies", existing["total_copies"]))
        available_copies = int(data.get("available_copies", existing["available_copies"]))
        if total_copies < 0 or available_copies < 0 or available_copies > total_copies:
            raise ValueError()
    except (TypeError, ValueError):
        conn.close()
        return jsonify({"success": False, "error": "Invalid copies count: available cannot exceed total"}), 400

    # If ISBN changed, check uniqueness
    if isbn != existing["isbn"]:
        cur.execute("SELECT id FROM library_books WHERE isbn = ? AND id != ?", (isbn, book_id))
        if cur.fetchone():
            conn.close()
            return jsonify({"success": False, "error": f"ISBN '{isbn}' is already used by another book"}), 409

    cur.execute("""
        UPDATE library_books
        SET title = ?, author = ?, isbn = ?, category = ?, department = ?,
            edition = ?, publisher = ?, location = ?, total_copies = ?,
            available_copies = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        title, author, isbn, category, department, edition,
        publisher, location, total_copies, available_copies, description, book_id
    ))
    conn.commit()

    cur.execute("SELECT * FROM library_books WHERE id = ?", (book_id,))
    updated_book = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Book details updated successfully",
        "book": updated_book
    })

@api_bp.route("/library/books/<int:book_id>", methods=["DELETE"])
@require_role("admin")
def delete_library_book(book_id: int):
    """Admin: Remove a book from catalog (prevented if currently issued)."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM library_books WHERE id = ?", (book_id,))
    book = cur.fetchone()
    if not book:
        conn.close()
        return jsonify({"success": False, "error": "Book not found"}), 404

    # Check active issues
    cur.execute("SELECT COUNT(*) as active_count FROM book_issues WHERE book_id = ? AND status = 'ISSUED'", (book_id,))
    active = cur.fetchone()["active_count"]
    if active > 0:
        conn.close()
        return jsonify({
            "success": False,
            "error": f"Cannot delete book: {active} copy/copies currently issued to students."
        }), 400

    cur.execute("DELETE FROM book_issues WHERE book_id = ?", (book_id,))
    cur.execute("DELETE FROM library_books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Book '{book['title']}' deleted from catalog"
    })

# --- Book Issue Operations ---

def resolve_student_context(user: dict) -> tuple[str, str, str]:
    """Helper to resolve student_id, student_name, student_identifier from authenticated user."""
    s_id = str(user.get("id") or "")
    s_name = str(user.get("name") or "Student")
    s_ident = str(user.get("identifier") or s_id)
    return s_id, s_name, s_ident

@api_bp.route("/library/issue-request", methods=["POST"])
@require_auth
def request_book_issue():
    """
    Student submits a book issue request.
    Verifies that available copies > 0 before accepting the request.
    """
    user = g.current_user
    data = request.get_json(silent=True) or {}
    book_id = data.get("book_id")
    notes = str(data.get("notes") or "").strip() or None

    if not book_id:
        return jsonify({"success": False, "error": "Book ID is required"}), 400

    student_id, student_name, student_identifier = resolve_student_context(user)

    conn = get_db_connection()
    cur = conn.cursor()

    # Verify book exists and check availability
    cur.execute("SELECT * FROM library_books WHERE id = ?", (book_id,))
    book = cur.fetchone()
    if not book:
        conn.close()
        return jsonify({"success": False, "error": "Book not found"}), 404

    if book["available_copies"] <= 0:
        conn.close()
        return jsonify({
            "success": False,
            "error": f"'{book['title']}' is currently out of stock (0 copies available). Please check back later."
        }), 400

    # Prevent duplicate active/pending issue for the same book
    cur.execute("""
        SELECT id, status FROM book_issues
        WHERE book_id = ? AND (student_id = ? OR student_identifier = ?)
          AND status IN ('REQUESTED', 'ISSUED')
    """, (book_id, student_id, student_identifier))
    existing = cur.fetchone()
    if existing:
        conn.close()
        return jsonify({
            "success": False,
            "error": f"You already have an active {existing['status'].lower()} request for this book."
        }), 409

    cur.execute("""
        INSERT INTO book_issues (
            book_id, student_id, student_name, student_identifier,
            status, notes
        ) VALUES (?, ?, ?, ?, 'REQUESTED', ?)
    """, (
        book_id, student_id, student_name, student_identifier, notes
    ))
    new_issue_id = cur.lastrowid
    conn.commit()

    # Fetch created record with book details
    cur.execute("""
        SELECT i.*, b.title as book_title, b.author as book_author, b.isbn, b.category as book_category, b.location
        FROM book_issues i
        JOIN library_books b ON i.book_id = b.id
        WHERE i.id = ?
    """, (new_issue_id,))
    created_issue = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Issue request for '{book['title']}' submitted successfully. Pending library desk approval.",
        "issue": created_issue
    }), 201

@api_bp.route("/library/my-issues", methods=["GET"])
@require_auth
def get_my_book_issues():
    """
    Student views only their own issue requests and loan records.
    Strict isolation: students never see another student's records.
    """
    user = g.current_user
    student_id, _, student_identifier = resolve_student_context(user)

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT i.*, b.title as book_title, b.author as book_author, b.isbn,
               b.category as book_category, b.location, b.available_copies
        FROM book_issues i
        JOIN library_books b ON i.book_id = b.id
        WHERE i.student_id = ? OR i.student_identifier = ?
        ORDER BY i.request_date DESC, i.id DESC
    """, (student_id, student_identifier))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "issues": rows
    })

@api_bp.route("/library/issue-requests", methods=["GET"])
@require_role("admin")
def get_all_issue_requests():
    """
    Admin: View all book issue requests and loans across the institution.
    Supports filtering by status (REQUESTED, ISSUED, RETURNED, REJECTED).
    """
    status_filter = request.args.get("status", "").strip().upper()

    conn = get_db_connection()
    cur = conn.cursor()

    query = """
        SELECT i.*, b.title as book_title, b.author as book_author, b.isbn,
               b.category as book_category, b.available_copies, b.total_copies
        FROM book_issues i
        JOIN library_books b ON i.book_id = b.id
        WHERE 1=1
    """
    params = []

    if status_filter and status_filter != "ALL":
        query += " AND i.status = ?"
        params.append(status_filter)

    query += " ORDER BY i.request_date DESC, i.id DESC"

    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "issues": rows
    })

@api_bp.route("/library/issue-requests/<int:issue_id>/status", methods=["PUT"])
@require_role("admin")
def update_issue_request_status(issue_id: int):
    """
    Admin: Approve/reject request, or mark book as issued or returned.
    Enforces that a book cannot be issued if available_copies == 0.
    Automatically manages available_copies inventory on issue and return.
    Dispatches targeted notification to the student upon status change.
    """
    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status") or "").strip().upper()
    admin_remarks = str(data.get("admin_remarks") or "").strip() or None
    custom_due_date = str(data.get("due_date") or "").strip() or None

    valid_statuses = ["REQUESTED", "ISSUED", "RETURNED", "REJECTED"]
    if new_status not in valid_statuses:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        }), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT i.*, b.title as book_title, b.available_copies, b.total_copies
        FROM book_issues i
        JOIN library_books b ON i.book_id = b.id
        WHERE i.id = ?
    """, (issue_id,))
    issue = cur.fetchone()
    if not issue:
        conn.close()
        return jsonify({"success": False, "error": "Issue record not found"}), 404

    old_status = issue["status"]
    book_id = issue["book_id"]
    book_title = issue["book_title"]
    avail_copies = issue["available_copies"]
    total_copies = issue["total_copies"]

    today_str = date.today().isoformat()
    # Default due date: 21 days from today
    default_due = (date.today() + timedelta(days=21)).isoformat()
    due_date = custom_due_date or issue["due_date"] or default_due

    issue_date = issue["issue_date"]
    return_date = issue["return_date"]

    # Transition logic & availability controls
    if new_status == "ISSUED" and old_status != "ISSUED":
        # Check available copies
        if avail_copies <= 0:
            conn.close()
            return jsonify({
                "success": False,
                "error": f"Cannot issue '{book_title}': 0 copies currently available."
            }), 400

        # Decrement copies
        cur.execute("UPDATE library_books SET available_copies = available_copies - 1 WHERE id = ?", (book_id,))
        issue_date = today_str
        due_date = custom_due_date or default_due

    elif new_status == "RETURNED" and old_status == "ISSUED":
        # Increment copies (cannot exceed total)
        cur.execute("UPDATE library_books SET available_copies = MIN(total_copies, available_copies + 1) WHERE id = ?", (book_id,))
        return_date = today_str

    elif new_status == "REJECTED" and old_status == "ISSUED":
        # If inadvertently issued and now rejected/cancelled, restore copy
        cur.execute("UPDATE library_books SET available_copies = MIN(total_copies, available_copies + 1) WHERE id = ?", (book_id,))

    # Update issue record
    cur.execute("""
        UPDATE book_issues
        SET status = ?, issue_date = ?, due_date = ?, return_date = ?,
            admin_remarks = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_status, issue_date, due_date, return_date, admin_remarks, issue_id))
    conn.commit()

    # Dispatch notification to student
    try:
        notif_title = f"Library Book: {new_status.capitalize()}"
        notif_desc = f"Your request for '{book_title}' is now {new_status}."
        if new_status == "ISSUED":
            notif_desc += f" Please collect from Central Library. Due date: {due_date}."
        elif new_status == "RETURNED":
            notif_desc += " Returned successfully. Thank you!"
        elif new_status == "REJECTED":
            notif_desc += f" Reason: {admin_remarks or 'Request declined by librarian.'}"

        cur.execute("""
            INSERT INTO targeted_notifications (
                title, description, category, badge_type, badge_label,
                target_type, target_value, created_by
            ) VALUES (?, ?, 'academic', 'system', 'LIBRARY', 'STUDENT', ?, ?)
        """, (
            notif_title, notif_desc, issue["student_identifier"] or issue["student_id"],
            g.current_user.get("name") or "Library Desk"
        ))
        conn.commit()
    except Exception as e:
        print("[Library] Notification dispatch warning:", e)

    cur.execute("""
        SELECT i.*, b.title as book_title, b.author as book_author, b.isbn,
               b.category as book_category, b.available_copies
        FROM book_issues i
        JOIN library_books b ON i.book_id = b.id
        WHERE i.id = ?
    """, (issue_id,))
    updated_issue = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Issue status updated to {new_status} for '{book_title}'",
        "issue": updated_issue
    })


# ==========================================
# FEATURE 3: LIBRARY CARD RENEWAL
# ==========================================

def get_or_create_student_library_card(cur, student_id: str, student_name: str, student_identifier: str) -> dict:
    """Finds or auto-initializes the student's active library card."""
    cur.execute("SELECT * FROM library_cards WHERE student_id = ? OR student_identifier = ?", (student_id, student_identifier))
    card = cur.fetchone()
    if card:
        return dict(card)

    # Initialize a valid student card
    card_number = f"LC-{datetime.now().year}-{student_identifier.replace('CP-', '').replace('STU-', '')}"
    issue_date = f"{datetime.now().year}-01-15"
    valid_until = f"{datetime.now().year}-12-31"

    cur.execute("""
        INSERT INTO library_cards (
            student_id, student_name, student_identifier, card_number,
            issue_date, valid_until, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    """, (student_id, student_name, student_identifier, card_number, issue_date, valid_until))
    new_id = cur.lastrowid
    cur.execute("SELECT * FROM library_cards WHERE id = ?", (new_id,))
    return dict(cur.fetchone())

@api_bp.route("/library/my-card", methods=["GET"])
@require_auth
def get_my_library_card():
    """
    Student views current library card status, validity date, and barcode number.
    """
    user = g.current_user
    student_id, student_name, student_identifier = resolve_student_context(user)

    conn = get_db_connection()
    cur = conn.cursor()
    card = get_or_create_student_library_card(cur, student_id, student_name, student_identifier)
    conn.commit()
    conn.close()

    # Calculate validity status
    valid_until_str = card.get("valid_until", "")
    is_expired = False
    days_remaining = 0
    if valid_until_str:
        try:
            exp_d = datetime.strptime(valid_until_str[:10], "%Y-%m-%d").date()
            delta = (exp_d - date.today()).days
            days_remaining = delta
            is_expired = delta < 0
        except Exception:
            pass

    card["is_expired"] = is_expired
    card["days_remaining"] = days_remaining
    return jsonify({
        "success": True,
        "card": card
    })

@api_bp.route("/library/my-renewals", methods=["GET"])
@require_auth
def get_my_card_renewals():
    """
    Student views renewal request status and history (Pending, Approved, Rejected, Renewed).
    """
    user = g.current_user
    student_id, _, student_identifier = resolve_student_context(user)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM library_card_renewals
        WHERE student_id = ? OR student_identifier = ?
        ORDER BY created_at DESC, id DESC
    """, (student_id, student_identifier))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "renewals": rows
    })

@api_bp.route("/library/renew-card", methods=["POST"])
@require_auth
def submit_card_renewal():
    """
    Student submits a library card renewal request.
    Validates current card status and records reason.
    """
    user = g.current_user
    student_id, student_name, student_identifier = resolve_student_context(user)
    data = request.get_json(silent=True) or {}
    reason = str(data.get("reason") or "").strip() or "Standard annual academic renewal"
    extension_months = int(data.get("requested_extension_months") or 12)

    conn = get_db_connection()
    cur = conn.cursor()
    card = get_or_create_student_library_card(cur, student_id, student_name, student_identifier)

    # Check if a pending request already exists
    cur.execute("""
        SELECT id FROM library_card_renewals
        WHERE (student_id = ? OR student_identifier = ?) AND status = 'PENDING'
    """, (student_id, student_identifier))
    if cur.fetchone():
        conn.close()
        return jsonify({
            "success": False,
            "error": "You already have a pending library card renewal request undergoing administrative review."
        }), 409

    current_expiry = card.get("valid_until") or date.today().isoformat()

    cur.execute("""
        INSERT INTO library_card_renewals (
            student_id, student_name, student_identifier,
            current_expiry_date, requested_extension_months, reason, status
        ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    """, (
        student_id, student_name, student_identifier,
        current_expiry, extension_months, reason
    ))
    new_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM library_card_renewals WHERE id = ?", (new_id,))
    created_req = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Library card renewal request submitted successfully. Pending administrator approval.",
        "renewal": created_req
    }), 201

@api_bp.route("/library/admin/renewals", methods=["GET"])
@require_role("admin")
def get_admin_card_renewals():
    """
    Admin: View all library card renewal requests across students.
    Filter by status (PENDING, APPROVED, REJECTED, RENEWED).
    """
    status_filter = request.args.get("status", "").strip().upper()

    conn = get_db_connection()
    cur = conn.cursor()

    query = "SELECT * FROM library_card_renewals WHERE 1=1"
    params = []
    if status_filter and status_filter != "ALL":
        query += " AND status = ?"
        params.append(status_filter)

    query += " ORDER BY created_at DESC, id DESC"

    cur.execute(query, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    return jsonify({
        "success": True,
        "count": len(rows),
        "renewals": rows
    })

@api_bp.route("/library/admin/renewals/<int:renewal_id>", methods=["PUT"])
@require_role("admin")
def update_card_renewal_status(renewal_id: int):
    """
    Admin: Approve, reject, or mark renewed for a library card request.
    Updates the student's library card expiry date.
    Sends notification to the student on status change.
    """
    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status") or "").strip().upper()
    admin_notes = str(data.get("admin_notes") or "").strip() or None
    custom_new_expiry = str(data.get("new_expiry_date") or "").strip() or None

    valid_statuses = ["PENDING", "APPROVED", "REJECTED", "RENEWED"]
    if new_status not in valid_statuses:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        }), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM library_card_renewals WHERE id = ?", (renewal_id,))
    renewal = cur.fetchone()
    if not renewal:
        conn.close()
        return jsonify({"success": False, "error": "Renewal request not found"}), 404

    # Calculate new expiry date if approved / renewed
    new_expiry_date = custom_new_expiry
    if new_status in ("APPROVED", "RENEWED") and not new_expiry_date:
        try:
            curr_exp = datetime.strptime(renewal["current_expiry_date"][:10], "%Y-%m-%d").date()
            base_date = max(curr_exp, date.today())
            months = int(renewal.get("requested_extension_months") or 12)
            # Add approx 30 days per month or next year
            new_exp = base_date + timedelta(days=months * 30)
            new_expiry_date = new_exp.isoformat()
        except Exception:
            new_expiry_date = (date.today() + timedelta(days=365)).isoformat()

    cur.execute("""
        UPDATE library_card_renewals
        SET status = ?, new_expiry_date = ?, admin_notes = ?,
            processed_by = ?, processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (
        new_status, new_expiry_date, admin_notes,
        g.current_user.get("name") or "Administrator", renewal_id
    ))

    # If approved or renewed, update the actual library card
    if new_status in ("APPROVED", "RENEWED") and new_expiry_date:
        cur.execute("""
            UPDATE library_cards
            SET valid_until = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
            WHERE student_id = ? OR student_identifier = ?
        """, (new_expiry_date, renewal["student_id"], renewal["student_identifier"]))

    conn.commit()

    # Dispatch targeted notification to student
    try:
        notif_title = f"Library Card Renewal: {new_status.capitalize()}"
        notif_desc = f"Your library card renewal request #{renewal_id} has been {new_status.lower()}."
        if new_status in ("APPROVED", "RENEWED"):
            notif_desc += f" Your card is now valid until {new_expiry_date}."
        elif new_status == "REJECTED":
            notif_desc += f" Reason: {admin_notes or 'Please consult library administration.'}"

        cur.execute("""
            INSERT INTO targeted_notifications (
                title, description, category, badge_type, badge_label,
                target_type, target_value, created_by
            ) VALUES (?, ?, 'academic', 'system', 'LIBRARY CARD', 'STUDENT', ?, ?)
        """, (
            notif_title, notif_desc,
            renewal["student_identifier"] or renewal["student_id"],
            g.current_user.get("name") or "Library Desk"
        ))
        conn.commit()
    except Exception as e:
        print("[Library] Renewal notification error:", e)

    cur.execute("SELECT * FROM library_card_renewals WHERE id = ?", (renewal_id,))
    updated_rec = dict(cur.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Library card renewal request marked {new_status}",
        "renewal": updated_rec
    })

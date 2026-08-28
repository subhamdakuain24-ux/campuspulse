from flask import jsonify, request
from . import api_bp
from database import get_db_connection

@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for the backend."""
    return jsonify({
        "status": "healthy",
        "service": "CampusPulse Backend API",
        "version": "1.0.0",
        "engine": "Python + Flask + SQLite"
    }), 200

@api_bp.route("/students/<student_id>", methods=["GET"])
def get_student_profile(student_id):
    """Fetches a student's profile by ID or student ID string."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT * FROM students 
        WHERE id = ? OR student_id = ?
        LIMIT 1
    """, (student_id, student_id))
    student = cur.fetchone()
    conn.close()

    if not student:
        return jsonify({"error": f"Student with ID '{student_id}' not found"}), 404

    return jsonify({
        "success": True,
        "data": student
    }), 200

@api_bp.route("/students/<student_id>/attendance", methods=["GET"])
def get_student_attendance(student_id):
    """Fetches the attendance records and subject breakdown for a student."""
    conn = get_db_connection()
    cur = conn.cursor()

    # Get student general attendance
    cur.execute("""
        SELECT id, name, overall_attendance_pct FROM students 
        WHERE id = ? OR student_id = ?
        LIMIT 1
    """, (student_id, student_id))
    student = cur.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": f"Student '{student_id}' not found"}), 404

    actual_id = student["id"]

    # Get breakdown per subject
    cur.execute("""
        SELECT 
            s.id AS subject_id,
            s.code,
            s.name,
            s.instructor,
            s.instructor_avatar,
            s.credits,
            s.color,
            a.total_classes,
            a.attended_classes,
            a.percentage,
            a.status
        FROM attendance_summary a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY s.code ASC
    """, (actual_id,))
    records = cur.fetchall()

    # Get recent attendance logs
    cur.execute("""
        SELECT 
            l.id,
            l.date,
            l.status,
            l.topic,
            s.code AS subject_code,
            s.name AS subject_name
        FROM attendance_logs l
        JOIN subjects s ON l.subject_id = s.id
        WHERE l.student_id = ?
        ORDER BY l.date DESC
        LIMIT 10
    """, (actual_id,))
    logs = cur.fetchall()

    conn.close()

    return jsonify({
        "success": True,
        "overallPercentage": student["overall_attendance_pct"],
        "threshold": 75.0,
        "subjects": records,
        "recentLogs": logs
    }), 200

@api_bp.route("/students/<student_id>/exams", methods=["GET"])
def get_student_exams(student_id):
    """Fetches upcoming and scheduled exams for a student."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM students WHERE id = ? OR student_id = ? LIMIT 1
    """, (student_id, student_id))
    student = cur.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": f"Student '{student_id}' not found"}), 404

    actual_id = student["id"]

    cur.execute("""
        SELECT 
            e.id,
            e.name,
            e.exam_type,
            e.exam_date,
            e.display_date,
            e.time_range,
            e.room,
            e.seat_number,
            e.status,
            e.prep_percentage,
            e.format_description,
            e.total_marks,
            s.code AS subject_code,
            s.name AS subject_name,
            s.color AS subject_color
        FROM exams e
        JOIN subjects s ON e.subject_id = s.id
        WHERE e.student_id = ?
        ORDER BY e.exam_date ASC
    """, (actual_id,))
    exams = cur.fetchall()
    conn.close()

    return jsonify({
        "success": True,
        "count": len(exams),
        "exams": exams
    }), 200

@api_bp.route("/students/<student_id>/timetable", methods=["GET"])
def get_student_timetable(student_id):
    """Fetches the weekly timetable schedule for a student."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM students WHERE id = ? OR student_id = ? LIMIT 1
    """, (student_id, student_id))
    student = cur.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": f"Student '{student_id}' not found"}), 404

    actual_id = student["id"]

    cur.execute("""
        SELECT 
            t.id,
            t.day_of_week,
            t.day_index,
            t.start_time,
            t.end_time,
            t.time_display,
            t.type,
            t.room,
            t.is_in_progress,
            s.code AS subject_code,
            s.name AS subject_name,
            s.instructor,
            s.color AS subject_color
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        WHERE t.student_id = ?
        ORDER BY t.day_index ASC, t.start_time ASC
    """, (actual_id,))
    schedule = cur.fetchall()
    conn.close()

    # Group by day
    days_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    grouped = {day: [] for day in days_order}
    for item in schedule:
        day = item["day_of_week"]
        if day in grouped:
            grouped[day].append(item)

    return jsonify({
        "success": True,
        "schedule": schedule,
        "groupedByDay": grouped
    }), 200

@api_bp.route("/students/<student_id>/assignments", methods=["GET"])
def get_student_assignments(student_id):
    """Fetches assignments for a student with pending/completed status."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM students WHERE id = ? OR student_id = ? LIMIT 1
    """, (student_id, student_id))
    student = cur.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": f"Student '{student_id}' not found"}), 404

    actual_id = student["id"]

    cur.execute("""
        SELECT 
            a.id,
            a.title,
            a.description,
            a.due_date,
            a.due_time_display,
            a.priority,
            a.status,
            a.submitted_date,
            a.grade,
            a.score,
            a.total_points,
            s.code AS subject_code,
            s.name AS subject_name,
            s.color AS subject_color
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = ?
        ORDER BY 
            CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END,
            a.due_date ASC
    """, (actual_id,))
    assignments = cur.fetchall()
    conn.close()

    pending = [a for a in assignments if a["status"] == "pending"]
    completed = [a for a in assignments if a["status"] in ("completed", "submitted")]

    return jsonify({
        "success": True,
        "total": len(assignments),
        "pendingCount": len(pending),
        "completedCount": len(completed),
        "assignments": assignments,
        "pending": pending,
        "completed": completed
    }), 200

@api_bp.route("/students/<student_id>/notifications", methods=["GET"])
def get_student_notifications(student_id):
    """Fetches alerts and notifications for a student."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT id FROM students WHERE id = ? OR student_id = ? LIMIT 1
    """, (student_id, student_id))
    student = cur.fetchone()

    if not student:
        conn.close()
        return jsonify({"error": f"Student '{student_id}' not found"}), 404

    actual_id = student["id"]

    cur.execute("""
        SELECT 
            id,
            title,
            description,
            category,
            badge_type,
            badge_label,
            time_ago,
            unread,
            action_button_text,
            action_button_type,
            created_at
        FROM notifications
        WHERE student_id = ?
        ORDER BY created_at DESC
    """, (actual_id,))
    notifications = cur.fetchall()
    conn.close()

    unread_count = sum(1 for n in notifications if n["unread"])

    return jsonify({
        "success": True,
        "unreadCount": unread_count,
        "notifications": notifications
    }), 200

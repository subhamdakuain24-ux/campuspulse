import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
deps_dir = os.path.abspath(os.path.join(backend_dir, "..", "backend_deps"))
for p in (backend_dir, deps_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from werkzeug.security import generate_password_hash
from database import get_db_connection, init_db

def seed_database(db_file=None):
    """Seeds the SQLite database with rich fictional development data."""
    init_db(db_file)
    conn = get_db_connection(db_file)
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = OFF;")

    # 1. Seed Student
    cur.execute("""
        INSERT OR REPLACE INTO students (
            id, student_id, name, email, phone, program, department, semester,
            term, academic_year, avatar_url, campus_address, gpa, gpa_change,
            credits_earned, credits_total, enrolled_year, graduation_year, overall_attendance_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "STU-2023-8941",
        "STU-2023-8941",
        "Alex Johnson",
        "alex.johnson@university.edu",
        "+1 (555) 234-8921",
        "B.S. Computer Science & Engineering",
        "School of Computing & Data Sciences",
        5,
        "Fall 2023",
        "2023 - 2024",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "Room 402, Oak Ridge Residence Hall, North Campus",
        3.84,
        "+0.12 this term",
        88,
        128,
        2021,
        2025,
        82.4
    ))

    # Also seed alias ID '1' for test convenience if requested
    cur.execute("""
        INSERT OR REPLACE INTO students (
            id, student_id, name, email, phone, program, department, semester,
            term, academic_year, avatar_url, campus_address, gpa, gpa_change,
            credits_earned, credits_total, enrolled_year, graduation_year, overall_attendance_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "1",
        "CP-847291",
        "Alex Johnson",
        "alex.j@university.edu",
        "+1 (555) 234-8921",
        "B.S. Computer Science & Engineering",
        "School of Computing & Data Sciences",
        5,
        "Fall 2023",
        "2023 - 2024",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "Room 402, Oak Ridge Residence Hall, North Campus",
        3.84,
        "+0.12 this term",
        88,
        128,
        2021,
        2025,
        82.4
    ))

    # Seed Student B (Jane Smith) for RBAC boundary testing
    cur.execute("""
        INSERT OR REPLACE INTO students (
            id, student_id, name, email, phone, program, department, semester,
            term, academic_year, avatar_url, campus_address, gpa, gpa_change,
            credits_earned, credits_total, enrolled_year, graduation_year, overall_attendance_pct
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "2",
        "CP-992211",
        "Jane Smith",
        "jane.smith@university.edu",
        "+1 (555) 789-0123",
        "B.S. Electrical & Electronics Engineering",
        "School of Engineering",
        4,
        "Fall 2023",
        "2023 - 2024",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "Room 205, Maple Hall",
        3.91,
        "+0.05 this term",
        64,
        128,
        2022,
        2026,
        89.0
    ))

    # 2. Seed Subjects
    subjects_data = [
        ("SUB-CS301", "CS301", "Data Structures & Algorithms", "Computer Science", "Dr. Robert Chen", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", 4, "Hall 302", "#3B82F6"),
        ("SUB-CS304", "CS304", "Database Management Systems", "Computer Science", "Prof. Sarah Miller", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", 4, "Lab 4B", "#10B981"),
        ("SUB-CS308", "CS308", "Computer Networks", "Computer Science", "Dr. James Wilson", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100", 3, "Room 205", "#8B5CF6"),
        ("SUB-CS312", "CS312", "Software Engineering", "Computer Science", "Prof. Elena Rostova", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100", 3, "Hall 101", "#F59E0B"),
        ("SUB-MATH302", "MATH302", "Discrete Mathematics", "Mathematics", "Dr. David Kumar", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100", 3, "Room 408", "#EC4899"),
        ("SUB-CS315", "CS315", "Web Technologies & Cloud", "Computer Science", "Dr. Robert Chen", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100", 3, "Lab 2A", "#06B6D4")
    ]

    for subj in subjects_data:
        cur.execute("""
            INSERT OR REPLACE INTO subjects (id, code, name, department, instructor, instructor_avatar, credits, room, color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, subj)

    # 3. Seed Enrollments
    student_ids = ["STU-2023-8941", "1"]
    for s_id in student_ids:
        for subj in subjects_data:
            cur.execute("""
                INSERT OR REPLACE INTO enrollments (student_id, subject_id, semester, academic_year)
                VALUES (?, ?, 5, '2023 - 2024')
            """, (s_id, subj[0]))

    # 4. Seed Attendance Summaries
    attendance_data = [
        ("SUB-CS301", 32, 28, 87.5, "Safe"),
        ("SUB-CS304", 28, 24, 85.7, "Safe"),
        ("SUB-CS308", 30, 21, 70.0, "Shortage"),
        ("SUB-CS312", 26, 23, 88.5, "Safe"),
        ("SUB-MATH302", 34, 25, 73.5, "Warning"),
        ("SUB-CS315", 22, 20, 90.9, "Safe")
    ]

    for s_id in student_ids:
        for item in attendance_data:
            cur.execute("""
                INSERT OR REPLACE INTO attendance_summary (
                    student_id, subject_id, total_classes, attended_classes, percentage, status
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (s_id, item[0], item[1], item[2], item[3], item[4]))

    # 5. Seed Attendance Logs
    logs_data = [
        ("SUB-CS301", "2023-10-23", "present", "Binary Search Trees & Balancing"),
        ("SUB-CS304", "2023-10-23", "present", "Relational Algebra & Normalization"),
        ("SUB-CS308", "2023-10-22", "absent", "TCP Handshake & Congestion Control"),
        ("SUB-MATH302", "2023-10-21", "present", "Graph Theory & Trees"),
        ("SUB-CS312", "2023-10-20", "present", "Agile & Scrum Methodologies")
    ]
    for s_id in student_ids:
        for log in logs_data:
            cur.execute("""
                INSERT INTO attendance_logs (student_id, subject_id, date, status, topic)
                VALUES (?, ?, ?, ?, ?)
            """, (s_id, log[0], log[1], log[2], log[3]))

    # 6. Seed Exams
    exams_data = [
        ("EXAM-01", "SUB-CS301", "Data Structures Mid-Term", "Mid-Term", "2023-10-26", "Oct 26, 2023", "10:00 AM - 01:00 PM", "Examination Hall B (Room 302)", "B-42", "Upcoming", 85, "Part A (30 MCQs) + Part B (3 Coding problems)", 100),
        ("EXAM-02", "SUB-CS304", "Database Management Systems Final", "Final", "2023-10-29", "Oct 29, 2023", "02:00 PM - 05:00 PM", "Auditorium West", "A-18", "Scheduled", 60, "SQL Design + Transactions & Indexing theory", 100),
        ("EXAM-03", "SUB-CS308", "Computer Networks Mid-Term", "Mid-Term", "2023-11-03", "Nov 03, 2023", "10:00 AM - 12:30 PM", "Hall 105", "C-09", "Scheduled", 40, "OSI Model, Transport Layer, Routing algorithms", 75),
        ("EXAM-04", "SUB-MATH302", "Discrete Math Comprehensive", "Final", "2023-11-08", "Nov 08, 2023", "09:00 AM - 12:00 PM", "Hall 201", "D-14", "Scheduled", 30, "Proofs, Combinatorics, Graph Theory", 100)
    ]
    for s_id in student_ids:
        for exam in exams_data:
            cur.execute("""
                INSERT OR REPLACE INTO exams (
                    id, student_id, subject_id, name, exam_type, exam_date,
                    display_date, time_range, room, seat_number, status, prep_percentage,
                    format_description, total_marks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"{s_id}-{exam[0]}", s_id, exam[1], exam[2], exam[3], exam[4], exam[5], exam[6], exam[7], exam[8], exam[9], exam[10], exam[11], exam[12]))

    # 7. Seed Timetable
    timetable_data = [
        # Monday
        ("SUB-CS301", "Monday", 1, "09:00", "10:30", "09:00 - 10:30 AM", "Lecture", "Hall 302", 0),
        ("SUB-CS304", "Monday", 1, "10:45", "12:15", "10:45 AM - 12:15 PM", "Lab", "Lab 4B", 1),
        ("SUB-CS308", "Monday", 1, "02:00", "03:30", "02:00 - 03:30 PM", "Lecture", "Room 205", 0),
        # Tuesday
        ("SUB-CS312", "Tuesday", 2, "09:00", "10:30", "09:00 - 10:30 AM", "Lecture", "Hall 101", 0),
        ("SUB-MATH302", "Tuesday", 2, "11:00", "12:30", "11:00 AM - 12:30 PM", "Lecture", "Room 408", 0),
        ("SUB-CS315", "Tuesday", 2, "02:00", "04:00", "02:00 - 04:00 PM", "Lab", "Lab 2A", 0),
        # Wednesday
        ("SUB-CS301", "Wednesday", 3, "09:00", "10:30", "09:00 - 10:30 AM", "Lecture", "Hall 302", 0),
        ("SUB-CS304", "Wednesday", 3, "10:45", "12:15", "10:45 AM - 12:15 PM", "Lecture", "Lab 4B", 0),
        ("SUB-CS308", "Wednesday", 3, "01:30", "03:00", "01:30 - 03:00 PM", "Tutorial", "Room 205", 0),
        # Thursday
        ("SUB-MATH302", "Thursday", 4, "09:00", "10:30", "09:00 - 10:30 AM", "Lecture", "Room 408", 0),
        ("SUB-CS312", "Thursday", 4, "11:00", "12:30", "11:00 AM - 12:30 PM", "Lecture", "Hall 101", 0),
        # Friday
        ("SUB-CS315", "Friday", 5, "10:00", "12:00", "10:00 AM - 12:00 PM", "Lecture", "Lab 2A", 0),
        ("SUB-CS301", "Friday", 5, "02:00", "04:00", "02:00 - 04:00 PM", "Lab", "Hall 302", 0)
    ]
    for s_id in student_ids:
        for t in timetable_data:
            cur.execute("""
                INSERT INTO timetable (
                    student_id, subject_id, day_of_week, day_index, start_time,
                    end_time, time_display, type, room, is_in_progress
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (s_id, t[0], t[1], t[2], t[3], t[4], t[5], t[6], t[7], t[8]))

    # 8. Seed Assignments
    assignments_data = [
        ("ASG-101", "SUB-CS301", "Graph Algorithms Implementation", "Implement Dijkstra, Floyd-Warshall, and Prim's Minimum Spanning Tree in C++ with test suites.", "2023-10-24T23:59:00", "Today, 11:59 PM", "high", "pending", None, None, None, 100),
        ("ASG-102", "SUB-CS304", "B+ Tree Index Simulation", "Build an in-memory B+ tree with insert, delete, and range scan capabilities.", "2023-10-27T17:00:00", "Oct 27, 05:00 PM", "medium", "pending", None, None, None, 50),
        ("ASG-103", "SUB-MATH302", "Proof Techniques Problem Set 4", "Solve theoretical proofs on graph planar embeddings and Eulerian circuits.", "2023-10-31T23:59:00", "Oct 31, 11:59 PM", "low", "pending", None, None, None, 40),
        ("ASG-104", "SUB-CS308", "TCP Packet Sniffer & Analyzer", "Capture and analyze live PCAP traces using Wireshark and write a technical breakdown.", "2023-10-18T23:59:00", "Submitted Oct 17", "medium", "completed", "2023-10-17T20:15:00", "A", 96, 100),
        ("ASG-105", "SUB-CS312", "SRS & Software Architecture Design", "Create full IEEE-standard Software Requirements Specification for project.", "2023-10-12T23:59:00", "Submitted Oct 11", "high", "completed", "2023-10-11T16:40:00", "A+", 98, 100)
    ]
    for s_id in student_ids:
        for asg in assignments_data:
            cur.execute("""
                INSERT OR REPLACE INTO assignments (
                    id, student_id, subject_id, title, description, due_date,
                    due_time_display, priority, status, submitted_date, grade, score, total_points
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"{s_id}-{asg[0]}", s_id, asg[1], asg[2], asg[3], asg[4], asg[5], asg[6], asg[7], asg[8], asg[9], asg[10], asg[11]))

    # 9. Seed Notifications
    notifications_data = [
        ("NOTIF-01", "Attendance Alert: CS308 Shortage", "Your attendance in Computer Networks is currently 70.0%, below the mandatory 75% threshold.", "alerts", "urgent", "Urgent Alert", "10m ago", 1, "View Attendance", "attendance"),
        ("NOTIF-02", "Assignment Due in 14 Hours", "Graph Algorithms Implementation for CS301 is due today at 11:59 PM.", "academic", "assignment", "Coursework", "2h ago", 1, "Submit Now", "assignments"),
        ("NOTIF-03", "Mid-Term Hall Tickets Published", "Hall tickets for Fall 2023 Mid-Term examinations are now ready for download.", "exams", "system", "Exams", "5h ago", 1, "Download Ticket", "exams"),
        ("NOTIF-04", "Annual Campus Tech Symposium 2023", "Registrations open for the 48-Hour Hackathon & Guest Lecture Series.", "campus", "campus", "Campus Event", "1d ago", 0, "Learn More", "dashboard")
    ]
    for s_id in student_ids:
        for n in notifications_data:
            cur.execute("""
                INSERT OR REPLACE INTO notifications (
                    id, student_id, title, description, category, badge_type,
                    badge_label, time_ago, unread, action_button_text, action_button_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (f"{s_id}-{n[0]}", s_id, n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8], n[9]))

    # 10. Seed Student Credentials (hashed passwords only - backward compatibility)
    dev_password_hash = generate_password_hash("password123")
    credentials_data = [
        ("STU-2023-8941", "STU-2023-8941", "alex.johnson@university.edu", dev_password_hash),
        ("1", "CP-847291", "alex.j@university.edu", dev_password_hash)
    ]
    for cred in credentials_data:
        cur.execute("""
            INSERT OR REPLACE INTO student_credentials (
                student_id, identifier, email, password_hash
            ) VALUES (?, ?, ?, ?)
        """, cred)

    # 11. Seed Multi-Role Users (Student, Teacher, Admin) with Secure Hashed Passwords
    # Standard fictional development credentials:
    # - Student: CP-847291 (or alex.j@university.edu) / password123
    # - Teacher: FAC-4019 (or sarah.jenkins@university.edu) / password123 (also supports profPass2023)
    # - Admin:   ADM-9901 (or admin.carter@university.edu) / password123 (also supports adminMaster)
    users_data = [
        (
            "1",
            "CP-847291",
            "Alex Johnson",
            "alex.j@university.edu",
            "student",
            dev_password_hash,
            "School of Computing & Data Sciences",
            "+1 (555) 234-8921",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        ),
        (
            "STU-2023-8941",
            "STU-2023-8941",
            "Alex Johnson",
            "alex.johnson@university.edu",
            "student",
            dev_password_hash,
            "School of Computing & Data Sciences",
            "+1 (555) 234-8921",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        ),
        (
            "TCH-2024-4019",
            "FAC-4019",
            "Prof. Sarah Jenkins",
            "sarah.jenkins@university.edu",
            "teacher",
            dev_password_hash,
            "Department of Computer Science",
            "+1 (555) 392-8819",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        ),
        (
            "ADM-2024-9901",
            "ADM-9901",
            "Dr. Marcus Carter",
            "admin.carter@university.edu",
            "admin",
            dev_password_hash,
            "Campus Operations & IT Administration",
            "+1 (555) 901-4422",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        ),
        (
            "2",
            "CP-992211",
            "Jane Smith",
            "jane.smith@university.edu",
            "student",
            dev_password_hash,
            "School of Engineering",
            "+1 (555) 789-0123",
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
        )
    ]

    for user in users_data:
        cur.execute("""
            INSERT OR REPLACE INTO users (
                id, identifier, name, email, role, password_hash, department, phone, avatar_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, user)

    # 12. Seed Campus Operations Requests (Workflows: Complaints, Bonafide Certificate, Gate Pass & Leave)
    requests_data = [
        (
            1,
            "CP-10001",
            "1",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "HOSTEL_COMPLAINT",
            "Leaking faucet and water pressure drop in 4th floor washroom",
            "Main sink faucet is dripping continuously and cold water pressure is very low since yesterday morning.",
            "PLUMBING",
            "Oak Ridge Residence Hall, 4th Floor West Wing",
            "HIGH",
            "IN_PROGRESS",
            "Hostel Maintenance & Plumbing",
            "Rajesh Kumar (Facility Tech)",
            '{"contact_phone": "+1 (555) 234-8921", "preferred_time": "After 2 PM", "urgency_reason": "Continuous water wastage"}',
            "2026-10-02 09:15:00",
            "2026-10-02 14:30:00",
            None
        ),
        (
            2,
            "CP-10002",
            "1",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "FACILITY_COMPLAINT",
            "Wi-Fi access point offline in Lab 304",
            "Students cannot connect to EduRoam in Lab 304. Access point LED is blinking amber.",
            "WIFI_NETWORK",
            "Turing Science Block, Room 304",
            "URGENT",
            "RESOLVED",
            "Campus IT & Network Ops",
            "Elena Rostova (Senior Network Admin)",
            '{"affected_students": "~40", "lab_schedule": "Daily 9 AM - 5 PM"}',
            "2026-10-01 11:00:00",
            "2026-10-01 16:45:00",
            "2026-10-01 16:45:00"
        ),
        (
            3,
            "CP-10003",
            "1",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "CERTIFICATE_REQUEST",
            "Bonafide Certificate for State Bank Education Loan",
            "Need official bonafide student status letter mentioning enrolled semester, academic year, and tuition fee structure for bank loan renewal.",
            "BONAFIDE",
            "Academic Registrar Office",
            "MEDIUM",
            "PROCESSING",
            "Academic Affairs & Registrar",
            "Sarah Williams (Registrar Officer)",
            '{"certificate_type": "BONAFIDE", "purpose": "State Bank Education Loan renewal", "required_date": "2026-10-15", "copies": 2}',
            "2026-10-02 10:20:00",
            "2026-10-02 15:10:00",
            None
        ),
        (
            4,
            "CP-10004",
            "1",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "GATE_PASS",
            "Weekend Gate Pass for Family Visit",
            "Traveling home for family anniversary over the weekend. Will return Sunday evening before curfew.",
            "GATE_PASS",
            "North Campus Main Gate",
            "MEDIUM",
            "APPROVED",
            "Hostel Wardens Office",
            "Chief Warden Davis",
            '{"request_sub_type": "GATE_PASS", "reason": "Family anniversary visit", "destination": "Springfield (Parents Residence)", "start_date": "2026-10-06 17:00", "return_date": "2026-10-08 20:30", "emergency_contact": "+1 (555) 987-6543"}',
            "2026-10-02 16:00:00",
            "2026-10-03 08:30:00",
            None
        ),
        (
            5,
            "CP-10005",
            "1",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "LEAVE_REQUEST",
            "Academic Leave for National Robotics Hackathon",
            "Representing university team 'RoboPulse' at the National Inter-Collegiate Robotics Championship.",
            "LEAVE_REQUEST",
            "Department of Computing",
            "HIGH",
            "UNDER_REVIEW",
            "Dean of Student Affairs",
            "Prof. Sarah Jenkins",
            '{"request_sub_type": "LEAVE", "reason": "National Robotics Championship participation", "destination": "Metropolitan Convention Center", "start_date": "2026-10-12 08:00", "return_date": "2026-10-15 18:00", "emergency_contact": "+1 (555) 392-8819"}',
            "2026-10-03 11:15:00",
            "2026-10-03 11:30:00",
            None
        ),
        (
            20,
            "CP-10020",
            "2",
            "Jane Smith",
            "CP-992211",
            "School of Engineering",
            "HOSTEL_COMPLAINT",
            "Room 205 Study Table Drawer Broken",
            "The top wooden drawer is jammed and handle came loose.",
            "HOSTEL",
            "Maple Hall, Room 205",
            "LOW",
            "PENDING",
            None,
            None,
            '{"contact_phone": "+1 (555) 789-0123"}',
            "2026-10-03 15:00:00",
            "2026-10-03 15:00:00",
            None
        )
    ]

    for req in requests_data:
        cur.execute("""
            INSERT OR REPLACE INTO campus_requests (
                id, public_id, student_id, student_name, student_identifier, department,
                request_type, title, description, category, location, priority,
                status, assigned_department, assigned_staff, meta_data, created_at, updated_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, req)

    # 13. Seed Request Activity / Audit Logs
    activities_data = [
        (
            1, 1, "CP-10001", "1", "Alex Johnson", "student", "REQUEST_CREATED",
            None, "SUBMITTED", "Complaint submitted by student via CampusPulse mobile portal.",
            "2026-10-02 09:15:00"
        ),
        (
            2, 1, "CP-10001", "ADM-2024-9901", "Dr. Marcus Carter", "admin", "ASSIGNED_DEPARTMENT",
            "SUBMITTED", "ASSIGNED", "Assigned complaint to Hostel Maintenance & Plumbing.",
            "2026-10-02 11:00:00"
        ),
        (
            3, 1, "CP-10001", "ADM-2024-9901", "Dr. Marcus Carter", "admin", "STATUS_CHANGED",
            "ASSIGNED", "IN_PROGRESS", "Assigned technician Rajesh Kumar. Work scheduled for afternoon inspection.",
            "2026-10-02 14:30:00"
        ),
        (
            4, 2, "CP-10002", "1", "Alex Johnson", "student", "REQUEST_CREATED",
            None, "SUBMITTED", "Facility complaint submitted for Lab 304 Wi-Fi failure.",
            "2026-10-01 11:00:00"
        ),
        (
            5, 2, "CP-10002", "ADM-2024-9901", "Dr. Marcus Carter", "admin", "ASSIGNED_STAFF",
            "SUBMITTED", "IN_PROGRESS", "Network admin Elena Rostova dispatched with spectrum analyzer.",
            "2026-10-01 12:30:00"
        ),
        (
            6, 2, "CP-10002", "ADM-2024-9901", "Dr. Marcus Carter", "admin", "RESOLVED",
            "IN_PROGRESS", "RESOLVED", "AP firmware rebooted and PoE switch port reconfigured. 5GHz band fully restored.",
            "2026-10-01 16:45:00"
        ),
        (
            7, 3, "CP-10003", "1", "Alex Johnson", "student", "REQUEST_CREATED",
            None, "SUBMITTED", "Bonafide Certificate request submitted for State Bank Education Loan.",
            "2026-10-02 10:20:00"
        ),
        (
            8, 3, "CP-10003", "ADM-2024-9901", "Dr. Marcus Carter", "admin", "STATUS_CHANGED",
            "SUBMITTED", "PROCESSING", "Academic records verified against registrar registry. Preparing official seal.",
            "2026-10-02 15:10:00"
        ),
        (
            9, 4, "CP-10004", "1", "Alex Johnson", "student", "REQUEST_CREATED",
            None, "SUBMITTED", "Weekend gate pass request submitted.",
            "2026-10-02 16:00:00"
        ),
        (
            10, 4, "CP-10004", "ADM-2024-9901", "Chief Warden Davis", "admin", "APPROVED",
            "SUBMITTED", "APPROVED", "Approved for weekend travel. Digital pass barcode activated.",
            "2026-10-03 08:30:00"
        ),
        (
            11, 5, "CP-10005", "1", "Alex Johnson", "student", "REQUEST_CREATED",
            None, "SUBMITTED", "Academic leave request submitted for robotics hackathon.",
            "2026-10-03 11:15:00"
        ),
        (
            12, 5, "CP-10005", "TCH-2024-4019", "Prof. Sarah Jenkins", "teacher", "STATUS_CHANGED",
            "SUBMITTED", "UNDER_REVIEW", "Mentor review in progress. Coordinating with Dean of Student Affairs.",
            "2026-10-03 11:30:00"
        )
    ]

    for act in activities_data:
        cur.execute("""
            INSERT OR REPLACE INTO campus_request_activities (
                id, request_id, public_id, actor_id, actor_name, actor_role,
                action, old_status, new_status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, act)

    # 14. Seed Mess Menu (Weekly Schedule Monday - Sunday across all 4 meals)
    mess_menu_data = [
        # Monday
        (1, "Monday", "BREAKFAST", None, "Idli, Medu Vada, Coconut Chutney, Sambar, Bread Butter Jam, Tea / Coffee", "07:30 AM - 09:30 AM", "Vegetarian", "South Indian Special"),
        (2, "Monday", "LUNCH", None, "Steamed Basmati Rice, Chapati, Dal Tadka, Paneer Butter Masala, Mixed Salad, Curd", "12:30 PM - 02:30 PM", "Vegetarian", None),
        (3, "Monday", "SNACKS", None, "Vegetable Cutlet, Green Mint Chutney, Masala Chai, Biscuits", "05:00 PM - 06:15 PM", "Vegetarian", None),
        (4, "Monday", "DINNER", None, "Jeera Rice, Phulka, Aloo Gobi Matar, Yellow Dal Fry, Gulab Jamun, Papad", "07:30 PM - 09:45 PM", "Vegetarian", "Sweet: Gulab Jamun"),
        # Tuesday
        (5, "Tuesday", "BREAKFAST", None, "Poha with Roasted Peanuts, Sev, Boiled Eggs / Banana, Tea / Coffee", "07:30 AM - 09:30 AM", "Mixed", "High Protein Options"),
        (6, "Tuesday", "LUNCH", None, "Rajma Masala, Steamed Rice, Tandoori Roti, Boondi Raita, Roasted Papad, Salad", "12:30 PM - 02:30 PM", "Vegetarian", "North Indian Special"),
        (7, "Tuesday", "SNACKS", None, "Crispy Samosa, Sweet Tamarind Chutney, Ginger Chai", "05:00 PM - 06:15 PM", "Vegetarian", None),
        (8, "Tuesday", "DINNER", None, "Chicken Dum Biryani / Vegetable Dum Biryani, Mirchi Ka Salan, Onion Raita, Vanilla Ice Cream", "07:30 PM - 09:45 PM", "Mixed", "Special Dinner Feast"),
        # Wednesday
        (9, "Wednesday", "BREAKFAST", None, "Crispy Masala Dosa, Potato Masala, Sambar, Coconut & Tomato Chutney, Filter Coffee", "07:30 AM - 09:30 AM", "Vegetarian", "Chef Special Dosa"),
        (10, "Wednesday", "LUNCH", None, "Peas Pulao, Whole Wheat Chapati, Chana Masala, Dal Makhani, Fresh Cucumber Salad", "12:30 PM - 02:30 PM", "Vegetarian", None),
        (11, "Wednesday", "SNACKS", None, "Bread Pakora with Potato stuffing, Tomato Ketchup, Filter Coffee / Tea", "05:00 PM - 06:15 PM", "Vegetarian", None),
        (12, "Wednesday", "DINNER", None, "Veg Fried Rice, Vegetable Manchurian Gravy / Egg Curry, Clear Sweetcorn Soup", "07:30 PM - 09:45 PM", "Mixed", "Indo-Chinese Night"),
        # Thursday
        (13, "Thursday", "BREAKFAST", None, "Aloo Paratha, Fresh White Butter, Mint Curd Raita, Mixed Mango Pickle, Masala Tea", "07:30 AM - 09:30 AM", "Vegetarian", "Punjabi Breakfast"),
        (14, "Thursday", "LUNCH", None, "Punjabi Kadhi Pakora, Steamed White Rice, Soft Phulka, Bhindi Do Pyaza, Roasted Papad", "12:30 PM - 02:30 PM", "Vegetarian", None),
        (15, "Thursday", "SNACKS", None, "Sweet Corn Chaat with Butter & Herbs, Fresh Lemon Soda, Tea", "05:00 PM - 06:15 PM", "Vegetarian", "Healthy Snacks"),
        (16, "Thursday", "DINNER", None, "Butter Naan, Shahi Paneer, Dal Fry, Jeera Rice, Rasgulla", "07:30 PM - 09:45 PM", "Vegetarian", "Sweet: Rasgulla"),
        # Friday
        (17, "Friday", "BREAKFAST", None, "Rava Upma, Coconut Chutney, Kesari Bath (Sheera), Boiled Sprouts, Tea / Coffee", "07:30 AM - 09:30 AM", "Vegetarian", None),
        (18, "Friday", "LUNCH", None, "Lemon Rice, Curd Rice, Crispy Potato Roast, Traditional Sambar, Appalam", "12:30 PM - 02:30 PM", "Vegetarian", "South Indian Thali"),
        (19, "Friday", "SNACKS", None, "Pav Bhaji with Buttered Pav, Sliced Onions & Lemon, Masala Chai", "05:00 PM - 06:15 PM", "Vegetarian", "Street Food Special"),
        (20, "Friday", "DINNER", None, "Kashmiri Pulao, Chapati, Malai Kofta / Butter Chicken, Moong Dal Halwa", "07:30 PM - 09:45 PM", "Mixed", "Deluxe Friday Meal"),
        # Saturday
        (21, "Saturday", "BREAKFAST", None, "Puri Bhaji (Spicy Potato Gravy), Sooji Halwa, Fresh Banana, Tea / Coffee", "07:30 AM - 09:30 AM", "Vegetarian", "Weekend Special"),
        (22, "Saturday", "LUNCH", None, "Moong Dal Khichdi with Desi Ghee, Gujarati Kadhi, Begun Bhaja, Fried Papad, Achar", "12:30 PM - 02:30 PM", "Vegetarian", "Comfort Meal"),
        (23, "Saturday", "SNACKS", None, "Bhel Puri with Sev, Mint Cooler Drink, Biscuits", "05:00 PM - 06:15 PM", "Vegetarian", None),
        (24, "Saturday", "DINNER", None, "Veg Hakka Noodles, Chili Paneer / Chili Chicken, Hot & Sour Soup", "07:30 PM - 09:45 PM", "Mixed", "Weekend Specials"),
        # Sunday
        (25, "Sunday", "BREAKFAST", None, "Chole Bhature with Pickled Onions, Sweet Lassi / Masala Chai", "08:00 AM - 10:00 AM", "Vegetarian", "Sunday Brunch (Late Timings)"),
        (26, "Sunday", "LUNCH", None, "Special Hyderabadi Dum Biryani (Veg/Chicken), Bagara Baingan, Raita, Double Ka Meetha", "12:30 PM - 02:30 PM", "Mixed", "Grand Sunday Lunch"),
        (27, "Sunday", "SNACKS", None, "Crispy Onion Pakora, Green Chutney, Cardamom Chai", "05:00 PM - 06:15 PM", "Vegetarian", None),
        (28, "Sunday", "DINNER", None, "Light Khichdi / Phulkas with Mix Veg Kurma, Yellow Moong Dal, Fresh Fruit Custard", "07:30 PM - 09:45 PM", "Vegetarian", "Light Dinner")
    ]

    for m in mess_menu_data:
        cur.execute("""
            INSERT OR REPLACE INTO mess_menu (
                id, day_of_week, meal_type, date, items, timings, dietary_info, special_note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, m)

    # 15. Seed Mess Feedback (Real Student Feedback Records)
    mess_feedback_data = [
        (
            1, "1", "Alex Johnson", "CP-847291", "BREAKFAST", 5, "TASTE",
            "Masala dosa was exceptionally crisp today and the coconut chutney was very fresh. Great job!",
            "2026-10-04", "2026-10-04 09:15:00"
        ),
        (
            2, "1", "Alex Johnson", "CP-847291", "LUNCH", 2, "HYGIENE",
            "Water glasses at Table 4 in West Wing dining hall had water spots and detergent residue. Please ensure thorough rinsing.",
            "2026-10-03", "2026-10-03 14:10:00"
        ),
        (
            3, "2", "Jane Smith", "CP-992211", "DINNER", 4, "FOOD_QUALITY",
            "Paneer Butter Masala was rich and tasty. Naan was hot and fresh.",
            "2026-10-04", "2026-10-04 20:30:00"
        ),
        (
            4, "2", "Jane Smith", "CP-992211", "SNACKS", 2, "QUANTITY",
            "Samosas ran out by 5:40 PM, several students in Block B didn't get any before tea was closed.",
            "2026-10-02", "2026-10-02 18:00:00"
        ),
        (
            5, "STU-2023-8941", "Alex Johnson", "CP-847291", "LUNCH", 2, "HYGIENE",
            "Hand sanitizing dispenser near handwash area was empty during peak lunch rush.",
            "2026-10-02", "2026-10-02 13:45:00"
        ),
        (
            6, "STU-2023-8941", "Alex Johnson", "CP-847291", "DINNER", 3, "TIMING",
            "Dinner service started 15 minutes late around 7:45 PM causing a long queue outside.",
            "2026-10-01", "2026-10-01 20:15:00"
        )
    ]

    for fb in mess_feedback_data:
        cur.execute("""
            INSERT OR REPLACE INTO mess_feedback (
                id, student_id, student_name, student_identifier, meal_type,
                rating, category, comments, meal_date, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, fb)

    # 16. Seed Student Groups (Phase 4.3D)
    groups_data = [
        ("1", "Coding Club"),
        ("1", "Hostel Council"),
        ("STU-2023-8941", "Coding Club"),
        ("STU-2023-8941", "Hostel Council"),
        ("2", "Robotics Society"),
        ("2", "Cultural Committee"),
    ]
    for g in groups_data:
        cur.execute("""
            INSERT OR IGNORE INTO student_groups (student_id, group_name)
            VALUES (?, ?)
        """, g)

    # 17. Seed Targeted Notifications (Phase 4.3D)
    targeted_notifications_data = [
        (
            1,
            "Annual Campus TechPulse 2026 Registration Open",
            "Registrations are now open for all university students to submit hardware and software projects for the annual symposium.",
            "campus",
            "campus",
            "ALL CAMPUS",
            "ALL",
            None,
            "Register Project",
            "primary",
            "Admin Carter (Campus Operations)"
        ),
        (
            2,
            "ACM ICPC Regional Prelims Coaching for Computer Science",
            "Department of Computing has organized weekly competitive programming rounds in Turing Lab for CSE students.",
            "academic",
            "assignment",
            "CSE DEPT",
            "BRANCH",
            "Computer Science",
            "View Schedule",
            "primary",
            "Prof. Sarah Jenkins"
        ),
        (
            3,
            "Pre-Placement Internship Briefing for 3rd Year Students",
            "Mandatory briefing on summer corporate internships and resume verification in Main Auditorium.",
            "alerts",
            "urgent",
            "3RD YEAR",
            "YEAR",
            "3",
            "Confirm Attendance",
            "danger",
            "Dean of Student Affairs"
        ),
        (
            4,
            "Scheduled Water Tank Maintenance - Oak Ridge Hall",
            "Overhead water tank sterilization scheduled tomorrow from 10:00 AM to 12:00 PM for Oak Ridge Residence Hall.",
            "campus",
            "campus",
            "OAK RIDGE",
            "HOSTEL",
            "Oak Ridge",
            "Hostel Info",
            "primary",
            "Warden Michael Chang"
        ),
        (
            5,
            "Autonomous Drone Hackathon for Robotics Society",
            "Exclusive parts kit distribution for registered Robotics Society members in Engineering Workshop 2.",
            "academic",
            "assignment",
            "ROBOTICS",
            "GROUP",
            "Robotics Society",
            "Collect Kit",
            "primary",
            "Faculty Advisor"
        )
    ]
    for tn in targeted_notifications_data:
        cur.execute("""
            INSERT OR REPLACE INTO targeted_notifications (
                id, title, description, category, badge_type, badge_label,
                target_type, target_value, action_button_text, action_button_type,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, tn)

    # 18. Seed Student Fees & Dues Records (Fees Module)
    fees_data = [
        # Alex Johnson (Student 1)
        (
            1,
            "1",
            "Alex Johnson",
            "CP-847291",
            "Fall 2023 Undergraduate Tuition Fee",
            "TUITION",
            "Fall 2023",
            4500.00,
            4500.00,
            "2026-09-15",
            "PAID",
            "Online NetBanking",
            "TXN-84729101",
            "2026-09-12 14:32:10",
            "Full tuition fee paid for Fall 2023 semester."
        ),
        (
            2,
            "1",
            "Alex Johnson",
            "CP-847291",
            "Oak Ridge Hall Accommodation & Amenities",
            "HOSTEL",
            "Fall 2023",
            1800.00,
            1800.00,
            "2026-09-20",
            "PAID",
            "Campus UPI Gateway",
            "TXN-84729102",
            "2026-09-14 10:15:44",
            "Single room occupancy in Oak Ridge Hall, Room 402."
        ),
        (
            3,
            "1",
            "Alex Johnson",
            "CP-847291",
            "Dining Hall Meal Plan (First Tranche)",
            "MESS",
            "Fall 2023",
            1200.00,
            800.00,
            "2026-11-01",
            "PARTIAL",
            "Debit Card",
            "TXN-84729103",
            "2026-09-18 16:45:00",
            "Partial instalment paid. Outstanding balance: ₹400.00 due by Nov 1."
        ),
        (
            4,
            "1",
            "Alex Johnson",
            "CP-847291",
            "Library Book Bank & Annual Security",
            "LIBRARY",
            "Academic Year 2023-2024",
            150.00,
            0.00,
            "2026-09-01",
            "OVERDUE",
            None,
            None,
            None,
            "Annual library security deposit past grace period. Please clear before term exams."
        ),
        (
            5,
            "1",
            "Alex Johnson",
            "CP-847291",
            "Computing Science Lab & Cloud GPU Credits",
            "LABORATORY",
            "Fall 2023",
            350.00,
            0.00,
            "2026-11-15",
            "PENDING",
            None,
            None,
            None,
            "Turing lab hardware kit and cloud compute allotment fee."
        ),

        # Jane Smith (Student 2)
        (
            6,
            "2",
            "Jane Smith",
            "CP-992211",
            "Fall 2023 Undergraduate Tuition Fee",
            "TUITION",
            "Fall 2023",
            4500.00,
            4500.00,
            "2026-09-15",
            "PAID",
            "Bank Transfer",
            "TXN-99221101",
            "2026-09-11 11:20:00",
            "Tuition fee processed via student education loan."
        ),
        (
            7,
            "2",
            "Jane Smith",
            "CP-992211",
            "Maple Hall Residence Accommodation",
            "HOSTEL",
            "Fall 2023",
            1750.00,
            1750.00,
            "2026-09-20",
            "PAID",
            "Online NetBanking",
            "TXN-99221102",
            "2026-09-15 09:40:00",
            "Maple Hall double-occupancy room charges."
        ),
        (
            8,
            "2",
            "Jane Smith",
            "CP-992211",
            "Electrical Engineering Laboratory Kit",
            "LABORATORY",
            "Fall 2023",
            400.00,
            0.00,
            "2026-11-20",
            "PENDING",
            None,
            None,
            None,
            "Microcontroller breadboard and oscilloscope components kit."
        )
    ]

    for f_rec in fees_data:
        cur.execute("""
            INSERT OR REPLACE INTO student_fees (
                id, student_id, student_name, student_identifier,
                title, category, term, total_amount, amount_paid,
                due_date, status, payment_method, transaction_reference,
                paid_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, f_rec)

    # 13. Previous Year Question Papers (Feature 1)
    papers_data = [
        (
            1,
            "CS301 Data Structures & Algorithms - End-Term Examination (Dec 2023)",
            "Data Structures & Algorithms",
            "CS301",
            "School of Computing & Data Sciences",
            3,
            "End-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS301_EndTerm_2023.pdf",
            "1.8 MB",
            142,
            "Examination Cell"
        ),
        (
            2,
            "CS301 Data Structures & Algorithms - Mid-Term Examination (Oct 2023)",
            "Data Structures & Algorithms",
            "CS301",
            "School of Computing & Data Sciences",
            3,
            "Mid-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS301_MidTerm_2023.pdf",
            "980 KB",
            89,
            "Examination Cell"
        ),
        (
            3,
            "CS304 Database Management Systems - End-Term Examination (Dec 2023)",
            "Database Management Systems",
            "CS304",
            "School of Computing & Data Sciences",
            4,
            "End-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS304_EndTerm_2023.pdf",
            "2.1 MB",
            210,
            "Examination Cell"
        ),
        (
            4,
            "CS304 Database Management Systems - Mid-Term Examination (Oct 2023)",
            "Database Management Systems",
            "CS304",
            "School of Computing & Data Sciences",
            4,
            "Mid-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS304_MidTerm_2023.pdf",
            "1.1 MB",
            104,
            "Examination Cell"
        ),
        (
            5,
            "CS308 Computer Networks - End-Term Examination (Dec 2023)",
            "Computer Networks",
            "CS308",
            "School of Computing & Data Sciences",
            5,
            "End-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS308_EndTerm_2023.pdf",
            "1.7 MB",
            178,
            "Examination Cell"
        ),
        (
            6,
            "CS308 Computer Networks - Mid-Term Examination (Oct 2023)",
            "Computer Networks",
            "CS308",
            "School of Computing & Data Sciences",
            5,
            "Mid-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS308_MidTerm_2023.pdf",
            "850 KB",
            76,
            "Examination Cell"
        ),
        (
            7,
            "MATH302 Discrete Mathematics - End-Term Examination (May 2023)",
            "Discrete Mathematics",
            "MATH302",
            "Basic Sciences & Humanities",
            3,
            "End-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/MATH302_EndTerm_2023.pdf",
            "1.4 MB",
            230,
            "Examination Cell"
        ),
        (
            8,
            "MATH302 Discrete Mathematics - Mid-Term Examination (Mar 2023)",
            "Discrete Mathematics",
            "MATH302",
            "Basic Sciences & Humanities",
            3,
            "Mid-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/MATH302_MidTerm_2023.pdf",
            "720 KB",
            95,
            "Examination Cell"
        ),
        (
            9,
            "CS312 Software Engineering & Agile - End-Term (Dec 2022)",
            "Software Engineering",
            "CS312",
            "School of Computing & Data Sciences",
            5,
            "End-Term",
            2022,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS312_EndTerm_2022.pdf",
            "1.9 MB",
            165,
            "Examination Cell"
        ),
        (
            10,
            "CS315 Web Technologies & Cloud - End-Term (Dec 2023)",
            "Web Technologies & Cloud",
            "CS315",
            "School of Computing & Data Sciences",
            5,
            "End-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/CS315_EndTerm_2023.pdf",
            "2.3 MB",
            194,
            "Examination Cell"
        ),
        (
            11,
            "EE201 Basic Electrical Circuits - End-Term (May 2023)",
            "Electrical Circuits",
            "EE201",
            "School of Engineering",
            2,
            "End-Term",
            2023,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/EE201_EndTerm_2023.pdf",
            "1.6 MB",
            112,
            "Examination Cell"
        ),
        (
            12,
            "ME102 Engineering Mechanics & Statics - End-Term (May 2022)",
            "Engineering Mechanics",
            "ME102",
            "School of Engineering",
            1,
            "End-Term",
            2022,
            "https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/ME102_EndTerm_2022.pdf",
            "2.0 MB",
            88,
            "Examination Cell"
        )
    ]

    for p in papers_data:
        cur.execute("""
            INSERT OR REPLACE INTO previous_year_papers (
                id, title, subject, subject_code, department, semester,
                exam_type, year, resource_url, file_size, download_count, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, p)

    # 14. Library Books Catalog (Feature 2)
    books_data = [
        (
            1,
            "Introduction to Algorithms (4th Edition)",
            "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
            "978-0262046305",
            "Computer Science",
            "School of Computing & Data Sciences",
            "4th Edition",
            "MIT Press",
            2022,
            "Central Library - Stack Room A, Shelf 3",
            8,
            5,
            "Comprehensive textbook covering algorithmic paradigms, graph algorithms, dynamic programming, and complexity theory."
        ),
        (
            2,
            "Computer Networks: A Systems Approach",
            "Larry L. Peterson, Bruce S. Davie",
            "978-0123850591",
            "Computer Science",
            "School of Computing & Data Sciences",
            "5th Edition",
            "Morgan Kaufmann",
            2021,
            "Central Library - Stack Room A, Shelf 7",
            6,
            3,
            "In-depth analysis of internet protocols, layering architecture, TCP/IP congestion control, and wireless networks."
        ),
        (
            3,
            "Operating System Concepts",
            "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
            "978-1119800361",
            "Computer Science",
            "School of Computing & Data Sciences",
            "10th Edition",
            "Wiley",
            2021,
            "Central Library - Stack Room A, Shelf 5",
            7,
            4,
            "The foundational dinosaur book on OS kernel design, process synchronization, virtual memory, and file systems."
        ),
        (
            4,
            "Database System Concepts",
            "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
            "978-0078022159",
            "Computer Science",
            "School of Computing & Data Sciences",
            "7th Edition",
            "McGraw-Hill",
            2020,
            "Central Library - Stack Room B, Shelf 2",
            10,
            6,
            "Definitive guide to relational models, SQL query optimization, transaction processing, ACID properties, and indexing."
        ),
        (
            5,
            "Discrete Mathematics and Its Applications",
            "Kenneth H. Rosen",
            "978-1259676512",
            "Mathematics",
            "Basic Sciences & Humanities",
            "8th Edition",
            "McGraw-Hill",
            2019,
            "Central Library - Stack Room C, Shelf 1",
            9,
            6,
            "Logic, sets, relations, combinatorics, graph theory, trees, and algebraic structures for computer science."
        ),
        (
            6,
            "Artificial Intelligence: A Modern Approach",
            "Stuart Russell, Peter Norvig",
            "978-0134610993",
            "Computer Science",
            "School of Computing & Data Sciences",
            "4th Edition",
            "Pearson",
            2020,
            "Central Library - Stack Room A, Shelf 9",
            5,
            2,
            "The leading reference in artificial intelligence, search algorithms, knowledge representation, and probabilistic reasoning."
        ),
        (
            7,
            "Design Patterns: Elements of Reusable Object-Oriented Software",
            "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
            "978-0201633610",
            "Computer Science",
            "School of Computing & Data Sciences",
            "1st Edition",
            "Addison-Wesley",
            2018,
            "Central Library - Stack Room B, Shelf 4",
            4,
            0,
            "Classic Gang of Four reference covering creational, structural, and behavioral design patterns in object-oriented systems."
        ),
        (
            8,
            "Electric Circuits (11th Edition)",
            "James W. Nilsson, Susan Riedel",
            "978-0134746968",
            "Electrical",
            "School of Engineering",
            "11th Edition",
            "Pearson",
            2019,
            "Central Library - Stack Room D, Shelf 3",
            6,
            4,
            "Circuit analysis techniques, Ohm's law, nodal and mesh analysis, Laplace transforms, and frequency response."
        )
    ]

    for b in books_data:
        cur.execute("""
            INSERT OR REPLACE INTO library_books (
                id, title, author, isbn, category, department,
                edition, publisher, publish_year, location,
                total_copies, available_copies, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, b)

    # 15. Book Issues (Feature 2)
    issues_data = [
        (
            1,
            2, # Computer Networks
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "2026-09-28 10:15:00",
            "2026-09-29",
            "2026-10-20",
            None,
            "ISSUED",
            "Required for CS308 semester coursework and lab exercises.",
            "Issued at Counter 2 by Librarian."
        ),
        (
            2,
            4, # Database System Concepts
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "2026-09-10 14:20:00",
            "2026-09-11",
            "2026-09-25",
            "2026-09-24",
            "RETURNED",
            "Reference for SQL normalization project.",
            "Returned in pristine condition."
        ),
        (
            3,
            1, # Introduction to Algorithms
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "2026-10-06 09:30:00",
            None,
            None,
            None,
            "REQUESTED",
            "Preparation for upcoming midterm exam on dynamic programming.",
            None
        ),
        (
            4,
            8, # Electric Circuits
            "2",
            "Jane Smith",
            "CP-992211",
            "2026-09-25 11:00:00",
            "2026-09-26",
            "2026-10-17",
            None,
            "ISSUED",
            "EE201 laboratory circuit assignments.",
            "Issued at Counter 1."
        )
    ]

    for iss in issues_data:
        cur.execute("""
            INSERT OR REPLACE INTO book_issues (
                id, book_id, student_id, student_name, student_identifier,
                request_date, issue_date, due_date, return_date,
                status, notes, admin_remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, iss)

    # Also insert issue for student_id="1" to guarantee both student_id representations map
    cur.execute("""
        INSERT OR IGNORE INTO book_issues (
            book_id, student_id, student_name, student_identifier,
            request_date, issue_date, due_date, return_date,
            status, notes, admin_remarks
        ) VALUES (
            2, '1', 'Alex Johnson', 'CP-847291',
            '2026-09-28 10:15:00', '2026-09-29', '2026-10-20', NULL,
            'ISSUED', 'Required for CS308 semester coursework.', 'Counter 2'
        )
    """)

    # 16. Student Library Cards (Feature 3)
    cards_data = [
        (
            1,
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "LC-2023-847291",
            "2023-08-01",
            "2024-12-31",
            "ACTIVE"
        ),
        (
            2,
            "1",
            "Alex Johnson",
            "CP-847291",
            "LC-2023-847291-ALT",
            "2023-08-01",
            "2024-12-31",
            "ACTIVE"
        ),
        (
            3,
            "2",
            "Jane Smith",
            "CP-992211",
            "LC-2023-992211",
            "2023-08-01",
            "2024-12-31",
            "ACTIVE"
        )
    ]

    for c in cards_data:
        cur.execute("""
            INSERT OR REPLACE INTO library_cards (
                id, student_id, student_name, student_identifier,
                card_number, issue_date, valid_until, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, c)

    # 17. Library Card Renewal Requests (Feature 3)
    renewals_data = [
        (
            1,
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "2024-12-31",
            12,
            "Extending library privileges for final-year project and competitive programming research.",
            "PENDING",
            None,
            None,
            None
        ),
        (
            2,
            "2",
            "Jane Smith",
            "CP-992211",
            "2023-12-31",
            12,
            "Annual academic year renewal for Semester 4 coursework.",
            "RENEWED",
            "2024-12-31",
            "Approved by Chief Librarian.",
            "Dr. Marcus Carter"
        )
    ]

    for ren in renewals_data:
        cur.execute("""
            INSERT OR REPLACE INTO library_card_renewals (
                id, student_id, student_name, student_identifier,
                current_expiry_date, requested_extension_months, reason,
                status, new_expiry_date, admin_notes, processed_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ren)

    # 18. Lost & Found Notices
    lf_data = [
        (
            1,
            "LF-2024-0001",
            "LOST",
            "Blue HP Laptop Charger (65W Type-C)",
            "Electronics",
            "Left behind near window desk #14 on 2nd floor reading hall. It has a small yellow tape on the adapter.",
            "Central Library 2nd Floor Reading Room Desk 14",
            "2024-10-06",
            "alex.johnson@campus.edu | Room 304 Ramanujan Hostel",
            None,
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "ACTIVE",
            None
        ),
        (
            2,
            "LF-2024-0002",
            "FOUND",
            "Casio FX-991EX ClassWiz Calculator",
            "Electronics",
            "Found on third row bench after Calculus lecture. Has initials 'S.M.' scratched on the back cover.",
            "LH-201 Lecture Hall, 3rd row",
            "2024-10-07",
            "Security Desk Main Gate or Intercom Ext. 402",
            None,
            "2",
            "Jane Smith",
            "CP-992211",
            "ACTIVE",
            None
        ),
        (
            3,
            "LF-2024-0003",
            "LOST",
            "Brown Leather Wallet with Metro Card",
            "Bags & Wallets",
            "Dark brown leather wallet containing university ID and Delhi Metro card. Cash not important, please return cards.",
            "Central Cafeteria Food Court near counter 2",
            "2024-10-04",
            "alex.johnson@campus.edu | +91 98765 43210",
            None,
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "CLAIMED",
            "Handed back to owner after identity verification at cafeteria lost box."
        ),
        (
            4,
            "LF-2024-0004",
            "FOUND",
            "Set of 3 Keys with Red Honda Keychain",
            "Keys & Access Cards",
            "Discovered near bicycle parking stand by gardening staff. Includes two brass keys and one bike ignition key.",
            "Engineering Block A Parking Lot Stand 3",
            "2024-10-05",
            "Admin Reception Window 2 (Mr. Ramesh)",
            None,
            "admin-1",
            "Dr. Robert Vance",
            "ADMIN-001",
            "RESOLVED",
            "Claimed by Mechanical Dept student on Oct 6."
        )
    ]

    for lf in lf_data:
        cur.execute("""
            INSERT OR REPLACE INTO lost_found_items (
                id, public_id, notice_type, item_name, category,
                description, location, item_date, contact_info, image_url,
                student_id, student_name, student_identifier, status, admin_notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, lf)

    # Lost & Found activities
    lf_activities = [
        (1, 1, "STU-2023-8941", "Alex Johnson", "student", "CREATED", None, "ACTIVE", "Notice published for lost HP charger"),
        (2, 2, "2", "Jane Smith", "student", "CREATED", None, "ACTIVE", "Notice published for found scientific calculator"),
        (3, 3, "STU-2023-8941", "Alex Johnson", "student", "CREATED", None, "ACTIVE", "Notice published for lost wallet"),
        (4, 3, "admin-1", "Dr. Robert Vance", "admin", "STATUS_UPDATE", "ACTIVE", "CLAIMED", "Owner claimed item from cafeteria desk"),
        (5, 4, "admin-1", "Dr. Robert Vance", "admin", "CREATED", None, "ACTIVE", "Notice published for found keys"),
        (6, 4, "admin-1", "Dr. Robert Vance", "admin", "STATUS_UPDATE", "ACTIVE", "RESOLVED", "Keys verified and handed over")
    ]

    for lfa in lf_activities:
        cur.execute("""
            INSERT OR REPLACE INTO lost_found_activities (
                id, item_id, actor_id, actor_name, actor_role, action,
                old_status, new_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, lfa)

    # 19. Event Conduction Applications
    events_data = [
        (
            1,
            "EVT-2024-0001",
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "Annual HackPulse 2024 - 24hr Campus Hackathon",
            "Hackathon & Coding",
            "Flagship 24-hour inter-department hackathon focused on AI, Web3, and Sustainable Tech. Will feature 40 teams, mentoring rounds, and keynote tech sessions.",
            "2024-11-15",
            "09:00 AM",
            "05:00 PM",
            "Main University Auditorium (Capacity: 1200)",
            200,
            "Coding & Innovation Society",
            "Dr. Elena Rostova (+91 98765 11223)",
            "High-speed Wi-Fi access point, 20 extra power extension boards, projector and sound mic.",
            "APPROVED",
            "Approved by Dean Student Affairs. Facilities team instructed for uninterrupted power.",
            "Main University Auditorium (Capacity: 1200)",
            "Dr. Robert Vance",
            "2024-10-06 14:30:00"
        ),
        (
            2,
            "EVT-2024-0002",
            "STU-2023-8941",
            "Alex Johnson",
            "CP-847291",
            "School of Computing & Data Sciences",
            "Guest Workshop on Distributed Systems & Cloud Microservices",
            "Workshop / Hands-on",
            "Interactive 4-hour hands-on workshop conducted by industry engineers on Kubernetes, gRPC, and high-concurrency architecture.",
            "2024-11-28",
            "02:00 PM",
            "06:00 PM",
            "APJ Abdul Kalam Seminar Hall (Capacity: 250)",
            120,
            "ACM Student Chapter",
            "Prof. Ananya Sen (CS Department)",
            "Audio-visual system, dual wireless microphones, attendee seating layout.",
            "PENDING",
            None,
            None,
            None,
            None
        ),
        (
            3,
            "EVT-2024-0003",
            "2",
            "Jane Smith",
            "CP-992211",
            "School of Engineering",
            "Inter-Hostel Badminton & Table Tennis Tournament",
            "Sports",
            "Annual semester sports championship between Ramanujan Hostel, Aryabhatta Hostel, and Gargi Hostel.",
            "2024-10-25",
            "04:30 PM",
            "09:00 PM",
            "Indoor Sports Complex (Capacity: 500)",
            80,
            "Campus Sports Council",
            "Coach Rajesh Verma",
            "Court floodlights until 9:30 PM, official scoreboards, first aid kit on standby.",
            "APPROVED",
            "Approved. Sports officer notified.",
            "Indoor Sports Complex (Capacity: 500)",
            "Dr. Robert Vance",
            "2024-10-05 11:00:00"
        )
    ]

    for ev in events_data:
        cur.execute("""
            INSERT OR REPLACE INTO event_applications (
                id, application_no, student_id, student_name, student_identifier,
                department, event_name, event_type, description, proposed_date,
                start_time, end_time, venue, expected_participants, organizing_body,
                faculty_coordinator, additional_requirements, status, admin_remarks,
                approved_venue, processed_by, processed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ev)

    # Event activities
    event_activities = [
        (1, 1, "STU-2023-8941", "Alex Johnson", "student", "SUBMITTED", None, "PENDING", "Application submitted by Coding & Innovation Society"),
        (2, 1, "admin-1", "Dr. Robert Vance", "admin", "STATUS_APPROVED", "PENDING", "APPROVED", "Approved by Dean Student Affairs with Main Auditorium venue"),
        (3, 2, "STU-2023-8941", "Alex Johnson", "student", "SUBMITTED", None, "PENDING", "Application submitted by ACM Student Chapter"),
        (4, 3, "2", "Jane Smith", "student", "SUBMITTED", None, "PENDING", "Application submitted by Campus Sports Council"),
        (5, 3, "admin-1", "Dr. Robert Vance", "admin", "STATUS_APPROVED", "PENDING", "APPROVED", "Approved for Indoor Sports Complex")
    ]

    for ea in event_activities:
        cur.execute("""
            INSERT OR REPLACE INTO event_application_activities (
                id, application_id, actor_id, actor_name, actor_role, action,
                old_status, new_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ea)

    cur.execute("PRAGMA foreign_keys = ON;")
    conn.commit()
    conn.close()
    print("[Database] Fictional development data (Student, Teacher, Admin, Campus Requests, Mess Menu & Feedback, Targeted Notifications, Fees & Dues, Previous Year Papers, Library Books, Issues, Cards & Renewals, Lost & Found, Event Conduction Applications) successfully seeded into SQLite!")



if __name__ == "__main__":
    seed_database()

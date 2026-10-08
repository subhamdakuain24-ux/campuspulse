-- CampusPulse Normalized SQLite Database Schema

PRAGMA foreign_keys = ON;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    program TEXT NOT NULL,
    department TEXT NOT NULL,
    semester INTEGER NOT NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    avatar_url TEXT,
    campus_address TEXT,
    gpa REAL NOT NULL DEFAULT 0.0,
    gpa_change TEXT,
    credits_earned INTEGER NOT NULL DEFAULT 0,
    credits_total INTEGER NOT NULL DEFAULT 160,
    enrolled_year INTEGER NOT NULL,
    graduation_year INTEGER NOT NULL,
    overall_attendance_pct REAL NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Subjects (Courses) Table
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    instructor TEXT NOT NULL,
    instructor_avatar TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    room TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Student Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

-- 4. Attendance Summary per Student per Subject
CREATE TABLE IF NOT EXISTS attendance_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    total_classes INTEGER NOT NULL DEFAULT 0,
    attended_classes INTEGER NOT NULL DEFAULT 0,
    percentage REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'Safe', -- 'Safe' | 'Warning' | 'Shortage'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

-- 5. Daily Attendance Logs (History)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL, -- 'present' | 'absent' | 'excused' | 'holiday'
    topic TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    exam_type TEXT NOT NULL, -- 'Mid-Term' | 'Final' | 'Quiz'
    exam_date TEXT NOT NULL, -- YYYY-MM-DD
    display_date TEXT NOT NULL,
    time_range TEXT NOT NULL,
    room TEXT NOT NULL,
    seat_number TEXT,
    status TEXT NOT NULL DEFAULT 'Upcoming', -- 'Scheduled' | 'Upcoming' | 'Completed'
    prep_percentage INTEGER DEFAULT 0,
    format_description TEXT,
    total_marks INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Weekly Timetable Table
CREATE TABLE IF NOT EXISTS timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
    day_index INTEGER NOT NULL, -- 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    time_display TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Lecture', -- 'Lecture' | 'Lab' | 'Tutorial'
    room TEXT NOT NULL,
    is_in_progress BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT NOT NULL,
    due_time_display TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium', -- 'high' | 'medium' | 'low'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'submitted' | 'completed' | 'late'
    submitted_date TEXT,
    grade TEXT,
    score INTEGER,
    total_points INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'all', -- 'all' | 'alerts' | 'exams' | 'academic' | 'campus'
    badge_type TEXT NOT NULL DEFAULT 'general', -- 'urgent' | 'assignment' | 'campus' | 'system' | 'general'
    badge_label TEXT NOT NULL,
    time_ago TEXT NOT NULL,
    unread BOOLEAN DEFAULT 1,
    action_button_text TEXT,
    action_button_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Student Authentication Credentials
CREATE TABLE IF NOT EXISTS student_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    identifier TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Unified Users Table (Students, Teachers, Admins)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    identifier TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
    password_hash TEXT NOT NULL,
    department TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Auth Tokens / Sessions (Universal across Roles)
CREATE TABLE IF NOT EXISTS auth_tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Campus Requests Table (Unified Operations Core)
CREATE TABLE IF NOT EXISTS campus_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL, -- e.g. CP-10001
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    department TEXT,
    request_type TEXT NOT NULL CHECK(request_type IN ('HOSTEL_COMPLAINT', 'FACILITY_COMPLAINT', 'CERTIFICATE_REQUEST', 'GATE_PASS', 'LEAVE_REQUEST')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    assigned_department TEXT,
    assigned_staff TEXT,
    meta_data TEXT, -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- 14. Campus Request Activities / Audit Log
CREATE TABLE IF NOT EXISTS campus_request_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL REFERENCES campus_requests(id) ON DELETE CASCADE,
    public_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Mess Menu Table (Phase 4.3C)
CREATE TABLE IF NOT EXISTS mess_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    meal_type TEXT NOT NULL CHECK(meal_type IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER')),
    date TEXT, -- optional YYYY-MM-DD
    items TEXT NOT NULL,
    timings TEXT NOT NULL,
    dietary_info TEXT DEFAULT 'Vegetarian', -- 'Vegetarian', 'Non-Vegetarian Options Available', 'Mixed'
    special_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Mess Feedback Table (Phase 4.3C)
CREATE TABLE IF NOT EXISTS mess_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    meal_type TEXT DEFAULT 'GENERAL' CHECK(meal_type IN ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'GENERAL')),
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    category TEXT NOT NULL CHECK(category IN ('FOOD_QUALITY', 'TASTE', 'HYGIENE', 'QUANTITY', 'TIMING', 'SERVICE', 'OTHER')),
    comments TEXT NOT NULL,
    meal_date TEXT NOT NULL, -- YYYY-MM-DD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Student Groups Table (Phase 4.3D)
CREATE TABLE IF NOT EXISTS student_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    group_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, group_name)
);

-- 18. Targeted Campus Notifications (Phase 4.3D)
CREATE TABLE IF NOT EXISTS targeted_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'campus', -- 'alerts' | 'exams' | 'academic' | 'campus' | 'hostel' | 'system'
    badge_type TEXT NOT NULL DEFAULT 'campus', -- 'urgent' | 'assignment' | 'campus' | 'system' | 'general'
    badge_label TEXT NOT NULL DEFAULT 'Notice',
    target_type TEXT NOT NULL CHECK(target_type IN ('ALL', 'STUDENT', 'BRANCH', 'YEAR', 'BATCH', 'HOSTEL', 'GROUP')),
    target_value TEXT,
    action_button_text TEXT,
    action_button_type TEXT DEFAULT 'primary',
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Targeted Notification Read Status per Student (Phase 4.3D)
CREATE TABLE IF NOT EXISTS notification_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notification_id INTEGER NOT NULL REFERENCES targeted_notifications(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notification_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_targeted_notif_target ON targeted_notifications(target_type, target_value);
CREATE INDEX IF NOT EXISTS idx_notif_reads_student ON notification_reads(student_id);
CREATE INDEX IF NOT EXISTS idx_student_groups_student ON student_groups(student_id);

-- 20. Student Fees & Dues Records (Fees Module)
CREATE TABLE IF NOT EXISTS student_fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('TUITION', 'HOSTEL', 'MESS', 'LIBRARY', 'EXAM', 'LABORATORY', 'OTHER')),
    term TEXT DEFAULT 'Fall 2023',
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    amount_paid REAL NOT NULL DEFAULT 0.0 CHECK(amount_paid >= 0),
    due_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('PAID', 'PENDING', 'PARTIAL', 'OVERDUE')),
    payment_method TEXT,
    transaction_reference TEXT,
    paid_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_category ON student_fees(category);

-- 21. Previous Year Papers (Feature 1)
CREATE TABLE IF NOT EXISTS previous_year_papers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_code TEXT,
    department TEXT NOT NULL,
    semester INTEGER NOT NULL CHECK(semester >= 1 AND semester <= 8),
    exam_type TEXT NOT NULL, -- 'Mid-Term' | 'End-Term' | 'Supplementary' | 'Model Paper'
    year INTEGER NOT NULL, -- 2024, 2023, 2022, etc.
    resource_url TEXT NOT NULL, -- safe verified paper URL/resource reference
    file_size TEXT DEFAULT '1.5 MB',
    download_count INTEGER DEFAULT 0,
    uploaded_by TEXT DEFAULT 'Examination Cell',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_papers_dept_sem ON previous_year_papers(department, semester);
CREATE INDEX IF NOT EXISTS idx_papers_year ON previous_year_papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_subject ON previous_year_papers(subject);

-- 22. Library Books Catalog (Feature 2)
CREATE TABLE IF NOT EXISTS library_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL, -- e.g. 'Computer Science', 'Mathematics', 'Electronics', 'Mechanical', 'Reference'
    department TEXT DEFAULT 'All',
    edition TEXT DEFAULT '1st Edition',
    publisher TEXT,
    publish_year INTEGER,
    location TEXT DEFAULT 'Central Library - Rack A',
    total_copies INTEGER NOT NULL DEFAULT 1 CHECK(total_copies >= 0),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK(available_copies >= 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_category ON library_books(category);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON library_books(isbn);

-- 23. Book Issue / Return Requests & Records (Feature 2)
CREATE TABLE IF NOT EXISTS book_issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL REFERENCES library_books(id) ON DELETE RESTRICT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issue_date TEXT, -- YYYY-MM-DD
    due_date TEXT,   -- YYYY-MM-DD
    return_date TEXT, -- YYYY-MM-DD
    status TEXT NOT NULL CHECK(status IN ('REQUESTED', 'ISSUED', 'RETURNED', 'REJECTED')) DEFAULT 'REQUESTED',
    notes TEXT,
    admin_remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_issues_student ON book_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_book ON book_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_book_issues_status ON book_issues(status);

-- 24. Student Library Cards (Feature 3)
CREATE TABLE IF NOT EXISTS library_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT UNIQUE NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    card_number TEXT UNIQUE NOT NULL,
    issue_date TEXT NOT NULL,
    valid_until TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_library_cards_student ON library_cards(student_id);

-- 25. Library Card Renewal Requests (Feature 3)
CREATE TABLE IF NOT EXISTS library_card_renewals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    current_expiry_date TEXT NOT NULL,
    requested_extension_months INTEGER DEFAULT 12,
    reason TEXT,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'RENEWED')) DEFAULT 'PENDING',
    new_expiry_date TEXT,
    admin_notes TEXT,
    processed_by TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_card_renewals_student ON library_card_renewals(student_id);
CREATE INDEX IF NOT EXISTS idx_card_renewals_status ON library_card_renewals(status);

-- 26. Lost & Found Notices
CREATE TABLE IF NOT EXISTS lost_found_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT UNIQUE NOT NULL,
    notice_type TEXT NOT NULL CHECK(notice_type IN ('LOST', 'FOUND')),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    item_date TEXT NOT NULL, -- YYYY-MM-DD
    contact_info TEXT NOT NULL,
    image_url TEXT,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'CLAIMED', 'RESOLVED', 'CLOSED')) DEFAULT 'ACTIVE',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lf_notice_type ON lost_found_items(notice_type);
CREATE INDEX IF NOT EXISTS idx_lf_category ON lost_found_items(category);
CREATE INDEX IF NOT EXISTS idx_lf_status ON lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lf_student ON lost_found_items(student_id);

-- 27. Lost & Found Activity / History Log
CREATE TABLE IF NOT EXISTS lost_found_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES lost_found_items(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lf_activities_item ON lost_found_activities(item_id);

-- 28. Event Conduction Applications
CREATE TABLE IF NOT EXISTS event_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_no TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_identifier TEXT NOT NULL,
    department TEXT,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    proposed_date TEXT NOT NULL, -- YYYY-MM-DD
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    expected_participants INTEGER NOT NULL DEFAULT 50,
    organizing_body TEXT NOT NULL,
    faculty_coordinator TEXT NOT NULL,
    additional_requirements TEXT,
    status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')) DEFAULT 'PENDING',
    admin_remarks TEXT,
    approved_venue TEXT,
    processed_by TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_apps_student ON event_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_event_apps_status ON event_applications(status);
CREATE INDEX IF NOT EXISTS idx_event_apps_date ON event_applications(proposed_date);
CREATE INDEX IF NOT EXISTS idx_event_apps_venue ON event_applications(venue);
CREATE INDEX IF NOT EXISTS idx_event_apps_dept ON event_applications(organizing_body);

-- 29. Event Conduction Activity / Audit Log
CREATE TABLE IF NOT EXISTS event_application_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES event_applications(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_activities_app ON event_application_activities(application_id);




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

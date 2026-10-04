export type ScreenId =
  | 'login'
  | 'dashboard'
  | 'attendance'
  | 'exams'
  | 'timetable'
  | 'assignments'
  | 'notifications'
  | 'operations'
  | 'profile'
  | 'ai-chat';

export type UserRole = 'Student' | 'Teacher' | 'Admin';

export interface AuthUser {
  id: string;
  identifier: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | UserRole;
  department?: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
}

export interface UserProfile {
  name: string;
  studentId: string;
  program: string;
  semester: string;
  term: string;
  date: string;
  email: string;
  phone: string;
  campusAddress: string;
  gpa: number;
  gpaChange: string;
  creditsEarned: number;
  creditsTotal: number;
  enrolledYear: number;
  graduationYear: number;
  avatarUrl: string;
  role: UserRole;
  preferences: {
    academicAlerts: boolean;
    profileVisibility: boolean;
    twoFactorAuth: boolean;
  };
}

export interface AttendanceSubject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  faculty: string;
  attended: number;
  total: number;
  percentage: number;
  status: 'safe' | 'warning' | 'shortage';
  badgeText: string;
  color: string;
}

export interface TodayClass {
  id: string;
  code: string;
  name: string;
  faculty: string;
  room: string;
  startTime: string;
  endTime: string;
  type: 'Lecture' | 'Lab' | 'Seminar';
  iconType: 'monitor' | 'math' | 'code' | 'database';
  status?: 'upcoming' | 'in-progress' | 'completed';
}

export interface ExamItem {
  id: string;
  code: string;
  name: string;
  date: string;
  displayDate: string;
  timeRange: string;
  room: string;
  status: 'Scheduled' | 'TBC' | 'Completed';
  syllabusPercent: number;
  isNext?: boolean;
}

export interface AssignmentItem {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDateText: string;
  dueDateTime: string;
  isUrgentToday?: boolean;
  status: 'pending' | 'draft' | 'completed';
  grade?: string;
  submittedDate?: string;
  actionText: string;
}

export interface NotificationItem {
  id: string;
  category: 'alerts' | 'exams' | 'academic' | 'campus' | 'system';
  badgeLabel: string;
  badgeType: 'urgent' | 'assignment' | 'campus' | 'system' | 'exam';
  timeAgo: string;
  title: string;
  description: string;
  unread: boolean;
  actionButtonText?: string;
  actionButtonType?: 'danger' | 'primary' | 'outline';
}

export interface TimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  courseCode: string;
  courseName: string;
  faculty: string;
  room: string;
  type: 'Lecture' | 'Lab' | 'Seminar';
  colorTheme: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  type?: 'text' | 'schedule' | 'attendance-calc' | 'exam-tips';
}

export type CampusRequestType =
  | 'HOSTEL_COMPLAINT'
  | 'FACILITY_COMPLAINT'
  | 'CERTIFICATE_REQUEST'
  | 'GATE_PASS'
  | 'LEAVE_REQUEST';

export type CampusPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface CampusRequestActivity {
  id: number;
  request_id: number;
  public_id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  old_status?: string;
  new_status?: string;
  notes?: string;
  created_at: string;
}

export interface CampusRequest {
  id: number;
  public_id: string;
  student_id: string;
  student_name: string;
  student_identifier: string;
  department?: string;
  request_type: CampusRequestType;
  title: string;
  description: string;
  category: string;
  location?: string;
  priority: CampusPriority;
  status: string;
  assigned_department?: string;
  assigned_staff?: string;
  meta_data?: string;
  meta?: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  age: {
    hours: number;
    days: number;
    formatted: string;
    is_aged: boolean;
  };
  resolution_time?: {
    hours: number;
    days: number;
    formatted: string;
  } | null;
  activities?: CampusRequestActivity[];
}

export interface CampusOperationsStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  aged_complaints: number;
  avg_resolution_hours: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  department_workload: Record<string, number>;
}

export interface CreateRequestPayload {
  request_type: CampusRequestType;
  title: string;
  description: string;
  category: string;
  location?: string;
  priority?: CampusPriority;
  meta?: Record<string, any>;
}

export interface UpdateRequestPayload {
  status?: string;
  assigned_department?: string;
  assigned_staff?: string;
  priority?: CampusPriority;
  note?: string;
}


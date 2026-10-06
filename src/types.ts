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

export type NotificationTargetType = 'ALL' | 'STUDENT' | 'BRANCH' | 'YEAR' | 'BATCH' | 'HOSTEL' | 'GROUP';

export interface CreateTargetedNotificationPayload {
  title: string;
  description: string;
  category?: 'alerts' | 'exams' | 'academic' | 'campus' | 'hostel' | 'system';
  badge_type?: 'urgent' | 'assignment' | 'campus' | 'system' | 'exam' | 'general';
  badge_label?: string;
  target_type: NotificationTargetType;
  target_value?: string;
  action_button_text?: string;
  action_button_type?: 'primary' | 'danger' | 'outline';
}

export interface TargetedNotificationRecord {
  id: number;
  title: string;
  description: string;
  category: string;
  badge_type: string;
  badge_label: string;
  target_type: NotificationTargetType;
  target_value: string | null;
  action_button_text?: string;
  action_button_type?: string;
  created_by: string;
  created_at: string;
  read_count?: number;
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
  targetType?: string;
  targetValue?: string | null;
  createdBy?: string;
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

export interface StaffWorkloadItem {
  staff_name: string;
  department: string;
  total_assigned: number;
  active: number;
  pending: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  overdue_ageing: number;
  status: 'OVERLOADED' | 'BUSY' | 'AVAILABLE';
  is_overloaded: boolean;
  is_available: boolean;
}

export interface DepartmentWorkloadItem {
  department: string;
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  overdue_ageing: number;
  active: number;
  resolution_rate: number;
}

export interface RecurringProblemItem {
  id: string;
  category: string;
  category_label: string;
  department: string;
  location_area: string;
  request_type: string;
  count: number;
  unresolved_count: number;
  resolved_count: number;
  overdue_count: number;
  sample_public_ids: string[];
  sample_titles: string[];
  first_reported: string;
  last_reported: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  is_recurring: boolean;
}

export interface CampusOperationsStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  resolved: number;
  rejected: number;
  unassigned: number;
  aged_complaints: number;
  avg_resolution_hours: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  department_workload: Record<string, number>;
  // Phase 4.3B extensions
  department_analytics?: DepartmentWorkloadItem[];
  staff_workload?: StaffWorkloadItem[];
  unassigned_staff?: Array<{ staff_name: string; department: string; status: string }>;
  unassigned_requests_count?: number;
  recurring_problems?: RecurringProblemItem[];
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

// Phase 4.3C — Mess Menu & Feedback Types
export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';

export type FeedbackCategory =
  | 'FOOD_QUALITY'
  | 'TASTE'
  | 'HYGIENE'
  | 'QUANTITY'
  | 'TIMING'
  | 'SERVICE'
  | 'OTHER';

export interface MessMenuItem {
  id: number;
  day_of_week: string;
  meal_type: MealType;
  date?: string | null;
  items: string;
  timings: string;
  dietary_info?: string;
  special_note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MessFeedbackItem {
  id: number;
  student_id: string;
  student_name: string;
  student_identifier: string;
  meal_type: MealType | 'GENERAL';
  rating: number; // 1-5
  category: FeedbackCategory;
  comments: string;
  meal_date: string;
  created_at: string;
}

export interface MessFeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  category_distribution: Record<string, number>;
  repeated_issues: Array<{
    id: string;
    category: string;
    category_label: string;
    meal_type: string;
    count: number;
    sample_comments: string[];
    latest_date: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface CreateMessFeedbackPayload {
  rating: number;
  category: FeedbackCategory;
  comments: string;
  meal_type?: MealType | 'GENERAL';
  meal_date?: string;
}

export interface CreateMessMenuItemPayload {
  day_of_week: string;
  meal_type: MealType;
  items: string;
  timings?: string;
  dietary_info?: string;
  special_note?: string;
  date?: string;
}



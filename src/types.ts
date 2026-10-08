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
  | 'ai-chat'
  | 'fees'
  | 'papers'
  | 'library'
  | 'lost-found'
  | 'events';

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

// ==========================================
// Fees & Dues Module Types
// ==========================================

export type FeeCategory =
  | 'TUITION'
  | 'HOSTEL'
  | 'MESS'
  | 'LIBRARY'
  | 'EXAM'
  | 'LABORATORY'
  | 'OTHER';

export type FeeStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';

export interface FeeRecord {
  id: number;
  student_id: string;
  student_name: string;
  student_identifier: string;
  title: string;
  category: FeeCategory;
  category_label?: string;
  term?: string;
  total_amount: number;
  amount_paid: number;
  outstanding_amount: number;
  due_date: string;
  status: FeeStatus;
  is_overdue?: boolean;
  payment_method?: string;
  transaction_reference?: string;
  paid_at?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StudentFeesSummary {
  total_fees: number;
  amount_paid: number;
  outstanding_amount: number;
  overdue_amount: number;
  status_counts: Record<string, number>;
}

export interface AdminFeesSummary {
  total_assessed: number;
  total_collected: number;
  total_outstanding: number;
  total_overdue: number;
  overdue_count: number;
  status_counts: Record<string, number>;
}

export interface FeesApiResponse {
  success: boolean;
  role: string;
  count: number;
  fees: FeeRecord[];
  summary: StudentFeesSummary | AdminFeesSummary;
  error?: string;
}

export interface CreateFeePayload {
  student_id: string;
  title: string;
  category: FeeCategory;
  term?: string;
  total_amount: number;
  amount_paid?: number;
  due_date: string;
  status?: FeeStatus;
  payment_method?: string;
  transaction_reference?: string;
  notes?: string;
}

export interface UpdateFeePayload {
  title?: string;
  category?: FeeCategory;
  total_amount?: number;
  amount_paid?: number;
  due_date?: string;
  status?: FeeStatus;
  payment_method?: string;
  transaction_reference?: string;
  notes?: string;
}

// ==========================================
// FEATURE 1: PREVIOUS YEAR PAPERS TYPES
// ==========================================

export interface PreviousYearPaper {
  id: number;
  title: string;
  subject: string;
  subject_code?: string | null;
  department: string;
  semester: number;
  semester_display?: string;
  exam_type: 'Mid-Term' | 'End-Term' | 'Supplementary' | 'Model Paper' | string;
  year: number;
  resource_url: string;
  file_size: string;
  download_count: number;
  uploaded_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaperFilterParams {
  search?: string;
  department?: string;
  semester?: string | number;
  subject?: string;
  year?: string | number;
  exam_type?: string;
}

export interface CreatePaperPayload {
  title: string;
  subject: string;
  subject_code?: string;
  department: string;
  semester: number;
  exam_type: string;
  year: number;
  resource_url: string;
  file_size?: string;
}

// ==========================================
// FEATURE 2: LIBRARY BOOKS & ISSUE TYPES
// ==========================================

export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  department?: string;
  edition?: string;
  publisher?: string | null;
  publish_year?: number | null;
  location: string;
  total_copies: number;
  available_copies: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type BookIssueStatus = 'REQUESTED' | 'ISSUED' | 'RETURNED' | 'REJECTED';

export interface BookIssueRecord {
  id: number;
  book_id: number;
  book_title?: string;
  book_author?: string;
  isbn?: string;
  book_category?: string;
  location?: string;
  available_copies?: number;
  total_copies?: number;
  student_id: string;
  student_name: string;
  student_identifier: string;
  request_date: string;
  issue_date?: string | null;
  due_date?: string | null;
  return_date?: string | null;
  status: BookIssueStatus;
  notes?: string | null;
  admin_remarks?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBookPayload {
  title: string;
  author: string;
  isbn: string;
  category: string;
  department?: string;
  edition?: string;
  publisher?: string;
  location?: string;
  total_copies: number;
  available_copies?: number;
  description?: string;
}

// ==========================================
// FEATURE 3: LIBRARY CARD & RENEWAL TYPES
// ==========================================

export interface LibraryCard {
  id: number;
  student_id: string;
  student_name: string;
  student_identifier: string;
  card_number: string;
  issue_date: string;
  valid_until: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  is_expired?: boolean;
  days_remaining?: number;
  created_at?: string;
  updated_at?: string;
}

export type CardRenewalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RENEWED';

export interface LibraryCardRenewal {
  id: number;
  student_id: string;
  student_name: string;
  student_identifier: string;
  current_expiry_date: string;
  requested_extension_months: number;
  reason?: string | null;
  status: CardRenewalStatus;
  new_expiry_date?: string | null;
  admin_notes?: string | null;
  processed_by?: string | null;
  processed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// Lost & Found (Feature 1)
// ==========================================

export type NoticeType = 'LOST' | 'FOUND';
export type LostFoundStatus = 'ACTIVE' | 'CLAIMED' | 'RESOLVED' | 'CLOSED';

export interface LostFoundActivity {
  id: number;
  item_id: number;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  old_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface LostFoundItem {
  id: number;
  public_id: string;
  notice_type: NoticeType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  item_date: string;
  contact_info: string;
  image_url?: string | null;
  student_id: string;
  student_name: string;
  student_identifier: string;
  status: LostFoundStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  activities?: LostFoundActivity[];
}

export interface CreateLostFoundPayload {
  notice_type: NoticeType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  item_date: string;
  contact_info: string;
  image_url?: string;
}

// ==========================================
// Event Conduction Application (Feature 2)
// ==========================================

export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface EventApplicationActivity {
  id: number;
  application_id: number;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  old_status?: string | null;
  new_status?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface EventApplication {
  id: number;
  application_no: string;
  student_id: string;
  student_name: string;
  student_identifier: string;
  department?: string | null;
  event_name: string;
  event_type: string;
  description: string;
  proposed_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  expected_participants: number;
  organizing_body: string;
  faculty_coordinator: string;
  additional_requirements?: string | null;
  status: EventStatus;
  admin_remarks?: string | null;
  approved_venue?: string | null;
  processed_by?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
  activities?: EventApplicationActivity[];
}

export interface CreateEventApplicationPayload {
  event_name: string;
  event_type: string;
  description: string;
  proposed_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  expected_participants: number;
  organizing_body: string;
  faculty_coordinator: string;
  additional_requirements?: string;
  department?: string;
}





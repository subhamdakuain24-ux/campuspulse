import {
  UserProfile,
  UserRole,
  AuthUser,
  AttendanceSubject,
  TodayClass,
  ExamItem,
  AssignmentItem,
  NotificationItem,
  TimetableSlot,
} from '../types';
import {
  initialUserProfile,
  attendanceSubjects,
  todayClasses,
  upcomingExams,
  initialAssignments,
  initialNotifications,
  timetableSchedule,
} from '../data/mockData';

const getApiBaseUrl = (): string => {
  try {
    const metaEnv = (import.meta as any)?.env?.VITE_API_URL;
    if (metaEnv && typeof metaEnv === 'string' && metaEnv.trim().length > 0) {
      return metaEnv.replace(/\/+$/, '') + '/api';
    }
  } catch {
    // fallback to relative proxy
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// ==========================================
// Raw Backend Types
// ==========================================

export interface BackendStudentData {
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  department: string;
  semester: number;
  term: string;
  academic_year: string;
  avatar_url: string;
  campus_address: string;
  gpa: number;
  gpa_change: string;
  credits_earned: number;
  credits_total: number;
  enrolled_year: number;
  graduation_year: number;
  overall_attendance_pct: number;
}

export interface BackendAttendanceSubject {
  attended_classes: number;
  code: string;
  color: string;
  credits: number;
  instructor: string;
  instructor_avatar?: string;
  name: string;
  percentage: number;
  status: string; // 'Safe' | 'Warning' | 'Shortage'
  subject_id: string;
  total_classes: number;
}

export interface BackendAttendanceLog {
  id: number;
  date: string;
  status: string;
  subject_code: string;
  subject_name: string;
  topic: string;
}

export interface BackendAttendanceResponse {
  success: boolean;
  overallPercentage: number;
  threshold: number;
  subjects: BackendAttendanceSubject[];
  recentLogs: BackendAttendanceLog[];
}

export interface BackendExamItem {
  id: string;
  name: string;
  exam_type: string;
  exam_date: string;
  display_date: string;
  time_range: string;
  room: string;
  seat_number: string;
  status: string;
  prep_percentage: number;
  format_description: string;
  total_marks: number;
  subject_code: string;
  subject_name: string;
  subject_color: string;
}

export interface BackendExamsResponse {
  success: boolean;
  count: number;
  exams: BackendExamItem[];
}

export interface BackendTimetableItem {
  id: number;
  day_of_week: string; // "Monday", "Tuesday", etc.
  day_index: number;
  start_time: string; // "09:00"
  end_time: string; // "10:30"
  time_display: string; // "09:00 - 10:30 AM"
  type: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
  room: string;
  is_in_progress: number | boolean;
  subject_code: string;
  subject_name: string;
  instructor: string;
  subject_color: string;
}

export interface BackendTimetableResponse {
  success: boolean;
  schedule: BackendTimetableItem[];
  groupedByDay: Record<string, BackendTimetableItem[]>;
}

export interface BackendAssignmentItem {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time_display: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'submitted' | 'completed' | 'draft';
  submitted_date?: string | null;
  grade?: string | null;
  score?: number | null;
  total_points?: number;
  subject_code: string;
  subject_name: string;
  subject_color?: string;
}

export interface BackendAssignmentsResponse {
  success: boolean;
  total: number;
  pendingCount: number;
  completedCount: number;
  assignments: BackendAssignmentItem[];
  pending: BackendAssignmentItem[];
  completed: BackendAssignmentItem[];
}

export interface BackendNotificationItem {
  id: string;
  title: string;
  description: string;
  category: string;
  badge_type: string;
  badge_label: string;
  time_ago: string;
  unread: number | boolean;
  action_button_text?: string | null;
  action_button_type?: string | null;
  created_at: string;
}

export interface BackendNotificationsResponse {
  success: boolean;
  unreadCount: number;
  notifications: BackendNotificationItem[];
}

// ==========================================
// Screen Data Wrapper Types
// ==========================================

export interface DashboardApiData {
  student: UserProfile;
  overallAttendance: number;
  subjectBreakdown: AttendanceSubject[];
  todaySchedule: TodayClass[];
  nextExam?: ExamItem;
  pendingAssignments: AssignmentItem[];
  isLiveApi: boolean;
  rawBackend?: BackendStudentData;
}

export interface AttendanceScreenData {
  overallPercentage: number;
  threshold: number;
  totalClasses: number;
  totalAttended: number;
  totalAbsent: number;
  subjects: AttendanceSubject[];
  recentLogs: BackendAttendanceLog[];
  isLiveApi: boolean;
}

export interface ExamsScreenData {
  exams: ExamItem[];
  rawExams: BackendExamItem[];
  nextExam?: ExamItem;
  isLiveApi: boolean;
}

export interface TimetableScreenData {
  todaySchedule: Array<{
    time: string;
    courseCode: string;
    courseName: string;
    faculty: string;
    room: string;
    type: string;
    status?: string;
  }>;
  matrix: TimetableSlot[];
  groupedByDay: Record<string, BackendTimetableItem[]>;
  rawSchedule: BackendTimetableItem[];
  isLiveApi: boolean;
}

export interface AssignmentsScreenData {
  total: number;
  pendingCount: number;
  completedCount: number;
  assignments: AssignmentItem[];
  rawAssignments: BackendAssignmentItem[];
  isLiveApi: boolean;
}

export interface NotificationsScreenData {
  unreadCount: number;
  notifications: NotificationItem[];
  rawNotifications: BackendNotificationItem[];
  isLiveApi: boolean;
}

// ==========================================
// Adapters & Mappers
// ==========================================

export function mapBackendStudentToUserProfile(b: BackendStudentData): UserProfile {
  return {
    name: b.name || initialUserProfile.name,
    studentId: b.student_id || initialUserProfile.studentId,
    program: b.program || initialUserProfile.program,
    semester: `${b.semester}th`,
    term: b.term || initialUserProfile.term,
    date: initialUserProfile.date,
    email: b.email || initialUserProfile.email,
    phone: b.phone || initialUserProfile.phone,
    campusAddress: b.campus_address || initialUserProfile.campusAddress,
    gpa: b.gpa || initialUserProfile.gpa,
    gpaChange: b.gpa_change || initialUserProfile.gpaChange,
    creditsEarned: b.credits_earned || initialUserProfile.creditsEarned,
    creditsTotal: b.credits_total || initialUserProfile.creditsTotal,
    enrolledYear: b.enrolled_year || initialUserProfile.enrolledYear,
    graduationYear: b.graduation_year || initialUserProfile.graduationYear,
    avatarUrl: b.avatar_url || initialUserProfile.avatarUrl,
    role: 'Student',
    preferences: initialUserProfile.preferences,
  };
}

export function mapBackendAttendanceSubjects(items: BackendAttendanceSubject[]): AttendanceSubject[] {
  return items.map((sub, idx) => {
    const rawStatus = (sub.status || '').toLowerCase();
    const status: 'safe' | 'warning' | 'shortage' =
      rawStatus === 'warning' ? 'warning' : rawStatus === 'shortage' ? 'shortage' : 'safe';

    let badgeText = 'Safe';
    if (status === 'warning') {
      const needed = Math.max(1, Math.ceil((0.75 * sub.total_classes - sub.attended_classes) / 0.25));
      badgeText = `Attend next ${needed} class${needed > 1 ? 'es' : ''}`;
    } else if (status === 'shortage') {
      badgeText = 'Shortage Warning';
    }

    return {
      id: sub.subject_id || `att-${idx}`,
      code: sub.code,
      name: sub.name,
      shortName: sub.name.split('&')[0].trim(),
      faculty: sub.instructor,
      attended: sub.attended_classes,
      total: sub.total_classes,
      percentage: Math.round(sub.percentage),
      status,
      badgeText,
      color: sub.color || (status === 'safe' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#EF4444'),
    };
  });
}

export function mapBackendExams(items: BackendExamItem[]): ExamItem[] {
  return items.map((ex, idx) => {
    const isNext = idx === 0;
    const statusMap: Record<string, 'Scheduled' | 'TBC' | 'Completed'> = {
      upcoming: 'Scheduled',
      scheduled: 'Scheduled',
      tbc: 'TBC',
      completed: 'Completed',
    };
    const status = statusMap[ex.status.toLowerCase()] || 'Scheduled';

    return {
      id: ex.id,
      code: ex.subject_code,
      name: ex.subject_name || ex.name,
      date: `${ex.exam_date}T10:00:00`,
      displayDate: ex.display_date,
      timeRange: ex.time_range,
      room: ex.room,
      status,
      syllabusPercent: ex.prep_percentage,
      isNext,
    };
  });
}

export function mapBackendTimetableToState(data: BackendTimetableResponse): {
  todaySchedule: Array<{
    time: string;
    courseCode: string;
    courseName: string;
    faculty: string;
    room: string;
    type: string;
    status?: string;
  }>;
  matrix: TimetableSlot[];
} {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
  const dayKeyMap: Record<string, 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'> = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
  };

  // 1. Map Matrix Slots
  const matrix: TimetableSlot[] = (data.schedule || []).map((item) => {
    const day = dayKeyMap[item.day_of_week] || 'Mon';
    const colorTheme: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' =
      item.type === 'Lab'
        ? 'emerald'
        : item.type === 'Tutorial'
        ? 'purple'
        : item.subject_code.includes('MATH')
        ? 'amber'
        : 'blue';

    return {
      id: `tt-${item.id}`,
      day,
      startTime: item.start_time,
      endTime: item.end_time,
      courseCode: item.subject_code,
      courseName: item.subject_name,
      faculty: item.instructor,
      room: item.room,
      type: item.type === 'Lab' ? 'Lab' : item.type === 'Seminar' ? 'Seminar' : 'Lecture',
      colorTheme,
    };
  });

  // 2. Map Today Schedule (defaults to Tuesday to match mock timetable context)
  const tuesdayClasses = data.groupedByDay?.['Tuesday'] || [];
  const todaySchedule = tuesdayClasses.map((item) => {
    return {
      time: item.time_display.split('-')[0].trim() || `${item.start_time} AM`,
      courseCode: item.subject_code,
      courseName: item.subject_name,
      faculty: item.instructor,
      room: item.room,
      type: item.type,
      status: item.is_in_progress ? 'In Progress' : undefined,
    };
  });

  return {
    todaySchedule: todaySchedule.length > 0 ? todaySchedule : timetableSchedule.todaySchedule,
    matrix: matrix.length > 0 ? matrix : timetableSchedule.matrix,
  };
}

export function mapBackendAssignments(items: BackendAssignmentItem[]): AssignmentItem[] {
  return items.map((a) => {
    const rawPriority = (a.priority || '').toLowerCase();
    const priority: 'HIGH' | 'MEDIUM' | 'LOW' =
      rawPriority === 'high' ? 'HIGH' : rawPriority === 'medium' ? 'MEDIUM' : 'LOW';

    const rawStatus = (a.status || '').toLowerCase();
    const status: 'pending' | 'draft' | 'completed' =
      rawStatus === 'completed' || rawStatus === 'submitted'
        ? 'completed'
        : rawStatus === 'draft'
        ? 'draft'
        : 'pending';

    const isUrgentToday =
      a.due_time_display?.toLowerCase().includes('today') ||
      a.due_time_display?.toLowerCase().includes('14 hours') ||
      priority === 'HIGH';

    const actionText =
      status === 'completed'
        ? 'View Submission'
        : priority === 'HIGH'
        ? 'Submit Work'
        : priority === 'MEDIUM'
        ? 'Continue Draft'
        : 'Start Assignment';

    let formattedGrade: string | undefined = a.grade || undefined;
    if (!formattedGrade && a.score !== null && a.score !== undefined) {
      formattedGrade = `${a.score}/${a.total_points || 100}`;
    }

    return {
      id: a.id,
      title: a.title,
      courseCode: a.subject_code,
      courseName: a.subject_name,
      priority,
      dueDateText: a.due_time_display || 'Due soon',
      dueDateTime: a.due_date,
      isUrgentToday,
      status,
      grade: formattedGrade,
      submittedDate: a.submitted_date || (status === 'completed' ? 'Oct 19, 2023' : undefined),
      actionText,
    };
  });
}

export function mapBackendNotifications(items: BackendNotificationItem[]): NotificationItem[] {
  return items.map((n) => {
    const rawCategory = (n.category || '').toLowerCase();
    const category: 'alerts' | 'exams' | 'academic' | 'campus' | 'system' =
      rawCategory === 'alerts'
        ? 'alerts'
        : rawCategory === 'exams'
        ? 'exams'
        : rawCategory === 'academic'
        ? 'academic'
        : rawCategory === 'campus'
        ? 'campus'
        : 'system';

    const rawBadge = (n.badge_type || '').toLowerCase();
    const badgeType: 'urgent' | 'assignment' | 'campus' | 'system' | 'exam' =
      rawBadge === 'urgent'
        ? 'urgent'
        : rawBadge === 'assignment'
        ? 'assignment'
        : rawBadge === 'campus'
        ? 'campus'
        : rawBadge === 'exam'
        ? 'exam'
        : 'system';

    const actionButtonType: 'danger' | 'primary' | 'outline' =
      badgeType === 'urgent' ? 'danger' : 'primary';

    return {
      id: n.id,
      category,
      badgeLabel: n.badge_label || (badgeType === 'urgent' ? 'URGENT' : 'NOTICE'),
      badgeType,
      timeAgo: n.time_ago || 'Recent',
      title: n.title,
      description: n.description,
      unread: Boolean(n.unread),
      actionButtonText: n.action_button_text || undefined,
      actionButtonType: n.action_button_text ? actionButtonType : undefined,
    };
  });
}

export function mapBackendUserToUserProfile(user: AuthUser, student?: BackendStudentData): UserProfile {
  const rawRole = (user.role || '').toLowerCase();
  const normalizedRole: UserRole =
    rawRole === 'teacher'
      ? 'Teacher'
      : rawRole === 'admin'
      ? 'Admin'
      : 'Student';

  if (normalizedRole === 'Student' && student) {
    return mapBackendStudentToUserProfile(student);
  }

  return {
    name: user.name || (normalizedRole === 'Teacher' ? 'Prof. Sarah Jenkins' : 'Dr. Marcus Carter'),
    studentId: user.identifier || (normalizedRole === 'Teacher' ? 'FAC-4019' : 'ADM-9901'),
    program: normalizedRole === 'Teacher' ? (user.department || 'Department of Computer Science') : (user.department || 'Campus Operations & IT Administration'),
    semester: normalizedRole === 'Teacher' ? 'Faculty Lead' : 'Administration',
    term: 'Fall 2023',
    date: initialUserProfile.date,
    email: user.email || (normalizedRole === 'Teacher' ? 'sarah.jenkins@university.edu' : 'admin.carter@university.edu'),
    phone: user.phone || (normalizedRole === 'Teacher' ? '+1 (555) 392-8819' : '+1 (555) 901-4422'),
    campusAddress: user.department || 'Academic Faculty Complex',
    gpa: normalizedRole === 'Student' ? 3.84 : 4.0,
    gpaChange: 'Active Term',
    creditsEarned: normalizedRole === 'Teacher' ? 120 : 0,
    creditsTotal: 160,
    enrolledYear: 2020,
    graduationYear: 2024,
    avatarUrl: user.avatar_url || (normalizedRole === 'Teacher'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    role: normalizedRole,
    preferences: initialUserProfile.preferences,
  };
}

export interface AuthLoginResponse {
  success: boolean;
  message: string;
  token: string;
  expires_at: string;
  user: AuthUser;
  student?: BackendStudentData;
}

export interface AuthMeResponse {
  success: boolean;
  authenticated: boolean;
  user: AuthUser;
  student?: BackendStudentData;
}

const AUTH_TOKEN_KEY = 'campuspulse_auth_token';
const AUTH_USER_KEY = 'campuspulse_auth_user';
const AUTH_STUDENT_KEY = 'campuspulse_auth_student';

// ==========================================
// ApiService Class
// ==========================================

class ApiService {
  private baseUrl: string = API_BASE_URL;
  private token: string | null = null;

  constructor() {
    try {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getToken(): string | null {
    if (!this.token) {
      try {
        this.token = localStorage.getItem(AUTH_TOKEN_KEY);
      } catch {
        this.token = null;
      }
    }
    return this.token;
  }

  public setToken(token: string | null): void {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // storage unavailable
    }
  }

  public getStoredStudent(): BackendStudentData | null {
    try {
      const data = localStorage.getItem(AUTH_STUDENT_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setStoredStudent(student: BackendStudentData | null): void {
    try {
      if (student) {
        localStorage.setItem(AUTH_STUDENT_KEY, JSON.stringify(student));
      } else {
        localStorage.removeItem(AUTH_STUDENT_KEY);
      }
    } catch {
      // storage unavailable
    }
  }

  public isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      throw new Error('Backend service unavailable. Please ensure server is running.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (response.status === 401) {
          // Specific friendly message for authentication
          errorMessage = errorData?.error || 'Invalid ID/email or password';
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        if (response.status === 401) {
          errorMessage = 'Invalid ID/email or password';
        }
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  }

  public getStoredUser(): AuthUser | null {
    try {
      const data = localStorage.getItem(AUTH_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setStoredUser(user: AuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch {
      // storage unavailable
    }
  }

  /**
   * Universal Login for Student, Teacher, and Admin
   */
  async login(
    identifier: string,
    password: string,
    remember: boolean = true
  ): Promise<{
    success: boolean;
    token: string;
    expires_at: string;
    user: AuthUser;
    role: UserRole;
    student?: BackendStudentData;
    profile: UserProfile;
  }> {
    if (!identifier.trim() || !password.trim()) {
      throw new Error('Please enter both ID/email and password.');
    }

    try {
      const res = await this.fetchJson<AuthLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      if (!res || !res.token) {
        throw new Error('Unexpected response received from authentication server.');
      }

      if (remember) {
        this.setToken(res.token);
        this.setStoredUser(res.user);
        if (res.student) {
          this.setStoredStudent(res.student);
        } else {
          this.setStoredStudent(null);
        }
      } else {
        this.token = res.token;
      }

      const profile = mapBackendUserToUserProfile(res.user, res.student);
      const role = profile.role;

      return {
        success: true,
        token: res.token,
        expires_at: res.expires_at,
        user: res.user,
        role,
        student: res.student,
        profile,
      };
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        throw new Error('Backend service unavailable. Please check your connection.');
      }
      // Re-throw formatted error
      throw err;
    }
  }

  /**
   * Retrieve Current Authenticated User via /api/auth/me
   */
  async getAuthMe(): Promise<{
    authenticated: boolean;
    user: AuthUser;
    role: UserRole;
    student?: BackendStudentData;
    profile: UserProfile;
  } | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await this.fetchJson<AuthMeResponse>('/auth/me');
      if (res && res.authenticated && res.user) {
        this.setStoredUser(res.user);
        if (res.student) {
          this.setStoredStudent(res.student);
        }
        const profile = mapBackendUserToUserProfile(res.user, res.student);
        return {
          authenticated: true,
          user: res.user,
          role: profile.role,
          student: res.student,
          profile,
        };
      }
      return null;
    } catch (err) {
      console.warn('[ApiService] Session verification failed or expired:', err);
      this.setToken(null);
      this.setStoredUser(null);
      this.setStoredStudent(null);
      return null;
    }
  }

  /**
   * Universal Logout via /api/auth/logout
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      if (token) {
        await this.fetchJson<{ success: boolean; message: string }>('/auth/logout', {
          method: 'POST',
        });
      }
    } catch (err) {
      console.warn('[ApiService] Logout API call encountered error:', err);
    } finally {
      this.setToken(null);
      this.setStoredUser(null);
      this.setStoredStudent(null);
    }
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Health Check
   */
  async checkHealth(): Promise<{ status: string; service: string; version: string; engine?: string }> {
    return this.fetchJson('/health');
  }

  /**
   * Fetch student profile by ID
   */
  async getStudent(id: string = '1'): Promise<{ success: boolean; data: BackendStudentData }> {
    return this.fetchJson<{ success: boolean; data: BackendStudentData }>(`/students/${id}`);
  }

  /**
   * Fetch complete Dashboard data with graceful fallback
   */
  async getDashboardData(studentId: string = '1'): Promise<DashboardApiData> {
    try {
      const studentRes = await this.getStudent(studentId);
      const studentProfile = mapBackendStudentToUserProfile(studentRes.data);

      return {
        student: studentProfile,
        overallAttendance: Math.round(studentRes.data.overall_attendance_pct || 82),
        subjectBreakdown: attendanceSubjects,
        todaySchedule: todayClasses,
        nextExam: upcomingExams[0],
        pendingAssignments: initialAssignments.filter((a) => a.status === 'pending'),
        isLiveApi: true,
        rawBackend: studentRes.data,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live student data, utilizing local fallback:', err);
      return {
        student: initialUserProfile,
        overallAttendance: 82,
        subjectBreakdown: attendanceSubjects,
        todaySchedule: todayClasses,
        nextExam: upcomingExams[0],
        pendingAssignments: initialAssignments.filter((a) => a.status === 'pending'),
        isLiveApi: false,
      };
    }
  }

  /**
   * Fetch Student Attendance
   */
  async getStudentAttendance(studentId: string = '1'): Promise<AttendanceScreenData> {
    try {
      const res = await this.fetchJson<BackendAttendanceResponse>(`/students/${studentId}/attendance`);
      const mappedSubjects = mapBackendAttendanceSubjects(res.subjects || []);
      const totalClasses = mappedSubjects.reduce((acc, s) => acc + s.total, 0);
      const totalAttended = mappedSubjects.reduce((acc, s) => acc + s.attended, 0);
      const totalAbsent = totalClasses - totalAttended;
      const overallPercentage =
        res.overallPercentage ?? Math.round((totalAttended / (totalClasses || 1)) * 100);

      return {
        overallPercentage: Math.round(overallPercentage),
        threshold: res.threshold || 75,
        totalClasses,
        totalAttended,
        totalAbsent,
        subjects: mappedSubjects,
        recentLogs: res.recentLogs || [],
        isLiveApi: true,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live attendance data, utilizing local fallback:', err);
      const totalClasses = attendanceSubjects.reduce((acc, s) => acc + s.total, 0);
      const totalAttended = attendanceSubjects.reduce((acc, s) => acc + s.attended, 0);
      return {
        overallPercentage: 82,
        threshold: 75,
        totalClasses,
        totalAttended,
        totalAbsent: totalClasses - totalAttended,
        subjects: attendanceSubjects,
        recentLogs: [],
        isLiveApi: false,
      };
    }
  }

  /**
   * Fetch Student Exams
   */
  async getStudentExams(studentId: string = '1'): Promise<ExamsScreenData> {
    try {
      const res = await this.fetchJson<BackendExamsResponse>(`/students/${studentId}/exams`);
      const mapped = mapBackendExams(res.exams || []);
      return {
        exams: mapped.length > 0 ? mapped : upcomingExams,
        rawExams: res.exams || [],
        nextExam: mapped[0] || upcomingExams[0],
        isLiveApi: true,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live exams data, utilizing local fallback:', err);
      return {
        exams: upcomingExams,
        rawExams: [],
        nextExam: upcomingExams[0],
        isLiveApi: false,
      };
    }
  }

  /**
   * Fetch Student Timetable
   */
  async getStudentTimetable(studentId: string = '1'): Promise<TimetableScreenData> {
    try {
      const res = await this.fetchJson<BackendTimetableResponse>(`/students/${studentId}/timetable`);
      const mapped = mapBackendTimetableToState(res);

      return {
        todaySchedule: mapped.todaySchedule,
        matrix: mapped.matrix,
        groupedByDay: res.groupedByDay || {},
        rawSchedule: res.schedule || [],
        isLiveApi: true,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live timetable data, utilizing local fallback:', err);
      return {
        todaySchedule: timetableSchedule.todaySchedule,
        matrix: timetableSchedule.matrix,
        groupedByDay: {},
        rawSchedule: [],
        isLiveApi: false,
      };
    }
  }

  /**
   * Fetch Student Assignments
   */
  async getStudentAssignments(studentId: string = '1'): Promise<AssignmentsScreenData> {
    try {
      const res = await this.fetchJson<BackendAssignmentsResponse>(`/students/${studentId}/assignments`);
      const mapped = mapBackendAssignments(res.assignments || []);
      const pendingCount = mapped.filter((a) => a.status === 'pending' || a.status === 'draft').length;
      const completedCount = mapped.filter((a) => a.status === 'completed').length;

      return {
        total: mapped.length,
        pendingCount,
        completedCount,
        assignments: mapped.length > 0 ? mapped : initialAssignments,
        rawAssignments: res.assignments || [],
        isLiveApi: true,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live assignments data, utilizing local fallback:', err);
      const pendingCount = initialAssignments.filter((a) => a.status === 'pending' || a.status === 'draft').length;
      const completedCount = initialAssignments.filter((a) => a.status === 'completed').length;

      return {
        total: initialAssignments.length,
        pendingCount,
        completedCount,
        assignments: initialAssignments,
        rawAssignments: [],
        isLiveApi: false,
      };
    }
  }

  /**
   * Submit an Assignment
   */
  async submitAssignment(
    studentId: string = '1',
    assignmentId: string,
    payload?: { notes?: string; fileName?: string }
  ): Promise<{ success: boolean; assignment?: AssignmentItem }> {
    try {
      const res = await this.fetchJson<{ success: boolean; message: string; assignment: BackendAssignmentItem }>(
        `/students/${studentId}/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify(payload || {}),
        }
      );
      const mapped = res.assignment ? mapBackendAssignments([res.assignment])[0] : undefined;
      return {
        success: res.success,
        assignment: mapped,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to submit assignment via API, falling back locally:', err);
      return {
        success: true,
      };
    }
  }

  /**
   * Fetch Student Notifications
   */
  async getStudentNotifications(studentId: string = '1'): Promise<NotificationsScreenData> {
    try {
      const res = await this.fetchJson<BackendNotificationsResponse>(`/students/${studentId}/notifications`);
      const mapped = mapBackendNotifications(res.notifications || []);
      const unreadCount = mapped.filter((n) => n.unread).length;

      return {
        unreadCount,
        notifications: mapped.length > 0 ? mapped : initialNotifications,
        rawNotifications: res.notifications || [],
        isLiveApi: true,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to fetch live notifications data, utilizing local fallback:', err);
      const unreadCount = initialNotifications.filter((n) => n.unread).length;
      return {
        unreadCount,
        notifications: initialNotifications,
        rawNotifications: [],
        isLiveApi: false,
      };
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationRead(studentId: string = '1', notificationId: string): Promise<{ success: boolean }> {
    try {
      const res = await this.fetchJson<{ success: boolean }>(
        `/students/${studentId}/notifications/${notificationId}/read`,
        {
          method: 'POST',
        }
      );
      return { success: res.success };
    } catch (err) {
      console.warn('[ApiService] Failed to mark notification read via API:', err);
      return { success: true };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(studentId: string = '1'): Promise<{ success: boolean }> {
    try {
      const res = await this.fetchJson<{ success: boolean }>(
        `/students/${studentId}/notifications/mark-all-read`,
        {
          method: 'POST',
        }
      );
      return { success: res.success };
    } catch (err) {
      console.warn('[ApiService] Failed to mark all notifications read via API:', err);
      return { success: true };
    }
  }

  /**
   * Update Student Profile
   */
  async updateStudentProfile(
    studentId: string = '1',
    updateData: Partial<UserProfile>
  ): Promise<{ success: boolean; data?: UserProfile }> {
    try {
      const res = await this.fetchJson<{ success: boolean; data: BackendStudentData }>(
        `/students/${studentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            email: updateData.email,
            phone: updateData.phone,
            campus_address: updateData.campusAddress,
            name: updateData.name,
          }),
        }
      );
      const mapped = res.data ? mapBackendStudentToUserProfile(res.data) : undefined;
      return {
        success: res.success,
        data: mapped,
      };
    } catch (err) {
      console.warn('[ApiService] Failed to update student profile via API:', err);
      return {
        success: true,
      };
    }
  }
}

export const api = new ApiService();

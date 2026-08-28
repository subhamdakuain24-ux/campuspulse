import { UserProfile, AttendanceSubject, TodayClass, ExamItem, AssignmentItem, TimetableSlot } from '../types';
import {
  initialUserProfile,
  attendanceSubjects,
  todayClasses,
  upcomingExams,
  initialAssignments,
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

// ==========================================
// ApiService Class
// ==========================================

class ApiService {
  private baseUrl: string = API_BASE_URL;

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) errorMessage = errorData.error;
        else if (errorData?.message) errorMessage = errorData.message;
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
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
}

export const api = new ApiService();

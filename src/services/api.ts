import { UserProfile, AttendanceSubject, TodayClass, ExamItem, AssignmentItem } from '../types';
import { initialUserProfile, attendanceSubjects, todayClasses, upcomingExams, initialAssignments } from '../data/mockData';

const getApiBaseUrl = (): string => {
  try {
    const metaEnv = (import.meta as any)?.env?.VITE_API_URL;
    if (metaEnv && typeof metaEnv === 'string') {
      return metaEnv.replace(/\/+$/, '') + '/api';
    }
  } catch {
    // fallback to relative proxy
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

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

/**
 * Helper to convert raw backend student record to frontend UserProfile format
 */
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
        'Accept': 'application/json',
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
}

export const api = new ApiService();

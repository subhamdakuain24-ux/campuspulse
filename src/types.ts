export type ScreenId =
  | 'login'
  | 'dashboard'
  | 'attendance'
  | 'exams'
  | 'timetable'
  | 'assignments'
  | 'notifications'
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

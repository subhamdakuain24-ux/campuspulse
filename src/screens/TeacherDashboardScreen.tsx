import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  CalendarDays,
  Clock,
  UserCheck,
  FileText,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Building2,
  Bell,
  GraduationCap,
} from 'lucide-react';
import { ScreenId, UserProfile } from '../types';

interface TeacherDashboardScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenId) => void;
}

export const TeacherDashboardScreen: React.FC<TeacherDashboardScreenProps> = ({ user, onNavigate }) => {
  // Today's classes taught by faculty
  const todayClasses = [
    {
      id: '1',
      code: 'CS301',
      name: 'Data Structures & Algorithms',
      time: '10:00 AM - 11:30 AM',
      room: 'Lecture Hall 402',
      enrolled: 48,
      status: 'upcoming',
      type: 'Lecture',
    },
    {
      id: '2',
      code: 'CS304',
      name: 'Database Management Systems',
      time: '02:00 PM - 03:30 PM',
      room: 'Computer Lab 3',
      enrolled: 45,
      status: 'scheduled',
      type: 'Lab Practical',
    },
    {
      id: '3',
      code: 'CS312',
      name: 'Software Engineering',
      time: '04:00 PM - 05:00 PM',
      room: 'Room 301, CS Wing',
      enrolled: 47,
      status: 'scheduled',
      type: 'Lecture',
    },
  ];

  const pendingGrading = [
    {
      id: '1',
      title: 'Graph Traversal & BFS/DFS Implementation',
      course: 'CS301',
      submittedCount: 42,
      totalCount: 48,
      due: 'Yesterday',
    },
    {
      id: '2',
      title: 'SQL Normalization & Indexing Assignment',
      course: 'CS304',
      submittedCount: 38,
      totalCount: 45,
      due: 'Oct 09',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner: Teacher Greeting & Faculty Status */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-emerald-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Faculty Dashboard
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                Fall Semester 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user.name}
            </h1>
            <p className="text-sm text-emerald-100/90 max-w-2xl">
              {user.program || 'Department of Computer Science'} • 3 Active Courses • 140 Enrolled Students
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              onClick={() => onNavigate('timetable')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              Teaching Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Quick Metric Cards for Faculty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Lectures Today */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('timetable')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-emerald-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lectures Today</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">3 Classes</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Next lecture starts at 10:00 AM (Room 402)</p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
            <span>View Schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Metric 2: Average Course Attendance */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-blue-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">86.2%</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> On Track
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Average across CS301, CS304, CS312</p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>Class Roster</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Metric 3: Pending Grading */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('assignments')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-amber-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Grading</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">14 Submissions</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">2 assignments awaiting evaluation</p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-amber-600 font-semibold">
            <span>Grade Coursework</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Metric 4: Mid-Term Assessments */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('exams')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-purple-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exams Scheduled</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">2 Mid-Terms</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">CS301 on Oct 12 • Room 402</p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold">
            <span>Exam Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>
      </div>

      {/* Row 2: Today's Teaching Schedule & Grading Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Today's Lectures Schedule (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  Today's Teaching Schedule
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled lectures and laboratory sessions for today
                </p>
              </div>
              <button
                onClick={() => onNavigate('timetable')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
              >
                Full Timetable <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {cls.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{cls.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {cls.time}
                      </span>
                      <span>•</span>
                      <span>{cls.room}</span>
                      <span>•</span>
                      <span>{cls.enrolled} Students</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('attendance')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Attendance
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>All sessions synchronized with university academic calendar</span>
            <button
              onClick={() => onNavigate('timetable')}
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              Manage Timetable
            </button>
          </div>
        </div>

        {/* Right: Submissions & Coursework Evaluation (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  Coursework & Grading
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recent student assignment submissions to grade
                </p>
              </div>
            </div>

            <div className="space-y-3.5 mt-4">
              {pendingGrading.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold">
                      {item.course}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {item.submittedCount} of {item.totalCount} submitted
                    </span>
                    <span className="font-semibold text-amber-600">Due: {item.due}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(item.submittedCount / item.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('assignments')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Open Assignments & Grading
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Faculty Quick Shortcuts */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Faculty Shortcuts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('attendance')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all text-left cursor-pointer"
          >
            <UserCheck className="w-5 h-5 text-emerald-600 mb-2" />
            <span className="block text-xs font-bold text-slate-900">Attendance Tracker</span>
            <span className="text-[11px] text-slate-500">Mark & view rosters</span>
          </button>
          <button
            onClick={() => onNavigate('timetable')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-teal-50/80 border border-slate-100 hover:border-teal-200 transition-all text-left cursor-pointer"
          >
            <CalendarDays className="w-5 h-5 text-teal-600 mb-2" />
            <span className="block text-xs font-bold text-slate-900">Weekly Timetable</span>
            <span className="text-[11px] text-slate-500">Teaching hours</span>
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all text-left cursor-pointer"
          >
            <FileText className="w-5 h-5 text-amber-600 mb-2" />
            <span className="block text-xs font-bold text-slate-900">Assignments</span>
            <span className="text-[11px] text-slate-500">Student submissions</span>
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-100 hover:border-purple-200 transition-all text-left cursor-pointer"
          >
            <Bell className="w-5 h-5 text-purple-600 mb-2" />
            <span className="block text-xs font-bold text-slate-900">Post Notice</span>
            <span className="text-[11px] text-slate-500">Broadcast to class</span>
          </button>
        </div>
      </div>
    </div>
  );
};

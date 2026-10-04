import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Clock,
  BookOpen,
  Monitor,
  Code2,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Server,
  Building2,
  Wrench,
  FileCheck2,
  DoorOpen,
} from 'lucide-react';
import { ScreenId } from '../types';
import { api, DashboardApiData } from '../services/api';
import { initialUserProfile, attendanceSubjects, todayClasses, upcomingExams, initialAssignments } from '../data/mockData';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardApiData>({
    student: initialUserProfile,
    overallAttendance: 82,
    subjectBreakdown: attendanceSubjects,
    todaySchedule: todayClasses,
    nextExam: upcomingExams[0],
    pendingAssignments: initialAssignments.filter((a) => a.status === 'pending'),
    isLiveApi: false,
  });

  // Live ticker for next exam
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 4,
    minutes: 12,
    seconds: 45,
  });

  const loadData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await api.getDashboardData('1');
      setDashboardData(data);
      if (!data.isLiveApi) {
        setApiError('Connected in local mode. Flask backend fallback active.');
      }
    } catch (err: any) {
      console.error('[DashboardScreen] Failed to load dashboard:', err);
      setApiError(err?.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const attendancePct = dashboardData.overallAttendance || 82;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - attendancePct / 100);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-1">
          <div className="h-6 w-48 bg-slate-200/70 rounded-md animate-pulse" />
          <div className="h-6 w-24 bg-slate-200/70 rounded-full animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-3 bg-white rounded-2xl p-6 border border-slate-100 h-80 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 mx-auto" />
            <div className="h-4 w-32 bg-slate-100 rounded mx-auto" />
          </div>

          <div className="md:col-span-5 bg-blue-600/90 rounded-2xl p-6 h-80 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="space-y-3">
              <div className="h-3 w-20 bg-blue-400/50 rounded" />
              <div className="h-6 w-3/4 bg-blue-400/60 rounded" />
              <div className="h-3 w-1/2 bg-blue-400/40 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-16 bg-white/10 rounded-xl" />
              <div className="h-16 bg-white/10 rounded-xl" />
              <div className="h-16 bg-white/10 rounded-xl" />
            </div>
          </div>

          <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 h-80 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="space-y-3">
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 h-64 animate-pulse" />
          <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 h-64 animate-pulse" />
          <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Optional Backend Status / Error Banner */}
      {apiError && !dashboardData.isLiveApi && (
        <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Top Row: Attendance (Radial), Next Exam (Hero Card), Today's Classes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* 1. Attendance Radial Card (Page 3 Left) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigate('attendance')}
          className="md:col-span-3 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between cursor-pointer group hover:border-blue-200 transition-all"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Attendance</h2>
            {dashboardData.isLiveApi && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            )}
          </div>

          <div className="my-5 flex flex-col items-center justify-center">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Progress Arc */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-blue-600 transition-all duration-1000 ease-out"
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Centered Text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-blue-600 tracking-tight">
                  {attendancePct}%
                </span>
              </div>
            </div>

            {/* On Track Pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{attendancePct >= 75 ? 'On Track' : 'Needs Attention'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-medium group-hover:text-blue-600 transition-colors">
            <span>View detailed records</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </motion.div>

        {/* 2. NEXT EXAM Hero Card (Page 3 Center) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          onClick={() => onNavigate('exams')}
          className="md:col-span-5 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white rounded-2xl p-6 md:p-7 shadow-md cursor-pointer flex flex-col justify-between group"
        >
          {/* Subtle Decorative Background Watermark */}
          <div className="absolute -right-4 -bottom-6 opacity-15 pointer-events-none text-white transform rotate-12 scale-125">
            <BookOpen className="w-44 h-44" />
          </div>

          {/* Top content */}
          <div className="relative z-10">
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-100/90 mb-2.5">
              NEXT EXAM
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {dashboardData.nextExam?.name || 'Data Structures & Algorithms'}
            </h2>
            <p className="text-xs text-blue-100/80 font-medium mt-1">
              Mid-Term Assessment • {dashboardData.nextExam?.room || 'Room 402, CS Building'}
            </p>
          </div>

          {/* Countdown Blocks */}
          <div className="relative z-10 mt-6 pt-4 border-t border-blue-500/40">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 text-center border border-white/20 shadow-xs">
                <span className="block text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {timeLeft.days}
                </span>
                <span className="text-[11px] font-semibold text-blue-100/90 tracking-wide uppercase">
                  Days
                </span>
              </div>

              <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 text-center border border-white/20 shadow-xs">
                <span className="block text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {timeLeft.hours}
                </span>
                <span className="text-[11px] font-semibold text-blue-100/90 tracking-wide uppercase">
                  Hrs
                </span>
              </div>

              <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 text-center border border-white/20 shadow-xs">
                <span className="block text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {timeLeft.minutes}
                </span>
                <span className="text-[11px] font-semibold text-blue-100/90 tracking-wide uppercase">
                  Min
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Today's Classes Card (Page 3 Right) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Today&apos;s Classes</h2>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Class 1: Computer Networks */}
            <div
              onClick={() => onNavigate('timetable')}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Computer Networks</h4>
                <p className="text-[11px] text-slate-500 font-medium">Prof. Alan Turing</p>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">• Room 302</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-slate-700 block">10:00 AM</span>
                <span className="text-[10px] text-slate-400">11:30 AM</span>
              </div>
            </div>

            {/* Class 2: Engineering Math III */}
            <div
              onClick={() => onNavigate('timetable')}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-50/40 border border-blue-100/60 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                Σ
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-900 truncate">Engineering Math III</h4>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Prof. Ramanujan</p>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">• Room 105</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-slate-700 block">01:00 PM</span>
                <span className="text-[10px] text-slate-400">02:30 PM</span>
              </div>
            </div>

            {/* Class 3: Advanced C Lab */}
            <div
              onClick={() => onNavigate('timetable')}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                <Code2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">Advanced C Lab</h4>
                <p className="text-[11px] text-slate-500 font-medium">Lab Asst. Smith</p>
                <p className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">• Lab 4</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-slate-700 block">03:00 PM</span>
                <span className="text-[10px] text-slate-400">05:00 PM</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Smart Alerts, Subject Breakdown, Academic Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* 4. Smart Alerts Card (Page 3 Bottom Left) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Smart Alerts</h2>
            <span className="text-xs bg-red-50 text-red-600 font-semibold px-2 py-0.5 rounded-full">
              2 Active
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Alert 1: Low Attendance */}
            <div
              onClick={() => onNavigate('attendance')}
              className="p-3.5 rounded-xl bg-red-50/70 border border-red-100/80 cursor-pointer hover:bg-red-50 transition-colors flex items-start gap-3"
            >
              <div className="p-1.5 rounded-lg bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-900">Low Attendance Warning</h4>
                <p className="text-[11px] text-red-700/90 mt-0.5 leading-snug">
                  Computer Networks (70%) - Below mandatory 75% criteria.
                </p>
              </div>
            </div>

            {/* Alert 2: Assignment Due */}
            <div
              onClick={() => onNavigate('assignments')}
              className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100/80 cursor-pointer hover:bg-amber-50 transition-colors flex items-start gap-3"
            >
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900">Assignment Due</h4>
                <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
                  Graph Algorithms Implementation is due today at 11:59 PM.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-50 text-center">
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              View all notification alerts
            </button>
          </div>
        </div>

        {/* 5. Subject Breakdown Mini Stats (Page 3 Bottom Middle) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Subject Breakdown</h2>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Details
            </button>
          </div>

          {/* 2x2 Grid matching Page 3 */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Eng. Math */}
            <div
              onClick={() => onNavigate('attendance')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-600 block">Eng. Math</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-slate-900">78%</span>
                <span className="text-xs text-slate-400">~</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            {/* C Prog */}
            <div
              onClick={() => onNavigate('attendance')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-600 block">C Prog.</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-slate-900">91%</span>
                <span className="text-xs text-emerald-500 font-bold">~</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '91%' }} />
              </div>
            </div>

            {/* Networks / Physics */}
            <div
              onClick={() => onNavigate('attendance')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-red-50/40 border border-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-600 block">Networks</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-red-600">70%</span>
                <span className="text-xs text-red-400 font-bold">~</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '70%' }} />
              </div>
            </div>

            {/* Data Structures */}
            <div
              onClick={() => onNavigate('attendance')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-600 block">Data Struct.</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold text-blue-600">88%</span>
                <span className="text-xs text-blue-400">→</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Server className="w-3 h-3 text-slate-400" />
            <span>Academic Sem: {dashboardData.student.semester}</span>
          </div>
        </div>

        {/* 6. Academic Pulse Trend (Page 3 Bottom Right) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900">Academic Pulse</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Performance Trend</span>
            </div>
          </div>

          {/* SVG Smooth Curve Graph matching Page 3 */}
          <div className="my-2 relative w-full h-36">
            <svg
              viewBox="0 0 300 120"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Subtle Horizontal gridlines */}
              <line x1="0" y1="30" x2="300" y2="30" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="65" x2="300" y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="300" y2="100" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />

              {/* Gradient Fill under curve */}
              <defs>
                <linearGradient id="academicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path
                d="M 15 95 C 45 95, 60 70, 95 65 C 130 60, 145 90, 185 85 C 225 80, 240 25, 285 30 L 285 110 L 15 110 Z"
                fill="url(#academicGradient)"
              />

              {/* Main Spline Curve */}
              <path
                d="M 15 95 C 45 95, 60 70, 95 65 C 130 60, 145 90, 185 85 C 225 80, 240 25, 285 30"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Interactive Data Nodes */}
              <circle cx="15" cy="95" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              <circle cx="95" cy="65" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              <circle cx="185" cy="85" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
              <circle cx="285" cy="30" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels: Sep, Oct, Nov, Dec */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mt-1 px-1">
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> {dashboardData.student.gpaChange || '+8.4% this month'}
            </span>
            <span className="text-slate-600 font-mono font-bold">GPA {dashboardData.student.gpa}</span>
          </div>
        </div>
      </div>

      {/* Campus Operations & Services Quick Hub */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Campus Operations & Services
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Hostel complaints, bonafide certificates, weekend gate passes, and department workload tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('operations')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              Open Operations Desk
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

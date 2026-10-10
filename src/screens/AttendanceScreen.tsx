import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { attendanceSubjects } from '../data/mockData';
import { AttendanceSubject } from '../types';
import { api, AttendanceScreenData } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export const AttendanceScreen: React.FC = () => {
  const { t, translateStatus } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceScreenData>({
    overallPercentage: 82,
    threshold: 75,
    totalClasses: 200,
    totalAttended: 164,
    totalAbsent: 36,
    subjects: attendanceSubjects,
    recentLogs: [],
    isLiveApi: false,
  });

  const [selectedPeriod, setSelectedPeriod] = useState('This Semester');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedSubjectIndex, setSimulatedSubjectIndex] = useState(0);
  const [additionalClasses, setAdditionalClasses] = useState(5);
  const [additionalAttended, setAdditionalAttended] = useState(5);

  const fetchAttendance = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await api.getStudentAttendance('1');
      setAttendanceData(data);
      if (!data.isLiveApi) {
        setApiError('Connected in local mode. Flask backend fallback active.');
      }
    } catch (err: any) {
      console.error('[AttendanceScreen] Error fetching attendance:', err);
      setApiError(err?.message || 'Unable to connect to attendance API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const subjects = attendanceData.subjects;
  const simulatedSubject = subjects[simulatedSubjectIndex] || subjects[0] || attendanceSubjects[0];

  const totalClasses = attendanceData.totalClasses || subjects.reduce((acc, s) => acc + s.total, 0);
  const totalAttended = attendanceData.totalAttended || subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalAbsent = attendanceData.totalAbsent ?? (totalClasses - totalAttended);
  const overallPercentage = attendanceData.overallPercentage || Math.round((totalAttended / (totalClasses || 1)) * 100);

  // Calculate simulated attendance
  const simulatedNewTotal = (simulatedSubject?.total || 0) + additionalClasses;
  const simulatedNewAttended = (simulatedSubject?.attended || 0) + additionalAttended;
  const simulatedPercent = Math.round((simulatedNewAttended / (simulatedNewTotal || 1)) * 100);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-60 bg-slate-200/80 rounded-md animate-pulse" />
            <div className="h-4 w-40 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="h-8 w-48 bg-slate-200/60 rounded-full animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white rounded-2xl p-7 border border-slate-100 h-84 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="w-40 h-40 rounded-full border-8 border-slate-100 mx-auto" />
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl p-7 border border-slate-100 h-84 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-40 bg-slate-100 rounded-xl" />
            <div className="h-4 w-52 bg-slate-100 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Optional Non-Destructive Error Banner */}
      {apiError && !attendanceData.isLiveApi && (
        <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={fetchAttendance}
            className="flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Header Section (Page 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {t('attendance.title', 'Attendance Overview')}
            </h1>
            {attendanceData.isLiveApi && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {t('attendance.subtitle', 'Fall Semester 2023 • School of Computing & Data Sciences')}
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border shadow-2xs self-start sm:self-auto ${
            overallPercentage >= 75
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
              : 'bg-red-50 text-red-800 border-red-200/80'
          }`}
        >
          {overallPercentage >= 75 ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t('attendance.statusSafe', `Keep it up! You're above the ${attendanceData.threshold}% threshold.`)}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{t('attendance.statusShortage', `Attendance below mandatory ${attendanceData.threshold}% threshold!`)}</span>
            </>
          )}
        </div>
      </div>

      {/* Top Cards: Overall Attendance Ring & Semester Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Overall Attendance Card (Page 4 Left) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900">{t('attendance.overallTitle', 'Overall Attendance')}</h2>
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>
          </div>

          {/* Radial Ring */}
          <div className="my-6 flex justify-center items-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                {/* Background Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  className="stroke-slate-100"
                  strokeWidth="11"
                  fill="transparent"
                />
                {/* Progress Emerald/Teal Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r="56"
                  className={`transition-all duration-1000 ease-out ${
                    overallPercentage >= 75 ? 'stroke-emerald-600' : 'stroke-red-500'
                  }`}
                  strokeWidth="11"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - overallPercentage / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute text-center flex flex-col items-center">
                <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {overallPercentage}%
                </span>
                <span
                  className={`text-[11px] font-semibold mt-0.5 ${
                    overallPercentage >= 75 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {overallPercentage >= 75
                    ? `${t('attendance.statusSafe', 'Above Min.')} (${attendanceData.threshold}%)`
                    : `${t('attendance.statusShortage', 'Below Min.')} (${attendanceData.threshold}%)`}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Stats Row: PRESENT | ABSENT | TOTAL */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 pt-4 border-t border-slate-100 text-center">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                {t('attendance.attendedClasses', 'PRESENT')}
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-emerald-600 font-mono">
                {totalAttended}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                ABSENT
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-red-500 font-mono">
                {totalAbsent}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                {t('common.total', 'TOTAL')}
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-800 font-mono">
                {totalClasses}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Semester Trend Area Chart (Page 4 Right) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Semester Trend</h2>
              <p className="text-xs text-slate-400">Monthly aggregate attendance percentage</p>
            </div>

            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option>This Semester</option>
                <option>Previous Semester</option>
                <option>Annual View</option>
              </select>
            </div>
          </div>

          {/* Area Chart Area */}
          <div className="relative w-full h-48 my-2">
            {/* Y Axis percentage markers */}
            <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[11px] font-semibold text-slate-400">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
            </div>

            {/* SVG Chart with 75% threshold guide line */}
            <div className="ml-10 h-full">
              <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Horizontal reference grid lines */}
                <line x1="0" y1="10" x2="400" y2="10" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="0" y1="130" x2="400" y2="130" stroke="#F1F5F9" strokeWidth="1" />

                {/* 75% Marker Label */}
                <text x="340" y="47" fill="#EF4444" fontSize="10" fontWeight="bold" opacity="0.8">
                  {attendanceData.threshold}% Required
                </text>

                <defs>
                  <linearGradient id="attendanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Area */}
                <path
                  d="M 10 100 C 60 105, 90 75, 140 68 C 190 62, 230 85, 280 72 C 330 60, 360 40, 395 38 L 395 150 L 10 150 Z"
                  fill="url(#attendanceAreaGrad)"
                />

                {/* Shaded Curve */}
                <path
                  d="M 10 100 C 60 105, 90 75, 140 68 C 190 62, 230 85, 280 72 C 330 60, 360 40, 395 38"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="10" cy="100" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                <circle cx="140" cy="68" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                <circle cx="280" cy="72" r="4.5" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
                <circle cx="395" cy="38" r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>

            {/* X Axis Months */}
            <div className="ml-10 flex items-center justify-between text-[11px] text-slate-400 font-semibold mt-1">
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
              <span>Dec</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Steady attendance growth over semester
            </span>
            <span className="text-slate-400">Total sessions: {totalClasses}</span>
          </div>
        </motion.div>
      </div>

      {/* Attendance Goal Simulator (Interactive Tool) */}
      {showSimulator && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 shadow-xs"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-blue-900">Attendance Target Simulator</h3>
          </div>
          <p className="text-xs text-blue-800/80 mb-4">
            Test how attending or missing future lectures affects your compliance for any subject.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Select Subject
              </label>
              <select
                value={simulatedSubjectIndex}
                onChange={(e) => setSimulatedSubjectIndex(Number(e.target.value))}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none"
              >
                {subjects.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {s.name} ({s.percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Upcoming Classes Held (+{additionalClasses})
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={additionalClasses}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setAdditionalClasses(val);
                  if (additionalAttended > val) setAdditionalAttended(val);
                }}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Classes You Will Attend (+{additionalAttended})
              </label>
              <input
                type="number"
                min="0"
                max={additionalClasses}
                value={additionalAttended}
                onChange={(e) =>
                  setAdditionalAttended(
                    Math.min(additionalClasses, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2 text-slate-800"
              />
            </div>

            <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Projected %
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  {simulatedSubject?.shortName || simulatedSubject?.name}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl font-extrabold font-mono ${
                    simulatedPercent >= 75 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {simulatedPercent}%
                </span>
                <span className="text-[10px] block font-bold text-slate-400">
                  {simulatedPercent >= 75 ? '✓ Meets Threshold' : '⚠️ Shortage Risk'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subject Breakdown Section (Page 4 Bottom Grid) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t('attendance.subjectBreakdown', 'Subject Breakdown')}</h2>
          <span className="text-xs text-slate-500 font-medium">{subjects.length} {t('common.items', 'Enrolled Courses')}</span>
        </div>

        {/* Grid of Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subj) => {
            const isShortage = subj.percentage < 75;
            const isWarning = subj.percentage >= 75 && subj.percentage <= 80;

            return (
              <motion.div
                key={subj.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={`bg-white rounded-2xl p-5 border shadow-2xs transition-all ${
                  isShortage
                    ? 'border-l-4 border-l-red-500 border-red-100 bg-red-50/10'
                    : isWarning
                    ? 'border-l-4 border-l-amber-500 border-slate-100'
                    : 'border-l-4 border-l-emerald-500 border-slate-100'
                }`}
              >
                {/* Card Header: Subject Name, Code & Faculty */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{subj.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {subj.code} <span className="text-slate-300">•</span> {subj.faculty}
                    </p>
                  </div>

                  <span
                    className={`text-sm font-extrabold font-mono px-2 py-0.5 rounded-lg ${
                      isShortage
                        ? 'text-red-600 bg-red-50'
                        : isWarning
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-emerald-700 bg-emerald-50'
                    }`}
                  >
                    {subj.percentage}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden my-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isShortage
                        ? 'bg-red-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${subj.percentage}%` }}
                  />
                </div>

                {/* Footer: Classes count & status pill */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-xs">
                  <span className="font-semibold text-slate-600">
                    {subj.attended}/{subj.total} {t('attendance.attendedClasses', 'Classes')}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isShortage
                        ? 'bg-red-100 text-red-700'
                        : isWarning
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isShortage && <AlertTriangle className="w-3 h-3 text-red-600" />}
                    {translateStatus(subj.badgeText)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Attendance Logs (when live API) */}
        {attendanceData.recentLogs && attendanceData.recentLogs.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">{t('attendance.recentLogs', 'Recent Attendance Logs')}</h3>
              </div>
              <span className="text-xs text-slate-400">Past 5 sessions</span>
            </div>

            <div className="divide-y divide-slate-100">
              {attendanceData.recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{log.subject_name}</span>
                    <span className="text-slate-400 ml-2">({log.subject_code})</span>
                    <p className="text-[11px] text-slate-500">{log.topic}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{log.date}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        log.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}
                    >
                      {translateStatus(log.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

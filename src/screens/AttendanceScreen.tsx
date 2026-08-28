import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Info,
  Calendar,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { attendanceSubjects } from '../data/mockData';
import { AttendanceSubject } from '../types';

export const AttendanceScreen: React.FC = () => {
  const [subjects, setSubjects] = useState<AttendanceSubject[]>(attendanceSubjects);
  const [selectedPeriod, setSelectedPeriod] = useState('This Semester');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedSubject, setSimulatedSubject] = useState<AttendanceSubject>(subjects[2]); // Algorithms
  const [additionalClasses, setAdditionalClasses] = useState(5);
  const [additionalAttended, setAdditionalAttended] = useState(5);

  const totalClasses = subjects.reduce((acc, s) => acc + s.total, 0);
  const totalAttended = subjects.reduce((acc, s) => acc + s.attended, 0);
  const totalAbsent = totalClasses - totalAttended;
  const overallPercentage = Math.round((totalAttended / totalClasses) * 100);

  // Calculate simulated attendance
  const simulatedNewTotal = simulatedSubject.total + additionalClasses;
  const simulatedNewAttended = simulatedSubject.attended + additionalAttended;
  const simulatedPercent = Math.round((simulatedNewAttended / simulatedNewTotal) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Section (Page 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Attendance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Fall Semester 2023 <span className="text-slate-300">•</span> Computer Science
          </p>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/80 shadow-2xs self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Keep it up! You&apos;re above the 75% threshold.</span>
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
            <h2 className="text-base font-bold text-slate-900">Overall Attendance</h2>
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
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
                  className="stroke-emerald-600 transition-all duration-1000 ease-out"
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
                <span className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  Above Min. (75%)
                </span>
              </div>
            </div>
          </div>

          {/* Sub Stats Row: PRESENT 164 | ABSENT 36 | TOTAL 200 */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 pt-4 border-t border-slate-100 text-center">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                PRESENT
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
                TOTAL
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
                <text x="350" y="47" fill="#EF4444" fontSize="10" fontWeight="bold" opacity="0.8">
                  75% Required
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
            <span className="text-slate-400">Total sessions: 200</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
              <select
                value={simulatedSubject.id}
                onChange={(e) => {
                  const sub = subjects.find((s) => s.id === e.target.value);
                  if (sub) setSimulatedSubject(sub);
                }}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Current: {s.percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Upcoming Classes to attend: {additionalAttended} / {additionalClasses}
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={additionalClasses}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setAdditionalClasses(val);
                  if (additionalAttended > val) setAdditionalAttended(val);
                }}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>1 class</span>
                <span>15 classes</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Projected Attendance</span>
                <span className="text-xs text-slate-400">
                  {simulatedNewAttended}/{simulatedNewTotal} Classes
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
          <h2 className="text-lg font-bold text-slate-900">Subject Breakdown</h2>
          <span className="text-xs text-slate-500 font-medium">5 Enrolled Courses</span>
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
                    {subj.attended}/{subj.total} Classes
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
                    {subj.badgeText}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

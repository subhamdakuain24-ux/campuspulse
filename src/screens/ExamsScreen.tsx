import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  FileCheck,
  Download,
  AlertCircle,
  X,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { upcomingExams } from '../data/mockData';
import { ExamItem } from '../types';
import { api, ExamsScreenData, BackendExamItem } from '../services/api';

export const ExamsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [examsData, setExamsData] = useState<ExamsScreenData>({
    exams: upcomingExams,
    rawExams: [],
    nextExam: upcomingExams[0],
    isLiveApi: false,
  });

  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [showHallTicketModal, setShowHallTicketModal] = useState(false);

  // Live countdown state for the next exam
  const [timeLeft, setTimeLeft] = useState({
    days: '01',
    hours: '14',
    minutes: '45',
    seconds: '22',
  });

  const fetchExams = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await api.getStudentExams('1');
      setExamsData(data);
      if (!data.isLiveApi) {
        setApiError('Connected in local fallback mode. Backend unavailable.');
      }
    } catch (err: any) {
      console.error('[ExamsScreen] Error fetching exams:', err);
      setApiError(err?.message || 'Unable to connect to exams API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    let totalSeconds = 1 * 86400 + 14 * 3600 + 45 * 60 + 22;

    const interval = setInterval(() => {
      totalSeconds = Math.max(0, totalSeconds - 1);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const exams = examsData.exams;
  const nextExam = examsData.nextExam || exams[0] || upcomingExams[0];

  // Calendar dates matrix for October 2023 (Oct 1 = Sunday)
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const octoberDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Extract exam dates from exams list for highlight
  const examDates = exams.map((ex) => {
    const d = new Date(ex.date);
    return isNaN(d.getDate()) ? 26 : d.getDate();
  });
  const todayDate = 24;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200/80 rounded-md animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white rounded-2xl p-7 border border-slate-100 h-64 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-4 w-48 bg-slate-100 rounded" />
          </div>
          <div className="lg:col-span-4 bg-white rounded-2xl p-7 border border-slate-100 h-64 flex flex-col justify-between shadow-xs animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-100 rounded-xl" />
            <div className="h-4 w-full bg-slate-100 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 h-28 animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100 h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Optional Non-Destructive Error Banner */}
      {apiError && !examsData.isLiveApi && (
        <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={fetchExams}
            className="flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Header Section (Page 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Examination Center
            </h1>
            {examsData.isLiveApi && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your upcoming assessments and track preparation status.
          </p>
        </div>

        <button
          onClick={() => setShowHallTicketModal(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <FileCheck className="w-4 h-4" />
          <span>Hall Ticket</span>
        </button>
      </div>

      {/* Top Row: Next Exam Countdown & Prep Status (Page 7 Top) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Next Exam Hero Card (Page 7 Top Left) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between"
        >
          {/* Card Header & Badge */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60 mb-3">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Next Exam</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {nextExam.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{nextExam.room || 'Examination Hall B'}</span>
              </div>
            </div>

            {/* Countdown Ticker Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 text-right">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                TIME REMAINING
              </span>

              {/* Ticker Row */}
              <div className="flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-black text-slate-900">
                <div className="flex flex-col items-center">
                  <span>{timeLeft.days}</span>
                  <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase">
                    DD
                  </span>
                </div>
                <span className="text-slate-300 -mt-3">:</span>
                <div className="flex flex-col items-center">
                  <span>{timeLeft.hours}</span>
                  <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase">
                    HH
                  </span>
                </div>
                <span className="text-slate-300 -mt-3">:</span>
                <div className="flex flex-col items-center">
                  <span>{timeLeft.minutes}</span>
                  <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase">
                    MM
                  </span>
                </div>
                <span className="text-slate-300 -mt-3">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-blue-600">{timeLeft.seconds}</span>
                  <span className="text-[9px] font-sans font-semibold text-slate-400 uppercase">
                    SS
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom detail pill */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-4 text-slate-600 font-semibold">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                {nextExam.displayDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                {nextExam.timeRange}
              </span>
            </div>

            <span className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer">
              View Syllabus Breakdown &rarr;
            </span>
          </div>
        </motion.div>

        {/* Exam Readiness & Strategy Card (Page 7 Top Right) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Exam Readiness</h3>
              <span className="text-xs font-extrabold text-blue-600 font-mono">
                {nextExam.syllabusPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Estimated preparation index for upcoming assessment based on lecture coverage.
            </p>

            {/* Visual Readiness Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${nextExam.syllabusPercent}%` }}
              />
            </div>

            {/* Checklist Preview */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hall ticket downloaded &amp; verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Core algorithm proofs reviewed</span>
              </div>
              <div className="flex items-center gap-2 text-amber-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Practice past papers (2 remaining)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Overall readiness score</span>
            <span className="font-bold text-slate-700">Good Standing</span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Upcoming Exam Schedule (Left) + Monthly Assessment Calendar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Full Upcoming Schedule List (Page 7 Left) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Assessments</h2>
            <span className="text-xs text-slate-500 font-medium">
              {exams.length} Scheduled Sessions
            </span>
          </div>

          <div className="space-y-3">
            {exams.map((exam) => {
              const isSelected = selectedExam?.id === exam.id;
              const isScheduled = exam.status === 'Scheduled';

              return (
                <motion.div
                  key={exam.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setSelectedExam(exam)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-slate-100/90 hover:border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Code badge, Title, Details */}
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 font-mono font-bold text-xs shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {exam.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isScheduled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {exam.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{exam.name}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            {exam.displayDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {exam.timeRange}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {exam.room}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Prep indicator & quick action */}
                    <div className="sm:text-right shrink-0">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Syllabus Prep
                      </span>
                      <span className="text-sm font-mono font-extrabold text-blue-600">
                        {exam.syllabusPercent}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Month Calendar Matrix (Page 7 Right) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">October 2023</h3>
            <div className="flex items-center gap-1 text-slate-400">
              <button className="p-1 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {daysOfWeek.map((day) => (
              <span key={day} className="text-[11px] font-bold text-slate-400 py-1 uppercase">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {octoberDays.map((day) => {
              const isToday = day === todayDate;
              const hasExam = examDates.includes(day);

              return (
                <div
                  key={day}
                  className={`h-9 flex flex-col items-center justify-center rounded-xl font-medium transition-all ${
                    hasExam
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{day}</span>
                  {hasExam && <span className="w-1 h-1 rounded-full bg-white -mt-0.5"></span>}
                </div>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Exam Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-400"></span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hall Ticket Modal (Page 7 Modal) */}
      <AnimatePresence>
        {showHallTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">Official Hall Ticket</h3>
                </div>
                <button
                  onClick={() => setShowHallTicketModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Ticket Preview Box */}
              <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2 font-sans font-bold text-slate-800">
                  <span>CAMPUSPULSE ADMIT CARD</span>
                  <span className="text-blue-600">FALL 2023</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CANDIDATE NAME</span>
                    <span className="font-bold text-slate-900">Alex Johnson</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ROLL / STUDENT ID</span>
                    <span className="font-bold text-slate-900">CP-847291</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400 block text-[10px]">EXAMINATION CENTER</span>
                  <span className="font-bold text-slate-900">
                    Room 402 / Auditorium West, Main Block
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px]">AUTHORIZATION STATUS</span>
                  <span className="text-emerald-600 font-bold">✓ VERIFIED &amp; APPROVED</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowHallTicketModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowHallTicketModal(false)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
} from 'lucide-react';
import { upcomingExams } from '../data/mockData';
import { ExamItem } from '../types';

export const ExamsScreen: React.FC = () => {
  const [exams, setExams] = useState<ExamItem[]>(upcomingExams);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [showHallTicketModal, setShowHallTicketModal] = useState(false);

  // Live countdown state for the next exam
  const [timeLeft, setTimeLeft] = useState({
    days: '01',
    hours: '14',
    minutes: '45',
    seconds: '22',
  });

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

  // Calendar dates matrix for October 2023 (Oct 1 = Sunday)
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const octoberDays = Array.from({ length: 31 }, (_, i) => i + 1);

  // Exam dates in October: 26, 29
  const examDates = [26, 29];
  const todayDate = 24;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Section (Page 7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Examination Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your upcoming assessments and track preparation status.
          </p>
        </div>

        <button
          onClick={() => setShowHallTicketModal(true)}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
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
                Data Structures &amp; Algorithms
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Room 402, CS Building</span>
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

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>Exam Format: 100 Marks (30 MCQ + 70 Theory)</span>
            <span className="font-semibold text-blue-600">Calculators Permitted</span>
          </div>
        </motion.div>

        {/* Prep Status Card (Page 7 Top Right) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900">Prep Status</h2>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-sm font-semibold text-slate-600">Data Structures</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">85%</span>
            </div>

            {/* Green Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-3">
              <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '85%' }} />
            </div>
            <p className="text-[11px] text-right font-semibold text-slate-400">Syllabus Covered</p>
          </div>

          {/* Module checklist */}
          <div className="space-y-2 pt-3 border-t border-slate-50 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Trees &amp; BST
              </span>
              <span className="text-slate-400 font-mono text-[11px]">100%</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Graph Traversals
              </span>
              <span className="text-slate-400 font-mono text-[11px]">90%</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Dynamic Programming
              </span>
              <span className="text-amber-600 font-mono text-[11px]">65%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Upcoming Exams Table & Interactive October 2023 Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upcoming Exams Table (Page 7 Bottom Left) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Upcoming Exams</h2>
            <button
              onClick={() => setSelectedExam(exams[0])}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[11px]">
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold">Date &amp; Time</th>
                  <th className="pb-3 font-semibold">Room</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {exams.map((exam) => {
                  const isScheduled = exam.status === 'Scheduled';

                  return (
                    <tr
                      key={exam.id}
                      onClick={() => setSelectedExam(exam)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-3">
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">{exam.name}</p>
                        <p className="text-slate-400 text-[11px]">{exam.code}</p>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-700 font-medium">
                        <p className="font-semibold text-slate-800">{exam.displayDate}</p>
                        <p className="text-slate-400 text-[11px]">{exam.timeRange}</p>
                      </td>
                      <td className="py-3.5 pr-3 text-slate-700 font-medium">{exam.room}</td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isScheduled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isScheduled ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                          />
                          {exam.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>Seat numbers will be posted 30 minutes before commencement</span>
            <span>Hall B &amp; CS Wing</span>
          </div>
        </div>

        {/* October 2023 Calendar (Page 7 Bottom Right) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">October 2023</h2>
            <div className="flex items-center gap-1 text-slate-400">
              <button className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-800">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Grid */}
          <div>
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
              {daysOfWeek.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {octoberDays.map((day) => {
                const isExam = examDates.includes(day);
                const isToday = day === todayDate;

                return (
                  <div
                    key={day}
                    className={`h-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isExam
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isToday
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 font-bold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>Exam Date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-300"></span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hall Ticket / Exam Detail Modal */}
      <AnimatePresence>
        {(showHallTicketModal || selectedExam) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Mid-Term Examination Hall Ticket
                    </h3>
                    <p className="text-xs text-slate-400">Fall Semester 2023 • B.Tech Computer Science</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHallTicketModal(false);
                    setSelectedExam(null);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student info box */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block font-medium">Candidate Name</span>
                  <span className="font-bold text-slate-800">Alex Johnson</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Roll / ID Number</span>
                  <span className="font-bold text-slate-800 font-mono">CP-847291</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Semester</span>
                  <span className="font-bold text-slate-800">5th Semester</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reporting Center</span>
                  <span className="font-bold text-slate-800">Campus North Block</span>
                </div>
              </div>

              {/* Scheduled Papers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Assigned Papers
                </h4>
                <div className="space-y-1.5 text-xs">
                  {exams.map((e) => (
                    <div
                      key={e.id}
                      className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{e.name}</span>
                        <p className="text-[11px] text-slate-500">
                          {e.code} • {e.room}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-blue-700">{e.displayDate}</span>
                        <p className="text-[11px] text-slate-400">{e.timeRange}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowHallTicketModal(false);
                    setSelectedExam(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Hall ticket downloaded as PDF.');
                    setShowHallTicketModal(false);
                    setSelectedExam(null);
                  }}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Slip</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

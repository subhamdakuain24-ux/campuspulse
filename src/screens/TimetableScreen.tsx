import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Download,
  Clock,
  MapPin,
  User,
  Check,
  Layers,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { timetableSchedule } from '../data/mockData';
import { api, TimetableScreenData } from '../services/api';

export const TimetableScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<TimetableScreenData>({
    todaySchedule: timetableSchedule.todaySchedule,
    matrix: timetableSchedule.matrix,
    groupedByDay: {},
    rawSchedule: [],
    isLiveApi: false,
  });

  const [viewMode, setViewMode] = useState<'Week' | 'Month'>('Week');
  const [selectedDay, setSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Tue');
  const [syncedToast, setSyncedToast] = useState(false);
  const [exportToast, setExportToast] = useState(false);

  const fetchTimetable = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await api.getStudentTimetable('1');
      setTimetableData(data);
      if (!data.isLiveApi) {
        setApiError('Connected in local fallback mode. Backend unavailable.');
      }
    } catch (err: any) {
      console.error('[TimetableScreen] Error fetching timetable:', err);
      setApiError(err?.message || 'Unable to connect to timetable API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleSyncCalendar = () => {
    setSyncedToast(true);
    setTimeout(() => setSyncedToast(false), 3000);
  };

  const handleExportPDF = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

  const days: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'> = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  const todaySchedule = timetableData.todaySchedule;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200/80 rounded-md animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-9 w-32 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl p-7 border border-slate-100 h-96 animate-pulse space-y-4 shadow-xs">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="space-y-3 pt-4">
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-100 rounded-xl" />
            </div>
          </div>
          <div className="lg:col-span-7 bg-white rounded-2xl p-7 border border-slate-100 h-96 animate-pulse shadow-xs" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Optional Non-Destructive Error Banner */}
      {apiError && !timetableData.isLiveApi && (
        <div className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={fetchTimetable}
            className="flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Header Section (Page 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Timetable
            </h1>
            {timetableData.isLiveApi && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Manage your classes, labs, and weekly schedule.
          </p>
        </div>

        {/* Action Buttons: Export PDF & Sync Calendar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleSyncCalendar}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Sync Calendar</span>
          </button>
        </div>
      </div>

      {/* Notifications / Toast */}
      {syncedToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-xs"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          <span>✓ Timetable successfully synced with your Google/iCal calendar!</span>
        </motion.div>
      )}

      {exportToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2 shadow-xs"
        >
          <Check className="w-4 h-4 text-blue-600" />
          <span>✓ Fall 2023 Timetable PDF generated and ready for print!</span>
        </motion.div>
      )}

      {/* 2-Column Layout (Page 5): Today's Schedule (Left) & Weekly Overview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Schedule (Page 5 Left) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Today&apos;s Schedule</h2>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full">
              Tuesday
            </span>
          </div>

          {/* Timeline list */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {todaySchedule.map((item, idx) => {
              const isInProgress = item.status === 'In Progress';

              return (
                <div key={idx} className="relative">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                      isInProgress
                        ? 'border-blue-600 ring-4 ring-blue-100'
                        : 'border-slate-300'
                    }`}
                  >
                    {isInProgress && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    )}
                  </div>

                  {/* Time label */}
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 tracking-wider">
                    {item.time}
                  </div>

                  {/* Schedule Card */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      isInProgress
                        ? 'bg-blue-600 text-white shadow-md border-blue-600'
                        : 'bg-slate-50/70 hover:bg-slate-50 border-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[11px] font-bold uppercase tracking-wider block ${
                            isInProgress ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {item.courseCode}
                        </span>
                        <h4
                          className={`text-sm font-bold mt-0.5 ${
                            isInProgress ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.courseName}
                        </h4>
                      </div>

                      {/* Tag pill */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isInProgress
                            ? 'bg-blue-700/80 text-white border border-blue-400/40'
                            : 'bg-blue-100/80 text-blue-700'
                        }`}
                      >
                        {item.status || item.type}
                      </span>
                    </div>

                    <div
                      className={`mt-3 pt-3 border-t text-xs space-y-1 ${
                        isInProgress
                          ? 'border-blue-500/50 text-blue-100'
                          : 'border-slate-200/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 opacity-80" />
                        <span>{item.faculty}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 opacity-80" />
                        <span className="font-medium">{item.room}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Weekly Overview Matrix (Page 5 Right) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          {/* Matrix Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Weekly Overview</h2>
            </div>

            {/* Week / Month Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('Week')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'Week'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('Month')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'Month'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Grid Layout Matrix */}
          <div className="overflow-x-auto my-4">
            <div className="min-w-[500px]">
              {/* Day Headers */}
              <div className="grid grid-cols-6 gap-2 pb-3 border-b border-slate-100 text-center">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Time</div>
                {days.map((d) => {
                  const isToday = d === 'Tue';
                  return (
                    <div
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`text-xs font-bold py-1 rounded-lg cursor-pointer transition-colors ${
                        isToday
                          ? 'text-blue-600 bg-blue-50/80 font-extrabold'
                          : selectedDay === d
                          ? 'text-slate-900 bg-slate-100'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{d}</span>
                      {isToday && (
                        <span className="block text-[9px] text-blue-600/80 font-normal">
                          Today
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Time rows */}
              <div className="relative divide-y divide-slate-50 pt-2">
                {timeSlots.map((time) => {
                  return (
                    <div key={time} className="grid grid-cols-6 gap-2 min-h-[52px] items-center">
                      {/* Time marker */}
                      <span className="text-[11px] font-mono font-medium text-slate-400 text-center">
                        {time}
                      </span>

                      {/* Mon slot */}
                      <div className="h-full flex items-center justify-center p-0.5">
                        {time === '09:00' && (
                          <div className="w-full h-full p-2 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl text-left transition-colors cursor-pointer">
                            <p className="text-[10px] font-bold text-blue-900 leading-tight">Data Structures</p>
                            <p className="text-[9px] text-blue-700">CS 301 • Hall 302</p>
                          </div>
                        )}
                      </div>

                      {/* Tue slot */}
                      <div className="h-full flex items-center justify-center p-0.5">
                        {time === '11:00' || time === '12:00' ? (
                          time === '11:00' ? (
                            <div className="w-full h-[95px] p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-left shadow-xs transition-colors cursor-pointer z-10">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-blue-200">
                                In Progress
                              </span>
                              <p className="text-[11px] font-bold leading-tight mt-0.5">Discrete Math</p>
                              <p className="text-[9px] text-blue-100 mt-1">MATH 302 • Room 408</p>
                            </div>
                          ) : null
                        ) : null}
                      </div>

                      {/* Wed slot */}
                      <div className="h-full flex items-center justify-center p-0.5">
                        {time === '10:00' && (
                          <div className="w-full h-full p-2 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition-colors cursor-pointer">
                            <p className="text-[10px] font-bold text-emerald-900 leading-tight">Database Systems</p>
                            <p className="text-[9px] text-emerald-700">CS 304 • Lab 4B</p>
                          </div>
                        )}
                      </div>

                      {/* Thu slot */}
                      <div className="h-full flex items-center justify-center p-0.5">
                        {time === '11:00' && (
                          <div className="w-full h-full p-2 bg-amber-800 text-amber-50 hover:bg-amber-900 rounded-xl text-left shadow-2xs transition-colors cursor-pointer">
                            <p className="text-[10px] font-bold leading-tight">Software Eng.</p>
                            <p className="text-[9px] text-amber-200">CS 312 • Hall 101</p>
                          </div>
                        )}
                      </div>

                      {/* Fri slot */}
                      <div className="h-full flex items-center justify-center p-0.5">
                        {time === '10:00' && (
                          <div className="w-full h-full p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition-colors cursor-pointer">
                            <p className="text-[10px] font-bold text-purple-900 leading-tight">Web Tech &amp; Cloud</p>
                            <p className="text-[9px] text-purple-700">CS 315 • Lab 2A</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Matrix Footer Legend */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Core Theory
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lab &amp; Practical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-700"></span> Elective
              </span>
            </div>
            <span className="text-slate-400">Total Hours: 24h / week</span>
          </div>
        </div>
      </div>
    </div>
  );
};

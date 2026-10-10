import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Users,
  CreditCard,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  FileText,
  Calendar,
  Layers,
  BarChart3,
  BookMarked,
  BookOpen,
  PackageSearch,
  CalendarRange,
} from 'lucide-react';
import { ScreenId, UserProfile, CampusOperationsStats } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

interface AdminDashboardScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenId) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ user, onNavigate }) => {
  const { t, translateRole } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [operationsStats, setOperationsStats] = useState<CampusOperationsStats | null>(null);
  const [feesSummary, setFeesSummary] = useState({
    totalBilled: 155000,
    totalPaid: 105000,
    totalPending: 50000,
    overdueCount: 2,
  });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const stats = await api.getCampusOperationsStats();
      if (stats) {
        setOperationsStats(stats);
      }
      // Attempt to load fees summary if live
      try {
        const feesRes = await api.getFees();
        if (feesRes && feesRes.summary) {
          const s = feesRes.summary as any;
          setFeesSummary({
            totalBilled: s.total_assessed ?? s.total_fees ?? 155000,
            totalPaid: s.total_collected ?? s.amount_paid ?? 105000,
            totalPending: s.total_outstanding ?? s.outstanding_amount ?? 50000,
            overdueCount: s.overdue_count ?? 2,
          });
        }
      } catch {
        // Fallback to seeded fees stats
      }
    } catch (err) {
      console.warn('[AdminDashboard] Error loading live metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Departmental / Course student attendance analytics
  const studentAttendanceAnalytics = [
    { subject: 'Data Structures & Algorithms (CS301)', avg: 87.5, status: 'Healthy', color: 'emerald' },
    { subject: 'Database Management Systems (CS304)', avg: 85.7, status: 'Healthy', color: 'emerald' },
    { subject: 'Software Engineering (CS312)', avg: 88.5, status: 'Healthy', color: 'emerald' },
    { subject: 'Web Technologies & Cloud (CS315)', avg: 90.9, status: 'Healthy', color: 'emerald' },
    { subject: 'Discrete Mathematics (MATH302)', avg: 73.5, status: 'Warning', color: 'amber' },
    { subject: 'Computer Networks (CS308)', avg: 70.0, status: 'Critical', color: 'rose' },
  ];

  const overallCampusAttendance = 84.6;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner: Administrator Welcome & Status Bar */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Dashboard
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Systems Operational
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              {user.program || 'Campus Operations & IT Administration'} • Administrative command center for student analytics, campus services, operations, and fee oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('operations')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              {t('nav.operations', 'Operations')}
            </button>
            <button
              onClick={() => onNavigate('library')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              {t('library.title', 'Library Desk')}
            </button>
            <button
              onClick={() => onNavigate('papers')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-blue-400" />
              {t('papers.title', 'Exam Papers')}
            </button>
            <button
              onClick={() => onNavigate('fees')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              {t('fees.title', 'Fees')}
            </button>
            <button
              onClick={loadAdminData}
              title={t('common.refresh', 'Refresh Analytics')}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Administrative Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Campus Student Attendance Rate */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-blue-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('attendance.title', 'Campus Attendance')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{overallCampusAttendance}%</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +1.8%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Campus student average across all programs</p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>{t('attendance.title', 'Student Analytics')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Metric 2: Campus Operations Requests */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('operations')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-indigo-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('nav.operations', 'Operations Desk')}</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {operationsStats?.total ?? 25}
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {operationsStats?.in_progress ?? 6} {t('common.active', 'Active')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {operationsStats?.pending ?? 7} {t('status.PENDING', 'pending')} • {operationsStats?.resolved ?? 9} {t('status.RESOLVED', 'resolved')}
            </p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
            <span>{t('operations.allRequests', 'Manage Requests')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Metric 3: Fee Collections (INR ₹) */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('fees')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-emerald-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('admin.feesCollected', 'Fees Collected')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₹{feesSummary.totalPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ₹{feesSummary.totalPending.toLocaleString('en-IN')} outstanding • {feesSummary.overdueCount} overdue
            </p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
            <span>Fee Records</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>

        {/* Metric 4: Campus Broadcasts & Alerts */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => onNavigate('notifications')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs cursor-pointer hover:border-purple-200 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Broadcasts</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">12</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Targeted student & faculty notifications sent</p>
          </div>
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-semibold">
            <span>Broadcast Notice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </motion.div>
      </div>

      {/* Row 2: Administrative Student Attendance Analytics & Campus Operations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Administrative Student Attendance Analytics (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Campus Student Attendance Analytics
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Administrative student attendance monitoring across courses and departments
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 self-start sm:self-auto">
                Campus Avg: {overallCampusAttendance}%
              </span>
            </div>

            {/* Attendance Compliance Overview Badges */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
                <span className="block text-xl font-extrabold text-emerald-700">88.4%</span>
                <span className="text-[11px] font-semibold text-emerald-600">Above 75% Criteria</span>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-center">
                <span className="block text-xl font-extrabold text-amber-700">7.2%</span>
                <span className="text-[11px] font-semibold text-amber-600">Near Threshold (70-75%)</span>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-center">
                <span className="block text-xl font-extrabold text-rose-700">4.4%</span>
                <span className="text-[11px] font-semibold text-rose-600">At-Risk (&lt; 70%)</span>
              </div>
            </div>

            {/* Subject / Course Breakdown Progress Bars */}
            <div className="space-y-3.5 mt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Course Attendance Breakdown
              </h3>
              {studentAttendanceAnalytics.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Healthy'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : item.status === 'Warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {item.status}
                      </span>
                      <span className="font-extrabold text-slate-900 font-mono w-12 text-right">
                        {item.avg}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.status === 'Healthy'
                          ? 'bg-blue-600'
                          : item.status === 'Warning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              * Minimum mandated university attendance requirement is 75.0%.
            </span>
            <button
              onClick={() => onNavigate('attendance')}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer shrink-0"
            >
              Open Attendance Center
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Operational Requests & Quick Dispatch (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Campus Requests Overview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hostel maintenance, gate passes, certificates & facility requests
                </p>
              </div>
              <button
                onClick={() => onNavigate('operations')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold text-slate-500 block">Pending Review</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                  {operationsStats?.pending ?? 7}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold text-slate-500 block">In Progress</span>
                <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
                  {operationsStats?.in_progress ?? 6}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold text-slate-500 block">Resolved Cases</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
                  {operationsStats?.resolved ?? 9}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs font-semibold text-slate-500 block">Unassigned Staff</span>
                <span className="text-2xl font-extrabold text-slate-700 mt-1 block">
                  {operationsStats?.unassigned ?? 6}
                </span>
              </div>
            </div>

            {/* Department Activity Highlights */}
            <div className="space-y-2.5 mt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Operational Units
              </h3>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="font-semibold text-slate-800">Hostel & Living Quarters</span>
                </div>
                <span className="font-bold text-slate-600">8 Requests</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-semibold text-slate-800">Academic Registrar Office</span>
                </div>
                <span className="font-bold text-slate-600">5 Certificates</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">Main Campus Security Gates</span>
                </div>
                <span className="font-bold text-slate-600">4 Gate Passes</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('operations')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Manage Operations Desk
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Administrative Quick Navigation Hub */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Admin Shortcuts & Management Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <button
            onClick={() => onNavigate('lost-found')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-amber-50/80 border border-slate-100 hover:border-amber-200 transition-all text-left group cursor-pointer"
          >
            <PackageSearch className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Lost & Found</span>
            <span className="text-[11px] text-slate-500">Notice desk</span>
          </button>

          <button
            onClick={() => onNavigate('events')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-100 hover:border-purple-200 transition-all text-left group cursor-pointer"
          >
            <CalendarRange className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Events</span>
            <span className="text-[11px] text-slate-500">Conduction desk</span>
          </button>

          <button
            onClick={() => onNavigate('library')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all text-left group cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Library Desk</span>
            <span className="text-[11px] text-slate-500">Books & renewals</span>
          </button>

          <button
            onClick={() => onNavigate('attendance')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition-all text-left group cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Attendance</span>
            <span className="text-[11px] text-slate-500">Student reports</span>
          </button>

          <button
            onClick={() => onNavigate('operations')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-100 hover:border-indigo-200 transition-all text-left group cursor-pointer"
          >
            <Building2 className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Operations</span>
            <span className="text-[11px] text-slate-500">Campus requests</span>
          </button>

          <button
            onClick={() => onNavigate('fees')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-100 hover:border-emerald-200 transition-all text-left group cursor-pointer"
          >
            <CreditCard className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Fees & Dues</span>
            <span className="text-[11px] text-slate-500">INR management</span>
          </button>

          <button
            onClick={() => onNavigate('papers')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition-all text-left group cursor-pointer"
          >
            <BookMarked className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Exam Papers</span>
            <span className="text-[11px] text-slate-500">Paper repository</span>
          </button>

          <button
            onClick={() => onNavigate('notifications')}
            className="p-4 rounded-xl bg-slate-50 hover:bg-rose-50/80 border border-slate-100 hover:border-rose-200 transition-all text-left group cursor-pointer"
          >
            <Bell className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
            <span className="block text-xs font-bold text-slate-900">Broadcasts</span>
            <span className="text-[11px] text-slate-500">Targeted alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
};

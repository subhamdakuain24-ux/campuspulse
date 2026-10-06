import React, { useState, useEffect } from 'react';
import {
  Send,
  Bell,
  Users,
  Building,
  GraduationCap,
  Calendar,
  Home,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  X,
  Plus,
  ShieldCheck,
  CheckCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  NotificationTargetType,
  CreateTargetedNotificationPayload,
  TargetedNotificationRecord,
  UserProfile,
} from '../types';
import { api } from '../services/api';

interface AdminTargetedNotificationsProps {
  user: UserProfile;
  onNotificationSent?: () => void;
}

const TARGET_TYPES: Array<{
  type: NotificationTargetType;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    type: 'ALL',
    label: 'All Students',
    icon: Users,
    description: 'Broadcast to entire campus student body',
  },
  {
    type: 'BRANCH',
    label: 'Academic Branch',
    icon: Building,
    description: 'Target by department or degree program',
  },
  {
    type: 'YEAR',
    label: 'Year of Study',
    icon: GraduationCap,
    description: 'Target 1st, 2nd, 3rd, or 4th year students',
  },
  {
    type: 'BATCH',
    label: 'Graduating Batch',
    icon: Calendar,
    description: 'Target by class year (e.g. 2021-2025)',
  },
  {
    type: 'HOSTEL',
    label: 'Hostel / Residence',
    icon: Home,
    description: 'Target specific hostel or hall of residence',
  },
  {
    type: 'GROUP',
    label: 'Student Group / Club',
    icon: Users,
    description: 'Target registered clubs and student councils',
  },
  {
    type: 'STUDENT',
    label: 'Individual Student',
    icon: Users,
    description: 'Direct message to a specific student ID',
  },
];

const CATEGORIES = [
  { key: 'campus', label: 'Campus Operations & General' },
  { key: 'alerts', label: 'Emergency / Urgent Alert' },
  { key: 'academic', label: 'Academic & Coursework' },
  { key: 'exams', label: 'Exams & Assessment' },
  { key: 'hostel', label: 'Hostel & Mess Facility' },
];

const BADGE_TYPES = [
  { key: 'campus', label: 'Campus Notice' },
  { key: 'urgent', label: 'Urgent Action Required' },
  { key: 'assignment', label: 'Academic / Assignment' },
  { key: 'system', label: 'Administrative' },
];

export const AdminTargetedNotifications: React.FC<AdminTargetedNotificationsProps> = ({
  user,
  onNotificationSent,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'compose'>('compose');
  const [historyList, setHistoryList] = useState<TargetedNotificationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterType, setHistoryFilterType] = useState<string>('ALL');

  // Targeting options from server
  const [options, setOptions] = useState<{
    branches: string[];
    years: string[];
    batches: string[];
    hostels: string[];
    groups: string[];
    students: Array<{ id: string; student_id: string; name: string; program: string }>;
  }>({
    branches: [],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    batches: ['2021-2025', '2022-2026', '2023-2027', '2024-2028'],
    hostels: ['Oak Ridge Residence Hall', 'Maple Hall', 'Block C', 'North Campus Hostel'],
    groups: ['Coding Club', 'Hostel Council', 'Robotics Society', 'Cultural Committee', 'Sports Council'],
    students: [],
  });

  // Compose form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<NotificationTargetType>('ALL');
  const [targetValue, setTargetValue] = useState('');
  const [category, setCategory] = useState<'alerts' | 'exams' | 'academic' | 'campus' | 'hostel' | 'system'>('campus');
  const [badgeType, setBadgeType] = useState<'urgent' | 'assignment' | 'campus' | 'system' | 'exam' | 'general'>('campus');
  const [actionButtonText, setActionButtonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchOptions = async () => {
    try {
      const opts = await api.getTargetingOptions();
      if (opts) setOptions(opts);
    } catch (err) {
      console.warn('[AdminTargetedNotifications] Error loading targeting options:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await api.getTargetedNotifications();
      if (res.success) {
        setHistoryList(res.notifications);
      }
    } catch (err) {
      console.warn('[AdminTargetedNotifications] Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchHistory();
  }, []);

  const handleTargetTypeChange = (type: NotificationTargetType) => {
    setTargetType(type);
    setFormError(null);
    if (type === 'ALL') {
      setTargetValue('');
    } else if (type === 'BRANCH' && options.branches.length > 0) {
      setTargetValue(options.branches[0]);
    } else if (type === 'YEAR') {
      setTargetValue('3rd Year');
    } else if (type === 'BATCH') {
      setTargetValue('2021-2025');
    } else if (type === 'HOSTEL' && options.hostels.length > 0) {
      setTargetValue(options.hostels[0]);
    } else if (type === 'GROUP' && options.groups.length > 0) {
      setTargetValue(options.groups[0]);
    } else if (type === 'STUDENT' && options.students.length > 0) {
      setTargetValue(options.students[0].student_id || options.students[0].id);
    } else {
      setTargetValue('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Please enter a notification title (minimum 3 characters).');
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setFormError('Please enter a notification message (minimum 3 characters).');
      return;
    }

    if (targetType !== 'ALL' && !targetValue.trim()) {
      setFormError(`Please specify the target value for ${targetType}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTargetedNotificationPayload = {
        title: title.trim(),
        description: description.trim(),
        target_type: targetType,
        target_value: targetType === 'ALL' ? undefined : targetValue.trim(),
        category,
        badge_type: badgeType,
        action_button_text: actionButtonText.trim() || undefined,
        action_button_type: badgeType === 'urgent' ? 'danger' : 'primary',
      };

      const res = await api.createTargetedNotification(payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Notification dispatched successfully to target audience.');
        setTitle('');
        setDescription('');
        setActionButtonText('');
        fetchHistory();
        if (onNotificationSent) onNotificationSent();
      } else {
        setFormError(res.error || 'Failed to dispatch notification.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error occurred dispatching notification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteError(null);
    setDeletingId(id);
    try {
      const res = await api.deleteTargetedNotification(id);
      if (res.success) {
        setHistoryList((prev) => prev.filter((item) => item.id !== id));
        setSuccessMsg(`Targeted notification #${id} deleted successfully.`);
      } else {
        setDeleteError(res.error || 'Failed to delete notification.');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Error deleting notification.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = historyList.filter((item) => {
    if (historyFilterType !== 'ALL' && item.target_type !== historyFilterType) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchVal = (item.target_value || '').toLowerCase().includes(q);
      const matchCreator = (item.created_by || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchVal && !matchCreator) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase border border-indigo-400/30 mb-2.5">
              <Bell className="w-3.5 h-3.5" />
              Phase 4.3D Targeted Dispatch
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Targeted Campus Notifications & Broadcasts
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Dispatch high-priority announcements and notices filtered by individual student, branch, year of study,
              graduating batch, hostel hall, or registered student club.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('compose');
                setSuccessMsg(null);
                setFormError(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compose'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Compose New
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Broadcast Logs ({historyList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-emerald-800 font-bold underline hover:text-emerald-950 text-xs cursor-pointer"
          >
            View in Logs &rarr;
          </button>
        </div>
      )}

      {/* TAB 1: COMPOSE NOTIFICATION */}
      {activeTab === 'compose' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              Compose Targeted Announcement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select audience targeting criteria. The server verifies student memberships deterministically without data duplication.
            </p>
          </div>

          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Target Audience Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {TARGET_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = targetType === t.type;
                  return (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => handleTargetTypeChange(t.type)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200/60 shadow-xs'
                          : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-xs font-extrabold block text-slate-900 leading-tight">
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Target Value Specification (when not ALL) */}
            {targetType !== 'ALL' && (
              <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-900 block">
                    Select or Enter {TARGET_TYPES.find((t) => t.type === targetType)?.label}{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    Target: {targetType}
                  </span>
                </div>

                {/* Quick suggestion chips */}
                {targetType === 'BRANCH' && options.branches.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.branches.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setTargetValue(b)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
                          targetValue === b
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}

                {targetType === 'YEAR' && (
                  <div className="flex flex-wrap gap-1.5">
                    {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setTargetValue(y)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                          targetValue === y
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}

                {targetType === 'BATCH' && (
                  <div className="flex flex-wrap gap-1.5">
                    {['2021-2025', '2022-2026', '2023-2027', '2024-2028'].map((bt) => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => setTargetValue(bt)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                          targetValue === bt
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                )}

                {targetType === 'HOSTEL' && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.hostels.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTargetValue(h)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
                          targetValue === h
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}

                {targetType === 'GROUP' && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.groups.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setTargetValue(g)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
                          targetValue === g
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}

                {targetType === 'STUDENT' && options.students.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {options.students.map((s) => (
                      <button
                        key={s.student_id || s.id}
                        type="button"
                        onClick={() => setTargetValue(s.student_id || s.id)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
                          targetValue === (s.student_id || s.id)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.name} ({s.student_id || s.id})
                      </button>
                    ))}
                  </div>
                )}

                {/* Direct Text Input for Target */}
                <input
                  type="text"
                  placeholder={`Enter specific ${targetType.toLowerCase()} value...`}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
            )}

            {/* 3. Title & Description */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Notification Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Change for Computer Networks Lab, Hostel Maintenance..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {title.length} / 150 characters
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Announcement Body / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed message text, location, guidelines, or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={800}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {description.length} / 800 characters
                </span>
              </div>
            </div>

            {/* 4. Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Priority / Badge Type</label>
                <select
                  value={badgeType}
                  onChange={(e) => setBadgeType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {BADGE_TYPES.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Optional Action Button Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Call-to-Action Button Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. View Timetable, Confirm Attendance, Submit Form"
                value={actionButtonText}
                onChange={(e) => setActionButtonText(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Dispatch Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting
                ? 'Dispatching Announcement...'
                : `Publish & Dispatch to ${TARGET_TYPES.find((t) => t.type === targetType)?.label}`}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: BROADCAST LOGS & READ METRICS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Targeted Broadcast Delivery Logs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of sent notifications, target audience tags, delivery status, and student read receipts.
              </p>
            </div>

            <button
              onClick={fetchHistory}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>

          {/* Delete Error Message */}
          {deleteError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by title, target value, or author..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none"
              />
            </div>

            <select
              value={historyFilterType}
              onChange={(e) => setHistoryFilterType(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Target Types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Broadcast List */}
          {isLoadingHistory ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs">Loading broadcast logs...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-200">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No broadcasts found</p>
              <p className="text-[11px] text-slate-400 mt-1">Compose a new targeted announcement above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.target_type === 'ALL'
                          ? 'ALL CAMPUS'
                          : `${item.target_type}: ${item.target_value}`}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.badge_type === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {item.badge_label || item.category}
                      </span>

                      <span className="text-[10px] font-semibold text-slate-400">
                        Delivered
                      </span>

                      {item.read_count !== undefined && item.read_count > 0 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {item.read_count} read
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>

                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 pt-1">
                      <span>Author: <strong className="text-slate-600">{item.created_by}</strong></span>
                      <span>•</span>
                      <span>Dispatched: {item.created_at}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete targeted announcement"
                  >
                    {deletingId === item.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

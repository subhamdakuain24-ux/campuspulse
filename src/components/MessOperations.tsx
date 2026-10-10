import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  Sparkles,
  Flame,
  ChevronRight,
  User,
  Coffee,
  Sun,
  Cookie,
  Moon,
  Info,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  UserProfile,
  MessMenuItem,
  MessFeedbackItem,
  MessFeedbackStats,
  MealType,
  FeedbackCategory,
  CreateMessMenuItemPayload,
  CreateMessFeedbackPayload,
} from '../types';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

interface MessOperationsProps {
  user: UserProfile;
  isStaffOrAdmin: boolean;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

const FEEDBACK_CATEGORIES: Array<{ key: FeedbackCategory; label: string }> = [
  { key: 'FOOD_QUALITY', label: 'Food Quality' },
  { key: 'TASTE', label: 'Taste & Seasoning' },
  { key: 'HYGIENE', label: 'Hygiene & Cleanliness' },
  { key: 'QUANTITY', label: 'Portion & Quantity' },
  { key: 'TIMING', label: 'Service Timings' },
  { key: 'SERVICE', label: 'Staff Service' },
  { key: 'OTHER', label: 'General / Other' },
];

export const MessOperations: React.FC<MessOperationsProps> = ({ user, isStaffOrAdmin }) => {
  const { t, translateStatus } = useTranslation();
  // Determine current day of week to set as initial day
  const todayDayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date().getDay();
    return days[d] as typeof DAYS_OF_WEEK[number];
  }, []);

  // View modes
  const [selectedDay, setSelectedDay] = useState<string>(todayDayName);
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'feedback_submit' | 'feedback_admin' | 'my_feedback'>(
    isStaffOrAdmin ? 'menu' : 'menu'
  );

  // Data states
  const [menuItems, setMenuItems] = useState<MessMenuItem[]>([]);
  const [feedbackList, setFeedbackList] = useState<MessFeedbackItem[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<MessFeedbackStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Student Feedback Form State
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<FeedbackCategory>('FOOD_QUALITY');
  const [comments, setComments] = useState<string>('');
  const [mealType, setMealType] = useState<MealType | 'GENERAL'>('GENERAL');
  const [mealDate, setMealDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Admin Feedback Filter State
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('ALL');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<string>('ALL');
  const [feedbackMealFilter, setFeedbackMealFilter] = useState<string>('ALL');
  const [feedbackSearch, setFeedbackSearch] = useState<string>('');

  // Admin Menu Modal States
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MessMenuItem | null>(null);
  const [formDay, setFormDay] = useState<string>('Monday');
  const [formMealType, setFormMealType] = useState<MealType>('BREAKFAST');
  const [formItems, setFormItems] = useState<string>('');
  const [formTimings, setFormTimings] = useState<string>('07:30 AM - 09:30 AM');
  const [formDietary, setFormDietary] = useState<string>('Vegetarian');
  const [formSpecialNote, setFormSpecialNote] = useState<string>('');
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [menuFormError, setMenuFormError] = useState<string | null>(null);

  // Fetch Menu and Feedback
  const loadMessData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [menuRes, feedbackRes] = await Promise.all([
        api.getMessMenu(),
        api.getMessFeedback({
          category: feedbackCategoryFilter,
          rating: feedbackRatingFilter,
          meal_type: feedbackMealFilter,
          search: feedbackSearch,
        }),
      ]);
      setMenuItems(menuRes.menu || []);
      setFeedbackList(feedbackRes.feedback || []);
      setFeedbackStats(feedbackRes.stats || null);
    } catch (err: any) {
      console.warn('[MessOperations] Failed to load mess data:', err);
      setApiError(err?.message || 'Failed to load mess data from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessData(true);
  }, [feedbackCategoryFilter, feedbackRatingFilter, feedbackMealFilter]);

  // Current day's menu items grouped by meal type
  const dayMenuMap = useMemo(() => {
    const map: Record<MealType, MessMenuItem | undefined> = {
      BREAKFAST: undefined,
      LUNCH: undefined,
      SNACKS: undefined,
      DINNER: undefined,
    };
    menuItems
      .filter((m) => m.day_of_week.toLowerCase() === selectedDay.toLowerCase())
      .forEach((m) => {
        map[m.meal_type] = m;
      });
    return map;
  }, [menuItems, selectedDay]);

  // Handle student feedback submission
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccessMsg(null);

    if (!comments.trim()) {
      setFeedbackError('Please share your comments or feedback details.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const payload: CreateMessFeedbackPayload = {
        rating,
        category,
        comments: comments.trim(),
        meal_type: mealType,
        meal_date: mealDate,
      };
      const res = await api.submitMessFeedback(payload);
      if (res.success && res.feedback) {
        setFeedbackSuccessMsg('Thank you! Your feedback has been recorded.');
        setComments('');
        // Refresh feedback lists
        loadMessData(false);
      } else {
        setFeedbackError(res.error || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      setFeedbackError(err?.message || 'Error occurred submitting feedback.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Open modal to create or edit menu entry
  const handleOpenMenuModal = (item?: MessMenuItem) => {
    setMenuFormError(null);
    if (item) {
      setEditingMenuItem(item);
      setFormDay(item.day_of_week);
      setFormMealType(item.meal_type);
      setFormItems(item.items);
      setFormTimings(item.timings);
      setFormDietary(item.dietary_info || 'Vegetarian');
      setFormSpecialNote(item.special_note || '');
    } else {
      setEditingMenuItem(null);
      setFormDay(selectedDay);
      setFormMealType('BREAKFAST');
      setFormItems('');
      setFormTimings('07:30 AM - 09:30 AM');
      setFormDietary('Vegetarian');
      setFormSpecialNote('');
    }
    setMenuModalOpen(true);
  };

  // Save menu entry (create or update)
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuFormError(null);

    if (!formItems.trim()) {
      setMenuFormError('Please enter the menu items.');
      return;
    }

    setIsSavingMenu(true);
    try {
      const payload: CreateMessMenuItemPayload = {
        day_of_week: formDay,
        meal_type: formMealType,
        items: formItems.trim(),
        timings: formTimings.trim(),
        dietary_info: formDietary.trim(),
        special_note: formSpecialNote.trim() || undefined,
      };

      let res;
      if (editingMenuItem) {
        res = await api.updateMessMenuItem(editingMenuItem.id, payload);
      } else {
        res = await api.createMessMenuItem(payload);
      }

      if (res.success) {
        setMenuModalOpen(false);
        loadMessData(false);
      } else {
        setMenuFormError(res.error || 'Failed to save menu entry.');
      }
    } catch (err: any) {
      setMenuFormError(err?.message || 'Error saving menu entry.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Delete menu item
  const handleDeleteMenuItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this menu entry?')) return;
    try {
      const res = await api.deleteMessMenuItem(id);
      if (res.success) {
        loadMessData(false);
      } else {
        alert(res.error || 'Failed to delete menu item.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error deleting menu item.');
    }
  };

  // Delete feedback entry
  const handleDeleteFeedback = async (id: number) => {
    if (!window.confirm('Delete this feedback entry?')) return;
    try {
      const res = await api.deleteMessFeedback(id);
      if (res.success) {
        loadMessData(false);
      } else {
        alert(res.error || 'Failed to delete feedback entry.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error deleting feedback.');
    }
  };

  // Helper meal icons
  const getMealIcon = (meal: MealType) => {
    switch (meal) {
      case 'BREAKFAST':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'LUNCH':
        return <Sun className="w-4 h-4 text-orange-600" />;
      case 'SNACKS':
        return <Cookie className="w-4 h-4 text-purple-600" />;
      case 'DINNER':
        return <Moon className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold tracking-wide uppercase border border-orange-400/30 mb-2.5">
              <UtensilsCrossed className="w-3.5 h-3.5" />
              {t('mess.title', 'Campus Dining & Hostel Mess')}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {isStaffOrAdmin ? t('mess.title', 'Mess Menu & Student Feedback Management') : t('mess.title', 'Hostel Mess Menu & Dining Feedback')}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {isStaffOrAdmin
                ? t('mess.subtitle', 'Update daily meal schedules across Breakfast, Lunch, Snacks, and Dinner. Track student ratings, review hygiene concerns, and analyze repeated complaints.')
                : t('mess.subtitle', 'Check weekly meal schedules, timings, and dietary details. Rate your meals and submit feedback directly to the hostel mess committee.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadMessData(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title={t('common.refresh', 'Refresh mess data')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('common.refresh', 'Sync')}
            </button>

            {isStaffOrAdmin && (
              <button
                onClick={() => handleOpenMenuModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Meal Entry
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('menu')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'menu'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {t('mess.todaysMenu', 'Weekly Menu Schedule')}
          </button>

          {!isStaffOrAdmin && (
            <button
              onClick={() => setActiveSubTab('feedback_submit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'feedback_submit'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              {t('mess.messFeedback', 'Rate / Submit Feedback')}
            </button>
          )}

          {!isStaffOrAdmin && (
            <button
              onClick={() => setActiveSubTab('my_feedback')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'my_feedback'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              My Feedback History ({feedbackList.length})
            </button>
          )}

          {isStaffOrAdmin && (
            <button
              onClick={() => setActiveSubTab('feedback_admin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'feedback_admin'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Student Feedback & Reviews ({feedbackList.length})
              {feedbackStats?.repeated_issues && feedbackStats.repeated_issues.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => loadMessData(true)}
            className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-600" />
          <p className="text-xs font-semibold">Loading mess data...</p>
        </div>
      )}

      {/* SUBTAB 1: WEEKLY MESS MENU */}
      {!isLoading && activeSubTab === 'menu' && (
        <div className="space-y-4">
          {/* Day of Week Selector */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDay === day;
              const isToday = day === todayDayName;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                        isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Meals for Selected Day Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_TYPES.map((meal) => {
              const item = dayMenuMap[meal];
              const mealLabel = meal.charAt(0) + meal.slice(1).toLowerCase();

              return (
                <div
                  key={meal}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                          {getMealIcon(meal)}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">{mealLabel}</h4>
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item?.timings || 'Timings TBC'}
                          </span>
                        </div>
                      </div>

                      {item?.dietary_info && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.dietary_info.toLowerCase().includes('non-veg') || item.dietary_info.toLowerCase().includes('mixed')
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.dietary_info}
                        </span>
                      )}
                    </div>

                    {/* Special Note Badge if present */}
                    {item?.special_note && (
                      <div className="mb-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        {item.special_note}
                      </div>
                    )}

                    {/* Items List */}
                    <div className="my-2 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 min-h-[90px]">
                      {item?.items ? (
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {item.items}
                        </p>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-3">
                          <UtensilsCrossed className="w-5 h-5 text-slate-300 mb-1" />
                          <p className="text-[11px]">Menu entry not updated yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {isStaffOrAdmin ? (
                      <div className="flex items-center justify-between w-full">
                        <button
                          type="button"
                          onClick={() => handleOpenMenuModal(item)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          {item ? 'Edit Entry' : 'Create Entry'}
                        </button>
                        {item && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                            title="Delete menu entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMealType(meal);
                          setActiveSubTab('feedback_submit');
                        }}
                        className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        Rate this {mealLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SUBMIT MESS FEEDBACK (STUDENT) */}
      {!isLoading && activeSubTab === 'feedback_submit' && !isStaffOrAdmin && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Submit Mess & Dining Feedback
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Your feedback is securely recorded under your student account ({user.name} • {user.studentId}) and reviewed by the hostel mess warden.
            </p>
          </div>

          {feedbackSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('my_feedback')}
                className="font-bold underline text-emerald-900"
              >
                View in History &rarr;
              </button>
            </div>
          )}

          {feedbackError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitFeedback} className="space-y-5">
            {/* Star Rating Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Overall Meal Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {rating === 1 && '1 Star — Poor'}
                  {rating === 2 && '2 Stars — Fair'}
                  {rating === 3 && '3 Stars — Good'}
                  {rating === 4 && '4 Stars — Very Good'}
                  {rating === 5 && '5 Stars — Excellent'}
                </span>
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Feedback Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      category === cat.key
                        ? 'bg-orange-50 border-orange-300 text-orange-900 ring-1 ring-orange-200'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Type and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Meal Service</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="GENERAL">General / Any Meal</option>
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACKS">Snacks & Tea</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Date of Meal</label>
                <input
                  type="date"
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Comments Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Comments & Suggestions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Describe food taste, cleanliness of utensils, refilling delays, or items that need attention..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={800}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                {comments.length} / 800 characters
              </span>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmittingFeedback}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmittingFeedback ? 'Recording Feedback...' : 'Submit Mess Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 3: MY FEEDBACK HISTORY (STUDENT) */}
      {!isLoading && activeSubTab === 'my_feedback' && !isStaffOrAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-600" />
              My Submitted Mess Reviews ({feedbackList.length})
            </h3>
            <button
              onClick={() => setActiveSubTab('feedback_submit')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              + Submit New
            </button>
          </div>

          {feedbackList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No feedback submitted yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Share your meal experience to help improve campus dining.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('feedback_submit')}
                className="mt-3 px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold"
              >
                Submit Feedback
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= fb.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">
                          {fb.rating}.0
                        </span>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {fb.category.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-medium mb-3">
                      "{fb.comments}"
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">
                      Meal: <strong className="text-slate-700">{fb.meal_type}</strong> • {fb.meal_date}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFeedback(fb.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete this feedback"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: ADMIN FEEDBACK MANAGEMENT & ANALYTICS */}
      {!isLoading && activeSubTab === 'feedback_admin' && isStaffOrAdmin && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          {feedbackStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Average Rating</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900">{feedbackStats.average_rating}</span>
                  <div className="flex items-center text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Across {feedbackStats.total_feedback} student ratings</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Reviews</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{feedbackStats.total_feedback}</span>
                  <span className="text-xs text-slate-500">Submissions</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Active collection</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">Repeated Concerns</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-900">
                    {feedbackStats.repeated_issues.length}
                  </span>
                  <span className="text-xs text-rose-700">Patterns</span>
                </div>
                <span className="text-[10px] text-rose-600 font-semibold">Deterministic clusters</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">Rating Spread</span>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-extrabold text-slate-700">
                  <span className="text-emerald-700">5★: {feedbackStats.rating_distribution[5] || 0}</span>
                  <span>•</span>
                  <span className="text-blue-700">4★: {feedbackStats.rating_distribution[4] || 0}</span>
                  <span>•</span>
                  <span className="text-rose-700">≤2★: {(feedbackStats.rating_distribution[1] || 0) + (feedbackStats.rating_distribution[2] || 0)}</span>
                </div>
                <span className="text-[10px] text-slate-400">Distribution count</span>
              </div>
            </div>
          )}

          {/* Repeated Mess Issues Panel (Deterministic Backend Clustering) */}
          {feedbackStats?.repeated_issues && feedbackStats.repeated_issues.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-50/50 via-white to-white border border-rose-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Deterministic Repeated Mess Issues Identified
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {feedbackStats.repeated_issues.length} Issue Hotspots
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {feedbackStats.repeated_issues.map((iss) => (
                  <div key={iss.id} className="p-3.5 rounded-2xl bg-white border border-rose-200/80 shadow-xs">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-xs font-bold text-slate-900">{iss.category_label}</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                        {iss.count} Complaints
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Meal affected: <strong className="text-slate-800">{iss.meal_type}</strong>
                    </p>
                    {iss.sample_comments.length > 0 && (
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 italic">
                        "{iss.sample_comments[0]}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search feedback comments, student name, ID..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={feedbackCategoryFilter}
              onChange={(e) => setFeedbackCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              {FEEDBACK_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={feedbackRatingFilter}
              onChange={(e) => setFeedbackRatingFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={feedbackMealFilter}
              onChange={(e) => setFeedbackMealFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="ALL">All Meals</option>
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="SNACKS">Snacks</option>
              <option value="DINNER">Dinner</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          {/* Feedback List */}
          <div className="space-y-3">
            {feedbackList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <p className="text-xs font-semibold">No feedback records match filters</p>
              </div>
            ) : (
              feedbackList.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">{fb.rating}.0</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {fb.category.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        Meal: {fb.meal_type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      "{fb.comments}"
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Submitted by: <strong className="text-slate-600">{fb.student_name}</strong> ({fb.student_identifier})</span>
                      <span>•</span>
                      <span>Date: {fb.meal_date}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFeedback(fb.id)}
                    className="self-end sm:self-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete feedback entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT MENU ENTRY MODAL (ADMIN) */}
      {menuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                {editingMenuItem ? 'Edit Menu Entry' : 'Create New Menu Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setMenuModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {menuFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {menuFormError}
              </div>
            )}

            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Meal Service</label>
                  <select
                    value={formMealType}
                    onChange={(e) => setFormMealType(e.target.value as MealType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="SNACKS">Snacks & Tea</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Menu Items <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Masala Dosa, Sambar, Coconut Chutney, Bread Butter, Tea / Coffee"
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Service Timings</label>
                  <input
                    type="text"
                    placeholder="e.g. 07:30 AM - 09:30 AM"
                    value={formTimings}
                    onChange={(e) => setFormTimings(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Dietary Flag</label>
                  <select
                    value={formDietary}
                    onChange={(e) => setFormDietary(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Mixed">Mixed (Veg & Non-Veg)</option>
                    <option value="Non-Vegetarian Options Available">Non-Veg Available</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Special Tag / Chef's Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. South Indian Special, Sweet: Gulab Jamun"
                  value={formSpecialNote}
                  onChange={(e) => setFormSpecialNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMenu}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  {isSavingMenu ? 'Saving...' : editingMenuItem ? 'Update Menu Entry' : 'Create Menu Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

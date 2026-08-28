import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  FileText,
  Building,
  CreditCard,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Trash2,
  X,
} from 'lucide-react';
import { initialNotifications } from '../data/mockData';
import { NotificationItem } from '../types';

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDetailItem, setActiveDetailItem] = useState<NotificationItem | null>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'alerts') return item.category === 'alerts' || item.badgeType === 'urgent';
    if (selectedCategory === 'exams') return item.category === 'exams';
    if (selectedCategory === 'academic') return item.category === 'academic';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Section (Page 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread messages.`
              : 'All caught up! No unread messages.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* 2-Column Layout (Page 8): Category Filters (Left) & Notification Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Category Menu (Page 8 Left) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-3 sm:p-4 border border-slate-100/90 shadow-xs space-y-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4" />
              <span>All Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory('alerts')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'alerts'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alerts</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedCategory('exams')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'exams'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>Exams</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedCategory('academic')}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'academic'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Academic</span>
            </div>
          </button>
        </div>

        {/* Right Notification Feed (Page 8 Right) */}
        <div className="lg:col-span-9 space-y-3.5">
          {filteredNotifications.map((item) => {
            const isUrgent = item.badgeType === 'urgent';
            const isAssignment = item.badgeType === 'assignment';
            const isCampus = item.badgeType === 'campus';
            const isSystem = item.badgeType === 'system';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleMarkAsRead(item.id)}
                className={`relative bg-white rounded-2xl p-5 sm:p-6 border shadow-2xs transition-all ${
                  isUrgent
                    ? 'border-l-4 border-l-red-600 border-slate-100 bg-red-50/5'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Unread Blue Dot Marker */}
                {item.unread && (
                  <span className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                )}

                <div className="flex items-start gap-4">
                  {/* Category / Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isUrgent
                        ? 'bg-red-50 text-red-600'
                        : isAssignment
                        ? 'bg-blue-50 text-blue-600'
                        : isCampus
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {isUrgent ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : isAssignment ? (
                      <FileText className="w-5 h-5" />
                    ) : isCampus ? (
                      <Building className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    {/* Badge & Timestamp Row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isUrgent
                            ? 'bg-red-100 text-red-700'
                            : isAssignment
                            ? 'bg-blue-100 text-blue-700'
                            : isCampus
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.badgeLabel}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">• {item.timeAgo}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      {item.description}
                    </p>

                    {/* Action Button if specified (e.g., View Details in red button for Urgent) */}
                    {item.actionButtonText && (
                      <div className="mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDetailItem(item);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                            item.actionButtonType === 'danger'
                              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {item.actionButtonText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {activeDetailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider">
                      URGENT NOTICE
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{activeDetailItem.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDetailItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 space-y-2 border border-slate-200/60 leading-relaxed">
                <p>
                  <strong>Course:</strong> MATH301: Advanced Calculus
                </p>
                <p>
                  <strong>New Location:</strong> Hall B (Main Building, Ground Floor)
                </p>
                <p>
                  <strong>Exam Time:</strong> Oct 26, 2023 at 10:00 AM
                </p>
                <p className="text-slate-500 pt-1 border-t border-slate-200/50">
                  Please bring your student ID card and reporting slip. Contact the invigilation desk
                  at extension #402 for disability accommodations.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveDetailItem(null)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

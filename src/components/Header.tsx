import React, { useState } from 'react';
import { Search, Bell, Sparkles, LogOut, User as UserIcon, Menu } from 'lucide-react';
import { ScreenId, UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onLogout: () => void;
  unreadCount?: number;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentScreen,
  onNavigate,
  onLogout,
  unreadCount = 3,
  onToggleMobileMenu,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const screenNames: Record<ScreenId, string> = {
    login: 'Login',
    dashboard: 'Student Dashboard',
    attendance: 'Attendance Tracker',
    exams: 'Examination Center',
    timetable: 'Weekly Timetable',
    assignments: 'Coursework & Assignments',
    operations: 'Campus Operations',
    notifications: 'Notifications & Alerts',
    profile: 'Student Profile',
    'ai-chat': 'AI Academic Assistant',
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigate('ai-chat');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumbs Navigation */}
        <div className="flex items-center text-xs text-slate-500 font-medium truncate">
          <span className="text-slate-400 hidden sm:inline">University Portal</span>
          <span className="mx-2 text-slate-300 hidden sm:inline">/</span>
          <span className="text-slate-900 font-bold text-sm sm:text-base tracking-tight truncate">
            {screenNames[currentScreen] || 'Dashboard'}
          </span>
        </div>
      </div>

      {/* Right Controls: Search, AI button, Notifications, User */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Search bar with pill shape and subtle border */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative hidden md:flex items-center h-9 w-48 lg:w-64 bg-slate-100/90 rounded-full px-3.5 border border-slate-200/60 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 transition-all"
        >
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            id="header-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full text-xs bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </form>

        {/* Quick AI Trigger */}
        <button
          onClick={() => onNavigate('ai-chat')}
          title="Ask AI Assistant"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold border border-blue-100 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">AI Help</span>
        </button>

        {/* Notifications button with dot */}
        <button
          id="header-btn-notifications"
          onClick={() => onNavigate('notifications')}
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            id="header-btn-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 hover:ring-2 hover:ring-blue-500/30 transition-all focus:outline-none cursor-pointer"
          >
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <span className={`hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              user.role === 'Admin'
                ? 'bg-purple-100 text-purple-700 border-purple-200'
                : user.role === 'Teacher'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}>
              {user.role}
            </span>
          </button>

          {/* Menu Popover */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                      user.role === 'Admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : user.role === 'Teacher'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{user.studentId}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] text-emerald-600 font-medium">Active Session ({user.role})</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

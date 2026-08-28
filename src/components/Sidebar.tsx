import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  GraduationCap,
  CalendarDays,
  FileText,
  Bell,
  User,
  Sparkles,
  Settings,
  LogOut,
} from 'lucide-react';
import { ScreenId } from '../types';
import { CampusPulseLogo } from './CampusPulseLogo';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onLogout: () => void;
  unreadCount?: number;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  onLogout,
  unreadCount = 3,
  onOpenSettings,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance' as ScreenId,
      label: 'Attendance',
      icon: UserCheck,
    },
    {
      id: 'exams' as ScreenId,
      label: 'Exams',
      icon: GraduationCap,
    },
    {
      id: 'timetable' as ScreenId,
      label: 'Timetable',
      icon: CalendarDays,
    },
    {
      id: 'assignments' as ScreenId,
      label: 'Assignments',
      icon: FileText,
    },
    {
      id: 'notifications' as ScreenId,
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'profile' as ScreenId,
      label: 'Profile',
      icon: User,
    },
    {
      id: 'ai-chat' as ScreenId,
      label: 'AI Assistant',
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-all duration-300">
      {/* Header Brand */}
      <div>
        <div className="px-6 py-6 border-b border-slate-800/80">
          <div
            onClick={() => onNavigate('dashboard')}
            className="cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
          >
            <CampusPulseLogo size="md" subtitle="University Portal" white={true} />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-600/15 border-l-4 border-blue-500 text-blue-400 rounded-r-xl rounded-l-none font-semibold shadow-xs'
                    : item.highlight
                    ? 'text-indigo-400 hover:bg-slate-800 hover:text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800/90 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive
                        ? 'text-blue-400'
                        : item.highlight
                        ? 'text-indigo-400 group-hover:text-indigo-300'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-red-500 text-white shadow-xs animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.highlight && !item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Smart
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/70 border border-slate-700/60 rounded-xl">
          <div
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border border-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              AJ
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                Alex Johnson
              </p>
              <p className="text-[10px] text-slate-400 truncate">CS • 5th Semester</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="sidebar-btn-settings"
              onClick={() => {
                if (onOpenSettings) onOpenSettings();
                else onNavigate('profile');
              }}
              title="Settings"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              id="sidebar-btn-logout"
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

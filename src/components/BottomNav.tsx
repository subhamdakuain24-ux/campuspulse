import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  GraduationCap,
  CalendarDays,
  FileText,
  Bell,
  Sparkles,
} from 'lucide-react';
import { ScreenId } from '../types';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  unreadCount = 0,
}) => {
  const items = [
    { id: 'dashboard' as ScreenId, label: 'Home', icon: LayoutDashboard },
    { id: 'attendance' as ScreenId, label: 'Attend', icon: UserCheck },
    { id: 'timetable' as ScreenId, label: 'Schedule', icon: CalendarDays },
    { id: 'assignments' as ScreenId, label: 'Tasks', icon: FileText },
    { id: 'exams' as ScreenId, label: 'Exams', icon: GraduationCap },
    { id: 'notifications' as ScreenId, label: 'Alerts', icon: Bell, badge: unreadCount },
    { id: 'ai-chat' as ScreenId, label: 'AI Bot', icon: Sparkles, highlight: true },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-blue-600 font-bold scale-105'
                  : item.highlight
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

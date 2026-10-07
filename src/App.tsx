import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScreenId, UserProfile, UserRole } from './types';
import { initialUserProfile } from './data/mockData';
import { api } from './services/api';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { AttendanceScreen } from './screens/AttendanceScreen';
import { ExamsScreen } from './screens/ExamsScreen';
import { TimetableScreen } from './screens/TimetableScreen';
import { AssignmentsScreen } from './screens/AssignmentsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AIAssistantScreen } from './screens/AIAssistantScreen';
import { OperationsScreen } from './screens/OperationsScreen';
import { FeesOperations } from './components/FeesOperations';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { X } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('login');
  const [user, setUser] = useState<UserProfile>(initialUserProfile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize session verification on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const authData = await api.getAuthMe();
        if (authData && authData.authenticated && authData.profile) {
          setUser(authData.profile);
        }
      } catch (err) {
        console.warn('[App] Session check error:', err);
      }
    };
    checkActiveSession();
  }, []);

  const handleLoginSuccess = (role: UserRole, profile?: UserProfile) => {
    if (profile) {
      setUser(profile);
    } else {
      setUser((prev) => ({
        ...prev,
        role,
      }));
    }
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('[App] Error during logout:', err);
    }
    setUser(initialUserProfile);
    setCurrentScreen('login');
    setMobileMenuOpen(false);
  };

  const handleNavigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
  };

  // If user is on Login Screen, render Login Experience
  if (currentScreen === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Desktop Sidebar (Page 3 - 9) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          unreadCount={3}
          onOpenSettings={() => handleNavigate('profile')}
          user={user}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-72 bg-slate-900 h-full shadow-2xl z-10 flex flex-col justify-between border-r border-slate-800"
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Menu
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  currentScreen={currentScreen}
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                  unreadCount={3}
                  onOpenSettings={() => handleNavigate('profile')}
                  user={user}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Header Bar */}
        <Header
          user={user}
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          unreadCount={3}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Screen Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {currentScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} />}
              {currentScreen === 'attendance' && <AttendanceScreen />}
              {currentScreen === 'exams' && <ExamsScreen />}
              {currentScreen === 'timetable' && <TimetableScreen />}
              {currentScreen === 'assignments' && <AssignmentsScreen />}
              {currentScreen === 'operations' && (
                <OperationsScreen
                  user={user}
                  onNavigateToNotifications={() => handleNavigate('notifications')}
                />
              )}
              {currentScreen === 'notifications' && (
                <NotificationsScreen user={user} onNavigate={handleNavigate} />
              )}
              {currentScreen === 'profile' && (
                <ProfileScreen user={user} onUpdateUser={handleUpdateUser} />
              )}
              {currentScreen === 'fees' && (
                <FeesOperations
                  user={user}
                  isStaffOrAdmin={user.role === 'Admin' || user.role === 'Teacher'}
                />
              )}
              {currentScreen === 'ai-chat' && <AIAssistantScreen />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          unreadCount={3}
        />
      </div>
    </div>
  );
}

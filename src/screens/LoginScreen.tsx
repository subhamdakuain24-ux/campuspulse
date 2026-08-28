import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock, User, HelpCircle, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CampusPulseLogo } from '../components/CampusPulseLogo';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');
  const [identifier, setIdentifier] = useState('CP-847291');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Background floating particles state
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>
  >([]);

  useEffect(() => {
    // Generate soft blue floating ambient orbs
    const newParticles = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 70 + 20,
      delay: Math.random() * 4,
      duration: Math.random() * 10 + 12,
    }));
    setParticles(newParticles);
  }, []);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      return;
    }

    setIsLoading(true);

    // Simulate authentic authentication verification
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#2563EB', '#3B82F6', '#60A5FA', '#10B981'],
      });

      // Complete login transition
      setTimeout(() => {
        onLoginSuccess(selectedRole);
      }, 700);
    }, 850);
  };

  const handleQuickDemoFill = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'Student') {
      setIdentifier('CP-847291');
      setPassword('password123');
    } else if (role === 'Teacher') {
      setIdentifier('FAC-4019');
      setPassword('profPass2023');
    } else {
      setIdentifier('ADM-9901');
      setPassword('adminMaster');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 p-4">
      {/* Background Animated Bokeh / Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0.2, y: 0, x: 0 }}
            animate={{
              opacity: [0.15, 0.45, 0.15],
              y: [-25, 25, -25],
              x: [-20, 20, -20],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
            className="rounded-full bg-gradient-to-tr from-blue-300/30 to-indigo-300/30 blur-2xl pointer-events-none"
          />
        ))}

        {/* Soft Radial Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={
          isSuccess
            ? { opacity: 0.9, scale: 1.02, filter: 'blur(0.5px)' }
            : isShaking
            ? { x: [-10, 10, -8, 8, -4, 4, 0] }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[430px] bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(37,99,235,0.08)] border border-slate-100 backdrop-blur-sm"
      >
        {/* Top Logo Entrance */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
            className="mb-1"
          >
            <CampusPulseLogo size="lg" showText={false} pulseAnimated={true} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1"
          >
            Campus<span className="text-blue-600">Pulse</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs sm:text-sm text-slate-500 font-medium mt-1 mb-6"
          >
            Your Smart Academic Assistant
          </motion.p>
        </div>

        {/* Role Switcher Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-xl mb-6 text-xs font-semibold text-slate-600"
        >
          {(['Student', 'Teacher', 'Admin'] as UserRole[]).map((role) => {
            const isActive = selectedRole === role;
            return (
              <button
                key={role}
                type="button"
                id={`login-role-tab-${role.toLowerCase()}`}
                onClick={() => handleQuickDemoFill(role)}
                className={`relative py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeRoleIndicator"
                    className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                {role}
              </button>
            );
          })}
        </motion.div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Identifier Input */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="login-identifier"
              className="block text-xs font-semibold text-slate-700"
            >
              {selectedRole} ID or Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  selectedRole === 'Student'
                    ? 'e.g. 12345678 or name@edu.com'
                    : selectedRole === 'Teacher'
                    ? 'e.g. FAC-4019 or prof@edu.com'
                    : 'e.g. admin@campuspulse.edu'
                }
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs font-mono"
                required
              />
              <button
                type="button"
                id="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="login-remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 focus:ring-offset-0 transition-colors"
              />
              <span className="text-xs text-slate-600 font-medium">Remember me</span>
            </label>

            <button
              type="button"
              id="login-btn-forgot-password"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <motion.button
              type="submit"
              id="login-btn-submit"
              disabled={isLoading || isSuccess}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/25 hover:shadow-blue-500/40'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Welcome Back!</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </motion.button>
          </div>
        </form>

        {/* Footer Support Link */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Need help accessing your account?{' '}
            <button
              type="button"
              id="login-btn-contact-support"
              onClick={() => setShowHelpModal(true)}
              className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              Contact IT Support
            </button>
          </p>
        </div>

        {/* Demo Fast Login Helper */}
        <div className="mt-4 p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/80 flex items-center justify-between text-[11px] text-blue-700">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Quick Demo: Click <strong>Login</strong> directly to enter Alex&apos;s portal
          </span>
          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100"
            >
              <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your institutional email to receive a password reset link.
              </p>

              {forgotSent ? (
                <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
                  ✓ Reset link sent to <strong>{forgotEmail || 'your email'}</strong>. Please check your inbox.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@campuspulse.edu"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <button
                    onClick={() => setForgotSent(true)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Send Recovery Link
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="mt-4 w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IT Support Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Campus IT Helpdesk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For login issues, credential resets, or 2FA assistance, contact campus support:
              </p>
              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-700 font-medium">
                <p>📍 Location: Tech Wing, Room 102</p>
                <p>📞 Phone: +1 (555) 019-HELP</p>
                <p>✉️ Email: it-support@campuspulse.edu</p>
                <p>⏰ Hours: Mon-Fri, 8:00 AM – 6:00 PM</p>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

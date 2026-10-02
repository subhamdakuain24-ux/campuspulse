import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  HelpCircle,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CampusPulseLogo } from '../components/CampusPulseLogo';
import { UserRole, UserProfile } from '../types';
import { api } from '../services/api';
import studentCharacterImg from '../assets/images/student_clay_character_1790601134918.jpg';
import pastelCloudImg from '../assets/images/pastel_cloud_elements_1790601145639.jpg';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, profile?: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('Student');
  const [identifier, setIdentifier] = useState('CP-847291');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Image load error fallbacks
  const [characterImgError, setCharacterImgError] = useState(false);

  // Floating ambient clay bubbles
  const [floatingOrbs, setFloatingOrbs] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>
  >([]);

  const [welcomeName, setWelcomeName] = useState<string>('Alex');

  useEffect(() => {
    const bubbles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 40 + Math.random() * 60,
      delay: Math.random() * 3,
      duration: 12 + Math.random() * 8,
    }));
    setFloatingOrbs(bubbles);
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setRoleNotice(null);

    if (role === 'Student') {
      setIdentifier('CP-847291');
      setPassword('password123');
    } else if (role === 'Teacher') {
      setIdentifier('FAC-4019');
      setPassword('password123');
    } else {
      setIdentifier('ADM-9901');
      setPassword('password123');
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || isSuccess) return;

    setErrorMessage(null);

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    // Client validation
    if (!cleanId || !cleanPass) {
      setErrorMessage(`Please provide both your ${selectedRole} ID/email and password.`);
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      // Real API call to multi-role backend: POST /api/auth/login
      const result = await api.login(cleanId, cleanPass, rememberMe);

      setIsLoading(false);
      setIsSuccess(true);
      setWelcomeName(result.profile?.name || cleanId);

      // Celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.62 },
          colors: ['#8B5CF6', '#6366F1', '#A78BFA', '#10B981', '#EC4899'],
        });
      } catch {
        // Confetti fallback
      }

      // Smooth transition to Dashboard with verified backend role & profile
      setTimeout(() => {
        onLoginSuccess(result.role, result.profile);
      }, 750);
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.message || 'Invalid ID/email or password';
      setErrorMessage(msg);
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 550);
  };

  const handleDemoFill = (roleToFill?: UserRole) => {
    const role = roleToFill || selectedRole;
    setSelectedRole(role);
    setErrorMessage(null);
    setRoleNotice(null);
    if (role === 'Student') {
      setIdentifier('CP-847291');
      setPassword('password123');
    } else if (role === 'Teacher') {
      setIdentifier('FAC-4019');
      setPassword('password123');
    } else {
      setIdentifier('ADM-9901');
      setPassword('password123');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden bg-gradient-to-b from-[#EBE5FC] via-[#F3EDFF] to-[#E5DEFF] p-4 py-8 sm:py-12 select-none">
      {/* 3D Soft Background Ambient Scene */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Background Clay Cloud Backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 opacity-35 mix-blend-multiply blur-xs pointer-events-none">
          <img
            src={pastelCloudImg}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Ambient Pastel Gradient Glow Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[420px] h-[420px] rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[480px] h-[480px] rounded-full bg-indigo-200/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[360px] h-[360px] rounded-full bg-pink-100/40 blur-3xl pointer-events-none" />

        {/* Floating Clay Droplets / Orbs */}
        {floatingOrbs.map((orb) => (
          <motion.div
            key={orb.id}
            initial={{ opacity: 0.3, y: 0 }}
            animate={{
              opacity: [0.25, 0.45, 0.25],
              y: [-20, 20, -20],
              x: [-12, 12, -12],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              delay: orb.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
            }}
            className="rounded-full bg-gradient-to-br from-white/70 to-purple-200/50 shadow-[0_8px_20px_rgba(139,92,246,0.08),inset_0_2px_4px_rgba(255,255,255,0.9)] blur-[1px] pointer-events-none"
          />
        ))}

        {/* Subtle Decorative Clay Organic Shapes */}
        <div className="absolute bottom-8 left-8 hidden lg:block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-300/40 to-indigo-200/30 blur-sm shadow-[inset_0_2px_6px_rgba(255,255,255,0.7)]" />
        </div>
        <div className="absolute top-16 right-12 hidden lg:block">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200/40 to-purple-200/30 blur-xs shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]" />
        </div>
      </div>

      {/* Main Centered 3D Card Stage */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/*
          STUDENT CHARACTER ILLUSTRATION
          Positioned ABOVE and partially OVERLAPPING the upper edge of the login card.
          The character features a relaxed leaning/resting pose leaning onto the top ledge.
        */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 -mb-10 sm:-mb-14 flex justify-center w-full pointer-events-none select-none"
        >
          <div className="relative w-52 sm:w-64 md:w-72 filter drop-shadow-[0_18px_25px_rgba(109,40,217,0.22)]">
            {!characterImgError ? (
              <img
                src={studentCharacterImg}
                alt="Friendly student character in 3D clay style leaning on card"
                referrerPolicy="no-referrer"
                onError={() => setCharacterImgError(true)}
                className="w-full h-auto object-contain rounded-t-3xl transform transition-transform duration-300 hover:scale-[1.02]"
              />
            ) : (
              /* High-fidelity CSS/SVG Clay Character Fallback container */
              <div className="w-full h-44 rounded-t-3xl bg-gradient-to-b from-indigo-200 via-purple-100 to-white/90 flex flex-col items-center justify-center p-4 border-2 border-white/80 shadow-[inset_0_3px_6px_rgba(255,255,255,0.9)]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-indigo-500 shadow-md flex items-center justify-center text-white mb-2">
                  <User className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-purple-900">Alex Johnson</span>
                <span className="text-[10px] text-purple-600 font-medium">CampusPulse Student</span>
              </div>
            )}
          </div>
        </motion.div>

        {/*
          3D CLAY LOGIN CARD
          Round corners, multi-layered soft shadows, clay borders & inner specular reflection
        */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={
            isSuccess
              ? { opacity: 0.95, scale: 1.02, filter: 'blur(0.3px)' }
              : isShaking
              ? { x: [-12, 12, -8, 8, -4, 4, 0] }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full bg-white/95 rounded-[36px] pt-12 sm:pt-14 pb-8 px-6 sm:px-9 shadow-[0_30px_70px_-15px_rgba(109,40,217,0.20),0_15px_30px_-8px_rgba(99,102,241,0.12),inset_0_2px_4px_rgba(255,255,255,1)] border border-white/80 backdrop-blur-md"
        >
          {/* Top Brand Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <CampusPulseLogo size="sm" showText={false} pulseAnimated={true} />
              <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-800">
                Campus<span className="text-indigo-600">Pulse</span>
              </h1>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-700 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-5">
              Sign in to your smart student workspace
            </p>
          </div>

          {/* Role Switcher Tabs (Clay Segmented Pill) */}
          <div className="grid grid-cols-3 p-1.5 bg-[#EDE9FE]/80 rounded-2xl mb-5 shadow-[inset_0_2px_4px_rgba(109,40,217,0.06)] border border-purple-100">
            {(['Student', 'Teacher', 'Admin'] as UserRole[]).map((role) => {
              const isActive = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  id={`login-role-tab-${role.toLowerCase()}`}
                  onClick={() => handleRoleSelect(role)}
                  className={`relative py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-white shadow-[0_4px_12px_rgba(99,102,241,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]'
                      : 'text-slate-600 hover:text-indigo-700 hover:bg-white/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {role}
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="mb-4 p-3 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 shadow-xs"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold flex-1">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier Input */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="login-identifier"
                className="block text-xs font-bold text-slate-700"
              >
                {selectedRole} ID or Institutional Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  disabled={isLoading || isSuccess}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. CP-847291 or alex.j@university.edu"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-3 bg-[#F8F6FF] border border-purple-200/70 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  disabled={isLoading || isSuccess}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-[#F8F6FF] border border-purple-200/70 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] font-mono"
                  required
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="login-remember-me"
                  checked={rememberMe}
                  disabled={isLoading || isSuccess}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-purple-300 focus:ring-indigo-500 transition-colors cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-semibold">Remember me</span>
              </label>

              <button
                type="button"
                id="login-btn-forgot-password"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Clay Action Button */}
            <div className="pt-2">
              <motion.button
                type="submit"
                id="login-btn-submit"
                disabled={isLoading || isSuccess}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className={`w-full py-3.5 px-5 rounded-2xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isSuccess
                    ? 'bg-emerald-600 shadow-[0_10px_25px_rgba(16,185,129,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)]'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 shadow-[0_10px_25px_rgba(99,102,241,0.35),inset_0_2px_4px_rgba(255,255,255,0.35)]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Welcome back, {welcomeName}!</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </motion.button>
            </div>
          </form>

          {/* Quick Demo Helper Box */}
          <div className="mt-5 p-3 bg-gradient-to-r from-purple-50 to-indigo-50/70 rounded-2xl border border-purple-100 flex items-center justify-between text-xs text-indigo-900 shadow-2xs">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-indigo-950">{selectedRole} Demo:</span>{' '}
                <span className="font-mono text-[11px] text-indigo-700">
                  {selectedRole === 'Student'
                    ? 'CP-847291 / password123'
                    : selectedRole === 'Teacher'
                    ? 'FAC-4019 / password123'
                    : 'ADM-9901 / password123'}
                </span>
              </div>
            </div>
            <button
              type="button"
              id="login-btn-quick-fill"
              onClick={() => handleDemoFill()}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-purple-200/80 shadow-2xs hover:bg-purple-50 transition-colors cursor-pointer"
            >
              Fill
            </button>
          </div>

          {/* Footer Support Link */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Need assistance?{' '}
              <button
                type="button"
                id="login-btn-contact-support"
                onClick={() => setShowHelpModal(true)}
                className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Campus IT Support
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Reset Student Password</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter your institutional student email to receive a secure recovery link.
              </p>

              {forgotSent ? (
                <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Reset instructions sent to <strong>{forgotEmail || 'alex.j@university.edu'}</strong>.
                  </span>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="alex.j@university.edu"
                    className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    Send Recovery Link
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="mt-4 w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
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
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-3.5"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Campus IT Helpdesk</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                For login questions, forgotten passwords, or authentication assistance:
              </p>
              <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-1.5 text-slate-700 font-medium border border-slate-100">
                <p>📍 Location: Tech Wing, Room 102</p>
                <p>📞 Phone: +1 (555) 019-HELP</p>
                <p>✉️ Email: it-support@campuspulse.edu</p>
                <p>⏰ Hours: Mon-Fri, 8:00 AM – 6:00 PM</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
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

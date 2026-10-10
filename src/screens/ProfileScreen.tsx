import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  QrCode,
  FileText,
  RotateCw,
  Globe,
} from 'lucide-react';
import { UserProfile } from '../types';
import { CampusPulseLogo } from '../components/CampusPulseLogo';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

interface ProfileScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onUpdateUser }) => {
  const { t, translateRole, currentLanguageOption } = useTranslation();
  const [activeTab, setActiveTab] = useState<'Account' | 'Privacy' | 'Notifications'>('Account');
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.campusAddress);

  const [academicAlerts, setAcademicAlerts] = useState(user.preferences.academicAlerts);
  const [profileVisibility, setProfileVisibility] = useState(user.preferences.profileVisibility);
  const [twoFactorAuth, setTwoFactorAuth] = useState(user.preferences.twoFactorAuth);

  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.updateStudentProfile('1', {
        email,
        phone,
        campusAddress: address,
        name: user.name,
      });

      onUpdateUser({
        email,
        phone,
        campusAddress: address,
        preferences: {
          academicAlerts,
          profileVisibility,
          twoFactorAuth,
        },
      });

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (err) {
      console.warn('[ProfileScreen] Error updating profile on backend, saving locally:', err);
      onUpdateUser({
        email,
        phone,
        campusAddress: address,
        preferences: {
          academicAlerts,
          profileVisibility,
          twoFactorAuth,
        },
      });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Section (Page 9) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t('profile.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      {/* Save Success Toast */}
      {savedToast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs"
        >
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{t('common.saved')}</span>
        </motion.div>
      )}

      {/* 2-Column Layout (Page 9): Left Identity & Documents | Right Metrics & Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar, ID, Program & Documents (Page 9 Left) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Identity Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs text-center flex flex-col items-center">
            {/* Avatar Photo */}
            <div className="relative mb-4">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-50 shadow-md"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>

            {/* Name & ID */}
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs font-mono font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
              {t('profile.studentId')}: {user.studentId}
            </p>

            {/* Program Badge */}
            <div className="mt-4 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl w-full">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                {t('profile.currentProgram')}
              </span>
              <span className="text-xs font-bold text-slate-800 block mt-0.5">{user.program}</span>
            </div>
          </div>

          {/* Documents Card (Page 9 Left Bottom) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs space-y-3.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              {t('common.details')}
            </span>

            {/* Download ID Card Button */}
            <button
              onClick={() => setShowIdCardModal(true)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-200" />
                <span>{t('profile.viewDigitalId')}</span>
              </div>
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* View Transcript Button */}
            <button
              onClick={() => setShowTranscriptModal(true)}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>{t('profile.downloadTranscript')}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Right Column: Top Stats & Preferences (Page 9 Right) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Top 4 Metric Cards Row (Page 9 Top Right) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* SEMESTER */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                📈 {t('common.semester')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block mt-1">
                {user.semester}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">{user.term}</span>
            </div>

            {/* CUM. GPA */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                🎓 {t('dashboard.cgpa')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block mt-1 font-mono">
                {user.gpa}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 mt-0.5 block">
                {user.gpaChange}
              </span>
            </div>

            {/* CREDITS */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                📑 {t('dashboard.creditsEarned')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block mt-1 font-mono">
                {user.creditsEarned}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
                {t('common.of')} {user.creditsTotal}
              </span>
            </div>

            {/* ENROLLED */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-xs">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                📅 {t('profile.enrollmentYear')}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 block mt-1 font-mono">
                {user.enrolledYear}
              </span>
              <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">
                {user.graduationYear}
              </span>
            </div>
          </div>

          {/* Tabbed Form Container */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-100/90 shadow-xs space-y-6">
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-100 pb-3 text-xs font-bold">
              {(['Account', 'Privacy', 'Notifications'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-1 relative transition-colors cursor-pointer ${
                    activeTab === tab
                      ? 'text-blue-600 font-extrabold'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab === 'Account'
                    ? t('profile.accountTab')
                    : tab === 'Privacy'
                    ? t('profile.privacyTab')
                    : t('profile.notificationsTab')}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeProfileTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Personal Details Form (Page 9 Form) */}
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">{t('profile.personalDetails')}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      {t('profile.emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      {t('profile.phoneNumber')}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Campus Address */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      {t('profile.campusAddress')}
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                    {isSaving ? t('common.saving') : t('common.saveChanges')}
                  </button>
                </div>
              </div>

              {/* System Preferences Toggles */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">{t('profile.systemPreferences')}</h3>

                {/* Interface Language Preference */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{t('profile.languagePreference')}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t('profile.languagePreferenceDesc')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-white border border-blue-200 text-blue-700 font-bold text-xs shadow-2xs">
                      {currentLanguageOption.nativeLabel} ({currentLanguageOption.code.toUpperCase()})
                    </span>
                  </div>
                </div>

                {/* Academic Alerts */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t('profile.academicAlerts')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('profile.academicAlertsDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAcademicAlerts(!academicAlerts)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      academicAlerts ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        academicAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Profile Visibility */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t('profile.profileVisibility')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('profile.profileVisibilityDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileVisibility(!profileVisibility)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      profileVisibility ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        profileVisibility ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t('profile.twoFactorAuth')}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('profile.twoFactorAuthDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      twoFactorAuth ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        twoFactorAuth ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Digital ID Card Modal */}
      <AnimatePresence>
        {showIdCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <CampusPulseLogo size="sm" subtitle="Digital Identity" />
                <button
                  onClick={() => setShowIdCardModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ID Card Visual */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-blue-200 font-bold block">
                      CAMPUS SMART ID
                    </span>
                    <span className="text-xs font-semibold text-white">Student Union</span>
                  </div>
                  <CampusPulseLogo size="sm" showText={false} white={true} />
                </div>

                <div className="flex items-center gap-3.5">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white/40 shadow-xs"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{user.name}</h4>
                    <p className="text-[11px] text-blue-100 font-mono">ID: {user.studentId}</p>
                    <p className="text-[10px] text-blue-200">{user.program}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/20 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="text-blue-200 block font-semibold">VALID THRU</span>
                    <span className="font-bold">06/2025</span>
                  </div>
                  <div className="p-1 bg-white rounded-lg">
                    <QrCode className="w-8 h-8 text-slate-900" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => {
                    alert('ID Card downloaded to device wallet.');
                    setShowIdCardModal(false);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Save to Wallet / Download</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Academic Transcript Modal */}
      <AnimatePresence>
        {showTranscriptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Grade Transcript</h3>
                  <p className="text-xs text-slate-400">Cumulative GPA: 3.8 / 4.0 • 84 Credits</p>
                </div>
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Semester Breakdown Table */}
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-2">
                    <span>Semester 4 (Spring 2023)</span>
                    <span className="text-blue-600 font-mono">SGPA: 3.85</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>CS201 Data Structures &amp; Algos</span>
                      <span className="font-bold text-slate-800">A (4.0)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CS202 Computer Organization</span>
                      <span className="font-bold text-slate-800">A- (3.7)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MTH201 Discrete Mathematics</span>
                      <span className="font-bold text-slate-800">A (4.0)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-2">
                    <span>Semester 3 (Fall 2022)</span>
                    <span className="text-blue-600 font-mono">SGPA: 3.75</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>CS102 Object Oriented Programming</span>
                      <span className="font-bold text-slate-800">A (4.0)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MTH101 Multivariable Calculus</span>
                      <span className="font-bold text-slate-800">B+ (3.3)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setShowTranscriptModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert('Transcript downloaded as PDF.');
                    setShowTranscriptModal(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Signed PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

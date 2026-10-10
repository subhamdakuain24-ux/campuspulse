import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Clock,
  Calendar,
  MoreVertical,
  CheckCircle2,
  FileText,
  Filter,
  Sparkles,
  Plus,
  AlertCircle,
  X,
  FileUp,
  RotateCw,
  Server,
} from 'lucide-react';
import { initialAssignments } from '../data/mockData';
import { AssignmentItem } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export const AssignmentsScreen: React.FC = () => {
  const { t, translateStatus } = useTranslation();
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [activeModalItem, setActiveModalItem] = useState<AssignmentItem | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getStudentAssignments('1');
      setAssignments(data.assignments);
      setIsLiveApi(data.isLiveApi);
    } catch (err: any) {
      console.error('[AssignmentsScreen] Error fetching assignments:', err);
      setError(err?.message || 'Failed to load assignments');
      setIsLiveApi(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const pendingList = assignments.filter((a) => a.status === 'pending' || a.status === 'draft');
  const completedList = assignments.filter((a) => a.status === 'completed');

  const filteredList = (activeTab === 'pending' ? pendingList : completedList).filter((item) => {
    if (selectedSubject === 'All Subjects') return true;
    return item.courseCode.includes(selectedSubject) || item.courseName.includes(selectedSubject);
  });

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalItem) return;

    try {
      setIsSubmitting(true);
      const res = await api.submitAssignment('1', activeModalItem.id, {
        notes: submissionNotes,
        fileName: fileName || 'assignment_submission.pdf',
      });

      if (res.assignment) {
        setAssignments((prev) =>
          prev.map((item) => (item.id === activeModalItem.id ? res.assignment! : item))
        );
      } else {
        setAssignments((prev) =>
          prev.map((item) =>
            item.id === activeModalItem.id
              ? {
                  ...item,
                  status: 'completed',
                  submittedDate: 'Just now',
                  grade: 'Under Review',
                  actionText: 'View Submission',
                }
              : item
          )
        );
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setActiveModalItem(null);
        setFileName('');
        setSubmissionNotes('');
      }, 1400);
    } catch (err: any) {
      console.error('[AssignmentsScreen] Submission error:', err);
      // Fallback local update
      setAssignments((prev) =>
        prev.map((item) =>
          item.id === activeModalItem.id
            ? {
                ...item,
                status: 'completed',
                submittedDate: 'Just now',
                grade: 'Under Review',
                actionText: 'View Submission',
              }
            : item
        )
      );
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setActiveModalItem(null);
        setFileName('');
        setSubmissionNotes('');
      }, 1400);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Section (Page 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t('assignments.title', 'Assignments')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {t('assignments.subtitle', 'Manage your coursework and track deadlines.')}
          </p>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 pr-8 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All Subjects">{t('common.all', 'All Subjects')}</option>
              {Array.from(new Set(assignments.map((a) => a.courseCode))).map((code) => {
                const asg = assignments.find((a) => a.courseCode === code);
                return (
                  <option key={code} value={code}>
                    {code}: {asg?.courseName || code}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Row (Page 6): Pending (5) | Completed (12) */}
      <div className="flex items-center gap-3 border-b border-slate-200/60 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <span>{t('assignments.pendingTab', 'Pending')}</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'pending' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {pendingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <span>{t('assignments.submittedTab', 'Completed')}</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'completed' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {completedList.length}
          </span>
        </button>
      </div>

      {/* Grid of Assignment Cards (Page 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((item) => {
          const isHigh = item.priority === 'HIGH';
          const isMedium = item.priority === 'MEDIUM';

          return (
            <motion.div
              key={item.id}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-2xl p-6 border shadow-2xs flex flex-col justify-between transition-all ${
                isHigh
                  ? 'border-t-4 border-t-red-500 border-slate-100'
                  : isMedium
                  ? 'border-t-4 border-t-amber-500 border-slate-100'
                  : 'border-t-4 border-t-emerald-500 border-slate-100'
              }`}
            >
              <div>
                {/* Header: Priority Badge & 3-dots */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isHigh
                        ? 'bg-red-50 text-red-700 border border-red-200/60'
                        : isMedium
                        ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    }`}
                  >
                    {item.priority === 'HIGH'
                      ? 'HIGH PRIORITY'
                      : item.priority === 'MEDIUM'
                      ? 'MEDIUM'
                      : 'LOW'}
                  </span>

                  <button className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Title and Course */}
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {item.courseCode}: {item.courseName}
                </p>

                {/* Due Date Indicator */}
                <div className="mt-5 mb-6">
                  {item.isUrgentToday ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.dueDateText}</span>
                    </div>
                  ) : item.status === 'completed' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Score: {item.grade || 'Submitted'}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.dueDateText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action CTA Button */}
              <div>
                {item.status === 'completed' ? (
                  <button
                    onClick={() => setActiveModalItem(item)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Submission</span>
                  </button>
                ) : isHigh ? (
                  <button
                    onClick={() => setActiveModalItem(item)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit Work</span>
                  </button>
                ) : isMedium ? (
                  <button
                    onClick={() => setActiveModalItem(item)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Continue Draft</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveModalItem(item)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Start Assignment</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Submit / View Work Modal */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600">
                    {activeModalItem.courseCode}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{activeModalItem.title}</h3>
                </div>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Assignment Submitted!</h4>
                  <p className="text-xs text-slate-500">
                    Receipt #CP-ASG-{Math.floor(Math.random() * 90000 + 10000)} generated.
                  </p>
                </div>
              ) : activeModalItem.status === 'completed' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-900">
                      Grade: {activeModalItem.grade}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Submitted on {activeModalItem.submittedDate}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instructor feedback: &ldquo;Excellent work and comprehensive implementation. Well
                    structured test cases and documentation.&rdquo;
                  </p>
                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAssignment} className="space-y-4">
                  {/* Dropzone */}
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
                    <FileUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      {fileName || 'Drop your PDF, ZIP, or code file here'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX, ZIP up to 25MB</p>
                    <input
                      type="file"
                      id="asg-file-upload"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                      }}
                    />
                    <label
                      htmlFor="asg-file-upload"
                      className="mt-3 inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg cursor-pointer hover:bg-slate-100"
                    >
                      Browse Files
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Submission Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Add any notes or repository link for your professor..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setActiveModalItem(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSubmitting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                      {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

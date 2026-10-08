import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Download,
  BookOpen,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FolderOpen,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { UserProfile, PreviousYearPaper, CreatePaperPayload } from '../types';
import { api } from '../services/api';

interface PreviousYearPapersScreenProps {
  user: UserProfile;
}

const DEPARTMENTS = [
  'All',
  'School of Computing & Data Sciences',
  'School of Engineering',
  'Basic Sciences & Humanities',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
];

const SEMESTERS = ['All', '1', '2', '3', '4', '5', '6', '7', '8'];
const EXAM_TYPES = ['All', 'Mid-Term', 'End-Term', 'Supplementary', 'Model Paper'];
const YEARS = ['All', '2024', '2023', '2022', '2021', '2020'];

export const PreviousYearPapersScreen: React.FC<PreviousYearPapersScreenProps> = ({ user }) => {
  const isAdmin = user.role === 'Admin';

  const [papers, setPapers] = useState<PreviousYearPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedSem, setSelectedSem] = useState('All');
  const [selectedExamType, setSelectedExamType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  // Preview Modal
  const [previewPaper, setPreviewPaper] = useState<PreviousYearPaper | null>(null);

  // Admin Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PreviousYearPaper | null>(null);
  const [modalForm, setModalForm] = useState<CreatePaperPayload>({
    title: '',
    subject: '',
    subject_code: '',
    department: 'School of Computing & Data Sciences',
    semester: 3,
    exam_type: 'End-Term',
    year: 2023,
    resource_url: 'https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/sample_paper.pdf',
    file_size: '1.5 MB',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deletePaperId, setDeletePaperId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getPapers({
        search: searchQuery.trim() || undefined,
        department: selectedDept !== 'All' ? selectedDept : undefined,
        semester: selectedSem !== 'All' ? selectedSem : undefined,
        exam_type: selectedExamType !== 'All' ? selectedExamType : undefined,
        year: selectedYear !== 'All' ? selectedYear : undefined,
      });
      if (res && res.success) {
        setPapers(res.papers || []);
      } else {
        setErrorMsg('Failed to load question papers from the campus archive.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error connecting to question papers service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [selectedDept, selectedSem, selectedExamType, selectedYear]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPapers();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDept('All');
    setSelectedSem('All');
    setSelectedExamType('All');
    setSelectedYear('All');
  };

  const openAddModal = () => {
    setEditingPaper(null);
    setModalForm({
      title: '',
      subject: '',
      subject_code: '',
      department: 'School of Computing & Data Sciences',
      semester: 3,
      exam_type: 'End-Term',
      year: 2023,
      resource_url: 'https://cdn.jsdelivr.net/gh/campuspulse/resources@main/papers/sample_paper.pdf',
      file_size: '1.5 MB',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (paper: PreviousYearPaper) => {
    setEditingPaper(paper);
    setModalForm({
      title: paper.title,
      subject: paper.subject,
      subject_code: paper.subject_code || '',
      department: paper.department,
      semester: paper.semester,
      exam_type: paper.exam_type,
      year: paper.year,
      resource_url: paper.resource_url,
      file_size: paper.file_size,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.title.trim()) {
      setFormError('Paper title is required');
      return;
    }
    if (!modalForm.subject.trim()) {
      setFormError('Subject name is required');
      return;
    }
    if (!modalForm.resource_url.trim()) {
      setFormError('Resource link/reference is required');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingPaper) {
        const res = await api.updatePaper(editingPaper.id, modalForm);
        if (res.success) {
          setSuccessMsg(`Paper "${modalForm.title}" updated successfully.`);
          setIsModalOpen(false);
          fetchPapers();
        } else {
          setFormError(res.message || res.error || 'Failed to update paper.');
        }
      } else {
        const res = await api.createPaper(modalForm);
        if (res.success) {
          setSuccessMsg(`Paper "${modalForm.title}" added to academic archive.`);
          setIsModalOpen(false);
          fetchPapers();
        } else {
          setFormError(res.message || res.error || 'Failed to add paper.');
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Network error while saving paper.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePaper = async () => {
    if (!deletePaperId) return;
    setIsDeleting(true);
    try {
      const res = await api.deletePaper(deletePaperId);
      if (res.success) {
        setSuccessMsg(res.message || 'Paper deleted successfully.');
        setDeletePaperId(null);
        fetchPapers();
      } else {
        setErrorMsg(res.message || res.error || 'Failed to delete paper.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error deleting paper.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Resource Center
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                Verified Repository
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Previous Year Question Papers
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Official university examination papers repository across departments and semesters for syllabus preparation, revision, and model paper review.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Question Paper
              </button>
            )}
            <button
              onClick={fetchPapers}
              title="Refresh repository"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject name, code (e.g. CS301), exam title, or department..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Search
          </button>
          {(searchQuery || selectedDept !== 'All' || selectedSem !== 'All' || selectedExamType !== 'All' || selectedYear !== 'All') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Reset
            </button>
          )}
        </form>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Semesters' : `Semester ${s}`}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
            >
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Exam Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:outline-hidden"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y === 'All' ? 'All Years' : `Year ${y}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Paper Cards List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Available Question Papers</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              {papers.length} {papers.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          {isAdmin && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              Admin privileges: Manage & curate paper archives
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-16 bg-slate-50 rounded-xl" />
                <div className="h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No question papers found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No archived papers matched your current filter criteria. Try clearing filters or searching with a different subject term.
              </p>
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <motion.div
                key={paper.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                      {paper.subject_code ? `${paper.subject_code} • ` : ''}Sem {paper.semester}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        paper.exam_type === 'End-Term'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : paper.exam_type === 'Mid-Term'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {paper.exam_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold">
                        {paper.year}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {paper.subject}
                    </p>
                  </div>

                  {/* Department & File metadata */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{paper.department}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Size: {paper.file_size}</span>
                      <span>By: {paper.uploaded_by}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewPaper(paper)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Paper
                    </button>
                    <a
                      href={paper.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                      title="Open external link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(paper)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Edit paper record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletePaperId(paper.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Safe Resource Viewer Modal */}
      <AnimatePresence>
        {previewPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{previewPaper.title}</h3>
                    <p className="text-xs text-slate-500">{previewPaper.subject} • Year {previewPaper.year}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewPaper(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Semester</span>
                    <span className="text-sm font-bold text-slate-800">Semester {previewPaper.semester}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Type</span>
                    <span className="text-sm font-bold text-slate-800">{previewPaper.exam_type}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">File Size</span>
                    <span className="text-sm font-bold text-slate-800">{previewPaper.file_size}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Verified Academic Repository Resource:</span>
                  <p className="font-mono text-[11px] text-blue-700 break-all">{previewPaper.resource_url}</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-6 text-center space-y-3 bg-slate-50/50">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">University Exam Document Preview</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Access the full document directly via verified campus resource reader or download for offline revision.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <a
                      href={previewPaper.resource_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Paper in New Tab
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setPreviewPaper(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPaper ? 'Edit Question Paper Record' : 'Add New Question Paper'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePaper} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paper Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.title}
                    onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                    placeholder="e.g. CS301 Data Structures - End-Term (Dec 2023)"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.subject}
                      onChange={(e) => setModalForm({ ...modalForm, subject: e.target.value })}
                      placeholder="e.g. Data Structures"
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      value={modalForm.subject_code || ''}
                      onChange={(e) => setModalForm({ ...modalForm, subject_code: e.target.value })}
                      placeholder="e.g. CS301"
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={modalForm.department}
                    onChange={(e) => setModalForm({ ...modalForm, department: e.target.value })}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  >
                    {DEPARTMENTS.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Semester *
                    </label>
                    <select
                      value={modalForm.semester}
                      onChange={(e) => setModalForm({ ...modalForm, semester: Number(e.target.value) })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Sem {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Exam Type *
                    </label>
                    <select
                      value={modalForm.exam_type}
                      onChange={(e) => setModalForm({ ...modalForm, exam_type: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                    >
                      {EXAM_TYPES.filter((t) => t !== 'All').map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={2035}
                      value={modalForm.year}
                      onChange={(e) => setModalForm({ ...modalForm, year: Number(e.target.value) })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resource / File Reference URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={modalForm.resource_url}
                    onChange={(e) => setModalForm({ ...modalForm, resource_url: e.target.value })}
                    placeholder="https://... or repository link to PDF"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Safe verified URL or campus repository document path.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    File Size Display
                  </label>
                  <input
                    type="text"
                    value={modalForm.file_size || ''}
                    onChange={(e) => setModalForm({ ...modalForm, file_size: e.target.value })}
                    placeholder="e.g. 1.8 MB"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {editingPaper ? 'Update Paper' : 'Save Paper'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletePaperId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Confirm Deletion</h4>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove this previous year question paper record from the repository?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletePaperId(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePaper}
                  disabled={isDeleting}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

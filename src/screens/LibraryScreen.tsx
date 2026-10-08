import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CreditCard,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  X,
  RefreshCw,
  Library,
  UserCheck,
  Send,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  BookMarked,
  Layers,
  Sparkles,
  QrCode,
  Check,
} from 'lucide-react';
import {
  UserProfile,
  LibraryBook,
  BookIssueRecord,
  BookIssueStatus,
  LibraryCard,
  LibraryCardRenewal,
  CardRenewalStatus,
  CreateBookPayload,
} from '../types';
import { api } from '../services/api';

interface LibraryScreenProps {
  user: UserProfile;
}

const BOOK_CATEGORIES = [
  'All',
  'Computer Science',
  'Mathematics',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Reference',
  'General Engineering',
];

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ user }) => {
  const isAdmin = user.role === 'Admin';

  // Navigation tab: 'books' | 'card'
  const [activeTab, setActiveTab] = useState<'books' | 'card'>('books');

  // Common notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==========================================
  // TAB 1: BOOKS CATALOG & ISSUES STATE
  // ==========================================
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [searchBookQuery, setSearchBookQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Student Books view sub-mode: 'catalog' | 'my-issues'
  const [studentBookView, setStudentBookView] = useState<'catalog' | 'my-issues'>('catalog');

  // Student's personal issues
  const [myIssues, setMyIssues] = useState<BookIssueRecord[]>([]);
  const [myIssuesLoading, setMyIssuesLoading] = useState(false);

  // Admin issue requests queue
  const [adminIssues, setAdminIssues] = useState<BookIssueRecord[]>([]);
  const [adminIssueStatusFilter, setAdminIssueStatusFilter] = useState('ALL');
  const [adminIssuesLoading, setAdminIssuesLoading] = useState(false);

  // Student issue request modal
  const [issueRequestBook, setIssueRequestBook] = useState<LibraryBook | null>(null);
  const [issueNotes, setIssueNotes] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueModalError, setIssueModalError] = useState<string | null>(null);

  // Admin Add / Edit Book Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [bookForm, setBookForm] = useState<CreateBookPayload>({
    title: '',
    author: '',
    isbn: '',
    category: 'Computer Science',
    department: 'All',
    edition: '1st Edition',
    publisher: '',
    location: 'Central Library - Stack Room A',
    total_copies: 5,
    available_copies: 5,
    description: '',
  });
  const [bookFormSubmitting, setBookFormSubmitting] = useState(false);
  const [bookFormError, setBookFormError] = useState<string | null>(null);

  // Admin Delete Book
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);
  const [isDeletingBook, setIsDeletingBook] = useState(false);

  // Admin Update Issue Status Modal
  const [updatingIssue, setUpdatingIssue] = useState<BookIssueRecord | null>(null);
  const [newIssueStatus, setNewIssueStatus] = useState<BookIssueStatus>('ISSUED');
  const [customDueDate, setCustomDueDate] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isUpdatingIssueStatus, setIsUpdatingIssueStatus] = useState(false);
  const [issueStatusError, setIssueStatusError] = useState<string | null>(null);

  // ==========================================
  // TAB 2: LIBRARY CARD & RENEWAL STATE
  // ==========================================
  const [myCard, setMyCard] = useState<LibraryCard | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [myRenewals, setMyRenewals] = useState<LibraryCardRenewal[]>([]);
  const [renewalsLoading, setRenewalsLoading] = useState(false);

  // Student Submit Renewal Modal
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalReason, setRenewalReason] = useState('Academic session extension and thesis research');
  const [renewalMonths, setRenewalMonths] = useState(12);
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);
  const [renewalModalError, setRenewalModalError] = useState<string | null>(null);

  // Admin Renewals Queue
  const [adminRenewals, setAdminRenewals] = useState<LibraryCardRenewal[]>([]);
  const [adminRenewalFilter, setAdminRenewalFilter] = useState('ALL');
  const [adminRenewalsLoading, setAdminRenewalsLoading] = useState(false);

  // Admin Update Renewal Status Modal
  const [updatingRenewal, setUpdatingRenewal] = useState<LibraryCardRenewal | null>(null);
  const [newRenewalStatus, setNewRenewalStatus] = useState<CardRenewalStatus>('APPROVED');
  const [customNewExpiry, setCustomNewExpiry] = useState('');
  const [adminRenewalNotes, setAdminRenewalNotes] = useState('');
  const [isUpdatingRenewalStatus, setIsUpdatingRenewalStatus] = useState(false);
  const [renewalStatusError, setRenewalStatusError] = useState<string | null>(null);

  // ------------------------------------------
  // DATA LOADERS
  // ------------------------------------------

  const loadBooks = async () => {
    setBooksLoading(true);
    try {
      const res = await api.getLibraryBooks({
        search: searchBookQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        available_only: availableOnly || undefined,
      });
      if (res.success) {
        setBooks(res.books || []);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error loading library books.');
    } finally {
      setBooksLoading(false);
    }
  };

  const loadMyIssues = async () => {
    setMyIssuesLoading(true);
    try {
      const res = await api.getMyBookIssues();
      if (res.success) {
        setMyIssues(res.issues || []);
      }
    } catch (err: any) {
      console.warn('Error loading my book issues:', err);
    } finally {
      setMyIssuesLoading(false);
    }
  };

  const loadAdminIssues = async () => {
    setAdminIssuesLoading(true);
    try {
      const res = await api.getAllIssueRequests(adminIssueStatusFilter);
      if (res.success) {
        setAdminIssues(res.issues || []);
      }
    } catch (err: any) {
      console.warn('Error loading admin issue requests:', err);
    } finally {
      setAdminIssuesLoading(false);
    }
  };

  const loadCardData = async () => {
    setCardLoading(true);
    setRenewalsLoading(true);
    try {
      const cardRes = await api.getMyLibraryCard();
      if (cardRes.success) {
        setMyCard(cardRes.card);
      }
      const renRes = await api.getMyCardRenewals();
      if (renRes.success) {
        setMyRenewals(renRes.renewals || []);
      }
    } catch (err: any) {
      console.warn('Error loading student card details:', err);
    } finally {
      setCardLoading(false);
      setRenewalsLoading(false);
    }
  };

  const loadAdminRenewals = async () => {
    setAdminRenewalsLoading(true);
    try {
      const res = await api.getAdminCardRenewals(adminRenewalFilter);
      if (res.success) {
        setAdminRenewals(res.renewals || []);
      }
    } catch (err: any) {
      console.warn('Error loading admin renewals:', err);
    } finally {
      setAdminRenewalsLoading(false);
    }
  };

  // Trigger loads based on tab
  useEffect(() => {
    loadBooks();
    if (!isAdmin) {
      loadMyIssues();
    } else {
      loadAdminIssues();
    }
  }, [selectedCategory, availableOnly]);

  useEffect(() => {
    if (activeTab === 'card') {
      if (!isAdmin) {
        loadCardData();
      } else {
        loadAdminRenewals();
      }
    }
  }, [activeTab, adminRenewalFilter]);

  // ------------------------------------------
  // ACTIONS: BOOKS & ISSUES
  // ------------------------------------------

  const handleBookSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks();
  };

  const handleRequestIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueRequestBook) return;

    if (issueRequestBook.available_copies <= 0) {
      setIssueModalError('This book is currently out of stock. Cannot submit issue request.');
      return;
    }

    setIsSubmittingIssue(true);
    setIssueModalError(null);
    try {
      const res = await api.requestBookIssue(issueRequestBook.id, issueNotes);
      if (res.success) {
        setSuccessMsg(res.message || `Issue request for "${issueRequestBook.title}" submitted.`);
        setIssueRequestBook(null);
        setIssueNotes('');
        loadBooks();
        loadMyIssues();
      } else {
        setIssueModalError(res.message || res.error || 'Failed to submit issue request.');
      }
    } catch (err: any) {
      setIssueModalError(err?.message || 'Error communicating with library server.');
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const openAddBookModal = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'Computer Science',
      department: 'School of Computing & Data Sciences',
      edition: '1st Edition',
      publisher: '',
      location: 'Central Library - Stack Room A',
      total_copies: 5,
      available_copies: 5,
      description: '',
    });
    setBookFormError(null);
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (book: LibraryBook) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      department: book.department || 'All',
      edition: book.edition || '1st Edition',
      publisher: book.publisher || '',
      location: book.location,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
      description: book.description || '',
    });
    setBookFormError(null);
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      setBookFormError('Book title is required');
      return;
    }
    if (!bookForm.author.trim()) {
      setBookFormError('Author is required');
      return;
    }
    if (!bookForm.isbn.trim()) {
      setBookFormError('ISBN is required');
      return;
    }
    if (bookForm.available_copies! > bookForm.total_copies) {
      setBookFormError('Available copies cannot exceed total copies.');
      return;
    }

    setBookFormSubmitting(true);
    setBookFormError(null);
    try {
      if (editingBook) {
        const res = await api.updateLibraryBook(editingBook.id, bookForm);
        if (res.success) {
          setSuccessMsg(`Book "${bookForm.title}" updated successfully.`);
          setIsBookModalOpen(false);
          loadBooks();
        } else {
          setBookFormError(res.message || res.error || 'Failed to update book.');
        }
      } else {
        const res = await api.createLibraryBook(bookForm);
        if (res.success) {
          setSuccessMsg(`Book "${bookForm.title}" added to catalog.`);
          setIsBookModalOpen(false);
          loadBooks();
        } else {
          setBookFormError(res.message || res.error || 'Failed to add book.');
        }
      }
    } catch (err: any) {
      setBookFormError(err?.message || 'Error saving book.');
    } finally {
      setBookFormSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteBookId) return;
    setIsDeletingBook(true);
    try {
      const res = await api.deleteLibraryBook(deleteBookId);
      if (res.success) {
        setSuccessMsg(res.message || 'Book removed from library catalog.');
        setDeleteBookId(null);
        loadBooks();
      } else {
        setErrorMsg(res.message || res.error || 'Cannot delete book.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error removing book.');
    } finally {
      setIsDeletingBook(false);
    }
  };

  const openUpdateIssueStatus = (issue: BookIssueRecord, targetStatus: BookIssueStatus) => {
    setUpdatingIssue(issue);
    setNewIssueStatus(targetStatus);
    // Suggest due date: 21 days from now
    const d = new Date();
    d.setDate(d.getDate() + 21);
    setCustomDueDate(d.toISOString().slice(0, 10));
    setAdminRemarks(issue.admin_remarks || '');
    setIssueStatusError(null);
  };

  const handleUpdateIssueStatus = async () => {
    if (!updatingIssue) return;
    setIsUpdatingIssueStatus(true);
    setIssueStatusError(null);
    try {
      const res = await api.updateIssueRequestStatus(
        updatingIssue.id,
        newIssueStatus,
        newIssueStatus === 'ISSUED' ? customDueDate : undefined,
        adminRemarks
      );
      if (res.success) {
        setSuccessMsg(res.message || `Issue record updated to ${newIssueStatus}.`);
        setUpdatingIssue(null);
        loadAdminIssues();
        loadBooks();
      } else {
        setIssueStatusError(res.message || res.error || 'Failed to update status.');
      }
    } catch (err: any) {
      setIssueStatusError(err?.message || 'Error updating issue status.');
    } finally {
      setIsUpdatingIssueStatus(false);
    }
  };

  // ------------------------------------------
  // ACTIONS: LIBRARY CARD & RENEWALS
  // ------------------------------------------

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRenewal(true);
    setRenewalModalError(null);
    try {
      const res = await api.submitCardRenewal(renewalReason, renewalMonths);
      if (res.success) {
        setSuccessMsg(res.message || 'Library card renewal request submitted.');
        setIsRenewalModalOpen(false);
        loadCardData();
      } else {
        setRenewalModalError(res.message || res.error || 'Failed to submit renewal request.');
      }
    } catch (err: any) {
      setRenewalModalError(err?.message || 'Error submitting renewal request.');
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  const openUpdateRenewalStatus = (renewal: LibraryCardRenewal, targetStatus: CardRenewalStatus) => {
    setUpdatingRenewal(renewal);
    setNewRenewalStatus(targetStatus);
    // Default next year
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    setCustomNewExpiry(d.toISOString().slice(0, 10));
    setAdminRenewalNotes(renewal.admin_notes || '');
    setRenewalStatusError(null);
  };

  const handleUpdateRenewalStatus = async () => {
    if (!updatingRenewal) return;
    setIsUpdatingRenewalStatus(true);
    setRenewalStatusError(null);
    try {
      const res = await api.updateCardRenewalStatus(
        updatingRenewal.id,
        newRenewalStatus,
        newRenewalStatus in { APPROVED: 1, RENEWED: 1 } ? customNewExpiry : undefined,
        adminRenewalNotes
      );
      if (res.success) {
        setSuccessMsg(res.message || `Card renewal marked ${newRenewalStatus}.`);
        setUpdatingRenewal(null);
        loadAdminRenewals();
      } else {
        setRenewalStatusError(res.message || res.error || 'Failed to update renewal.');
      }
    } catch (err: any) {
      setRenewalStatusError(err?.message || 'Error updating renewal status.');
    } finally {
      setIsUpdatingRenewalStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" />
                Central Campus Library
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                Live Book Bank & Circulation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Library Services & Circulation Desk
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Centralized book loans, automated issue/return tracking, digital catalog search, and student library card renewals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin && activeTab === 'books' && (
              <button
                onClick={openAddBookModal}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Book to Catalog
              </button>
            )}
            {!isAdmin && activeTab === 'card' && (
              <button
                onClick={() => {
                  setRenewalReason('Academic session extension and thesis research');
                  setRenewalMonths(12);
                  setRenewalModalError(null);
                  setIsRenewalModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Request Card Renewal
              </button>
            )}
            <button
              onClick={() => {
                if (activeTab === 'books') {
                  loadBooks();
                  if (!isAdmin) loadMyIssues();
                  else loadAdminIssues();
                } else {
                  if (!isAdmin) loadCardData();
                  else loadAdminRenewals();
                }
              }}
              title="Refresh"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'books'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Book Issue & Return</span>
        </button>
        <button
          onClick={() => setActiveTab('card')}
          className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'card'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Library Card Renewal</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
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

      {/* ========================================================================= */}
      {/* TAB 1: BOOK ISSUE & RETURN CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          {/* If Student: sub-toggle between Catalog & My Issues */}
          {!isAdmin && (
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStudentBookView('catalog')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    studentBookView === 'catalog'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Browse Book Catalog
                </button>
                <button
                  onClick={() => setStudentBookView('my-issues')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    studentBookView === 'my-issues'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>My Issued Books & Requests</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    studentBookView === 'my-issues' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {myIssues.length}
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Max 3 active book loans per registered student ID
              </div>
            </div>
          )}

          {/* If Admin: show Issue Desk Queue Switch or Books Management */}
          {isAdmin && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Circulation Desk & Student Issue Requests
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Approve/reject student book requests and mark active loans as returned.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {['ALL', 'REQUESTED', 'ISSUED', 'RETURNED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setAdminIssueStatusFilter(st);
                        api.getAllIssueRequests(st).then((r) => r.success && setAdminIssues(r.issues));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        adminIssueStatusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {adminIssuesLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading circulation queue...</div>
              ) : adminIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No circulation records matching status "{adminIssueStatusFilter}".
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Book & ISBN</th>
                        <th className="py-2.5 px-3">Request Date</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Due / Return Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminIssues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{issue.student_name}</span>
                            <span className="text-[11px] text-slate-500">{issue.student_identifier}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{issue.book_title}</span>
                            <span className="text-[11px] font-mono text-slate-500">{issue.isbn}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {issue.request_date ? issue.request_date.slice(0, 10) : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              issue.status === 'ISSUED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : issue.status === 'REQUESTED'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : issue.status === 'RETURNED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {issue.status === 'ISSUED' && (
                              <span className="text-blue-700 font-semibold">Due: {issue.due_date || '—'}</span>
                            )}
                            {issue.status === 'RETURNED' && (
                              <span className="text-emerald-700 font-semibold">Returned: {issue.return_date || '—'}</span>
                            )}
                            {issue.status === 'REQUESTED' && (
                              <span className="text-slate-400 italic">Pending approval</span>
                            )}
                            {issue.status === 'REJECTED' && (
                              <span className="text-rose-600 italic">Declined</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            {issue.status === 'REQUESTED' && (
                              <>
                                <button
                                  onClick={() => openUpdateIssueStatus(issue, 'ISSUED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  Approve & Issue
                                </button>
                                <button
                                  onClick={() => openUpdateIssueStatus(issue, 'REJECTED')}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {issue.status === 'ISSUED' && (
                              <button
                                onClick={() => openUpdateIssueStatus(issue, 'RETURNED')}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                              >
                                Mark Returned
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Student: My Issued Books & Requests View */}
          {!isAdmin && studentBookView === 'my-issues' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-indigo-600" />
                    My Issued Books & Loan History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Personal circulation records. Always return books before the specified due date to avoid overdue dues.
                  </p>
                </div>
                <button
                  onClick={loadMyIssues}
                  className="p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <RefreshCw className={`w-4 h-4 ${myIssuesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {myIssuesLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading your loan records...</div>
              ) : myIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <p className="text-sm font-bold text-slate-700">No active book issues or requests</p>
                  <p className="text-xs text-slate-400">
                    Switch to the Book Catalog to browse textbook titles and request a book loan.
                  </p>
                  <button
                    onClick={() => setStudentBookView('catalog')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myIssues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{iss.book_title}</h4>
                          <p className="text-xs text-slate-500">{iss.book_author} • ISBN: {iss.isbn}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                          iss.status === 'ISSUED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : iss.status === 'REQUESTED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : iss.status === 'RETURNED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {iss.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Issue Date</span>
                          <span className="font-semibold text-slate-700">{iss.issue_date || 'Pending'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Due Date</span>
                          <span className={`font-bold ${iss.status === 'ISSUED' ? 'text-blue-700' : 'text-slate-700'}`}>
                            {iss.due_date || (iss.status === 'REQUESTED' ? 'Pending Approval' : '—')}
                          </span>
                        </div>
                      </div>

                      {iss.admin_remarks && (
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600">
                          <span className="font-bold text-slate-700">Librarian Note: </span>
                          {iss.admin_remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Books Catalog Search & Filter (Visible for Admin and Student in 'catalog' view) */}
          {(!isAdmin && studentBookView === 'catalog' || isAdmin) && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
                <form onSubmit={handleBookSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchBookQuery}
                      onChange={(e) => setSearchBookQuery(e.target.value)}
                      placeholder="Search books by title, author, category, or ISBN number..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Search
                  </button>
                </form>

                <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {BOOK_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Available Copies Only</span>
                  </label>
                </div>
              </div>

              {/* Books Grid */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Catalog Books ({books.length})
                </h3>
              </div>

              {booksLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs animate-pulse space-y-3">
                      <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                      <div className="h-16 bg-slate-50 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : books.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">No books found matching your criteria</p>
                  <p className="text-xs text-slate-400">Try clearing filters or searching with a different term.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books.map((b) => (
                    <motion.div
                      key={b.id}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {b.category}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            b.available_copies > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {b.available_copies > 0 ? `${b.available_copies} of ${b.total_copies} Available` : 'Out of Stock'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {b.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            {b.author}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-600">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">ISBN:</span>
                            <span className="font-mono font-semibold">{b.isbn}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Location:</span>
                            <span className="truncate max-w-[170px]">{b.location}</span>
                          </div>
                        </div>

                        {b.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                            "{b.description}"
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        {!isAdmin ? (
                          <button
                            onClick={() => {
                              setIssueRequestBook(b);
                              setIssueNotes('');
                              setIssueModalError(null);
                            }}
                            disabled={b.available_copies <= 0}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              b.available_copies > 0
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <BookMarked className="w-3.5 h-3.5" />
                            {b.available_copies > 0 ? 'Request Issue' : 'Unavailable'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[11px] text-slate-400 font-mono">ID #{b.id}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditBookModal(b)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 cursor-pointer"
                                title="Edit Book"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteBookId(b.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete Book"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIBRARY CARD RENEWAL CONTENT */}
      {/* ========================================================================= */}
      {activeTab === 'card' && (
        <div className="space-y-6">
          {!isAdmin ? (
            /* Student View: Digital Library Card + Renewal Timeline */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Digital Card Representation */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/50 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                        CP
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                        CampusPulse Library Card
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      myCard?.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                    }`}>
                      {myCard?.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white tracking-tight">{user.name}</h3>
                    <p className="text-xs text-indigo-300 font-mono">{user.studentId} • {user.program}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-bold block">Card Number</span>
                      <span className="font-mono font-bold text-white">{myCard?.card_number || 'LC-2023-847291'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-bold block">Valid Until</span>
                      <span className="font-bold text-emerald-400">{myCard?.valid_until || '2024-12-31'}</span>
                    </div>
                  </div>

                  {/* Visual Barcode Graphic */}
                  <div className="p-3 bg-white/10 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex gap-1 items-center h-6">
                        {[2, 4, 1, 3, 2, 5, 2, 4, 1, 3, 4, 2, 5, 1, 3, 2, 4].map((w, idx) => (
                          <div
                            key={idx}
                            className="bg-white/80 h-full rounded-xs"
                            style={{ width: `${w * 2}px` }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono text-indigo-300 tracking-widest block text-center">
                        {myCard?.card_number || 'LC-2023-847291'}
                      </span>
                    </div>
                    <QrCode className="w-8 h-8 text-white/80" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Card Validity Information
                  </h4>
                  <p className="text-xs text-slate-600">
                    Your digital library card is valid for central book borrowing, research access, and institutional computer lab booking.
                  </p>
                  <button
                    onClick={() => {
                      setRenewalReason('Academic session extension and thesis research');
                      setRenewalMonths(12);
                      setRenewalModalError(null);
                      setIsRenewalModalOpen(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Submit Renewal Request
                  </button>
                </div>
              </div>

              {/* Right Column: Renewal Requests History */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Renewal Request History
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Status of your annual library validity renewal applications.
                    </p>
                  </div>
                  <button onClick={loadCardData} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
                    <RefreshCw className={`w-4 h-4 ${renewalsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {renewalsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading renewal history...</div>
                ) : myRenewals.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <p className="text-sm font-bold text-slate-700">No previous renewal requests found</p>
                    <p className="text-xs text-slate-400">
                      Submit a renewal request when your card validity approaches its expiration date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRenewals.map((ren) => (
                      <div
                        key={ren.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">Request #{ren.id}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">
                              {ren.created_at ? ren.created_at.slice(0, 10) : 'Recent'}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            ren.status === 'RENEWED' || ren.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ren.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {ren.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-700">Reason: </span>
                          {ren.reason || 'Annual academic renewal'}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 text-slate-600">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Expiry</span>
                            <span>{ren.current_expiry_date}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">New Expiry Date</span>
                            <span className="font-bold text-emerald-700">{ren.new_expiry_date || 'Pending review'}</span>
                          </div>
                        </div>

                        {ren.admin_notes && (
                          <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600">
                            <span className="font-bold text-slate-700">Admin Remarks: </span>
                            {ren.admin_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Admin View: Manage All Renewal Requests */
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Student Library Card Renewal Requests
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review and approve card validity extensions across all university departments.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {['ALL', 'PENDING', 'APPROVED', 'RENEWED', 'REJECTED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setAdminRenewalFilter(st);
                        api.getAdminCardRenewals(st).then((r) => r.success && setAdminRenewals(r.renewals));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        adminRenewalFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {adminRenewalsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading renewal requests...</div>
              ) : adminRenewals.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No renewal requests matching status "{adminRenewalFilter}".
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Student</th>
                        <th className="py-2.5 px-3">Current Expiry</th>
                        <th className="py-2.5 px-3">Requested Ext.</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Updated Expiry</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRenewals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{r.student_name}</span>
                            <span className="text-[11px] text-slate-500">{r.student_identifier}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{r.current_expiry_date}</td>
                          <td className="py-3 px-3 font-semibold text-indigo-700">
                            +{r.requested_extension_months} Mos
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={r.reason || ''}>
                            {r.reason || 'Standard academic renewal'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              r.status === 'RENEWED' || r.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : r.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-emerald-700">
                            {r.new_expiry_date || '—'}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            {r.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => openUpdateRenewalStatus(r, 'APPROVED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openUpdateRenewalStatus(r, 'REJECTED')}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal: Student Request Book Issue */}
      <AnimatePresence>
        {issueRequestBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Request Book Issue</h3>
                </div>
                <button
                  onClick={() => setIssueRequestBook(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRequestIssueSubmit} className="p-6 space-y-4">
                {issueModalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{issueModalError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900">{issueRequestBook.title}</h4>
                  <p className="text-[11px] text-slate-500">{issueRequestBook.author}</p>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200 mt-2">
                    <span className="text-slate-400 font-mono">ISBN: {issueRequestBook.isbn}</span>
                    <span className="text-emerald-700 font-bold">{issueRequestBook.available_copies} available</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purpose / Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder="e.g. Coursework preparation, final exam revision, lab assignment..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueRequestBook(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingIssue}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {isSubmittingIssue && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Confirm Issue Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Admin Add/Edit Book */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  {editingBook ? 'Edit Library Book Record' : 'Add New Book to Library Catalog'}
                </h3>
                <button
                  onClick={() => setIsBookModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="p-6 space-y-4 overflow-y-auto flex-1">
                {bookFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Algorithms"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Author(s) *</label>
                    <input
                      type="text"
                      required
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      placeholder="e.g. Cormen, Leiserson"
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ISBN *</label>
                    <input
                      type="text"
                      required
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                      placeholder="e.g. 978-0262046305"
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
                    >
                      {BOOK_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shelf Location</label>
                    <input
                      type="text"
                      value={bookForm.location || ''}
                      onChange={(e) => setBookForm({ ...bookForm, location: e.target.value })}
                      placeholder="e.g. Stack Room A - Shelf 3"
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Copies *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={bookForm.total_copies}
                      onChange={(e) => setBookForm({ ...bookForm, total_copies: Number(e.target.value) })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Available Copies *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={bookForm.available_copies}
                      onChange={(e) => setBookForm({ ...bookForm, available_copies: Number(e.target.value) })}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={bookForm.description || ''}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    placeholder="Brief syllabus topics or book summary..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookFormSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {bookFormSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Admin Update Issue Status */}
      <AnimatePresence>
        {updatingIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Update Issue Status — {newIssueStatus}
                </h3>
                <button
                  onClick={() => setUpdatingIssue(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {issueStatusError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{issueStatusError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p><span className="font-bold text-slate-700">Student: </span>{updatingIssue.student_name} ({updatingIssue.student_identifier})</p>
                  <p><span className="font-bold text-slate-700">Book: </span>{updatingIssue.book_title}</p>
                </div>

                {newIssueStatus === 'ISSUED' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Due Date for Return *
                    </label>
                    <input
                      type="date"
                      required
                      value={customDueDate}
                      onChange={(e) => setCustomDueDate(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Librarian Remarks / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="e.g. Issued from Counter 2; pristine condition; due on..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdatingIssue(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateIssueStatus}
                    disabled={isUpdatingIssueStatus}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {isUpdatingIssueStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Confirm {newIssueStatus}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Student Request Card Renewal */}
      <AnimatePresence>
        {isRenewalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Request Card Validity Renewal</h3>
                </div>
                <button
                  onClick={() => setIsRenewalModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRenewal} className="p-6 space-y-4">
                {renewalModalError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{renewalModalError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p><span className="font-bold text-slate-700">Card Number: </span>{myCard?.card_number}</p>
                  <p><span className="font-bold text-slate-700">Current Validity: </span>{myCard?.valid_until}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Requested Extension Duration *
                  </label>
                  <select
                    value={renewalMonths}
                    onChange={(e) => setRenewalMonths(Number(e.target.value))}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value={6}>6 Months (Half Academic Year)</option>
                    <option value={12}>12 Months (Full Academic Year)</option>
                    <option value={24}>24 Months (Degree Program Duration)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reason / Academic Purpose *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={renewalReason}
                    onChange={(e) => setRenewalReason(e.target.value)}
                    placeholder="e.g. Continuing into Semester 6; major research project in progress..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRenewalModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRenewal}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {isSubmittingRenewal && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Admin Update Card Renewal Status */}
      <AnimatePresence>
        {updatingRenewal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-900">
                  Process Card Renewal — {newRenewalStatus}
                </h3>
                <button
                  onClick={() => setUpdatingRenewal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {renewalStatusError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{renewalStatusError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <p><span className="font-bold text-slate-700">Student: </span>{updatingRenewal.student_name} ({updatingRenewal.student_identifier})</p>
                  <p><span className="font-bold text-slate-700">Current Expiry: </span>{updatingRenewal.current_expiry_date}</p>
                  <p><span className="font-bold text-slate-700">Student Reason: </span>{updatingRenewal.reason}</p>
                </div>

                {newRenewalStatus in { APPROVED: 1, RENEWED: 1 } && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Expiry / Validity Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={customNewExpiry}
                      onChange={(e) => setCustomNewExpiry(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrative Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={adminRenewalNotes}
                    onChange={(e) => setAdminRenewalNotes(e.target.value)}
                    placeholder="e.g. Approved by Chief Librarian. Student in good standing..."
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setUpdatingRenewal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateRenewalStatus}
                    disabled={isUpdatingRenewalStatus}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    {isUpdatingRenewalStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Confirm {newRenewalStatus}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Book Confirmation */}
      <AnimatePresence>
        {deleteBookId !== null && (
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
                <h4 className="text-sm font-bold text-slate-900">Remove Book from Catalog?</h4>
                <p className="text-xs text-slate-500">
                  This book will be removed from the library catalog. Cannot be deleted if currently issued to any student.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteBookId(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  disabled={isDeletingBook}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {isDeletingBook && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
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

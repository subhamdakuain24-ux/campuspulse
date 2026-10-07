import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building,
  BookOpen,
  UtensilsCrossed,
  ShieldAlert,
  ArrowUpRight,
  Trash2,
  Edit3,
  X,
  FileText,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  FeeRecord,
  FeeCategory,
  FeeStatus,
  StudentFeesSummary,
  AdminFeesSummary,
  UserProfile,
  CreateFeePayload,
  UpdateFeePayload,
} from '../types';
import { api } from '../services/api';

interface FeesOperationsProps {
  user?: UserProfile;
  isStaffOrAdmin?: boolean;
}

const CATEGORIES: Array<{ key: FeeCategory; label: string; icon: React.ElementType }> = [
  { key: 'TUITION', label: 'Tuition Fee', icon: BookOpen },
  { key: 'HOSTEL', label: 'Hostel & Residence', icon: Building },
  { key: 'MESS', label: 'Mess & Dining Plan', icon: UtensilsCrossed },
  { key: 'LIBRARY', label: 'Library & Security', icon: FileText },
  { key: 'EXAM', label: 'Exam & Assessment', icon: Clock },
  { key: 'LABORATORY', label: 'Laboratory & Cloud', icon: TrendingUp },
  { key: 'OTHER', label: 'General / Other', icon: HelpCircle },
];

export const FeesOperations: React.FC<FeesOperationsProps> = ({ user, isStaffOrAdmin }) => {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [summary, setSummary] = useState<StudentFeesSummary | AdminFeesSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals (Admin)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState<CreateFeePayload>({
    student_id: '1',
    title: '',
    category: 'TUITION',
    term: 'Fall 2023',
    total_amount: 0,
    amount_paid: 0,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_method: '',
    notes: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<UpdateFeePayload>({
    amount_paid: 0,
    status: 'PAID',
    due_date: '',
    payment_method: '',
    transaction_reference: '',
    notes: '',
  });

  const loadFeesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.getFees({
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery.trim() || undefined,
      });

      if (res.success) {
        setFees(res.fees || []);
        setSummary(res.summary);
      } else {
        setError(res.error || 'Failed to load fee records.');
      }
    } catch (err: any) {
      console.warn('[FeesOperations] Load error:', err);
      setError(err?.message || 'Error connecting to fees backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeesData();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFeesData();
  };

  // Admin: Create Fee Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!createForm.title.trim()) {
      setFormError('Please enter a fee title.');
      return;
    }
    if (Number(createForm.total_amount) <= 0) {
      setFormError('Total amount must be greater than zero.');
      return;
    }
    if (Number(createForm.amount_paid) > Number(createForm.total_amount)) {
      setFormError('Amount paid cannot exceed total amount.');
      return;
    }
    if (!createForm.due_date) {
      setFormError('Please select a due date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createFee({
        ...createForm,
        total_amount: Number(createForm.total_amount),
        amount_paid: Number(createForm.amount_paid || 0),
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Fee record created successfully.');
        setIsCreateModalOpen(false);
        setCreateForm({
          student_id: '1',
          title: '',
          category: 'TUITION',
          term: 'Fall 2023',
          total_amount: 0,
          amount_paid: 0,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_method: '',
          notes: '',
        });
        loadFeesData();
      } else {
        setFormError(res.error || 'Failed to create fee record.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create fee record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin: Update Fee Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;
    setFormError(null);

    try {
      setIsSubmitting(true);
      const res = await api.updateFee(editingFee.id, {
        ...editForm,
        amount_paid: Number(editForm.amount_paid),
      });

      if (res.success) {
        setSuccessMsg(res.message || `Fee record #${editingFee.id} updated successfully.`);
        setEditingFee(null);
        loadFeesData();
      } else {
        setFormError(res.error || 'Failed to update fee record.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to update fee record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin: Delete Fee
  const handleDeleteFee = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await api.deleteFee(id);
      if (res.success) {
        setSuccessMsg(res.message || `Fee record #${id} removed successfully.`);
        setFees((prev) => prev.filter((f) => f.id !== id));
      } else {
        setError(res.error || 'Failed to delete fee record.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete fee record.');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (fee: FeeRecord) => {
    setEditingFee(fee);
    setEditForm({
      amount_paid: fee.amount_paid,
      status: fee.status,
      due_date: fee.due_date,
      payment_method: fee.payment_method || '',
      transaction_reference: fee.transaction_reference || '',
      notes: fee.notes || '',
    });
    setFormError(null);
  };

  // Helper for Status Badge
  const getStatusBadge = (status: FeeStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Partially Paid
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Overdue
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Pending Due
          </span>
        );
    }
  };

  // Helper formatting currency
  const formatCur = (val: number | undefined) => {
    const num = Number(val || 0);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
              <CreditCard className="w-4 h-4" />
              <span>{isStaffOrAdmin ? 'Campus Financial Administration' : 'Student Accounts & Dues'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isStaffOrAdmin ? 'Fees & Dues Management' : 'My Fees & Dues Overview'}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              {isStaffOrAdmin
                ? 'Review institutional fee assessments, verify student payments, adjust due dates, and track overdue receivables.'
                : 'View semester tuition, hostel charges, mess meal plans, library deposits, and outstanding balances with real-time payment status.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={loadFeesData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {isStaffOrAdmin && (
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  setFormError(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Fee Record
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Assessed */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isStaffOrAdmin ? 'Total Assessed' : 'Total Fees'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatCur(
                  isStaffOrAdmin
                    ? (summary as AdminFeesSummary).total_assessed
                    : (summary as StudentFeesSummary).total_fees
                )}
              </span>
              <BookOpen className="w-4 h-4 text-indigo-500 hidden sm:block" />
            </div>
            <p className="text-[10px] text-slate-400">Total institutional charges</p>
          </div>

          {/* Card 2: Amount Paid / Collected */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              {isStaffOrAdmin ? 'Total Collected' : 'Amount Paid'}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
                {formatCur(
                  isStaffOrAdmin
                    ? (summary as AdminFeesSummary).total_collected
                    : (summary as StudentFeesSummary).amount_paid
                )}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 hidden sm:block" />
            </div>
            <p className="text-[10px] text-slate-400">Verified cleared payments</p>
          </div>

          {/* Card 3: Outstanding / Pending */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Outstanding Dues
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-700 tracking-tight">
                {formatCur(
                  isStaffOrAdmin
                    ? (summary as AdminFeesSummary).total_outstanding
                    : (summary as StudentFeesSummary).outstanding_amount
                )}
              </span>
              <Clock className="w-4 h-4 text-amber-500 hidden sm:block" />
            </div>
            <p className="text-[10px] text-slate-400">Pending remaining balance</p>
          </div>

          {/* Card 4: Overdue */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Overdue Amount
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-extrabold text-rose-700 tracking-tight">
                {formatCur(
                  isStaffOrAdmin
                    ? (summary as AdminFeesSummary).total_overdue
                    : (summary as StudentFeesSummary).overdue_amount
                )}
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-500 hidden sm:block" />
            </div>
            <p className="text-[10px] text-rose-500 font-medium">Past designated deadline</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isStaffOrAdmin ? 'Search by title, student name, ID, or notes...' : 'Search fee dues...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Fee Records List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs font-semibold text-slate-700">Loading fee records from database...</p>
          </div>
        ) : fees.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No fee records found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                ? 'Try clearing the search query or adjusting active filters.'
                : 'All caught up! No dues are registered at this time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {fees.map((fee) => {
              const CategoryIcon =
                CATEGORIES.find((c) => c.key === fee.category)?.icon || CreditCard;

              return (
                <div
                  key={fee.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        fee.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-600'
                          : fee.status === 'OVERDUE'
                          ? 'bg-rose-50 text-rose-600'
                          : fee.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(fee.status)}

                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {fee.category_label || fee.category}
                        </span>

                        {fee.term && (
                          <span className="text-[10px] font-medium text-slate-400">
                            • {fee.term}
                          </span>
                        )}

                        {isStaffOrAdmin && (
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                            Student: {fee.student_name} ({fee.student_identifier})
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {fee.title}
                      </h3>

                      {fee.notes && (
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                          {fee.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due Date:{' '}
                          <strong
                            className={
                              fee.status === 'OVERDUE' ? 'text-rose-600 font-bold' : 'text-slate-700'
                            }
                          >
                            {fee.due_date}
                          </strong>
                        </span>

                        {fee.transaction_reference && (
                          <span>
                            Ref: <code className="text-slate-700">{fee.transaction_reference}</code>
                          </span>
                        )}

                        {fee.payment_method && (
                          <span>
                            Via: <strong className="text-slate-700">{fee.payment_method}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown & Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0 gap-2">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">
                        Total: {formatCur(fee.total_amount)}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-slate-500">Paid: {formatCur(fee.amount_paid)}</span>
                        {fee.outstanding_amount > 0 && (
                          <span className="text-sm font-extrabold text-rose-600">
                            (Due: {formatCur(fee.outstanding_amount)})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isStaffOrAdmin && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(fee)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                          title="Update payment amount, status, or due date"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Update
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === fee.id}
                          onClick={() => handleDeleteFee(fee.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete fee record"
                        >
                          {deletingId === fee.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ADMIN MODAL: CREATE FEE RECORD */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Fee Record</h3>
                  <p className="text-xs text-slate-400">Assess fee charges to a registered student</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Student ID / Identifier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.student_id}
                  onChange={(e) => setCreateForm({ ...createForm, student_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                >
                  <option value="1">Alex Johnson (CP-847291 / STU-2023-8941)</option>
                  <option value="2">Jane Smith (CP-992211 / STU-2023-9922)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Fee Title / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spring 2024 Tuition Fee, Hostel Mess Advance..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category: e.target.value as FeeCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Term</label>
                  <input
                    type="text"
                    value={createForm.term}
                    onChange={(e) => setCreateForm({ ...createForm, term: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Total Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createForm.total_amount || ''}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, total_amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Amount Paid ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createForm.amount_paid || ''}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount_paid: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={createForm.due_date}
                  onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or payment instructions..."
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADMIN MODAL: UPDATE FEE RECORD */}
      {/* ========================================================= */}
      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Fee & Payment</h3>
                  <p className="text-xs text-slate-400">
                    Record payment, adjust due date, or change status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingFee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">
                  {editingFee.student_name} ({editingFee.student_identifier})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fee Item:</span>
                <span className="font-bold text-slate-800">{editingFee.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Assessed:</span>
                <span className="font-extrabold text-slate-900">{formatCur(editingFee.total_amount)}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount Paid ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={editingFee.total_amount}
                    value={editForm.amount_paid ?? 0}
                    onChange={(e) =>
                      setEditForm({ ...editForm, amount_paid: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Outstanding: {formatCur(Math.max(0, editingFee.total_amount - (editForm.amount_paid || 0)))}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value as FeeStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PENDING">PENDING</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI, NetBanking, Card"
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-89210"
                    value={editForm.transaction_reference}
                    onChange={(e) =>
                      setEditForm({ ...editForm, transaction_reference: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

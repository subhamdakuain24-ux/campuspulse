import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wrench,
  FileCheck2,
  DoorOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Plus,
  Search,
  ChevronRight,
  User,
  Building2,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ArrowRight,
  Info,
  CalendarDays,
  FileText,
  HelpCircle,
  Tag,
  Check,
  X,
  MessageSquare,
  Sparkles,
  ArrowUpDown,
  CheckCheck,
  Shield,
  Layers,
} from 'lucide-react';
import {
  CampusRequest,
  CampusRequestType,
  CampusPriority,
  CampusOperationsStats,
  UserProfile,
  CreateRequestPayload,
} from '../types';
import { api } from '../services/api';

interface OperationsScreenProps {
  user: UserProfile;
  onNavigateToNotifications?: () => void;
}

const DEPARTMENTS = [
  'Hostel Maintenance & Plumbing',
  'Campus IT & Network Ops',
  'Academic Affairs & Registrar',
  'Hostel Wardens Office',
  'Dean of Student Affairs',
  'Electrical & Power Systems',
  'Carpentry & Glazing Works',
  'Sanitation & Cleanliness',
  'Campus Security',
];

const COMPLAINT_CATEGORIES = [
  'HOSTEL',
  'PLUMBING',
  'ELECTRICAL',
  'CLEANLINESS',
  'WATER',
  'WIFI_NETWORK',
  'CLASSROOM',
  'WASHROOM',
  'OTHER',
];

export const OperationsScreen: React.FC<OperationsScreenProps> = ({ user }) => {
  const isAdmin = user.role === 'Admin';
  const isTeacher = user.role === 'Teacher';
  const isStaffOrAdmin = isAdmin || isTeacher;

  const [activeTab, setActiveTab] = useState<'all' | 'complaints' | 'certificates' | 'passes' | 'stats'>('all');
  const [requests, setRequests] = useState<CampusRequest[]>([]);
  const [stats, setStats] = useState<CampusOperationsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters and Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'ageing'>('newest');

  // Dynamically computed list of staff members from current requests and defaults
  const staffList = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.assigned_staff && r.assigned_staff.trim()) {
        set.add(r.assigned_staff.trim());
      }
    });
    ['Tech. Ramesh Kumar', 'Officer Marcus Vance', 'Elena Rostova (Registrar)', 'Warden Michael Chang'].forEach((s) => set.add(s));
    return Array.from(set).sort();
  }, [requests]);

  // Success Banner State
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    id: string;
    type: string;
    status: string;
    date: string;
    title: string;
  } | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<CampusRequestType>('HOSTEL_COMPLAINT');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CampusRequest | null>(null);

  // Quick Admin Action states inside detail modal
  const [adminStatus, setAdminStatus] = useState('');
  const [adminDept, setAdminDept] = useState('');
  const [adminStaff, setAdminStaff] = useState('');
  const [adminPriority, setAdminPriority] = useState<CampusPriority>('MEDIUM');
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Create Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('HOSTEL');
  const [formLocation, setFormLocation] = useState('');
  const [formPriority, setFormPriority] = useState<CampusPriority>('MEDIUM');
  const [formPurpose, setFormPurpose] = useState('');
  const [formRequiredDate, setFormRequiredDate] = useState('');
  const [formCopies, setFormCopies] = useState('1');
  const [formPassType, setFormPassType] = useState<'GATE_PASS' | 'LEAVE'>('GATE_PASS');
  const [formReason, setFormReason] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formReturnDate, setFormReturnDate] = useState('');
  const [formEmergencyContact, setFormEmergencyContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch data
  const loadData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [reqList, statsData] = await Promise.all([
        api.getCampusRequests({ sort: sortBy }),
        api.getCampusOperationsStats(),
      ]);
      setRequests(reqList);
      setStats(statsData);
    } catch (err: any) {
      console.warn('[OperationsScreen] Error loading data:', err);
      setApiError(err?.message || 'Failed to load operational requests from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [sortBy]);

  // Filter requests based on active tab, filters, and search
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Tab filter
      if (activeTab === 'complaints') {
        if (r.request_type !== 'HOSTEL_COMPLAINT' && r.request_type !== 'FACILITY_COMPLAINT') return false;
      } else if (activeTab === 'certificates') {
        if (r.request_type !== 'CERTIFICATE_REQUEST') return false;
      } else if (activeTab === 'passes') {
        if (r.request_type !== 'GATE_PASS' && r.request_type !== 'LEAVE_REQUEST') return false;
      }

      // Type Filter
      if (typeFilter !== 'ALL') {
        if (r.request_type !== typeFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING') {
          if (r.status !== 'PENDING' && r.status !== 'SUBMITTED') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;

      // Department filter
      if (deptFilter !== 'ALL') {
        if (deptFilter === 'Unassigned') {
          if (r.assigned_department && r.assigned_department !== 'Unassigned') return false;
        } else if (r.assigned_department !== deptFilter) {
          return false;
        }
      }

      // Assigned Staff filter
      if (staffFilter !== 'ALL') {
        if (staffFilter === 'Unassigned') {
          if (r.assigned_staff && r.assigned_staff.trim() && r.assigned_staff !== 'Unassigned') return false;
        } else if (r.assigned_staff !== staffFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchId = r.public_id.toLowerCase().includes(q);
        const matchLoc = (r.location || '').toLowerCase().includes(q);
        const matchStudent = (r.student_name || '').toLowerCase().includes(q);
        const matchStaff = (r.assigned_staff || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchId && !matchLoc && !matchStudent && !matchStaff) return false;
      }

      return true;
    });
  }, [requests, activeTab, typeFilter, statusFilter, priorityFilter, deptFilter, staffFilter, searchQuery]);

  // Open detail modal with full activities
  const handleOpenDetail = async (req: CampusRequest) => {
    setSelectedRequest(req);
    setAdminStatus(req.status);
    setAdminDept(req.assigned_department || '');
    setAdminStaff(req.assigned_staff || '');
    setAdminPriority(req.priority);
    setAdminNote('');
    setActionSuccessMsg('');
    setDetailModalOpen(true);

    // Fetch refreshed detail with full audit activities
    try {
      const detail = await api.getCampusRequestDetail(req.public_id);
      if (detail) {
        setSelectedRequest(detail);
        setAdminStatus(detail.status);
        setAdminDept(detail.assigned_department || '');
        setAdminStaff(detail.assigned_staff || '');
        setAdminPriority(detail.priority);
      }
    } catch (e: any) {
      console.warn('Failed to load fresh detail:', e);
    }
  };

  // Handle Admin Quick Update
  const handleAdminUpdate = async (overrideStatus?: string, overrideNote?: string) => {
    if (!selectedRequest) return;
    setIsUpdating(true);
    setActionSuccessMsg('');
    const targetStatus = overrideStatus || adminStatus;
    const targetNote = overrideNote !== undefined ? overrideNote : adminNote.trim();

    try {
      const res = await api.updateCampusRequest(selectedRequest.public_id, {
        status: targetStatus !== selectedRequest.status ? targetStatus : undefined,
        assigned_department: adminDept !== selectedRequest.assigned_department ? adminDept : undefined,
        assigned_staff: adminStaff !== selectedRequest.assigned_staff ? adminStaff : undefined,
        priority: adminPriority !== selectedRequest.priority ? adminPriority : undefined,
        note: targetNote || undefined,
      });

      if (res.success && res.request) {
        setActionSuccessMsg('Action completed! Student notified.');
        setSelectedRequest(res.request);
        setAdminStatus(res.request.status);
        setAdminNote('');
        loadData(false);
      } else {
        alert(res.error || 'Failed to update request');
      }
    } catch (err: any) {
      alert(err?.message || 'Error executing update');
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit new request
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);

    try {
      let payload: CreateRequestPayload;

      if (createType === 'HOSTEL_COMPLAINT' || createType === 'FACILITY_COMPLAINT') {
        if (!formTitle.trim() || !formDesc.trim() || !formLocation.trim()) {
          setCreateError('Please fill in title, description, and specific location.');
          setIsSubmitting(false);
          return;
        }
        payload = {
          request_type: createType,
          title: formTitle.trim(),
          description: formDesc.trim(),
          category: formCategory,
          location: formLocation.trim(),
          priority: formPriority,
          meta: {
            reported_by: user.name,
            contact: user.phone || '',
          },
        };
      } else if (createType === 'CERTIFICATE_REQUEST') {
        if (!formPurpose.trim()) {
          setCreateError('Please specify the purpose for the certificate.');
          setIsSubmitting(false);
          return;
        }
        payload = {
          request_type: 'CERTIFICATE_REQUEST',
          title: `Bonafide Certificate Request (${formPurpose.trim()})`,
          description: `Application for official Bonafide Certificate. Purpose: ${formPurpose.trim()}. ${formDesc.trim()}`.trim(),
          category: 'BONAFIDE',
          location: 'Academic Registrar Office',
          priority: formPriority,
          meta: {
            certificate_type: 'BONAFIDE',
            purpose: formPurpose.trim(),
            required_date: formRequiredDate || 'As soon as possible',
            copies: parseInt(formCopies) || 1,
            student_id: user.studentId || 'CP-847291',
          },
        };
      } else {
        // GATE_PASS or LEAVE_REQUEST
        if (!formReason.trim() || !formStartDate || !formReturnDate) {
          setCreateError('Please provide reason, departure date/time, and expected return date/time.');
          setIsSubmitting(false);
          return;
        }
        const isPass = formPassType === 'GATE_PASS';
        payload = {
          request_type: isPass ? 'GATE_PASS' : 'LEAVE_REQUEST',
          title: `${isPass ? 'Gate Pass' : 'Academic Leave'}: ${formReason.trim()}`,
          description: `Destination: ${formDestination || 'Not specified'}. Reason: ${formReason.trim()}. Expected Return: ${formReturnDate}`,
          category: isPass ? 'GATE_PASS' : 'LEAVE_REQUEST',
          location: 'Campus Security / Warden Gate',
          priority: formPriority,
          meta: {
            request_sub_type: formPassType,
            reason: formReason.trim(),
            destination: formDestination.trim() || 'Home',
            start_date: formStartDate,
            return_date: formReturnDate,
            emergency_contact: formEmergencyContact || user.phone || 'Campus Hostel Desk',
          },
        };
      }

      const res = await api.createCampusRequest(payload);
      if (res.success && res.request) {
        setCreateModalOpen(false);
        resetForm();
        setSubmissionSuccess({
          id: res.request.public_id,
          type: res.request.request_type.replace(/_/g, ' '),
          status: res.request.status,
          date: res.request.created_at.slice(0, 10),
          title: res.request.title,
        });
        loadData(false);
      } else {
        setCreateError(res.error || 'Failed to submit request.');
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Error submitting request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormCategory('HOSTEL');
    setFormLocation('');
    setFormPriority('MEDIUM');
    setFormPurpose('');
    setFormRequiredDate('');
    setFormCopies('1');
    setFormPassType('GATE_PASS');
    setFormReason('');
    setFormDestination('');
    setFormStartDate('');
    setFormReturnDate('');
    setFormEmergencyContact('');
    setCreateError('');
  };

  // Helper status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'SUBMITTED':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
          label: status === 'PENDING' ? 'Pending' : 'Submitted',
        };
      case 'ASSIGNED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: User,
          label: 'Assigned',
        };
      case 'IN_PROGRESS':
      case 'PROCESSING':
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500 animate-pulse',
          icon: RefreshCw,
          label: status === 'UNDER_REVIEW' ? 'Under Review' : status === 'PROCESSING' ? 'Processing' : 'In Progress',
        };
      case 'RESOLVED':
      case 'APPROVED':
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: status === 'APPROVED' ? 'Approved' : status === 'RESOLVED' ? 'Resolved' : 'Completed',
        };
      case 'CLOSED':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          icon: Check,
          label: 'Closed',
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
          label: 'Rejected',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: Info,
          label: status,
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200 font-semibold';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200 font-medium';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getTypeIcon = (type: CampusRequestType) => {
    switch (type) {
      case 'HOSTEL_COMPLAINT':
      case 'FACILITY_COMPLAINT':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'CERTIFICATE_REQUEST':
        return <FileCheck2 className="w-4 h-4 text-indigo-600" />;
      case 'GATE_PASS':
      case 'LEAVE_REQUEST':
        return <DoorOpen className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase border border-indigo-400/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Campus Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isStaffOrAdmin ? 'Campus Operations Command Center' : 'Campus Operations & Request Hub'}
            </h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
              {isStaffOrAdmin
                ? 'Review student complaints, process bonafide certificates, manage gate passes, assign staff, and track resolution audit history.'
                : 'Raise hostel maintenance complaints, apply for official bonafide certificates, request weekend gate passes or leaves, and track live status updates.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <button
              onClick={() => {
                resetForm();
                setCreateType('HOSTEL_COMPLAINT');
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>

        {/* Quick Workflow Action Shortcuts for Students */}
        {!isStaffOrAdmin && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => {
                resetForm();
                setCreateType('HOSTEL_COMPLAINT');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Hostel Complaint
                </p>
                <p className="text-[11px] text-slate-400">Plumbing, room repairs & electrical</p>
              </div>
            </button>

            <button
              onClick={() => {
                resetForm();
                setCreateType('FACILITY_COMPLAINT');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Facility Complaint
                </p>
                <p className="text-[11px] text-slate-400">Labs, classrooms, campus Wi-Fi</p>
              </div>
            </button>

            <button
              onClick={() => {
                resetForm();
                setCreateType('CERTIFICATE_REQUEST');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Bonafide Certificate
                </p>
                <p className="text-[11px] text-slate-400">Official certificate for loan & passport</p>
              </div>
            </button>

            <button
              onClick={() => {
                resetForm();
                setCreateType('GATE_PASS');
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Gate Pass / Leave
                </p>
                <p className="text-[11px] text-slate-400">Weekend outing or hackathon leave</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Submission Success Alert Banner */}
      <AnimatePresence>
        {submissionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-emerald-800">
                    Request Submitted Successfully
                  </span>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900">
                    {submissionSuccess.id}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                    {submissionSuccess.status}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-0.5">
                  <strong>{submissionSuccess.title}</strong> • Created on {submissionSuccess.date}. Track updates below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  const target = requests.find((r) => r.public_id === submissionSuccess.id);
                  if (target) handleOpenDetail(target);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Track Timeline
              </button>
              <button
                onClick={() => setSubmissionSuccess(null)}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error & Retry Banner */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button
            onClick={() => loadData(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Cards (For Admin: 7 Required Summary Metrics) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-[10px] text-slate-400">All</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-amber-200/80 shadow-xs bg-gradient-to-br from-amber-50/40 to-white">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Pending</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-amber-600">{stats.pending}</span>
              <span className="text-[10px] text-amber-600/80">Action</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-indigo-200/80 shadow-xs bg-gradient-to-br from-indigo-50/40 to-white">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">In Progress</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">{stats.in_progress}</span>
              <span className="text-[10px] text-indigo-600/80">Active</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-emerald-200/80 shadow-xs bg-gradient-to-br from-emerald-50/40 to-white">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Approved</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.approved}</span>
              <span className="text-[10px] text-emerald-600/80">Passes</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-teal-200/80 shadow-xs bg-gradient-to-br from-teal-50/40 to-white">
            <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">Resolved</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-teal-600">{stats.resolved}</span>
              <span className="text-[10px] text-teal-600/80">Done</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-rose-200/80 shadow-xs bg-gradient-to-br from-rose-50/40 to-white">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Rejected</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-rose-600">{stats.rejected}</span>
              <span className="text-[10px] text-rose-600/80">Closed</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-slate-300 shadow-xs bg-gradient-to-br from-slate-50 to-white col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Unassigned</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-700">{stats.unassigned}</span>
              <span className="text-[10px] text-slate-500">Need Dept</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Operations Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 px-4 sm:px-6 pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Requests ({requests.length})
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'complaints'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Complaints
            </button>

            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'certificates'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Bonafide Certificates
            </button>

            <button
              onClick={() => setActiveTab('passes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'passes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              Gate Passes & Leave
            </button>

            {isStaffOrAdmin && (
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'stats'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Workload & Depts
              </button>
            )}
          </div>

          {/* Sort & Filter Controls */}
          {activeTab !== 'stats' && (
            <div className="flex flex-wrap items-center gap-2 pb-3">
              {/* Search input */}
              <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ID, title, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Request Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">Type: All</option>
                <option value="HOSTEL_COMPLAINT">Hostel Complaint</option>
                <option value="FACILITY_COMPLAINT">Facility Complaint</option>
                <option value="CERTIFICATE_REQUEST">Bonafide Certificate</option>
                <option value="GATE_PASS">Gate Pass</option>
                <option value="LEAVE_REQUEST">Leave Request</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">Status: All</option>
                <option value="PENDING">Pending / Submitted</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PROCESSING">Processing</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Approved</option>
                <option value="RESOLVED">Resolved</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Department Filter (Admin view) */}
              {isStaffOrAdmin && (
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <option value="ALL">Dept: All</option>
                  <option value="Unassigned">Unassigned Only</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              {/* Assigned Staff Filter (Admin view) */}
              {isStaffOrAdmin && (
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <option value="ALL">Staff: All</option>
                  <option value="Unassigned">Unassigned Only</option>
                  {staffList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort Order */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs bg-transparent text-slate-700 font-medium focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="ageing">Oldest Unresolved (Ageing)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tab 5: Department Workload & Stats View */}
        {activeTab === 'stats' && stats && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Workload Breakdown */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Department Workload Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.department_workload).map(([dept, count]) => {
                    const numCount = Number(count);
                    const pct = Math.round((numCount / Math.max(1, stats.total)) * 100);
                    return (
                      <div key={dept} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-700">{dept}</span>
                          <span className="text-slate-900 font-bold">{numCount} requests ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Workflow Type Breakdown */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  Requests by Workflow Category
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.by_type).map(([typ, count]) => {
                    const cleanName = typ.replace(/_/g, ' ');
                    return (
                      <div
                        key={typ}
                        className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/80"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                            {getTypeIcon(typ as CampusRequestType)}
                          </div>
                          <span className="text-xs font-semibold text-slate-800 capitalize">
                            {cleanName.toLowerCase()}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests List View */}
        {activeTab !== 'stats' && (
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-xs">Loading campus requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No requests found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting filters or submit a new campus operations request.
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const statusBadge = getStatusBadge(req.status);
                const StatusIcon = statusBadge.icon;
                const isUnresolved = !['RESOLVED', 'APPROVED', 'COMPLETED', 'CLOSED', 'REJECTED'].includes(req.status);
                const isAged = req.age?.is_aged && isUnresolved;

                return (
                  <div
                    key={req.id}
                    onClick={() => handleOpenDetail(req)}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Workflow Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:scale-105 transition-transform">
                        {getTypeIcon(req.request_type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {req.public_id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getPriorityBadge(
                              req.priority
                            )}`}
                          >
                            {req.priority}
                          </span>
                          {isAged && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Aged ({req.age?.formatted})
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            • Age: <strong className="text-slate-600">{req.age?.formatted}</strong>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {req.title}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {req.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                          {isStaffOrAdmin && (
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <User className="w-3 h-3 text-slate-400" />
                              {req.student_name} ({req.student_identifier})
                            </span>
                          )}
                          {req.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {req.location}
                            </span>
                          )}
                          {req.assigned_department ? (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {req.assigned_department}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">• Unassigned</span>
                          )}
                          {req.assigned_staff && (
                            <span className="flex items-center gap-1 text-indigo-600 font-medium">
                              <User className="w-3 h-3 text-indigo-400" />
                              {req.assigned_staff}
                            </span>
                          )}
                          {req.resolution_time && (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Resolved in {req.resolution_time.formatted}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right status badge + arrow */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusBadge.label}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Detail & Activity Timeline Modal */}
      <AnimatePresence>
        {detailModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md border border-indigo-200">
                      {selectedRequest.public_id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getPriorityBadge(
                        selectedRequest.priority
                      )}`}
                    >
                      {selectedRequest.priority} Priority
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedRequest.request_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">{selectedRequest.title}</h2>
                </div>

                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                {/* Description & Metadata Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Description & Scope
                    </span>
                    <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                      {selectedRequest.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Student</span>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {selectedRequest.student_name} ({selectedRequest.student_identifier})
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Location</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.location || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Department</span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {selectedRequest.assigned_department || 'Pending Assignment'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Assigned Staff</span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {selectedRequest.assigned_staff || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Operational Age</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.age?.formatted}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-semibold">Current Status</span>
                      <div className="mt-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            getStatusBadge(selectedRequest.status).bg
                          }`}
                        >
                          {getStatusBadge(selectedRequest.status).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Extra metadata fields if present */}
                  {selectedRequest.meta && Object.keys(selectedRequest.meta).length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80">
                      <span className="text-slate-400 text-[10px] uppercase font-semibold block mb-1">
                        Workflow Parameters
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(selectedRequest.meta).map(([k, v]) => (
                          <div key={k} className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-slate-400 text-[10px] capitalize block">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <span className="font-medium text-slate-800 text-[11px]">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution banner if resolved */}
                  {selectedRequest.resolved_at && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-emerald-700 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                      <span className="flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Resolved on {selectedRequest.resolved_at}
                      </span>
                      <span className="font-bold">
                        Turnaround: {selectedRequest.resolution_time?.formatted}
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit & Activity Timeline Section (Lightweight & Mobile-Friendly) */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Consistent Activity Timeline
                  </h3>

                  {selectedRequest.activities && selectedRequest.activities.length > 0 ? (
                    <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {selectedRequest.activities.map((act) => {
                        const isResolved = act.action.includes('RESOLVED') || act.action.includes('APPROVED') || act.action.includes('COMPLETED');
                        return (
                          <div key={act.id} className="relative">
                            <div
                              className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-white ${
                                isResolved ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                            />
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                  {isResolved && <Check className="w-3 h-3 text-emerald-600" />}
                                  {act.notes || act.action.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {act.created_at}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                <span>
                                  Actor: <strong className="text-slate-700">{act.actor_name}</strong> (
                                  <span className="capitalize">{act.actor_role}</span>)
                                </span>
                                {act.new_status && (
                                  <span className="font-mono px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-bold">
                                    &rarr; {act.new_status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No activity logged yet.</p>
                  )}
                </div>

                {/* Admin Quick Action Panel (Authorized Staff/Admin only) */}
                {isStaffOrAdmin && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-indigo-600" />
                        Admin / Staff Action Console
                      </h4>
                      {actionSuccessMsg && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {actionSuccessMsg}
                        </span>
                      )}
                    </div>

                    {/* Quick Demonstration Buttons based on Workflow */}
                    <div className="p-3 rounded-xl bg-white border border-indigo-100 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Quick Transition Actions
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {/* Complaint Actions */}
                        {selectedRequest.request_type.includes('COMPLAINT') && (
                          <>
                            {selectedRequest.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminStatus('ASSIGNED');
                                  if (!adminDept) setAdminDept('Hostel Maintenance & Plumbing');
                                  handleAdminUpdate('ASSIGNED', 'Assigned to Maintenance');
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                              >
                                Assign to Maintenance
                              </button>
                            )}
                            {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'ASSIGNED') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminStatus('IN_PROGRESS');
                                  handleAdminUpdate('IN_PROGRESS', 'Status changed to In Progress');
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                              >
                                Mark In Progress
                              </button>
                            )}
                            {selectedRequest.status === 'IN_PROGRESS' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminStatus('RESOLVED');
                                  handleAdminUpdate('RESOLVED', 'Complaint resolved');
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                              >
                                Resolve Complaint
                              </button>
                            )}
                          </>
                        )}

                        {/* Bonafide Certificate Actions */}
                        {selectedRequest.request_type === 'CERTIFICATE_REQUEST' && (
                          <>
                            {selectedRequest.status === 'SUBMITTED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminStatus('PROCESSING');
                                  handleAdminUpdate('PROCESSING', 'Moved to processing');
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                              >
                                Move to Processing
                              </button>
                            )}
                            {selectedRequest.status === 'PROCESSING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminStatus('APPROVED');
                                  handleAdminUpdate('APPROVED', 'Request approved');
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                              >
                                Approve Certificate
                              </button>
                            )}
                            {selectedRequest.status === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAdminStatus('COMPLETED');
                                  handleAdminUpdate('COMPLETED', 'Certificate completed');
                                }}
                                disabled={isUpdating}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                              >
                                Mark Completed
                              </button>
                            )}
                          </>
                        )}

                        {/* Gate Pass / Leave Actions */}
                        {(selectedRequest.request_type === 'GATE_PASS' || selectedRequest.request_type === 'LEAVE_REQUEST') && (
                          <>
                            {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'SUBMITTED' || selectedRequest.status === 'UNDER_REVIEW') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminStatus('APPROVED');
                                    handleAdminUpdate('APPROVED', 'Gate pass approved by warden');
                                  }}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                                >
                                  Approve Pass
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminStatus('REJECTED');
                                    handleAdminUpdate('REJECTED', 'Request rejected by warden');
                                  }}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                                >
                                  Reject Pass
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Detailed Fields Configuration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Status Transition
                        </label>
                        <select
                          value={adminStatus}
                          onChange={(e) => setAdminStatus(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium"
                        >
                          {selectedRequest.request_type.includes('COMPLAINT') && (
                            <>
                              <option value="PENDING">PENDING</option>
                              <option value="ASSIGNED">ASSIGNED</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="RESOLVED">RESOLVED</option>
                              <option value="REJECTED">REJECTED</option>
                              <option value="CLOSED">CLOSED</option>
                            </>
                          )}
                          {selectedRequest.request_type === 'CERTIFICATE_REQUEST' && (
                            <>
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="REJECTED">REJECTED</option>
                            </>
                          )}
                          {(selectedRequest.request_type === 'GATE_PASS' ||
                            selectedRequest.request_type === 'LEAVE_REQUEST') && (
                            <>
                              <option value="PENDING">PENDING</option>
                              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="REJECTED">REJECTED</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Assign Department
                        </label>
                        <select
                          value={adminDept}
                          onChange={(e) => setAdminDept(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                        >
                          <option value="">-- Choose Department --</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Assign Staff Member
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Officer Davis, Tech Kumar"
                          value={adminStaff}
                          onChange={(e) => setAdminStaff(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Update Priority
                        </label>
                        <select
                          value={adminPriority}
                          onChange={(e) => setAdminPriority(e.target.value as CampusPriority)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Operational Update / Note (Logged in audit trail and notified to student)
                      </label>
                      <input
                        type="text"
                        placeholder="Add reason, inspection note, or instructions..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleAdminUpdate()}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        Save Update & Notify Student
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Request Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Campus Request</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified ticketing for hostel maintenance, certificates & gate passes
                  </p>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workflow Selector Tabs */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => {
                    setCreateType('HOSTEL_COMPLAINT');
                    setCreateError('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    createType === 'HOSTEL_COMPLAINT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Hostel Complaint
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateType('FACILITY_COMPLAINT');
                    setCreateError('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    createType === 'FACILITY_COMPLAINT'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Facility Complaint
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateType('CERTIFICATE_REQUEST');
                    setCreateError('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    createType === 'CERTIFICATE_REQUEST'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Bonafide Certificate
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateType('GATE_PASS');
                    setCreateError('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    createType === 'GATE_PASS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  Gate Pass / Leave
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Workflow 1: Complaint Form */}
                {(createType === 'HOSTEL_COMPLAINT' || createType === 'FACILITY_COMPLAINT') && (
                  <>
                    <div className="flex gap-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="complaintSubtype"
                          checked={createType === 'HOSTEL_COMPLAINT'}
                          onChange={() => setCreateType('HOSTEL_COMPLAINT')}
                        />
                        Hostel Complaint
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="complaintSubtype"
                          checked={createType === 'FACILITY_COMPLAINT'}
                          onChange={() => setCreateType('FACILITY_COMPLAINT')}
                        />
                        Facility Complaint
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        >
                          {COMPLAINT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Priority <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formPriority}
                          onChange={(e) => setFormPriority(e.target.value as CampusPriority)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="URGENT">URGENT</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Location / Room / Block <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room 402, Oak Ridge Hall / Lab 304"
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Subject / Brief Summary <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Water faucet dripping continuously"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Detailed Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Describe the issue, when it started, and any safety concerns..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Workflow 2: Bonafide Certificate Form */}
                {createType === 'CERTIFICATE_REQUEST' && (
                  <>
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        Official Bonafide Certificates are digitally verified and signed by the Registrar Office.
                        Student ID: <strong>{user.studentId || 'CP-847291'}</strong>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Purpose of Certificate <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. State Bank Education Loan / Passport / Visa / Scholarship"
                        value={formPurpose}
                        onChange={(e) => setFormPurpose(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Date Required By
                        </label>
                        <input
                          type="date"
                          value={formRequiredDate}
                          onChange={(e) => setFormRequiredDate(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Number of Copies
                        </label>
                        <select
                          value={formCopies}
                          onChange={(e) => setFormCopies(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="1">1 Original Copy</option>
                          <option value="2">2 Copies</option>
                          <option value="3">3 Copies</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Additional Notes / Specific Requirements
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Please mention tuition fee schedule and current semester..."
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </>
                )}

                {/* Workflow 3: Gate Pass / Leave Form */}
                {createType === 'GATE_PASS' && (
                  <>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="passType"
                          checked={formPassType === 'GATE_PASS'}
                          onChange={() => setFormPassType('GATE_PASS')}
                        />
                        Day / Weekend Gate Pass
                      </label>

                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="passType"
                          checked={formPassType === 'LEAVE'}
                          onChange={() => setFormPassType('LEAVE')}
                        />
                        Academic / Emergency Leave
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Weekend family visit / Inter-collegiate competition"
                        value={formReason}
                        onChange={(e) => setFormReason(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Destination Address / City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Springfield (Home) / City Center Convention"
                        value={formDestination}
                        onChange={(e) => setFormDestination(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Departure Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Expected Return Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={formReturnDate}
                          onChange={(e) => setFormReturnDate(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Parent / Emergency Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +1 (555) 234-8921"
                        value={formEmergencyContact}
                        onChange={(e) => setFormEmergencyContact(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </>
                )}

                {/* Submit button bar */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

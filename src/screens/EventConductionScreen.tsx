import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  Phone,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  RefreshCw,
  Eye,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  Info,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import {
  UserProfile,
  EventApplication,
  EventStatus,
  CreateEventApplicationPayload,
} from '../types';
import { api } from '../services/api';

interface EventConductionScreenProps {
  user: UserProfile;
}

const DEFAULT_EVENT_TYPES = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Academic Seminar',
  'Workshop / Hands-on',
  'Hackathon & Coding',
  'Guest Lecture',
  'Social & Community',
  'Club Activity',
  'Other',
];

const DEFAULT_VENUES = [
  'Main University Auditorium (Capacity: 1200)',
  'APJ Abdul Kalam Seminar Hall (Capacity: 250)',
  'Aryabhatta Conference Hall (Capacity: 150)',
  'Open Air Amphitheatre (Capacity: 800)',
  'Central Sports Ground (Outdoor)',
  'Indoor Sports Complex (Capacity: 500)',
  'Computer Science Lab 4 / Digital Hub (Capacity: 80)',
  'Civil & Mechanical Workshop Area',
  'Student Activity Center (SAC) Multi-Purpose Hall',
];

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];

export const EventConductionScreen: React.FC<EventConductionScreenProps> = ({ user }) => {
  const isAdmin = user.role === 'Admin';

  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<EventApplication | null>(null);
  const [showAdminReviewModal, setShowAdminReviewModal] = useState(false);
  const [reviewApp, setReviewApp] = useState<EventApplication | null>(null);

  // Admin Review Form State
  const [reviewStatus, setReviewStatus] = useState<EventStatus>('APPROVED');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewAllottedVenue, setReviewAllottedVenue] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Submit Application Form State
  const [formEventName, setFormEventName] = useState('');
  const [formEventType, setFormEventType] = useState('Technical');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('10:00 AM');
  const [formEndTime, setFormEndTime] = useState('04:00 PM');
  const [formVenue, setFormVenue] = useState(DEFAULT_VENUES[0]);
  const [formParticipants, setFormParticipants] = useState<number>(100);
  const [formOrganizingBody, setFormOrganizingBody] = useState('');
  const [formFacultyCoordinator, setFormFacultyCoordinator] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params: any = {
        status: selectedStatusTab !== 'ALL' ? selectedStatusTab : undefined,
        search: searchQuery.trim() || undefined,
        event_type: selectedEventType !== 'All' ? selectedEventType : undefined,
        venue: selectedVenue !== 'All' ? selectedVenue : undefined,
        date: dateFilter || undefined,
      };

      const res = await api.getEventApplications(params);
      if (res.success) {
        setApplications(res.applications || []);
      } else {
        setErrorMsg('Failed to load event applications.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading applications');
    } finally {
      setLoading(false);
    }
  }, [selectedStatusTab, searchQuery, selectedEventType, selectedVenue, dateFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Open detail modal with full history
  const handleOpenDetail = async (app: EventApplication) => {
    try {
      const res = await api.getEventApplicationDetail(app.id);
      if (res.success && res.application) {
        setSelectedApp(res.application);
      } else {
        setSelectedApp(app);
      }
    } catch {
      setSelectedApp(app);
    }
    setShowDetailModal(true);
  };

  // Open admin review modal
  const handleOpenAdminReview = (app: EventApplication) => {
    setReviewApp(app);
    setReviewStatus(app.status === 'PENDING' ? 'APPROVED' : app.status);
    setReviewRemarks(app.admin_remarks || '');
    setReviewAllottedVenue(app.approved_venue || app.venue);
    setShowAdminReviewModal(true);
  };

  // Submit admin review decision
  const handleAdminReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApp) return;

    try {
      setReviewSubmitting(true);
      const res = await api.updateEventApplicationStatus(
        reviewApp.id,
        reviewStatus,
        reviewRemarks.trim() || undefined,
        reviewAllottedVenue.trim() || undefined
      );

      if (res.success) {
        setSuccessMsg(`Application #${reviewApp.application_no} updated to ${reviewStatus}`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setShowAdminReviewModal(false);
        if (selectedApp && selectedApp.id === reviewApp.id) {
          setSelectedApp(res.application);
        }
        fetchApplications();
      } else {
        setErrorMsg(res.error || 'Failed to update application');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating application');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Submit new event proposal
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formEventName.trim() || formEventName.trim().length < 3) {
      setFormError('Please enter a descriptive event name (at least 3 characters).');
      return;
    }
    if (!formDescription.trim() || formDescription.trim().length < 10) {
      setFormError('Please provide a detailed event description (at least 10 characters).');
      return;
    }
    if (!formDate) {
      setFormError('Please select a proposed date.');
      return;
    }
    if (!formOrganizingBody.trim()) {
      setFormError('Please specify the organizing department or club.');
      return;
    }
    if (!formFacultyCoordinator.trim()) {
      setFormError('Please provide faculty coordinator contact details.');
      return;
    }
    if (formParticipants <= 0) {
      setFormError('Expected participants must be greater than 0.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload: CreateEventApplicationPayload = {
        event_name: formEventName.trim(),
        event_type: formEventType,
        description: formDescription.trim(),
        proposed_date: formDate,
        start_time: formStartTime.trim(),
        end_time: formEndTime.trim(),
        venue: formVenue,
        expected_participants: formParticipants,
        organizing_body: formOrganizingBody.trim(),
        faculty_coordinator: formFacultyCoordinator.trim(),
        additional_requirements: formRequirements.trim() || undefined,
        department: user.program || undefined,
      };

      const res = await api.submitEventApplication(payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Event application submitted successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
        setShowSubmitModal(false);
        // Reset form
        setFormEventName('');
        setFormDescription('');
        setFormDate('');
        setFormOrganizingBody('');
        setFormFacultyCoordinator('');
        setFormRequirements('');
        fetchApplications();
      } else {
        setFormError(res.error || 'Failed to submit application.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error submitting application.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Withdraw application
  const handleWithdrawApplication = async (app: EventApplication) => {
    if (!window.confirm(`Are you sure you want to withdraw application #${app.application_no}?`)) {
      return;
    }
    try {
      const res = await api.deleteEventApplication(app.id);
      if (res.success) {
        setSuccessMsg('Application withdrawn successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
        if (showDetailModal && selectedApp?.id === app.id) {
          setShowDetailModal(false);
        }
        fetchApplications();
      } else {
        setErrorMsg(res.error || 'Failed to withdraw application.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error withdrawing application');
    }
  };

  // Helper status badge
  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Award className="w-3 h-3 text-blue-600" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Campus Governance &amp; Venues
            </span>
            <span className="text-xs text-slate-400">Dean of Student Affairs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Event Conduction Applications
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Submit formal proposals for academic workshops, cultural fests, hackathons, and sports tournaments. Track approvals, venue allocations, and logistics.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Submit Event Proposal
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        {/* Status Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {STATUS_TABS.map((tab) => {
            const count =
              tab === 'ALL'
                ? applications.length
                : applications.filter((a) => a.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedStatusTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  selectedStatusTab === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All Applications' : tab} ({count})
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search event name, organizing body, coordinator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Event Type */}
          <div>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              aria-label="Filter by event type"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {DEFAULT_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Event Types' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Venue */}
          <div>
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              aria-label="Filter by venue"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Campus Venues</option>
              {DEFAULT_VENUES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker / Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by proposed date"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            {(searchQuery || selectedEventType !== 'All' || selectedVenue !== 'All' || dateFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEventType('All');
                  setSelectedVenue('All');
                  setDateFilter('');
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                title="Reset filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading event applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No applications found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md">
            {isAdmin
              ? 'No event proposals match the selected filters.'
              : 'You have not submitted any event applications matching this query yet.'}
          </p>
          <div className="mt-5">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Submit an Event Proposal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Block: Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {app.application_no}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {app.event_type}
                    </span>
                    {getStatusBadge(app.status)}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 truncate">
                    {app.event_name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {app.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{app.proposed_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{app.start_time} - {app.end_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate">
                        {app.approved_venue || app.venue}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{app.expected_participants} Expected</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Organized by: <strong className="text-slate-700">{app.organizing_body}</strong></span>
                    <span>•</span>
                    <span>Applicant: <strong className="text-slate-700">{app.student_name}</strong></span>
                    {app.admin_remarks && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-700 font-medium">
                          Dean Remarks: {app.admin_remarks}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Block: Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleOpenDetail(app)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details &amp; History
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenAdminReview(app)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Review / Take Action
                    </button>
                  )}

                  {!isAdmin && app.status === 'PENDING' && (
                    <button
                      onClick={() => handleWithdrawApplication(app)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Event Proposal Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8"
            >
              <button
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Submit Event Conduction Proposal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fill in complete logistical details for review by the Dean Office and Facilities cell.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {/* Event Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Annual HackPulse 2024"
                      value={formEventName}
                      onChange={(e) => setFormEventName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Event Type / Category *
                    </label>
                    <select
                      value={formEventType}
                      onChange={(e) => setFormEventType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {DEFAULT_EVENT_TYPES.filter((t) => t !== 'All').map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Organizing Body & Faculty Coordinator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Organizing Department / Club *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Robotics & AI Club, CS Dept"
                      value={formOrganizingBody}
                      onChange={(e) => setFormOrganizingBody(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Faculty Coordinator / Contact *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Elena Rostova (+91 98765 11223)"
                      value={formFacultyCoordinator}
                      onChange={(e) => setFormFacultyCoordinator(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Date & Timings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Proposed Date *
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Start Time *
                    </label>
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      End Time *
                    </label>
                    <input
                      type="text"
                      placeholder="04:00 PM"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Venue & Expected Participants */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Preferred Campus Venue *
                    </label>
                    <select
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {DEFAULT_VENUES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Expected Participants *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formParticipants}
                      onChange={(e) => setFormParticipants(parseInt(e.target.value, 10) || 50)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Event Description &amp; Agenda *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide overview of event activities, guest speakers, audience profile, and schedule..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  />
                </div>

                {/* Additional Requirements */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Additional Requirements (A/V, Power, Seating, Mics)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Projector, 2 cordless microphones, extra extension power boards, water dispensers..."
                    value={formRequirements}
                    onChange={(e) => setFormRequirements(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    {formSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Detail & History Modal */}
      <AnimatePresence>
        {showDetailModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8"
            >
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedApp.application_no}
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedApp.event_type}
                </span>
                {getStatusBadge(selectedApp.status)}
              </div>

              <h2 className="text-2xl font-bold text-slate-900">{selectedApp.event_name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>Organized by: <strong className="text-slate-700">{selectedApp.organizing_body}</strong></span>
                <span>•</span>
                <span>Applicant: <strong className="text-slate-700">{selectedApp.student_name}</strong></span>
              </div>

              {/* Description */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-sm text-slate-700 leading-relaxed">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Event Description &amp; Scope
                </h4>
                <p>{selectedApp.description}</p>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Proposed Schedule</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{selectedApp.proposed_date} ({selectedApp.start_time} - {selectedApp.end_time})</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Approved / Preferred Venue</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedApp.approved_venue || selectedApp.venue}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Expected Participants</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{selectedApp.expected_participants} attendees expected</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Faculty Coordinator</span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{selectedApp.faculty_coordinator}</span>
                  </div>
                </div>

                {selectedApp.additional_requirements && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl sm:col-span-2">
                    <span className="text-slate-400 block mb-0.5">Additional Logistics Requirements</span>
                    <p className="text-slate-700">{selectedApp.additional_requirements}</p>
                  </div>
                )}

                {selectedApp.admin_remarks && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl sm:col-span-2 text-indigo-900">
                    <span className="text-indigo-700 font-bold block mb-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Dean Review Remarks
                    </span>
                    <p className="text-xs">{selectedApp.admin_remarks}</p>
                    {selectedApp.processed_by && (
                      <span className="text-[10px] text-indigo-500 mt-1 block">
                        Reviewed by {selectedApp.processed_by} on {selectedApp.processed_at}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Activity Audit Trail */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Application Workflow &amp; Audit Trail
                </h4>
                {selectedApp.activities && selectedApp.activities.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedApp.activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{act.actor_name}</span>
                            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded text-[10px] uppercase">
                              {act.actor_role}
                            </span>
                            <span className="font-mono text-slate-500 text-[10px]">{act.action}</span>
                          </div>
                          {act.notes && (
                            <p className="text-slate-600 mt-1 text-[11px]">{act.notes}</p>
                          )}
                        </div>
                        <span className="text-slate-400 text-[10px] whitespace-nowrap">
                          {act.created_at?.slice(0, 16)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No activity log entries recorded.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenAdminReview(selectedApp);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Take Review Action
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Review Action Modal */}
      <AnimatePresence>
        {showAdminReviewModal && reviewApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setShowAdminReviewModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Admin Review &amp; Venue Allotment
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Application: <span className="font-semibold text-slate-700">{reviewApp.event_name}</span> (#{reviewApp.application_no})
              </p>

              <form onSubmit={handleAdminReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Decision Status *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStatus('APPROVED')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        reviewStatus === 'APPROVED'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStatus('REJECTED')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        reviewStatus === 'REJECTED'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStatus('COMPLETED')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        reviewStatus === 'COMPLETED'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Allotted / Confirmed Venue
                  </label>
                  <select
                    value={reviewAllottedVenue}
                    onChange={(e) => setReviewAllottedVenue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {DEFAULT_VENUES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dean Office Remarks &amp; Conditions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Approved with conditions. Facilities team instructed for sound setup."
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdminReviewModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    {reviewSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Confirm Decision
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

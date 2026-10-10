import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  MapPin,
  Calendar,
  Phone,
  Clock,
  Eye,
  Tag,
  User,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  ExternalLink,
  Info,
} from 'lucide-react';
import { UserProfile, LostFoundItem, NoticeType, LostFoundStatus, CreateLostFoundPayload } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

interface LostAndFoundScreenProps {
  user: UserProfile;
}

const CATEGORIES = [
  'All',
  'Electronics',
  'Books & Stationery',
  'ID Cards & Documents',
  'Keys & Access Cards',
  'Clothing & Accessories',
  'Bags & Wallets',
  'Water Bottles & Flasks',
  'Sports Equipment',
  'Eyewear & Watches',
  'Other',
];

const STATUS_FILTERS = ['All', 'ACTIVE', 'CLAIMED', 'RESOLVED', 'CLOSED'];

export const LostAndFoundScreen: React.FC<LostAndFoundScreenProps> = ({ user }) => {
  const { t, translateStatus } = useTranslation();
  const isAdmin = user.role === 'Admin';

  const [notices, setNotices] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOST' | 'FOUND' | 'MY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [locationQuery, setLocationQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<LostFoundItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTargetNotice, setStatusTargetNotice] = useState<LostFoundItem | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<LostFoundStatus>('ACTIVE');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Post Notice Form State
  const [postType, setPostType] = useState<NoticeType>('LOST');
  const [postItemName, setPostItemName] = useState('');
  const [postCategory, setPostCategory] = useState(CATEGORIES[1]);
  const [postDescription, setPostDescription] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0]);
  const [postContact, setPostContact] = useState(user.email || user.phone || '');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch notices
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params: any = {
        search: searchQuery.trim() || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
        location: locationQuery.trim() || undefined,
        date: dateQuery || undefined,
      };

      if (activeTab === 'MY') {
        params.my_only = true;
      } else if (activeTab === 'LOST') {
        params.notice_type = 'LOST';
      } else if (activeTab === 'FOUND') {
        params.notice_type = 'FOUND';
      }

      const res = await api.getLostFoundNotices(params);
      if (res.success) {
        setNotices(res.notices || []);
      } else {
        setErrorMsg('Failed to load Lost & Found notices.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading notices');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, selectedCategory, selectedStatus, locationQuery, dateQuery]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // Open notice details
  const handleOpenDetail = async (item: LostFoundItem) => {
    try {
      const res = await api.getLostFoundDetail(item.id);
      if (res.success && res.notice) {
        setSelectedNotice(res.notice);
      } else {
        setSelectedNotice(item);
      }
    } catch {
      setSelectedNotice(item);
    }
    setShowDetailModal(true);
  };

  // Submit new notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!postItemName.trim()) {
      setFormError('Please enter the item name.');
      return;
    }
    if (!postDescription.trim() || postDescription.trim().length < 5) {
      setFormError('Please enter a descriptive summary (at least 5 characters).');
      return;
    }
    if (!postLocation.trim()) {
      setFormError('Please specify the location.');
      return;
    }
    if (!postContact.trim()) {
      setFormError('Please provide contact information.');
      return;
    }
    if (!postDate) {
      setFormError('Please select a valid date.');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload: CreateLostFoundPayload = {
        notice_type: postType,
        item_name: postItemName.trim(),
        category: postCategory,
        description: postDescription.trim(),
        location: postLocation.trim(),
        item_date: postDate,
        contact_info: postContact.trim(),
        image_url: postImageUrl.trim() || undefined,
      };

      const res = await api.createLostFoundNotice(payload);
      if (res.success) {
        setSuccessMsg(res.message || 'Notice published successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
        setShowPostModal(false);
        // Reset form
        setPostItemName('');
        setPostDescription('');
        setPostLocation('');
        setPostImageUrl('');
        fetchNotices();
      } else {
        setFormError(res.error || 'Failed to submit notice.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating notice.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open status update modal
  const handleOpenStatusModal = (notice: LostFoundItem) => {
    setStatusTargetNotice(notice);
    setNewStatusValue(notice.status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  // Save status update
  const handleSaveStatus = async () => {
    if (!statusTargetNotice) return;
    try {
      setStatusSubmitting(true);
      const res = await api.updateLostFoundStatus(
        statusTargetNotice.id,
        newStatusValue,
        statusNotes.trim() || undefined
      );
      if (res.success) {
        setSuccessMsg(`Status updated to ${newStatusValue}`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setShowStatusModal(false);
        if (selectedNotice && selectedNotice.id === statusTargetNotice.id) {
          setSelectedNotice(res.notice);
        }
        fetchNotices();
      } else {
        setErrorMsg(res.error || 'Failed to update status.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Delete notice
  const handleDeleteNotice = async (notice: LostFoundItem) => {
    if (!window.confirm(`Are you sure you want to remove notice "${notice.item_name}"?`)) {
      return;
    }
    try {
      const res = await api.deleteLostFoundNotice(notice.id);
      if (res.success) {
        setSuccessMsg('Notice removed successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
        if (showDetailModal && selectedNotice?.id === notice.id) {
          setShowDetailModal(false);
        }
        fetchNotices();
      } else {
        setErrorMsg(res.error || 'Failed to delete notice.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting notice');
    }
  };

  // Check if current user is owner of notice
  const isOwner = (item: LostFoundItem) => {
    return (
      item.student_id === user.studentId ||
      item.student_identifier === user.studentId ||
      item.student_name === user.name
    );
  };

  const getStatusBadge = (status: LostFoundStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case 'CLAIMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Check className="w-3 h-3 text-blue-600" />
            Claimed
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Campus Utility
            </span>
            <span className="text-xs text-slate-400">Verified Notices</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('lostFound.title', 'Campus Lost & Found')}</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            {t('lostFound.subtitle', 'Report misplaced belongings, browse discovered articles across university halls, and claim verified items safely.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPostType('LOST');
              setShowPostModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('lostFound.lostType', 'Report Lost Item')}
          </button>
          <button
            onClick={() => {
              setPostType('FOUND');
              setShowPostModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('lostFound.foundType', 'Report Found Item')}
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

      {/* Tabs & Search / Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Notices ({notices.length})
          </button>
          <button
            onClick={() => setActiveTab('LOST')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'LOST'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Lost Items
          </button>
          <button
            onClick={() => setActiveTab('FOUND')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'FOUND'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Found Items
          </button>
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('MY')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'MY'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              My Submitted Notices
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by item name, details, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by notice status"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Date / Reset */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateQuery}
              onChange={(e) => setDateQuery(e.target.value)}
              aria-label="Filter by date"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All' || dateQuery || locationQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                  setDateQuery('');
                  setLocationQuery('');
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

      {/* Notices Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-slate-500 text-sm font-medium">Loading Lost &amp; Found notices...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No notices found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md">
            No notices match your current filters. Try searching for a different keyword or create a new notice.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                setPostType('LOST');
                setShowPostModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Post a Notice
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notices.map((item) => {
            const isLost = item.notice_type === 'LOST';
            const owner = isOwner(item);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase ${
                        isLost
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {item.notice_type}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(item.status)}
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {item.public_id}
                      </span>
                    </div>
                  </div>

                  {/* Title & Category */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {item.item_name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.category}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Info Points */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1 font-medium text-slate-700">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{item.item_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{item.contact_info}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenDetail(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>

                  <div className="flex items-center gap-1.5">
                    {(isAdmin || owner) && (
                      <button
                        onClick={() => handleOpenStatusModal(item)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all"
                        title="Update status"
                      >
                        Status
                      </button>
                    )}

                    {(isAdmin || owner) && (
                      <button
                        onClick={() => handleDeleteNotice(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title={isAdmin ? 'Remove notice (Admin)' : 'Withdraw notice'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal */}
      <AnimatePresence>
        {showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8"
            >
              <button
                onClick={() => setShowPostModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    postType === 'LOST'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Post a {postType === 'LOST' ? 'Lost' : 'Found'} Item Notice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Will be publicly visible to university students &amp; administration.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateNotice} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notice Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPostType('LOST')}
                      className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all ${
                        postType === 'LOST'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      I Lost Something
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType('FOUND')}
                      className={`py-2.5 px-4 rounded-xl text-sm font-bold border transition-all ${
                        postType === 'FOUND'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      I Found Something
                    </button>
                  </div>
                </div>

                {/* Item Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Blue HP Charger, Casio Calculator"
                      value={postItemName}
                      onChange={(e) => setPostItemName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Location {postType === 'LOST' ? 'Lost' : 'Found'} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Library 2nd Floor, Desk 14"
                      value={postLocation}
                      onChange={(e) => setPostLocation(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={postDate}
                      onChange={(e) => setPostDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description &amp; Identifying Details *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific details such as color, scratches, stickers, brand model, or unique marks..."
                    value={postDescription}
                    onChange={(e) => setPostDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>

                {/* Contact Information */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Information *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Phone number, student email, or hostel room"
                    value={postContact}
                    onChange={(e) => setPostContact(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>

                {/* Optional Image / Reference Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Optional Image Reference URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/item-photo.jpg (optional)"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Safe web reference link or public photo URL if you have one.
                  </p>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  >
                    {formSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Publish Notice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notice Detail & Activity History Modal */}
      <AnimatePresence>
        {showDetailModal && selectedNotice && (
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

              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    selectedNotice.notice_type === 'LOST'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {selectedNotice.notice_type}
                </span>
                {getStatusBadge(selectedNotice.status)}
                <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {selectedNotice.public_id}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">{selectedNotice.item_name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>Category: <strong className="text-slate-700">{selectedNotice.category}</strong></span>
                <span>•</span>
                <span>Posted by: <strong className="text-slate-700">{selectedNotice.student_name}</strong></span>
              </div>

              {/* Description Box */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-sm text-slate-700 leading-relaxed">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Item Description
                </h4>
                <p>{selectedNotice.description}</p>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Location</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{selectedNotice.location}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Reported Date</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{selectedNotice.item_date}</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl sm:col-span-2">
                  <span className="text-slate-400 block mb-0.5">Contact Details</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{selectedNotice.contact_info}</span>
                  </div>
                </div>

                {selectedNotice.admin_notes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl sm:col-span-2 text-amber-900">
                    <span className="text-amber-700 font-bold block mb-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin Remarks / Handover Notes
                    </span>
                    <p className="text-xs">{selectedNotice.admin_notes}</p>
                  </div>
                )}
              </div>

              {/* Activity History Audit Trail */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Notice Activity &amp; Audit Trail
                </h4>
                {selectedNotice.activities && selectedNotice.activities.length > 0 ? (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {selectedNotice.activities.map((act) => (
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
                  <p className="text-xs text-slate-400 italic">No activity entries recorded yet.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {(isAdmin || isOwner(selectedNotice)) && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenStatusModal(selectedNotice);
                      }}
                      className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold border border-blue-200 transition-all"
                    >
                      Change Status
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

      {/* Status Update Modal */}
      <AnimatePresence>
        {showStatusModal && statusTargetNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative"
            >
              <button
                onClick={() => setShowStatusModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Update Notice Status
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Updating: <span className="font-semibold text-slate-700">{statusTargetNotice.item_name}</span> ({statusTargetNotice.public_id})
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select New Status
                  </label>
                  <select
                    value={newStatusValue}
                    onChange={(e) => setNewStatusValue(e.target.value as LostFoundStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Still looking / unclaimed)</option>
                    <option value="CLAIMED">CLAIMED (Owner identified / claimed)</option>
                    <option value="RESOLVED">RESOLVED (Item successfully returned)</option>
                    {isAdmin && <option value="CLOSED">CLOSED (Archived / completed)</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notes / Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about the handover, verification, or resolution..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStatus}
                    disabled={statusSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
                  >
                    {statusSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Confirm Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

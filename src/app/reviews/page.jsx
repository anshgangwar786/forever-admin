'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Button, Badge, EmptyState, ConfirmDialog, PageHeader, Tabs } from '../../components/ui';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Search,
  Package,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function ReviewsModerationPage() {
  const { backendUrl, token, adminUser } = useAdminAuth();

  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Delete confirmation modal state
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch reviews for moderation from backend
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/v1/review/admin/list`, {
        headers: token ? { token } : {},
        params: {
          status: statusFilter,
          search: searchTerm
        }
      });

      if (res.data.success && res.data.data) {
        setReviews(res.data.data.reviews || []);
        if (res.data.data.counts) {
          setCounts(res.data.data.counts);
        }
      } else {
        toast.error(res.data.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token, statusFilter, searchTerm]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle status update (Approve / Reject) with undo toast
  const handleUpdateStatus = async (reviewId, newStatus, previousStatus) => {
    try {
      setActionLoadingId(reviewId);
      const res = await axios.post(
        `${backendUrl}/api/v1/review/admin/update-status`,
        { reviewId, status: newStatus },
        { headers: token ? { token } : {} }
      );

      if (res.data.success) {
        if (newStatus === 'approved') {
          toast.success(
            <div>
              <span>Review approved &amp; published. </span>
              <button
                type="button"
                onClick={() => handleUpdateStatus(reviewId, previousStatus || 'pending')}
                className="underline font-semibold ml-1 cursor-pointer"
              >
                Undo
              </button>
            </div>
          );
        } else {
          toast.info(
            <div>
              <span>Review marked as rejected. </span>
              <button
                type="button"
                onClick={() => handleUpdateStatus(reviewId, previousStatus || 'pending')}
                className="underline font-semibold ml-1 cursor-pointer"
              >
                Undo
              </button>
            </div>
          );
        }
        await fetchReviews();
      } else {
        toast.error(res.data.message || 'Status update failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update review status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle review deletion confirmation
  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      setDeleteLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/review/delete`,
        { reviewId: reviewToDelete._id },
        { headers: token ? { token } : {} }
      );

      if (res.data.success) {
        toast.success('Review permanently deleted.');
        setReviewToDelete(null);
        await fetchReviews();
      } else {
        toast.error(res.data.message || 'Deletion failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete review');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Client-side sorting
  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (sortBy === 'newest') {
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'rating-high') {
      return list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-low') {
      return list.sort((a, b) => a.rating - b.rating);
    }
    return list;
  }, [reviews, sortBy]);

  const tabs = [
    { id: 'all', label: 'All reviews', count: counts.all },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Customer Reviews Moderation"
        subtitle="Curate customer evaluations, verify purchase authenticity, and approve feedback for the public storefront."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Catalog", href: "/list" },
          { label: "Reviews" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReviews}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        }
      />

      {/* Controls Bar: Tabs & Search */}
      <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <Tabs
            tabs={tabs}
            activeTab={statusFilter}
            onChange={(tabId) => setStatusFilter(tabId)}
            variant="pill"
          />

          {/* Search & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search reviewer, piece, comment..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#1C1917] dark:text-[#FAF8F5] placeholder-[#A8A29E] focus:outline-none focus:border-[#B08D57]"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#1C1917] dark:text-[#FAF8F5] cursor-pointer focus:outline-none focus:border-[#B08D57]"
            >
              <option value="newest">Sort: Newest first</option>
              <option value="oldest">Sort: Oldest first</option>
              <option value="rating-high">Sort: Highest rating</option>
              <option value="rating-low">Sort: Lowest rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review Cards Feed */}
      {loading && reviews.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-[#B08D57] border-t-transparent"></div>
          <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-2 font-sans">Retrieving testimonial archive...</p>
        </div>
      ) : sortedReviews.length === 0 ? (
        <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] p-12 text-center">
          <EmptyState
            title="No client reviews found"
            description={
              statusFilter === 'pending'
                ? 'All pending reviews have been moderated and published.'
                : 'No reviews match the selected filter or search terms.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedReviews.map((rev) => {
            const product = rev.productId;
            const rawImg = product?.image && Array.isArray(product.image) ? product.image[0] : product?.image;
            const imgSrc = typeof rawImg === 'object' && rawImg?.src ? rawImg.src : rawImg;
            const isPending = rev.status === 'pending';
            const isApproved = rev.status === 'approved' || rev.isApproved;
            const isRejected = rev.status === 'rejected';

            return (
              <div
                key={rev._id}
                className={`bg-white dark:bg-[#1C1917] rounded-xl border transition p-5 shadow-2xs ${
                  isPending
                    ? 'border-[#B08D57]/50 bg-[#FAF8F5]/50 dark:bg-[#1C1917]'
                    : isRejected
                    ? 'border-[#8E2824]/30'
                    : 'border-[#E7E3D9] dark:border-[#292524]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  {/* Left: Product & Review Details */}
                  <div className="flex-1 space-y-3">
                    {/* Product Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 rounded-lg bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] overflow-hidden shrink-0 flex items-center justify-center p-1">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product?.name || 'Piece'}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-5 h-5 text-[#A8A29E]" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAF8F5] hover:text-[#B08D57] transition-colors">
                          <Link href="/list">{product?.name || 'Signature Item'}</Link>
                        </h3>
                        <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                          Classification: {product?.category || 'Ready-to-Wear'} &bull; Provenance: {product?.storeName || 'Vellora Head Office'}
                        </p>
                      </div>
                    </div>

                    {/* Reviewer Meta Header */}
                    <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
                      <span className="font-semibold text-[#1C1917] dark:text-[#FAF8F5]">{rev.userName}</span>
                      {rev.userId?.email && (
                        <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E] font-mono">({rev.userId.email})</span>
                      )}
                      {rev.verifiedPurchase && (
                        <Badge variant="success" size="sm">
                          Verified Buyer
                        </Badge>
                      )}

                      {/* Rating Stars */}
                      <div className="flex items-center gap-0.5 text-[#B08D57] text-xs">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (rev.rating || 5)
                                ? 'fill-[#B08D57] text-[#B08D57]'
                                : 'text-[#DCD7CC] dark:text-[#44403C]'
                            }`}
                          />
                        ))}
                        <span className="text-[#78716C] dark:text-[#A8A29E] ml-1 text-[11px]">({rev.rating}/5)</span>
                      </div>

                      {/* Status Badge */}
                      {isPending ? (
                        <Badge variant="warning" size="sm" dot>Pending</Badge>
                      ) : isApproved ? (
                        <Badge variant="success" size="sm" dot>Published</Badge>
                      ) : (
                        <Badge variant="danger" size="sm" dot>Rejected</Badge>
                      )}
                    </div>

                    {/* Review Comment Card */}
                    <div className="bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg p-3.5 space-y-1">
                      {rev.title && (
                        <h4 className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] font-serif">&quot;{rev.title}&quot;</h4>
                      )}
                      <p className="text-xs text-[#44403C] dark:text-[#D6D3D1] leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                      <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] pt-1">
                        Submitted: {new Date(rev.createdAt).toLocaleString()}
                        {rev.approvedAt && ` • Moderated: ${new Date(rev.approvedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E7E3D9] dark:border-[#292524]">
                    {!isApproved && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoadingId === rev._id}
                        onClick={() => handleUpdateStatus(rev._id, 'approved', rev.status)}
                        icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    )}

                    {!isRejected && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === rev._id}
                        onClick={() => handleUpdateStatus(rev._id, 'rejected', rev.status)}
                        icon={<XCircle className="w-3.5 h-3.5 text-[#8E2824]" />}
                      >
                        Reject
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoadingId === rev._id}
                      onClick={() => setReviewToDelete(rev)}
                      className="text-[#78716C] hover:text-[#8E2824] dark:text-[#A8A29E]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Review Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={confirmDeleteReview}
        title="Delete Customer Review"
        description={`Are you sure you want to permanently delete review by '${reviewToDelete?.userName}'? This will completely remove it from the product testimonials.`}
        confirmLabel="Delete Review"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { Button, Badge, EmptyState } from '../../../components/ui';

const getImageSrc = (img) => (typeof img === 'object' && img?.src ? img.src : img);

export default function ProductDashboardPage({ params }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { token, backendUrl, currency = '$', adminUser } = useAdminAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reviews' | 'inventory'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState('all');
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/v1/product/insights/${productId}`, {
        headers: token ? { token } : {},
      });
      if (res.data.success) {
        setData(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load product insights');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to load product insights'
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, productId, token]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Delete review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) {
      return;
    }

    try {
      setDeletingReviewId(reviewId);
      const res = await axios.delete(`${backendUrl}/api/v1/review/${reviewId}`, {
        headers: token ? { token } : {},
      });

      if (res.data.success) {
        toast.success('Customer review deleted successfully');
        await fetchInsights();
      } else {
        toast.error(res.data.message || 'Failed to delete review');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to delete review'
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  const product = data?.product;
  const rawImg = Array.isArray(product?.image) ? product?.image[0] : product?.image;
  const productImg = getImageSrc(rawImg);

  const sales = data?.sales || {
    totalOrders: 0,
    totalUnitsOrdered: 0,
    totalUnitsSold: 0,
    pendingUnits: 0,
    totalRevenue: 0,
    potentialRevenue: 0,
    statusBreakdown: {},
    sizeBreakdown: {},
    paymentBreakdown: { Razorpay: { count: 0, revenue: 0 }, COD: { count: 0, revenue: 0 } },
    recentOrders: [],
  };

  const inventory = data?.inventory || {
    currentStock: product?.stock ?? 50,
    sizeStock: product?.sizeStock || {},
    stockStatus: 'In Stock',
    sellThroughRate: 0,
  };

  const reviews = data?.reviews || {
    stats: {
      totalReviews: 0,
      averageRating: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      breakdownPercentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    items: [],
  };

  const filteredReviews = reviews.items?.filter((r) => {
    if (selectedStarFilter === 'all') return true;
    return Math.round(r.rating) === Number(selectedStarFilter);
  }) || [];

  const discountedPrice =
    product?.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product?.price;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent"></div>
        <p className="text-xs text-ink-muted mt-4 font-sans">Compiling product telemetry...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center bg-white/80 backdrop-blur-xs rounded-2xl border border-hairline shadow-luxury max-w-lg mx-auto">
        <EmptyState
          title="Product Record Not Found"
          description="The requested creation could not be located in the catalog database."
          action={
            <Button variant="primary" size="sm" onClick={() => router.push('/list')}>
              &larr; Return to Catalog
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="pb-16 max-w-6xl mx-auto space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/list"
          className="text-xs font-semibold text-ink-muted hover:text-ink flex items-center gap-1.5 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Catalog
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          icon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Hero Banner Card */}
      <div className="bg-ink text-canvas p-6 sm:p-8 rounded-2xl border border-hairline shadow-luxury flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {productImg ? (
            <img
              src={productImg}
              alt={product.name}
              className="w-20 h-24 object-cover rounded-xl border border-hairline/40 shadow-luxury shrink-0"
            />
          ) : (
            <div className="w-20 h-24 bg-canvas-subtle rounded-xl border border-hairline flex items-center justify-center font-bold text-ink-muted">
              ITEM
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-medium text-canvas font-display">{product.name}</h1>
              {product.bestseller && (
                <Badge variant="accent">
                  ★ Signature Bestseller
                </Badge>
              )}
            </div>
            <p className="text-xs text-canvas/70 mt-2 flex items-center gap-2.5 flex-wrap font-sans">
              <span>Category: <strong className="text-canvas font-medium">{product.category} / {product.subCategory}</strong></span>
              <span>&bull;</span>
              <span>Provenance: <strong className="text-canvas font-medium">{product.storeName || 'Vellora Head Office'}</strong></span>
              <span>&bull;</span>
              <span>Retail: <strong className="text-canvas font-medium">{currency}{product.price}</strong></span>
              {product.discount > 0 && (
                <span className="text-accent font-semibold">
                  ({product.discount}% Privileged Offer &rarr; {currency}{discountedPrice})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Ordered Units */}
        <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-hairline shadow-luxury">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Total Ordered
          </span>
          <p className="text-2xl font-bold text-ink font-display">{sales.totalUnitsOrdered} <span className="text-xs font-normal text-ink-muted font-sans">units</span></p>
          <p className="text-[11px] text-ink-muted mt-1 font-sans">Across {sales.totalOrders} order{sales.totalOrders === 1 ? '' : 's'}</p>
        </div>

        {/* Product Revenue */}
        <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-hairline shadow-luxury">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Product Revenue
          </span>
          <p className="text-2xl font-bold text-emerald-800 font-display">{currency}{sales.totalRevenue.toLocaleString()}</p>
          <p className="text-[11px] text-ink-muted mt-1 font-sans">{currency}{sales.potentialRevenue.toLocaleString()} pipeline</p>
        </div>

        {/* Live Inventory */}
        <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-hairline shadow-luxury">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Live Inventory
          </span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-ink font-display">{inventory.currentStock}</p>
            <Badge variant="success">
              {inventory.stockStatus}
            </Badge>
          </div>
          <p className="text-[11px] text-ink-muted mt-1 font-sans">Sell-through: {inventory.sellThroughRate}%</p>
        </div>

        {/* Rating Score */}
        <div className="bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-hairline shadow-luxury">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted block mb-1">
            Client Rating
          </span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-ink font-display">{reviews.stats?.averageRating || 0}</p>
            <div className="flex text-accent text-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>
                  {star <= Math.round(reviews.stats?.averageRating || 0) ? '★' : '☆'}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-muted mt-1 font-sans">{reviews.stats?.totalReviews || 0} client evaluations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-hairline shadow-luxury overflow-hidden">
        <div className="flex border-b border-hairline px-6 gap-6 bg-canvas-subtle">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'orders' ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Order Insights ({sales.totalOrders})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'reviews' ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Client Reviews ({reviews.stats?.totalReviews || 0})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3.5 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'inventory' ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Size Demand &amp; Stock
          </button>
        </div>

        <div className="p-6">
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas-subtle border-b border-hairline text-ink-muted font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Order ID</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Size / Qty</th>
                      <th className="py-3 px-3">Subtotal</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {sales.recentOrders?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-ink-muted">
                          No orders recorded for this product yet.
                        </td>
                      </tr>
                    ) : (
                      sales.recentOrders.map((ord, idx) => (
                        <tr key={ord.orderId || idx} className="hover:bg-canvas-subtle/50 transition">
                          <td className="py-3 px-3 font-mono text-[11px] text-ink-muted">
                            #{ord.orderId ? ord.orderId.slice(-6).toUpperCase() : '---'}
                          </td>
                          <td className="py-3 px-3 text-ink-muted">
                            {ord.date ? new Date(ord.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-3 font-medium text-ink">
                            {ord.customer?.name}
                          </td>
                          <td className="py-3 px-3 font-semibold text-ink">
                            {ord.sizes || `Qty: ${ord.quantity}`}
                          </td>
                          <td className="py-3 px-3 font-bold text-ink font-display">
                            {currency}{ord.subtotal}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                ord.payment ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {ord.paymentMethod} &bull; {ord.payment ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="default">
                              {ord.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              {filteredReviews.length === 0 ? (
                <div className="py-8 text-center text-ink-muted text-xs">
                  No customer evaluations logged.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="p-4 rounded-xl border border-hairline bg-canvas-subtle hover:bg-white transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink text-xs">{rev.userName}</span>
                          {rev.verifiedPurchase && (
                            <Badge variant="success">
                              ✓ Verified Buyer
                            </Badge>
                          )}
                          <span className="text-accent text-xs">
                            {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteReview(rev._id)}
                          disabled={deletingReviewId === rev._id}
                          className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                      {rev.title && <p className="font-medium text-ink text-xs mt-2 font-display">&quot;{rev.title}&quot;</p>}
                      <p className="text-ink-muted text-xs mt-1 font-sans">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-5">
              {product.attributes && product.attributes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-2 font-sans">
                    Creation Attributes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {product.attributes.map((attr, aIdx) => (
                      <div key={aIdx} className="bg-canvas-subtle p-3.5 rounded-xl border border-hairline">
                        <span className="text-xs font-semibold text-ink block mb-1.5 uppercase tracking-wide">
                          {attr.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {attr.values?.map((val, vIdx) => (
                            <span key={vIdx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-hairline text-ink">
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-2 font-sans">
                    Silhouette Demand &amp; Stock
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {product.sizes.map((size) => {
                      const orderedQty = sales.sizeBreakdown?.[size] || 0;
                      const stockLeft = inventory.sizeStock?.[size] ?? 12;
                      return (
                        <div key={size} className="bg-canvas-subtle p-3.5 rounded-xl border border-hairline">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs bg-ink text-canvas px-2 py-0.5 rounded">{size}</span>
                            <span className="text-[11px] font-medium text-emerald-700">{stockLeft} in stock</span>
                          </div>
                          <p className="text-xs text-ink-muted mt-2 font-medium">{orderedQty} units ordered</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

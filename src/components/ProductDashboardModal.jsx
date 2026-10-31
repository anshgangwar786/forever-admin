'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';

const getImageSrc = (img) => (typeof img === 'object' && img?.src ? img.src : img);

export default function ProductDashboardModal({
  isOpen,
  onClose,
  product,
  token,
  backendUrl,
  currency = '$',
  adminUser,
  onEditProduct,
}) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reviews' | 'inventory'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState('all');
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!product?._id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/v1/product/insights/${product._id}`, {
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
  }, [backendUrl, product?._id, token]);

  useEffect(() => {
    if (isOpen && product?._id) {
      fetchInsights();
    }
  }, [isOpen, product?._id, fetchInsights]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Delete review handler (Admin or Product Owner)
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

  if (!isOpen) return null;

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
    monthlySales: [],
  };

  const inventory = data?.inventory || {
    currentStock: product?.stock ?? 50,
    sizeStock: product?.sizeStock || {},
    stockStatus: 'In Stock',
    sellThroughRate: 0,
    totalInventoryHandled: product?.stock ?? 50,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-gray-900 via-stone-900 to-black text-white px-5 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {productImg ? (
              <img
                src={productImg}
                alt={product?.name}
                className="w-13 h-13 object-cover rounded-xl border border-white/20 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-13 h-13 bg-gray-800 rounded-xl border border-white/20 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                PROD
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {product?.name || 'Product Dashboard'}
                </h3>
                {product?.bestseller && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                    ★ Bestseller
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-gray-300">
                  {product?.category} &bull; {product?.subCategory || 'General'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 truncate">
                <span>Store: <strong className="text-gray-200">{product?.storeName || 'Vellora Head Office'}</strong></span>
                <span>&bull;</span>
                <span>Base: <strong className="text-gray-200">{currency}{product?.price}</strong></span>
                {product?.discount > 0 && (
                  <span className="text-emerald-400 font-semibold">
                    ({product.discount}% OFF &rarr; {currency}{discountedPrice})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchInsights}
              disabled={loading}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition text-xs font-medium flex items-center gap-1 cursor-pointer"
              title="Refresh insights data"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {product?._id && (
              <Link
                href={`/product-dashboard/${product._id}`}
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition text-xs font-medium flex items-center gap-1 cursor-pointer"
                title="Open full page dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="hidden sm:inline">Full View</span>
              </Link>
            )}

            {onEditProduct && (
              <button
                onClick={() => onEditProduct(product)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="hidden sm:inline">Edit Product</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition text-xl font-bold cursor-pointer"
              title="Close modal (Esc)"
            >
              &times;
            </button>
          </div>
        </div>

        {/* 4 HIGH IMPACT KPI METRIC CARDS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-stone-50 border-b border-gray-200 shrink-0">
          
          {/* 1. Units Ordered */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Ordered Units</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black text-gray-900">
              {sales.totalUnitsOrdered}{" "}
              <span className="text-xs font-semibold text-gray-500">units</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              Across <strong className="text-gray-700">{sales.totalOrders}</strong> total order{sales.totalOrders === 1 ? '' : 's'}
            </p>
          </div>

          {/* 2. Total Revenue */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Product Revenue</span>
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xl font-black text-emerald-700">
              {currency}{sales.totalRevenue.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              {currency}{sales.potentialRevenue.toLocaleString()} total pipeline
            </p>
          </div>

          {/* 3. Current Stock & Velocity */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Live Inventory</span>
              <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-black text-gray-900">{inventory.currentStock}</p>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  inventory.currentStock === 0
                    ? 'bg-red-100 text-red-800'
                    : inventory.currentStock <= 10
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {inventory.stockStatus}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              Sell-through: <strong className="text-gray-700">{inventory.sellThroughRate}%</strong>
            </p>
          </div>

          {/* 4. Customer Rating */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Customer Rating</span>
              <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-amber-400 stroke-amber-500" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-black text-gray-900">
                {reviews.stats?.averageRating || 0}
              </p>
              <div className="flex text-amber-400 text-xs">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {star <= Math.round(reviews.stats?.averageRating || 0) ? '★' : '☆'}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              From <strong className="text-gray-700">{reviews.stats?.totalReviews || 0}</strong> review{reviews.stats?.totalReviews === 1 ? '' : 's'}
            </p>
          </div>

        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-gray-200 bg-white px-5 shrink-0 gap-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'orders'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Order Insights ({sales.totalOrders})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Reviews &amp; Ratings ({reviews.stats?.totalReviews || 0})
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Size Demand &amp; Stock
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-block animate-spin rounded-full h-9 w-9 border-b-2 border-black"></div>
              <p className="text-xs text-gray-500 mt-3 font-medium">Loading product insights and analytics...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: ORDER INSIGHTS */}
              {activeTab === 'orders' && (
                <div className="space-y-5">
                  {/* Fulfillment Status Badges & Payment Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Breakdown */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                        Fulfillment Status Pipeline
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries({
                          'Order Placed': sales.statusBreakdown?.['Order Placed'] || 0,
                          Packing: sales.statusBreakdown?.Packing || 0,
                          Shipped: sales.statusBreakdown?.Shipped || 0,
                          'Out for delivery': sales.statusBreakdown?.['Out for delivery'] || 0,
                          Delivered: sales.statusBreakdown?.Delivered || 0,
                          Cancelled: sales.statusBreakdown?.Cancelled || 0,
                        }).map(([statusName, count]) => (
                          <div
                            key={statusName}
                            className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-center"
                          >
                            <span className="text-xs font-bold text-gray-900 block">{count}</span>
                            <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">
                              {statusName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method Split */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                        Payment Methods Split
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                              Online (Razorpay)
                            </span>
                            <span className="text-gray-600 font-medium">
                              {sales.paymentBreakdown?.Razorpay?.units || 0} units &bull; {currency}{sales.paymentBreakdown?.Razorpay?.revenue || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  sales.totalUnitsOrdered > 0
                                    ? Math.round(
                                        ((sales.paymentBreakdown?.Razorpay?.units || 0) /
                                          sales.totalUnitsOrdered) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                              Cash on Delivery (COD)
                            </span>
                            <span className="text-gray-600 font-medium">
                              {sales.paymentBreakdown?.COD?.units || 0} units &bull; {currency}{sales.paymentBreakdown?.COD?.revenue || 0}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  sales.totalUnitsOrdered > 0
                                    ? Math.round(
                                        ((sales.paymentBreakdown?.COD?.units || 0) /
                                          sales.totalUnitsOrdered) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Orders Containing this Product */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                    <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Recent Customer Orders ({sales.recentOrders?.length || 0})
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Customers who bought this product and order status
                        </p>
                      </div>

                      <Link
                        href="/orders"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        All Orders &rarr;
                      </Link>
                    </div>

                    {sales.recentOrders?.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 text-xs">
                        <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        No orders recorded for this product yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-stone-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Order ID</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3">Size / Qty</th>
                              <th className="py-2.5 px-3">Subtotal</th>
                              <th className="py-2.5 px-3">Payment</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {sales.recentOrders.map((ord, idx) => (
                              <tr key={ord.orderId || idx} className="hover:bg-gray-50/80 transition">
                                <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                                  #{ord.orderId ? ord.orderId.slice(-6).toUpperCase() : '---'}
                                </td>
                                <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                                  {ord.date ? new Date(ord.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-gray-900">
                                  <div>{ord.customer?.name}</div>
                                  {ord.customer?.city && (
                                    <span className="text-[10px] text-gray-400">{ord.customer.city}</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold text-[11px]">
                                    {ord.sizes || `Qty: ${ord.quantity}`}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-bold text-gray-900 whitespace-nowrap">
                                  {currency}{ord.subtotal}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                      ord.payment
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {ord.paymentMethod} &bull; {ord.payment ? 'Paid' : 'Pending'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-800">
                                    {ord.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: REVIEWS & RATINGS */}
              {activeTab === 'reviews' && (
                <div className="space-y-5">
                  {/* Ratings Breakdown Summary Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-xl border border-gray-200">
                    {/* Big Score Block */}
                    <div className="flex flex-col items-center justify-center text-center p-3 border-r md:border-gray-100">
                      <span className="text-4xl font-black text-gray-900">
                        {reviews.stats?.averageRating || 0}
                      </span>
                      <div className="flex text-amber-400 text-base my-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {star <= Math.round(reviews.stats?.averageRating || 0) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        Based on {reviews.stats?.totalReviews || 0} customer review{reviews.stats?.totalReviews === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Progress Bars for Stars 5 through 1 */}
                    <div className="col-span-2 space-y-1.5 pl-0 md:pl-4 justify-center flex flex-col">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.stats?.breakdown?.[star] || 0;
                        const pct = reviews.stats?.breakdownPercentages?.[star] || 0;
                        return (
                          <button
                            key={star}
                            onClick={() =>
                              setSelectedStarFilter(selectedStarFilter === String(star) ? 'all' : String(star))
                            }
                            className={`flex items-center gap-2 text-xs w-full text-left p-1 rounded hover:bg-gray-50 transition cursor-pointer ${
                              selectedStarFilter === String(star) ? 'bg-amber-50 font-bold' : ''
                            }`}
                          >
                            <span className="w-12 text-gray-600 shrink-0 font-medium">{star} Star</span>
                            <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-400 h-2.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="w-12 text-right text-gray-500 shrink-0 text-[11px]">
                              {count} ({pct}%)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter pill bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold">Filter:</span>
                      {['all', '5', '4', '3', '2', '1'].map((val) => (
                        <button
                          key={val}
                          onClick={() => setSelectedStarFilter(val)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            selectedStarFilter === val
                              ? 'bg-black text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {val === 'all' ? 'All Reviews' : `${val} ★`}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs text-gray-400">
                      Showing {filteredReviews.length} of {reviews.items?.length || 0} reviews
                    </span>
                  </div>

                  {/* Review Cards List */}
                  {filteredReviews.length === 0 ? (
                    <div className="py-12 bg-white rounded-xl border border-gray-200 text-center text-gray-400 text-xs">
                      <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {reviews.items?.length === 0
                        ? 'No customer reviews submitted for this product yet.'
                        : 'No reviews match the selected star rating filter.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredReviews.map((rev) => (
                        <div
                          key={rev._id}
                          className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs hover:border-gray-300 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-stone-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {rev.userName ? rev.userName[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-gray-900 text-xs">{rev.userName || 'Customer'}</h5>
                                  {rev.verifiedPurchase && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      &check; Verified Purchase
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <div className="flex text-amber-400 text-xs">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Delete Review Button (Admins & Product Owner Sellers) */}
                            <button
                              onClick={() => handleDeleteReview(rev._id)}
                              disabled={deletingReviewId === rev._id}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition cursor-pointer text-xs flex items-center gap-1 shrink-0"
                              title="Delete customer review"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="text-[11px] font-medium hidden sm:inline">Delete</span>
                            </button>
                          </div>

                          {rev.title && (
                            <p className="font-bold text-gray-800 text-xs mt-2.5">{rev.title}</p>
                          )}
                          <p className="text-gray-600 text-xs mt-1 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SIZE DEMAND & INVENTORY */}
              {activeTab === 'inventory' && (
                <div className="space-y-5">
                  {/* Size Demand vs Stock Comparison */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                      Variant Demand &amp; Stock Levels
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Breakdown of ordered units per size compared to available inventory.
                    </p>

                    {product?.sizes && product.sizes.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {product.sizes.map((size) => {
                          const orderedQty = sales.sizeBreakdown?.[size] || 0;
                          const currentStock = inventory.sizeStock?.[size] ?? Math.floor((inventory.currentStock || 50) / product.sizes.length);
                          const totalHandled = orderedQty + currentStock;
                          const demandPct = totalHandled > 0 ? Math.round((orderedQty / totalHandled) * 100) : 0;

                          return (
                            <div
                              key={size}
                              className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl hover:border-black/30 transition"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="w-7 h-7 rounded-lg bg-black text-white font-bold flex items-center justify-center text-xs">
                                  {size}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    currentStock === 0
                                      ? 'bg-red-100 text-red-700'
                                      : currentStock <= 5
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {currentStock} in stock
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-gray-800 mt-2">
                                {orderedQty} units ordered
                              </p>

                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
                                <div
                                  className="bg-black h-1.5 rounded-full"
                                  style={{ width: `${demandPct}%` }}
                                ></div>
                              </div>
                              <span className="text-[10px] text-gray-500 mt-1 block">
                                {demandPct}% sold through
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No specific sizes registered for this product.</p>
                    )}
                  </div>

                  {/* Product Metadata & Specifications */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Product Specifications
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Product ID</span>
                        <span className="font-mono font-semibold text-gray-800 text-[11px]">
                          {product?._id}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Category / Sub</span>
                        <span className="font-semibold text-gray-800">
                          {product?.category} &bull; {product?.subCategory}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Pricing</span>
                        <span className="font-semibold text-gray-800">
                          {currency}{product?.price}{' '}
                          {product?.discount > 0 && (
                            <span className="text-emerald-600">({product.discount}% OFF)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Added Date</span>
                        <span className="font-semibold text-gray-800">
                          {product?.date ? new Date(product.date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Attributes & Custom Specifications */}
                    {product?.attributes && product.attributes.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <h5 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                          Configured Variants &amp; Attributes
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {product.attributes.map((attr, aIdx) => (
                            <div key={aIdx} className="p-3 bg-stone-50 border border-stone-200/80 rounded-xl">
                              <span className="text-[11px] font-bold text-gray-800 block mb-1.5 uppercase tracking-wide">
                                {attr.name}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {attr.values?.map((val, vIdx) => (
                                  <span key={vIdx} className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-gray-200 text-gray-800 shadow-2xs">
                                    {val}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {product?.description && (
                      <div className="pt-3 border-t border-gray-100">
                        <span className="text-gray-400 text-[11px] block mb-1">Description</span>
                        <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {product.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-gray-500">
            Store View: <strong>{product?.storeName || 'Vellora Head Office'}</strong>
          </div>

          <div className="flex items-center gap-2">
            {onEditProduct && (
              <button
                onClick={() => onEditProduct(product)}
                className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Product
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

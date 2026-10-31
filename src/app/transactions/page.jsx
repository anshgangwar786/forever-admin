'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert 
} from 'lucide-react';

import { useAdminAuth } from '../../context/AdminAuthContext';
import TransactionDetailsDrawer from '../../components/transactions/TransactionDetailsDrawer';
import RefundModal from '../../components/transactions/RefundModal';
import { Button, Badge, EmptyState, PageHeader } from '../../components/ui';

export default function Transactions() {
  const { token, backendUrl, currency } = useAdminAuth();

  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [providerFilter, setProviderFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Drawer
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [refundTxn, setRefundTxn] = useState(null);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch Transactions from API
  const fetchTransactions = useCallback(async (isSilent = false) => {
    if (!token) return;
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);

    try {
      const res = await axios.get(`${backendUrl}/api/v1/payment/list`, {
        headers: { token },
      });

      if (res.data.success && Array.isArray(res.data.data?.payments)) {
        setTransactions(res.data.data.payments);
        setStats(res.data.data.stats);
      } else {
        const ordersRes = await axios.post(`${backendUrl}/api/v1/order/list`, {}, { headers: { token } });
        if (ordersRes.data.success && Array.isArray(ordersRes.data.data)) {
          const mapped = ordersRes.data.data.map((o) => ({
            _id: `txn_${o._id}`,
            orderId: o,
            userId: { name: `${o.address?.firstName || ''} ${o.address?.lastName || ''}`.trim(), email: o.address?.email },
            transactionId: o.payments?.[0]?.transactionId || `TXN-${o._id.slice(-8).toUpperCase()}`,
            paymentProvider: o.paymentMethod || 'Razorpay',
            paymentMethod: o.paymentMethod === 'COD' ? 'Cash' : 'Credit_Card',
            amount: o.grandTotal || o.amount || 0,
            currency: 'USD',
            status: o.paymentStatus === 'Paid' ? 'Success' : o.paymentStatus === 'Refunded' ? 'Refunded' : 'Initiated',
            errorMessage: o.paymentStatus === 'Failed' ? 'Customer bank declined card payment' : null,
            gatewayResponse: {
              gateway: o.paymentMethod,
              order_id: o.orderNumber,
              created_at: o.createdAt,
            },
            createdAt: o.createdAt || new Date(o.date).toISOString(),
          }));
          setTransactions(mapped);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to load transaction ledger');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side Filter Calculation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        (t.transactionId && t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.orderId?._id && t.orderId._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.orderId?.orderNumber && t.orderId.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.userId?.name && t.userId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.userId?.email && t.userId.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.errorMessage && t.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchesProvider = providerFilter === 'ALL' || t.paymentProvider === providerFilter;

      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [transactions, searchTerm, statusFilter, providerFilter]);

  // Derived Summary Metrics
  const ledgerMetrics = useMemo(() => {
    let totalVolume = 0;
    let successVolume = 0;
    let refundedVolume = 0;
    let failedCount = 0;
    let successCount = 0;
    let refundedCount = 0;

    transactions.forEach((t) => {
      const amt = Number(t.amount || 0);
      totalVolume += amt;
      if (t.status === 'Success') {
        successVolume += amt;
        successCount++;
      } else if (t.status === 'Failed') {
        failedCount++;
      } else if (t.status === 'Refunded') {
        refundedVolume += amt;
        refundedCount++;
      }
    });

    const totalCount = transactions.length || 1;
    const successRate = Math.round((successCount / totalCount) * 100);
    const declineRate = Math.round((failedCount / totalCount) * 100);

    return {
      totalVolume,
      successVolume,
      refundedVolume,
      totalCount: transactions.length,
      successCount,
      failedCount,
      refundedCount,
      successRate,
      declineRate,
    };
  }, [transactions]);

  // Pagination
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredTransactions.slice(start, start + rowsPerPage);
  }, [filteredTransactions, currentPage, rowsPerPage]);

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Transaction ID copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRefundSuccess = (refundData) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t._id === refundData.payment._id || t.transactionId === refundData.payment.transactionId
          ? { ...t, ...refundData.payment, status: 'Refunded' }
          : t
      )
    );
    if (selectedTxn && (selectedTxn._id === refundData.payment._id || selectedTxn.transactionId === refundData.payment.transactionId)) {
      setSelectedTxn((prev) => ({ ...prev, ...refundData.payment, status: 'Refunded' }));
    }
  };

  // Export Ledger to CSV
  const handleExportCSV = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const rows = [];
      rows.push(['TRANSACTION LEDGER EXPORT']);
      rows.push(['Generated On', new Date().toLocaleString()]);
      rows.push(['Total Transactions', filteredTransactions.length]);
      rows.push(['']);
      rows.push([
        'Transaction ID',
        'Order Reference',
        'Date Placed',
        'Customer Name',
        'Customer Email',
        'Gateway Provider',
        'Payment Channel',
        'Amount',
        'Currency',
        'Status',
        'Error Diagnostics',
      ]);

      filteredTransactions.forEach((t) => {
        const txnId = t.transactionId || t._id;
        const orderNum = t.orderId?.orderNumber || t.orderId?._id || 'N/A';
        const dateStr = t.createdAt ? new Date(t.createdAt).toLocaleString() : 'N/A';
        const customer = t.userId?.name || `${t.orderId?.shippingAddress?.firstName || ''} ${t.orderId?.shippingAddress?.lastName || ''}`.trim() || 'N/A';
        const email = t.userId?.email || t.orderId?.shippingAddress?.email || 'N/A';
        const provider = t.paymentProvider || 'COD';
        const method = t.paymentMethod || 'Card';
        const amount = t.amount || 0;
        const cur = t.currency || 'USD';
        const status = t.status || 'Initiated';
        const error = t.errorMessage ? `"${t.errorMessage.replace(/"/g, '""')}"` : '""';

        rows.push([
          `"${txnId}"`,
          `"${orderNum}"`,
          `"${dateStr}"`,
          `"${customer}"`,
          `"${email}"`,
          `"${provider}"`,
          `"${method}"`,
          amount,
          `"${cur}"`,
          `"${status}"`,
          error,
        ]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Transactions_Ledger_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Transaction ledger exported to CSV');
    } catch (e) {
      toast.error('Failed to export CSV');
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent"></div>
        <p className="text-sm font-medium text-ink-muted animate-pulse font-sans">
          Loading financial settlement ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl">
      {/* Page Header */}
      <PageHeader
        title="Transactions &amp; Settlement Ledger"
        subtitle="Independent settlement ledger logging gateway payloads, authorizations, chargebacks, and disbursements."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Transactions" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTransactions(true)}
              disabled={isRefreshing}
              icon={
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              }
            >
              {isRefreshing ? 'Syncing...' : 'Sync Ledger'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Volume */}
        <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-gray-200 dark:border-[#292524] p-5 shadow-2xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
            Total Ledger Volume
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#FAF8F5] mt-1.5 font-display">
            {currency}{ledgerMetrics.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
            Across <strong className="text-gray-900 dark:text-[#FAF8F5]">{ledgerMetrics.totalCount}</strong> recorded attempts
          </p>
        </div>

        {/* Successful Transactions */}
        <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-gray-200 dark:border-[#292524] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Settled Volume (Success)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1.5 font-display">
            {currency}{ledgerMetrics.successVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400">
            <span>{ledgerMetrics.successCount} successful</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{ledgerMetrics.successRate}% rate</span>
          </div>
        </div>

        {/* Failed Transactions */}
        <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-gray-200 dark:border-[#292524] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Declines &amp; Failures
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-800 dark:text-rose-300 mt-1.5 font-display">
            {ledgerMetrics.failedCount}
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400">
            <span>Card declines &amp; timeouts</span>
            <span className="font-semibold text-rose-700 dark:text-rose-400">{ledgerMetrics.declineRate}% rate</span>
          </div>
        </div>

        {/* Refunded Volume */}
        <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-gray-200 dark:border-[#292524] p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
              Refunds Processed
            </span>
            <RotateCcw className="w-4 h-4 text-[#B08D57]" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-[#FAF8F5] mt-1.5 font-display">
            {currency}{ledgerMetrics.refundedVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
            {ledgerMetrics.refundedCount} refund {ledgerMetrics.refundedCount === 1 ? 'order' : 'orders'} completed
          </p>
        </div>
      </div>

      {/* Main DataTable Card */}
      <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-gray-200 dark:border-[#292524] shadow-2xs overflow-hidden">
        {/* Table Search & Filter Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-[#292524] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Transaction ID, Order #, customer, error..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50/60 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:border-[#1C1917] dark:focus:border-[#FAF8F5] focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status & Gateway Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl border border-gray-200 dark:border-neutral-800 overflow-x-auto text-xs font-medium">
              {['ALL', 'Success', 'Failed', 'Initiated', 'Refunded'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-neutral-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Provider Filter */}
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl font-medium text-gray-900 dark:text-neutral-100 focus:border-[#1C1917] dark:focus:border-[#FAF8F5] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Gateways</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Stripe">Stripe</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>
        </div>

        {/* DataTable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-900 dark:text-neutral-100">
            <thead className="bg-gray-50/60 dark:bg-neutral-900/60 text-[11px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider border-b border-gray-200 dark:border-neutral-800 select-none">
              <tr>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Date &amp; Time</th>
                <th className="px-5 py-3.5">Gateway &amp; Channel</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 dark:text-neutral-400">
                    <EmptyState
                      title="No Transactions Found"
                      description="Try resetting your search query or selecting a different status filter."
                    />
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn) => {
                  const txnId = txn.transactionId || txn._id;
                  const order = txn.orderId || {};
                  const orderNum = order.orderNumber || (order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : 'N/A');
                  const provider = txn.paymentProvider || 'COD';
                  const isSuccess = txn.status === 'Success';
                  const isFailed = txn.status === 'Failed';
                  const isRefunded = txn.status === 'Refunded';

                  return (
                    <tr
                      key={txn._id}
                      onClick={() => {
                        setSelectedTxn(txn);
                        setIsDrawerOpen(true);
                      }}
                      className="hover:bg-gray-50/80 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Transaction ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-gray-900 dark:text-neutral-100 group-hover:text-[#B08D57] transition-colors">
                            {txnId.length > 20 ? `${txnId.slice(0, 16)}...` : txnId}
                          </span>
                          <button
                            onClick={(e) => handleCopy(e, txnId, txn._id)}
                            className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-neutral-100 rounded transition cursor-pointer"
                            title="Copy Transaction ID"
                          >
                            {copiedId === txn._id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Order ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {order._id ? (
                          <Link
                            href="/orders"
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono font-medium text-[#B08D57] hover:underline flex items-center gap-1.5"
                          >
                            <span>{orderNum}</span>
                            <ExternalLink className="w-3 h-3 text-[#B08D57]/70" />
                          </Link>
                        ) : (
                          <span className="font-mono text-gray-400 dark:text-neutral-500">N/A</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-gray-500 dark:text-neutral-400">
                        <div className="font-medium text-gray-900 dark:text-neutral-100">
                          {txn.createdAt ? new Date(txn.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-neutral-500 font-mono">
                          {txn.createdAt ? new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      {/* Gateway & Channel */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant="outline">
                          {provider}
                        </Badge>
                        <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">
                          {txn.paymentMethod || 'Credit_Card'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-900 dark:text-neutral-100 text-sm font-display">
                          {currency}{Number(txn.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-neutral-400 ml-1">
                          {txn.currency || 'USD'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isSuccess ? (
                          <Badge variant="success">Settled</Badge>
                        ) : isFailed ? (
                          <Badge variant="danger">Declined</Badge>
                        ) : isRefunded ? (
                          <Badge variant="default">Refunded</Badge>
                        ) : (
                          <Badge variant="warning">{txn.status || 'Initiated'}</Badge>
                        )}
                        {isFailed && txn.errorMessage && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[140px] mt-0.5" title={txn.errorMessage}>
                            {txn.errorMessage}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedTxn(txn);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                            title="Inspect Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isSuccess && (
                            <button
                              onClick={() => {
                                setRefundTxn(txn);
                                setIsRefundOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Process Refund"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Refund</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-neutral-400">
          <div>
            Showing{' '}
            <strong className="text-gray-900 dark:text-white">
              {totalItems > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
            </strong>{' '}
            to{' '}
            <strong className="text-gray-900 dark:text-white">
              {Math.min(currentPage * rowsPerPage, totalItems)}
            </strong>{' '}
            of <strong className="text-gray-900 dark:text-white">{totalItems}</strong> transactions
          </div>

          <div className="flex items-center gap-2">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs px-2.5 py-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg text-gray-900 dark:text-neutral-100"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer text-gray-700 dark:text-neutral-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-gray-900 dark:text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 border border-gray-200 dark:border-neutral-700 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition cursor-pointer text-gray-700 dark:text-neutral-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer for Failure Inspection & Details */}
      <TransactionDetailsDrawer
        transaction={selectedTxn}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTxn(null);
        }}
        currency={currency}
        onInitiateRefund={(txn) => {
          setIsDrawerOpen(false);
          setRefundTxn(txn);
          setIsRefundOpen(true);
        }}
      />

      {/* Refund Modal */}
      <RefundModal
        transaction={refundTxn}
        isOpen={isRefundOpen}
        onClose={() => {
          setIsRefundOpen(false);
          setRefundTxn(null);
        }}
        backendUrl={backendUrl}
        token={token}
        currency={currency}
        onSuccess={handleRefundSuccess}
      />
    </div>
  );
}

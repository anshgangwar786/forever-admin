'use client';

import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Button } from '../ui';

export default function RefundModal({
  transaction,
  isOpen,
  onClose,
  backendUrl,
  token,
  currency = '$',
  onSuccess,
}) {
  const [reason, setReason] = useState('Customer requested return & refund');
  const [amount, setAmount] = useState(transaction?.amount || 0);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !transaction) return null;

  const txnId = transaction.transactionId || transaction._id;
  const orderNumber = transaction.orderId?.orderNumber || (transaction.orderId?._id ? `#ORD-${transaction.orderId._id.slice(-6).toUpperCase()}` : 'N/A');

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0 || amount > transaction.amount) {
      toast.error(`Refund amount must be between 1 and ${transaction.amount}`);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/payment/refund`,
        {
          paymentId: transaction._id,
          transactionId: transaction.transactionId,
          amount: Number(amount),
          reason: reason.trim(),
        },
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success(res.data.message || 'Refund processed successfully');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      } else {
        toast.error(res.data.message || 'Refund execution failed');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || 'Refund processing failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-canvas rounded-2xl shadow-2xl border border-hairline overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-hairline flex items-center justify-between bg-canvas-subtle">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-medium text-ink font-display">Process Client Refund</h2>
              <p className="text-[11px] text-ink-muted">Order {orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink rounded-lg hover:bg-canvas-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRefundSubmit} className="p-6 space-y-4 text-xs font-sans">
          {/* Warning banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Issuing a refund will instruct the payment provider ({transaction.paymentProvider}) to reverse charges and update the order ledger status to <strong>Refunded</strong>.
            </p>
          </div>

          {/* Transaction Metadata Card */}
          <div className="bg-canvas-subtle p-3.5 rounded-xl border border-hairline space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-muted">Transaction ID:</span>
              <span className="font-mono font-medium text-ink truncate max-w-[180px]">{txnId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Gateway:</span>
              <span className="font-medium text-ink">{transaction.paymentProvider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Original Charge:</span>
              <strong className="text-ink font-display text-sm">{currency}{transaction.amount}</strong>
            </div>
          </div>

          {/* Refund Amount Input */}
          <div>
            <label className="block text-ink font-medium text-[11px] uppercase tracking-wider mb-1">
              Refund Amount ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={transaction.amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2.5 bg-white border border-hairline rounded-xl text-ink font-medium text-sm focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-ink font-medium text-[11px] uppercase tracking-wider mb-1">
              Disbursement Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State rationale for refund auditing..."
              required
              className="w-full p-3 bg-white border border-hairline rounded-xl text-ink text-xs focus:border-accent focus:outline-none resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-hairline">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Executing...' : 'Authorize Refund'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

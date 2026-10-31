'use client';

import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  ExternalLink, 
  User, 
  Package, 
  ShieldAlert, 
  FileJson, 
  Calendar 
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Button, Badge } from '../ui';

export default function TransactionDetailsDrawer({
  transaction,
  isOpen,
  onClose,
  currency = '$',
  onInitiateRefund,
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen || !transaction) return null;

  const txnId = transaction.transactionId || transaction._id || 'N/A';
  const order = transaction.orderId || {};
  const orderNumber = order.orderNumber || (order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : 'N/A');
  const user = transaction.userId || {};
  const isFailed = transaction.status === 'Failed';
  const isSuccess = transaction.status === 'Success';
  const isRefunded = transaction.status === 'Refunded';

  const dateFormatted = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'medium',
      })
    : 'N/A';

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.success('Transaction ID copied');
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
      toast.success('Raw payload copied to clipboard');
    }
  };

  const provider = transaction.paymentProvider || 'COD';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-xl bg-canvas h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 border-l border-hairline">
        {/* Header */}
        <div className="p-6 border-b border-hairline flex items-center justify-between bg-canvas-subtle">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-medium text-ink font-display">Transaction Audit</h2>
              {isSuccess ? (
                <Badge variant="success">Settled</Badge>
              ) : isFailed ? (
                <Badge variant="danger">Declined</Badge>
              ) : isRefunded ? (
                <Badge variant="default">Refunded</Badge>
              ) : (
                <Badge variant="warning">{transaction.status}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{dateFormatted}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-canvas-muted transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-ink font-sans">
          {/* Transaction Identification & Amount Banner */}
          <div className="bg-canvas-subtle p-5 rounded-2xl border border-hairline flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                Transaction ID
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs font-semibold text-ink select-all">
                  {txnId}
                </span>
                <button
                  onClick={() => handleCopy(txnId, 'id')}
                  className="p-1 text-ink-muted hover:text-ink rounded transition cursor-pointer"
                  title="Copy Transaction ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                Gross Amount
              </span>
              <p className="text-xl font-bold text-ink font-display mt-0.5">
                {currency}{Number(transaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                <span className="text-xs font-normal text-ink-muted ml-1">
                  {transaction.currency || 'USD'}
                </span>
              </p>
            </div>
          </div>

          {/* FAILURE INSPECTION SECTION */}
          {isFailed && (
            <div className="border border-rose-200 bg-rose-50/60 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">
                  Payment Failure Diagnostics
                </h3>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-rose-200">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 block mb-0.5">
                  Decline Reason:
                </span>
                <p className="font-medium text-rose-900 text-xs">
                  {transaction.errorMessage || 'Transaction was declined by card network or issuing bank'}
                </p>
              </div>

              <div className="text-[11px] text-rose-800/90 leading-relaxed bg-rose-100/40 p-3 rounded-xl border border-rose-200/60">
                <strong>Remediation Note:</strong> Inspect the raw payload below for network error codes. Client may retry using alternative payment rails or bank authorization.
              </div>
            </div>
          )}

          {/* REFUND AUDIT SECTION */}
          {isRefunded && (
            <div className="border border-hairline bg-canvas-subtle p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-ink">
                <RotateCcw className="w-4 h-4 text-accent shrink-0" />
                <h3 className="font-semibold text-xs uppercase tracking-wider">Refund Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-ink-muted block text-[11px]">Refunded Amount:</span>
                  <strong className="text-ink font-bold font-display">
                    {currency}{Number(transaction.gatewayResponse?.refundAmount || transaction.amount).toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Reason:</span>
                  <span className="text-ink">
                    {transaction.gatewayResponse?.refundReason || 'Customer refund requested'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Gateway & Payment Method Details */}
          <div className="border border-hairline bg-white/80 rounded-2xl p-5 space-y-3 shadow-luxury">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-accent" />
              Gateway &amp; Ledger Metadata
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-ink-muted block text-[11px]">Payment Gateway</span>
                <Badge variant="outline" className="mt-1">
                  {provider}
                </Badge>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Method Channel</span>
                <span className="font-medium text-ink block mt-1">
                  {transaction.paymentMethod || 'Credit Card / UPI'}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Ledger Status</span>
                <span className="font-medium text-ink block mt-1">
                  {transaction.status}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Order Information */}
          <div className="border border-hairline bg-white/80 rounded-2xl p-5 space-y-3 shadow-luxury">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                <Package className="w-4 h-4 text-accent" />
                Linked Purchase Order
              </h3>
              {order._id && (
                <Link
                  href="/orders"
                  className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1"
                >
                  <span>Orders Console</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="bg-canvas-subtle p-3.5 rounded-xl border border-hairline space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-semibold text-ink text-xs">
                  {orderNumber}
                </span>
                <Badge variant="default">
                  {order.fulfillmentStatus || 'Pending'}
                </Badge>
              </div>

              {order.shippingAddress && (
                <p className="text-[11px] text-ink-muted">
                  Client: <strong className="text-ink font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</strong>
                  {order.shippingAddress.city ? ` • ${order.shippingAddress.city}, ${order.shippingAddress.country}` : ''}
                </p>
              )}

              {user.email && (
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <User className="w-3 h-3 text-ink-muted" />
                  {user.name ? `${user.name} (${user.email})` : user.email}
                </p>
              )}
            </div>
          </div>

          {/* RAW GATEWAY RESPONSE PAYLOAD */}
          <div className="border border-hairline rounded-2xl p-5 space-y-2 bg-ink text-canvas">
            <div className="flex items-center justify-between pb-2 border-b border-hairline/20">
              <div className="flex items-center gap-1.5 text-canvas">
                <FileJson className="w-4 h-4 text-accent" />
                <span className="font-semibold text-xs uppercase tracking-wider">
                  Raw Gateway Payload &amp; Webhook
                </span>
              </div>
              <button
                onClick={() => handleCopy(transaction.gatewayResponse || {}, 'payload')}
                className="text-[11px] font-medium text-canvas/70 hover:text-canvas flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <pre className="text-[11px] font-mono p-3 bg-black/40 rounded-xl overflow-x-auto max-h-64 scrollbar-thin text-emerald-300 leading-relaxed">
              {transaction.gatewayResponse && Object.keys(transaction.gatewayResponse).length > 0
                ? JSON.stringify(transaction.gatewayResponse, null, 2)
                : '// No raw gateway payload recorded for this transaction'}
            </pre>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-hairline bg-canvas-subtle flex items-center justify-between">
          <div>
            {isSuccess && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onInitiateRefund(transaction)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Process Refund
              </Button>
            )}
            {isRefunded && (
              <span className="text-xs font-medium text-ink-muted flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                Refund Completed
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

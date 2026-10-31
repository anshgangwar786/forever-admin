'use client';

import React, { useState } from 'react';
import { 
  X, 
  Package, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  CreditCard, 
  Printer, 
  Copy, 
  Check, 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button, Badge } from '../ui';

const getImageSrc = (img) => {
  if (!img) return null;
  if (Array.isArray(img)) return getImageSrc(img[0]);
  if (typeof img === 'object' && img?.src) return img.src;
  return img;
};

export default function OrderDetailsDrawer({
  order,
  isOpen,
  onClose,
  currency = '$',
  onUpdateStatus,
}) {
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order?.fulfillmentStatus || 'Pending');

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || (order._id ? `#ORD-${order._id.slice(-6).toUpperCase()}` : '#ORD');
  const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
  const customerName = `${order.address?.firstName || order.shippingAddress?.firstName || 'Customer'} ${order.address?.lastName || order.shippingAddress?.lastName || ''}`.trim();
  const email = order.address?.email || order.shippingAddress?.email || 'N/A';
  const phone = order.address?.phone || order.shippingAddress?.phone || 'N/A';
  const street = order.address?.street || order.shippingAddress?.street || '';
  const city = order.address?.city || order.shippingAddress?.city || '';
  const state = order.address?.state || order.shippingAddress?.state || '';
  const zipcode = order.address?.zipcode || order.shippingAddress?.zipcode || '';
  const country = order.address?.country || order.shippingAddress?.country || '';

  const isPaid = order.paymentStatus === 'Paid' || order.payment === true;
  const paymentMethod = order.paymentMethod || (order.paymentProvider ? order.paymentProvider : 'Cash on Delivery');
  const items = order.items || [];
  const grandTotal = order.grandTotal || order.amount || 0;
  const subTotal = order.subTotal || grandTotal;
  const shippingCost = order.shippingCost || 0;

  const handleCopyId = () => {
    navigator.clipboard.writeText(orderNum);
    setCopied(true);
    toast.success('Order number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveStatus = async () => {
    try {
      setUpdating(true);
      await onUpdateStatus(order._id, selectedStatus);
      toast.success(`Fulfillment status updated to ${selectedStatus}`);
    } catch (err) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl bg-[#FAF8F5] dark:bg-[#1C1917] h-full shadow-2xl z-10 flex flex-col justify-between overflow-hidden animate-fadeIn border-l border-[#E7E3D9] dark:border-[#292524]">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E7E3D9] dark:border-[#292524] flex items-center justify-between bg-white dark:bg-[#161413]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">{orderNum}</h2>
              <button
                onClick={handleCopyId}
                className="text-[#78716C] hover:text-[#1C1917] dark:hover:text-white p-1 rounded hover:bg-[#F4F1EA] dark:hover:bg-[#252220] transition cursor-pointer"
                title="Copy Order ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#2E5A36]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">Placed on {dateFormatted}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] dark:hover:text-white rounded-full hover:bg-[#F4F1EA] dark:hover:bg-[#252220] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Status Quick Control */}
          <div className="bg-white dark:bg-[#161413] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] space-y-3 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C]">
                Fulfillment Status
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-xs font-semibold uppercase tracking-wider border ${
                  selectedStatus === 'Delivered'
                    ? 'bg-[#EBF3EC] text-[#2E5A36] border-[#C2D9C6]'
                    : selectedStatus === 'Shipped'
                    ? 'bg-[#EBF2F8] text-[#2A4B6B] border-[#BFD3E6]'
                    : selectedStatus === 'Cancelled'
                    ? 'bg-[#FAECEB] text-[#8E2824] border-[#E8C4C2]'
                    : 'bg-[#FAF2E6] text-[#8C581E] border-[#EAD7BA]'
                }`}
              >
                {selectedStatus}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-[#FAF8F5] border border-[#E7E3D9] rounded-md focus:border-[#B08D57] outline-none text-[#1C1917]"
              >
                <option value="Pending">Pending Confirmation</option>
                <option value="Processing">Processing / Tailoring</option>
                <option value="Shipped">Dispatched / In Transit</option>
                <option value="Delivered">Delivered &bull; Complete</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveStatus}
                loading={updating}
                disabled={updating || selectedStatus === (order.fulfillmentStatus || order.status)}
              >
                Update
              </Button>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="bg-white border border-[#E7E3D9] rounded-xl p-4 space-y-3 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#B08D57]" />
              Client &amp; Shipping Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#44403C]">
              <div>
                <p className="font-serif font-medium text-[#1C1917] text-sm">{customerName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[#78716C]">
                  <Mail className="w-3.5 h-3.5 text-[#A8A29E]" />
                  {email}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[#78716C]">
                  <Phone className="w-3.5 h-3.5 text-[#A8A29E]" />
                  {phone}
                </p>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l sm:border-[#E7E3D9] sm:pl-3 pt-2 sm:pt-0">
                <p className="font-semibold text-[#1C1917] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#B08D57]" />
                  Delivery Destination:
                </p>
                <p className="text-[#44403C] mt-1 leading-relaxed">
                  {street && `${street}, `}
                  {city && `${city}, `}
                  {state && `${state} `}
                  {zipcode && `- ${zipcode}, `}
                  {country}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="bg-white border border-[#E7E3D9] rounded-xl p-4 space-y-3 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[#B08D57]" />
              Curated Pieces ({items.length})
            </h3>
            <div className="divide-y divide-[#E7E3D9]">
              {items.map((item, idx) => {
                const img = getImageSrc(item.image);
                const itemPrice = item.priceAtTimeOfPurchase || item.price || 0;
                const lineTotal = itemPrice * (item.quantity || 1);
                return (
                  <div key={idx} className="py-2.5 flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FAF8F5] rounded-md border border-[#E7E3D9] overflow-hidden shrink-0 flex items-center justify-center">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-[#A8A29E]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-serif font-medium text-[#1C1917] truncate">
                        {item.name || 'Product Item'}
                      </p>
                      <p className="text-[11px] text-[#78716C]">
                        {item.size ? `Size: ${item.size} • ` : ''}
                        Qty: <strong className="text-[#1C1917]">{item.quantity || 1}</strong>
                        {' '}&times; {currency}{itemPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#1C1917]">
                        {currency}{lineTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Financial Summary */}
          <div className="bg-white border border-[#E7E3D9] rounded-xl p-4 space-y-3 shadow-[0_1px_3px_rgba(28,25,23,0.04)]">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#B08D57]" />
              Financial Settlement
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#78716C]">
                <span>Pieces Subtotal</span>
                <span className="text-[#1C1917]">{currency}{subTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Complimentary Delivery</span>
                <span className="text-[#1C1917]">{shippingCost ? `${currency}${shippingCost}` : 'Free'}</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Payment Method</span>
                <span className="font-medium text-[#1C1917]">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[#78716C]">
                <span>Settlement Status</span>
                <span className={`font-semibold ${isPaid ? 'text-[#2E5A36]' : 'text-[#8C581E]'}`}>
                  {isPaid ? 'Paid' : 'Unpaid / Pending'}
                </span>
              </div>
              <div className="border-t border-[#E7E3D9] pt-2 flex justify-between font-serif text-sm font-semibold text-[#1C1917]">
                <span>Grand Total</span>
                <span>{currency}{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#E7E3D9] dark:border-[#292524] bg-white dark:bg-[#161413] flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E]" />}
          >
            Print Dossier
          </Button>
          <Button
            variant="primary"
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

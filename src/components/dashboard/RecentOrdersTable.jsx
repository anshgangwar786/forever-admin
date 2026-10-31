'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Copy, 
  Check, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CreditCard, 
  Truck, 
  Package, 
} from 'lucide-react';
import { toast } from 'react-toastify';

const getInitials = (firstName = '', lastName = '') => {
  const f = firstName ? firstName[0].toUpperCase() : 'U';
  const l = lastName ? lastName[0].toUpperCase() : '';
  return `${f}${l}`;
};

const getAvatarBg = (name = '') => {
  const colors = [
    'bg-[#F4F1EA] text-[#1C1917] border-[#E7E3D9]',
    'bg-[#F7F3EB] text-[#B08D57] border-[#B08D57]/30',
    'bg-[#EBF2F8] text-[#2A4B6B] border-[#BFD3E6]',
    'bg-[#EBF3EC] text-[#2E5A36] border-[#C2D9C6]',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function RecentOrdersTable({
  orders = [],
  currency = '$',
  onSelectOrder,
  onUpdateStatus,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const filterOptions = ['ALL', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderNum = (order.orderNumber || order._id || '').toLowerCase();
      const customer = `${order.address?.firstName || order.shippingAddress?.firstName || ''} ${order.address?.lastName || order.shippingAddress?.lastName || ''}`.toLowerCase();
      const email = (order.address?.email || order.shippingAddress?.email || '').toLowerCase();
      const city = (order.address?.city || order.shippingAddress?.city || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !query ||
        orderNum.includes(query) ||
        customer.includes(query) ||
        email.includes(query) ||
        city.includes(query);

      const fulfillment = order.fulfillmentStatus || order.status || 'Pending';
      const matchesStatus =
        statusFilter === 'ALL' || fulfillment.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, currentPage, rowsPerPage]);

  const handleCopyId = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.success('Order ID copied');
    setActiveMenuId(null);
  };

  const handleQuickStatus = async (e, orderId, status) => {
    e.stopPropagation();
    setActiveMenuId(null);
    try {
      await onUpdateStatus(orderId, status);
      toast.success(`Updated order to ${status}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-[0_1px_3px_rgba(28,25,23,0.04)] overflow-hidden">
      {/* Table Header & Controls Bar */}
      <div className="p-5 border-b border-[#E7E3D9] dark:border-[#292524] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">Recent Orders Stream</h2>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-xs bg-[#FAF8F5] dark:bg-[#252220] text-[#78716C] dark:text-[#A8A29E] border border-[#E7E3D9] dark:border-[#292524]">
                {orders.length} transactions
              </span>
            </div>
            <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5 font-sans">
              Real-time fulfillment ledger with quick actions
            </p>
          </div>

          <Link
            href="/orders"
            className="text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] hover:text-[#B08D57] transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Full Order Desk &rarr;</span>
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID, client, email, city..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-2 bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-md focus:bg-white dark:focus:bg-[#1C1917] focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57]/30 outline-none text-[#1C1917] dark:text-[#FAF8F5]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setStatusFilter(opt);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider font-medium rounded-xs whitespace-nowrap transition cursor-pointer ${
                  statusFilter === opt
                    ? 'bg-[#1C1917] text-[#FAF8F5] shadow-xs'
                    : 'bg-[#FAF8F5] text-[#78716C] hover:bg-[#F4F1EA] border border-[#E7E3D9]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#44403C] dark:text-[#D6D3D1]">
          <thead className="bg-[#FAF8F5] dark:bg-[#161413] text-xs font-medium text-[#78716C] dark:text-[#A8A29E] border-b border-[#E7E3D9] dark:border-[#292524]">
            <tr>
              <th className="px-5 py-3">Order ID &amp; placed</th>
              <th className="px-5 py-3">Customer &amp; location</th>
              <th className="px-5 py-3">Items &amp; total</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Fulfillment</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3D9] dark:divide-[#292524]">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[#78716C] dark:text-[#A8A29E]">
                  <Package className="w-8 h-8 mx-auto text-[#DCD7CC] dark:text-[#44403C] mb-2" />
                  <p className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5]">No matching orders found</p>
                  <p className="text-xs text-[#A8A29E] mt-1">Adjust search parameters or active filters</p>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const orderNum = order.orderNumber || `#ORD-${order._id.slice(-6).toUpperCase()}`;
                const firstName = order.address?.firstName || order.shippingAddress?.firstName || '';
                const lastName = order.address?.lastName || order.shippingAddress?.lastName || '';
                const customerName = `${firstName} ${lastName}`.trim() || 'Guest Customer';
                const city = order.address?.city || order.shippingAddress?.city || '';
                const country = order.address?.country || order.shippingAddress?.country || '';
                const itemsCount = order.items?.length || 0;
                const totalAmount = order.grandTotal || order.amount || 0;
                const paymentMethod = order.paymentMethod || (order.paymentProvider ? order.paymentProvider : 'Cash on Delivery');
                const isPaid = order.paymentStatus === 'Paid' || order.payment === true;
                const fulfillment = order.fulfillmentStatus || order.status || 'Pending';

                let statusBadgeClasses = 'bg-[#FAF2E6] text-[#8C581E] border-[#EAD7BA] dark:bg-[#382613] dark:text-[#FBBF24] dark:border-[#78350F]';
                if (fulfillment === 'Shipped') {
                  statusBadgeClasses = 'bg-[#EBF2F8] text-[#2A4B6B] border-[#BFD3E6] dark:bg-[#1E293B] dark:text-[#60A5FA] dark:border-[#334155]';
                } else if (fulfillment === 'Delivered') {
                  statusBadgeClasses = 'bg-[#EBF3EC] text-[#2E5A36] border-[#C2D9C6] dark:bg-[#14532D] dark:text-[#4ADE80] dark:border-[#166534]';
                } else if (fulfillment === 'Cancelled') {
                  statusBadgeClasses = 'bg-[#FAECEB] text-[#8E2824] border-[#E8C4C2] dark:bg-[#450A0A] dark:text-[#F87171] dark:border-[#7F1D1D]';
                }

                return (
                  <tr
                    key={order._id}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-colors cursor-pointer group"
                  >
                    {/* Order ID & Creation Time */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] group-hover:text-[#B08D57] transition-colors">
                          {orderNum}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#78716C] mt-0.5">
                        <Calendar className="w-3 h-3 text-[#A8A29E]" />
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                    </td>

                    {/* Customer & Location */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border shrink-0 ${getAvatarBg(
                            customerName
                          )}`}
                        >
                          {getInitials(firstName, lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1C1917] truncate">{customerName}</p>
                          <p className="text-[11px] text-[#78716C] flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {city ? `${city}${country ? `, ${country}` : ''}` : 'Location N/A'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Items & Total */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-medium text-[#1C1917]">
                        {currency}{totalAmount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-[#78716C] mt-0.5">
                        {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                      </p>
                    </td>

                    {/* Payment Method & Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#78716C]" />
                        <span className="font-medium text-[#1C1917]">{paymentMethod}</span>
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-xs border ${
                          isPaid
                            ? 'bg-[#EBF3EC] text-[#2E5A36] border-[#C2D9C6]'
                            : 'bg-[#FAF2E6] text-[#8C581E] border-[#EAD7BA]'
                        }`}
                      >
                        {isPaid ? '● Paid' : '○ Pending'}
                      </span>
                    </td>

                    {/* Fulfillment Status Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-xs text-[10px] font-semibold uppercase tracking-wider border capitalize ${statusBadgeClasses}`}
                      >
                        {fulfillment}
                      </span>
                    </td>

                    {/* Row Action Menu */}
                    <td className="px-5 py-4 text-right whitespace-nowrap relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === order._id ? null : order._id);
                        }}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EA] rounded-full transition cursor-pointer"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === order._id && (
                        <div
                          className="absolute right-5 mt-1 w-44 bg-white rounded-md shadow-xl border border-[#E7E3D9] py-1.5 z-30 text-left animate-fadeIn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onSelectOrder(order);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs text-[#44403C] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#78716C]" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={(e) => handleCopyId(e, orderNum)}
                            className="w-full px-3.5 py-2 text-xs text-[#44403C] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#78716C]" />
                            <span>Copy ID</span>
                          </button>
                          <div className="border-t border-[#E7E3D9] my-1"></div>
                          <button
                            onClick={(e) => handleQuickStatus(e, order._id, 'Shipped')}
                            className="w-full px-3.5 py-1.5 text-xs text-[#2A4B6B] hover:bg-[#EBF2F8] flex items-center gap-2 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Mark as Shipped</span>
                          </button>
                          <button
                            onClick={(e) => handleQuickStatus(e, order._id, 'Delivered')}
                            className="w-full px-3.5 py-1.5 text-xs text-[#2E5A36] hover:bg-[#EBF3EC] flex items-center gap-2 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as Delivered</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-4 border-t border-[#E7E3D9] bg-[#FAF8F5]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#78716C]">
        <div>
          Showing{' '}
          <strong className="text-[#1C1917]">
            {totalItems > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong className="text-[#1C1917]">
            {Math.min(currentPage * rowsPerPage, totalItems)}
          </strong>{' '}
          of <strong className="text-[#1C1917]">{totalItems}</strong> entries
        </div>

        <div className="flex items-center gap-2">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs px-2.5 py-1 bg-white border border-[#E7E3D9] rounded-md outline-none"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-[#E7E3D9] rounded-md bg-white hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-[#1C1917]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 border border-[#E7E3D9] rounded-md bg-white hover:bg-[#FAF8F5] disabled:opacity-40 cursor-pointer transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

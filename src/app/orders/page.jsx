'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../context/AdminAuthContext";
import {
  Button,
  Badge,
  Input,
  Select,
  EmptyState,
  ConfirmDialog,
  PageHeader,
} from "../../components/ui";
import OrderDetailsDrawer from "../../components/dashboard/OrderDetailsDrawer";
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Trash2,
  MoreVertical,
  SlidersHorizontal,
  Package,
  Calendar,
  CreditCard,
  Truck,
  ShoppingBag,
  Clock,
  ArrowUpDown,
  Filter,
} from "lucide-react";

const getImageSrc = (img) => (typeof img === "object" && img?.src ? img.src : img);

// Category normalization
const normalizeCategory = (category, itemName = "") => {
  if (!category || category === "undefined" || category === "null") {
    const name = (itemName || "").toLowerCase();
    if (
      name.includes("tshirt") ||
      name.includes("shirt") ||
      name.includes("pant") ||
      name.includes("jacket") ||
      name.includes("dress") ||
      name.includes("hoodie") ||
      name.includes("cotton")
    ) {
      return "Fashion & Apparel";
    }
    return "General";
  }

  const trimmed = category.trim();
  if (trimmed === "Men" || trimmed === "Women" || trimmed === "Kids") {
    return "Fashion & Apparel";
  }
  return trimmed;
};

const STATUS_OPTIONS = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for delivery",
  "Delivered",
];

export default function Orders() {
  const { token, backendUrl, currency } = useAdminAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Density & View Controls
  const [density, setDensity] = useState("default"); // 'default' | 'compact'
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  // Close 3-dot dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-dropdown-container]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch all orders from backend
  const fetchAllOrders = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/order/list`,
        {},
        { headers: { token } },
      );
      if (res.data.success) {
        setOrders(res.data.data || []);
      } else {
        toast.error(res.data.message || "Failed to load orders");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load orders",
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  const statusHandler = async (e, orderId) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      setStatusUpdatingId(orderId);
      const res = await axios.post(
        `${backendUrl}/api/v1/order/status`,
        { orderId, status: newStatus },
        { headers: { token } },
      );
      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder((prev) => ({ ...prev, status: newStatus, fulfillmentStatus: newStatus }));
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update status",
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await axios.post(
        `${backendUrl}/api/v1/order/delete`,
        { orderId: orderToDelete._id },
        { headers: { token } },
      );
      if (res.data.success) {
        toast.success("Order deleted successfully");
        setOrders((prev) => prev.filter((o) => o._id !== orderToDelete._id));
        setOrderToDelete(null);
        if (selectedOrder?._id === orderToDelete._id) {
          setIsDrawerOpen(false);
          setSelectedOrder(null);
        }
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete order",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyOrderId = (e, id) => {
    e.stopPropagation();
    if (!id) return;
    const formatted = `#ORD-${id.slice(-6).toUpperCase()}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    toast.info(`Copied ${formatted} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic Category Extraction & Order Counts
  const { categoryCounts, availableCategories } = useMemo(() => {
    const counts = { ALL: orders.length };
    const allCatsSet = new Set();

    orders.forEach((order) => {
      const orderCategories = new Set();
      (order.items || []).forEach((item) => {
        const cat = normalizeCategory(item.category || item.productId?.category, item.name);
        orderCategories.add(cat);
        allCatsSet.add(cat);
      });

      if (orderCategories.size === 0) {
        orderCategories.add("General");
        allCatsSet.add("General");
      }

      orderCategories.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const sortedCats = Array.from(allCatsSet).sort((a, b) => a.localeCompare(b));
    return { categoryCounts: counts, availableCategories: sortedCats };
  }, [orders]);

  // Dynamic Status Counts
  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length };
    orders.forEach((o) => {
      const s = o.status || "Order Placed";
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filter & Sort Logic
  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // 1. Category Filter
    if (selectedCategory !== "ALL") {
      result = result.filter((order) => {
        const items = order.items || [];
        if (items.length === 0 && selectedCategory === "General") return true;
        return items.some((item) => {
          const cat = normalizeCategory(item.category || item.productId?.category, item.name);
          return cat === selectedCategory;
        });
      });
    }

    // 2. Status Filter
    if (selectedStatus !== "ALL") {
      result = result.filter((order) => (order.status || "Order Placed") === selectedStatus);
    }

    // 3. Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((order) => {
        const idMatch = order._id?.toLowerCase().includes(q);
        const nameMatch = `${order.address?.firstName || ""} ${order.address?.lastName || ""}`
          .toLowerCase()
          .includes(q);
        const phoneMatch = order.address?.phone?.toLowerCase().includes(q);
        const locationMatch = `${order.address?.city || ""} ${order.address?.state || ""} ${order.address?.street || ""} ${order.address?.country || ""}`
          .toLowerCase()
          .includes(q);
        const methodMatch = order.paymentMethod?.toLowerCase().includes(q);
        const statusMatch = order.status?.toLowerCase().includes(q);
        const itemsMatch = (order.items || []).some((item) => {
          const cat = normalizeCategory(item.category || item.productId?.category, item.name);
          return (
            item.name?.toLowerCase().includes(q) ||
            cat.toLowerCase().includes(q) ||
            (item.subCategory && item.subCategory.toLowerCase().includes(q))
          );
        });

        return idMatch || nameMatch || phoneMatch || locationMatch || methodMatch || statusMatch || itemsMatch;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      const amountA = Number(a.amount) || 0;
      const amountB = Number(b.amount) || 0;
      const itemsCountA = (a.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
      const itemsCountB = (b.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
      const nameA = `${a.address?.firstName || ""} ${a.address?.lastName || ""}`.trim().toLowerCase();
      const nameB = `${b.address?.firstName || ""} ${b.address?.lastName || ""}`.trim().toLowerCase();

      switch (sortBy) {
        case "oldest":
          return dateA - dateB;
        case "amount-high":
          return amountB - amountA;
        case "amount-low":
          return amountA - amountB;
        case "items-high":
          return itemsCountB - itemsCountA;
        case "items-low":
          return itemsCountA - itemsCountB;
        case "customer-asc":
          return nameA.localeCompare(nameB);
        case "customer-desc":
          return nameB.localeCompare(nameA);
        case "newest":
        default:
          return dateB - dateA;
      }
    });

    return result;
  }, [orders, selectedCategory, selectedStatus, searchTerm, sortBy]);

  // Summary Metrics of Currently Filtered Set
  const summaryMetrics = useMemo(() => {
    const totalRev = filteredAndSortedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const pendingCount = filteredAndSortedOrders.filter(
      (o) => !o.status || o.status === "Order Placed" || o.status === "Packing",
    ).length;
    const deliveredCount = filteredAndSortedOrders.filter(
      (o) => o.status === "Delivered",
    ).length;
    const avgAOV = filteredAndSortedOrders.length > 0 ? totalRev / filteredAndSortedOrders.length : 0;

    return { totalRev, pendingCount, deliveredCount, avgAOV };
  }, [filteredAndSortedOrders]);

  const clearAllFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSearchTerm("");
    setSortBy("newest");
  };

  const isFilterActive =
    selectedCategory !== "ALL" ||
    selectedStatus !== "ALL" ||
    searchTerm.trim() !== "" ||
    sortBy !== "newest";

  const getFulfillmentBadge = (status = "Order Placed") => {
    switch (status) {
      case "Delivered":
        return <Badge variant="success" dot>Delivered</Badge>;
      case "Shipped":
      case "Out for delivery":
        return <Badge variant="info" dot>{status}</Badge>;
      case "Packing":
        return <Badge variant="warning" dot>Packing</Badge>;
      case "Cancelled":
        return <Badge variant="danger" dot>Cancelled</Badge>;
      case "Order Placed":
      default:
        return <Badge variant="accent" dot>{status || "Order Placed"}</Badge>;
    }
  };

  const paddingClass = density === "compact" ? "py-2.5 px-3 text-xs" : "py-3.5 px-4 text-xs sm:text-sm";
  const headerPaddingClass = density === "compact" ? "py-2 px-3 text-xs" : "py-3 px-4 text-xs";

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Orders & Fulfillment"
        subtitle="Review real-time client purchases, update dispatch lifecycle, and manage fulfillment operations."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Orders" },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllOrders}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
          >
            {loading ? "Syncing..." : "Refresh"}
          </Button>
        }
      />

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A8A29E] text-xs">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-[#B08D57]" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-normal text-[#1C1917] dark:text-[#FAF8F5] mt-1.5">
            {orders.length}
          </p>
          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">All ledger entries</span>
        </div>

        <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A8A29E] text-xs">
            <span>Pending Dispatch</span>
            <Clock className="w-4 h-4 text-[#8C581E]" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-normal text-[#8C581E] mt-1.5">
            {summaryMetrics.pendingCount}
          </p>
          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">Awaiting fulfillment</span>
        </div>

        <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A8A29E] text-xs">
            <span>Delivered</span>
            <Truck className="w-4 h-4 text-[#2E5A36]" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-normal text-[#2E5A36] mt-1.5">
            {summaryMetrics.deliveredCount}
          </p>
          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">Successfully received</span>
        </div>

        <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs">
          <div className="flex items-center justify-between text-[#78716C] dark:text-[#A8A29E] text-xs">
            <span>Filtered Volume</span>
            <CreditCard className="w-4 h-4 text-[#B08D57]" />
          </div>
          <p className="font-serif text-xl sm:text-2xl font-normal text-[#1C1917] dark:text-[#FAF8F5] mt-1.5">
            {currency}{summaryMetrics.totalRev.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">Avg {currency}{summaryMetrics.avgAOV.toFixed(0)} / order</span>
        </div>
      </div>

      {/* Status Filter Chips Bar */}
      <div className="bg-white dark:bg-[#1C1917] p-3 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedStatus("ALL")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedStatus === "ALL"
                ? "bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] shadow-xs"
                : "bg-[#FAF8F5] dark:bg-[#161413] text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] border border-[#E7E3D9] dark:border-[#292524]"
            }`}
          >
            <span>All Statuses</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedStatus === "ALL" ? "bg-white/20 dark:bg-black/20" : "bg-[#E7E3D9] dark:bg-[#292524]"}`}>
              {statusCounts.ALL || 0}
            </span>
          </button>

          {STATUS_OPTIONS.map((status) => {
            const isSelected = selectedStatus === status;
            const count = statusCounts[status] || 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] shadow-xs"
                    : "bg-[#FAF8F5] dark:bg-[#161413] text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] border border-[#E7E3D9] dark:border-[#292524]"
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? "bg-white/20 dark:bg-black/20" : "bg-[#E7E3D9] dark:bg-[#292524]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Density Toggle */}
        <button
          type="button"
          onClick={() => setDensity(density === "compact" ? "default" : "compact")}
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
            density === "compact"
              ? "bg-[#1C1917] text-white border-[#1C1917] dark:bg-[#FAF8F5] dark:text-[#1C1917]"
              : "bg-[#FAF8F5] dark:bg-[#161413] text-[#78716C] dark:text-[#A8A29E] border-[#E7E3D9] dark:border-[#292524] hover:border-[#B08D57]"
          }`}
          title="Toggle compact/spacious view density"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{density === "compact" ? "Compact" : "Default"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, customer name, phone, city..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#1C1917] dark:text-[#FAF8F5] placeholder-[#A8A29E] focus:outline-none focus:border-[#B08D57] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#78716C] hover:text-[#1C1917] dark:hover:text-[#FAF8F5]"
              >
                &times;
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#1C1917] dark:text-[#FAF8F5] cursor-pointer focus:outline-none focus:border-[#B08D57]"
            >
              <option value="ALL">Department: All ({categoryCounts.ALL || 0})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-[#1C1917] dark:text-[#FAF8F5] cursor-pointer focus:outline-none focus:border-[#B08D57]"
            >
              <option value="newest">Sort: Date (Newest first)</option>
              <option value="oldest">Sort: Date (Oldest first)</option>
              <option value="amount-high">Sort: Amount (High to low)</option>
              <option value="amount-low">Sort: Amount (Low to high)</option>
              <option value="customer-asc">Sort: Customer (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Clear Row */}
        {isFilterActive && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E7E3D9] dark:border-[#292524] text-[#78716C] dark:text-[#A8A29E]">
            <div className="flex items-center gap-2">
              <span>Showing <strong>{filteredAndSortedOrders.length}</strong> of {orders.length} orders</span>
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-[#8E2824] hover:underline font-medium cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="w-full bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF8F5] dark:bg-[#161413] text-[#78716C] dark:text-[#A8A29E] font-medium border-b border-[#E7E3D9] dark:border-[#292524] sticky top-0 z-10">
              <tr>
                <th className={headerPaddingClass}>Order ID</th>
                <th className={headerPaddingClass}>Date &amp; time</th>
                <th className={headerPaddingClass}>Customer &amp; destination</th>
                <th className={headerPaddingClass}>Items</th>
                <th className={headerPaddingClass}>Amount</th>
                <th className={headerPaddingClass}>Payment</th>
                <th className={headerPaddingClass}>Fulfillment</th>
                <th className={`${headerPaddingClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3D9]/60 dark:divide-[#292524]/60 bg-white dark:bg-[#1C1917]">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-xs text-[#78716C] dark:text-[#A8A29E]">
                    <div className="inline-block animate-spin w-6 h-6 border-2 border-[#B08D57] border-t-transparent rounded-full mb-2" />
                    <p>Loading enterprise orders...</p>
                  </td>
                </tr>
              ) : filteredAndSortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title={orders.length === 0 ? "No orders received yet" : "No orders match criteria"}
                      description={
                        orders.length === 0
                          ? "New purchases placed on the customer storefront will stream here automatically."
                          : "Try resetting your active filters or search terms."
                      }
                      actionLabel={isFilterActive ? "Reset filters" : undefined}
                      onAction={isFilterActive ? clearAllFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredAndSortedOrders.map((order) => {
                  const orderDate = new Date(order.date || order.createdAt || Date.now());
                  const formattedDate = orderDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const formattedTime = orderDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const formattedId = `#ORD-${order._id?.slice(-6).toUpperCase()}`;
                  const customerName = `${order.address?.firstName || ""} ${order.address?.lastName || ""}`.trim() || "Guest Customer";
                  const destination = `${order.address?.city || ""}${order.address?.country ? `, ${order.address.country}` : ""}`;
                  const itemsCount = (order.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
                  const isPaid = order.paymentStatus === "Paid" || order.payment === true;
                  const paymentMethod = order.paymentMethod || "COD";
                  const isMenuOpen = activeMenuId === order._id;

                  return (
                    <tr
                      key={order._id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDrawerOpen(true);
                      }}
                      className="transition-colors hover:bg-[#FAF8F5]/80 dark:hover:bg-[#252220] cursor-pointer group"
                    >
                      {/* Order ID */}
                      <td className={paddingClass}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-[#1C1917] dark:text-[#FAF8F5] group-hover:text-[#B08D57] transition-colors">
                            {formattedId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyOrderId(e, order._id)}
                            className="p-1 rounded text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAF8F5] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedId === order._id ? (
                              <Check className="w-3 h-3 text-[#2E5A36]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className={paddingClass}>
                        <div className="text-xs">
                          <span className="text-[#1C1917] dark:text-[#FAF8F5] block font-medium">
                            {formattedDate}
                          </span>
                          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                            {formattedTime}
                          </span>
                        </div>
                      </td>

                      {/* Customer & Location */}
                      <td className={paddingClass}>
                        <div className="min-w-0 max-w-[200px]">
                          <span className="text-xs font-medium text-[#1C1917] dark:text-[#FAF8F5] truncate block">
                            {customerName}
                          </span>
                          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E] truncate block">
                            {destination || "Standard Delivery"}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className={paddingClass}>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F1EA] dark:bg-[#292524] text-[#1C1917] dark:text-[#FAF8F5]">
                            {itemsCount} {itemsCount === 1 ? "unit" : "units"}
                          </span>
                          <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E] hidden md:inline truncate max-w-[130px]">
                            {order.items?.[0]?.name || "Catalog item"}
                          </span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className={paddingClass}>
                        <span className="font-serif text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#FAF8F5]">
                          {currency}{Number(order.amount || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Payment Badge */}
                      <td className={paddingClass}>
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            isPaid
                              ? "bg-[#EBF3EC] text-[#2E5A36] dark:bg-[#14532D] dark:text-[#4ADE80]"
                              : "bg-[#FAF2E6] text-[#8C581E] dark:bg-[#382613] dark:text-[#FBBF24]"
                          }`}>
                            {isPaid ? "Paid" : "Pending"}
                          </span>
                          <span className="text-[10px] text-[#78716C] dark:text-[#A8A29E] block uppercase">
                            {paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Fulfillment Status Select */}
                      <td className={paddingClass} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <select
                            value={order.status || "Order Placed"}
                            onChange={(e) => statusHandler(e, order._id)}
                            disabled={statusUpdatingId === order._id}
                            className="px-2.5 py-1 text-xs rounded-md bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] text-[#1C1917] dark:text-[#FAF8F5] font-medium cursor-pointer focus:outline-none focus:border-[#B08D57] transition-all"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          {statusUpdatingId === order._id && (
                            <div className="w-3 h-3 border-2 border-[#B08D57] border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className={`${paddingClass} text-right`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 relative" data-dropdown-container>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-md text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#FAF8F5] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] transition-colors"
                            title="Inspect dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveMenuId(isMenuOpen ? null : order._id)}
                            className="p-1.5 rounded-md text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#FAF8F5] hover:bg-[#F4F1EA] dark:hover:bg-[#292524] transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* 3-Dot Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1C1917] rounded-lg shadow-xl border border-[#E7E3D9] dark:border-[#292524] py-1 z-30 text-left animate-fadeIn">
                              <button
                                type="button"
                                onClick={(e) => {
                                  copyOrderId(e, order._id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#44403C] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#B08D57]" />
                                <span>Copy Order ID</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsDrawerOpen(true);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#44403C] dark:text-[#D6D3D1] hover:bg-[#FAF8F5] dark:hover:bg-[#252220] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#78716C]" />
                                <span>View full dossier</span>
                              </button>

                              <div className="my-1 border-t border-[#E7E3D9] dark:border-[#292524]" />

                              <button
                                type="button"
                                onClick={() => {
                                  setOrderToDelete(order);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#8E2824] hover:bg-[#FAECEB] dark:hover:bg-[#3D1A18] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete order</span>
                              </button>
                            </div>
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
      </div>

      {/* Order Details Slide-Out Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedOrder(null);
        }}
        currency={currency}
        onUpdateStatus={async (orderId, status) => {
          await statusHandler({ target: { value: status }, stopPropagation: () => {} }, orderId);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(orderToDelete)}
        onClose={() => setOrderToDelete(null)}
        onConfirm={confirmDeleteOrder}
        title="Delete Order Record"
        description={`Are you sure you want to permanently delete order #ORD-${orderToDelete?._id?.slice(-6).toUpperCase()}? This action will remove the record from Mission Control.`}
        confirmLabel="Delete Order"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}

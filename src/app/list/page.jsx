'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Link from "next/link";
import { useAdminAuth } from "../../context/AdminAuthContext";
import ProductDashboardModal from "../../components/ProductDashboardModal";
import ImageUploadWithZoom from "../../components/ImageUploadWithZoom";
import VariantImagePicker from "../../components/VariantImagePicker";
import VariantPriceEditor from "../../components/VariantPriceEditor";
import { ConfirmDialog, PageHeader } from "../../components/ui";
import {
  BarChart3,
  Pencil,
  Trash2,
  Package,
  Star,
  Search,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

const getImageSrc = (img) => (typeof img === "object" && img?.src ? img.src : img);

const LOW_STOCK = 10;
const stockOf = (item) => (item.stock !== undefined ? Number(item.stock) : 50);
const salePrice = (item) => (item.discount > 0 ? Math.round(item.price * (1 - item.discount / 100)) : item.price);

function ProductThumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-10 h-10 rounded-lg bg-canvas-muted border border-hairline shrink-0 overflow-hidden flex items-center justify-center">
      {src && !failed ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <Package className="w-4 h-4 text-ink-faint" />
      )}
    </div>
  );
}

export default function List() {
  const { token, backendUrl, currency, adminUser } = useAdminAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // 'all' or 'my-products'

  // Advanced Filtering & Sorting States
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // 'all', 'in-stock', 'low-stock', 'out-of-stock'
  const [bestsellerFilter, setBestsellerFilter] = useState("all"); // 'all', 'bestseller', 'regular'
  const [sellerFilter, setSellerFilter] = useState("all"); // 'all' or specific storeName
  const [saleFilter, setSaleFilter] = useState("all"); // 'all' or 'on-sale'
  const [sortBy, setSortBy] = useState("date-desc"); // 'date-desc', 'date-asc', 'price-asc', 'price-desc', 'name-asc', 'name-desc', 'stock-desc', 'stock-asc', 'discount-desc'

  // Product Dashboard / Insights Modal State
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [insightsProduct, setInsightsProduct] = useState(null);

  // Delete Confirm Dialog State
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // "/" focuses the search box
  const searchRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDiscount, setEditDiscount] = useState(0);
  const [editStock, setEditStock] = useState(50);
  const [editCategory, setEditCategory] = useState("Men");
  const [editSubCategory, setEditSubCategory] = useState("Topwear");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [editBestseller, setEditBestseller] = useState(false);
  const [editSizes, setEditSizes] = useState([]);
  const [editAttributes, setEditAttributes] = useState([]);
  const [editTagInputs, setEditTagInputs] = useState({});
  const [newImage1, setNewImage1] = useState(null);
  const [newImage2, setNewImage2] = useState(null);
  const [editVariantLinks, setEditVariantLinks] = useState([]);
  const [editVariantPrices, setEditVariantPrices] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Existing image URLs plus pending uploads ("upload:<slot>" refs are resolved by the backend)
  const editPickerImages = useMemo(() => {
    const existing = (editingProduct?.image || []).map((img, i) => ({
      ref: getImageSrc(img),
      src: getImageSrc(img),
      label: `Existing Image #${i + 1}`,
    }));
    const pending = [newImage1, newImage2]
      .map((file, i) => ({ file, slot: `image${i + 1}` }))
      .filter(({ file }) => file)
      .map(({ file, slot }, i) => ({ ref: `upload:${slot}`, src: URL.createObjectURL(file), label: `New Image ${i + 1}` }));
    return [...existing, ...pending];
  }, [editingProduct, newImage1, newImage2]);

  useEffect(
    () => () => editPickerImages.forEach((img) => img.src.startsWith("blob:") && URL.revokeObjectURL(img.src)),
    [editPickerImages]
  );

  // Fetch categories from backend API dynamically
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/v1/category");
        if (res.data.success && Array.isArray(res.data.data)) {
          setAvailableCategories(res.data.data);
        }
      } catch (err) {
        console.warn("Failed to load categories for edit dropdown:", err.message);
      }
    };
    loadCategories();
  }, [backendUrl]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(backendUrl + "/api/v1/product/list", {
        headers: token ? { token } : {}
      });
      if (res.data.success) {
        setList(res.data.data);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load products",
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Deep linking to product dashboard from query parameters (?dashboard=<id> or ?insights=<id>)
  useEffect(() => {
    if (typeof window !== "undefined" && list.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get("insights") || params.get("dashboard");
      if (targetId) {
        const found = list.find((p) => p._id === targetId);
        if (found) {
          openInsightsModal(found);
        }
      }
    }
  }, [list]);

  // Open Product Insights / Dashboard Modal
  const openInsightsModal = (product) => {
    setInsightsProduct(product);
    setInsightsModalOpen(true);
  };

  const handleEditFromInsights = (product) => {
    setInsightsModalOpen(false);
    openEditModal(product);
  };

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct(product);
    setEditName(product.name || "");
    setEditDescription(product.description || "");
    setEditPrice(product.price || "");
    setEditDiscount(product.discount || 0);
    setEditStock(product.stock !== undefined ? product.stock : 50);
    setEditCategory(product.category || "Men");
    setEditSubCategory(product.subCategory || "Topwear");
    setEditBestseller(!!product.bestseller);
    setEditSizes(Array.isArray(product.sizes) ? product.sizes : []);

    let initialAttrs = [];
    if (Array.isArray(product.attributes) && product.attributes.length > 0) {
      initialAttrs = product.attributes;
    } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
      initialAttrs = [{ name: "Size", values: product.sizes }];
    }
    setEditAttributes(initialAttrs);
    setEditVariantLinks(Array.isArray(product.variantImages) ? product.variantImages : []);
    setEditVariantPrices(Array.isArray(product.variantPrices) ? product.variantPrices : []);
    setEditTagInputs({});
    setNewImage1(null);
    setNewImage2(null);
    setEditModalOpen(true);
  };

  const addEditAttributeRow = () => {
    setEditAttributes((prev) => [...prev, { name: "", values: [] }]);
  };

  const removeEditAttributeRow = (idx) => {
    setEditAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  const addEditTagValue = (attrIdx, val) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setEditAttributes((prev) =>
      prev.map((attr, i) => {
        if (i !== attrIdx) return attr;
        if (attr.values.includes(trimmed)) return attr;
        return { ...attr, values: [...attr.values, trimmed] };
      })
    );
    setEditTagInputs((prev) => ({ ...prev, [attrIdx]: "" }));
  };

  const removeEditTagValue = (attrIdx, valIdx) => {
    setEditAttributes((prev) =>
      prev.map((attr, i) => {
        if (i !== attrIdx) return attr;
        return { ...attr, values: attr.values.filter((_, v) => v !== valIdx) };
      })
    );
  };

  const toggleSize = (size) => {
    setEditSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Submit Update Product (CRUD: Update)
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editPrice) {
      toast.error("Product name and price are required");
      return;
    }

    try {
      setSavingEdit(true);
      const formData = new FormData();
      formData.append("id", editingProduct._id);
      formData.append("name", editName.trim());
      formData.append("description", editDescription.trim());
      formData.append("price", editPrice);
      formData.append("discount", editDiscount);
      formData.append("stock", editStock);
      formData.append("category", editCategory);
      formData.append("subCategory", editSubCategory);
      formData.append("bestseller", editBestseller);

      const cleanedAttrs = editAttributes
        .map((a) => ({ name: a.name.trim(), values: a.values }))
        .filter((a) => a.name && a.values.length > 0);
      formData.append("attributes", JSON.stringify(cleanedAttrs));

      const sizeAttr = cleanedAttrs.find((a) => a.name.toLowerCase() === "size" || a.name.toLowerCase() === "sizes");
      formData.append("sizes", JSON.stringify(sizeAttr ? sizeAttr.values : editSizes));

      formData.append("existingImages", JSON.stringify(editingProduct.image || []));
      formData.append("variantImages", JSON.stringify(editVariantLinks));
      formData.append("variantPrices", JSON.stringify(editVariantPrices));

      if (newImage1) formData.append("image1", newImage1);
      if (newImage2) formData.append("image2", newImage2);

      const res = await axios.post(
        backendUrl + "/api/v1/product/update",
        formData,
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success("Product updated successfully!");
        setEditModalOpen(false);
        setEditingProduct(null);
        await fetchList();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update product"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Product (CRUD: Delete)
  const removeProduct = (id, productName) => {
    setProductToDelete({ id, name: productName });
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await axios.post(
        backendUrl + "/api/v1/product/remove",
        { id: productToDelete.id },
        { headers: { token } },
      );

      if (res.data.success) {
        toast.success(res.data.message || "Product deleted successfully");
        await fetchList();
        setProductToDelete(null);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete product",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Dynamic distinct categories, subcategories and stores
  const uniqueCategories = React.useMemo(() => {
    const set = new Set();
    availableCategories.forEach((c) => {
      if (!c.parentCategory && c.name) set.add(c.name);
    });
    list.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [availableCategories, list]);

  const uniqueSubCategories = React.useMemo(() => {
    const set = new Set();
    list.forEach((p) => {
      if (p.subCategory && (categoryFilter === "all" || p.category === categoryFilter)) {
        set.add(p.subCategory);
      }
    });
    return Array.from(set).sort();
  }, [list, categoryFilter]);

  const uniqueStores = React.useMemo(() => {
    const set = new Set();
    list.forEach((p) => {
      if (p.storeName) set.add(p.storeName);
    });
    return Array.from(set).sort();
  }, [list]);

  // Filtered & Sorted Products
  const filteredAndSortedList = React.useMemo(() => {
    const filtered = list.filter((item) => {
      // 1. Text Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(term);
        const matchesCategory = item.category?.toLowerCase().includes(term);
        const matchesSubCategory = item.subCategory?.toLowerCase().includes(term);
        const matchesStore = item.storeName?.toLowerCase().includes(term);
        if (!matchesName && !matchesCategory && !matchesSubCategory && !matchesStore) {
          return false;
        }
      }

      // 2. Category Filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // 3. SubCategory Filter
      if (subCategoryFilter !== "all" && item.subCategory !== subCategoryFilter) {
        return false;
      }

      // 4. Stock Filter
      const currentStock = item.stock !== undefined ? Number(item.stock) : 50;
      if (stockFilter === "in-stock" && currentStock <= 10) return false;
      if (stockFilter === "low-stock" && (currentStock < 1 || currentStock > 10)) return false;
      if (stockFilter === "out-of-stock" && currentStock > 0) return false;

      // 5. Bestseller Filter
      if (bestsellerFilter === "bestseller" && !item.bestseller) return false;
      if (bestsellerFilter === "regular" && item.bestseller) return false;

      // 6. Seller Filter
      if (sellerFilter !== "all" && item.storeName !== sellerFilter) {
        return false;
      }

      // 7. Sale / Discount Filter
      if (saleFilter === "on-sale" && (!item.discount || Number(item.discount) <= 0)) {
        return false;
      }

      // 8. Role Filter
      if (selectedFilter === "my-products" && adminUser?.id) {
        const isOwner =
          item.sellerId === adminUser.id ||
          (item.storeName && adminUser.storeName && item.storeName === adminUser.storeName);
        if (!isOwner) return false;
      }

      return true;
    });

    // Apply Sorting
    return filtered.sort((a, b) => {
      const discountedA = a.discount > 0 ? Math.round(a.price * (1 - a.discount / 100)) : a.price;
      const discountedB = b.discount > 0 ? Math.round(b.price * (1 - b.discount / 100)) : b.price;
      const stockA = a.stock !== undefined ? Number(a.stock) : 50;
      const stockB = b.stock !== undefined ? Number(b.stock) : 50;

      if (sortBy === "date-desc") {
        return (b.date || 0) - (a.date || 0);
      } else if (sortBy === "date-asc") {
        return (a.date || 0) - (b.date || 0);
      } else if (sortBy === "price-asc") {
        return discountedA - discountedB;
      } else if (sortBy === "price-desc") {
        return discountedB - discountedA;
      } else if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "name-desc") {
        return (b.name || "").localeCompare(a.name || "");
      } else if (sortBy === "stock-desc") {
        return stockB - stockA;
      } else if (sortBy === "stock-asc") {
        return stockA - stockB;
      } else if (sortBy === "discount-desc") {
        return (b.discount || 0) - (a.discount || 0);
      }
      return 0;
    });
  }, [list, searchTerm, categoryFilter, subCategoryFilter, stockFilter, bestsellerFilter, sellerFilter, saleFilter, selectedFilter, adminUser, sortBy]);

  // Clickable Header Sorting Helper
  const handleSortClick = (col) => {
    if (col === "name") {
      setSortBy(prev => prev === "name-asc" ? "name-desc" : "name-asc");
    } else if (col === "price") {
      setSortBy(prev => prev === "price-asc" ? "price-desc" : "price-asc");
    } else if (col === "stock") {
      setSortBy(prev => prev === "stock-desc" ? "stock-asc" : "stock-desc");
    }
  };

  const resetAllFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setSubCategoryFilter("all");
    setStockFilter("all");
    setBestsellerFilter("all");
    setSellerFilter("all");
    setSaleFilter("all");
    setSelectedFilter("all");
    setSortBy("date-desc");
  };

  const isFiltered =
    searchTerm.trim() !== "" ||
    categoryFilter !== "all" ||
    subCategoryFilter !== "all" ||
    stockFilter !== "all" ||
    bestsellerFilter !== "all" ||
    sellerFilter !== "all" ||
    saleFilter !== "all" ||
    sortBy !== "date-desc";

  const isSeller = adminUser?.role === "seller";

  // Quick views map onto the stock / sale / bestseller filters
  const viewCounts = useMemo(() => ({
    all: list.length,
    low: list.filter((p) => stockOf(p) >= 1 && stockOf(p) <= LOW_STOCK).length,
    out: list.filter((p) => stockOf(p) <= 0).length,
    sale: list.filter((p) => Number(p.discount) > 0).length,
    bestseller: list.filter((p) => p.bestseller).length,
  }), [list]);

  const activeView =
    stockFilter === "low-stock" ? "low"
      : stockFilter === "out-of-stock" ? "out"
        : saleFilter === "on-sale" ? "sale"
          : bestsellerFilter === "bestseller" ? "bestseller"
            : stockFilter === "all" && saleFilter === "all" && bestsellerFilter === "all" ? "all" : null;

  const applyView = (view) => {
    setStockFilter(view === "low" ? "low-stock" : view === "out" ? "out-of-stock" : "all");
    setSaleFilter(view === "sale" ? "on-sale" : "all");
    setBestsellerFilter(view === "bestseller" ? "bestseller" : "all");
  };

  const views = [
    { key: "all", label: "All" },
    { key: "low", label: "Low stock", tone: "text-status-warning" },
    { key: "out", label: "Out of stock", tone: "text-status-danger" },
    { key: "sale", label: "On sale" },
    { key: "bestseller", label: "Bestsellers" },
  ];

  const selectClass =
    "h-9 pl-3 pr-8 rounded-lg border border-hairline bg-surface text-xs font-medium text-ink-secondary focus:border-accent focus:outline-none cursor-pointer";

  const SortHeader = ({ col, asc, desc, label, align = "left" }) => {
    const active = sortBy === asc || sortBy === desc;
    return (
      <button
        type="button"
        onClick={() => handleSortClick(col)}
        className={`inline-flex items-center gap-1 uppercase tracking-wider cursor-pointer hover:text-ink transition ${
          active ? "text-ink" : ""
        } ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        {active && (sortBy === asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    );
  };

  const colCount = isSeller ? 4 : 5;

  return (
    <div className="pb-16 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Products"
        subtitle={
          isSeller
            ? `Inventory for ${adminUser?.storeName || "your store"}.`
            : "Every product across all sellers — price, stock and performance at a glance."
        }
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products" },
        ]}
        actions={
          <>
            <Link
              href="/reviews"
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-ink-secondary border border-hairline bg-surface hover:bg-canvas-muted transition"
            >
              Reviews
            </Link>
            <Link
              href="/add"
              className="px-4 py-2 rounded-lg text-xs font-medium bg-ink text-canvas hover:opacity-90 transition"
            >
              + Add product
            </Link>
          </>
        }
      />

      {/* Quick views */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-hairline">
        {views.map((v) => {
          const active = activeView === v.key;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => applyView(v.key)}
              className={`relative shrink-0 px-3 py-2.5 text-sm transition cursor-pointer ${
                active ? "text-ink font-medium" : "text-ink-muted hover:text-ink"
              }`}
            >
              {v.label}
              <span className={`ml-1.5 text-xs tabular-nums ${viewCounts[v.key] && v.tone ? v.tone : "text-ink-faint"}`}>
                {viewCounts[v.key]}
              </span>
              {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-ink" />}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchTerm("")}
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-hairline bg-surface text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none transition"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-hairline text-[10px] text-ink-faint font-sans">
            /
          </kbd>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSubCategoryFilter("all");
            }}
            className={selectClass}
          >
            <option value="all">All categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {categoryFilter !== "all" && uniqueSubCategories.length > 0 && (
            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className={selectClass}>
              <option value="all">All sub-categories</option>
              {uniqueSubCategories.map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          )}

          {!isSeller && uniqueStores.length > 1 && (
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className={selectClass}>
              <option value="all">All sellers</option>
              {uniqueStores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="price-asc">Price low → high</option>
            <option value="price-desc">Price high → low</option>
            <option value="stock-asc">Stock low → high</option>
            <option value="stock-desc">Stock high → low</option>
            <option value="discount-desc">Biggest discount</option>
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 inline-flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink hover:bg-canvas-muted transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        <span className="lg:ml-auto text-xs text-ink-muted">
          <span className="font-semibold text-ink tabular-nums">{filteredAndSortedList.length}</span>
          {filteredAndSortedList.length !== list.length && <> of {list.length}</>} products
        </span>
      </div>

      {/* Product table */}
      <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-hairline bg-canvas-subtle text-[11px] font-semibold text-ink-faint select-none">
                <th className="py-2.5 px-5">
                  <SortHeader col="name" asc="name-asc" desc="name-desc" label="Product" />
                </th>
                {!isSeller && <th className="py-2.5 px-4 hidden lg:table-cell uppercase tracking-wider">Seller</th>}
                <th className="py-2.5 px-4 text-right">
                  <SortHeader col="price" asc="price-asc" desc="price-desc" label="Price" align="right" />
                </th>
                <th className="py-2.5 px-4">
                  <SortHeader col="stock" asc="stock-asc" desc="stock-desc" label="Stock" />
                </th>
                <th className="py-2.5 px-5 w-px" aria-label="Actions" />
              </tr>
            </thead>

            <tbody className="divide-y divide-hairline">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-canvas-muted" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-48 rounded bg-canvas-muted" />
                          <div className="h-3 w-28 rounded bg-canvas-muted" />
                        </div>
                      </div>
                    </td>
                    {!isSeller && <td className="px-4 hidden lg:table-cell"><div className="h-3 w-24 rounded bg-canvas-muted" /></td>}
                    <td className="px-4"><div className="h-3.5 w-12 rounded bg-canvas-muted ml-auto" /></td>
                    <td className="px-4"><div className="h-3 w-20 rounded bg-canvas-muted" /></td>
                    <td className="px-5" />
                  </tr>
                ))
              ) : filteredAndSortedList.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-16 text-center">
                    <Package className="w-8 h-8 text-ink-faint mx-auto mb-3 stroke-[1.25]" />
                    <p className="text-sm font-medium text-ink">
                      {list.length ? "No products match these filters" : "No products yet"}
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      {list.length ? "Try a different search or clear the filters." : "Add your first product to get started."}
                    </p>
                    {isFiltered ? (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-4 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-hairline text-ink hover:bg-canvas-muted transition cursor-pointer"
                      >
                        Clear filters
                      </button>
                    ) : !list.length && (
                      <Link href="/add" className="inline-block mt-4 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-ink text-canvas">
                        Add product
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedList.map((item, idx) => {
                  const rawImg = Array.isArray(item.image) ? item.image[0] : item.image;
                  const stock = stockOf(item);
                  const isOwner =
                    adminUser?.role === "admin" ||
                    !item.sellerId ||
                    item.sellerId === adminUser?.id ||
                    (item.storeName && adminUser?.storeName && item.storeName === adminUser.storeName);

                  return (
                    <tr key={item._id || idx} className="group hover:bg-canvas-subtle transition">
                      {/* Product */}
                      <td className="py-3 px-5 max-w-0 w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductThumb src={getImageSrc(rawImg)} alt={item.name} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => openInsightsModal(item)}
                                className="text-sm font-medium text-ink truncate hover:underline underline-offset-2 cursor-pointer text-left"
                                title={item.name}
                              >
                                {item.name}
                              </button>
                              {item.bestseller && (
                                <Star className="w-3.5 h-3.5 shrink-0 fill-accent text-accent" aria-label="Bestseller" />
                              )}
                            </div>
                            <p className="text-xs text-ink-muted truncate">
                              {item.category}
                              {item.subCategory && <span className="text-ink-faint"> / {item.subCategory}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Seller */}
                      {!isSeller && (
                        <td className="px-4 hidden lg:table-cell text-xs text-ink-muted whitespace-nowrap">
                          {item.storeName || "Forever Head Office"}
                        </td>
                      )}

                      {/* Price */}
                      <td className="px-4 text-right whitespace-nowrap">
                        <div className="text-sm font-medium text-ink tabular-nums">
                          {currency}{salePrice(item)}
                        </div>
                        {item.discount > 0 && (
                          <div className="text-[11px] tabular-nums">
                            <span className="text-ink-faint line-through">{currency}{item.price}</span>
                            <span className="ml-1.5 text-status-success font-medium">−{item.discount}%</span>
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-xs">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              stock <= 0 ? "bg-status-danger" : stock <= LOW_STOCK ? "bg-status-warning" : "bg-status-success"
                            }`}
                          />
                          <span
                            className={`tabular-nums ${
                              stock <= 0 ? "text-status-danger font-medium" : stock <= LOW_STOCK ? "text-status-warning font-medium" : "text-ink-secondary"
                            }`}
                          >
                            {stock <= 0 ? "Out of stock" : stock <= LOW_STOCK ? `${stock} left` : stock}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => openInsightsModal(item)}
                            className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-muted transition cursor-pointer"
                            title="Insights"
                            aria-label="Insights"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          {isOwner && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-muted transition cursor-pointer"
                                title="Edit"
                                aria-label="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeProduct(item._id, item.name)}
                                className="p-1.5 rounded-md text-ink-muted hover:text-status-danger hover:bg-status-danger-bg transition cursor-pointer"
                                title="Delete"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
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

      {/* EDIT PRODUCT MODAL (CRUD: Update) */}
      {editModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Product</h3>
                <p className="text-xs text-gray-500">Update product details in your inventory</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Price ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Stock Inventory
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                    placeholder="50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm bg-white"
                  >
                    {availableCategories.filter((c) => !c.parentCategory).length === 0 ? (
                      <option value={editCategory}>{editCategory}</option>
                    ) : (
                      availableCategories
                        .filter((c) => !c.parentCategory)
                        .map((cat) => (
                          <option key={cat._id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Sub-Category
                </label>
                <select
                  value={editSubCategory}
                  onChange={(e) => setEditSubCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm bg-white"
                >
                  {(() => {
                    const selectedCat = availableCategories.find(
                      (c) => c.name.toLowerCase() === (editCategory || '').trim().toLowerCase()
                    );
                    const matchingSubs = availableCategories.filter((sub) => {
                      if (!sub.parentCategory) return false;
                      const parentId = typeof sub.parentCategory === 'object' ? sub.parentCategory?._id : sub.parentCategory;
                      const parentName = typeof sub.parentCategory === 'object' ? sub.parentCategory?.name : null;
                      if (selectedCat && parentId === selectedCat._id) return true;
                      if (parentName && parentName.toLowerCase() === (editCategory || '').trim().toLowerCase()) return true;
                      return false;
                    });

                    if (matchingSubs.length === 0) {
                      return <option value={editSubCategory || 'General'}>{editSubCategory || 'General'}</option>;
                    }

                    return matchingSubs.map((sub) => (
                      <option key={sub._id || sub.name} value={sub.name}>
                        {sub.name}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider">
                    Custom Attributes / Variants
                  </label>
                  <button
                    type="button"
                    onClick={addEditAttributeRow}
                    className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    + Add Attribute
                  </button>
                </div>

                <div className="space-y-2">
                  {editAttributes.map((attr, aIdx) => (
                    <div key={aIdx} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={attr.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditAttributes((prev) =>
                              prev.map((a, i) => (i === aIdx ? { ...a, name: val } : a))
                            );
                          }}
                          placeholder="Attribute name (e.g. Color, Storage, Material)"
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold w-1/2"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditAttributeRow(aIdx)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium cursor-pointer"
                        >
                          &times; Remove
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-white border border-gray-300 rounded min-h-[32px]">
                        {attr.values.map((v, vIdx) => (
                          <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-[11px] font-medium">
                            {v}
                            <button
                              type="button"
                              onClick={() => removeEditTagValue(aIdx, vIdx)}
                              className="text-gray-400 hover:text-red-500 font-bold"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={editTagInputs[aIdx] || ""}
                          onChange={(e) => setEditTagInputs((prev) => ({ ...prev, [aIdx]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              addEditTagValue(aIdx, editTagInputs[aIdx] || "");
                            }
                          }}
                          placeholder="Type option and press Enter"
                          className="flex-1 text-[11px] px-1 py-0.5 outline-none border-0 min-w-[120px]"
                        />
                      </div>
                    </div>
                  ))}
                  {editAttributes.length === 0 && (
                    <p className="text-[11px] text-gray-400 italic">No attributes configured. Click '+ Add Attribute' to add custom options.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <input
                  type="checkbox"
                  id="bestsellerEdit"
                  checked={editBestseller}
                  onChange={(e) => setEditBestseller(e.target.checked)}
                  className="cursor-pointer"
                />
                <label htmlFor="bestsellerEdit" className="cursor-pointer text-gray-700 font-medium">
                  Mark as Bestseller
                </label>
              </div>

              {/* Current Existing Images (with hover zoom) */}
              {editingProduct?.image && editingProduct.image.length > 0 && (
                <div className="pt-2 border-t mt-1">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Current Images (Hover to Zoom)
                  </label>
                  <div className="flex gap-2.5 flex-wrap">
                    {editingProduct.image.map((imgUrl, i) => (
                      <ImageUploadWithZoom
                        key={i}
                        id={`edit-existing-${i}`}
                        file={getImageSrc(imgUrl)}
                        onChange={() => {}}
                        index={i}
                        label={`Existing Image #${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images (Optional with hover zoom) */}
              <div className="pt-2 border-t mt-1">
                <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Add New Images (Optional)
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  <ImageUploadWithZoom
                    id="edit-new-image1"
                    file={newImage1}
                    onChange={(file) => setNewImage1(file)}
                    onRemove={() => setNewImage1(null)}
                    index={0}
                    label="New Image 1"
                  />
                  <ImageUploadWithZoom
                    id="edit-new-image2"
                    file={newImage2}
                    onChange={(file) => setNewImage2(file)}
                    onRemove={() => setNewImage2(null)}
                    index={1}
                    label="New Image 2"
                  />
                </div>
              </div>

              {editAttributes.some((a) => a.name.trim() && a.values.length > 0) && (
                <div className="pt-2 border-t mt-1">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Price per Option
                  </label>
                  <VariantPriceEditor
                    attributes={editAttributes}
                    prices={editVariantPrices}
                    onChange={setEditVariantPrices}
                    basePrice={editPrice}
                    currency={currency || "$"}
                  />
                </div>
              )}

              {editPickerImages.length > 0 && editAttributes.some((a) => a.name.trim() && a.values.length > 0) && (
                <div className="pt-2 border-t mt-1">
                  <label className="block font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Photo per Option
                  </label>
                  <VariantImagePicker
                    attributes={editAttributes}
                    images={editPickerImages}
                    links={editVariantLinks}
                    onChange={setEditVariantLinks}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? "Saving Changes..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DASHBOARD & INSIGHTS MODAL */}
      <ProductDashboardModal
        isOpen={insightsModalOpen}
        onClose={() => setInsightsModalOpen(false)}
        product={insightsProduct}
        token={token}
        backendUrl={backendUrl}
        currency={currency}
        adminUser={adminUser}
        onEditProduct={handleEditFromInsights}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete Catalog Piece"
        description={`Are you sure you want to permanently delete "${productToDelete?.name || 'this piece'}" from the catalog inventory? This action cannot be reversed.`}
        confirmLabel="Delete Piece"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}

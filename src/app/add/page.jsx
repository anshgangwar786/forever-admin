'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { useAdminAuth } from "../../context/AdminAuthContext";
import ImageUploadWithZoom from "../../components/ImageUploadWithZoom";
import VariantImagePicker from "../../components/VariantImagePicker";
import VariantPriceEditor from "../../components/VariantPriceEditor";
import { Button, Badge, PageHeader } from "../../components/ui";
import {
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  ArrowRight,
  Eye,
  Check,
  Tag,
  ShieldAlert,
} from "lucide-react";

const getImageSrc = (img) => (typeof img === "object" && img?.src ? img.src : img);

// Universal Category -> Product Variant & Preset Attribute Mapping
export const CATEGORY_ATTRIBUTE_MAP = {
  "Beauty & Personal Care": {
    badge: "Beauty & Personal Care",
    defaultAttribute: "Volume",
    placeholder: "e.g. 30ml, 50ml, 100ml or Warm Ivory, Natural Beige",
    presets: [
      { label: "+ Volume / Size", name: "Volume" },
      { label: "+ Skin Type", name: "Skin Type" },
      { label: "+ Shade / Tone", name: "Shade" },
      { label: "+ Scent / Fragrance", name: "Fragrance" },
      { label: "+ Formulation", name: "Formulation" },
      { label: "+ Finish", name: "Finish" },
    ],
  },
  "Electronics": {
    badge: "Electronics & Gadgets",
    defaultAttribute: "Storage",
    placeholder: "e.g. 128GB, 256GB, 512GB, 1TB or Midnight Gray",
    presets: [
      { label: "+ Storage", name: "Storage" },
      { label: "+ RAM", name: "RAM" },
      { label: "+ Color", name: "Color" },
      { label: "+ Screen Size", name: "Screen Size" },
      { label: "+ Processor", name: "Processor" },
      { label: "+ Connectivity", name: "Connectivity" },
      { label: "+ Warranty", name: "Warranty" },
    ],
  },
  "Fashion & Apparel": {
    badge: "Fashion & Apparel",
    defaultAttribute: "Size",
    placeholder: "e.g. XS, S, M, L, XL, XXL or Cotton, Silk, Linen",
    presets: [
      { label: "+ Size", name: "Size" },
      { label: "+ Color", name: "Color" },
      { label: "+ Material", name: "Material" },
      { label: "+ Fit", name: "Fit" },
      { label: "+ Gender", name: "Gender" },
      { label: "+ Style", name: "Style" },
    ],
  },
  "Furniture": {
    badge: "Furniture & Decor",
    defaultAttribute: "Dimensions",
    placeholder: "e.g. 72x36x30 in, King, Queen or Solid Oak, Walnut",
    presets: [
      { label: "+ Dimensions", name: "Dimensions" },
      { label: "+ Material", name: "Material" },
      { label: "+ Color / Finish", name: "Color" },
      { label: "+ Finish", name: "Finish" },
      { label: "+ Assembly", name: "Assembly" },
      { label: "+ Room Type", name: "Room Type" },
    ],
  },
  "Home & Kitchen": {
    badge: "Home & Kitchen",
    defaultAttribute: "Capacity",
    placeholder: "e.g. 1.5L, 4Qt, 6-Piece Set or Stainless Steel",
    presets: [
      { label: "+ Capacity", name: "Capacity" },
      { label: "+ Material", name: "Material" },
      { label: "+ Color", name: "Color" },
      { label: "+ Dimensions", name: "Dimensions" },
      { label: "+ Power", name: "Power" },
      { label: "+ Set Size", name: "Set Size" },
    ],
  },
  "Sports & Fitness": {
    badge: "Sports & Fitness",
    defaultAttribute: "Weight",
    placeholder: "e.g. 5kg, 10kg, 20kg, 45 lbs or Light, Medium, Heavy",
    presets: [
      { label: "+ Weight", name: "Weight" },
      { label: "+ Size", name: "Size" },
      { label: "+ Color", name: "Color" },
      { label: "+ Resistance", name: "Resistance" },
      { label: "+ Material", name: "Material" },
    ],
  },
};

const DEFAULT_PRESETS = [
  { label: "+ Color", name: "Color" },
  { label: "+ Size", name: "Size" },
  { label: "+ Material", name: "Material" },
  { label: "+ Dimensions", name: "Dimensions" },
  { label: "+ Storage", name: "Storage" },
  { label: "+ RAM", name: "RAM" },
];

export default function Add() {
  const { token, backendUrl, currency } = useAdminAuth();

  // Images state
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  // Core Product Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState(0);
  const [stock, setStock] = useState(50);
  const [bestseller, setBestseller] = useState(false);

  // Dynamic Categories from API
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [customSubCategory, setCustomSubCategory] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(true);

  // Dynamic Product Variants / Attributes
  const [attributes, setAttributes] = useState([
    { name: "Color", values: [] },
  ]);
  const [tagInputs, setTagInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [variantLinks, setVariantLinks] = useState([]);
  const [variantPrices, setVariantPrices] = useState([]);

  // Uploaded files as picker options; refs are resolved to Cloudinary URLs by the backend
  const variantPickerImages = useMemo(
    () =>
      [image1, image2, image3, image4]
        .map((file, i) => ({ file, slot: `image${i + 1}` }))
        .filter(({ file }) => file)
        .map(({ file, slot }, i) => ({
          ref: `upload:${slot}`,
          src: typeof file === "string" ? file : URL.createObjectURL(file),
          label: `Image ${i + 1}`,
        })),
    [image1, image2, image3, image4]
  );

  useEffect(
    () => () => variantPickerImages.forEach((img) => img.src.startsWith("blob:") && URL.revokeObjectURL(img.src)),
    [variantPickerImages]
  );

  // Fetch dynamic categories from backend API
  const fetchCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);
      const res = await axios.get(backendUrl + "/api/v1/category");
      if (res.data.success && Array.isArray(res.data.data)) {
        const allItems = res.data.data;
        const mainCats = allItems.filter((item) => !item.parentCategory);
        const subCats = allItems.filter((item) => Boolean(item.parentCategory));

        setCategoriesList(mainCats);
        setSubCategoriesList(subCats);

        setCategory((prev) => {
          if (prev) return prev;
          return mainCats.length > 0 ? mainCats[0].name : "";
        });
      }
    } catch (err) {
      console.warn("Failed to load categories from API:", err.message);
    } finally {
      setCategoryLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Dynamically filter subcategories based on chosen category
  const filteredSubCategories = useMemo(() => {
    if (!category || category === "__custom__") return [];

    const selectedCat = categoriesList.find(
      (c) => c.name.toLowerCase() === category.trim().toLowerCase()
    );

    return subCategoriesList.filter((sub) => {
      const parentId = typeof sub.parentCategory === "object" ? sub.parentCategory?._id : sub.parentCategory;
      const parentName = typeof sub.parentCategory === "object" ? sub.parentCategory?.name : null;

      if (selectedCat && String(parentId) === String(selectedCat._id)) return true;
      if (parentName && parentName.toLowerCase() === category.trim().toLowerCase()) return true;
      return false;
    });
  }, [category, categoriesList, subCategoriesList]);

  // Update default subcategory when category changes
  useEffect(() => {
    if (filteredSubCategories.length > 0) {
      setSubCategory(filteredSubCategories[0].name);
    } else {
      setSubCategory("General");
    }
  }, [category, filteredSubCategories]);

  // Attribute Management Helpers
  const addAttributeRow = (initialName = "") => {
    setAttributes((prev) => [...prev, { name: initialName, values: [] }]);
  };

  const removeAttributeRow = (index) => {
    setAttributes((prev) => prev.filter((_, idx) => idx !== index));
    setTagInputs((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handleAttributeNameChange = (index, newName) => {
    setAttributes((prev) =>
      prev.map((attr, idx) => (idx === index ? { ...attr, name: newName } : attr))
    );
  };

  const addTagValue = (attrIndex, rawValue) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;

    setAttributes((prev) =>
      prev.map((attr, idx) => {
        if (idx !== attrIndex) return attr;
        if (attr.values.includes(trimmed)) return attr;
        return { ...attr, values: [...attr.values, trimmed] };
      })
    );

    setTagInputs((prev) => ({ ...prev, [attrIndex]: "" }));
  };

  const removeTagValue = (attrIndex, valIndex) => {
    setAttributes((prev) =>
      prev.map((attr, idx) => {
        if (idx !== attrIndex) return attr;
        return {
          ...attr,
          values: attr.values.filter((_, vIdx) => vIdx !== valIndex),
        };
      })
    );
  };

  const handleTagKeyDown = (e, attrIndex) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagValue(attrIndex, tagInputs[attrIndex] || "");
    }
  };

  // Category-specific presets and mappings
  const activeCategoryConfig = useMemo(() => {
    return CATEGORY_ATTRIBUTE_MAP[category] || null;
  }, [category]);

  const activePresets = useMemo(() => {
    return activeCategoryConfig?.presets || DEFAULT_PRESETS;
  }, [activeCategoryConfig]);

  useEffect(() => {
    if (!category || category === "__custom__") return;
    const defaultKey = activeCategoryConfig?.defaultAttribute || "Color";
    setAttributes((prev) => {
      if (prev.length === 1 && prev[0].values.length === 0) {
        return [{ name: defaultKey, values: [] }];
      }
      return prev;
    });
  }, [category, activeCategoryConfig]);

  const handleQuickAddPreset = (presetName) => {
    const existing = attributes.find(
      (a) => a.name.toLowerCase() === presetName.toLowerCase()
    );
    if (!existing) {
      addAttributeRow(presetName);
      toast.success(`Added attribute '${presetName}'`);
    } else {
      toast.info(`Attribute '${presetName}' is already added.`);
    }
  };

  // Hover magnifier state for the live storefront preview
  const [previewZoom, setPreviewZoom] = useState({ active: false, x: 50, y: 50 });

  // Live preview image URL helper
  const previewImageSrc = useMemo(() => {
    const primary = image1 || image2 || image3 || image4;
    if (!primary) return null;
    if (typeof primary === "string") return primary;
    if (typeof primary === "object" && primary.src) return primary.src;
    try {
      return URL.createObjectURL(primary);
    } catch {
      return null;
    }
  }, [image1, image2, image3, image4]);

  // Form Submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!image1 && !image2 && !image3 && !image4) {
      toast.error("Please upload at least one product image.");
      return;
    }

    const finalCategory =
      category === "__custom__" ? customCategory.trim() : category.trim();
    const finalSubCategory =
      subCategory === "__custom__"
        ? customSubCategory.trim()
        : subCategory.trim() || "General";

    if (!finalCategory) {
      toast.error("Product category is required.");
      return;
    }

    // Clean attributes payload
    const cleanedAttributes = attributes
      .map((attr) => ({
        name: attr.name.trim(),
        values: attr.values.map((v) => v.trim()).filter(Boolean),
      }))
      .filter((attr) => attr.name && attr.values.length > 0);

    const sizeAttr = cleanedAttributes.find(
      (a) => a.name.toLowerCase() === "size" || a.name.toLowerCase() === "sizes"
    );
    const legacySizes = sizeAttr ? sizeAttr.values : [];

    try {
      setSubmitting(true);
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("price", price);
      formData.append("discount", discount);
      formData.append("stock", stock);
      formData.append("category", finalCategory);
      formData.append("subCategory", finalSubCategory);
      formData.append("bestseller", bestseller);

      formData.append("attributes", JSON.stringify(cleanedAttributes));
      formData.append("sizes", JSON.stringify(legacySizes));
      formData.append("variantImages", JSON.stringify(variantLinks));
      formData.append("variantPrices", JSON.stringify(variantPrices));

      if (image1) formData.append("image1", image1);
      if (image2) formData.append("image2", image2);
      if (image3) formData.append("image3", image3);
      if (image4) formData.append("image4", image4);

      const res = await axios.post(
        backendUrl + "/api/v1/product/add",
        formData,
        { headers: { token } }
      );

      if (res.data.success) {
        toast.success(res.data.message || "Product added successfully!");

        // Reset form
        setName("");
        setDescription("");
        setPrice("");
        setDiscount(0);
        setStock(50);
        setBestseller(false);
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setAttributes([{ name: "Color", values: [] }]);
        setVariantLinks([]);
        setVariantPrices([]);
        setCustomCategory("");
        setCustomSubCategory("");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to publish product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const finalCalculatedPrice = useMemo(() => {
    const numPrice = Number(price) || 0;
    const numDisc = Number(discount) || 0;
    if (numDisc > 0) {
      return Math.round(numPrice * (1 - numDisc / 100));
    }
    return numPrice;
  }, [price, discount]);

  return (
    <div className="w-full max-w-full min-w-0 space-y-6 pb-20">
      {/* Page Header */}
      <PageHeader
        title="Add New Piece to Collection"
        subtitle="Publish bespoke catalog products with tailored attributes, sizing options, and editorial imagery."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Catalog", href: "/list" },
          { label: "Add Product" },
        ]}
        actions={
          <Button
            type="submit"
            form="add-product-form"
            variant="primary"
            size="md"
            disabled={submitting}
            loading={submitting}
            className="hidden sm:inline-flex"
          >
            Publish Piece
          </Button>
        }
      />

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details (7 cols) */}
        <form
          id="add-product-form"
          onSubmit={onSubmitHandler}
          className="lg:col-span-7 space-y-6"
        >
          {/* 1. IMAGE UPLOAD GRID WITH HOVER ZOOM & LIGHTBOX */}
          <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-[#E7E3D9] dark:border-[#292524] pb-3">
              <div>
                <h3 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5]">
                  Editorial Lookbook &amp; Imagery
                </h3>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                  Upload up to 4 high-resolution catalog photos. First image serves as primary visual.
                </p>
              </div>
              {(image1 || image2 || image3 || image4) && (
                <Badge variant="accent" size="sm" className="hidden sm:inline-flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57] animate-pulse"></span>
                  Zoom active
                </Badge>
              )}
            </div>

            <div className="flex gap-3 flex-wrap">
              <ImageUploadWithZoom
                id="image1"
                file={image1}
                onChange={(file) => setImage1(file)}
                onRemove={() => setImage1(false)}
                placeholderSrc={assets.upload_area}
                label="Image 1 (Main)"
                index={0}
              />
              <ImageUploadWithZoom
                id="image2"
                file={image2}
                onChange={(file) => setImage2(file)}
                onRemove={() => setImage2(false)}
                placeholderSrc={assets.upload_area}
                label="Image 2"
                index={1}
              />
              <ImageUploadWithZoom
                id="image3"
                file={image3}
                onChange={(file) => setImage3(file)}
                onRemove={() => setImage3(false)}
                placeholderSrc={assets.upload_area}
                label="Image 3"
                index={2}
              />
              <ImageUploadWithZoom
                id="image4"
                file={image4}
                onChange={(file) => setImage4(file)}
                onRemove={() => setImage4(false)}
                placeholderSrc={assets.upload_area}
                label="Image 4"
                index={3}
              />
            </div>
          </div>

          {/* 2. CORE DETAILS: NAME & DESCRIPTION */}
          <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                Piece Title <span className="text-[#8E2824]">*</span>
              </label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full px-3.5 py-2.5 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs sm:text-sm bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none transition"
                type="text"
                placeholder="e.g. Rosewood & Bergamot Eau de Parfum (100ml)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                Piece Narrative &amp; Description <span className="text-[#8E2824]">*</span>
              </label>
              <textarea
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                className="w-full px-3.5 py-2.5 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs sm:text-sm bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none transition h-24"
                placeholder="Describe silhouette, conscious natural fibers, atelier tailoring notes, and care instructions..."
                required
              />
            </div>
          </div>

          {/* 3. DYNAMIC CATEGORIES & PRICING STRIP */}
          <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
              {/* Category */}
              <div className="sm:col-span-1 md:col-span-1">
                <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                  Category <span className="text-[#8E2824]">*</span>
                </label>
                <select
                  onChange={(e) => setCategory(e.target.value)}
                  value={category}
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none font-medium cursor-pointer"
                  required
                >
                  {categoryLoading ? (
                    <option value="">Loading categories...</option>
                  ) : (
                    categoriesList.map((cat) => (
                      <option key={cat._id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  )}
                  <option value="__custom__">+ Custom Category...</option>
                </select>
              </div>

              {/* Sub-Category */}
              <div className="sm:col-span-1 md:col-span-1">
                <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                  Sub-Category
                </label>
                <select
                  onChange={(e) => setSubCategory(e.target.value)}
                  value={subCategory}
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none font-medium cursor-pointer"
                >
                  {filteredSubCategories.length === 0 ? (
                    <option value="General">General</option>
                  ) : (
                    filteredSubCategories.map((sub) => (
                      <option key={sub._id || sub.name} value={sub.name}>
                        {sub.name}
                      </option>
                    ))
                  )}
                  <option value="__custom__">+ Custom Sub-Category...</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                  Price ({currency || '$'}) <span className="text-[#8E2824]">*</span>
                </label>
                <input
                  onChange={(e) => setPrice(e.target.value)}
                  value={price}
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none font-medium"
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="180.00"
                  required
                />
              </div>

              {/* Discount (%) */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                  Discount (%)
                </label>
                <input
                  onChange={(e) =>
                    setDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  value={discount}
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] mb-1.5">
                  Stock Units <span className="text-[#8E2824]">*</span>
                </label>
                <input
                  onChange={(e) =>
                    setStock(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  value={stock}
                  className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none font-medium"
                  type="number"
                  min="0"
                  placeholder="50"
                  required
                />
              </div>
            </div>

            {/* Custom Category Write-In Fields */}
            {(category === "__custom__" || subCategory === "__custom__") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E7E3D9] dark:border-[#292524]">
                {category === "__custom__" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#78716C] dark:text-[#A8A29E] mb-1">
                      Custom Category Name
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Outerwear, Fine Jewelry"
                      className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                      required
                    />
                  </div>
                )}
                {subCategory === "__custom__" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#78716C] dark:text-[#A8A29E] mb-1">
                      Custom Sub-Category Name
                    </label>
                    <input
                      type="text"
                      value={customSubCategory}
                      onChange={(e) => setCustomSubCategory(e.target.value)}
                      placeholder="e.g. Trench Coats, Cashmere Knits"
                      className="w-full px-3 py-2 border border-[#E7E3D9] dark:border-[#292524] rounded-lg text-xs bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. DYNAMIC PRODUCT VARIANTS & ATTRIBUTES SECTION */}
          <div className="bg-white dark:bg-[#1C1917] p-5 sm:p-6 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E3D9] dark:border-[#292524] pb-3">
              <div>
                <h3 className="font-serif text-sm font-medium text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">
                  Variants &amp; Bespoke Attributes
                </h3>
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                  Define options buyers can select (e.g. Size, Color, Fabric, Finish, Dimensions).
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-semibold mr-1">
                  Presets:
                </span>
                {activePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleQuickAddPreset(preset.name)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] hover:border-[#B08D57] text-[#44403C] dark:text-[#D6D3D1] transition cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attributes List */}
            {attributes.length === 0 ? (
              <div className="py-6 text-center border-2 border-dashed border-[#E7E3D9] dark:border-[#292524] rounded-xl bg-[#FAF8F5] dark:bg-[#161413]">
                <p className="text-xs text-[#78716C] dark:text-[#A8A29E] font-medium">
                  No variant attributes added yet. Click below or use a preset to add options.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {attributes.map((attr, attrIdx) => (
                  <div
                    key={attrIdx}
                    className="p-4 bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] rounded-lg space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 max-w-xs">
                        <span className="text-[10px] font-semibold text-[#78716C] dark:text-[#A8A29E] uppercase tracking-wider">
                          Key:
                        </span>
                        <input
                          type="text"
                          value={attr.name}
                          onChange={(e) =>
                            handleAttributeNameChange(attrIdx, e.target.value)
                          }
                          placeholder="e.g. Size, Color, Material"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-md text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5] focus:border-[#B08D57] outline-none"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttributeRow(attrIdx)}
                        className="text-xs text-[#8E2824] hover:bg-[#FAECEB] dark:hover:bg-[#3D1A18] px-2 py-1 rounded transition font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Tag-Style Values Container */}
                    <div>
                      <label className="block text-[11px] font-medium text-[#78716C] dark:text-[#A8A29E] mb-1.5">
                        Values / Options (Press <kbd className="bg-white dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#38332E] px-1 rounded text-[10px]">Enter</kbd> or <kbd className="bg-white dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#38332E] px-1 rounded text-[10px]">,</kbd> to add):
                      </label>

                      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-md min-h-[42px]">
                        {attr.values.map((val, valIdx) => (
                          <span
                            key={valIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F1EA] dark:bg-[#252220] border border-[#E7E3D9] dark:border-[#292524] text-[#1C1917] dark:text-[#FAF8F5] text-xs font-medium rounded-md shadow-2xs"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => removeTagValue(attrIdx, valIdx)}
                              className="text-[#78716C] hover:text-[#8E2824] font-bold text-xs cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        ))}

                        <input
                          type="text"
                          value={tagInputs[attrIdx] || ""}
                          onChange={(e) =>
                            setTagInputs((prev) => ({
                              ...prev,
                              [attrIdx]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => handleTagKeyDown(e, attrIdx)}
                          placeholder={
                            attr.values.length === 0
                              ? (activeCategoryConfig?.placeholder || "Type option and press Enter")
                              : "Add more..."
                          }
                          className="flex-1 min-w-[140px] text-xs py-1 px-1.5 outline-none border-0 text-[#1C1917] dark:text-[#FAF8F5] placeholder-[#A8A29E] bg-transparent"
                        />

                        {tagInputs[attrIdx]?.trim() && (
                          <button
                            type="button"
                            onClick={() =>
                              addTagValue(attrIdx, tagInputs[attrIdx] || "")
                            }
                            className="px-2.5 py-0.5 bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] rounded text-[10px] font-semibold hover:opacity-90 transition cursor-pointer"
                          >
                            + Add Tag
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addAttributeRow("")}
            >
              + Add Another Attribute
            </Button>

            {attributes.some((a) => a.name.trim() && a.values.length > 0) && (
              <div className="pt-4 border-t border-[#E7E3D9] dark:border-[#292524] space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] dark:text-[#FAF8F5]">
                  Price per Option
                </h4>
                <VariantPriceEditor
                  attributes={attributes}
                  prices={variantPrices}
                  onChange={setVariantPrices}
                  basePrice={price}
                />
              </div>
            )}

            {variantPickerImages.length > 0 && attributes.some((a) => a.name.trim() && a.values.length > 0) && (
              <div className="pt-4 border-t border-[#E7E3D9] dark:border-[#292524] space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917] dark:text-[#FAF8F5]">
                  Photo per Option
                </h4>
                <VariantImagePicker
                  attributes={attributes}
                  images={variantPickerImages}
                  links={variantLinks}
                  onChange={setVariantLinks}
                />
              </div>
            )}
          </div>

          {/* 5. BESTSELLER FEATURE CHECKBOX */}
          <div className="bg-white dark:bg-[#1C1917] p-4 rounded-xl border border-[#E7E3D9] dark:border-[#292524] shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                onChange={() => setBestseller((prev) => !prev)}
                checked={bestseller}
                type="checkbox"
                id="bestseller"
                className="w-4 h-4 rounded border-[#E7E3D9] text-[#B08D57] focus:ring-[#B08D57] cursor-pointer"
              />
              <label htmlFor="bestseller" className="cursor-pointer text-xs font-semibold text-[#1C1917] dark:text-[#FAF8F5]">
                Feature as Atelier Signature / Bestseller
              </label>
            </div>
            <Sparkles className="w-4 h-4 text-[#B08D57]" />
          </div>

          {/* Mobile Submit Button */}
          <div className="sm:hidden pt-2">
            <Button
              type="submit"
              disabled={submitting}
              loading={submitting}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Publish Piece
            </Button>
          </div>
        </form>

        {/* Right Column: Live Storefront Preview Card (5 cols, Sticky) */}
        <div className="lg:col-span-5 sticky top-[80px] space-y-4">
          <div className="flex items-center justify-between text-xs text-[#78716C] dark:text-[#A8A29E]">
            <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#B08D57]" />
              Live Storefront Preview
            </span>
            <Badge variant="accent" size="sm">Client View</Badge>
          </div>

          {/* Customer Product Card Preview */}
          <div className="bg-white dark:bg-[#1C1917] border border-[#E7E3D9] dark:border-[#292524] rounded-2xl p-4 sm:p-5 shadow-luxury space-y-4">
            {/* Image Preview Box */}
            <div
              onMouseEnter={() => previewImageSrc && setPreviewZoom((z) => ({ ...z, active: true }))}
              onMouseLeave={() => setPreviewZoom((z) => ({ ...z, active: false }))}
              onMouseMove={(e) => {
                if (!previewImageSrc) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                setPreviewZoom({ active: true, x, y });
              }}
              className={`relative w-full aspect-square rounded-xl bg-[#FAF8F5] dark:bg-[#161413] border border-[#E7E3D9] dark:border-[#292524] overflow-hidden flex items-center justify-center ${
                previewImageSrc ? "cursor-zoom-in" : ""
              }`}
            >
              {previewImageSrc ? (
                <>
                  <img
                    src={previewImageSrc}
                    alt={name || "Preview"}
                    className="w-full h-full object-contain p-2 transition-transform duration-150 ease-out"
                    style={{
                      transform: previewZoom.active ? "scale(2.5)" : "scale(1)",
                      transformOrigin: `${previewZoom.x}% ${previewZoom.y}%`,
                    }}
                  />
                  {!previewZoom.active && (
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2.5 py-1 rounded-full bg-black/60 text-white pointer-events-none">
                      Hover to zoom
                    </span>
                  )}
                </>
              ) : (
                <div className="text-center p-6 space-y-2 text-[#A8A29E]">
                  <Package className="w-12 h-12 mx-auto stroke-[1.2]" />
                  <p className="text-xs">Upload images to preview customer thumbnail</p>
                </div>
              )}

              {/* Bestseller Badge */}
              {bestseller && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                    Bestseller
                  </span>
                </div>
              )}

              {/* Stock Pill */}
              <div className="absolute top-3 right-3">
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  stock <= 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : stock <= 5
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                  {stock <= 0 ? "Out of Stock" : stock <= 5 ? `Low Stock (${stock})` : `${stock} in stock`}
                </span>
              </div>
            </div>

            {/* Product Meta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                <span>{category || "Uncategorized"}{subCategory ? ` / ${subCategory}` : ""}</span>
                <span className="font-serif italic text-xs text-[#B08D57]">Vellora Atelier</span>
              </div>

              <h4 className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#FAF8F5] leading-snug line-clamp-2">
                {name.trim() || "Untitled Luxury Piece"}
              </h4>

              <p className="text-xs text-[#78716C] dark:text-[#A8A29E] line-clamp-2 leading-relaxed">
                {description.trim() || "Piece narrative and material details will render here..."}
              </p>

              {/* Price & Discount */}
              <div className="pt-2 flex items-baseline gap-2">
                <span className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#FAF8F5]">
                  {currency || '$'}{finalCalculatedPrice.toLocaleString()}
                </span>
                {Number(discount) > 0 && Number(price) > 0 && (
                  <>
                    <span className="text-xs text-[#A8A29E] line-through">
                      {currency || '$'}{Number(price).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-[#2E5A36] bg-[#EBF3EC] px-1.5 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Live Attribute Variants preview */}
              {attributes.some((a) => a.values.length > 0) && (
                <div className="pt-2 space-y-1.5 border-t border-[#E7E3D9] dark:border-[#292524]">
                  {attributes.map((attr, idx) => (
                    attr.values.length > 0 && (
                      <div key={idx} className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">{attr.name || "Option"}:</span>
                        {attr.values.map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className="px-2 py-0.5 rounded-md border border-[#E7E3D9] dark:border-[#292524] text-[11px] font-medium bg-[#FAF8F5] dark:bg-[#161413] text-[#1C1917] dark:text-[#FAF8F5]"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    )
                  ))}
                </div>
              )}

              {/* Mock Add to Bag Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-lg bg-[#1C1917] text-white dark:bg-[#FAF8F5] dark:text-[#1C1917] text-xs font-semibold flex items-center justify-center gap-2 opacity-90 cursor-not-allowed"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Preview Storefront Action</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

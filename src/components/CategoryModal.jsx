'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../context/AdminAuthContext';
import { X, Sparkles, Folder, Tag, Check, RefreshCw } from 'lucide-react';

/**
 * Utility helper to slugify strings in real-time
 */
const slugifyText = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Curated luxury & retail emoji palettes
const EMOJI_PALETTES = [
  {
    name: 'Retail & Luxury',
    emojis: ['✨', '💎', '👑', '🏷️', '📦', '🛍️', '🎁', '⚜️', '⭐', '🕊️']
  },
  {
    name: 'Fashion & Apparel',
    emojis: ['👗', '👔', '👠', '👟', '👜', '💄', '🧴', '💅', '🕶️', '💍']
  },
  {
    name: 'Electronics & Tech',
    emojis: ['💻', '📱', '🎧', '⌚', '📷', '🎮', '⌨️', '🔌', '🖥️', '🔊']
  },
  {
    name: 'Home & Living',
    emojis: ['🛋️', '🍳', '☕', '🍽️', '🛏️', '🪴', '🕯️', '🏠', '🧹', '🧊']
  },
  {
    name: 'Sports & Fitness',
    emojis: ['🏋️', '🧘', '🏃', '⚽', '🎾', '🚴', '🥊', '🧗', '🛹', '🏆']
  }
];

export default function CategoryModal({
  isOpen,
  onClose,
  category = null,
  allCategories = [],
  onSaved,
  onSuccess
}) {
  const { backendUrl, token } = useAdminAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [categoryType, setCategoryType] = useState('primary'); // 'primary' | 'sub'
  const [parentCategory, setParentCategory] = useState('');
  const [emoji, setEmoji] = useState('');
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = Boolean(category && category._id);

  // Sync state when drawer opens or category target changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setName(category.name || '');
        setSlug(category.slug || '');
        // Prefilled create (parent only) still auto-generates the slug
        setIsSlugManuallyEdited(Boolean(category.slug));
        const pId =
          typeof category.parentCategory === 'object' && category.parentCategory?._id
            ? category.parentCategory._id
            : category.parentCategory || '';
        setParentCategory(pId);
        setCategoryType(pId ? 'sub' : 'primary');
        setEmoji(category.emoji || '');
        setDescription(category.description || '');
        setImage(category.image || '');
      } else {
        setName('');
        setSlug('');
        setIsSlugManuallyEdited(false);
        setCategoryType('primary');
        setParentCategory('');
        setEmoji('');
        setDescription('');
        setImage('');
      }
      setErrorMsg('');
    }
  }, [isOpen, category]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time slug auto-generation as user types the name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugifyText(val));
    }
  };

  const handleSlugChange = (e) => {
    setSlug(slugifyText(e.target.value));
    setIsSlugManuallyEdited(true);
  };

  const handleResetSlug = () => {
    setSlug(slugifyText(name));
    setIsSlugManuallyEdited(false);
  };

  // Filter available parent categories to prevent circular references:
  const availableParents = allCategories.filter((cat) => {
    if (!isEditing) {
      return !cat.parentCategory;
    }
    // Cannot select self
    if (cat._id === category._id) return false;
    // Cannot select direct child sub-categories
    const catParentId = typeof cat.parentCategory === 'object' ? cat.parentCategory?._id : cat.parentCategory;
    if (catParentId === category._id) return false;
    return !cat.parentCategory;
  });

  const handleSelectEmoji = (selected) => {
    setEmoji(selected);
  };

  const handleEmojiInputChange = (e) => {
    const val = e.target.value.trim();
    // Keep the last full grapheme so multi-codepoint emoji (ZWJ sequences, flags, skin tones) stay intact
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const graphemes = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(val), (s) => s.segment);
      setEmoji(graphemes[graphemes.length - 1] || '');
    } else {
      setEmoji(Array.from(val).slice(0, 2).join(''));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    if (categoryType === 'sub' && !parentCategory) {
      setErrorMsg('Please select a parent category for this subcategory.');
      return;
    }

    const finalSlug = slug.trim() || slugifyText(name);
    if (!finalSlug) {
      setErrorMsg('A valid slug is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        name: name.trim(),
        slug: finalSlug,
        parentCategory: categoryType === 'sub' ? parentCategory : null,
        emoji: emoji.trim(),
        description: description.trim(),
        image: image.trim()
      };

      let res;
      if (isEditing) {
        res = await axios.put(`${backendUrl}/api/v1/category/${category._id}`, payload, {
          headers: token ? { token } : {}
        });
      } else {
        res = await axios.post(`${backendUrl}/api/v1/category`, payload, {
          headers: token ? { token } : {}
        });
      }

      if (res.data.success) {
        const savedData = res.data.data;
        toast.success(
          isEditing ? `Category '${name}' updated successfully` : `Category '${name}' created successfully`
        );
        if (onSuccess) onSuccess(savedData);
        if (onSaved) onSaved(savedData);
        onClose();
      } else {
        setErrorMsg(res.data.message || 'Operation failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-200">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-[#1C1917] shadow-2xl flex flex-col justify-between overflow-hidden z-10 border-l border-gray-200 dark:border-neutral-800 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-[#FAF8F5] dark:bg-[#1C1917]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B08D57]" />
              <h2 className="font-serif text-xl font-normal text-[#1C1917] dark:text-[#FAF8F5] tracking-tight">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h2>
            </div>
            <p className="text-xs text-[#78716C] dark:text-neutral-400 mt-1 font-sans">
              {isEditing
                ? 'Update taxonomy attributes, emoji, or parent nesting'
                : 'Configure a primary department or nested sub-category for your atelier catalog'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <form id="category-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <span className="font-bold">&times;</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Category Level Hierarchy Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
              Taxonomy Hierarchy Level <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setCategoryType('primary');
                  setParentCategory('');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  categoryType === 'primary'
                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs border border-gray-200/80 dark:border-neutral-700'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Primary Department</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategoryType('sub');
                  if (!parentCategory && availableParents.length > 0) {
                    setParentCategory(availableParents[0]._id);
                  }
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  categoryType === 'sub'
                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs border border-gray-200/80 dark:border-neutral-700'
                    : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Nested Sub-Category</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1.5">
              {categoryType === 'primary'
                ? 'Sits at the catalog root as a top-level collection department.'
                : 'Nests hierarchically under an existing primary department in the tree-table.'}
            </p>
          </div>

          {/* 2. Parent Category Dropdown (if Sub-Category) */}
          {categoryType === 'sub' && (
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-gray-800 dark:text-neutral-200 uppercase tracking-wider">
                Choose Parent Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={parentCategory}
                onChange={(e) => setParentCategory(e.target.value)}
                required={categoryType === 'sub'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg text-xs font-medium bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none transition cursor-pointer"
              >
                <option value="">— Select Primary Parent Department —</option>
                {availableParents.map((parent) => (
                  <option key={parent._id} value={parent._id}>
                    {parent.emoji || '📁'} {parent.name} (/{parent.slug})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                This item will appear nested with an indent under{' '}
                <strong>
                  {availableParents.find((p) => p._id === parentCategory)?.name || 'the selected parent'}
                </strong>
                .
              </p>
            </div>
          )}

          {/* 3. Category Name Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Fine Fragrances, Audio & Acoustics, Cashmere"
              className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-xl text-sm font-medium bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none transition"
            />
          </div>

          {/* 4. Emoji Integration: Quick-Picker & Validated Input */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Category Icon / Emoji
              </label>
              {emoji && (
                <button
                  type="button"
                  onClick={() => setEmoji('')}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer"
                >
                  Clear Emoji
                </button>
              )}
            </div>

            {/* Live Emoji Preview Badge */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 flex items-center justify-center text-xl shadow-xs shrink-0 select-none">
                {emoji || (categoryType === 'primary' ? '📁' : '🏷️')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 dark:text-neutral-100 truncate flex items-center gap-1.5">
                  <span>{name || 'Category Preview'}</span>
                  {emoji && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-neutral-400 truncate">
                  {emoji
                    ? `Selected Emoji: "${emoji}" replaces the default folder icon`
                    : 'Using default folder/tag icon in tree-table'}
                </div>
              </div>
              {/* Single-character Emoji Input Box */}
              <div className="w-24 shrink-0">
                <input
                  type="text"
                  value={emoji}
                  onChange={handleEmojiInputChange}
                  placeholder="Paste e.g. 💄"
                  title="Type or paste any single emoji (Win + . or Ctrl + Cmd + Space opens the emoji keyboard)"
                  className="w-full text-center px-2 py-1.5 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:border-black dark:focus:border-white focus:outline-none"
                />
              </div>
            </div>

            {/* Emoji Palettes Grid */}
            <div className="border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
              <div className="flex border-b border-gray-100 dark:border-neutral-800 overflow-x-auto text-[11px] font-medium bg-gray-50/60 dark:bg-neutral-900">
                {EMOJI_PALETTES.map((palette, idx) => (
                  <button
                    key={palette.name}
                    type="button"
                    onClick={() => setActiveEmojiTab(idx)}
                    className={`px-3 py-2 shrink-0 transition cursor-pointer ${
                      activeEmojiTab === idx
                        ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-semibold border-b-2 border-black dark:border-white'
                        : 'text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {palette.name}
                  </button>
                ))}
              </div>
              <div className="p-3 flex items-center gap-2 flex-wrap">
                {EMOJI_PALETTES[activeEmojiTab].emojis.map((eChar) => (
                  <button
                    key={eChar}
                    type="button"
                    onClick={() => handleSelectEmoji(eChar)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition cursor-pointer select-none ${
                      emoji === eChar
                        ? 'bg-[#FAF8F5] dark:bg-neutral-800 border-2 border-[#B08D57] shadow-xs scale-105'
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-800 border border-transparent'
                    }`}
                    title={`Select ${eChar}`}
                  >
                    {eChar}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Slug Field (Auto-generated with manual override) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Slug (URL Identifier) <span className="text-rose-500">*</span>
              </label>
              {isSlugManuallyEdited && (
                <button
                  type="button"
                  onClick={handleResetSlug}
                  className="text-[11px] text-[#B08D57] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate from Name</span>
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-gray-400 dark:text-neutral-500 font-mono select-none">/</span>
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="category-slug"
                className="w-full pl-6 pr-3.5 py-2 border border-gray-300 dark:border-neutral-700 rounded-xl text-xs font-mono bg-gray-50/60 dark:bg-neutral-900 text-gray-800 dark:text-neutral-200 focus:bg-white dark:focus:bg-neutral-800 focus:border-black dark:focus:border-white focus:outline-none transition"
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">
              URL-friendly permalink for storefront filtering and routing.
            </p>
          </div>

          {/* 6. Description Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description for catalog taxonomy and navigation..."
              className="w-full px-3.5 py-2 border border-gray-300 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none transition resize-none"
            />
          </div>

          {/* 7. Image / Asset URL Field (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Image / Banner Asset URL (Optional)
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://... image URL"
              className="w-full px-3.5 py-2 border border-gray-300 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100 focus:border-black dark:focus:border-white focus:outline-none transition"
            />
          </div>
        </form>

        {/* Drawer Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800 bg-[#FAF8F5] dark:bg-[#1C1917] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-drawer-form"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#1C1917] dark:bg-neutral-100 dark:text-[#1C1917] hover:bg-[#292524] rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {submitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{submitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAdminAuth } from '../../context/AdminAuthContext';
import CategoryModal from '../../components/CategoryModal';
import { Button, EmptyState, ConfirmDialog, PageHeader } from '../../components/ui';

const getParentId = (cat) =>
  cat?.parentCategory && typeof cat.parentCategory === 'object' ? cat.parentCategory._id : cat?.parentCategory || null;

const UNASSIGNED = '__unassigned__';

// Image → emoji → initial letter
function CategoryIcon({ category, size = 'md' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizes = {
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-9 h-9 text-base rounded-lg',
    lg: 'w-14 h-14 text-2xl rounded-xl',
  };
  const box = `${sizes[size]} shrink-0 flex items-center justify-center select-none border border-hairline bg-canvas-muted`;

  if (category.image && !imgFailed) {
    return (
      <img src={category.image} alt="" className={`${box} object-cover`} onError={() => setImgFailed(true)} />
    );
  }
  return (
    <div className={`${box} ${category.emoji ? '' : 'font-display font-semibold text-ink-muted'}`}>
      {category.emoji || category.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function IconButton({ onClick, title, danger, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`p-1.5 rounded-md text-ink-muted transition cursor-pointer disabled:opacity-40 ${
        danger ? 'hover:text-status-danger hover:bg-status-danger-bg' : 'hover:text-ink hover:bg-canvas-muted'
      }`}
    >
      {children}
    </button>
  );
}

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function CategoriesPage() {
  const { backendUrl, token } = useAdminAuth();
  const searchRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // Modal / dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all categories from backend API
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/v1/category`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // "/" focuses search, Esc clears it
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Group categories into primaries with their children
  const { primaries, childrenByParent, orphans, subCount } = useMemo(() => {
    const prims = categories
      .filter((c) => !c.parentCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
    const primIds = new Set(prims.map((p) => p._id));
    const map = new Map();
    const orphanList = [];
    let subs = 0;

    categories.forEach((c) => {
      const pId = getParentId(c);
      if (!pId) return;
      subs += 1;
      if (!primIds.has(pId)) {
        orphanList.push(c);
        return;
      }
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId).push(c);
    });
    map.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));

    return { primaries: prims, childrenByParent: map, orphans: orphanList, subCount: subs };
  }, [categories]);

  // Fall back to the first department if selection is missing (e.g. after delete)
  const activeId =
    selectedId === UNASSIGNED && orphans.length > 0
      ? UNASSIGNED
      : primaries.some((p) => p._id === selectedId)
        ? selectedId
        : primaries[0]?._id || null;

  const activePrimary = primaries.find((p) => p._id === activeId) || null;
  const activeChildren = activeId === UNASSIGNED ? orphans : childrenByParent.get(activeId) || [];

  // Flat search results across the whole taxonomy
  const query = searchTerm.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!query) return [];
    const nameById = new Map(primaries.map((p) => [p._id, p.name]));
    return categories
      .map((c) => {
        const pId = getParentId(c);
        return { ...c, parentName: pId ? nameById.get(pId) || 'Unassigned' : null };
      })
      .filter((c) =>
        [c.name, c.slug, c.description, c.parentName].some((v) => v?.toLowerCase().includes(query))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, primaries, query]);

  const handleCategorySaved = (saved) => {
    if (saved?._id) {
      setCategories((prev) => {
        const index = prev.findIndex((c) => c._id === saved._id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = saved;
          return next;
        }
        return [...prev, saved];
      });
      // Jump to the department that was just created / edited
      setSelectedId(getParentId(saved) || saved._id);
    }
    fetchCategories();
  };

  const openCreate = (parentId = null) => {
    // A category without _id opens the modal in create mode with the parent pre-filled
    setSelectedCategory(parentId ? { parentCategory: parentId } : null);
    setIsModalOpen(true);
  };

  const openEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await axios.delete(`${backendUrl}/api/v1/category/${categoryToDelete._id}`, {
        headers: { token },
      });
      if (res.data.success) {
        toast.success(`Category '${categoryToDelete.name}' deleted`);
        await fetchCategories();
        setCategoryToDelete(null);
      } else {
        toast.error(res.data.message || 'Deletion failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete category', { autoClose: 6000 });
    } finally {
      setDeleteLoading(false);
    }
  };

  const copySlug = async (slug) => {
    try {
      await navigator.clipboard.writeText(`/${slug}`);
      toast.success('Slug copied', { autoClose: 1500 });
    } catch {
      // Clipboard can be unavailable on insecure origins
    }
  };

  const deletingPrimaryChildren = categoryToDelete && !getParentId(categoryToDelete)
    ? (childrenByParent.get(categoryToDelete._id) || []).length
    : 0;

  // One sub-category / search-result row
  const renderRow = (item, { showParent = false } = {}) => (
    <li
      key={item._id}
      className="group flex items-center gap-3 px-5 py-3 hover:bg-canvas-subtle transition"
    >
      <CategoryIcon category={item} size="sm" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-ink truncate">{item.name}</span>
          {showParent && (
            <span className="text-[11px] text-ink-muted truncate">
              {item.parentName ? `in ${item.parentName}` : 'Department'}
            </span>
          )}
        </div>
        {item.description && <p className="text-xs text-ink-muted truncate mt-0.5">{item.description}</p>}
      </div>

      <button
        type="button"
        onClick={() => copySlug(item.slug)}
        title="Copy slug"
        className="hidden sm:inline font-mono text-[11px] text-ink-faint hover:text-ink transition cursor-pointer"
      >
        /{item.slug}
      </button>

      <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition">
        {showParent && !item.parentCategory && (
          <IconButton title="Open department" onClick={() => { setSelectedId(item._id); setSearchTerm(''); }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 5l7 7-7 7" />
            </svg>
          </IconButton>
        )}
        <IconButton title="Edit" onClick={() => openEdit(item)}>
          <EditIcon />
        </IconButton>
        <IconButton title="Delete" danger onClick={() => setCategoryToDelete(item)}>
          <TrashIcon />
        </IconButton>
      </div>
    </li>
  );

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <PageHeader
        title="Categories"
        subtitle="Organise your catalog into departments and sub-categories."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Catalog', href: '/list' },
          { label: 'Categories' },
        ]}
        actions={
          <Button variant="primary" size="sm" onClick={() => openCreate()}>
            + New category
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setSearchTerm('')}
            placeholder="Search all categories"
            className="w-full pl-9 pr-10 py-2 rounded-lg border border-hairline bg-surface text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none transition"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-hairline text-[10px] text-ink-faint font-sans">
            /
          </kbd>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto text-xs text-ink-muted">
          <span>
            <span className="font-semibold text-ink">{primaries.length}</span> departments
          </span>
          <span className="w-px h-3 bg-hairline" />
          <span>
            <span className="font-semibold text-ink">{subCount}</span> sub-categories
          </span>
          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            title="Refresh"
            aria-label="Refresh"
            className="p-1.5 rounded-md hover:bg-canvas-muted hover:text-ink transition cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {loading && categories.length === 0 ? (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 animate-pulse">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-11 rounded-lg bg-canvas-muted" />
            ))}
          </div>
          <div className="h-80 rounded-xl bg-canvas-muted" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-surface py-16">
          <EmptyState
            title="No categories yet"
            description="Create your first department to start organising products."
            action={<Button variant="primary" size="sm" onClick={() => openCreate()}>New category</Button>}
          />
        </div>
      ) : query ? (
        /* Search results */
        <section className="rounded-xl border border-hairline bg-surface overflow-hidden">
          <header className="px-5 py-3 border-b border-hairline text-xs text-ink-muted">
            {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for{' '}
            <span className="text-ink font-medium">“{searchTerm.trim()}”</span>
          </header>
          {searchResults.length ? (
            <ul className="divide-y divide-hairline">
              {searchResults.map((item) => renderRow(item, { showParent: true }))}
            </ul>
          ) : (
            <div className="py-12">
              <EmptyState
                title="No matches"
                description="Try a different name or slug."
                action={<Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>Clear search</Button>}
              />
            </div>
          )}
        </section>
      ) : (
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Department list */}
          <nav aria-label="Departments" className="lg:sticky lg:top-24">
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Departments</p>
            <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              {primaries.map((p) => {
                const active = p._id === activeId;
                return (
                  <li key={p._id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedId(p._id)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                        active ? 'bg-surface border border-hairline shadow-2xs' : 'border border-transparent hover:bg-canvas-muted'
                      }`}
                    >
                      <span className="text-base leading-none w-5 text-center">{p.emoji || p.name.charAt(0)}</span>
                      <span className={`flex-1 text-sm truncate whitespace-nowrap ${active ? 'text-ink font-medium' : 'text-ink-secondary'}`}>
                        {p.name}
                      </span>
                      <span className="text-[11px] tabular-nums text-ink-faint">
                        {(childrenByParent.get(p._id) || []).length}
                      </span>
                    </button>
                  </li>
                );
              })}
              {orphans.length > 0 && (
                <li className="shrink-0 lg:mt-2 lg:pt-2 lg:border-t lg:border-hairline">
                  <button
                    type="button"
                    onClick={() => setSelectedId(UNASSIGNED)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition cursor-pointer ${
                      activeId === UNASSIGNED ? 'bg-surface border border-hairline shadow-2xs' : 'border border-transparent hover:bg-canvas-muted'
                    }`}
                  >
                    <span className="w-5 text-center text-status-warning">!</span>
                    <span className="flex-1 text-sm text-ink-secondary whitespace-nowrap">Unassigned</span>
                    <span className="text-[11px] tabular-nums text-status-warning">{orphans.length}</span>
                  </button>
                </li>
              )}
            </ul>
            <button
              type="button"
              onClick={() => openCreate()}
              className="hidden lg:flex w-full items-center gap-3 mt-1 px-3 py-2 rounded-lg text-sm text-ink-muted hover:text-ink hover:bg-canvas-muted transition cursor-pointer"
            >
              <span className="w-5 text-center">+</span>
              New department
            </button>
          </nav>

          {/* Detail panel */}
          <section className="rounded-xl border border-hairline bg-surface overflow-hidden">
            {activeId === UNASSIGNED ? (
              <header className="px-5 py-5 border-b border-hairline">
                <h2 className="font-display text-xl text-ink">Unassigned</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  These sub-categories point to a department that no longer exists. Edit them to choose a new parent.
                </p>
              </header>
            ) : activePrimary && (
              <header className="flex items-start gap-4 px-5 py-5 border-b border-hairline">
                <CategoryIcon category={activePrimary} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl text-ink truncate">{activePrimary.name}</h2>
                  <button
                    type="button"
                    onClick={() => copySlug(activePrimary.slug)}
                    title="Copy slug"
                    className="font-mono text-xs text-ink-faint hover:text-ink transition cursor-pointer"
                  >
                    /{activePrimary.slug}
                  </button>
                  {activePrimary.description && (
                    <p className="mt-2 text-sm text-ink-muted max-w-prose">{activePrimary.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <IconButton title="Edit department" onClick={() => openEdit(activePrimary)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton title="Delete department" danger onClick={() => setCategoryToDelete(activePrimary)}>
                    <TrashIcon />
                  </IconButton>
                </div>
              </header>
            )}

            <div className="flex items-center justify-between px-5 py-2.5 bg-canvas-subtle border-b border-hairline">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                Sub-categories · {activeChildren.length}
              </span>
              {activePrimary && (
                <button
                  type="button"
                  onClick={() => openCreate(activePrimary._id)}
                  className="text-xs font-medium text-accent hover:text-accent-hover transition cursor-pointer"
                >
                  + Add sub-category
                </button>
              )}
            </div>

            {activeChildren.length ? (
              <ul className="divide-y divide-hairline">{activeChildren.map((item) => renderRow(item))}</ul>
            ) : (
              <div className="py-12">
                <EmptyState
                  title="No sub-categories"
                  description={`Break ${activePrimary?.name || 'this department'} down into smaller groups.`}
                  action={
                    activePrimary && (
                      <Button variant="secondary" size="sm" onClick={() => openCreate(activePrimary._id)}>
                        Add sub-category
                      </Button>
                    )
                  }
                />
              </div>
            )}
          </section>
        </div>
      )}

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        allCategories={categories}
        onSuccess={handleCategorySaved}
        onSaved={handleCategorySaved}
      />

      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDeleteCategory}
        title={getParentId(categoryToDelete) ? 'Delete sub-category' : 'Delete department'}
        description={
          deletingPrimaryChildren
            ? `'${categoryToDelete?.name}' still has ${deletingPrimaryChildren} sub-categor${
                deletingPrimaryChildren === 1 ? 'y' : 'ies'
              }. Delete or move them first — the server will reject this otherwise.`
            : `Delete '${categoryToDelete?.name}'? This is blocked if any products are still linked to it.`
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}

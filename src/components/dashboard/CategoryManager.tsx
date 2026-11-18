"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  FolderTree,
  Tag,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  CategoryItem,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/actions/categoryActions";
import { ConfirmModal } from "@/components/ui/Modal";
import { slugify } from "@/lib/sanity-helpers";

interface CategoryManagerProps {
  initialCategories: CategoryItem[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<"all" | "blog" | "portfolio">("all");

  // Create form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSection, setNewSection] = useState<"blog" | "portfolio">("blog");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editSection, setEditSection] = useState<"blog" | "portfolio">("blog");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<CategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredCategories = categories.filter((c) =>
    activeTab === "all" ? true : c.section === activeTab
  );

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    setNewSlug(slugify(val));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreateLoading(true);
    setCreateError(null);

    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("slug", newSlug || slugify(newTitle));
    formData.append("section", newSection);

    const result = await createCategoryAction(formData);
    if (result.error) {
      setCreateError(result.error);
      setCreateLoading(false);
    } else {
      // Re-fetch or add optimistically
      const newCat: CategoryItem = {
        _id: `temp_${Date.now()}`,
        title: newTitle,
        slug: { current: newSlug || slugify(newTitle) },
        section: newSection,
      };
      setCategories((prev) => [...prev, newCat]);
      setNewTitle("");
      setNewSlug("");
      setIsCreating(false);
      setCreateLoading(false);
    }
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditTitle(cat.title);
    setEditSlug(cat.slug?.current || "");
    setEditSection(cat.section);
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editTitle.trim()) return;

    setEditLoading(true);
    setEditError(null);

    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("slug", editSlug || slugify(editTitle));
    formData.append("section", editSection);

    const result = await updateCategoryAction(editingCategory._id, formData);
    if (result.error) {
      setEditError(result.error);
      setEditLoading(false);
    } else {
      setCategories((prev) =>
        prev.map((c) =>
          c._id === editingCategory._id
            ? {
                ...c,
                title: editTitle,
                slug: { current: editSlug || slugify(editTitle) },
                section: editSection,
              }
            : c
        )
      );
      setEditingCategory(null);
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!catToDelete) return;
    setDeleteLoading(true);
    const result = await deleteCategoryAction(catToDelete._id);
    if (result.success) {
      setCategories((prev) => prev.filter((c) => c._id !== catToDelete._id));
      setDeleteModalOpen(false);
      setCatToDelete(null);
    }
    setDeleteLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "blog"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Blog ({categories.filter((c) => c.section === "blog").length})
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "portfolio"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Portfolio ({categories.filter((c) => c.section === "portfolio").length})
          </button>
        </div>

        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingCategory(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto cursor-pointer"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isCreating ? "Cancel" : "Add Category"}</span>
        </button>
      </div>

      {/* Create New Category Card */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900/80 border border-emerald-500/30 p-5 rounded-2xl backdrop-blur-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-emerald-400" />
              <span>Create New Taxonomy Category</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Category Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Branding & Identity"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="branding-identity"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-emerald-400 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Section
              </label>
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value as "blog" | "portfolio")}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="blog">Blog</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {createLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Save Category</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Category Modal/Card */}
      {editingCategory && (
        <form
          onSubmit={handleUpdate}
          className="bg-slate-900/80 border border-indigo-500/30 p-5 rounded-2xl backdrop-blur-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span>Edit Category: {editingCategory.title}</span>
            </h3>
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
          </div>

          {editError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Category Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-indigo-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Section
              </label>
              <select
                value={editSection}
                onChange={(e) => setEditSection(e.target.value as "blog" | "portfolio")}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="blog">Blog</option>
                <option value="portfolio">Portfolio</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {editLoading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Update Category</span>
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Slug</th>
              <th className="py-3.5 px-4">Section</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-500">
                  No categories found. Click "Add Category" to create one.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr
                  key={cat._id}
                  className="hover:bg-slate-800/30 transition duration-150"
                >
                  <td className="py-3 px-4 font-medium text-white flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <span>{cat.title}</span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-indigo-400">
                    /{cat.slug?.current || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        cat.section === "blog"
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                          : "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                      }`}
                    >
                      {cat.section}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCatToDelete(cat);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Category"
        message={`Are you sure you want to permanently delete category "${catToDelete?.title}"?`}
        confirmText="Delete Category"
        isDestructive
        isLoading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCatToDelete(null);
        }}
      />
    </div>
  );
}

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
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#111113] border border-zinc-800/80 rounded-md self-start">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              activeTab === "all"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            All ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              activeTab === "blog"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Blog ({categories.filter((c) => c.section === "blog").length})
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
              activeTab === "portfolio"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-white"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold transition self-start sm:self-auto cursor-pointer"
        >
          {isCreating ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isCreating ? "Cancel" : "Add Category"}</span>
        </button>
      </div>

      {/* Create New Category Card */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-[#111113] border border-zinc-700 p-5 rounded-lg space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <FolderTree className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Create Taxonomy Category</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-zinc-500 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          {createError && (
            <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Category Title <span className="text-[#ccff00]">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Spatial Systems"
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="spatial-systems"
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Section
              </label>
              <select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value as "blog" | "portfolio")}
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                <option value="blog" className="bg-[#111113]">Blog</option>
                <option value="portfolio" className="bg-[#111113]">Portfolio</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={createLoading}
              className="px-3.5 py-1.5 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {createLoading && (
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
              <span>Save Category</span>
            </button>
          </div>
        </form>
      )}

      {/* Edit Category Form */}
      {editingCategory && (
        <form
          onSubmit={handleUpdate}
          className="bg-[#111113] border border-zinc-700 p-5 rounded-lg space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Edit3 className="w-3.5 h-3.5 text-[#ccff00]" />
              <span>Edit Category: {editingCategory.title}</span>
            </h3>
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="text-zinc-500 hover:text-white text-xs font-mono"
            >
              Cancel
            </button>
          </div>

          {editError && (
            <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Category Title <span className="text-[#ccff00]">*</span>
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Section
              </label>
              <select
                value={editSection}
                onChange={(e) => setEditSection(e.target.value as "blog" | "portfolio")}
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                <option value="blog" className="bg-[#111113]">Blog</option>
                <option value="portfolio" className="bg-[#111113]">Portfolio</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-3.5 py-1.5 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {editLoading && (
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
              <span>Update Category</span>
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="rounded-lg border border-zinc-800/80 bg-[#111113] overflow-hidden">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-[#0d0d0f] border-b border-zinc-800 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Section</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-zinc-500 font-mono text-xs">
                  No categories found. Click "Add Category" to create one.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr
                  key={cat._id}
                  className="hover:bg-zinc-900/40 transition duration-100"
                >
                  <td className="py-2.5 px-4 font-medium text-white flex items-center gap-2">
                    <Tag className="w-3 h-3 text-zinc-500" />
                    <span>{cat.title}</span>
                  </td>
                  <td className="py-2.5 px-4 text-xs font-mono text-zinc-400">
                    /{cat.slug?.current || "-"}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {cat.section}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setCatToDelete(cat);
                          setDeleteModalOpen(true);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

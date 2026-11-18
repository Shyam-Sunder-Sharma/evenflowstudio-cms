"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Tag,
  Filter,
} from "lucide-react";
import { BlogPostItem, toggleBlogPostStatus, deleteBlogPostAction } from "@/actions/blogActions";
import { CategoryItem } from "@/actions/categoryActions";
import { ConfirmModal } from "@/components/ui/Modal";

interface BlogTableProps {
  initialPosts: BlogPostItem[];
  categories: CategoryItem[];
}

export function BlogTable({ initialPosts, categories }: BlogTableProps) {
  const [posts, setPosts] = useState<BlogPostItem[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPostItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      search === "" ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      post.slugEn?.current?.toLowerCase().includes(search.toLowerCase()) ||
      post.slugPl?.current?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" ||
      post.categories?.some((c) => c._id === categoryFilter);

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleToggle = async (post: BlogPostItem) => {
    setTogglingId(post._id);
    const result = await toggleBlogPostStatus(post._id, post.status);
    if (result.success && result.status) {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id ? { ...p, status: result.status as "published" | "draft" } : p
        )
      );
    }
    setTogglingId(null);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    const result = await deleteBlogPostAction(postToDelete._id);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p._id !== postToDelete._id));
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
    setIsDeleting(false);
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search blogs by title, tags, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="published" className="bg-slate-900">Published</option>
              <option value="draft" className="bg-slate-900">Draft</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-slate-900">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/dashboard/blogs/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Image</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">URLs (EN / PL)</th>
                <th className="py-3.5 px-4">Categories</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No blog posts match your criteria.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post._id}
                    className="hover:bg-slate-800/30 transition duration-150"
                  >
                    {/* Featured Image */}
                    <td className="py-3 px-4">
                      {post.featuredImage?.asset?.url ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.featuredImage.asset.url}
                            alt={post.featuredImage.alt || post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-600 text-xs">
                          No img
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      <Link
                        href={`/dashboard/blogs/${post._id}/edit`}
                        className="hover:text-indigo-400 transition line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {post.excerpt}
                        </p>
                      )}
                    </td>

                    {/* URLs */}
                    <td className="py-3 px-4 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <span className="text-[10px] uppercase font-bold text-slate-500">EN:</span>
                        <span className="truncate max-w-[130px]">
                          /{post.slugEn?.current || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-violet-400">
                        <span className="text-[10px] uppercase font-bold text-slate-500">PL:</span>
                        <span className="truncate max-w-[130px]">
                          /{post.slugPl?.current || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Categories */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {post.categories && post.categories.length > 0 ? (
                          post.categories.map((c) => (
                            <span
                              key={c._id}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium"
                            >
                              {c.title}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </div>
                    </td>

                    {/* Tags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {post.tags && post.tags.length > 0 ? (
                          post.tags.slice(0, 3).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono"
                            >
                              #{t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                        {post.tags && post.tags.length > 3 && (
                          <span className="text-[10px] text-slate-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(post.publishedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Status & Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(post)}
                        disabled={togglingId === post._id}
                        title={`Click to ${post.status === "published" ? "unpublish" : "publish"}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                          post.status === "published"
                            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30"
                        }`}
                      >
                        {togglingId === post._id ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : post.status === "published" ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span>{post.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/api/public/blogs/${post.slugEn?.current || post.slugPl?.current}`}
                          target="_blank"
                          title="View JSON API Response"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/blogs/${post._id}/edit`}
                          title="Edit Post"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setPostToDelete(post);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Post"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Blog Post"
        message={`Are you sure you want to permanently delete "${postToDelete?.title}"? This will delete the document in Sanity and cannot be undone.`}
        confirmText="Delete Post"
        isDestructive
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Briefcase,
  Filter,
} from "lucide-react";
import {
  PortfolioProjectItem,
  togglePortfolioProjectStatus,
  deletePortfolioProjectAction,
} from "@/actions/portfolioActions";
import { CategoryItem } from "@/actions/categoryActions";
import { ConfirmModal } from "@/components/ui/Modal";

interface PortfolioTableProps {
  initialProjects: PortfolioProjectItem[];
  categories: CategoryItem[];
}

export function PortfolioTable({ initialProjects, categories }: PortfolioTableProps) {
  const [projects, setProjects] = useState<PortfolioProjectItem[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<PortfolioProjectItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      search === "" ||
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      (project.client && project.client.toLowerCase().includes(search.toLowerCase())) ||
      project.slugPl?.current?.toLowerCase().includes(search.toLowerCase()) ||
      project.slugEn?.current?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    const matchesCategory =
      categoryFilter === "all" || project.category?._id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleToggle = async (project: PortfolioProjectItem) => {
    setTogglingId(project._id);
    const result = await togglePortfolioProjectStatus(project._id, project.status);
    if (result.success && result.status) {
      setProjects((prev) =>
        prev.map((p) =>
          p._id === project._id
            ? { ...p, status: result.status as "published" | "draft" }
            : p
        )
      );
    }
    setTogglingId(null);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    const result = await deletePortfolioProjectAction(projectToDelete._id);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      setDeleteModalOpen(false);
      setProjectToDelete(null);
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
            placeholder="Search projects by title, client, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
            href="/dashboard/portfolio/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
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
                <th className="py-3.5 px-4">Title & Client</th>
                <th className="py-3.5 px-4">URLs (PL / EN)</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No portfolio projects match your criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-slate-800/30 transition duration-150"
                  >
                    {/* Featured Image */}
                    <td className="py-3 px-4">
                      {project.featuredImage?.asset?.url ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={project.featuredImage.asset.url}
                            alt={project.featuredImage.alt || project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-600 text-xs">
                          No img
                        </div>
                      )}
                    </td>

                    {/* Title & Client */}
                    <td className="py-3 px-4 font-medium text-white max-w-xs">
                      <Link
                        href={`/dashboard/portfolio/${project._id}/edit`}
                        className="hover:text-violet-400 transition line-clamp-1"
                      >
                        {project.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {project.client ? (
                          <span>Client: {project.client}</span>
                        ) : (
                          <span>Studio Showcase</span>
                        )}
                        {project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-400 hover:underline flex items-center gap-0.5"
                          >
                            Live <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* URLs (PL / EN) */}
                    <td className="py-3 px-4 text-xs font-mono space-y-1">
                      <div className="flex items-center gap-1.5 text-violet-400">
                        <span className="text-[10px] uppercase font-bold text-slate-500">PL:</span>
                        <span className="truncate max-w-[130px]">
                          /{project.slugPl?.current || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <span className="text-[10px] uppercase font-bold text-slate-500">EN:</span>
                        <span className="truncate max-w-[130px]">
                          /{project.slugEn?.current || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      {project.category ? (
                        <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
                          {project.category.title}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(project.publishedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Status & Toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(project)}
                        disabled={togglingId === project._id}
                        title={`Click to ${project.status === "published" ? "unpublish" : "publish"}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                          project.status === "published"
                            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30"
                        }`}
                      >
                        {togglingId === project._id ? (
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : project.status === "published" ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span>{project.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/api/public/portfolio/${project.slugPl?.current || project.slugEn?.current}`}
                          target="_blank"
                          title="View JSON API Response"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/portfolio/${project._id}/edit`}
                          title="Edit Project"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-800 transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setProjectToDelete(project);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Project"
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
        title="Delete Portfolio Project"
        message={`Are you sure you want to permanently delete "${projectToDelete?.title}"? This will delete the document in Sanity and cannot be undone.`}
        confirmText="Delete Project"
        isDestructive
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
      />
    </div>
  );
}

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
    <div className="space-y-4">
      {/* Search and Filters toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111113] border border-zinc-800/80 p-3 rounded-lg">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects by title, client, or slugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-[#09090b] border border-zinc-800 rounded-md px-2.5 py-1.5">
            <Filter className="w-3 h-3 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111113]">All Statuses</option>
              <option value="published" className="bg-[#111113]">Published</option>
              <option value="draft" className="bg-[#111113]">Draft</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 bg-[#09090b] border border-zinc-800 rounded-md px-2.5 py-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111113]">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-[#111113]">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/dashboard/portfolio/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Editorial Table */}
      <div className="rounded-lg border border-zinc-800/80 bg-[#111113] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-[#0d0d0f] border-b border-zinc-800 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-3 px-4 w-14">Media</th>
                <th className="py-3 px-4">Project & Client</th>
                <th className="py-3 px-4">Slugs (PL / EN)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Published</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                    No portfolio projects match your criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project._id}
                    className="hover:bg-zinc-900/40 transition duration-100"
                  >
                    {/* Featured Image */}
                    <td className="py-2.5 px-4">
                      {project.featuredImage?.asset?.url ? (
                        <div className="relative w-10 h-10 rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={project.featuredImage.asset.url}
                            alt={project.featuredImage.alt || project.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 text-[10px] font-mono">
                          N/A
                        </div>
                      )}
                    </td>

                    {/* Title & Client */}
                    <td className="py-2.5 px-4 font-medium text-white max-w-xs">
                      <Link
                        href={`/dashboard/portfolio/${project._id}/edit`}
                        className="hover:text-[#ccff00] transition line-clamp-1 block text-xs"
                      >
                        {project.title}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 font-normal">
                        <Briefcase className="w-2.5 h-2.5 text-zinc-400" />
                        <span>{project.client || "Evenflowstudio"}</span>
                        {project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-zinc-300 ml-1 flex items-center"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* URLs */}
                    <td className="py-2.5 px-4 font-mono text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">PL:</span>
                        <span className="truncate max-w-[140px]">
                          /{project.slugPl?.current || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">EN:</span>
                        <span className="truncate max-w-[140px]">
                          /{project.slugEn?.current || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-4">
                      {project.category ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {project.category.title}
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {new Date(project.publishedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Status & Toggle */}
                    <td className="py-2.5 px-4">
                      <button
                        onClick={() => handleToggle(project)}
                        disabled={togglingId === project._id}
                        title={`Click to ${project.status === "published" ? "unpublish" : "publish"}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer ${
                          project.status === "published"
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"
                        }`}
                      >
                        {togglingId === project._id ? (
                          <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : project.status === "published" ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                        <span>{project.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/api/public/portfolio/${project.slugPl?.current || project.slugEn?.current}`}
                          target="_blank"
                          title="View JSON API Response"
                          className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/dashboard/portfolio/${project._id}/edit`}
                          title="Edit Project"
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setProjectToDelete(project);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Project"
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Portfolio Project"
        message={`Are you sure you want to permanently delete "${projectToDelete?.title}"? This will delete the document in Sanity Content Lake and cannot be undone.`}
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

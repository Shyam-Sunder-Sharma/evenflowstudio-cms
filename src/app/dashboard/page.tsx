import React from "react";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import {
  FileText,
  Briefcase,
  FolderTree,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
} from "lucide-react";


interface OverviewStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalPortfolio: number;
  publishedPortfolio: number;
  draftPortfolio: number;
  totalCategories: number;
}

async function getStats(): Promise<OverviewStats> {
  try {
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalPortfolio,
      publishedPortfolio,
      draftPortfolio,
      totalCategories,
    ] = await Promise.all([
      client.fetch<number>(`count(*[_type == "blogPost"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "blogPost" && status == "published"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "blogPost" && status == "draft"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "portfolioProject"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "portfolioProject" && status == "published"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "portfolioProject" && status == "draft"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "category"])`, {}, { cache: "no-store" }),
    ]);

    return {
      totalBlogs: totalBlogs || 0,
      publishedBlogs: publishedBlogs || 0,
      draftBlogs: draftBlogs || 0,
      totalPortfolio: totalPortfolio || 0,
      publishedPortfolio: publishedPortfolio || 0,
      draftPortfolio: draftPortfolio || 0,
      totalCategories: totalCategories || 0,
    };
  } catch (e) {
    console.error("Error fetching overview stats:", e);
    return {
      totalBlogs: 0,
      publishedBlogs: 0,
      draftBlogs: 0,
      totalPortfolio: 0,
      publishedPortfolio: 0,
      draftPortfolio: 0,
      totalCategories: 0,
    };
  }
}

async function getRecentItems() {
  try {
    const query = `{
      "blogs": *[_type == "blogPost"] | order(_createdAt desc)[0...5] {
        _id,
        title,
        status,
        publishedAt,
        _createdAt
      },
      "projects": *[_type == "portfolioProject"] | order(_createdAt desc)[0...5] {
        _id,
        title,
        status,
        client,
        _createdAt
      }
    }`;
    return await client.fetch<{ blogs: any[]; projects: any[] }>(query, {}, { cache: "no-store" });
  } catch {
    return { blogs: [], projects: [] };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recent = await getRecentItems();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Editorial Overview
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Headless
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Evenflowstudio Content Management System & API Hub
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/blogs/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Blog Post</span>
          </Link>
          <Link
            href="/dashboard/portfolio/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Blogs Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Blog Articles
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalBlogs}
            </span>
            <span className="text-xs text-slate-400">total posts</span>
          </div>
          <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-emerald-400 font-medium">
              {stats.publishedBlogs} Published
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-medium">
              {stats.draftBlogs} Drafts
            </span>
            <Link
              href="/dashboard/blogs"
              className="ml-auto text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Portfolio Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Portfolio Projects
            </span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalPortfolio}
            </span>
            <span className="text-xs text-slate-400">total projects</span>
          </div>
          <div className="mt-4 flex items-center gap-3 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-emerald-400 font-medium">
              {stats.publishedPortfolio} Published
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-medium">
              {stats.draftPortfolio} Drafts
            </span>
            <Link
              href="/dashboard/portfolio"
              className="ml-auto text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Categories Card */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Taxonomy Categories
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalCategories}
            </span>
            <span className="text-xs text-slate-400">active categories</span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Blog & Portfolio Sections</span>
            <Link
              href="/dashboard/categories"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Items Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blogs */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h2 className="font-semibold text-white text-base">Recent Blog Posts</h2>
            </div>
            <Link
              href="/dashboard/blogs"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-800/60">
            {recent.blogs.length === 0 ? (
              <p className="py-6 text-sm text-center text-slate-500">
                No blog posts found. Click "New Blog Post" to create one.
              </p>
            ) : (
              recent.blogs.map((b) => (
                <div key={b._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/blogs/${b._id}/edit`}
                      className="text-sm font-medium text-slate-200 hover:text-indigo-400 truncate block transition"
                    >
                      {b.title}
                    </Link>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(b.publishedAt || b._createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      b.status === "published"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Portfolio Projects */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-400" />
              <h2 className="font-semibold text-white text-base">Recent Projects</h2>
            </div>
            <Link
              href="/dashboard/portfolio"
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-800/60">
            {recent.projects.length === 0 ? (
              <p className="py-6 text-sm text-center text-slate-500">
                No portfolio projects found. Click "New Project" to create one.
              </p>
            ) : (
              recent.projects.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/portfolio/${p._id}/edit`}
                      className="text-sm font-medium text-slate-200 hover:text-violet-400 truncate block transition"
                    >
                      {p.title}
                    </Link>
                    <span className="text-xs text-slate-500 block truncate mt-0.5">
                      {p.client ? `Client: ${p.client}` : "Evenflowstudio Showcase"}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      p.status === "published"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

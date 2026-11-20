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
  Radio,
} from "lucide-react";

interface OverviewStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalPortfolio: number;
  publishedPortfolio: number;
  draftPortfolio: number;
  totalCategories: number;
  totalPlugins: number;
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
      totalPlugins,
    ] = await Promise.all([
      client.fetch<number>(`count(*[_type == "blogPost"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "blogPost" && status == "published"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "blogPost" && status == "draft"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "portfolioProject"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "portfolioProject" && status == "published"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "portfolioProject" && status == "draft"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "category"])`, {}, { cache: "no-store" }),
      client.fetch<number>(`count(*[_type == "cmsPlugin"])`, {}, { cache: "no-store" }),
    ]);

    return {
      totalBlogs: totalBlogs || 0,
      publishedBlogs: publishedBlogs || 0,
      draftBlogs: draftBlogs || 0,
      totalPortfolio: totalPortfolio || 0,
      publishedPortfolio: publishedPortfolio || 0,
      draftPortfolio: draftPortfolio || 0,
      totalCategories: totalCategories || 0,
      totalPlugins: totalPlugins || 0,
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
      totalPlugins: 0,
    };
  }
}

async function getRecentItems() {
  try {
    const query = `{
      "blogs": *[_type == "blogPost"] | order(_createdAt desc)[0...5] {
        _id,
        title,
        slugEn,
        slugPl,
        status,
        publishedAt,
        _createdAt
      },
      "projects": *[_type == "portfolioProject"] | order(_createdAt desc)[0...5] {
        _id,
        title,
        slugEn,
        slugPl,
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
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Editorial Overview
            </h1>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/80">
              Live Lake
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Evenflowstudio Content Management System & Headless API Hub
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/blogs/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blog Post</span>
          </Link>
          <Link
            href="/dashboard/portfolio/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Architectural Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blogs Card */}
        <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Blog Articles
            </span>
            <FileText className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white tracking-tight font-mono">
              {stats.totalBlogs}
            </span>
            <span className="text-xs text-zinc-400">total</span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-emerald-400">{stats.publishedBlogs} pub</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">{stats.draftBlogs} draft</span>
            </div>
            <Link
              href="/dashboard/blogs"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-0.5 transition"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Portfolio Card */}
        <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Portfolio Projects
            </span>
            <Briefcase className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white tracking-tight font-mono">
              {stats.totalPortfolio}
            </span>
            <span className="text-xs text-zinc-400">total</span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-emerald-400">{stats.publishedPortfolio} pub</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">{stats.draftPortfolio} draft</span>
            </div>
            <Link
              href="/dashboard/portfolio"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-0.5 transition"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Categories Card */}
        <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Categories
            </span>
            <FolderTree className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white tracking-tight font-mono">
              {stats.totalCategories}
            </span>
            <span className="text-xs text-zinc-400">taxonomies</span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
            <span className="text-[11px] text-zinc-400 font-mono">Blog & Portfolio</span>
            <Link
              href="/dashboard/categories"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-0.5 transition"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Plugins & Webhooks Card */}
        <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5 hover:border-zinc-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              Integrations
            </span>
            <Radio className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-white tracking-tight font-mono">
              {stats.totalPlugins}
            </span>
            <span className="text-xs text-zinc-400">configured</span>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
            <span className="text-[11px] text-zinc-400 font-mono">Webhooks & Scripts</span>
            <Link
              href="/dashboard/plugins"
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-0.5 transition"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Items Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blogs */}
        <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <h2 className="font-semibold text-white text-sm">Recent Blog Posts</h2>
            </div>
            <Link
              href="/dashboard/blogs"
              className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 divide-y divide-zinc-800/60">
            {recent.blogs.length === 0 ? (
              <p className="py-6 text-xs text-center text-zinc-500 font-mono">
                No blog posts found. Click "New Blog Post" to publish.
              </p>
            ) : (
              recent.blogs.map((b) => (
                <div key={b._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/blogs/${b._id}/edit`}
                      className="text-xs font-medium text-zinc-200 hover:text-white truncate block transition"
                    >
                      {b.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-1">
                      <span className="truncate">/{b.slugPl?.current || b.slugEn?.current || "-"}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                        {new Date(b.publishedAt || b._createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                      b.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
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
        <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-zinc-400" />
              <h2 className="font-semibold text-white text-sm">Recent Projects</h2>
            </div>
            <Link
              href="/dashboard/portfolio"
              className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1 transition"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 divide-y divide-zinc-800/60">
            {recent.projects.length === 0 ? (
              <p className="py-6 text-xs text-center text-zinc-500 font-mono">
                No portfolio projects found. Click "New Project" to create one.
              </p>
            ) : (
              recent.projects.map((p) => (
                <div key={p._id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/portfolio/${p._id}/edit`}
                      className="text-xs font-medium text-zinc-200 hover:text-white truncate block transition"
                    >
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-1">
                      <span className="truncate">{p.client ? `Client: ${p.client}` : "Evenflowstudio"}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="truncate">/{p.slugPl?.current || p.slugEn?.current || "-"}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                      p.status === "published"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
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

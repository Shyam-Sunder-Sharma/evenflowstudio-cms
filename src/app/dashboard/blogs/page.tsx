import React from "react";
import Link from "next/link";
import { getBlogPosts } from "@/actions/blogActions";
import { getCategories } from "@/actions/categoryActions";
import { BlogTable } from "@/components/dashboard/BlogTable";
import { Plus } from "lucide-react";

export default async function BlogsPage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getCategories("blog"),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
            Blog Articles
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage bilingual editorial articles, publication statuses, categories, and slugs.
          </p>
        </div>
        <Link
          href="/dashboard/blogs/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold shadow-sm transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Blog Post</span>
        </Link>
      </div>

      <BlogTable initialPosts={posts} categories={categories} />
    </div>
  );
}

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Blog Posts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage bilingual editorial articles, publication statuses, tags, and categories.
          </p>
        </div>
        <Link
          href="/dashboard/blogs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Blog Post</span>
        </Link>
      </div>

      <BlogTable initialPosts={posts} categories={categories} />
    </div>
  );
}

import React from "react";
import { getCategories } from "@/actions/categoryActions";
import { BlogForm } from "@/components/dashboard/BlogForm";

export default async function NewBlogPostPage() {
  const categories = await getCategories("blog");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-zinc-800/60">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Create Editorial Article
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Draft or publish a bilingual article to Sanity Content Lake and public endpoints.
        </p>
      </div>

      <BlogForm categories={categories} />
    </div>
  );
}

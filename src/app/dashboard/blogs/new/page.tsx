import React from "react";
import { getCategories } from "@/actions/categoryActions";
import { BlogForm } from "@/components/dashboard/BlogForm";


export default async function NewBlogPostPage() {
  const categories = await getCategories("blog");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Create New Blog Post
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Draft or publish a bilingual blog post for Evenflowstudio.
        </p>
      </div>

      <BlogForm categories={categories} />
    </div>
  );
}

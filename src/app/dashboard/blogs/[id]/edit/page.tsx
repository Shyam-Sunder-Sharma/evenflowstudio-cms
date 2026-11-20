import React from "react";
import { notFound } from "next/navigation";
import { getBlogPostById } from "@/actions/blogActions";
import { getCategories } from "@/actions/categoryActions";
import { BlogForm } from "@/components/dashboard/BlogForm";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    getBlogPostById(id),
    getCategories("blog"),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-zinc-800/60">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Edit Editorial Article
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Update article content, bilingual slugs, taxonomy, and publication status.
        </p>
      </div>

      <BlogForm initialData={post} categories={categories} />
    </div>
  );
}

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Edit Blog Post
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Update content, bilingual URLs, categories, or status.
        </p>
      </div>

      <BlogForm initialData={post} categories={categories} />
    </div>
  );
}

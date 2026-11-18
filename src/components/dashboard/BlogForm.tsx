"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  User,
  Tag,
  FolderTree,
} from "lucide-react";
import { BlogPostItem, createBlogPostAction, updateBlogPostAction } from "@/actions/blogActions";
import { CategoryItem } from "@/actions/categoryActions";
import { portableTextToPlainText, slugify } from "@/lib/sanity-helpers";

interface BlogFormProps {
  initialData?: BlogPostItem;
  categories: CategoryItem[];
}

export function BlogForm({ initialData, categories }: BlogFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?._id);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slugEn, setSlugEn] = useState(initialData?.slugEn?.current || "");
  const [slugPl, setSlugPl] = useState(initialData?.slugPl?.current || "");
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [body, setBody] = useState(
    initialData?.body ? portableTextToPlainText(initialData.body) : ""
  );
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [author, setAuthor] = useState(initialData?.author || "Evenflowstudio");
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt
      ? new Date(initialData.publishedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categories?.map((c) => c._id) || []
  );

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.featuredImage?.asset?.url || null
  );
  const [imageAlt, setImageAlt] = useState(initialData?.featuredImage?.alt || "");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      const generated = slugify(val);
      setSlugEn(generated);
      setSlugPl(generated);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (!imageAlt) {
        setImageAlt(title || file.name.split(".")[0]);
      }
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      setError("Article title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slugEn", slugEn || slugify(title));
    formData.append("slugPl", slugPl || slugify(title));
    formData.append("status", targetStatus);
    formData.append("author", author);
    formData.append("publishedAt", new Date(publishedAt).toISOString());
    formData.append("excerpt", excerpt);
    formData.append("body", body);
    formData.append("tags", tags);
    formData.append("featuredImageAlt", imageAlt);

    if (imageFile) {
      formData.append("featuredImage", imageFile);
    }

    selectedCategories.forEach((catId) => {
      formData.append("categories", catId);
    });

    try {
      let result;
      if (isEditing && initialData?._id) {
        result = await updateBlogPostAction(initialData._id, formData);
      } else {
        result = await createBlogPostAction(formData);
      }

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else {
        router.push("/dashboard/blogs");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <Link
          href="/dashboard/blogs"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog Posts</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50 cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("published")}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isEditing ? "Update & Publish" : "Publish Now"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Article Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Modern Minimalist Branding: The Evenflow Guide"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Slugs */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bilingual URLs (Slugs)
                </span>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  {autoSlug ? "Disable auto-slug" : "Enable auto-slug"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    English URL (/slugEn)
                  </label>
                  <input
                    type="text"
                    value={slugEn}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlugEn(e.target.value);
                    }}
                    placeholder="modern-minimalist-branding"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Polish URL (/slugPl)
                  </label>
                  <input
                    type="text"
                    value={slugPl}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlugPl(e.target.value);
                    }}
                    placeholder="nowoczesny-branding-minimalistyczny"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-violet-300 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Excerpt / Meta Summary
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary displayed on social previews, article lists, and PHP endpoints..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {/* Body Content */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Body Content (Portable Text Markdown/Plain)
              </label>
              <span className="text-[11px] text-slate-500">
                Separate paragraphs with double newlines
              </span>
            </div>
            <textarea
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your article narrative here... Each paragraph will be automatically structured into standard Sanity Portable Text blocks."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Featured Image
            </span>

            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="block text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">
                  Replace Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group bg-slate-950/40">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-400 group-hover:text-indigo-400 transition mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Upload article banner
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  PNG, JPG, WEBP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Image Alt Text
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Accessible description of image"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Categories
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No categories found. Create some in the Categories tab.
                </p>
              ) : (
                categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => toggleCategory(cat._id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                        isChecked
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      <span>{cat.title}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Design, Branding, Typography"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Publishing Metadata */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Publishing Info
            </span>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Publication Date & Time
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

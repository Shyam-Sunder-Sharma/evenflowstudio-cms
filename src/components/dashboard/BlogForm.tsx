"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
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
    <div className="space-y-6 max-w-5xl">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <Link
          href="/dashboard/blogs"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Articles</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="px-3.5 py-2 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50 cursor-pointer"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit("published")}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-[#ccff00] hover:bg-[#b8e600] text-black transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isSubmitting && (
              <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            )}
            <span>{isEditing ? "Update & Publish" : "Publish Now"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editorial Stream */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & Slugs */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
                Article Title <span className="text-[#ccff00]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Spatial Systems & Monolithic Identity in Architectural Design"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#09090b] border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            {/* Slugs */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Bilingual Slugs
                </span>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[11px] font-mono text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {autoSlug ? "[ Auto-sync: ON ]" : "[ Auto-sync: OFF ]"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    Polish Slug (/slugPl)
                  </label>
                  <input
                    type="text"
                    value={slugPl}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlugPl(e.target.value);
                    }}
                    placeholder="systemy-przestrzenne-identyfikacja"
                    className="w-full px-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                    English Slug (/slugEn)
                  </label>
                  <input
                    type="text"
                    value={slugEn}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlugEn(e.target.value);
                    }}
                    placeholder="spatial-systems-monolithic-identity"
                    className="w-full px-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
              Excerpt / Abstract
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Concise abstract for card previews, meta descriptions, and headless client cards..."
              className="w-full px-3.5 py-2.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 leading-relaxed transition"
            />
          </div>

          {/* Body Content */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Narrative Content (Portable Text)
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                Markdown paragraphs mapped to Sanity block schema
              </span>
            </div>
            <textarea
              rows={14}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your editorial article narrative here. Double newlines designate separate text blocks..."
              className="w-full px-3.5 py-3 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 leading-relaxed font-mono transition"
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-5">
          {/* Featured Image */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Featured Image
            </span>

            {imagePreview ? (
              <div className="space-y-2.5">
                <div className="relative aspect-video rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="block text-center py-1.5 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono cursor-pointer transition">
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
              <label className="border border-dashed border-zinc-700 hover:border-zinc-500 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition text-center bg-zinc-950/40">
                <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-zinc-300">
                  Upload article image
                </span>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  WEBP, JPG, PNG up to 10MB
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
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Image Alt Text
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Architectural overview description"
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Categories
            </span>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono">
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
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-mono transition cursor-pointer text-left ${
                        isChecked
                          ? "bg-zinc-800 text-white border border-zinc-700"
                          : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                      }`}
                    >
                      <span>{cat.title}</span>
                      {isChecked && <Check className="w-3 h-3 text-[#ccff00]" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Branding, Spatial Design, Materiality"
              className="w-full px-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
            />
          </div>

          {/* Publishing Metadata */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Metadata
            </span>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Publication Timestamp
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono transition"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

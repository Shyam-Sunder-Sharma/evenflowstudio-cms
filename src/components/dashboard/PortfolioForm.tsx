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
  Images,
  Globe,
  Building,
  Calendar,
  X,
} from "lucide-react";
import {
  PortfolioProjectItem,
  createPortfolioProjectAction,
  updatePortfolioProjectAction,
} from "@/actions/portfolioActions";
import { CategoryItem } from "@/actions/categoryActions";
import { portableTextToPlainText, slugify } from "@/lib/sanity-helpers";

interface PortfolioFormProps {
  initialData?: PortfolioProjectItem;
  categories: CategoryItem[];
}

export function PortfolioForm({ initialData, categories }: PortfolioFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?._id);

  const [title, setTitle] = useState(initialData?.title || "");
  const [slugPl, setSlugPl] = useState(initialData?.slugPl?.current || "");
  const [slugEn, setSlugEn] = useState(initialData?.slugEn?.current || "");
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  const [client, setClient] = useState(initialData?.client || "");
  const [projectUrl, setProjectUrl] = useState(initialData?.projectUrl || "");
  const [category, setCategory] = useState(initialData?.category?._id || "");
  const [author, setAuthor] = useState(initialData?.author || "Evenflowstudio");
  const [publishedAt, setPublishedAt] = useState(
    initialData?.publishedAt
      ? new Date(initialData.publishedAt).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [description, setDescription] = useState(
    initialData?.description ? portableTextToPlainText(initialData.description) : ""
  );

  // Featured image upload state
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string | null>(
    initialData?.featuredImage?.asset?.url || null
  );
  const [featuredAlt, setFeaturedAlt] = useState(initialData?.featuredImage?.alt || "");

  // Multi-image gallery upload state
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingGallery] = useState(initialData?.gallery || []);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      const generated = slugify(val);
      setSlugPl(generated);
      setSlugEn(generated);
    }
  };

  const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedFile(file);
      setFeaturedPreview(URL.createObjectURL(file));
      if (!featuredAlt) {
        setFeaturedAlt(title || file.name.split(".")[0]);
      }
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles((prev) => [...prev, ...files]);
      const newUrls = files.map((f) => URL.createObjectURL(f));
      setGalleryPreviews((prev) => [...prev, ...newUrls]);
    }
  };

  const removeNewGalleryItem = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("slugPl", slugPl || slugify(title));
    formData.append("slugEn", slugEn || slugify(title));
    formData.append("status", targetStatus);
    formData.append("client", client);
    formData.append("projectUrl", projectUrl);
    formData.append("category", category);
    formData.append("author", author);
    formData.append("publishedAt", new Date(publishedAt).toISOString());
    formData.append("description", description);
    formData.append("featuredImageAlt", featuredAlt);

    if (featuredFile) {
      formData.append("featuredImage", featuredFile);
    }

    galleryFiles.forEach((file) => {
      formData.append("gallery", file);
    });

    try {
      let result;
      if (isEditing && initialData?._id) {
        result = await updatePortfolioProjectAction(initialData._id, formData);
      } else {
        result = await createPortfolioProjectAction(formData);
      }

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      } else {
        router.push("/dashboard/portfolio");
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
          href="/dashboard/portfolio"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portfolio</span>
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
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{isEditing ? "Update & Publish" : "Publish Project"}</span>
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
                Project Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Nordic Haven: Visual Identity & Packaging"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-base font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Slugs (PL / EN) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bilingual URLs (Slugs)
                </span>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                >
                  {autoSlug ? "Disable auto-slug" : "Enable auto-slug"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="nordic-haven-identyfikacja"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-violet-300 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
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
                    placeholder="nordic-haven-branding"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Details (Client, URL) */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Client / Brand Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. Nordic Haven Studio"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Live Project URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://nordichaven.example.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Project Case Study / Description
              </label>
              <span className="text-[11px] text-slate-500">
                Portable Text (Markdown/Plain)
              </span>
            </div>
            <textarea
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the challenge, creative solution, brand typography, and design outcomes..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 leading-relaxed font-mono"
            />
          </div>

          {/* Multi-Image Gallery */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  Project Gallery (Multi-Image)
                </span>
                <span className="text-xs text-slate-500">
                  Upload multiple portfolio showcase photos & mockups
                </span>
              </div>
              <label className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Add Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleGalleryChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Gallery Previews Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Existing gallery */}
              {existingGallery.map((item, idx) => (
                <div
                  key={item._key || idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.asset?.url}
                    alt={item.alt || "Gallery item"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-white">
                    Existing
                  </div>
                </div>
              ))}

              {/* Newly selected images */}
              {galleryPreviews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-violet-500/40 bg-slate-950 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`New ${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewGalleryItem(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-violet-600/80 text-[9px] text-white font-medium">
                    New
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Featured Hero Cover
            </span>

            {featuredPreview ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="block text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition">
                  Replace Hero Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedChange}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group bg-slate-950/40">
                <div className="p-3 rounded-xl bg-slate-800 text-slate-400 group-hover:text-violet-400 transition mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-300">
                  Upload project hero banner
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  PNG, JPG, WEBP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedChange}
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
                value={featuredAlt}
                onChange={(e) => setFeaturedAlt(e.target.value)}
                placeholder="Accessible description of image"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Portfolio Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-slate-900">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Publishing Info */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Project Meta
            </span>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Release / Published Date
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

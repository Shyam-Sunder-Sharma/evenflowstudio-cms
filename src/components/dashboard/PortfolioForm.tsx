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
    <div className="space-y-6 max-w-5xl">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <Link
          href="/dashboard/portfolio"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio</span>
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
            <span>{isEditing ? "Update & Publish" : "Publish Project"}</span>
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
        {/* Main Content Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title & Slugs */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
                Project Title <span className="text-[#ccff00]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Aethelgard Monolith: Architectural Spatial Identity"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#09090b] border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            {/* Slugs (PL / EN) */}
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
                    placeholder="aethelgard-monolith-identyfikacja"
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
                    placeholder="aethelgard-monolith-spatial-identity"
                    className="w-full px-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Details (Client, URL) */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
                Client / Brand Partner
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. Studio Aethelgard & Partners"
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5 font-semibold">
                Live URL
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://aethelgard.evenflowstudio.com"
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Case Study Narrative (Portable Text)
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">
                Markdown mapped to Sanity block schema
              </span>
            </div>
            <textarea
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project scope, creative direction, material specifications, and design outcomes..."
              className="w-full px-3.5 py-3 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 leading-relaxed font-mono transition"
            />
          </div>

          {/* Multi-Image Gallery */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                  Project Gallery Assets
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Multi-image showcase photos, interior photography, and render stills
                </span>
              </div>
              <label className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono border border-zinc-700 cursor-pointer transition inline-flex items-center gap-1.5">
                <Upload className="w-3 h-3" />
                <span>Add Assets</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {/* Existing gallery */}
              {existingGallery.map((item, idx) => (
                <div
                  key={item._key || idx}
                  className="relative aspect-square rounded-md overflow-hidden border border-zinc-800 bg-zinc-950 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.asset?.url}
                    alt={item.alt || "Gallery item"}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] text-zinc-300 font-mono">
                    Existing
                  </div>
                </div>
              ))}

              {/* Newly selected images */}
              {galleryPreviews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-md overflow-hidden border border-zinc-700 bg-zinc-950 group"
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
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600/90 text-white shadow-sm hover:bg-rose-500 transition cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-[9px] text-[#ccff00] font-mono">
                    New
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-5">
          {/* Featured Hero Cover */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Featured Hero Cover
            </span>

            {featuredPreview ? (
              <div className="space-y-2.5">
                <div className="relative aspect-video rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label className="block text-center py-1.5 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono cursor-pointer transition">
                  Replace Hero Cover
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedChange}
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
                  Upload hero cover
                </span>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  WEBP, JPG, PNG up to 15MB
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
              <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                Cover Alt Text
              </label>
              <input
                type="text"
                value={featuredAlt}
                onChange={(e) => setFeaturedAlt(e.target.value)}
                placeholder="Architectural view description"
                className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Portfolio Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="" className="bg-[#111113]">Select a category...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-[#111113]">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Publishing Metadata */}
          <div className="bg-[#111113] border border-zinc-800/80 p-5 rounded-lg space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
              Project Metadata
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
                Release Date
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

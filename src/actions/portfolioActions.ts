"use server";

import { revalidatePath } from "next/cache";
import { writeClient } from "../sanity/lib/writeClient";
import { client } from "../sanity/lib/client";
import { slugify, textToPortableText } from "../lib/sanity-helpers";
import { runActivePlugins } from "../lib/pluginRunner";

export interface PortfolioProjectItem {
  _id: string;
  title: string;
  slugPl: { current: string };
  slugEn: { current: string };
  status: "published" | "draft";
  featuredImage?: {
    asset?: { _id: string; url?: string };
    alt?: string;
  };
  gallery?: Array<{
    _key: string;
    asset?: { _id: string; url?: string };
    alt?: string;
  }>;
  category?: { _id: string; title: string };
  description?: any[];
  projectUrl?: string;
  client?: string;
  author?: string;
  publishedAt?: string;
}

export async function getPortfolioProjects(options?: {
  search?: string;
  status?: string;
  category?: string;
}): Promise<PortfolioProjectItem[]> {
  try {
    let filter = `_type == "portfolioProject"`;
    const params: Record<string, any> = {};

    if (options?.status && options.status !== "all") {
      filter += ` && status == $status`;
      params.status = options.status;
    }

    if (options?.search && options.search.trim()) {
      filter += ` && (title match $search || client match $search)`;
      params.search = `*${options.search.trim()}*`;
    }

    if (options?.category && options.category !== "all") {
      filter += ` && category->_id == $category`;
      params.category = options.category;
    }

    const query = `*[${filter}] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      slugPl,
      slugEn,
      status,
      "featuredImage": {
        "asset": featuredImage.asset->{ _id, url },
        "alt": featuredImage.alt
      },
      "category": category->{ _id, title },
      client,
      projectUrl,
      author,
      publishedAt
    }`;

    return await client.fetch<PortfolioProjectItem[]>(query, params, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching portfolio projects:", error);
    return [];
  }
}

export async function getPortfolioProjectById(id: string): Promise<PortfolioProjectItem | null> {
  try {
    const query = `*[_type == "portfolioProject" && _id == $id][0] {
      _id,
      title,
      slugPl,
      slugEn,
      status,
      featuredImage {
        asset->{ _id, url },
        alt
      },
      gallery[] {
        _key,
        asset->{ _id, url },
        alt
      },
      "category": category->{ _id, title },
      description,
      projectUrl,
      client,
      author,
      publishedAt
    }`;
    return await client.fetch<PortfolioProjectItem | null>(query, { id }, { cache: "no-store" });
  } catch (error) {
    console.error(`Error fetching portfolio project ${id}:`, error);
    return null;
  }
}

export async function createPortfolioProjectAction(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const slugPl = (formData.get("slugPl") as string)?.trim() || slugify(title);
  const slugEn = (formData.get("slugEn") as string)?.trim() || slugify(title);
  const status = (formData.get("status") as "published" | "draft") || "draft";
  const categoryId = (formData.get("category") as string)?.trim();
  const clientName = (formData.get("client") as string)?.trim() || "";
  const projectUrl = (formData.get("projectUrl") as string)?.trim() || "";
  const author = (formData.get("author") as string)?.trim() || "Evenflowstudio";
  const publishedAt = (formData.get("publishedAt") as string) || new Date().toISOString();
  const descriptionText = (formData.get("description") as string) || "";

  if (!title) {
    return { error: "Title is required." };
  }

  try {
    let featuredImage: any = undefined;
    const imageFile = formData.get("featuredImage") as File | null;
    const imageAlt = (formData.get("featuredImageAlt") as string)?.trim() || title;

    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const asset = await writeClient.assets.upload("image", buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      featuredImage = {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: asset._id,
        },
        alt: imageAlt,
      };
    }

    // Process gallery files
    const galleryFiles = formData.getAll("gallery") as File[];
    const galleryItems: any[] = [];

    for (let i = 0; i < galleryFiles.length; i++) {
      const gFile = galleryFiles[i];
      if (gFile && gFile.size > 0) {
        const buffer = Buffer.from(await gFile.arrayBuffer());
        const asset = await writeClient.assets.upload("image", buffer, {
          filename: gFile.name,
          contentType: gFile.type,
        });
        galleryItems.push({
          _key: `gallery_${Date.now()}_${i}`,
          _type: "image",
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
          alt: `${title} gallery image ${i + 1}`,
        });
      }
    }

    const doc: any = {
      _type: "portfolioProject",
      title,
      slugPl: { _type: "slug", current: slugify(slugPl) },
      slugEn: { _type: "slug", current: slugify(slugEn) },
      status,
      client: clientName,
      projectUrl,
      author,
      publishedAt,
      description: textToPortableText(descriptionText),
    };

    if (categoryId) {
      doc.category = {
        _type: "reference",
        _ref: categoryId,
      };
    }

    if (featuredImage) {
      doc.featuredImage = featuredImage;
    }

    if (galleryItems.length > 0) {
      doc.gallery = galleryItems;
    }

    const created = await writeClient.create(doc);
    revalidatePath("/dashboard/portfolio");
    revalidatePath("/dashboard");

    // Fire active plugin webhooks/APIs
    const triggerEvent = status === "published" ? "portfolio.published" : "portfolio.updated";
    runActivePlugins(triggerEvent, {
      id: created._id,
      title,
      slugPl,
      slugEn,
      status,
      author,
      publishedAt,
      client: clientName,
      projectUrl,
    }).catch(() => {});

    return { success: true, id: created._id };
  } catch (error: any) {
    console.error("Create portfolio project error:", error);
    return { error: error.message || "Failed to create portfolio project." };
  }
}

export async function updatePortfolioProjectAction(id: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const slugPl = (formData.get("slugPl") as string)?.trim() || slugify(title);
  const slugEn = (formData.get("slugEn") as string)?.trim() || slugify(title);
  const status = (formData.get("status") as "published" | "draft") || "draft";
  const categoryId = (formData.get("category") as string)?.trim();
  const clientName = (formData.get("client") as string)?.trim() || "";
  const projectUrl = (formData.get("projectUrl") as string)?.trim() || "";
  const author = (formData.get("author") as string)?.trim() || "Evenflowstudio";
  const publishedAt = (formData.get("publishedAt") as string) || new Date().toISOString();
  const descriptionText = (formData.get("description") as string) || "";

  if (!id || !title) {
    return { error: "ID and Title are required." };
  }

  try {
    const patch = writeClient.patch(id);

    const setFields: Record<string, any> = {
      title,
      slugPl: { _type: "slug", current: slugify(slugPl) },
      slugEn: { _type: "slug", current: slugify(slugEn) },
      status,
      client: clientName,
      projectUrl,
      author,
      publishedAt,
      description: textToPortableText(descriptionText),
    };

    if (categoryId) {
      setFields.category = {
        _type: "reference",
        _ref: categoryId,
      };
    }

    const imageFile = formData.get("featuredImage") as File | null;
    const imageAlt = (formData.get("featuredImageAlt") as string)?.trim() || title;

    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const asset = await writeClient.assets.upload("image", buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      setFields.featuredImage = {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: asset._id,
        },
        alt: imageAlt,
      };
    } else if (imageAlt) {
      setFields["featuredImage.alt"] = imageAlt;
    }

    // Append new gallery images if provided
    const galleryFiles = formData.getAll("gallery") as File[];
    const newGalleryItems: any[] = [];

    for (let i = 0; i < galleryFiles.length; i++) {
      const gFile = galleryFiles[i];
      if (gFile && gFile.size > 0) {
        const buffer = Buffer.from(await gFile.arrayBuffer());
        const asset = await writeClient.assets.upload("image", buffer, {
          filename: gFile.name,
          contentType: gFile.type,
        });
        newGalleryItems.push({
          _key: `gallery_${Date.now()}_${i}`,
          _type: "image",
          asset: {
            _type: "reference",
            _ref: asset._id,
          },
          alt: `${title} gallery image`,
        });
      }
    }

    patch.set(setFields);

    if (newGalleryItems.length > 0) {
      patch.setIfMissing({ gallery: [] });
      patch.append("gallery", newGalleryItems);
    }

    await patch.commit();

    revalidatePath("/dashboard/portfolio");
    revalidatePath(`/dashboard/portfolio/${id}/edit`);
    revalidatePath("/dashboard");

    // Fire active plugin webhooks/APIs
    const triggerEvent = status === "published" ? "portfolio.published" : "portfolio.updated";
    runActivePlugins(triggerEvent, {
      id,
      title,
      slugPl,
      slugEn,
      status,
      author,
      publishedAt,
      client: clientName,
      projectUrl,
    }).catch(() => {});

    return { success: true };
  } catch (error: any) {
    console.error("Update portfolio project error:", error);
    return { error: error.message || "Failed to update portfolio project." };
  }
}

export async function togglePortfolioProjectStatus(id: string, currentStatus: "published" | "draft") {
  const nextStatus = currentStatus === "published" ? "draft" : "published";
  try {
    await writeClient.patch(id).set({ status: nextStatus }).commit();
    revalidatePath("/dashboard/portfolio");
    revalidatePath("/dashboard");

    if (nextStatus === "published") {
      runActivePlugins("portfolio.published", {
        id,
        status: "published",
      }).catch(() => {});
    }

    return { success: true, status: nextStatus };
  } catch (error: any) {
    console.error("Toggle status error:", error);
    return { error: error.message || "Failed to toggle status." };
  }
}

export async function deletePortfolioProjectAction(id: string) {
  if (!id) return { error: "ID is required." };
  try {
    await writeClient.delete(id);
    revalidatePath("/dashboard/portfolio");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete portfolio project error:", error);
    return { error: error.message || "Failed to delete portfolio project." };
  }
}

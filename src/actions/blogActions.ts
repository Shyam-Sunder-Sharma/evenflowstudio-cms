"use server";

import { revalidatePath } from "next/cache";
import { writeClient } from "../sanity/lib/writeClient";
import { client } from "../sanity/lib/client";
import { slugify, textToPortableText } from "../lib/sanity-helpers";
import { runActivePlugins } from "../lib/pluginRunner";

export interface BlogPostItem {
  _id: string;
  title: string;
  slugEn: { current: string };
  slugPl: { current: string };
  status: "published" | "draft";
  featuredImage?: {
    asset?: { _ref: string; url?: string };
    alt?: string;
  };
  categories?: Array<{ _id: string; title: string }>;
  tags?: string[];
  author?: string;
  publishedAt?: string;
  excerpt?: string;
  body?: any[];
}

export async function getBlogPosts(options?: {
  search?: string;
  status?: string;
  category?: string;
}): Promise<BlogPostItem[]> {
  try {
    let filter = `_type == "blogPost"`;
    const params: Record<string, any> = {};

    if (options?.status && options.status !== "all") {
      filter += ` && status == $status`;
      params.status = options.status;
    }

    if (options?.search && options.search.trim()) {
      filter += ` && (title match $search || excerpt match $search || tags[] match $search)`;
      params.search = `*${options.search.trim()}*`;
    }

    if (options?.category && options.category !== "all") {
      filter += ` && $category in categories[]->_id`;
      params.category = options.category;
    }

    const query = `*[${filter}] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      slugEn,
      slugPl,
      status,
      "featuredImage": {
        "asset": featuredImage.asset->{ _id, url },
        "alt": featuredImage.alt
      },
      "categories": categories[]->{ _id, title },
      tags,
      author,
      publishedAt,
      excerpt
    }`;

    return await client.fetch<BlogPostItem[]>(query, params, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
}

export async function getBlogPostById(id: string): Promise<BlogPostItem | null> {
  try {
    const query = `*[_type == "blogPost" && _id == $id][0] {
      _id,
      title,
      slugEn,
      slugPl,
      status,
      featuredImage {
        asset->{ _id, url },
        alt
      },
      "categories": categories[]->{ _id, title },
      tags,
      author,
      publishedAt,
      excerpt,
      body
    }`;
    return await client.fetch<BlogPostItem | null>(query, { id }, { cache: "no-store" });
  } catch (error) {
    console.error(`Error fetching blog post ${id}:`, error);
    return null;
  }
}

export async function createBlogPostAction(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const slugEn = (formData.get("slugEn") as string)?.trim() || slugify(title);
  const slugPl = (formData.get("slugPl") as string)?.trim() || slugify(title);
  const status = (formData.get("status") as "published" | "draft") || "draft";
  const author = (formData.get("author") as string)?.trim() || "Evenflowstudio";
  const publishedAt = (formData.get("publishedAt") as string) || new Date().toISOString();
  const excerpt = (formData.get("excerpt") as string)?.trim() || "";
  const bodyText = (formData.get("body") as string) || "";
  const tagsRaw = (formData.get("tags") as string) || "";
  const categoryIds = formData.getAll("categories") as string[];

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

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const categories = categoryIds.map((catId, index) => ({
      _type: "reference",
      _ref: catId,
      _key: `cat_${Date.now()}_${index}`,
    }));

    const doc: any = {
      _type: "blogPost",
      title,
      slugEn: { _type: "slug", current: slugify(slugEn) },
      slugPl: { _type: "slug", current: slugify(slugPl) },
      status,
      author,
      publishedAt,
      excerpt,
      tags,
      categories,
      body: textToPortableText(bodyText),
    };

    if (featuredImage) {
      doc.featuredImage = featuredImage;
    }

    const created = await writeClient.create(doc);
    revalidatePath("/dashboard/blogs");
    revalidatePath("/dashboard");

    // Fire active plugin webhooks/APIs
    const triggerEvent = status === "published" ? "blog.published" : "blog.updated";
    runActivePlugins(triggerEvent, {
      id: created._id,
      title,
      slugEn,
      slugPl,
      status,
      author,
      publishedAt,
    }).catch(() => {});

    return { success: true, id: created._id };
  } catch (error: any) {
    console.error("Create blog post error:", error);
    return { error: error.message || "Failed to create blog post." };
  }
}

export async function updateBlogPostAction(id: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const slugEn = (formData.get("slugEn") as string)?.trim() || slugify(title);
  const slugPl = (formData.get("slugPl") as string)?.trim() || slugify(title);
  const status = (formData.get("status") as "published" | "draft") || "draft";
  const author = (formData.get("author") as string)?.trim() || "Evenflowstudio";
  const publishedAt = (formData.get("publishedAt") as string) || new Date().toISOString();
  const excerpt = (formData.get("excerpt") as string)?.trim() || "";
  const bodyText = (formData.get("body") as string) || "";
  const tagsRaw = (formData.get("tags") as string) || "";
  const categoryIds = formData.getAll("categories") as string[];

  if (!id || !title) {
    return { error: "ID and Title are required." };
  }

  try {
    const patch = writeClient.patch(id);

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const categories = categoryIds.map((catId, index) => ({
      _type: "reference",
      _ref: catId,
      _key: `cat_${Date.now()}_${index}`,
    }));

    const setFields: Record<string, any> = {
      title,
      slugEn: { _type: "slug", current: slugify(slugEn) },
      slugPl: { _type: "slug", current: slugify(slugPl) },
      status,
      author,
      publishedAt,
      excerpt,
      tags,
      categories,
      body: textToPortableText(bodyText),
    };

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

    await patch.set(setFields).commit();

    revalidatePath("/dashboard/blogs");
    revalidatePath(`/dashboard/blogs/${id}/edit`);
    revalidatePath("/dashboard");

    // Fire active plugin webhooks/APIs
    const triggerEvent = status === "published" ? "blog.published" : "blog.updated";
    runActivePlugins(triggerEvent, {
      id,
      title,
      slugEn,
      slugPl,
      status,
      author,
      publishedAt,
    }).catch(() => {});

    return { success: true };
  } catch (error: any) {
    console.error("Update blog post error:", error);
    return { error: error.message || "Failed to update blog post." };
  }
}

export async function toggleBlogPostStatus(id: string, currentStatus: "published" | "draft") {
  const nextStatus = currentStatus === "published" ? "draft" : "published";
  try {
    await writeClient.patch(id).set({ status: nextStatus }).commit();
    revalidatePath("/dashboard/blogs");
    revalidatePath("/dashboard");

    if (nextStatus === "published") {
      runActivePlugins("blog.published", {
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

export async function deleteBlogPostAction(id: string) {
  if (!id) return { error: "ID is required." };
  try {
    await writeClient.delete(id);
    revalidatePath("/dashboard/blogs");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Delete blog post error:", error);
    return { error: error.message || "Failed to delete blog post." };
  }
}

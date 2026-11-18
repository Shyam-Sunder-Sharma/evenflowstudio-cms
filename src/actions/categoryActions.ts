"use server";

import { revalidatePath } from "next/cache";
import { writeClient } from "../sanity/lib/writeClient";
import { client } from "../sanity/lib/client";
import { slugify } from "../lib/sanity-helpers";

export interface CategoryItem {
  _id: string;
  title: string;
  slug: { current: string };
  section: "blog" | "portfolio";
}

export async function getCategories(section?: "blog" | "portfolio"): Promise<CategoryItem[]> {
  try {
    const query = section
      ? `*[_type == "category" && section == $section] | order(title asc)`
      : `*[_type == "category"] | order(section asc, title asc)`;
    const params = section ? { section } : {};
    return await client.fetch<CategoryItem[]>(query, params, { cache: "no-store" });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function createCategoryAction(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const section = formData.get("section") as "blog" | "portfolio";

  if (!title || !section) {
    return { error: "Title and section are required." };
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(title);

  try {
    await writeClient.create({
      _type: "category",
      title,
      slug: { _type: "slug", current: slug },
      section,
    });
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Create category error:", error);
    return { error: error.message || "Failed to create category." };
  }
}

export async function updateCategoryAction(id: string, formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim();
  const section = formData.get("section") as "blog" | "portfolio";

  if (!id || !title || !section) {
    return { error: "Missing required category fields." };
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(title);

  try {
    await writeClient
      .patch(id)
      .set({
        title,
        slug: { _type: "slug", current: slug },
        section,
      })
      .commit();
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Update category error:", error);
    return { error: error.message || "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string) {
  if (!id) return { error: "Category ID required." };

  try {
    await writeClient.delete(id);
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Delete category error:", error);
    return { error: error.message || "Failed to delete category." };
  }
}

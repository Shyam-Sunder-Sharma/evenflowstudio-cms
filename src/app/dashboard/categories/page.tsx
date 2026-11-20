import React from "react";
import { getCategories } from "@/actions/categoryActions";
import { CategoryManager } from "@/components/dashboard/CategoryManager";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-zinc-800/60">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Categories & Taxonomy
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Organize editorial topics and portfolio disciplines across Evenflowstudio channels.
        </p>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}

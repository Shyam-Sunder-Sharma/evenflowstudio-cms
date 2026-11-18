import React from "react";
import { getCategories } from "@/actions/categoryActions";
import { CategoryManager } from "@/components/dashboard/CategoryManager";


export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Categories & Taxonomy
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Organize blog topics and portfolio creative disciplines (e.g. Book, T-shirt, Exhibition, Branding, Logo, Design, Marketing).
        </p>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}

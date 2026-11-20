import React from "react";
import { getCategories } from "@/actions/categoryActions";
import { PortfolioForm } from "@/components/dashboard/PortfolioForm";

export default async function NewPortfolioProjectPage() {
  const categories = await getCategories("portfolio");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-zinc-800/60">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Create Portfolio Project
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Publish a new case study, client showcase, gallery assets, and live project link.
        </p>
      </div>

      <PortfolioForm categories={categories} />
    </div>
  );
}

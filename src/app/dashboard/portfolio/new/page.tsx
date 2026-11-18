import React from "react";
import { getCategories } from "@/actions/categoryActions";
import { PortfolioForm } from "@/components/dashboard/PortfolioForm";


export default async function NewPortfolioProjectPage() {
  const categories = await getCategories("portfolio");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Create New Portfolio Project
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Publish a new case study, client project, gallery showcase, or creative campaign.
        </p>
      </div>

      <PortfolioForm categories={categories} />
    </div>
  );
}

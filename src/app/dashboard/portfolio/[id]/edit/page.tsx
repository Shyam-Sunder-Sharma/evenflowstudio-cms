import React from "react";
import { notFound } from "next/navigation";
import { getPortfolioProjectById } from "@/actions/portfolioActions";
import { getCategories } from "@/actions/categoryActions";
import { PortfolioForm } from "@/components/dashboard/PortfolioForm";


export default async function EditPortfolioProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, categories] = await Promise.all([
    getPortfolioProjectById(id),
    getCategories("portfolio"),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Edit Portfolio Project
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Update project details, gallery assets, client information, and publication status.
        </p>
      </div>

      <PortfolioForm initialData={project} categories={categories} />
    </div>
  );
}

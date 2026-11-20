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
      <div className="pb-2 border-b border-zinc-800/60">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
          Edit Portfolio Project
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Update case study assets, client information, bilingual slugs, and publication status.
        </p>
      </div>

      <PortfolioForm initialData={project} categories={categories} />
    </div>
  );
}

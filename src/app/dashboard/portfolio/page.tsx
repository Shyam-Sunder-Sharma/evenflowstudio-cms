import React from "react";
import Link from "next/link";
import { getPortfolioProjects } from "@/actions/portfolioActions";
import { getCategories } from "@/actions/categoryActions";
import { PortfolioTable } from "@/components/dashboard/PortfolioTable";
import { Plus } from "lucide-react";


export default async function PortfolioPage() {
  const [projects, categories] = await Promise.all([
    getPortfolioProjects(),
    getCategories("portfolio"),
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Portfolio Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Showcase client work, design case studies, bilingual URLs, multi-image galleries, and live links.
          </p>
        </div>
        <Link
          href="/dashboard/portfolio/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/25 transition shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      <PortfolioTable initialProjects={projects} categories={categories} />
    </div>
  );
}

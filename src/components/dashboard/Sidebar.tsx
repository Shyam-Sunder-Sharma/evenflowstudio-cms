"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  FolderTree,
  Blocks,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Code2,
  Database,
  Radio,
} from "lucide-react";
import { logoutAction } from "@/actions/authActions";

const NAV_EDITORIAL = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Blog Articles", href: "/dashboard/blogs", icon: FileText },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Briefcase },
];

const NAV_TAXONOMY = [
  { label: "Categories", href: "/dashboard/categories", icon: FolderTree },
];

const NAV_INTEGRATIONS = [
  { label: "Plugins & Webhooks", href: "/dashboard/plugins", icon: Blocks },
];

const SYSTEM_APIS = [
  { label: "Sanity Studio", href: "/studio", isExternal: true, icon: Database },
  { label: "Blogs API", href: "/api/public/blogs", isExternal: true, icon: FileText },
  { label: "Portfolio API", href: "/api/public/portfolio", isExternal: true, icon: Briefcase },
  { label: "Plugins API", href: "/api/public/plugins", isExternal: true, icon: Radio },
  { label: "XML Sitemap", href: "/api/public/sitemap.xml", isExternal: true, icon: Code2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0d0d0f] border-r border-zinc-800/80 p-4 text-zinc-300">
      {/* Studio Header */}
      <div className="flex items-center justify-between pb-5 pt-1 px-2 border-b border-zinc-800/70">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white text-xs font-mono font-bold group-hover:border-zinc-500 transition">
            EF
          </div>
          <div>
            <span className="font-semibold tracking-tight text-white text-sm block leading-tight">
              Evenflowstudio
            </span>
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Editorial CMS
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-5 space-y-6 overflow-y-auto pr-1">
        {/* Editorial Section */}
        <div className="space-y-1">
          <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Editorial
          </div>
          {NAV_EDITORIAL.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#ccff00]" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Taxonomy Section */}
        <div className="space-y-1">
          <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Taxonomy
          </div>
          {NAV_TAXONOMY.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#ccff00]" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Integrations */}
        <div className="space-y-1">
          <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Integrations
          </div>
          {NAV_INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition ${
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#ccff00]" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* System & Public APIs */}
        <div className="space-y-1">
          <div className="px-2.5 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            System & Endpoints
          </div>
          {SYSTEM_APIS.map((api) => {
            const Icon = api.icon;
            return (
              <Link
                key={api.href}
                href={api.href}
                target="_blank"
                className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 transition group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                  <span className="truncate">{api.label}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0 ml-1.5" />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer / Account */}
      <div className="pt-3 border-t border-zinc-800/70">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-zinc-900/40 border border-zinc-800/50">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-medium text-zinc-200 truncate">
              admin@evenflowstudio.com
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-zinc-400 font-mono">Connected</span>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top navbar button */}
      <div className="md:hidden flex items-center justify-between p-3.5 bg-[#0d0d0f] border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white text-xs font-mono font-bold">
            EF
          </div>
          <span className="font-semibold text-white text-sm">Evenflowstudio</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded text-zinc-300 hover:bg-zinc-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-72 h-full max-w-[85vw]">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}

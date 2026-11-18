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
  Sparkles,
  Menu,
  X,
  Code2,
} from "lucide-react";
import { logoutAction } from "@/actions/authActions";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Blog Posts", href: "/dashboard/blogs", icon: FileText },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: Briefcase },
  { label: "Categories", href: "/dashboard/categories", icon: FolderTree },
  { label: "Plugins", href: "/dashboard/plugins", icon: Blocks },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/80 p-5 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/60">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base block leading-tight">
              Evenflowstudio
            </span>
            <span className="text-xs text-indigo-400 font-medium tracking-wide">
              Headless CMS
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Management
        </div>
        {NAV_ITEMS.map((item) => {
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-6 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Studio & Public APIs
        </div>
        <Link
          href="/studio"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Sanity Studio</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </Link>
        <Link
          href="/api/public/blogs"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Public Blogs API</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </Link>
        <Link
          href="/api/public/portfolio"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>Public Portfolio API</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </Link>
        <Link
          href="/api/public/plugins"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <Blocks className="w-4 h-4 text-indigo-400" />
            <span>Public Plugins API</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </Link>
        <Link
          href="/api/public/settings"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <Blocks className="w-4 h-4 text-amber-400" />
            <span>Public Settings API</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </Link>
        <Link
          href="/api/public/sitemap.xml"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center gap-3">
            <Code2 className="w-4 h-4 text-rose-400" />
            <span>XML Sitemap</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </Link>
      </nav>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-slate-800/60">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="truncate">
            <p className="text-xs font-medium text-slate-300 truncate">
              admin@evenflowstudio.com
            </p>
            <p className="text-[11px] text-emerald-400 font-medium">Active Session</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top navbar button */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-white text-sm">Evenflowstudio</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-900"
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
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-72 h-full max-w-[80vw]">
            <NavContent />
          </div>
        </div>
      )}
    </>
  );
}

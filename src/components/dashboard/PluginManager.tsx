"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Image as ImageIcon,
  BarChart3,
  Webhook,
  Code2,
  ExternalLink,
  Settings,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Info,
  Check,
  Puzzle,
  Blocks,
  ArrowRight,
} from "lucide-react";
import {
  ActivePluginItem,
  togglePlugin,
  savePluginSettings,
} from "@/actions/pluginActions";
import { PluginCategory } from "@/lib/plugins/registry";

interface PluginManagerProps {
  initialPlugins: ActivePluginItem[];
}

const CATEGORIES: Array<"All" | PluginCategory> = [
  "All",
  "SEO",
  "Media",
  "Analytics",
  "Workflow",
  "Developer",
];

const ICON_MAP: Record<string, React.ElementType> = {
  Search,
  Image: ImageIcon,
  BarChart3,
  Webhook,
  Code: Code2,
};

export function PluginManager({ initialPlugins }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<ActivePluginItem[]>(initialPlugins);
  const [activeCategory, setActiveCategory] = useState<"All" | PluginCategory>("All");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Settings modal state
  const [selectedPlugin, setSelectedPlugin] = useState<ActivePluginItem | null>(null);
  const [formSettings, setFormSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredPlugins = plugins.filter((p) =>
    activeCategory === "All" ? true : p.category === activeCategory
  );

  const handleToggle = async (plugin: ActivePluginItem) => {
    const nextState = !plugin.enabled;
    setTogglingKey(plugin.key);

    const result = await togglePlugin(plugin.key, nextState);
    if (result.success) {
      setPlugins((prev) =>
        prev.map((p) => (p.key === plugin.key ? { ...p, enabled: nextState } : p))
      );
    }
    setTogglingKey(null);
  };

  const openConfigureModal = (plugin: ActivePluginItem) => {
    setSelectedPlugin(plugin);
    setFormSettings({ ...plugin.settings });
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlugin) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const result = await savePluginSettings(selectedPlugin.key, formSettings);
    if (result.success) {
      setPlugins((prev) =>
        prev.map((p) =>
          p.key === selectedPlugin.key ? { ...p, settings: { ...formSettings } } : p
        )
      );
      setSaveSuccess(true);
      setTimeout(() => {
        setSelectedPlugin(null);
        setSaveSuccess(false);
      }, 700);
    } else {
      setSaveError(result.error || "Failed to save settings.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Installed Architecture Info Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Blocks className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Modular Plugins & External Integrations Hub
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Extensible Architecture
                </span>
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Add, toggle, or configure third-party features and Sanity plugins on demand.
                Enabled configurations instantly sync to your public JSON endpoints (
                <code className="text-indigo-400 font-mono text-xs">/api/public/settings</code> &amp;{" "}
                <code className="text-indigo-400 font-mono text-xs">/api/public/sitemap.xml</code>
                ) for immediate consumption by your external PHP/WordPress frontend.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/api/public/settings"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <span>Test Public Settings API</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/studio"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition"
            >
              <span>Sanity Studio Media &amp; Vision</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const count =
            cat === "All"
              ? plugins.length
              : plugins.filter((p) => p.category === cat).length;
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map((plugin) => {
          const IconComponent = ICON_MAP[plugin.iconName] || Puzzle;
          const isToggling = togglingKey === plugin.key;

          return (
            <div
              key={plugin.key}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between p-6 backdrop-blur-sm relative overflow-hidden group ${
                plugin.enabled
                  ? "bg-slate-900/80 border-slate-700/80 shadow-lg shadow-indigo-950/20"
                  : "bg-slate-900/40 border-slate-800/80 opacity-80 hover:opacity-100"
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`p-3 rounded-xl border transition ${
                      plugin.enabled
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                        : "bg-slate-800/60 border-slate-700/50 text-slate-500"
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        plugin.enabled
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {plugin.enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {plugin.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                    {plugin.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {plugin.description}
                  </p>
                </div>
              </div>

              {/* Card Bottom / Action Toolbar */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openConfigureModal(plugin)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configure</span>
                  </button>

                  {plugin.externalLink && (
                    <Link
                      href={plugin.externalLink}
                      target="_blank"
                      className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Open tool in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(plugin)}
                  disabled={isToggling}
                  title={`Click to ${plugin.enabled ? "disable" : "enable"}`}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    plugin.enabled ? "bg-indigo-600" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      plugin.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configure Settings Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configure {selectedPlugin.name}
                  </h3>
                  <span className="text-xs text-indigo-400 font-medium">
                    {selectedPlugin.category} Settings
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlugin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSettings} className="space-y-4 mt-5">
              {saveError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Settings saved successfully!</span>
                </div>
              )}

              {selectedPlugin.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={formSettings[field.key] || ""}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={formSettings[field.key] || ""}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  )}
                  {field.helperText && (
                    <p className="text-[11px] text-slate-500">{field.helperText}</p>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Status: {selectedPlugin.enabled ? "Active" : "Disabled"}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlugin(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    <span>Save Configuration</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

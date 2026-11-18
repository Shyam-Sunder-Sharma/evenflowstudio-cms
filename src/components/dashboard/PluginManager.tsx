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
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Activity,
  Layers,
  Key,
  Globe,
  Radio,
  FileCode2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  PluginItem,
  getAllPlugins,
  togglePlugin,
  createPlugin,
  updatePlugin,
  deletePlugin,
  testPluginConnection,
  savePluginSettings,
} from "@/actions/pluginActions";
import { PluginCategory, PluginType } from "@/lib/plugins/registry";

interface PluginManagerProps {
  initialPlugins: PluginItem[];
}

const CATEGORIES: Array<"All" | PluginCategory> = [
  "All",
  "SEO",
  "Analytics",
  "Webhook",
  "Script / Embed",
  "Media",
  "Custom Integration",
];

const TRIGGER_EVENT_OPTIONS = [
  { id: "blog.published", label: "Blog Published", desc: "Fires when an article is published" },
  { id: "blog.updated", label: "Blog Updated", desc: "Fires when article content changes" },
  { id: "portfolio.published", label: "Portfolio Published", desc: "Fires when a case study goes live" },
  { id: "portfolio.updated", label: "Portfolio Updated", desc: "Fires when case study details change" },
  { id: "frontend.load", label: "Frontend Page Load", desc: "Script injected into website visitor pages" },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Search,
  Image: ImageIcon,
  BarChart3,
  Webhook,
  Code: Code2,
  Puzzle,
  Globe,
  Radio,
  FileCode2,
};

export function PluginManager({ initialPlugins }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<PluginItem[]>(initialPlugins);
  const [activeCategory, setActiveCategory] = useState<"All" | PluginCategory>("All");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Test connection state map: plugin.id -> result
  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        loading: boolean;
        success?: boolean;
        status?: number;
        statusText?: string;
        error?: string;
        latencyMs?: number;
      }
    >
  >({});

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<PluginItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Modal Form State
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<PluginCategory>("Custom Integration");
  const [formPluginType, setFormPluginType] = useState<PluginType>("webhook");
  const [formDescription, setFormDescription] = useState("");
  const [formEnabled, setFormEnabled] = useState(true);
  const [formEndpointOrScript, setFormEndpointOrScript] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formTriggerEvents, setFormTriggerEvents] = useState<string[]>([]);
  const [formCustomConfigJson, setFormCustomConfigJson] = useState("");
  const [formSettings, setFormSettings] = useState<Record<string, string>>({});

  // Delete Confirmation Modal state
  const [pluginToDelete, setPluginToDelete] = useState<PluginItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered plugins
  const filteredPlugins = plugins.filter((p) => {
    if (activeCategory === "All") return true;
    return p.category === activeCategory;
  });

  // Toggle plugin status
  const handleToggle = async (plugin: PluginItem) => {
    const nextState = !plugin.enabled;
    setTogglingId(plugin.id);

    const result = await togglePlugin(plugin.id, nextState);
    if (result.success) {
      setPlugins((prev) =>
        prev.map((p) => (p.id === plugin.id ? { ...p, enabled: nextState } : p))
      );
    }
    setTogglingId(null);
  };

  // Test connection
  const handleTestConnection = async (plugin: PluginItem) => {
    setTestResults((prev) => ({
      ...prev,
      [plugin.id]: { loading: true },
    }));

    const result = await testPluginConnection(plugin.id);

    setTestResults((prev) => ({
      ...prev,
      [plugin.id]: {
        loading: false,
        success: result.success,
        status: result.status,
        statusText: result.statusText,
        error: result.error,
        latencyMs: result.latencyMs,
      },
    }));
  };

  // Open modal in "Add New" mode
  const openAddModal = () => {
    setEditingPlugin(null);
    setFormName("");
    setFormSlug("");
    setFormCategory("Webhook");
    setFormPluginType("webhook");
    setFormDescription("");
    setFormEnabled(true);
    setFormEndpointOrScript("");
    setFormApiKey("");
    setFormTriggerEvents(["blog.published", "portfolio.published"]);
    setFormCustomConfigJson("");
    setFormSettings({});
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  // Open modal in "Edit / Configure" mode
  const openEditModal = (plugin: PluginItem) => {
    setEditingPlugin(plugin);
    setFormName(plugin.name);
    setFormSlug(plugin.slug || plugin.key);
    setFormCategory(plugin.category);
    setFormPluginType(plugin.pluginType);
    setFormDescription(plugin.description || "");
    setFormEnabled(plugin.enabled);
    setFormEndpointOrScript(plugin.endpointOrScript || "");
    setFormApiKey(plugin.apiKey || "");
    setFormTriggerEvents(plugin.triggerEvents || []);
    setFormCustomConfigJson(plugin.customConfigJson || "");
    setFormSettings({ ...plugin.settings });
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    setModalSuccess(false);

    if (!formName.trim()) {
      setModalError("Plugin name is required.");
      setIsSaving(false);
      return;
    }

    try {
      if (editingPlugin) {
        // Update existing plugin
        const result = await updatePlugin(editingPlugin.id, {
          name: formName,
          category: formCategory,
          pluginType: formPluginType,
          description: formDescription,
          enabled: formEnabled,
          endpointOrScript: formEndpointOrScript,
          apiKey: formApiKey,
          triggerEvents: formTriggerEvents,
          customConfigJson: formCustomConfigJson,
          settings: formSettings,
        });

        if (result.error) {
          setModalError(result.error);
        } else {
          setModalSuccess(true);
          // Refresh list from server
          const refreshed = await getAllPlugins();
          setPlugins(refreshed);
          setTimeout(() => {
            setIsModalOpen(false);
            setModalSuccess(false);
          }, 600);
        }
      } else {
        // Create brand new plugin
        const result = await createPlugin({
          name: formName,
          slug: formSlug,
          category: formCategory,
          pluginType: formPluginType,
          description: formDescription,
          enabled: formEnabled,
          endpointOrScript: formEndpointOrScript,
          apiKey: formApiKey,
          triggerEvents: formTriggerEvents,
          customConfigJson: formCustomConfigJson,
        });

        if (result.error) {
          setModalError(result.error);
        } else {
          setModalSuccess(true);
          const refreshed = await getAllPlugins();
          setPlugins(refreshed);
          setTimeout(() => {
            setIsModalOpen(false);
            setModalSuccess(false);
          }, 600);
        }
      }
    } catch (err: any) {
      setModalError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!pluginToDelete) return;
    setIsDeleting(true);

    try {
      const result = await deletePlugin(pluginToDelete.id);
      if (result.error) {
        alert(result.error);
      } else {
        setPlugins((prev) => prev.filter((p) => p.id !== pluginToDelete.id));
        setPluginToDelete(null);
      }
    } catch (err: any) {
      alert("Failed to delete plugin: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTriggerEvent = (eventId: string) => {
    if (formTriggerEvents.includes(eventId)) {
      setFormTriggerEvents(formTriggerEvents.filter((id) => id !== eventId));
    } else {
      setFormTriggerEvents([...formTriggerEvents, eventId]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Plugins &amp; Integrations</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-medium">
              v2 Dynamic Architecture
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Activate built-in extensions or register custom webhooks, frontend scripts, and API connectors anytime without touching code.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Plugin</span>
          </button>
        </div>
      </div>

      {/* Installed Architecture Info Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Blocks className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Modular Plugins &amp; External Integrations Hub
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Extensible Runtime
                </span>
              </h2>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Registered plugins dynamically inject into your website runtime or fire upon content publishing events.
                Active plugins instantly synchronize to public JSON endpoints (
                <code className="text-indigo-400 font-mono text-xs">/api/public/plugins</code> &amp;{" "}
                <code className="text-indigo-400 font-mono text-xs">/api/public/settings</code>
                ) for consumption by external PHP/WordPress frontends.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/api/public/plugins"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <span>Public Plugins API</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/api/public/settings"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            >
              <span>Public Settings API</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              href="/studio"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition"
            >
              <span>Sanity Studio</span>
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
          const IconComponent = ICON_MAP[plugin.iconName || ""] || Puzzle;
          const isToggling = togglingId === plugin.id;
          const testState = testResults[plugin.id];
          const canTest =
            plugin.pluginType === "webhook" || plugin.pluginType === "api_connector";

          return (
            <div
              key={plugin.id}
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

                  <div className="flex items-center gap-1.5">
                    {/* Built-in vs Custom Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        plugin.isBuiltIn
                          ? "bg-slate-800 text-slate-400 border border-slate-700"
                          : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                      }`}
                    >
                      {plugin.isBuiltIn ? "Built-in" : "Custom"}
                    </span>

                    {/* Active / Inactive Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        plugin.enabled
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {plugin.enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      {plugin.category}
                    </span>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-[10px] font-mono text-indigo-400">
                      {plugin.pluginType}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition flex items-center gap-2">
                    {plugin.name}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {plugin.description || "No description provided."}
                  </p>
                </div>

                {/* Endpoint or Script Preview */}
                {plugin.endpointOrScript && (
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 font-mono text-[11px] text-slate-400 truncate">
                    <span className="text-slate-500 select-none">Target: </span>
                    <span className="text-slate-300">{plugin.endpointOrScript}</span>
                  </div>
                )}

                {/* Trigger Events badges */}
                {plugin.triggerEvents && plugin.triggerEvents.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {plugin.triggerEvents.map((evt, idx) => (
                      <span
                        key={`${evt}-${idx}`}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/90 text-indigo-300 font-mono"
                      >
                        ⚡ {evt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Live Test Status Feedback */}
                {testState && (
                  <div className="mt-3">
                    {testState.loading ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-300 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Pinging endpoint...</span>
                      </div>
                    ) : testState.success ? (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>HTTP {testState.status} {testState.statusText}</span>
                        </div>
                        <span className="text-[11px] text-emerald-500">{testState.latencyMs}ms</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{testState.error || `HTTP ${testState.status}`}</span>
                        </div>
                        {testState.latencyMs !== undefined && (
                          <span className="text-[11px] text-rose-500 shrink-0 ml-1">{testState.latencyMs}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Bottom / Action Toolbar */}
              <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Configure / Edit */}
                  <button
                    type="button"
                    onClick={() => openEditModal(plugin)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configure</span>
                  </button>

                  {/* Test Connection Button (for webhooks/APIs) */}
                  {canTest && (
                    <button
                      type="button"
                      onClick={() => handleTestConnection(plugin)}
                      disabled={testState?.loading}
                      title="Send test ping"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-indigo-400" />
                      <span className="text-[11px]">Test</span>
                    </button>
                  )}

                  {/* External Tool Link */}
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

                  {/* Delete Button (custom plugins only) */}
                  {!plugin.isBuiltIn && (
                    <button
                      type="button"
                      onClick={() => setPluginToDelete(plugin)}
                      className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-500/40 transition cursor-pointer"
                      title="Delete custom plugin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      {/* Add / Edit Plugin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {editingPlugin ? <Settings className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingPlugin ? `Configure ${editingPlugin.name}` : "Register New Custom Plugin"}
                  </h3>
                  <span className="text-xs text-indigo-400 font-medium">
                    {editingPlugin
                      ? editingPlugin.isBuiltIn
                        ? "Built-in System Settings"
                        : "Custom Plugin Definition"
                      : "Add Webhook, Tag Injector, or API Connector"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Plugin saved successfully!</span>
                </div>
              )}

              {/* Plugin Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Plugin Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Discord Deployment Webhook"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Plugin Key / Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    disabled={editingPlugin?.isBuiltIn}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. discord-webhook"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Category & Plugin Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PluginCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Webhook">Webhook</option>
                    <option value="Script / Embed">Script / Embed</option>
                    <option value="Analytics">Analytics</option>
                    <option value="SEO">SEO</option>
                    <option value="Media">Media</option>
                    <option value="Custom Integration">Custom Integration</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Plugin Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formPluginType}
                    disabled={editingPlugin?.isBuiltIn}
                    onChange={(e) => setFormPluginType(e.target.value as PluginType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="webhook">Webhook Trigger (HTTP POST)</option>
                    <option value="script_inject">Frontend Script / Tag Injector</option>
                    <option value="api_connector">External API Connector</option>
                    <option value="studio_tool">Sanity Studio Tool</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize what this plugin triggers or manages..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Dynamic Target Endpoint or Script Snippet */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {formPluginType === "webhook"
                    ? "Webhook Destination URL (HTTP POST Target)"
                    : formPluginType === "script_inject"
                    ? "Frontend Script Tag / HTML Embed (<script>...)"
                    : formPluginType === "api_connector"
                    ? "External API Base URL"
                    : "Studio Tool Route / Relative Path"}
                </label>
                {formPluginType === "script_inject" ? (
                  <textarea
                    rows={4}
                    value={formEndpointOrScript}
                    onChange={(e) => setFormEndpointOrScript(e.target.value)}
                    placeholder="<script async src='https://.../script.js'></script>"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                  />
                ) : (
                  <input
                    type="text"
                    value={formEndpointOrScript}
                    onChange={(e) => setFormEndpointOrScript(e.target.value)}
                    placeholder={
                      formPluginType === "webhook"
                        ? "https://your-domain.com/api/webhook"
                        : formPluginType === "api_connector"
                        ? "https://api.thirdparty.com/v1"
                        : "/studio/vision"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                )}
                <p className="text-[11px] text-slate-500">
                  {formPluginType === "webhook"
                    ? "Payload will be sent via HTTP POST with automatic event signature headers."
                    : formPluginType === "script_inject"
                    ? "Exposed via /api/public/plugins so external PHP pages can inject tracking/embed code."
                    : "Managed endpoint for external system queries."}
                </p>
              </div>

              {/* API Key / Secret Token (for webhooks & APIs) */}
              {(formPluginType === "webhook" || formPluginType === "api_connector") && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    API Key / Secret Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Sent via Authorization: Bearer <key> header"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              {/* Trigger Events Checkboxes */}
              {(formPluginType === "webhook" || formPluginType === "api_connector") && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Auto-Trigger Events
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    {TRIGGER_EVENT_OPTIONS.map((opt) => {
                      const isChecked = formTriggerEvents.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition text-xs ${
                            isChecked
                              ? "bg-indigo-600/15 border border-indigo-500/30 text-white"
                              : "hover:bg-slate-800/50 text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTriggerEvent(opt.id)}
                            className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-semibold text-white block">{opt.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{opt.id}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Built-in specific settings fields (if editing a built-in plugin with schema fields) */}
              {editingPlugin?.fields && editingPlugin.fields.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    System Plugin Parameters
                  </h4>
                  {editingPlugin.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-xs font-medium text-slate-300">
                        {field.label}
                      </label>
                      <input
                        type={field.type === "url" ? "url" : "text"}
                        value={formSettings[field.key] || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            [field.key]: e.target.value,
                          })
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {field.helperText && (
                        <p className="text-[10px] text-slate-500">{field.helperText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Custom JSON Configuration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Custom JSON Settings (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formCustomConfigJson}
                  onChange={(e) => setFormCustomConfigJson(e.target.value)}
                  placeholder='{"channel": "general", "retryAttempts": 3}'
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-slate-500">
                  Arbitrary JSON object passed to the plugin runner and exposed in public endpoints.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enable immediately upon saving</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                    <span>{editingPlugin ? "Save Changes" : "Create Plugin"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pluginToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Plugin</h3>
                <span className="text-xs text-rose-400">Irreversible Action</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">{pluginToDelete.name}</strong>?
              This will remove the plugin and its trigger subscriptions permanently from Sanity Content Lake.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPluginToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

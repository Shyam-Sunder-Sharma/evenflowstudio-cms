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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Plugins &amp; Integrations
            </h1>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/80">
              v2 Engine
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure system plugins, webhooks, frontend embed tags, and external API connectors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plugin</span>
          </button>
        </div>
      </div>

      {/* Info Overview Card */}
      <div className="rounded-lg bg-[#111113] border border-zinc-800/80 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
              <Blocks className="w-4 h-4 text-[#ccff00]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                Extensible Runtime &amp; Public Endpoints
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Active plugins instantly synchronize to public JSON endpoints (<code className="text-zinc-200 font-mono text-[11px]">/api/public/plugins</code> &amp; <code className="text-zinc-200 font-mono text-[11px]">/api/public/settings</code>) to drive frontend scripts, analytics tags, and external webhook triggers.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/api/public/plugins"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-800 transition"
            >
              <span>Plugins API</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </Link>
            <Link
              href="/api/public/settings"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-800 transition"
            >
              <span>Settings API</span>
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition cursor-pointer ${
                isActive
                  ? "bg-zinc-800 text-white font-medium shadow-sm"
                  : "bg-[#111113] text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isActive ? "bg-zinc-700 text-white" : "text-zinc-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => {
          const IconComponent = ICON_MAP[plugin.iconName || ""] || Puzzle;
          const isToggling = togglingId === plugin.id;
          const testState = testResults[plugin.id];
          const canTest =
            plugin.pluginType === "webhook" || plugin.pluginType === "api_connector";

          return (
            <div
              key={plugin.id}
              className={`rounded-lg border transition-all duration-150 flex flex-col justify-between p-5 ${
                plugin.enabled
                  ? "bg-[#111113] border-zinc-700/80"
                  : "bg-[#111113]/50 border-zinc-800/80 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div
                    className={`p-2.5 rounded-md border ${
                      plugin.enabled
                        ? "bg-zinc-900 border-zinc-700 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-600"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Built-in vs Custom Badge */}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {plugin.isBuiltIn ? "Built-in" : "Custom"}
                    </span>

                    {/* Active / Inactive Badge */}
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        plugin.enabled
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                      }`}
                    >
                      {plugin.enabled ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    <span>{plugin.category}</span>
                    <span>•</span>
                    <span className="text-zinc-400">{plugin.pluginType}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    {plugin.name}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mt-1">
                    {plugin.description || "No description provided."}
                  </p>
                </div>

                {/* Endpoint or Script Preview */}
                {plugin.endpointOrScript && (
                  <div className="mt-3 p-2 rounded-md bg-[#09090b] border border-zinc-800 font-mono text-[10px] text-zinc-400 truncate">
                    <span className="text-zinc-600 select-none">Target: </span>
                    <span className="text-zinc-300">{plugin.endpointOrScript}</span>
                  </div>
                )}

                {/* Trigger Events badges */}
                {plugin.triggerEvents && plugin.triggerEvents.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {plugin.triggerEvents.map((evt, idx) => (
                      <span
                        key={`${evt}-${idx}`}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono"
                      >
                        ⚡ {evt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Live Test Status Feedback */}
                {testState && (
                  <div className="mt-2.5">
                    {testState.loading ? (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-[#ccff00]" />
                        <span className="font-mono text-[11px]">Pinging endpoint...</span>
                      </div>
                    ) : testState.success ? (
                      <div className="flex items-center justify-between p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>HTTP {testState.status} {testState.statusText}</span>
                        </div>
                        <span className="text-[10px] text-emerald-500">{testState.latencyMs}ms</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-mono">
                        <div className="flex items-center gap-1.5 truncate">
                          <XCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{testState.error || `HTTP ${testState.status}`}</span>
                        </div>
                        {testState.latencyMs !== undefined && (
                          <span className="text-[10px] text-rose-500 shrink-0 ml-1">{testState.latencyMs}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Bottom / Action Toolbar */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Configure / Edit */}
                  <button
                    type="button"
                    onClick={() => openEditModal(plugin)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono border border-zinc-800 transition cursor-pointer"
                  >
                    <Settings className="w-3 h-3 text-zinc-400" />
                    <span>Configure</span>
                  </button>

                  {/* Test Connection Button */}
                  {canTest && (
                    <button
                      type="button"
                      onClick={() => handleTestConnection(plugin)}
                      disabled={testState?.loading}
                      title="Send test ping"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-800 transition cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-2.5 h-2.5 text-[#ccff00]" />
                      <span className="text-[11px]">Test</span>
                    </button>
                  )}

                  {/* External Tool Link */}
                  {plugin.externalLink && (
                    <Link
                      href={plugin.externalLink}
                      target="_blank"
                      className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition"
                      title="Open external documentation"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  {/* Delete Button (custom plugins only) */}
                  {!plugin.isBuiltIn && (
                    <button
                      type="button"
                      onClick={() => setPluginToDelete(plugin)}
                      className="p-1 rounded-md bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 border border-zinc-800 transition cursor-pointer"
                      title="Delete custom plugin"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(plugin)}
                  disabled={isToggling}
                  title={`Click to ${plugin.enabled ? "disable" : "enable"}`}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    plugin.enabled ? "bg-[#ccff00]" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-sm transition duration-200 ease-in-out mt-0.5 ${
                      plugin.enabled ? "translate-x-4 bg-black" : "translate-x-0.5 bg-zinc-400"
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
          <div className="w-full max-w-xl my-8 rounded-lg bg-[#111113] border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#0d0d0f]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {editingPlugin ? <Settings className="w-4 h-4 text-[#ccff00]" /> : <Plus className="w-4 h-4 text-[#ccff00]" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                    {editingPlugin ? `Configure ${editingPlugin.name}` : "Register Custom Plugin"}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {editingPlugin
                      ? editingPlugin.isBuiltIn
                        ? "Built-in System Parameters"
                        : "Custom Plugin Specification"
                      : "Add Webhook, Tag Injector, or API Connector"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Plugin configuration saved.</span>
                </div>
              )}

              {/* Plugin Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400">
                    Plugin Name <span className="text-[#ccff00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Discord Deployment Webhook"
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400">
                    Plugin Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    disabled={editingPlugin?.isBuiltIn}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. discord-webhook"
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono disabled:opacity-50 transition"
                  />
                </div>
              </div>

              {/* Category & Plugin Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400">
                    Category <span className="text-[#ccff00]">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PluginCategory)}
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    <option value="Webhook" className="bg-[#111113]">Webhook</option>
                    <option value="Script / Embed" className="bg-[#111113]">Script / Embed</option>
                    <option value="Analytics" className="bg-[#111113]">Analytics</option>
                    <option value="SEO" className="bg-[#111113]">SEO</option>
                    <option value="Media" className="bg-[#111113]">Media</option>
                    <option value="Custom Integration" className="bg-[#111113]">Custom Integration</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400">
                    Plugin Type <span className="text-[#ccff00]">*</span>
                  </label>
                  <select
                    value={formPluginType}
                    disabled={editingPlugin?.isBuiltIn}
                    onChange={(e) => setFormPluginType(e.target.value as PluginType)}
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 cursor-pointer disabled:opacity-50"
                  >
                    <option value="webhook" className="bg-[#111113]">Webhook Trigger (HTTP POST)</option>
                    <option value="script_inject" className="bg-[#111113]">Frontend Script / Tag Injector</option>
                    <option value="api_connector" className="bg-[#111113]">External API Connector</option>
                    <option value="studio_tool" className="bg-[#111113]">Sanity Studio Tool</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-zinc-400">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summarize what this integration triggers or manages..."
                  className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 leading-relaxed transition"
                />
              </div>

              {/* Dynamic Target Endpoint or Script Snippet */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-zinc-400">
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
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono leading-relaxed transition"
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
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                  />
                )}
                <p className="text-[10px] text-zinc-500 font-mono">
                  {formPluginType === "webhook"
                    ? "Payload will be sent via HTTP POST with automatic event signature headers."
                    : formPluginType === "script_inject"
                    ? "Exposed via /api/public/plugins so frontend pages can inject tracking code."
                    : "Managed endpoint for external queries."}
                </p>
              </div>

              {/* API Key / Secret Token */}
              {(formPluginType === "webhook" || formPluginType === "api_connector") && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400">
                    API Key / Secret Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder="Sent via Authorization: Bearer <key> header"
                    className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono transition"
                  />
                </div>
              )}

              {/* Trigger Events Checkboxes */}
              {(formPluginType === "webhook" || formPluginType === "api_connector") && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase text-zinc-400">
                    Auto-Trigger Events
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-md bg-[#09090b] border border-zinc-800">
                    {TRIGGER_EVENT_OPTIONS.map((opt) => {
                      const isChecked = formTriggerEvents.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition text-xs ${
                            isChecked
                              ? "bg-zinc-800/80 text-white"
                              : "hover:bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTriggerEvent(opt.id)}
                            className="mt-0.5 rounded border-zinc-700 text-black focus:ring-zinc-500"
                          />
                          <div>
                            <span className="font-medium text-white block text-xs">{opt.label}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{opt.id}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Built-in specific settings fields */}
              {editingPlugin?.fields && editingPlugin.fields.length > 0 && (
                <div className="space-y-2.5 pt-2.5 border-t border-zinc-800">
                  <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    System Parameters
                  </h4>
                  {editingPlugin.fields.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-zinc-400">
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
                        className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white font-mono focus:outline-none focus:border-zinc-500 transition"
                      />
                      {field.helperText && (
                        <p className="text-[10px] text-zinc-500 font-mono">{field.helperText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Custom JSON Configuration */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-zinc-400">
                  Custom JSON Settings (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formCustomConfigJson}
                  onChange={(e) => setFormCustomConfigJson(e.target.value)}
                  placeholder='{"channel": "general", "retryAttempts": 3}'
                  className="w-full px-3 py-1.5 rounded-md bg-[#09090b] border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono leading-relaxed transition"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 font-mono">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="rounded border-zinc-700 text-black focus:ring-zinc-500"
                  />
                  <span>Enable upon saving</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3.5 py-1.5 rounded-md bg-[#ccff00] hover:bg-[#b8e600] text-black text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {isSaving && (
                      <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
          <div className="w-full max-w-md rounded-lg bg-[#111113] border border-zinc-800 p-5 shadow-2xl text-zinc-100">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Delete Plugin</h3>
                <span className="text-[10px] text-rose-400 font-mono">Irreversible Action</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Are you sure you want to delete <strong className="text-white">{pluginToDelete.name}</strong>?
              This will remove the plugin and its trigger subscriptions from Sanity Content Lake.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPluginToDelete(null)}
                className="px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

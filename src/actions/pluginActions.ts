"use server";

import { revalidatePath } from "next/cache";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/writeClient";
import {
  AVAILABLE_PLUGINS,
  PluginDefinition,
  PluginCategory,
  PluginType,
} from "@/lib/plugins/registry";
import { slugify } from "@/lib/sanity-helpers";

export interface PluginItem {
  id: string;
  key: string;
  name: string;
  slug: string;
  category: PluginCategory;
  pluginType: PluginType;
  description: string;
  enabled: boolean;
  isBuiltIn: boolean;
  endpointOrScript?: string;
  apiKey?: string;
  triggerEvents?: string[];
  customConfigJson?: string;
  installedAt?: string;
  settings: Record<string, string>;
  iconName?: string;
  externalLink?: string;
  fields?: any[];
}

// Backward compatibility interface
export type ActivePluginItem = PluginItem;

interface CmsPluginDoc {
  _id: string;
  name: string;
  slug?: { current: string };
  category: PluginCategory;
  pluginType: PluginType;
  description?: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  endpointOrScript?: string;
  apiKey?: string;
  triggerEvents?: string[];
  customConfigJson?: string;
  installedAt?: string;
  pluginKey?: string; // legacy support
}

interface LegacyPluginConfigDoc {
  _id: string;
  pluginKey: string;
  name: string;
  category: string;
  description?: string;
  enabled: boolean;
  settingsJson?: string;
}

/**
 * Merges built-in plugins with custom cmsPlugin documents stored in Sanity.
 */
export async function getAllPlugins(): Promise<PluginItem[]> {
  try {
    // 1. Fetch all cmsPlugin documents
    const cmsDocs = await client.fetch<CmsPluginDoc[]>(
      `*[_type == "cmsPlugin"] | order(isBuiltIn desc, installedAt desc, _createdAt desc)`,
      {},
      { cache: "no-store" }
    ).catch(() => []);

    // 2. Fetch any legacy pluginConfig documents for backward compatibility
    const legacyDocs = await client.fetch<LegacyPluginConfigDoc[]>(
      `*[_type == "pluginConfig"]`,
      {},
      { cache: "no-store" }
    ).catch(() => []);

    const legacyMap = new Map<string, LegacyPluginConfigDoc>();
    legacyDocs.forEach((doc) => legacyMap.set(doc.pluginKey, doc));

    const cmsMap = new Map<string, CmsPluginDoc>();
    cmsDocs.forEach((doc) => {
      const slugVal = doc.slug?.current || doc.pluginKey;
      if (slugVal) cmsMap.set(slugVal, doc);
      if (doc._id) cmsMap.set(doc._id, doc);
    });

    // 3. Process built-in plugins
    const processedBuiltInKeys = new Set<string>();
    const builtInItems: PluginItem[] = AVAILABLE_PLUGINS.map((def) => {
      processedBuiltInKeys.add(def.key);

      const cmsDoc = cmsMap.get(def.key);
      const legacyDoc = legacyMap.get(def.key);

      let settings: Record<string, string> = { ...def.defaultSettings };
      let enabled = def.defaultEnabled;
      let endpointOrScript = def.endpointOrScript || "";
      let apiKey = "";
      let triggerEvents = def.triggerEvents || [];
      let customConfigJson = "";
      let docId = cmsDoc?._id || legacyDoc?._id || def.key;

      if (cmsDoc) {
        enabled = Boolean(cmsDoc.enabled);
        if (cmsDoc.endpointOrScript) endpointOrScript = cmsDoc.endpointOrScript;
        if (cmsDoc.apiKey) apiKey = cmsDoc.apiKey;
        if (cmsDoc.triggerEvents) triggerEvents = cmsDoc.triggerEvents;
        if (cmsDoc.customConfigJson) {
          customConfigJson = cmsDoc.customConfigJson;
          try {
            settings = { ...settings, ...JSON.parse(cmsDoc.customConfigJson) };
          } catch {}
        }
      } else if (legacyDoc) {
        enabled = Boolean(legacyDoc.enabled);
        if (legacyDoc.settingsJson) {
          try {
            const parsed = JSON.parse(legacyDoc.settingsJson);
            settings = { ...settings, ...parsed };
          } catch {}
        }
      }

      return {
        id: docId,
        key: def.key,
        name: def.name,
        slug: def.key,
        category: def.category,
        pluginType: def.pluginType,
        description: def.description,
        enabled,
        isBuiltIn: true,
        endpointOrScript,
        apiKey,
        triggerEvents,
        customConfigJson,
        installedAt: cmsDoc?.installedAt,
        settings,
        iconName: def.iconName,
        externalLink: def.externalLink,
        fields: def.fields,
      };
    });

    // 4. Process custom cmsPlugin documents (not matching any built-in key)
    const customItems: PluginItem[] = cmsDocs
      .filter((doc) => {
        const slugVal = doc.slug?.current || doc.pluginKey || "";
        return !processedBuiltInKeys.has(slugVal) && doc.isBuiltIn !== true;
      })
      .map((doc) => {
        const slugVal = doc.slug?.current || slugify(doc.name);
        let settings: Record<string, string> = {};
        if (doc.customConfigJson) {
          try {
            settings = JSON.parse(doc.customConfigJson);
          } catch {}
        }

        return {
          id: doc._id,
          key: slugVal,
          name: doc.name,
          slug: slugVal,
          category: doc.category || "Custom Integration",
          pluginType: doc.pluginType || "webhook",
          description: doc.description || "",
          enabled: Boolean(doc.enabled),
          isBuiltIn: false,
          endpointOrScript: doc.endpointOrScript || "",
          apiKey: doc.apiKey || "",
          triggerEvents: doc.triggerEvents || [],
          customConfigJson: doc.customConfigJson || "",
          installedAt: doc.installedAt || new Date().toISOString(),
          settings,
          iconName: "Puzzle",
        };
      });

    return [...builtInItems, ...customItems];
  } catch (error) {
    console.error("Error fetching all plugins:", error);
    return AVAILABLE_PLUGINS.map((def) => ({
      id: def.key,
      key: def.key,
      name: def.name,
      slug: def.key,
      category: def.category,
      pluginType: def.pluginType,
      description: def.description,
      enabled: def.defaultEnabled,
      isBuiltIn: true,
      endpointOrScript: def.endpointOrScript || "",
      triggerEvents: def.triggerEvents || [],
      settings: { ...def.defaultSettings },
      iconName: def.iconName,
      externalLink: def.externalLink,
      fields: def.fields,
    }));
  }
}

/**
 * Backward compatibility alias for getPlugins().
 */
export async function getPlugins(): Promise<PluginItem[]> {
  return getAllPlugins();
}

/**
 * Returns configuration and enabled status for a single plugin.
 */
export async function getPluginConfig(pluginKey: string): Promise<{
  enabled: boolean;
  settings: Record<string, string>;
}> {
  try {
    const plugins = await getAllPlugins();
    const plugin = plugins.find((p) => p.key === pluginKey || p.slug === pluginKey || p.id === pluginKey);
    return {
      enabled: plugin ? plugin.enabled : false,
      settings: plugin?.settings || {},
    };
  } catch {
    const def = AVAILABLE_PLUGINS.find((p) => p.key === pluginKey);
    return {
      enabled: def?.defaultEnabled || false,
      settings: def?.defaultSettings || {},
    };
  }
}

/**
 * Creates a new custom cmsPlugin in Sanity Content Lake.
 */
export async function createPlugin(data: {
  name: string;
  slug?: string;
  category: PluginCategory;
  pluginType: PluginType;
  description?: string;
  enabled?: boolean;
  endpointOrScript?: string;
  apiKey?: string;
  triggerEvents?: string[];
  customConfigJson?: string;
}) {
  const name = data.name?.trim();
  if (!name) return { error: "Plugin name is required." };
  if (!data.category) return { error: "Category is required." };
  if (!data.pluginType) return { error: "Plugin type is required." };

  const rawSlug = data.slug?.trim() || name;
  const slugCurrent = slugify(rawSlug);

  try {
    // Check if slug is already taken
    const existing = await client.fetch<string | null>(
      `*[_type == "cmsPlugin" && slug.current == $slug][0]._id`,
      { slug: slugCurrent },
      { cache: "no-store" }
    );
    if (existing) {
      return { error: `A plugin with the slug '${slugCurrent}' already exists.` };
    }

    const doc = {
      _type: "cmsPlugin",
      name,
      slug: { _type: "slug", current: slugCurrent },
      category: data.category,
      pluginType: data.pluginType,
      description: data.description?.trim() || "",
      enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
      isBuiltIn: false,
      endpointOrScript: data.endpointOrScript?.trim() || "",
      apiKey: data.apiKey?.trim() || "",
      triggerEvents: data.triggerEvents || [],
      customConfigJson: data.customConfigJson?.trim() || "",
      installedAt: new Date().toISOString(),
    };

    const created = await writeClient.create(doc);
    revalidatePath("/dashboard/plugins");
    revalidatePath("/api/public/settings");
    revalidatePath("/api/public/plugins");
    return { success: true, id: created._id };
  } catch (error: any) {
    console.error("Create plugin error:", error);
    return { error: error.message || "Failed to create plugin." };
  }
}

/**
 * Updates an existing plugin document in Sanity.
 */
export async function updatePlugin(
  id: string,
  data: {
    name?: string;
    category?: PluginCategory;
    pluginType?: PluginType;
    description?: string;
    enabled?: boolean;
    endpointOrScript?: string;
    apiKey?: string;
    triggerEvents?: string[];
    customConfigJson?: string;
    settings?: Record<string, string>;
  }
) {
  if (!id) return { error: "Plugin ID is required." };

  try {
    // Check if it's a built-in plugin referenced by its key (e.g., 'seo-manager')
    const builtInDef = AVAILABLE_PLUGINS.find((p) => p.key === id);

    if (builtInDef && !id.includes("-") && !id.startsWith("drafts.")) {
      // If updating a built-in plugin that isn't a sanity document ID, check or create cmsPlugin doc
      const existingDoc = await client.fetch<CmsPluginDoc | null>(
        `*[_type == "cmsPlugin" && (slug.current == $id || pluginKey == $id)][0]`,
        { id },
        { cache: "no-store" }
      );

      if (existingDoc?._id) {
        id = existingDoc._id;
      } else {
        const created = await writeClient.create({
          _type: "cmsPlugin",
          name: builtInDef.name,
          slug: { _type: "slug", current: builtInDef.key },
          category: builtInDef.category,
          pluginType: builtInDef.pluginType,
          description: builtInDef.description,
          enabled: data.enabled !== undefined ? data.enabled : builtInDef.defaultEnabled,
          isBuiltIn: true,
          endpointOrScript: data.endpointOrScript || builtInDef.endpointOrScript || "",
          apiKey: data.apiKey || "",
          triggerEvents: data.triggerEvents || builtInDef.triggerEvents || [],
          customConfigJson: data.customConfigJson || (data.settings ? JSON.stringify(data.settings) : ""),
          installedAt: new Date().toISOString(),
        });
        id = created._id;
      }
    }

    const patch = writeClient.patch(id);
    const setFields: Record<string, any> = {};

    if (data.name !== undefined) setFields.name = data.name.trim();
    if (data.category !== undefined) setFields.category = data.category;
    if (data.pluginType !== undefined) setFields.pluginType = data.pluginType;
    if (data.description !== undefined) setFields.description = data.description.trim();
    if (data.enabled !== undefined) setFields.enabled = Boolean(data.enabled);
    if (data.endpointOrScript !== undefined) setFields.endpointOrScript = data.endpointOrScript.trim();
    if (data.apiKey !== undefined) setFields.apiKey = data.apiKey.trim();
    if (data.triggerEvents !== undefined) setFields.triggerEvents = data.triggerEvents;
    if (data.customConfigJson !== undefined) setFields.customConfigJson = data.customConfigJson.trim();

    // If settings object is provided, also update customConfigJson
    if (data.settings && !setFields.customConfigJson) {
      setFields.customConfigJson = JSON.stringify(data.settings);
    }

    await patch.set(setFields).commit();

    // Also update legacy pluginConfig if this was a built-in key
    if (builtInDef) {
      const legacyDoc = await client.fetch<any>(
        `*[_type == "pluginConfig" && pluginKey == $key][0]`,
        { key: builtInDef.key },
        { cache: "no-store" }
      );
      if (legacyDoc?._id) {
        const legacyPatch: Record<string, any> = {};
        if (data.enabled !== undefined) legacyPatch.enabled = data.enabled;
        if (data.settings) legacyPatch.settingsJson = JSON.stringify(data.settings);
        await writeClient.patch(legacyDoc._id).set(legacyPatch).commit();
      }
    }

    revalidatePath("/dashboard/plugins");
    revalidatePath("/api/public/settings");
    revalidatePath("/api/public/plugins");
    revalidatePath("/api/public/sitemap.xml");
    return { success: true };
  } catch (error: any) {
    console.error("Update plugin error:", error);
    return { error: error.message || "Failed to update plugin." };
  }
}

/**
 * Deletes a custom plugin. Built-in system plugins cannot be deleted.
 */
export async function deletePlugin(id: string) {
  if (!id) return { error: "Plugin ID is required." };

  try {
    // Check if it's built-in
    const builtInDef = AVAILABLE_PLUGINS.find((p) => p.key === id);
    if (builtInDef) {
      return { error: "Built-in system plugins cannot be deleted." };
    }

    const doc = await client.fetch<CmsPluginDoc | null>(
      `*[_type == "cmsPlugin" && _id == $id][0]`,
      { id },
      { cache: "no-store" }
    );

    if (doc?.isBuiltIn) {
      return { error: "Built-in system plugins cannot be deleted." };
    }

    await writeClient.delete(id);
    revalidatePath("/dashboard/plugins");
    revalidatePath("/api/public/settings");
    revalidatePath("/api/public/plugins");
    return { success: true };
  } catch (error: any) {
    console.error("Delete plugin error:", error);
    return { error: error.message || "Failed to delete plugin." };
  }
}

/**
 * Toggles a plugin's enabled status.
 */
export async function togglePlugin(pluginKeyOrId: string, enabled: boolean) {
  try {
    // Check if pluginKeyOrId matches a built-in key
    const builtInDef = AVAILABLE_PLUGINS.find((p) => p.key === pluginKeyOrId);

    // Try finding cmsPlugin doc
    const cmsDoc = await client.fetch<CmsPluginDoc | null>(
      `*[_type == "cmsPlugin" && (_id == $val || slug.current == $val || pluginKey == $val)][0]`,
      { val: pluginKeyOrId },
      { cache: "no-store" }
    );

    if (cmsDoc?._id) {
      await writeClient.patch(cmsDoc._id).set({ enabled }).commit();
    } else if (builtInDef) {
      // Create new cmsPlugin for this built-in
      await writeClient.create({
        _type: "cmsPlugin",
        name: builtInDef.name,
        slug: { _type: "slug", current: builtInDef.key },
        category: builtInDef.category,
        pluginType: builtInDef.pluginType,
        description: builtInDef.description,
        enabled,
        isBuiltIn: true,
        endpointOrScript: builtInDef.endpointOrScript || "",
        triggerEvents: builtInDef.triggerEvents || [],
        customConfigJson: JSON.stringify(builtInDef.defaultSettings),
        installedAt: new Date().toISOString(),
      });
    }

    // Sync legacy doc if exists
    const legacyDoc = await client.fetch<any>(
      `*[_type == "pluginConfig" && (pluginKey == $val || _id == $val)][0]`,
      { val: pluginKeyOrId },
      { cache: "no-store" }
    );
    if (legacyDoc?._id) {
      await writeClient.patch(legacyDoc._id).set({ enabled }).commit();
    }

    revalidatePath("/dashboard/plugins");
    revalidatePath("/api/public/settings");
    revalidatePath("/api/public/plugins");
    revalidatePath("/api/public/sitemap.xml");
    return { success: true, enabled };
  } catch (error: any) {
    console.error(`Error toggling plugin ${pluginKeyOrId}:`, error);
    return { error: error.message || "Failed to toggle plugin status." };
  }
}

/**
 * Saves plugin-specific configuration fields into Sanity.
 */
export async function savePluginSettings(
  pluginKeyOrId: string,
  settings: Record<string, string>
) {
  try {
    const jsonStr = JSON.stringify(settings);
    return await updatePlugin(pluginKeyOrId, {
      customConfigJson: jsonStr,
      settings,
    });
  } catch (error: any) {
    console.error(`Error saving plugin settings for ${pluginKeyOrId}:`, error);
    return { error: error.message || "Failed to save plugin settings." };
  }
}

/**
 * Sends a real HTTP POST/GET test ping to a webhook or API connector plugin.
 * Returns HTTP status code, status text, and round-trip latency in milliseconds.
 */
export async function testPluginConnection(
  idOrConfig:
    | string
    | {
        endpointOrScript?: string;
        apiKey?: string;
        pluginType?: string;
      }
) {
  let endpoint = "";
  let apiKey = "";
  let pluginType: string = "webhook";

  if (typeof idOrConfig === "string") {
    // Look up plugin in Sanity
    const doc = await client.fetch<any>(
      `*[_type == "cmsPlugin" && (_id == $id || slug.current == $id)][0]`,
      { id: idOrConfig },
      { cache: "no-store" }
    );

    if (doc) {
      endpoint = doc.endpointOrScript || "";
      apiKey = doc.apiKey || "";
      pluginType = doc.pluginType || "webhook";
    } else {
      const builtIn = AVAILABLE_PLUGINS.find((p) => p.key === idOrConfig);
      if (builtIn) {
        endpoint = builtIn.endpointOrScript || "";
        pluginType = builtIn.pluginType;
      }
    }
  } else {
    endpoint = idOrConfig.endpointOrScript || "";
    apiKey = idOrConfig.apiKey || "";
    pluginType = idOrConfig.pluginType || "webhook";
  }

  if (pluginType !== "webhook" && pluginType !== "api_connector") {
    return {
      success: false,
      error: "Only Webhook triggers and API Connectors support live connection testing.",
    };
  }

  endpoint = endpoint.trim();
  if (!endpoint || (!endpoint.startsWith("http://") && !endpoint.startsWith("https://"))) {
    return {
      success: false,
      error: "Plugin does not have a valid HTTP or HTTPS endpoint URL configured.",
    };
  }

  const startTime = performance.now();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Evenflowstudio-CMS-Tester/1.0",
    "X-Evenflow-Test": "ping",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["X-Plugin-Key"] = apiKey;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        event: "test.ping",
        timestamp: new Date().toISOString(),
        message: "Live connection test ping from Evenflowstudio Headless CMS",
      }),
      signal: AbortSignal.timeout(8000),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText || (response.ok ? "OK" : "Error"),
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      status: 0,
      statusText: "Connection Failed",
      error: err.name === "TimeoutError" ? "Request timed out after 8000ms" : err.message,
      latencyMs,
    };
  }
}

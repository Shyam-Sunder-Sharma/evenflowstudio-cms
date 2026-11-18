"use server";

import { revalidatePath } from "next/cache";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/writeClient";
import { AVAILABLE_PLUGINS, PluginDefinition } from "@/lib/plugins/registry";

export interface ActivePluginItem extends PluginDefinition {
  docId?: string;
  enabled: boolean;
  settings: Record<string, string>;
}

interface SanityPluginDoc {
  _id: string;
  pluginKey: string;
  name: string;
  category: string;
  description?: string;
  enabled: boolean;
  settingsJson?: string;
}

export async function getPlugins(): Promise<ActivePluginItem[]> {
  try {
    const docs = await client.fetch<SanityPluginDoc[]>(
      `*[_type == "pluginConfig"]`,
      {},
      { cache: "no-store" }
    );

    const docMap = new Map<string, SanityPluginDoc>();
    docs.forEach((doc) => docMap.set(doc.pluginKey, doc));

    return AVAILABLE_PLUGINS.map((def) => {
      const savedDoc = docMap.get(def.key);

      let settings: Record<string, string> = { ...def.defaultSettings };
      if (savedDoc?.settingsJson) {
        try {
          const parsed = JSON.parse(savedDoc.settingsJson);
          settings = { ...settings, ...parsed };
        } catch {
          // Fallback to defaultSettings
        }
      }

      return {
        ...def,
        docId: savedDoc?._id,
        enabled: savedDoc ? Boolean(savedDoc.enabled) : def.defaultEnabled,
        settings,
      };
    });
  } catch (error) {
    console.error("Error fetching plugin configs:", error);
    // Return default offline state if sanity isn't reached
    return AVAILABLE_PLUGINS.map((def) => ({
      ...def,
      enabled: def.defaultEnabled,
      settings: { ...def.defaultSettings },
    }));
  }
}

export async function togglePlugin(pluginKey: string, enabled: boolean) {
  try {
    const existing = await client.fetch<SanityPluginDoc | null>(
      `*[_type == "pluginConfig" && pluginKey == $pluginKey][0]`,
      { pluginKey },
      { cache: "no-store" }
    );

    if (existing?._id) {
      await writeClient.patch(existing._id).set({ enabled }).commit();
    } else {
      const def = AVAILABLE_PLUGINS.find((p) => p.key === pluginKey);
      if (!def) throw new Error(`Unknown plugin key: ${pluginKey}`);

      await writeClient.create({
        _type: "pluginConfig",
        pluginKey: def.key,
        name: def.name,
        category: def.category,
        description: def.description,
        enabled,
        settingsJson: JSON.stringify(def.defaultSettings),
      });
    }

    revalidatePath("/dashboard/plugins");
    revalidatePath("/api/public/settings");
    revalidatePath("/api/public/sitemap.xml");
    return { success: true, enabled };
  } catch (error: any) {
    console.error(`Error toggling plugin ${pluginKey}:`, error);
    return { error: error.message || "Failed to toggle plugin status." };
  }
}

export async function savePluginSettings(
  pluginKey: string,
  settings: Record<string, string>
) {
  try {
    const existing = await client.fetch<SanityPluginDoc | null>(
      `*[_type == "pluginConfig" && pluginKey == $pluginKey][0]`,
      { pluginKey },
      { cache: "no-store" }
    );

    const jsonStr = JSON.stringify(settings);

    if (existing?._id) {
      await writeClient.patch(existing._id).set({ settingsJson: jsonStr }).commit();
    } else {
      const def = AVAILABLE_PLUGINS.find((p) => p.key === pluginKey);
      if (!def) throw new Error(`Unknown plugin key: ${pluginKey}`);

      await writeClient.create({
        _type: "pluginConfig",
        pluginKey: def.key,
        name: def.name,
        category: def.category,
        description: def.description,
        enabled: def.defaultEnabled,
        settingsJson: jsonStr,
      });
    }

    revalidatePath("/dashboard/plugins");
    revalidatePath("/api/public/settings");
    revalidatePath("/api/public/sitemap.xml");
    return { success: true };
  } catch (error: any) {
    console.error(`Error saving plugin settings for ${pluginKey}:`, error);
    return { error: error.message || "Failed to save plugin settings." };
  }
}

export async function getPluginConfig(pluginKey: string): Promise<{
  enabled: boolean;
  settings: Record<string, string>;
}> {
  try {
    const doc = await client.fetch<SanityPluginDoc | null>(
      `*[_type == "pluginConfig" && pluginKey == $pluginKey][0]`,
      { pluginKey },
      { cache: "no-store" }
    );

    const def = AVAILABLE_PLUGINS.find((p) => p.key === pluginKey);
    const defaultSettings = def?.defaultSettings || {};
    const defaultEnabled = def?.defaultEnabled || false;

    if (!doc) {
      return { enabled: defaultEnabled, settings: defaultSettings };
    }

    let parsedSettings = { ...defaultSettings };
    if (doc.settingsJson) {
      try {
        parsedSettings = { ...parsedSettings, ...JSON.parse(doc.settingsJson) };
      } catch {
        // Fallback
      }
    }

    return {
      enabled: doc.enabled,
      settings: parsedSettings,
    };
  } catch {
    const def = AVAILABLE_PLUGINS.find((p) => p.key === pluginKey);
    return {
      enabled: def?.defaultEnabled || false,
      settings: def?.defaultSettings || {},
    };
  }
}

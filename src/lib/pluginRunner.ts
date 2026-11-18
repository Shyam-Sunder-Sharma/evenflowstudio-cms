import { client } from "@/sanity/lib/client";

export interface PluginTriggerPayload {
  id?: string;
  title?: string;
  slug?: string;
  slugEn?: string;
  slugPl?: string;
  status?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
  [key: string]: any;
}

export interface PluginTriggerResult {
  pluginId: string;
  pluginName: string;
  endpoint: string;
  success: boolean;
  status?: number;
  error?: string;
  latencyMs: number;
}

/**
 * Runs all active webhooks and API connectors subscribed to a specific lifecycle event.
 * Runs asynchronously and never throws an exception to avoid disrupting editorial workflows.
 */
export async function runActivePlugins(
  eventName: string,
  payload: PluginTriggerPayload
): Promise<PluginTriggerResult[]> {
  const results: PluginTriggerResult[] = [];

  try {
    // 1. Fetch dynamic cmsPlugin documents subscribed to this event
    const activeCmsPlugins = await client.fetch<any[]>(
      `*[_type == "cmsPlugin" && enabled == true && (pluginType == "webhook" || pluginType == "api_connector") && $eventName in triggerEvents] {
        _id,
        name,
        slug,
        pluginType,
        endpointOrScript,
        apiKey,
        triggerEvents,
        customConfigJson
      }`,
      { eventName },
      { cache: "no-store" }
    ).catch(() => []);

    // 2. Also check if the built-in webhook-sync plugin is enabled in pluginConfig
    const legacyWebhookDoc = await client.fetch<any>(
      `*[_type == "pluginConfig" && pluginKey == "webhook-sync" && enabled == true][0]`,
      {},
      { cache: "no-store" }
    ).catch(() => null);

    const endpointsToTrigger: Array<{
      id: string;
      name: string;
      url: string;
      apiKey?: string;
    }> = [];

    // Add dynamic cmsPlugins
    for (const p of activeCmsPlugins) {
      if (p.endpointOrScript && p.endpointOrScript.trim().startsWith("http")) {
        endpointsToTrigger.push({
          id: p._id,
          name: p.name,
          url: p.endpointOrScript.trim(),
          apiKey: p.apiKey,
        });
      }
    }

    // Add built-in webhook-sync if enabled and not already added
    if (legacyWebhookDoc?.settingsJson) {
      try {
        const parsed = JSON.parse(legacyWebhookDoc.settingsJson);
        const webhookUrl = parsed?.webhookUrl?.trim();
        if (
          webhookUrl &&
          webhookUrl.startsWith("http") &&
          !endpointsToTrigger.some((e) => e.url === webhookUrl)
        ) {
          endpointsToTrigger.push({
            id: legacyWebhookDoc._id || "builtin-webhook-sync",
            name: "Built-in Webhook & Auto-Sync",
            url: webhookUrl,
            apiKey: parsed?.secretToken,
          });
        }
      } catch {
        // Ignore json parse error
      }
    }

    if (endpointsToTrigger.length === 0) {
      return results;
    }

    // Trigger each target in parallel with timeout
    const triggerPromises = endpointsToTrigger.map(async (target) => {
      const startTime = performance.now();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "Evenflowstudio-CMS/1.0",
        "X-Evenflow-Event": eventName,
      };

      if (target.apiKey) {
        headers["Authorization"] = `Bearer ${target.apiKey}`;
        headers["X-Plugin-Signature"] = target.apiKey;
      }

      const body = JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        payload,
      });

      try {
        const response = await fetch(target.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(6000),
        });

        const latencyMs = Math.round(performance.now() - startTime);
        const resObj: PluginTriggerResult = {
          pluginId: target.id,
          pluginName: target.name,
          endpoint: target.url,
          success: response.ok,
          status: response.status,
          latencyMs,
        };
        results.push(resObj);
        return resObj;
      } catch (err: any) {
        const latencyMs = Math.round(performance.now() - startTime);
        const resObj: PluginTriggerResult = {
          pluginId: target.id,
          pluginName: target.name,
          endpoint: target.url,
          success: false,
          error: err.message || "Request timed out or failed to connect",
          latencyMs,
        };
        results.push(resObj);
        return resObj;
      }
    });

    await Promise.allSettled(triggerPromises);
  } catch (error) {
    console.warn(`[PluginRunner] Unexpected error dispatching event '${eventName}':`, error);
  }

  return results;
}

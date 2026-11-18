import { NextResponse } from "next/server";
import { getAllPlugins } from "@/actions/pluginActions";

export async function GET() {
  try {
    const plugins = await getAllPlugins();
    const activePlugins = plugins.filter((p) => p.enabled);

    const scripts = activePlugins
      .filter((p) => p.pluginType === "script_inject")
      .map((p) => {
        let customConfig: Record<string, any> = {};
        if (p.customConfigJson) {
          try {
            customConfig = JSON.parse(p.customConfigJson);
          } catch {}
        }
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          script: p.endpointOrScript || "",
          triggerEvents: p.triggerEvents || ["frontend.load"],
          settings: p.settings,
          customConfig,
        };
      });

    const connectors = activePlugins
      .filter((p) => p.pluginType === "api_connector")
      .map((p) => {
        let customConfig: Record<string, any> = {};
        if (p.customConfigJson) {
          try {
            customConfig = JSON.parse(p.customConfigJson);
          } catch {}
        }
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          endpoint: p.endpointOrScript || "",
          triggerEvents: p.triggerEvents || [],
          customConfig,
        };
      });

    const webhooks = activePlugins
      .filter((p) => p.pluginType === "webhook")
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        endpoint: p.endpointOrScript || "",
        triggerEvents: p.triggerEvents || [],
      }));

    return NextResponse.json(
      {
        status: "success",
        scripts,
        connectors,
        webhooks,
        activePlugins: activePlugins.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          pluginType: p.pluginType,
          isBuiltIn: p.isBuiltIn,
          endpointOrScript: p.endpointOrScript,
          triggerEvents: p.triggerEvents,
        })),
        meta: {
          totalActive: activePlugins.length,
          scriptCount: scripts.length,
          connectorCount: connectors.length,
          webhookCount: webhooks.length,
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Public plugins API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

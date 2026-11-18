import { NextResponse } from "next/server";
import { getAllPlugins } from "@/actions/pluginActions";

export async function GET() {
  try {
    const plugins = await getAllPlugins();

    const pluginMap: Record<string, any> = {};
    const activeKeys: string[] = [];

    plugins.forEach((p) => {
      if (p.enabled) {
        activeKeys.push(p.key || p.slug);
      }

      pluginMap[p.key || p.slug] = {
        name: p.name,
        category: p.category,
        pluginType: p.pluginType,
        enabled: p.enabled,
        isBuiltIn: p.isBuiltIn,
        endpointOrScript: p.endpointOrScript,
        settings: p.settings,
        customConfigJson: p.customConfigJson,
      };
    });

    const seoPlugin = plugins.find((p) => p.key === "seo-manager" || p.slug === "seo-manager");
    const gaPlugin = plugins.find((p) => p.key === "google-analytics" || p.slug === "google-analytics");
    const webhookPlugin = plugins.find((p) => p.key === "webhook-sync" || p.slug === "webhook-sync");

    return NextResponse.json(
      {
        status: "success",
        activePlugins: activeKeys,
        integrations: {
          seo: {
            enabled: Boolean(seoPlugin?.enabled),
            metaTitleSuffix: seoPlugin?.settings?.metaTitleSuffix || " | Evenflowstudio",
            siteUrl: seoPlugin?.settings?.siteUrl || "https://evenflowstudio.com",
            defaultOgImage:
              seoPlugin?.settings?.defaultOgImage ||
              "https://evenflowstudio.com/og-default.jpg",
          },
          analytics: {
            enabled: Boolean(gaPlugin?.enabled),
            gaMeasurementId: gaPlugin?.settings?.gaMeasurementId || "",
          },
          webhook: {
            enabled: Boolean(webhookPlugin?.enabled),
            webhookUrl:
              webhookPlugin?.endpointOrScript ||
              webhookPlugin?.settings?.webhookUrl ||
              "",
          },
        },
        plugins: pluginMap,
        meta: {
          total: plugins.length,
          activeCount: activeKeys.length,
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
    console.error("Public settings API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

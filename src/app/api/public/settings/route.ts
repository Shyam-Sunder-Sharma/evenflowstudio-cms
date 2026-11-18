import { NextResponse } from "next/server";
import { getPlugins } from "@/actions/pluginActions";

export async function GET() {
  try {
    const plugins = await getPlugins();

    const pluginMap: Record<string, any> = {};
    const activeKeys: string[] = [];

    plugins.forEach((p) => {
      if (p.enabled) {
        activeKeys.push(p.key);
      }

      pluginMap[p.key] = {
        name: p.name,
        category: p.category,
        enabled: p.enabled,
        settings: p.settings,
      };
    });

    const seoPlugin = plugins.find((p) => p.key === "seo-manager");
    const gaPlugin = plugins.find((p) => p.key === "google-analytics");
    const webhookPlugin = plugins.find((p) => p.key === "webhook-sync");

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
            webhookUrl: webhookPlugin?.settings?.webhookUrl || "",
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

import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { getPluginConfig } from "@/actions/pluginActions";

interface SitemapItem {
  slugEn?: string;
  slugPl?: string;
  publishedAt?: string;
  _updatedAt?: string;
}

export async function GET() {
  try {
    const seoConfig = await getPluginConfig("seo-manager");

    if (!seoConfig.enabled) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>SEO &amp; Meta Manager plugin is currently disabled. Enable it in the dashboard to generate the sitemap.</message>
</error>`,
        {
          status: 404,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
          },
        }
      );
    }

    const baseUrl = (seoConfig.settings.siteUrl || "https://evenflowstudio.com").replace(
      /\/+$/,
      ""
    );

    const [blogs, projects] = await Promise.all([
      client.fetch<SitemapItem[]>(
        `*[_type == "blogPost" && status == "published"] {
          "slugEn": slugEn.current,
          "slugPl": slugPl.current,
          publishedAt,
          _updatedAt
        }`,
        {},
        { cache: "no-store" }
      ),
      client.fetch<SitemapItem[]>(
        `*[_type == "portfolioProject" && status == "published"] {
          "slugPl": slugPl.current,
          "slugEn": slugEn.current,
          publishedAt,
          _updatedAt
        }`,
        {},
        { cache: "no-store" }
      ),
    ]);

    const urls: Array<{ loc: string; lastmod: string; priority: string }> = [];

    // Homepage
    urls.push({
      loc: `${baseUrl}`,
      lastmod: new Date().toISOString().split("T")[0],
      priority: "1.0",
    });

    // Blogs
    (blogs || []).forEach((b) => {
      const date = (b.publishedAt || b._updatedAt || new Date().toISOString()).split(
        "T"
      )[0];

      if (b.slugEn) {
        urls.push({
          loc: `${baseUrl}/blog/${b.slugEn}`,
          lastmod: date,
          priority: "0.8",
        });
      }
      if (b.slugPl) {
        urls.push({
          loc: `${baseUrl}/pl/blog/${b.slugPl}`,
          lastmod: date,
          priority: "0.8",
        });
      }
    });

    // Portfolio
    (projects || []).forEach((p) => {
      const date = (p.publishedAt || p._updatedAt || new Date().toISOString()).split(
        "T"
      )[0];

      if (p.slugEn) {
        urls.push({
          loc: `${baseUrl}/portfolio/${p.slugEn}`,
          lastmod: date,
          priority: "0.8",
        });
      }
      if (p.slugPl) {
        urls.push({
          loc: `${baseUrl}/pl/portfolio/${p.slugPl}`,
          lastmod: date,
          priority: "0.8",
        });
      }
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Sitemap generation error:", error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><error><message>${error.message}</message></error>`,
      {
        status: 500,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}

import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 50;
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    let filter = `_type == "blogPost" && status == "published"`;
    const params: Record<string, any> = {};

    if (category) {
      filter += ` && categories[]->slug.current == $category`;
      params.category = category;
    }

    if (tag) {
      filter += ` && $tag in tags[]`;
      params.tag = tag;
    }

    const query = `*[${filter}] | order(publishedAt desc, _createdAt desc) [${start}...${end}] {
      "id": _id,
      title,
      "slugEn": slugEn.current,
      "slugPl": slugPl.current,
      status,
      "featuredImage": {
        "url": featuredImage.asset->url,
        "alt": featuredImage.alt
      },
      "categories": categories[]->{
        "id": _id,
        title,
        "slug": slug.current
      },
      tags,
      author,
      publishedAt,
      excerpt,
      body
    }`;

    const totalQuery = `count(*[${filter}])`;
    const [posts, total] = await Promise.all([
      client.fetch(query, params, { cache: "no-store" }),
      client.fetch<number>(totalQuery, params, { cache: "no-store" }),
    ]);

    return NextResponse.json({
      data: posts || [],
      meta: {
        total: total || 0,
        page,
        limit,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("Public blogs API error:", error?.message || error);
    return NextResponse.json({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      },
      notice: "Sanity project not yet configured or reachable. Once credentials are provided, data will populate.",
    });
  }
}

import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 50;
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    let filter = `_type == "portfolioProject" && status == "published"`;
    const params: Record<string, any> = {};

    if (category) {
      filter += ` && category->slug.current == $category`;
      params.category = category;
    }

    const query = `*[${filter}] | order(publishedAt desc, _createdAt desc) [${start}...${end}] {
      "id": _id,
      title,
      titlePl,
      "slugPl": slugPl.current,
      "slugEn": slugEn.current,
      status,
      "featuredImage": {
        "url": featuredImage.asset->url,
        "alt": featuredImage.alt
      },
      "gallery": gallery[] {
        "_key": _key,
        "url": asset->url,
        "alt": alt
      },
      "category": category->{
        "id": _id,
        title,
        titlePl,
        "slug": slug.current
      },
      description,
      descriptionPl,
      projectUrl,
      client,
      clientPl,
      author,
      publishedAt
    }`;

    const totalQuery = `count(*[${filter}])`;
    const [projects, total] = await Promise.all([
      client.fetch(query, params, { cache: "no-store" }),
      client.fetch<number>(totalQuery, params, { cache: "no-store" }),
    ]);

    return NextResponse.json(
      {
        data: projects || [],
        meta: {
          total: total || 0,
          page,
          limit,
          totalPages: Math.ceil((total || 0) / limit),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Public portfolio API error:", error?.message || error);
    return NextResponse.json(
      {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 50,
          totalPages: 0,
        },
        notice: "Sanity project not yet configured or reachable. Once credentials are provided, data will populate.",
      },
      { headers: corsHeaders }
    );
  }
}

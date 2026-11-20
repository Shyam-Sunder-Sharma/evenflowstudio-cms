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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const query = `*[_type == "blogPost" && status == "published" && (slugEn.current == $slug || slugPl.current == $slug)][0] {
      "id": _id,
      title,
      titlePl,
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
        titlePl,
        "slug": slug.current
      },
      tags,
      author,
      publishedAt,
      excerpt,
      excerptPl,
      body,
      bodyPl
    }`;

    const post = await client.fetch(query, { slug }, { cache: "no-store" });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({ data: post }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Public blog detail API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

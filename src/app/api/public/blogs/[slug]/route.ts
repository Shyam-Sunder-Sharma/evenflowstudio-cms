import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const query = `*[_type == "blogPost" && status == "published" && (slugEn.current == $slug || slugPl.current == $slug)][0] {
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

    const post = await client.fetch(query, { slug }, { cache: "no-store" });

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: post });
  } catch (error: any) {
    console.error("Public blog detail API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

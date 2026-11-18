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

    const query = `*[_type == "portfolioProject" && status == "published" && (slugEn.current == $slug || slugPl.current == $slug)][0] {
      "id": _id,
      title,
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
        "slug": slug.current
      },
      description,
      projectUrl,
      client,
      author,
      publishedAt
    }`;

    const project = await client.fetch(query, { slug }, { cache: "no-store" });

    if (!project) {
      return NextResponse.json(
        { error: "Portfolio project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: project });
  } catch (error: any) {
    console.error("Public portfolio detail API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

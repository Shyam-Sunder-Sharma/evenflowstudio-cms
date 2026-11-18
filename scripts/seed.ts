import { createClient } from "@sanity/client";
import * as fs from "fs";
import * as path from "path";

// Load .env.local manually if running standalone via tsx
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in environment.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token,
  useCdn: false,
});

function textToBlocks(text: string) {
  return text.split(/\n\n+/).map((para, i) => ({
    _type: "block",
    _key: `seed_block_${i}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `seed_span_${i}`,
        text: para.trim(),
        marks: [],
      },
    ],
  }));
}

const CATEGORIES_DATA = [
  { title: "Book", slug: "book", section: "portfolio" },
  { title: "T-shirt", slug: "t-shirt", section: "portfolio" },
  { title: "Exhibition", slug: "exhibition", section: "portfolio" },
  { title: "Branding", slug: "branding", section: "blog" },
  { title: "Logo", slug: "logo", section: "portfolio" },
  { title: "Design", slug: "design", section: "blog" },
  { title: "Marketing", slug: "marketing", section: "blog" },
];

async function seed() {
  console.log("🚀 Starting Evenflowstudio Sanity Database Seeder...");

  // 1. Seed Categories
  console.log("📁 Seeding taxonomy categories...");
  const categoryIdMap: Record<string, string> = {};

  for (const cat of CATEGORIES_DATA) {
    const existing = await client.fetch(
      `*[_type == "category" && slug.current == $slug][0]`,
      { slug: cat.slug }
    );

    if (existing) {
      console.log(`  ↪ Category "${cat.title}" already exists (${existing._id})`);
      categoryIdMap[cat.slug] = existing._id;
    } else {
      const created = await client.create({
        _type: "category",
        title: cat.title,
        slug: { _type: "slug", current: cat.slug },
        section: cat.section,
      });
      console.log(`  ✓ Created category: "${cat.title}" (${created._id})`);
      categoryIdMap[cat.slug] = created._id;
    }
  }

  // 2. Seed Blog Posts
  console.log("\n📝 Seeding sample blog posts...");
  const BLOGS_DATA = [
    {
      title: "The Architecture of Modern Minimalist Brand Systems",
      slugEn: "modern-minimalist-brand-systems",
      slugPl: "nowoczesne-systemy-brandingu-minimalistycznego",
      status: "published",
      author: "Evenflowstudio",
      publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      excerpt: "Why modern digital brands are moving towards restrained typography, unified grid systems, and functional aesthetics.",
      body: `Minimalism in modern branding is not merely aesthetic simplicity—it is functional clarity. When an identity system is stripped of arbitrary decoration, every typographic choice, proportional rhythm, and negative space bears intentional communicative weight.

At Evenflowstudio, we design identity systems that scale effortlessly across editorial print, web applications, and physical spatial environments. By decoupling design guidelines from platform constraints, brands achieve timeless endurance.

Consistency across channels is maintained not through rigid restrictions, but through dynamic structural frameworks that empower creative teams to adapt gracefully.`,
      tags: ["Design", "Branding", "Typography", "Strategy"],
      categoryKeys: ["branding", "design"],
    },
    {
      title: "Decoupled Editorial Workflows with Headless CMS",
      slugEn: "decoupled-editorial-workflows-headless-cms",
      slugPl: "rozproszone-procesy-redakcyjne-headless-cms",
      status: "published",
      author: "Evenflowstudio",
      publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      excerpt: "Bridging modern Next.js management interfaces with custom external application backends via structured JSON APIs.",
      body: `Content creation must be liberated from rendering architecture. When content exists as structured schema rather than pre-rendered HTML blobs, editorial velocity surges.

By combining Next.js App Router for administration with Sanity's robust content graph, teams can distribute synchronized multilingual copy to web apps, mobile apps, and legacy PHP rendering layers alike.

This architecture ensures zero runtime friction and instantaneous global asset distribution.`,
      tags: ["Headless CMS", "Marketing", "Architecture"],
      categoryKeys: ["marketing", "design"],
    },
    {
      title: "Typography and Space: Designing for Cultural Exhibitions",
      slugEn: "typography-and-space-cultural-exhibitions",
      slugPl: "typografia-i-przestrzen-wystawy-kulturalne",
      status: "draft",
      author: "Evenflowstudio",
      publishedAt: new Date().toISOString(),
      excerpt: "An exploration of spatial signage, catalog typography, and tactile print finishes in exhibition curation.",
      body: `Designing for physical exhibitions demands an acute understanding of how human scale interacts with typographic hierarchy. Signage must guide without shouting; catalogs must reward intimate observation.

Draft notes exploring museum wayfinding typography and sustainable paper selections for our upcoming gallery retrospects.`,
      tags: ["Exhibition", "Typography", "Print"],
      categoryKeys: ["design"],
    },
  ];

  for (const post of BLOGS_DATA) {
    const existing = await client.fetch(
      `*[_type == "blogPost" && slugEn.current == $slug][0]`,
      { slug: post.slugEn }
    );

    if (existing) {
      console.log(`  ↪ Blog "${post.title}" already exists`);
    } else {
      const categories = post.categoryKeys
        .map((k) => categoryIdMap[k])
        .filter(Boolean)
        .map((id, idx) => ({
          _type: "reference",
          _ref: id,
          _key: `cat_ref_${idx}`,
        }));

      await client.create({
        _type: "blogPost",
        title: post.title,
        slugEn: { _type: "slug", current: post.slugEn },
        slugPl: { _type: "slug", current: post.slugPl },
        status: post.status,
        author: post.author,
        publishedAt: post.publishedAt,
        excerpt: post.excerpt,
        body: textToBlocks(post.body),
        tags: post.tags,
        categories,
      });
      console.log(`  ✓ Created blog: "${post.title}" [${post.status}]`);
    }
  }

  // 3. Seed Portfolio Projects
  console.log("\n🎨 Seeding sample portfolio projects...");
  const PORTFOLIO_DATA = [
    {
      title: "Kierunek Przyszłość: Monograph Book Design",
      slugPl: "kierunek-przyszlosc-projekt-ksiazki",
      slugEn: "future-direction-book-design",
      status: "published",
      client: "Wydawnictwo Kulturalne",
      projectUrl: "https://evenflowstudio.com/works/future-direction",
      author: "Evenflowstudio",
      publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      categoryKey: "book",
      description: `Comprehensive hardcover monograph design featuring custom Swiss typography, foil-stamped cloth binding, and curated archival paper stocks.

The publication documents 25 years of contemporary Polish architecture and industrial design, balancing rigorous typographic grids with expansive photographic spreads.`,
    },
    {
      title: "Atelier No. 04: Limited Edition Apparel Series",
      slugPl: "atelier-nr-04-kolekcja-koszulek",
      slugEn: "atelier-no-04-apparel-series",
      status: "published",
      client: "Atelier Streetwear Co.",
      projectUrl: "https://evenflowstudio.com/works/atelier-04",
      author: "Evenflowstudio",
      publishedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      categoryKey: "t-shirt",
      description: `Graphic identity and screen-printed graphic system for an architectural apparel series. Screen-printed on 280gsm heavy organic cotton in limited edition batches.

Included custom packaging typography, woven labels, and a digital lookbook campaign.`,
    },
    {
      title: "Pavilion 2026: Contemporary Art Exhibition Visual Identity",
      slugPl: "pawilon-2026-identyfikacja-wystawy",
      slugEn: "pavilion-2026-exhibition-identity",
      status: "published",
      client: "National Modern Art Gallery",
      projectUrl: "https://evenflowstudio.com/works/pavilion-2026",
      author: "Evenflowstudio",
      publishedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      categoryKey: "exhibition",
      description: `Spatial wayfinding, exhibition catalog, promotional posters, and ambient digital installations for the international Pavilion 2026 Biennale.

Focused on monochromatic typography and light-reactive surfaces.`,
    },
    {
      title: "Luminary BioLabs: Brand Identity & Symbol",
      slugPl: "luminary-biolabs-identyfikacja-i-logo",
      slugEn: "luminary-biolabs-brand-identity-logo",
      status: "draft",
      client: "Luminary BioLabs",
      projectUrl: "https://luminarybiolabs.example.com",
      author: "Evenflowstudio",
      publishedAt: new Date().toISOString(),
      categoryKey: "logo",
      description: `Minimalist brandmark and comprehensive identity guidelines for a cutting-edge biotechnology institute.

Currently in final client review before global rollout.`,
    },
  ];

  for (const project of PORTFOLIO_DATA) {
    const existing = await client.fetch(
      `*[_type == "portfolioProject" && slugEn.current == $slug][0]`,
      { slug: project.slugEn }
    );

    if (existing) {
      console.log(`  ↪ Portfolio project "${project.title}" already exists`);
    } else {
      const doc: any = {
        _type: "portfolioProject",
        title: project.title,
        slugPl: { _type: "slug", current: project.slugPl },
        slugEn: { _type: "slug", current: project.slugEn },
        status: project.status,
        client: project.client,
        projectUrl: project.projectUrl,
        author: project.author,
        publishedAt: project.publishedAt,
        description: textToBlocks(project.description),
      };

      if (categoryIdMap[project.categoryKey]) {
        doc.category = {
          _type: "reference",
          _ref: categoryIdMap[project.categoryKey],
        };
      }

      await client.create(doc);
      console.log(`  ✓ Created project: "${project.title}" [${project.status}]`);
    }
  }

  console.log("\n🎉 Seeding completed successfully!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed with error:", err);
  process.exit(1);
});

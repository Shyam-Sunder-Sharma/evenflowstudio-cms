# Evenflowstudio Headless CMS — Integration & Architecture Guide

This document outlines the decoupled architecture, Sanity GROQ query interfaces, and public REST API specifications designed for seamless integration with external frontends, including future PHP/WordPress or custom PHP application backends.

---

## 1. System Architecture Overview

Evenflowstudio CMS is built as a strictly decoupled Headless CMS using **Next.js App Router (TypeScript + Tailwind CSS)** and **Sanity Studio v3 / Content Lake**:

```
+-------------------------------------------------------------+
|              Evenflowstudio Editorial Dashboard            |
|         Next.js App Router (Authenticated with JWT)         |
+------------------------------+------------------------------+
                               | Server Actions (Upload Assets / CRUD / Plugins)
                               v
               +-------------------------------+
               |    Sanity Content Lake (v3)   |
               | (Documents, Assets, Hotspots) |
               +---------------+---------------+
                               |
         +---------------------+---------------------+
         |                                           |
         v                                           v
+-----------------------------+             +-----------------------------+
|    Embedded Sanity Studio   |             |   Public Read-Only REST API |
|   (/studio - media & vision)|             |       (/api/public/*)       |
+-----------------------------+             +--------------+--------------+
                                                           |
                                                           v
                                            +-----------------------------+
                                            | External PHP / Web Frontends|
                                            | (Curl, file_get_contents,   |
                                            |  Guzzle, GuzzleHttp, etc.)  |
                                            +-----------------------------+
```

---

## 2. Public REST API Endpoints (JSON)

These endpoints are cached, fast, and require no authentication header, allowing direct consumption by PHP applications.

### 2.1 Blog Articles

#### `GET /api/public/blogs`
Returns all published blog articles ordered by `publishedAt` descending.

- **Query Parameters**:
  - `page` (integer, default: `1`): Pagination page number.
  - `limit` (integer, default: `50`): Results per page.
  - `category` (string, optional): Filter by category slug (e.g. `?category=design`).
  - `tag` (string, optional): Filter by tag (e.g. `?tag=Branding`).

- **Response Body**:
```json
{
  "data": [
    {
      "id": "drafts.xxx or doc_id",
      "title": "The Architecture of Modern Minimalist Brand Systems",
      "slugEn": "modern-minimalist-brand-systems",
      "slugPl": "nowoczesne-systemy-brandingu-minimalistycznego",
      "status": "published",
      "featuredImage": {
        "url": "https://cdn.sanity.io/images/PROJECT_ID/production/...",
        "alt": "Modern Minimalist Branding"
      },
      "categories": [
        { "id": "cat_id", "title": "Branding", "slug": "branding" }
      ],
      "tags": ["Design", "Branding", "Typography"],
      "author": "Evenflowstudio",
      "publishedAt": "2026-11-12T10:00:00.000Z",
      "excerpt": "Why modern digital brands are moving towards restrained typography...",
      "body": [...]
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

#### `GET /api/public/blogs/{slug}`
Fetches a single published article matching either the English slug (`slugEn`) or Polish slug (`slugPl`).

- **Example**: `GET /api/public/blogs/modern-minimalist-brand-systems` or `GET /api/public/blogs/nowoczesne-systemy-brandingu-minimalistycznego`
- **Response**: `{ "data": { ... } }` or HTTP `404 Not Found` if unpublished/non-existent.

---

### 2.2 Portfolio Projects

#### `GET /api/public/portfolio`
Returns all published portfolio projects ordered by `publishedAt` descending.

- **Query Parameters**:
  - `page` (integer, default: `1`): Pagination page number.
  - `limit` (integer, default: `50`): Results per page.
  - `category` (string, optional): Filter by category slug (e.g. `?category=book`, `?category=t-shirt`, `?category=exhibition`).

- **Response Body**:
```json
{
  "data": [
    {
      "id": "project_id",
      "title": "Kierunek Przyszłość: Monograph Book Design",
      "slugPl": "kierunek-przyszlosc-projekt-ksiazki",
      "slugEn": "future-direction-book-design",
      "status": "published",
      "featuredImage": {
        "url": "https://cdn.sanity.io/images/PROJECT_ID/production/...",
        "alt": "Monograph Cover"
      },
      "gallery": [
        {
          "_key": "gallery_1",
          "url": "https://cdn.sanity.io/images/PROJECT_ID/production/...",
          "alt": "Book spread 1"
        }
      ],
      "category": {
        "id": "cat_book",
        "title": "Book",
        "slug": "book"
      },
      "description": [...],
      "projectUrl": "https://evenflowstudio.com/works/future-direction",
      "client": "Wydawnictwo Kulturalne",
      "author": "Evenflowstudio",
      "publishedAt": "2026-11-04T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

#### `GET /api/public/portfolio/{slug}`
Fetches a single published project matching either Polish (`slugPl`) or English (`slugEn`) slug.

- **Example**: `GET /api/public/portfolio/future-direction-book-design`

---

### 2.3 Modular Plugins & Integration Endpoints

#### `GET /api/public/settings`
Returns active configurations for enabled plugins (SEO suffixes, GA4 Measurement ID, canonical URLs) formatted specifically for external PHP frontend consumption.

- **Response Body**:
```json
{
  "status": "success",
  "activePlugins": ["seo-manager", "media-library", "groq-vision"],
  "integrations": {
    "seo": {
      "enabled": true,
      "metaTitleSuffix": " | Evenflowstudio",
      "siteUrl": "https://evenflowstudio.com",
      "defaultOgImage": "https://evenflowstudio.com/og-default.jpg"
    },
    "analytics": {
      "enabled": true,
      "gaMeasurementId": "G-EVENFLOW01"
    },
    "webhook": {
      "enabled": false,
      "webhookUrl": ""
    }
  },
  "meta": {
    "total": 5,
    "activeCount": 3,
    "generatedAt": "2026-11-18T11:15:00.000Z"
  }
}
```

#### `GET /api/public/sitemap.xml`
Dynamically renders a standard search engine XML sitemap containing all published bilingual blog posts (`/blog/{slugEn}`, `/pl/blog/{slugPl}`) and portfolio entries (`/portfolio/{slugEn}`, `/pl/portfolio/{slugPl}`). Automatically active whenever the **SEO & Meta Manager** plugin is enabled in `/dashboard/plugins`.

---

## 3. PHP Consumer Implementation Examples

### 3.1 Fetching Dynamic Settings & Injecting Google Analytics in PHP

```php
<?php
// Function to fetch settings from Evenflowstudio CMS
function fetchEvenflowSettings() {
    $apiUrl = "http://localhost:3000/api/public/settings";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    curl_close($ch);

    if ($response) {
        $json = json_decode($response, true);
        return $json['integrations'] ?? [];
    }
    return [];
}

$settings = fetchEvenflowSettings();

// In PHP <head> template:
if (!empty($settings['analytics']['enabled']) && !empty($settings['analytics']['gaMeasurementId'])) {
    $gaId = htmlspecialchars($settings['analytics']['gaMeasurementId']);
    echo "<!-- Google tag (gtag.js) -->\n";
    echo "<script async src=\"https://www.googletagmanager.com/gtag/js?id={$gaId}\"></script>\n";
    echo "<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', '{$gaId}');\n</script>\n";
}
?>
```

### 3.2 Fetching Blogs in PHP (`cURL`)

```php
<?php
function fetchEvenflowBlogs($category = null) {
    $apiUrl = "http://localhost:3000/api/public/blogs";
    if ($category) {
        $apiUrl .= "?category=" . urlencode($category);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        return json_decode($response, true)['data'] ?? [];
    }
    return [];
}

$articles = fetchEvenflowBlogs('branding');
foreach ($articles as $article) {
    echo '<article class="blog-card">';
    if (!empty($article['featuredImage']['url'])) {
        echo '<img src="' . htmlspecialchars($article['featuredImage']['url']) . '" alt="' . htmlspecialchars($article['featuredImage']['alt'] ?? '') . '"/>';
    }
    echo '<h2>' . htmlspecialchars($article['title']) . '</h2>';
    echo '<p>' . htmlspecialchars($article['excerpt']) . '</p>';
    echo '<a href="/blog/' . htmlspecialchars($article['slugEn']) . '">Read More (EN)</a>';
    echo '<a href="/pl/blog/' . htmlspecialchars($article['slugPl']) . '">Czytaj po polsku (PL)</a>';
    echo '</article>';
}
?>
```

---

## 4. Direct Sanity GROQ Query Examples

### 4.1 All Published Blogs with Resolved References
```groq
*[_type == "blogPost" && status == "published"] | order(publishedAt desc) {
  _id,
  title,
  "slugEn": slugEn.current,
  "slugPl": slugPl.current,
  "featuredImageUrl": featuredImage.asset->url,
  "categories": categories[]->{ title, "slug": slug.current },
  tags,
  publishedAt,
  excerpt,
  body
}
```

### 4.2 Published Project by Either Language Slug
```groq
*[_type == "portfolioProject" && status == "published" && (slugEn.current == $slug || slugPl.current == $slug)][0] {
  _id,
  title,
  "slugPl": slugPl.current,
  "slugEn": slugEn.current,
  "featuredImageUrl": featuredImage.asset->url,
  "galleryUrls": gallery[].asset->url,
  "category": category->{ title, "slug": slug.current },
  client,
  projectUrl,
  publishedAt,
  description
}
```

---

## 5. Security & Authentication Model

- **Dashboard & Mutations**:
  - Protected via `src/middleware.ts` and HTTP-only JWT cookies (`cms_session`).
  - Passwords validated against securely stored server environment variables.
  - Mutations operate via server-only `writeClient` using `SANITY_API_WRITE_TOKEN`.
- **Public REST API**:
  - Read-only (`client.ts`), utilizing Sanity's high-performance edge CDN (`useCdn: true`).
  - Strictly filters by `status == "published"`, guaranteeing drafts are never leaked to external public endpoints.
- **Plugins Architecture**:
  - Managed via `src/lib/plugins/registry.ts` and persisted in Sanity under `pluginConfig` documents.
  - Adding future plugins requires only adding an entry to `AVAILABLE_PLUGINS`.

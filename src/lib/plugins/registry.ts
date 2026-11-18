export type PluginCategory =
  | "SEO"
  | "Analytics"
  | "Webhook"
  | "Script / Embed"
  | "Media"
  | "Custom Integration"
  | "Workflow"
  | "Developer";

export type PluginType =
  | "webhook"
  | "script_inject"
  | "api_connector"
  | "studio_tool";

export interface PluginSettingField {
  key: string;
  label: string;
  type: "text" | "url" | "textarea";
  placeholder?: string;
  helperText?: string;
  defaultValue?: string;
}

export interface PluginDefinition {
  key: string;
  name: string;
  category: PluginCategory;
  pluginType: PluginType;
  description: string;
  defaultEnabled: boolean;
  iconName: string;
  externalLink?: string;
  endpointOrScript?: string;
  triggerEvents?: string[];
  defaultSettings: Record<string, string>;
  fields: PluginSettingField[];
}

export const AVAILABLE_PLUGINS: PluginDefinition[] = [
  {
    key: "seo-manager",
    name: "SEO & Meta Manager",
    category: "SEO",
    pluginType: "api_connector",
    description:
      "Manages global metadata title suffixes, OpenGraph defaults, and automatically exposes a dynamic XML sitemap endpoint at /api/public/sitemap.xml.",
    defaultEnabled: true,
    iconName: "Search",
    endpointOrScript: "/api/public/sitemap.xml",
    defaultSettings: {
      metaTitleSuffix: " | Evenflowstudio",
      defaultOgImage: "https://evenflowstudio.com/og-default.jpg",
      siteUrl: "https://evenflowstudio.com",
    },
    fields: [
      {
        key: "metaTitleSuffix",
        label: "Meta Title Suffix",
        type: "text",
        placeholder: " | Evenflowstudio",
        helperText: "Appended to page titles across public endpoints.",
        defaultValue: " | Evenflowstudio",
      },
      {
        key: "siteUrl",
        label: "Canonical Website URL",
        type: "url",
        placeholder: "https://evenflowstudio.com",
        helperText: "Base URL used when generating URLs in /api/public/sitemap.xml.",
        defaultValue: "https://evenflowstudio.com",
      },
      {
        key: "defaultOgImage",
        label: "Default OpenGraph Image URL",
        type: "url",
        placeholder: "https://evenflowstudio.com/og-default.jpg",
        helperText: "Fallback image for social previews when articles lack hero assets.",
        defaultValue: "https://evenflowstudio.com/og-default.jpg",
      },
    ],
  },
  {
    key: "media-library",
    name: "Sanity Media Library",
    category: "Media",
    pluginType: "studio_tool",
    description:
      "Connects to the centralized /studio Media asset browser plugin (sanity-plugin-media) for tagging, categorizing, and batch managing images.",
    defaultEnabled: true,
    iconName: "Image",
    externalLink: "/studio",
    endpointOrScript: "/studio",
    defaultSettings: {
      libraryTitle: "Evenflowstudio Central Media Hub",
    },
    fields: [
      {
        key: "libraryTitle",
        label: "Library Label",
        type: "text",
        placeholder: "Evenflowstudio Central Media Hub",
        helperText: "Editorial workspace label for media browsing.",
        defaultValue: "Evenflowstudio Central Media Hub",
      },
    ],
  },
  {
    key: "google-analytics",
    name: "Google Analytics & Tag Injector",
    category: "Analytics",
    pluginType: "script_inject",
    description:
      "Configures Google Analytics Measurement ID (GA4) and exposes it via /api/public/settings and /api/public/plugins so the external PHP/WordPress frontend can render tracking tags.",
    defaultEnabled: false,
    iconName: "BarChart3",
    triggerEvents: ["frontend.load"],
    endpointOrScript: "<!-- Google tag (gtag.js) -->\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-EVENFLOW01\"></script>",
    defaultSettings: {
      gaMeasurementId: "G-EVENFLOW01",
    },
    fields: [
      {
        key: "gaMeasurementId",
        label: "Google Analytics 4 Measurement ID",
        type: "text",
        placeholder: "G-XXXXXXXXXX",
        helperText: "Starts with 'G-'. Injected into frontend templates.",
        defaultValue: "G-EVENFLOW01",
      },
    ],
  },
  {
    key: "webhook-sync",
    name: "Webhook & Auto-Sync Trigger",
    category: "Webhook",
    pluginType: "webhook",
    description:
      "Automatically fires an HTTP POST payload to an external URL whenever blog articles or portfolio projects are created, published, or updated.",
    defaultEnabled: false,
    iconName: "Webhook",
    triggerEvents: [
      "blog.published",
      "blog.updated",
      "portfolio.published",
      "portfolio.updated",
    ],
    endpointOrScript: "https://evenflowstudio.com/api/revalidate-hook",
    defaultSettings: {
      webhookUrl: "https://evenflowstudio.com/api/revalidate-hook",
      secretToken: "whsec_evenflow_sample_token",
    },
    fields: [
      {
        key: "webhookUrl",
        label: "Destination Webhook URL",
        type: "url",
        placeholder: "https://your-domain.com/api/revalidate",
        helperText: "Endpoint receiving automatic POST JSON notifications.",
        defaultValue: "https://evenflowstudio.com/api/revalidate-hook",
      },
      {
        key: "secretToken",
        label: "Webhook Signing Secret",
        type: "text",
        placeholder: "whsec_...",
        helperText: "Transmitted via Authorization: Bearer header for verification.",
        defaultValue: "whsec_evenflow_sample_token",
      },
    ],
  },
  {
    key: "groq-vision",
    name: "GROQ API Playground",
    category: "Custom Integration",
    pluginType: "studio_tool",
    description:
      "Direct link to the embedded @sanity/vision query testing console inside /studio/vision to inspect live Content Lake schemas and test GROQ projections.",
    defaultEnabled: true,
    iconName: "Code",
    externalLink: "/studio/vision",
    endpointOrScript: "/studio/vision",
    defaultSettings: {
      defaultApiVersion: "2024-01-01",
    },
    fields: [
      {
        key: "defaultApiVersion",
        label: "Target API Version",
        type: "text",
        placeholder: "2024-01-01",
        helperText: "API date string utilized by the GROQ vision runner.",
        defaultValue: "2024-01-01",
      },
    ],
  },
];

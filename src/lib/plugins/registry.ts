export type PluginCategory =
  | "SEO"
  | "Media"
  | "Analytics"
  | "Workflow"
  | "Developer";

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
  description: string;
  defaultEnabled: boolean;
  iconName: string;
  externalLink?: string;
  defaultSettings: Record<string, string>;
  fields: PluginSettingField[];
}

export const AVAILABLE_PLUGINS: PluginDefinition[] = [
  {
    key: "seo-manager",
    name: "SEO & Meta Manager",
    category: "SEO",
    description:
      "Manages global metadata title suffixes, OpenGraph defaults, and automatically exposes a dynamic XML sitemap endpoint at /api/public/sitemap.xml.",
    defaultEnabled: true,
    iconName: "Search",
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
    description:
      "Connects to the centralized /studio Media asset browser plugin (sanity-plugin-media) for tagging, categorizing, and batch managing images.",
    defaultEnabled: true,
    iconName: "Image",
    externalLink: "/studio",
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
    description:
      "Configures Google Analytics Measurement ID (GA4) and exposes it via /api/public/settings so the external PHP/WordPress frontend can render tracking tags.",
    defaultEnabled: false,
    iconName: "BarChart3",
    defaultSettings: {
      gaMeasurementId: "G-EVENFLOW01",
    },
    fields: [
      {
        key: "gaMeasurementId",
        label: "GA4 Measurement ID",
        type: "text",
        placeholder: "G-XXXXXXXXXX",
        helperText: "Your Google Analytics 4 Measurement ID, beginning with 'G-'.",
        defaultValue: "G-EVENFLOW01",
      },
    ],
  },
  {
    key: "webhook-sync",
    name: "Webhook & Auto-Sync Trigger",
    category: "Workflow",
    description:
      "Enables an automated webhook dispatch target that informs external PHP servers or staging environments whenever editorial content is created, published, or updated.",
    defaultEnabled: false,
    iconName: "Webhook",
    defaultSettings: {
      webhookUrl: "https://evenflowstudio.com/api/revalidate-hook",
      secretToken: "whsec_evenflow_sample_token",
    },
    fields: [
      {
        key: "webhookUrl",
        label: "Webhook Target URL",
        type: "url",
        placeholder: "https://evenflowstudio.com/api/revalidate-hook",
        helperText: "Endpoint that will receive JSON payloads on content mutations.",
        defaultValue: "https://evenflowstudio.com/api/revalidate-hook",
      },
      {
        key: "secretToken",
        label: "Webhook Secret Token",
        type: "text",
        placeholder: "whsec_...",
        helperText: "Shared secret passed in the X-Evenflow-Signature header.",
        defaultValue: "whsec_evenflow_sample_token",
      },
    ],
  },
  {
    key: "groq-vision",
    name: "GROQ API Playground",
    category: "Developer",
    description:
      "Enables the embedded Vision tool plugin within /studio/vision, providing real-time execution of GROQ queries against the live dataset with execution timing.",
    defaultEnabled: true,
    iconName: "Code",
    externalLink: "/studio/vision",
    defaultSettings: {
      defaultApiVersion: "2024-01-01",
    },
    fields: [
      {
        key: "defaultApiVersion",
        label: "API Version",
        type: "text",
        placeholder: "2024-01-01",
        helperText: "Sanity API version date format (YYYY-MM-DD).",
        defaultValue: "2024-01-01",
      },
    ],
  },
];

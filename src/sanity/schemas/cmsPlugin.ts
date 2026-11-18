import { defineField, defineType } from "sanity";

export const cmsPlugin = defineType({
  name: "cmsPlugin",
  title: "CMS Plugin & Integration",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Plugin Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug / Unique Identifier",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "SEO", value: "SEO" },
          { title: "Analytics", value: "Analytics" },
          { title: "Webhook", value: "Webhook" },
          { title: "Script / Embed", value: "Script / Embed" },
          { title: "Media", value: "Media" },
          { title: "Custom Integration", value: "Custom Integration" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pluginType",
      title: "Plugin Type",
      type: "string",
      options: {
        list: [
          { title: "Webhook Trigger", value: "webhook" },
          { title: "Frontend Script / Tag Injector", value: "script_inject" },
          { title: "External API Connector", value: "api_connector" },
          { title: "Sanity Studio Tool", value: "studio_tool" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "isBuiltIn",
      title: "Built-in System Plugin",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "endpointOrScript",
      title: "Endpoint URL or Script Snippet",
      type: "text",
      rows: 4,
      description:
        "Webhook destination URL, external API endpoint, or HTML/JavaScript script snippet to inject.",
    }),
    defineField({
      name: "apiKey",
      title: "API Key / Secret Token",
      type: "string",
      description: "Optional secret or bearer token sent with webhook / API requests.",
    }),
    defineField({
      name: "triggerEvents",
      title: "Trigger Events",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Blog Article Published (blog.published)", value: "blog.published" },
          { title: "Blog Article Updated (blog.updated)", value: "blog.updated" },
          { title: "Portfolio Project Published (portfolio.published)", value: "portfolio.published" },
          { title: "Portfolio Project Updated (portfolio.updated)", value: "portfolio.updated" },
          { title: "Frontend Page Load (frontend.load)", value: "frontend.load" },
        ],
      },
    }),
    defineField({
      name: "customConfigJson",
      title: "Custom JSON Configuration",
      type: "text",
      rows: 4,
      description: "Optional custom key-value settings stored as JSON.",
    }),
    defineField({
      name: "installedAt",
      title: "Installed At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "name",
      category: "category",
      pluginType: "pluginType",
      enabled: "enabled",
    },
    prepare({ title, category, pluginType, enabled }) {
      return {
        title,
        subtitle: `[${category || "Plugin"}] ${pluginType || ""} • ${
          enabled ? "Active" : "Disabled"
        }`,
      };
    },
  },
});

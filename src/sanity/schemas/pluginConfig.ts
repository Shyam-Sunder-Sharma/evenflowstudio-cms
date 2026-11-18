import { defineField, defineType } from "sanity";

export const pluginConfig = defineType({
  name: "pluginConfig",
  title: "Plugin Configuration",
  type: "document",
  fields: [
    defineField({
      name: "pluginKey",
      title: "Plugin Key",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Plugin Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "SEO", value: "SEO" },
          { title: "Media", value: "Media" },
          { title: "Analytics", value: "Analytics" },
          { title: "Workflow", value: "Workflow" },
          { title: "Developer", value: "Developer" },
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
      initialValue: false,
    }),
    defineField({
      name: "settingsJson",
      title: "Settings JSON",
      type: "text",
      rows: 5,
      description: "JSON string containing plugin-specific configuration & keys",
    }),
  ],
  preview: {
    select: {
      title: "name",
      category: "category",
      enabled: "enabled",
    },
    prepare({ title, category, enabled }) {
      return {
        title,
        subtitle: `${category} • ${enabled ? "Active" : "Inactive"}`,
      };
    },
  },
});

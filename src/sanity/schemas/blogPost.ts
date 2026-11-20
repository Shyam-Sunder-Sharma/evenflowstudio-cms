import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title (English / Default)",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "titlePl",
      title: "Title (Polish)",
      type: "string",
      description: "Optional Polish title. Falls back to default title if empty.",
    }),
    defineField({
      name: "slugEn",
      title: "Slug (English)",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slugPl",
      title: "Slug (Polish)",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "draft",
      options: {
        list: [
          { title: "Published", value: "published" },
          { title: "Draft", value: "draft" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "category" }],
        },
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      initialValue: "Evenflowstudio",
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt (English / Default)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "excerptPl",
      title: "Excerpt (Polish)",
      type: "text",
      rows: 3,
      description: "Optional Polish excerpt. Falls back to default excerpt if empty.",
    }),
    defineField({
      name: "body",
      title: "Body (English / Default)",
      type: "array",
      of: [
        {
          type: "block",
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "bodyPl",
      title: "Body (Polish)",
      type: "array",
      description: "Optional Polish body. Falls back to default body if empty.",
      of: [
        {
          type: "block",
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      status: "status",
      media: "featuredImage",
    },
    prepare({ title, status, media }) {
      return {
        title,
        subtitle: `Status: ${status || "draft"}`,
        media,
      };
    },
  },
});

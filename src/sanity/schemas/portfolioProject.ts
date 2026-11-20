import { defineField, defineType } from "sanity";

export const portfolioProject = defineType({
  name: "portfolioProject",
  title: "Portfolio Project",
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
      name: "gallery",
      title: "Gallery Images",
      type: "array",
      of: [
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
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "description",
      title: "Description (English / Default)",
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
      name: "descriptionPl",
      title: "Description (Polish)",
      type: "array",
      description: "Optional Polish description. Falls back to default description if empty.",
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
      name: "projectUrl",
      title: "Project URL",
      type: "url",
    }),
    defineField({
      name: "client",
      title: "Client (English / Default)",
      type: "string",
    }),
    defineField({
      name: "clientPl",
      title: "Client (Polish)",
      type: "string",
      description: "Optional Polish client text. Falls back to default client if empty.",
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
  ],
  preview: {
    select: {
      title: "title",
      client: "client",
      status: "status",
      media: "featuredImage",
    },
    prepare({ title, client, status, media }) {
      return {
        title,
        subtitle: `${client ? `Client: ${client} | ` : ""}Status: ${status || "draft"}`,
        media,
      };
    },
  },
});

import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "section",
      title: "Section",
      type: "string",
      options: {
        list: [
          { title: "Blog", value: "blog" },
          { title: "Portfolio", value: "portfolio" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      section: "section",
    },
    prepare({ title, section }) {
      return {
        title,
        subtitle: `Section: ${section ? section.toUpperCase() : "N/A"}`,
      };
    },
  },
});

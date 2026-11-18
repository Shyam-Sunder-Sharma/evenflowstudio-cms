import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { media } from "sanity-plugin-media";
import { schemaTypes } from "./src/sanity/schemas";
import { projectId, dataset } from "./src/sanity/env";

export default defineConfig({
  basePath: "/studio",
  name: "evenflowstudio_cms",
  title: "Evenflowstudio Headless CMS",

  projectId,
  dataset,

  plugins: [
    structureTool(),
    visionTool({ defaultApiVersion: "2024-01-01" }),
    media(),
  ],

  schema: {
    types: schemaTypes,
  },
});

import { type SchemaTypeDefinition } from "sanity";
import { blogPost } from "./blogPost";
import { portfolioProject } from "./portfolioProject";
import { category } from "./category";
import { pluginConfig } from "./pluginConfig";
import { cmsPlugin } from "./cmsPlugin";

export const schemaTypes: SchemaTypeDefinition[] = [
  blogPost,
  portfolioProject,
  category,
  pluginConfig,
  cmsPlugin,
];

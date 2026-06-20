import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog cluster: informational articles that rank for long-tail queries and
// internally link UP to the service hubs (the Graph Build Engine).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    focusKeyword: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Path to the service hub this article should funnel readers toward.
    relatedHub: z.string().optional(),
    relatedHubLabel: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      cover: image(),
      coverAlt: z.string(),
      overlayColor: z.string().optional(),
    }),
});

export const collections = { projects };

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog', generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '') }),
  schema: z.object({
    title: z.string(),
    lang: z.enum(['pl', 'en', 'de']),
    kind: z.string().default('reflection'),
    date: z.string(),
    excerpt: z.string().default(''),
    key: z.string(),
    slug: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects', generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '') }),
  schema: z.object({
    title: z.string(),
    lang: z.enum(['pl', 'en', 'de']),
    kind: z.string().default('project'),
    excerpt: z.string().default(''),
    key: z.string(),
    slug: z.string(),
  }),
});

export const collections = { blog, projects };

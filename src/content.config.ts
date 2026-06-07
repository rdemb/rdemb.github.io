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
    image: z.string().optional(),
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

const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports', generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '') }),
  schema: z.object({
    title: z.string(),
    ticker: z.string(),
    company: z.string(),
    date: z.string(),
    recommendation: z.string(),
    confidence: z.string().default(''),
    price: z.string().default(''),
    excerpt: z.string().default(''),
    lang: z.enum(['pl', 'en', 'de']).default('pl'),
    key: z.string(),
    slug: z.string(),
  }),
});

export const collections = { blog, projects, reports };

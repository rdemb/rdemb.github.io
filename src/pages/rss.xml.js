import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter((p) => p.data.lang === 'pl')
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
  return rss({
    title: 'D-LOGIC studio · Notatki',
    description: 'Krótkie zapiski o danych, AI, rynkach i uczciwym budowaniu. Bez clickbaitu, z baseline\'em i ograniczeniami.',
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.excerpt,
      link: `/blog/${p.data.key}/`,
      pubDate: new Date(p.data.date + 'T08:00:00Z'),
    })),
    customData: '<language>pl</language>',
  });
}

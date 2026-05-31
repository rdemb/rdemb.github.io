import { getCollection } from 'astro:content';

export type Lang = 'pl' | 'en' | 'de';

export async function postsByLang(lang: Lang) {
  const all = await getCollection('blog');
  return all
    .filter((p) => p.data.lang === lang)
    .sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export async function projectsByLang(lang: Lang) {
  const all = await getCollection('projects');
  return all.filter((p) => p.data.lang === lang);
}

export const blogSw = { pl: '/blog/', en: '/en/blog/', de: '/de/blog/' };
export const postSw = (key: string) => ({ pl: `/blog/${key}/`, en: `/en/blog/${key}/`, de: `/de/blog/${key}/` });
export const labSw = (key: string) => ({ pl: `/projekty/${key}/`, en: `/en/projekty/${key}/`, de: `/de/projekty/${key}/` });

export const kindLabel: Record<Lang, Record<string, string>> = {
  pl: { project: 'projekt', reflection: 'refleksja' },
  en: { project: 'project', reflection: 'reflection' },
  de: { project: 'Projekt', reflection: 'Reflexion' },
};

export const blogText: Record<Lang, { title: string; lead: string; back: string; all: string }> = {
  pl: { title: 'Notatki', lead: "Krótkie zapiski o danych, AI i uczciwym budowaniu. Bez clickbaitu, za to z baseline'em i ograniczeniami.", back: '← strona główna', all: 'wszystkie wpisy' },
  en: { title: 'Notes', lead: 'Short notes on data, AI and honest building. No clickbait, but with a baseline and the limitations.', back: '← home', all: 'all notes' },
  de: { title: 'Notizen', lead: 'Kurze Notizen über Daten, KI und ehrliches Bauen. Kein Clickbait, dafür mit Baseline und Grenzen.', back: '← Startseite', all: 'alle Notizen' },
};

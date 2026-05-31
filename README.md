# rdemb.github.io — D-LOGIC studio

Strona-wizytówka, lab i blog. Solo studio (człowiek + AI): narzędzia AI, web i dane.

- **Stack:** [Astro](https://astro.build), statyczny output, GitHub Pages.
- **Języki:** PL (domyślny), EN (`/en/`), DE (`/de/`).
- **Fonty:** self-hosted (Space Grotesk, Inter, JetBrains Mono) — bez Google CDN (RODO).
- **Deploy:** push na `main` → GitHub Actions (`withastro/action`) → Pages.

## Lokalnie
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
```

Treść: `src/content/blog`, `src/content/projects`. Strona główna: `src/pages/index.astro`. Design: `src/styles/global.css`.

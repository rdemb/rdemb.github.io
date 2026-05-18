document.documentElement.classList.add("js");

(() => {
  const items = [
    ["Home", "/", "navigation"],
    ["MOCPS", "/mocps/", "navigation"],
    ["Refleksje", "/refleksje/", "navigation"],
    ["About", "/about/", "navigation"],
    ["🇵🇱 Polski", "/", "language"],
    ["🇬🇧 English", "/en/", "language"],
    ["🇩🇪 Deutsch", "/de/", "language"],
  ];
  const $ = (s) => document.querySelector(s);
  const palette = $("[data-command-palette]");
  const input = $("[data-command-input]");
  const list = $("[data-command-list]");
  const trigger = $("[data-command-open]");
  if (!palette || !input || !list || !trigger) return;
  const fuzzy = (text, query) => {
    let i = 0;
    for (const char of query.toLowerCase()) {
      i = text.toLowerCase().indexOf(char, i);
      if (i < 0) return false;
      i += 1;
    }
    return true;
  };
  const render = () => {
    const q = input.value.trim();
    list.innerHTML = items.filter(([label, , group]) => !q || fuzzy(`${label} ${group}`, q))
      .map(([label, url, group]) => `<button type="button" data-url="${url}"><span>${label}</span><small>${group}</small></button>`)
      .join("");
  };
  const open = () => { palette.hidden = false; input.value = ""; render(); input.focus(); };
  const close = () => { palette.hidden = true; };
  const go = (url) => { location.href = url; };
  trigger.addEventListener("click", open);
  input.addEventListener("input", render);
  list.addEventListener("click", (e) => { const b = e.target.closest("[data-url]"); if (b) go(b.dataset.url); });
  palette.addEventListener("click", (e) => { if (e.target === palette) close(); });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
    else if (e.key === "Escape") close();
    else if (e.key === "Enter" && !palette.hidden) { const b = list.querySelector("[data-url]"); if (b) go(b.dataset.url); }
  });
  addEventListener("scroll", () => document.body.style.setProperty("--scroll", ((scrollY / Math.max(1, document.body.scrollHeight - innerHeight)) * 100).toFixed(1)));
})();

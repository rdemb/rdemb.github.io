document.documentElement.classList.add("js");
(() => {
  const $ = (s) => document.querySelector(s);
  const palette = $("[data-command-palette]");
  const input = $("[data-command-input]");
  const list = $("[data-command-list]");
  const trigger = $("[data-command-open]");
  if (!palette || !input || !list || !trigger) return;
  const items = [...document.querySelectorAll("[data-command-item]")]
    .map((item) => [item.dataset.label, item.getAttribute("href"), item.dataset.hint || ""]);
  let active = 0;
  const matches = (text, query) => {
    let at = 0;
    for (const char of query.toLowerCase()) {
      at = text.toLowerCase().indexOf(char, at);
      if (at < 0) return false;
      at += 1;
    }
    return true;
  };
  const rows = () => list.querySelectorAll("button");
  const mark = () => rows().forEach((button, i) => button.classList.toggle("active", i === active));
  const render = () => {
    const q = input.value.trim();
    const found = items.filter(([label, , hint]) => !q || matches(`${label} ${hint}`, q));
    list.textContent = "";
    found.forEach(([label, url], i) => {
      const button = document.createElement("button");
      button.className = i ? "" : "active";
      button.type = "button";
      button.dataset.url = url;
      button.textContent = label;
      list.append(button);
    });
    active = 0;
  };
  const open = () => { palette.hidden = false; input.value = ""; render(); input.focus(); };
  const close = () => { palette.hidden = true; };
  const go = (button) => { if (button) location.href = button.dataset.url; };
  trigger.addEventListener("click", open);
  input.addEventListener("input", render);
  list.addEventListener("click", (e) => go(e.target.closest("[data-url]")));
  palette.addEventListener("click", (e) => { if (e.target === palette) close(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, rows().length - 1); mark(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
    else if (e.key === "Enter") go(rows()[active]);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? open() : close(); }
    else if (e.key === "Escape") close();
  });
  addEventListener("scroll", () => document.body.style.setProperty("--scroll", ((scrollY / Math.max(1, document.body.scrollHeight - innerHeight)) * 100).toFixed(1)), { passive: true });
})();

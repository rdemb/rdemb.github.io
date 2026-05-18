---
layout: page
title: "Reflexionen"
lang: de
pl_url: /refleksje/
en_url: /en/reflections/
permalink: /de/reflexionen/
---

Reflexionen sind für Beiträge, die keine vollständigen Projekte sind: Programmierung, Märkte, Arbeit mit Modellen, Disziplin und Notizen aus dem Bauen.

Nicht jeder Beitrag braucht eine Ergebnistabelle. Trotzdem soll klar sein: worum es geht, was ich beobachtet habe und wo die Grenzen liegen.

<div class="post-card-grid">
  {% assign posts = site.posts | where: "lang", "de" | where: "kind", "reflection" %}
  {% for post in posts %}
    <article class="post-card">
      <p class="card-meta">{{ post.date | date: "%Y-%m-%d" }}</p>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      {% if post.excerpt %}<p>{{ post.excerpt | strip_html }}</p>{% endif %}
    </article>
  {% endfor %}
</div>

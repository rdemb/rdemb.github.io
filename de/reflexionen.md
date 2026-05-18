---
layout: page
title: "Reflexionen"
lang: de
pl_url: /refleksje/
en_url: /en/reflections/
permalink: /de/reflexionen/
---

Freie Beiträge: Programmierung, Märkte, Modelle, Arbeitsdisziplin und Notizen aus dem Bauen. Nicht alles braucht eine Tabelle. Manchmal reicht ein Gedanke, der wiederkommt und ehrlich notiert wird.

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

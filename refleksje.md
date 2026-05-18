---
layout: page
title: "Refleksje"
lang: pl
en_url: /en/reflections/
de_url: /de/reflexionen/
permalink: /refleksje/
---

Luźniejsze wpisy: programowanie, rynki, modele, dyscyplina pracy i notatki z budowania. Tu nie musi być tabela. Wystarczy myśl, która wraca i da się ją zapisać uczciwie.

<div class="post-card-grid">
  {% assign posts = site.posts | where: "lang", "pl" | where: "kind", "reflection" %}
  {% for post in posts %}
    <article class="post-card">
      <p class="card-meta">{{ post.date | date: "%Y-%m-%d" }}</p>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      {% if post.excerpt %}<p>{{ post.excerpt | strip_html }}</p>{% endif %}
    </article>
  {% endfor %}
</div>

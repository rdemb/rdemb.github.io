---
layout: page
title: "Reflections"
lang: en
pl_url: /refleksje/
de_url: /de/reflexionen/
permalink: /en/reflections/
---

Reflections are for posts that are not full projects: programming, markets, working with models, discipline, and notes from building.

Not every post needs a results table. It should still be clear: what the point is, what I noticed, and what the limits are.

<div class="post-card-grid">
  {% assign posts = site.posts | where: "lang", "en" | where: "kind", "reflection" %}
  {% for post in posts %}
    <article class="post-card">
      <p class="card-meta">{{ post.date | date: "%Y-%m-%d" }}</p>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      {% if post.excerpt %}<p>{{ post.excerpt | strip_html }}</p>{% endif %}
    </article>
  {% endfor %}
</div>

---
layout: page
title: "Reflections"
lang: en
pl_url: /refleksje/
de_url: /de/reflexionen/
permalink: /en/reflections/
---

Looser posts: programming, markets, models, work discipline, and notes from building. Not everything needs a table. Sometimes the honest unit is a thought that keeps coming back.

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

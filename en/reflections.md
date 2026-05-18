---
layout: page
title: "Reflections"
lang: en
pl_url: /refleksje/
permalink: /en/reflections/
---

Looser posts: programming, markets, models, work discipline, and notes from building.

<ul class="post-list">
  {% assign posts = site.posts | where: "lang", "en" | where: "kind", "reflection" %}
  {% for post in posts %}
    <li>
      <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>

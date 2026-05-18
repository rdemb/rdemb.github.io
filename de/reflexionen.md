---
layout: page
title: "Reflexionen"
lang: de
pl_url: /refleksje/
en_url: /en/reflections/
permalink: /de/reflexionen/
---

Freie Beiträge: Programmierung, Märkte, Modelle, Arbeitsdisziplin und Notizen aus dem Bauen.

<ul class="post-list">
  {% assign posts = site.posts | where: "lang", "de" | where: "kind", "reflection" %}
  {% for post in posts %}
    <li>
      <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>

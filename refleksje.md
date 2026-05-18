---
layout: page
title: "Refleksje"
lang: pl
en_url: /en/reflections/
permalink: /refleksje/
---

Luźniejsze wpisy: programowanie, rynki, modele, dyscyplina pracy i notatki z budowania.

<ul class="post-list">
  {% assign posts = site.posts | where: "lang", "pl" | where: "kind", "reflection" %}
  {% for post in posts %}
    <li>
      <span class="post-date">{{ post.date | date: "%Y-%m-%d" }}</span>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>

---
layout: page
title: "Refleksje"
lang: pl
en_url: /en/reflections/
de_url: /de/reflexionen/
permalink: /refleksje/
---

Refleksje są dla tekstów, które nie są pełnymi projektami: programowanie, rynki, praca z modelami, dyscyplina i obserwacje z budowania.

Nie każdy wpis musi mieć tabelę wyników. Ma być jasno: o co chodzi, co zauważyłem i jakie są ograniczenia.

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

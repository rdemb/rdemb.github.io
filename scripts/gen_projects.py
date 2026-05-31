#!/usr/bin/env python3
"""Generuje strony projektow clawbot + forex-lab (3 jezyki) do content collection 'projects'."""
import os, pathlib

DST = "/root/projects/dlogic-site/src/content/projects"

DATA = {
    "clawbot": {
        "pl": ("clawbot — autonomiczny quant-desk",
               "Bot, którego zbudowałem dla siebie: codziennie przygotowuje mi briefy z rynku. To wzór tego, co mogę zbudować dla Ciebie.",
               """## Problem

Każdego dnia powinienem przejrzeć to samo: w jakim stanie jest rynek, co planują banki centralne, gdzie jest ryzyko. To zajmuje czas i łatwo coś przeoczyć.

## Co zbudowałem

clawbot robi to za mnie. Codziennie pobiera dane, liczy to, co istotne, i wysyła mi na Telegram krótki, uczciwy brief. Działa w trzech warstwach, które nigdy się nie mieszają: twarde liczby, kontekst makro i tło z newsów. Tekst układa model językowy, a gdyby coś przestało działać, jest twardy plan awaryjny do wersji prostszej. Całość chodzi sama, na harmonogramie.

## Uczciwa granica

Desk informuje, ale nie decyduje. Kierunek i wejście zostają u człowieka. To celowe: nie chcę bota, który sam podejmuje ryzykowne decyzje za moje pieniądze.

Taki sam wzór mogę zbudować dla Twojej firmy: pilnowanie cen, metryk czy czegokolwiek, co dziś sprawdzasz ręcznie."""),
        "en": ("clawbot — an autonomous quant desk",
               "A bot I built for myself: every day it prepares market briefs for me. It is the blueprint of what I can build for you.",
               """## Problem

Every day I should review the same things: the state of the market, what central banks are planning, where the risk is. That takes time, and it is easy to miss something.

## What I built

clawbot does it for me. Every day it pulls data, computes what matters, and sends me a short, honest brief on Telegram. It works in three layers that never blend together: hard numbers, macro context, and news background. A language model writes the text, and if something stops working there is a hard fallback to a simpler version. The whole thing runs on its own, on a schedule.

## An honest limit

The desk informs, it does not decide. Direction and entry stay with the human. That is on purpose: I do not want a bot making risky decisions with my money on its own.

I can build the same pattern for your business: watching prices, metrics, or anything you check by hand today."""),
        "de": ("clawbot — ein autonomer Quant-Desk",
               "Ein Bot, den ich für mich gebaut habe: Er bereitet mir täglich Markt-Briefs vor. Er ist die Vorlage dessen, was ich für dich bauen kann.",
               """## Problem

Jeden Tag sollte ich dasselbe prüfen: den Zustand des Marktes, was Zentralbanken planen, wo das Risiko liegt. Das kostet Zeit, und leicht übersieht man etwas.

## Was ich gebaut habe

clawbot macht das für mich. Täglich holt er Daten, berechnet das Wesentliche und schickt mir einen kurzen, ehrlichen Brief auf Telegram. Er arbeitet in drei Ebenen, die sich nie vermischen: harte Zahlen, Makro-Kontext und News-Hintergrund. Ein Sprachmodell schreibt den Text, und falls etwas ausfällt, gibt es einen harten Fallback auf eine einfachere Version. Das Ganze läuft von allein, nach Zeitplan.

## Eine ehrliche Grenze

Der Desk informiert, er entscheidet nicht. Richtung und Einstieg bleiben beim Menschen. Das ist Absicht: Ich will keinen Bot, der allein riskante Entscheidungen mit meinem Geld trifft.

Dasselbe Muster kann ich für dein Unternehmen bauen: Preise, Kennzahlen oder alles beobachten, was du heute von Hand prüfst."""),
    },
    "forex-lab": {
        "pl": ("forex-lab — uczciwy research",
               "Jak sprawdziłem, czy moja własna przewaga na rynku przetrwa koszty. Część wyników wyszła negatywna i to też jest wynik.",
               """## Pytanie

Czy strategia, która wygląda dobrze na wykresie, naprawdę zarabia po odjęciu kosztów i na danych, których wcześniej nie widziała?

## Jak to sprawdziłem

Zbudowałem własne laboratorium do testowania pomysłów tradingowych z prawdziwym rygorem: bootstrap, korekta na wielokrotne testy, walk-forward i realny spread. Bez upiększania wyników.

## Wynik

Większość „pewniaków" tego nie przeżyła. Część wyników była negatywna i zapisałem je dokładnie tak samo jak pozytywne. To nie porażka, to oszczędzony czas i pieniądze.

Z tej pracy została realna wartość: prognoza zmienności i uczciwy obraz tego, co działa, a co nie. Ten sam rygor wnoszę do każdej analizy danych, którą robię dla kogoś."""),
        "en": ("forex-lab — honest research",
               "How I checked whether my own market edge survives costs. Some results came out negative, and that is a result too.",
               """## The question

Does a strategy that looks good on a chart actually make money after costs, on data it has not seen before?

## How I checked

I built my own lab for testing trading ideas with real rigor: bootstrap, a correction for multiple testing, walk-forward, and the real spread. No prettying up the results.

## The result

Most of the "sure things" did not survive. Some results were negative, and I wrote them down exactly like the positive ones. That is not a failure, it is saved time and money.

What remained is real value: a volatility forecast and an honest picture of what works and what does not. I bring the same rigor to every data analysis I do for someone."""),
        "de": ("forex-lab — ehrliche Forschung",
               "Wie ich geprüft habe, ob mein eigener Markt-Edge die Kosten übersteht. Ein Teil der Ergebnisse war negativ, und das ist auch ein Ergebnis.",
               """## Die Frage

Verdient eine Strategie, die auf dem Chart gut aussieht, wirklich Geld nach Kosten und auf Daten, die sie vorher nicht gesehen hat?

## Wie ich es geprüft habe

Ich habe mein eigenes Labor zum Testen von Trading-Ideen mit echtem Rigor gebaut: Bootstrap, Korrektur für multiples Testen, Walk-Forward und den echten Spread. Ohne die Ergebnisse zu beschönigen.

## Das Ergebnis

Die meisten „sicheren Sachen" haben es nicht überlebt. Ein Teil der Ergebnisse war negativ, und ich habe sie genauso notiert wie die positiven. Das ist kein Scheitern, das ist gesparte Zeit und gespartes Geld.

Geblieben ist echter Wert: eine Volatilitätsprognose und ein ehrliches Bild davon, was funktioniert und was nicht. Denselben Rigor bringe ich in jede Datenanalyse ein, die ich für jemanden mache."""),
    },
}

n = 0
for key, langs in DATA.items():
    for lang, (title, excerpt, body) in langs.items():
        d = f"{DST}/{lang}"
        pathlib.Path(d).mkdir(parents=True, exist_ok=True)
        fm = f'---\ntitle: "{title}"\nlang: "{lang}"\nkind: "project"\nexcerpt: "{excerpt}"\nkey: "{key}"\nslug: "{key}"\n---\n\n'
        open(f"{d}/{key}.md", "w", encoding="utf-8").write(fm + body + "\n")
        n += 1
print(f"utworzono {n} plikow projektow (clawbot + forex-lab x 3 jezyki)")

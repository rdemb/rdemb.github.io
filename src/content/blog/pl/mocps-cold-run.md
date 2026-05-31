---
title: "MOCPS: cold run 200/200"
lang: "pl"
kind: "project"
date: "2026-05-18"
excerpt: "Cold reproducibility dla MOCPS: ten sam przepis odtworzony od zera, 200/200 przeciw persystencji na sprawdzonym zakresie testu."
key: "mocps-cold-run"
slug: "mocps-cold-run"
---
W eksperymentach łatwo przeszacować wynik. Można niechcący oprzeć się na wcześniejszych tabelach, wybrać wygodny zakres albo zapomnieć, że jeden run był wyjątkowo dobry.

Dlatego ten wpis jest o cold runie: uruchomieniu MOCPS od zera na sprawdzonym zakresie testu, bez korzystania z wcześniejszych wierszy audytu predictor400.

Wynik:

- `cold_run: true`
- `reused_rows: false`
- wynik: `200/200` przeciw persystencji
- mean MAE: `1.574 px`
- mean persistence MAE: `3.903 px`
- failed rows: `0`
- rows worse than learned_diff: `0`

Persystencja jest tu prostym przeciwnikiem: zakłada, że obiekt zostanie tam, gdzie był ostatnio. Jeśli predykcyjny stan nie potrafi regularnie wygrać z takim baseline'em, to cała reszta opisu nie ma dużej wartości.

Ten wynik nie robi z MOCPS benchmarku ani szerokiego modelu świata. Ważne jest to, że kanoniczna komenda odtwarza wynik bez specjalnego reuse. To dobry punkt startowy do trudniejszych testów.

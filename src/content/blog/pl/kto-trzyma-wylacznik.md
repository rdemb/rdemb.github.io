---
title: "Kto trzyma wyłącznik do AI"
lang: "pl"
kind: "reflection"
date: "2026-06-13"
excerpt: "9 czerwca Anthropic wypuścił Fable 5. 12 czerwca rząd USA kazał odciąć dostęp cudzoziemcom i model zgasł. Krótko o tym, co to mówi o zależności Europy i co realnie zostaje, gdy zakręcą kran."
key: "ai-kill-switch"
slug: "kto-trzyma-wylacznik"
---
Najmocniejszy publiczny model AI dostałeś we wtorek. W piątek wieczorem ktoś w Waszyngtonie go wyłączył. O zdanie cię nie zapytał.

9 czerwca Anthropic udostępnił Claude Fable 5, swój najmocniejszy publiczny model. Trzy dni później, w piątek 12 czerwca o 17:21 czasu wschodniego, firma dostała pismo z Departamentu Handlu USA. Nakaz był krótki: odciąć dostęp do Fable 5 i Mythos 5 wszystkim cudzoziemcom. Anthropic uznał, że nie ma jak czysto oddzielić cudzoziemców od reszty użytkowników, więc wyłączył oba modele globalnie. Dla wszystkich. AWS wycofał je we wszystkich regionach.

Wyciągam z tego jedną lekcję. Dostęp do najmocniejszych modeli AI nie jest produktem, który kupujesz na własność. Jest przywilejem na cudzym serwerze, za cudzym wyłącznikiem. W piątek ten wyłącznik został użyty.

## Co się wydarzyło, po kolei

W kwietniu Anthropic pokazał Mythos. Opisał go jako model na tyle groźny w cyberbezpieczeństwie, że nie nadaje się do publicznego wydania. Trafił tylko do wąskiej grupy partnerów i do współpracy z rządem USA w programie Glasswing. Argument firmy: ten model znajduje i wykorzystuje luki w oprogramowaniu lepiej niż prawie każdy człowiek.

9 czerwca pojawił się Fable 5. To ten sam silnik co Mythos, tylko obudowany zabezpieczeniami. W obszarach wysokiego ryzyka, czyli cyber, biologia, chemia i destylacja modelu, Fable 5 ma blokować odpowiedź i schodzić do słabszego Opus 4.8. Anthropic chwalił się, że to najlepszy publiczny model na niemal wszystkich testach. Cena: 10 dolarów za milion tokenów wejścia i 50 za milion wyjścia. Mythos 5 to wersja z poluzowanymi zabezpieczeniami, dostępna wyłącznie dla partnerów Glasswing.

Potem przyszedł piątek. Rząd, powołując się na bezpieczeństwo narodowe, kazał zablokować dostęp każdemu cudzoziemcowi: w USA i poza nimi, łącznie z własnymi pracownikami Anthropic bez amerykańskiego obywatelstwa. Powód, jaki firma usłyszała: ktoś znalazł sposób na obejście zabezpieczeń Fable 5, który w jednym konkretnym przypadku odblokowywał cyberzdolności Mythos. Szczegółów tych obaw firmie nie przekazano.

Reakcja Anthropic była ostra. Firma napisała, że nie zgadza się, by wąska luka była powodem do wycofywania modelu wystawionego setkom milionów użytkowników. Dodała zdanie, które warto zapamiętać: gdyby ten standard zastosować do całej branży, zatrzymałby wdrażanie wszystkich nowych modeli u wszystkich czołowych dostawców. Opus 4.8 i słabsze modele zostały włączone. Padł sam szczyt.

## Dlaczego to nie była zwykła awaria

To nie był błąd serwera ani problem techniczny. To była decyzja administracyjna, podjęta w popołudnie, bez uzasadnienia przekazanego firmie. Zadziałała jak kontrola eksportu, ta sama logika, którą stosuje się do broni i technologii podwójnego zastosowania.

Jeden z badaczy cyberbezpieczeństwa skomentował to celnie: jeśli w każdym komunikacie prasowym opisujesz swój produkt jako broń, to w końcu rząd weźmie cię za słowo. Anthropic latami budował narrację o modelu groźnym jak cyberbroń. Państwo potraktowało tę narrację dosłownie i sięgnęło po wyłącznik.

Dla użytkownika w USA blokada była stratą uboczną i pewnie chwilową. Dla nas w Europie ważniejszy jest mechanizm. Twój dostęp do najmocniejszej technologii zależy od decyzji obcego rządu o bezpieczeństwie narodowym. Taka decyzja może zapaść w jedno popołudnie. I nie musi przyjść z wyjaśnieniem.

## Gdzie naprawdę stoi Europa

Tu nie ma co się oszukiwać. Według szacunków przytaczanych w czerwcu Europa kontroluje około 5 procent światowej mocy obliczeniowej do AI. USA mają około 80 procent. Popyt w Europie jest rozbity na 27 rynków, z których każdy działa w dużej mierze osobno. Bruegel ujmuje problem nago: barierą nie są talenty ani pomysły, barierą jest dostęp do mocy obliczeniowej i kapitału.

Skalę pokazują wydatki. W 2026 roku amerykańskie firmy technologiczne planują na infrastrukturę AI ponad 700 miliardów dolarów. Sam Amazon prowadzi inwestycje rzędu 200 miliardów. Europejskie plany, łącznie z programem InvestAI i pomysłem fabryk AI, liczą się w dziesiątkach miliardów i rozkładają na lata. Inna liga budżetowa.

Europa ma realne atuty. ASML jako jedyna na świecie robi maszyny do litografii EUV, bez których nie powstaje żaden zaawansowany chip. Jest ośrodek badawczy IMEC. Są ludzie. Problem w tym, że atuty leżą po stronie produkcji sprzętu, a nie po stronie wielkich modeli i mocy do ich trenowania. Mistral, francuska duma, trenował swoje modele na chmurze Microsoftu. Skalę europejskich laboratoriów ledwie widać przy amerykańskich i chińskich.

Reakcje polityków przyszły w kilka godzin. Jordan Bardella stwierdził, że kraje, które same nie zbudują własnych modeli, będą coraz bardziej zależne od wyborów innych mocarstw, i wezwał Francję do przyspieszenia wsparcia dla Mistrala. Brytyjski poseł Tom Tugendhat ujął to krócej: suwerenność dotyczy dziś bardziej kodu niż armat.

## Co zostaje, gdy zakręcą kran

Powiedzmy wprost, co realnie ma Europejczyk, jeśli front zostanie odcięty na stałe.

Najpierw to, co przetrwało piątek: starsze modele Anthropic jak Opus 4.8, do tego GPT i Gemini. Działają, ale to ten sam wyłącznik, tylko jeszcze nieużyty. Stoją na amerykańskich serwerach i pod amerykańskim prawem eksportowym.

Potem prawdziwy plan B, czyli to, co europejskie. Mistral z Francji jest najbliżej frontu. Wyceniany na około 20 miliardów euro, w czerwcu zbierał kolejne 3 miliardy. Część modeli wydaje z otwartymi wagami, więc można je pobrać i uruchomić u siebie. Słabsza strona: wciąż goni czołówkę i sam korzysta z amerykańskiej chmury oraz amerykańskich chipów.

Bielik z Polski to inny sposób myślenia. Robi go fundacja SpeakLeash z mocą z Cyfronetu AGH, jako projekt otwarty i non-profit. Wersja trzecia z 1 stycznia 2026 ma 11 miliardów parametrów, otwarte wagi i otwarte dane treningowe, działa lokalnie i jest zbudowana pod polski język oraz polski kontekst.

I tu trzeba być uczciwym. Model 11-miliardowy uruchamiany lokalnie ani laboratorium za 20 miliardów euro nie są tym samym co Fable 5. To nie jest parytet z frontem. To podłoga suwerenności, a nie sufit możliwości. Ale te narzędzia mają jedną cechę, której front nie ma: nikt w Waszyngtonie nie zgasi ich jednym pismem. Słabszy model, który masz u siebie, bywa więcej wart niż mocniejszy, który ktoś może ci odebrać.

## Czego ten tekst nie twierdzi

Europie nikt nie odciął AI z dnia na dzień. Dziś działają Opus 4.8, GPT, Gemini, Mistral i Bielik. Zgasł sam szczyt, Fable 5 i Mythos 5, i to dla wszystkich, jako skutek uboczny przepisu o cudzoziemcach. To mogła być akcja jednorazowa, a nie stały zakaz dla Unii. Ale precedens i mechanizm przestały być teorią. Zostały pokazane w praktyce.

Czarny scenariusz dla Europy też nie jest przesądzony. Zdanie o tym, że nie zanosi się na spektakularny rozwój, opisuje obecny kurs, a nie wyrok. ASML, IMEC i ludzie są realni. Wąskim gardłem są moc, kapitał i rozbicie na 27 rynków. To da się nadrobić, tylko powoli. Airbus potrzebował dwóch dekad, żeby dogonić Boeinga.

## Co z tym robię u siebie

Wniosek operacyjny jest nudny i dlatego dobry. Front od amerykańskiego dostawcy traktuję jak wynajętą moc za cudzym wyłącznikiem. Pod spodem trzymam tańszy, lokalny albo otwarty model, który dalej liczy, gdy kran zostanie zakręcony. Buduję tak, żeby podmiana modelu nie zabijała produktu i żeby żaden pojedynczy dostawca nie był jedynym punktem awarii.

Wyłącznik istnieje. W piątek został użyty. Pytanie nie brzmi, czy ktoś go ma. Brzmi: czyja ręka na nim leży. Na razie nie nasza.

---

Źródła: [ogłoszenie Anthropic](https://www.anthropic.com/news/claude-fable-5-mythos-5), [blokada i odpowiedź firmy (Fortune)](https://fortune.com/2026/06/13/anthropic-disables-fable-mythos-export-controls-national-security-threat/), [reakcje europejskie (Euronews)](https://www.euronews.com/2026/06/13/why-anthropic-is-halting-access-to-its-fable-5-and-mythos-5-ai-models), [luka compute Europy (Semafor)](https://www.semafor.com/article/06/11/2026/europe-at-risk-of-ai-driven-irrelevance), [Mistral zbiera kapitał (TechCrunch)](https://techcrunch.com/2026/06/12/mistral-is-rumored-to-be-raising-e3b-at-e20-valuation/), [Bielik (SpeakLeash)](https://bielik.ai/).

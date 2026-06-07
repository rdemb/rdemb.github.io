import type { Lang } from './content';

export type CapMind = { n: string; s: string; p: string };
export type CapFlow = { b: string; t: string };
export type CapData = {
  heroH1: string;
  lead: string;
  pillars: { n: string; l: string; p: string }[];
  flowTitle: string;
  flow: CapFlow[];
  councilTitle: string;
  councilSub: string;
  groupInvestors: string;
  groupScience: string;
  groupControl: string;
  investors: CapMind[];
  scientists: CapMind[];
  redteam: CapMind;
  methodsTitle: string;
  methods: { n: string; p: string }[];
  reportsTitle: string;
  disclaimerTitle: string;
  disclaimer: string;
  backHome: string;
  priceLabel: string;
  moreAbout: string;
};

export function recClass(r: string): 'buy' | 'hold' | 'avoid' {
  const s = (r || '').toLowerCase();
  if (/unika|avoid|verkauf|sprzeda/.test(s)) return 'avoid';
  if (/obserw|watch|beobacht|czeka|wait|abwart/.test(s)) return 'hold';
  if (/kup|akumul|accumul|akkumul|kauf|buy/.test(s)) return 'buy';
  return 'hold';
}

export const confidenceLabel: Record<Lang, string> = { pl: 'pewność', en: 'confidence', de: 'Konfidenz' };

export const capitalI18n: Record<Lang, CapData> = {
  pl: {
    heroH1: 'Fundusz, który myśli na głos',
    lead: 'Prywatny fundusz agentowy do długoterminowego inwestowania. Szesnastu wybitnych inwestorów i naukowców analizuje każdą spółkę z osobna, spiera się o nią, a wynik trafia do uczciwego raportu. To zapis procesu myślenia, na którym opieram własne decyzje, otwarty do czytania.',
    pillars: [
      { n: '16', l: 'umysłów w radzie', p: 'Dziewięciu wielkich inwestorów, sześciu naukowców z różnych dziedzin oraz Czerwony Zespół, który atakuje każdą tezę.' },
      { n: '0', l: 'automatycznych transakcji', p: 'Rada przedstawia tezę, decyzję i transakcję podejmuje człowiek. Bez połączeń z brokerem, bez automatu. Pełna kontrola po stronie inwestora.' },
      { n: '∞', l: 'rygoru ponad pewność', p: 'Każdy wniosek przechodzi test premortem. Gdy dane są słabe albo rada podzielona, raport mówi to wprost zamiast zmyślać przekonanie.' },
    ],
    flowTitle: 'Jak powstaje raport',
    flow: [
      { b: 'Twarde dane.', t: 'Jeden zestaw faktów ze sprawozdań i wskaźników, ten sam dla każdego umysłu. Różnice w werdyktach biorą się z filozofii, a nie z danych.' },
      { b: 'Rada i wydział naukowy.', t: 'Każdy ocenia spółkę osobno i niezależnie, swoją metodą. Inwestorzy liczą wartość i fosę, naukowcy badają ryzyko, refleksyjność rynku oraz trwałość przewagi.' },
      { b: 'Czerwony Zespół.', t: 'Adwokat diabła próbuje obalić najsilniejszą tezę. Przetrwa tylko ta, która wytrzyma atak.' },
      { b: 'Komitet i werdykt.', t: 'Synteza pokazuje, gdzie panuje zgoda, gdzie spór i jakie jest ryzyko, oraz przy jakiej cenie teza ma sens. Wynik to teza z uzasadnieniem.' },
    ],
    councilTitle: 'Rada',
    councilSub: 'Każdy agent dostaje ten sam zestaw twardych danych i ocenia go własną metodą. Poniżej mechanika myślenia każdego z nich.',
    groupInvestors: 'inwestorzy',
    groupScience: 'wydział naukowy',
    groupControl: 'kontrola',
    investors: [
      { n: 'Warren Buffett', s: 'jakość i wartość', p: 'Ocenia spółkę jak właściciel, który kupuje cały biznes na dekadę. Najpierw szuka trwałej przewagi konkurencyjnej, fosy, którą widać w liczbach: wysokie i stabilne ROE, grube marże operacyjne, rozsądny dług. Wartość wewnętrzną liczy z przyszłych wolnych przepływów pieniężnych i wchodzi tylko wtedy, gdy cena daje wyraźny margines bezpieczeństwa. Jego twardym dowodem jest gotówka, którą firma generuje rok po roku. Gdy biznes jest wspaniały, a cena za wysoka, jego werdykt brzmi: czekać.' },
      { n: 'Charlie Munger', s: 'jakość po uczciwej cenie', p: 'Wspólnik Buffetta i jego ostrzejsza wersja. Woli zapłacić uczciwą cenę za wybitny biznes zamiast okazyjnej za przeciętny. Kluczowym dowodem jest dla niego zwrot z zainwestowanego kapitału i siła cenowa, bo pokazują, czy przewaga jest prawdziwa. Myśli modelami z wielu dziedzin i odwraca problem: zamiast pytać, jak wygrać, sprawdza, jak najłatwiej stracić, i tej drogi unika. Stawia na kilka mocno przemyślanych decyzji o wysokim przekonaniu.' },
      { n: 'Benjamin Graham', s: 'głęboka wartość', p: 'Ojciec inwestowania w wartość i sumienie ostrożności. Stawia bezpieczeństwo kapitału przed zyskiem i żąda marginesu bezpieczeństwa, czyli kupna wyraźnie poniżej wartości firmy. Posługuje się twardymi miarami: niskie P/E, niskie P/B, ich iloczyn poniżej progu 22,5, mocna płynność, ciągłość zysków. Traktuje rynek jak nerwowego wspólnika, którego nastroje można wykorzystać. Gdy cena opiera się wyłącznie na narracji wzrostu, mówi wprost: za drogo.' },
      { n: 'Peter Lynch', s: 'wzrost w rozsądnej cenie', p: 'Szuka rosnących firm, których cena nie dogoniła jeszcze fundamentów. Jego kompasem jest wskaźnik PEG, cena do zysków podzielona przez tempo ich wzrostu; wartość koło jedności uznaje za uczciwą, poniżej za okazję. Każdą firmę przypisuje do kategorii, od stabilnego giganta po szybko rosnącą i turnaround, i ocenia ją w ramach tej kategorii. Lubi proste historie, które streszcza w jednym zdaniu. Dowodem jest dla niego realny i trwały wzrost zysków.' },
      { n: 'Philip Fisher', s: 'wzrost jakościowy', p: 'Pionier inwestowania we wzrost jakościowy. Szuka wyjątkowych firm z długim rozbiegiem przed sobą i trzyma je latami. Patrzy na trwałość wzrostu, skalę badań i rozwoju, lojalność klientów oraz kulturę firmy. Dowodem jakości wzrostu są dla niego wysokie i utrzymane marże oraz rosnący wolny przepływ pieniężny. Drobną przepłatę za prawdziwie wybitny wzrost uznaje za uzasadnioną, bo czas pracuje na jego korzyść.' },
      { n: 'Ray Dalio', s: 'makro i reżimy', p: 'Patrzy na spółkę przez pryzmat makroekonomii i reżimów rynkowych. Pyta, jak firma zachowa się w różnych światach: przy wysokiej i niskiej inflacji, w czasie wzrostu i recesji. Jego dowodami są wrażliwość biznesu na stopy procentowe, zadłużenie, cykliczność popytu oraz pozycja w cyklu długu. Ceni odporność i dywersyfikację, bo nikt nie przewidzi przyszłości punktowo. Ocenia rolę spółki w całym portfelu, a nie pojedynczą pozycję w oderwaniu.' },
      { n: 'Michael Burry', s: 'kontrarianin', p: 'Czyta przypisy w sprawozdaniach, a nie nagłówki. Szuka asymetrii: ukrytej wartości albo ukrytej bańki, której tłum nie dostrzega. Jego dowodem jest prawdziwy bilans i przepływy gotówki, realny dług oraz jakość zysków. Idzie pod prąd konsensusu, ale tylko wtedy, gdy liczby go wspierają. Pyta wprost, dlaczego rynek wycenia coś tak, jak wycenia, i czy ma w tym rację.' },
      { n: 'Howard Marks', s: 'cykle i ryzyko', p: 'Myśli na drugim poziomie. Pierwszy poziom mówi „dobra firma, kupuj”; on pyta, czy wszyscy już to wiedzą i czy jest to w cenie. Najważniejsze jest dla niego ryzyko rozumiane jako trwała utrata kapitału. Bada, gdzie jesteśmy w cyklu nastrojów, jak duży jest dystans między ceną a wartością i czy asymetria sprzyja kupującemu. Powtarza, że o przyszłym zwrocie decyduje cena, którą płacisz dzisiaj.' },
      { n: 'Nassim Taleb', s: 'ryzyko ruiny', p: 'Pilnuje jednej rzeczy: żeby nic nie wysadziło portfela. Nie wybiera zwycięzców, ocenia kruchość. Jego dowodami są dźwignia, relacja długu do gotówki, płynność oraz zależność od ciągłego finansowania. Szuka ryzyka ogona, rzadkich zdarzeń, które niszczą trwale. Ma prawo weta: choćby wycena kusiła, jeśli biznes może zbankrutować, każe ograniczyć pozycję albo trzymać się z daleka.' },
    ],
    scientists: [
      { n: 'Benoit Mandelbrot', s: 'grube ogony', p: 'Matematyk, który przypomina, że rynki nie są łagodne. Zmienność ma grube ogony, więc gwałtowne ruchy zdarzają się znacznie częściej, niż zakłada krzywa dzwonowa. Jego dowodami są historia zmienności, beta oraz ekspozycja na ekstrema. Ostrzega, gdy wycena zakłada gładką przyszłość, a struktura ryzyka mówi co innego. Pyta nie o przeciętny scenariusz, lecz o to, jak gruby jest ogon i czy może zaszkodzić.' },
      { n: 'Statystyk-rygorysta', s: 'sygnał kontra szum', p: 'Sumienie rygoru w radzie. Oddziela sygnał od szumu i domyślnie zakłada, że obserwacja jest przypadkowa, dopóki dowód nie przeważy. Jego narzędziami są częstość bazowa, czyli jak zwykle kończą podobne firmy, myślenie bayesowskie oraz kalibracja. Sprawdza, czy teza opiera się na twardych danych czy na opowieści, i czy w danych nie ma błędów. Gdy dowód jest słaby, obniża pewność całej rady i spokojnie mówi „nie wiem”.' },
      { n: 'George Soros', s: 'refleksyjność i gra', p: 'Patrzy na rynek jak na grę ze sprzężeniem zwrotnym: ceny wpływają na fundamenty, a fundamenty na ceny. Jego pierwsze pytanie brzmi, dlaczego dana okazja w ogóle istnieje i kto stoi po drugiej stronie transakcji. Dowodem jest dla niego rozjazd między narracją rynku a liczbami oraz faza pętli nastrojów. Szuka momentów, w których konsensus jest błędny, a tłum działa emocjami. Odróżnia prawdziwą okazję od pułapki, w której druga strona wie więcej.' },
      { n: 'Technolog dziedzinowy', s: 'czy fosa jest realna', p: 'Ocenia, czy przewaga firmy jest prawdziwa od strony produktu i technologii, a nie tylko liczb. Pyta, gdzie dana technologia leży na krzywej adopcji i czy obroni się przed tańszą konkurencją za dekadę. Jego dowodami są marże brutto jako miara siły produktu, skala reinwestycji oraz wysokość bariery wejścia. Tłumaczy prostym językiem, na czym polega fosa albo dlaczego jej brakuje. Wskazuje ryzyko, że nowa technologia zmieni reguły gry.' },
      { n: 'Historyk rynków', s: 'cykle i analogie', p: 'Pamięta, że to już się zdarzało. Manie i panika mają powtarzalny wzorzec, zmieniają się tylko aktorzy. Jego dowodami są analogie historyczne: bańki kolejowe, radiowe i internetowe, kryzysy długu. Sprawdza, czy obecna wycena przypomina znany szczyt euforii czy znane dno niechęci. Przypomina, że słowa „tym razem jest inaczej” zwykle kosztują najwięcej.' },
      { n: 'Psycholog behawioralny', s: 'błędy poznawcze', p: 'Bada, gdzie tłum i sama rada się mylą. Rynek to ludzie z przewidywalnymi błędami: owczym pędem, awersją do straty, nadmierną pewnością, ekstrapolacją ostatniego trendu. Jego dowodami są sentyment wobec spółki oraz dystans ceny od wartości. Pilnuje też rady, czy nie zakochała się w jakości firmy i czy nie ulega narracji. Skrajny strach czyta jako możliwą okazję, skrajną chciwość jako ostrzeżenie.' },
    ],
    redteam: { n: 'Czerwony Zespół', s: 'adwokat diabła', p: 'Jego jedynym zadaniem jest obalić tezę, zanim zaryzykujesz kapitał. Wykonuje premortem: zakłada, że minął rok i inwestycja straciła połowę wartości, po czym opisuje najbardziej prawdopodobną drogę do tej straty. Szuka najsilniejszego kontrargumentu inteligentnej drugiej strony oraz najbardziej kruchego założenia tezy. Dowodem jest dla niego konkretny, wiarygodny scenariusz porażki. Tylko teza, która przetrwa ten atak, trafia do raportu z pełną siłą.' },
    methodsTitle: 'Dyscyplina i metody',
    methods: [
      { n: 'Dane u źródła', p: 'Fundamenty pochodzą prosto ze sprawozdań spółki (SEC EDGAR, 10-K/10-Q). Wskaźniki liczymy sami, a warstwa kontroli odrzuca artefakty i podaje źródło oraz pewność każdej liczby. Koniec z danymi, które mieszają okresy.' },
      { n: 'Pamięć', p: 'Rada pamięta swoje poprzednie analizy i częstość bazową własnych werdyktów. Każdą nową spółkę zaczyna od perspektywy zewnętrznej, nie od chwytliwej narracji.' },
      { n: 'Dreams', p: 'Przed werdyktem rada śni trzy ścieżki przyszłości spółki (byczą, bazową, niedźwiedzią), każdą z wyzwalaczem i sygnałem ostrzegawczym. Decyzję waży rozkładem możliwości, nie jednym punktem.' },
      { n: 'Kalibracja i base rate', p: 'Pewność ma odpowiadać sile dowodu, nie emocji. Rada aktualizuje przekonania bayesowsko i porównuje spółkę z klasą referencyjną wcześniej badanych firm.' },
      { n: 'Audyt danych', p: 'Statystyk i Czerwony Zespół sprawdzają liczby, zanim wejdą do raportu. Rozbieżności między źródłami są jawnie flagowane, nie wygładzane.' },
    ],
    reportsTitle: 'Raporty',
    disclaimerTitle: 'Zastrzeżenie',
    disclaimer: 'Materiały w sekcji D-LOGIC Capital mają charakter edukacyjny i dokumentacyjny. Pokazują proces analizy prowadzony na potrzeby własne autora. Nie są poradą inwestycyjną, rekomendacją w rozumieniu przepisów ani zachętą do kupna lub sprzedaży instrumentów finansowych. Inwestowanie wiąże się z ryzykiem utraty kapitału. Każdy podejmuje decyzje na własną odpowiedzialność i powinien skonsultować je z licencjonowanym doradcą. Autor nie odpowiada za decyzje podjęte na podstawie tych treści. Dane pochodzą ze źródeł publicznych i mogą zawierać błędy.',
    backHome: 'strona główna',
    priceLabel: 'cena',
    moreAbout: 'Więcej o D-LOGIC Capital',
  },
  en: {
    heroH1: 'A fund that thinks out loud',
    lead: 'A private agentic fund built for long-term investing. Sixteen distinguished investors and scientists analyze each company on its own merits, argue it through, and the outcome becomes a candid report. This is the record of the reasoning I rely on for my own decisions, left open to read.',
    pillars: [
      { n: '16', l: 'minds on the council', p: 'Nine great investors, six scientists from different fields, and a Red Team that attacks every thesis.' },
      { n: '0', l: 'automated trades', p: 'The council lays out the thesis; the decision and the trade rest with a human. No broker connection, no automation. The investor keeps full control.' },
      { n: '∞', l: 'rigor over conviction', p: 'Every conclusion goes through a premortem. When the data is thin or the council is split, the report says so plainly rather than manufacturing confidence.' },
    ],
    flowTitle: 'How a report comes together',
    flow: [
      { b: 'Hard data.', t: 'One set of facts drawn from filings and ratios, identical for every mind. Differences in the verdicts come from philosophy, not from the numbers.' },
      { b: 'The council and the science department.', t: 'Each member judges the company separately and independently, by their own method. The investors weigh value and the moat; the scientists examine risk, market reflexivity, and the durability of the advantage.' },
      { b: 'The Red Team.', t: "A devil's advocate tries to demolish the strongest thesis. Only the one that withstands the attack survives." },
      { b: 'Committee and verdict.', t: 'The synthesis shows where there is agreement, where there is dispute, what the risks are, and at what price the thesis holds. The result is a thesis with its reasoning.' },
    ],
    councilTitle: 'The council',
    councilSub: 'Every agent receives the same set of hard data and judges it by their own method. Below is how each of them thinks.',
    groupInvestors: 'investors',
    groupScience: 'science department',
    groupControl: 'control',
    investors: [
      { n: 'Warren Buffett', s: 'quality and value', p: 'He sizes up a company the way an owner buying the whole business for a decade would. First he looks for a durable competitive advantage, a moat visible in the numbers: high and steady ROE, fat operating margins, sensible debt. He estimates intrinsic value from future free cash flows and steps in only when the price offers a clear margin of safety. His hard proof is the cash the company throws off year after year. When the business is wonderful but the price is too high, his verdict is to wait.' },
      { n: 'Charlie Munger', s: 'quality at a fair price', p: "Buffett's partner and his sharper edge. He would rather pay a fair price for an outstanding business than a bargain price for a mediocre one. The proof that matters to him is return on invested capital and pricing power, because they show whether the advantage is real. He thinks in models from many disciplines and inverts the problem: instead of asking how to win, he checks the easiest way to lose and steers clear of it. He bets on a handful of well-reasoned, high-conviction decisions." },
      { n: 'Benjamin Graham', s: 'deep value', p: 'The father of value investing and the conscience of caution. He puts safety of capital ahead of profit and demands a margin of safety, buying well below what the company is worth. He works with hard measures: low P/E, low P/B, their product under the 22.5 threshold, strong liquidity, continuity of earnings. He treats the market as a nervous partner whose moods can be turned to advantage. When a price rests on a growth story alone, he says it plainly: too expensive.' },
      { n: 'Peter Lynch', s: 'growth at a reasonable price', p: 'He looks for growing companies whose price has not yet caught up with the fundamentals. His compass is the PEG ratio, price to earnings divided by their growth rate; a value near one he reads as fair, below one as a bargain. He sorts every company into a category, from steady giant to fast grower to turnaround, and judges it within that category. He likes simple stories he can sum up in a single sentence. His proof is real, lasting earnings growth.' },
      { n: 'Philip Fisher', s: 'quality growth', p: 'A pioneer of investing in quality growth. He seeks exceptional companies with a long runway ahead of them and holds them for years. He looks at the durability of growth, the scale of research and development, customer loyalty, and company culture. The proof of growth quality, for him, is high and sustained margins and rising free cash flow. A small premium for genuinely outstanding growth he considers justified, because time works in his favor.' },
      { n: 'Ray Dalio', s: 'macro and regimes', p: 'He views a company through the lens of macroeconomics and market regimes. He asks how the business will behave across different worlds: high and low inflation, growth and recession. His proof is the business’s sensitivity to interest rates, its leverage, the cyclicality of demand, and its place in the debt cycle. He values resilience and diversification, since no one can forecast the future precisely. He weighs the company’s role within the whole portfolio rather than as a single position in isolation.' },
      { n: 'Michael Burry', s: 'contrarian', p: 'He reads the footnotes in the filings, not the headlines. He looks for asymmetry: hidden value or a hidden bubble the crowd has missed. His proof is the real balance sheet and cash flows, actual debt, and the quality of earnings. He goes against the consensus, but only when the numbers back him. He asks bluntly why the market prices something the way it does, and whether it is right to.' },
      { n: 'Howard Marks', s: 'cycles and risk', p: 'He thinks on the second level. The first level says, “good company, buy”; he asks whether everyone already knows that and whether it is in the price. What matters most to him is risk understood as the permanent loss of capital. He studies where we stand in the cycle of sentiment, how wide the gap is between price and value, and whether the asymmetry favors the buyer. He repeats that the price you pay today decides your future return.' },
      { n: 'Nassim Taleb', s: 'risk of ruin', p: 'He guards one thing: that nothing blows up the portfolio. He does not pick winners; he gauges fragility. His proof is leverage, the ratio of debt to cash, liquidity, and dependence on continuous financing. He looks for tail risk, the rare events that destroy permanently. He holds a veto: however tempting the valuation, if the business can go bankrupt he calls to cut the position or stay well away.' },
    ],
    scientists: [
      { n: 'Benoit Mandelbrot', s: 'fat tails', p: 'The mathematician who reminds the room that markets are not gentle. Volatility has fat tails, so violent moves happen far more often than the bell curve assumes. His proof is the history of volatility, beta, and exposure to extremes. He warns when a valuation assumes a smooth future while the risk structure says otherwise. He asks not about the average scenario, but how fat the tail is and whether it can do harm.' },
      { n: 'The rigorist statistician', s: 'signal versus noise', p: 'The conscience of rigor on the council. He separates signal from noise and assumes by default that an observation is chance until the evidence outweighs it. His tools are the base rate, how companies like this usually end up, Bayesian thinking, and calibration. He checks whether the thesis rests on hard data or on a story, and whether the data hides errors. When the evidence is weak, he lowers the whole council’s confidence and calmly says, “I don’t know.”' },
      { n: 'George Soros', s: 'reflexivity and the game', p: 'He sees the market as a game with feedback: prices shape fundamentals, and fundamentals shape prices. His first question is why this opportunity exists at all and who sits on the other side of the trade. His proof is the divergence between the market’s narrative and the numbers, and the phase of the sentiment loop. He looks for moments when the consensus is wrong and the crowd is driven by emotion. He tells a true opportunity from a trap in which the other side knows more.' },
      { n: 'The domain technologist', s: 'is the moat real', p: 'He judges whether the company’s advantage is genuine from the side of product and technology, not numbers alone. He asks where a given technology sits on the adoption curve and whether it will hold off cheaper competition a decade out. His proof is gross margin as a measure of product strength, the scale of reinvestment, and the height of the barrier to entry. He explains in plain language what the moat is or why it is missing. He flags the risk that a new technology rewrites the rules of the game.' },
      { n: 'The market historian', s: 'cycles and analogies', p: 'He remembers that this has happened before. Manias and panics follow a repeatable pattern; only the actors change. His proof is historical analogy: the railway, radio, and internet bubbles, the debt crises. He checks whether the current valuation resembles a known peak of euphoria or a known trough of aversion. He reminds the room that the words “this time is different” usually cost the most.' },
      { n: 'The behavioral psychologist', s: 'cognitive biases', p: 'He studies where the crowd, and the council itself, goes wrong. The market is people with predictable errors: herding, loss aversion, overconfidence, extrapolating the latest trend. His proof is sentiment toward the company and the distance of price from value. He also watches the council, whether it has fallen in love with the company’s quality and is yielding to the narrative. Extreme fear he reads as a possible opportunity, extreme greed as a warning.' },
    ],
    redteam: { n: 'Red Team', s: "devil's advocate", p: 'Its only job is to break the thesis before you risk capital. It runs a premortem: it assumes a year has passed and the investment has lost half its value, then describes the most likely path to that loss. It looks for the strongest counterargument an intelligent counterparty could make and for the most fragile assumption in the thesis. Its proof is a concrete, credible failure scenario. Only a thesis that survives this attack reaches the report at full strength.' },
    methodsTitle: 'Discipline and methods',
    methods: [
      { n: 'Data at the source', p: "Fundamentals come straight from the company's filings (SEC EDGAR, 10-K/10-Q). We compute the ratios ourselves, and a control layer rejects artifacts and records the source and confidence of every number. No more figures that mix periods." },
      { n: 'Memory', p: 'The council remembers its own past analyses and the base rate of its verdicts. Every new company starts from the outside view, not the catchy narrative.' },
      { n: 'Dreams', p: 'Before a verdict the council dreams three future paths for the company (bull, base, bear), each with a trigger and a warning sign. The decision is weighed across the distribution, not a single point.' },
      { n: 'Calibration and base rates', p: 'Confidence should match the strength of the evidence, not emotion. The council updates its beliefs in a Bayesian way and compares the company to a reference class of firms studied earlier.' },
      { n: 'Data audit', p: 'The statistician and the Red Team check the numbers before they reach the report. Divergences between sources are flagged openly, not smoothed over.' },
    ],
    reportsTitle: 'Reports',
    disclaimerTitle: 'Disclaimer',
    disclaimer: 'The materials in the D-LOGIC Capital section are educational and documentary in nature. They show an analytical process carried out for the author’s own purposes. They are not investment advice, a recommendation within the meaning of the regulations, or an inducement to buy or sell financial instruments. Investing carries the risk of losing capital. Each person makes decisions at their own responsibility and should consult a licensed adviser. The author is not liable for decisions made on the basis of this content. The data comes from public sources and may contain errors.',
    backHome: 'home',
    priceLabel: 'price',
    moreAbout: 'More about D-LOGIC Capital',
  },
  de: {
    heroH1: 'Ein Fonds, der laut denkt',
    lead: 'Ein privater agentenbasierter Fonds für langfristiges Investieren. Sechzehn herausragende Investoren und Wissenschaftler analysieren jedes Unternehmen einzeln, ringen um eine Einschätzung, und das Ergebnis fließt in einen ehrlichen Bericht. Es ist die Aufzeichnung des Denkprozesses, auf den ich meine eigenen Entscheidungen stütze, offen zum Mitlesen.',
    pillars: [
      { n: '16', l: 'Köpfe im Rat', p: 'Neun große Investoren, sechs Wissenschaftler aus verschiedenen Disziplinen sowie das Red Team, das jede These angreift.' },
      { n: '0', l: 'automatische Transaktionen', p: 'Der Rat legt eine These vor, die Entscheidung und die Transaktion trifft der Mensch. Keine Anbindung an einen Broker, kein Automat. Die volle Kontrolle bleibt beim Investor.' },
      { n: '∞', l: 'Strenge vor Gewissheit', p: 'Jede Schlussfolgerung durchläuft einen Premortem-Test. Wenn die Daten schwach sind oder der Rat gespalten ist, sagt der Bericht dies offen, statt eine Überzeugung vorzutäuschen.' },
    ],
    flowTitle: 'Wie ein Bericht entsteht',
    flow: [
      { b: 'Harte Daten.', t: 'Ein Satz von Fakten aus Geschäftsberichten und Kennzahlen, derselbe für jeden Kopf. Unterschiede in den Urteilen entstehen aus der Philosophie, nicht aus den Daten.' },
      { b: 'Rat und wissenschaftliche Abteilung.', t: 'Jeder bewertet das Unternehmen einzeln und unabhängig, nach seiner eigenen Methode. Die Investoren berechnen Wert und Burggraben, die Wissenschaftler untersuchen Risiko, die Reflexivität des Marktes sowie die Beständigkeit des Vorteils.' },
      { b: 'Red Team.', t: 'Der Advocatus Diaboli versucht, die stärkste These zu widerlegen. Bestand hat nur jene, die dem Angriff standhält.' },
      { b: 'Komitee und Urteil.', t: 'Die Synthese zeigt, wo Einigkeit herrscht, wo Streit besteht und wie groß das Risiko ist, sowie zu welchem Kurs die These Sinn ergibt. Das Ergebnis ist eine These mit Begründung.' },
    ],
    councilTitle: 'Der Rat',
    councilSub: 'Jeder Agent erhält denselben Satz harter Daten und bewertet ihn nach seiner eigenen Methode. Im Folgenden die Denkmechanik eines jeden.',
    groupInvestors: 'investoren',
    groupScience: 'wissenschaftliche abteilung',
    groupControl: 'kontrolle',
    investors: [
      { n: 'Warren Buffett', s: 'Qualität und Wert', p: 'Er bewertet ein Unternehmen wie ein Eigentümer, der das gesamte Geschäft für ein Jahrzehnt kauft. Zuerst sucht er einen dauerhaften Wettbewerbsvorteil, einen Burggraben, der in den Zahlen sichtbar wird: hohe und stabile Eigenkapitalrendite (ROE), satte operative Margen, vertretbare Verschuldung. Den inneren Wert berechnet er aus den künftigen freien Cashflows und steigt nur dann ein, wenn der Preis eine deutliche Sicherheitsmarge bietet. Sein harter Beweis ist die Liquidität, die das Unternehmen Jahr für Jahr erwirtschaftet. Ist das Geschäft großartig, der Preis aber zu hoch, lautet sein Urteil: abwarten.' },
      { n: 'Charlie Munger', s: 'Qualität zu einem fairen Preis', p: 'Buffetts Partner und seine schärfere Variante. Er zahlt lieber einen fairen Preis für ein herausragendes Geschäft als einen Schnäppchenpreis für ein durchschnittliches. Entscheidender Beweis ist für ihn die Rendite auf das eingesetzte Kapital und die Preissetzungsmacht, denn sie zeigen, ob der Vorteil echt ist. Er denkt in Modellen aus vielen Disziplinen und kehrt das Problem um: Statt zu fragen, wie man gewinnt, prüft er, wie man am leichtesten verliert, und meidet diesen Weg. Er setzt auf wenige, gründlich durchdachte Entscheidungen mit hoher Überzeugung.' },
      { n: 'Benjamin Graham', s: 'tiefer Wert', p: 'Der Vater des Value-Investings und das Gewissen der Vorsicht. Er stellt die Sicherheit des Kapitals vor den Gewinn und verlangt eine Sicherheitsmarge, also den Kauf deutlich unter dem Wert des Unternehmens. Er bedient sich harter Maßstäbe: niedriges KGV (P/E), niedriges KBV (P/B), deren Produkt unterhalb der Schwelle von 22,5, solide Liquidität, kontinuierliche Gewinne. Den Markt behandelt er wie einen nervösen Partner, dessen Launen man nutzen kann. Stützt sich der Preis allein auf eine Wachstumserzählung, sagt er klar: zu teuer.' },
      { n: 'Peter Lynch', s: 'Wachstum zu einem vernünftigen Preis', p: 'Er sucht wachsende Unternehmen, deren Kurs die Fundamentaldaten noch nicht eingeholt hat. Sein Kompass ist die PEG-Kennzahl, der Kurs im Verhältnis zum Gewinn, geteilt durch dessen Wachstumstempo; einen Wert um eins hält er für fair, darunter für ein Schnäppchen. Jedes Unternehmen ordnet er einer Kategorie zu, vom stabilen Giganten über das schnell wachsende bis zum Turnaround, und bewertet es im Rahmen dieser Kategorie. Er mag einfache Geschichten, die sich in einem Satz zusammenfassen lassen. Als Beweis dient ihm ein reales und nachhaltiges Gewinnwachstum.' },
      { n: 'Philip Fisher', s: 'qualitatives Wachstum', p: 'Pionier des qualitativen Wachstumsinvestierens. Er sucht außergewöhnliche Unternehmen mit einer langen Wegstrecke vor sich und hält sie über Jahre. Er achtet auf die Beständigkeit des Wachstums, den Umfang von Forschung und Entwicklung, die Kundentreue sowie die Unternehmenskultur. Beweis für die Qualität des Wachstums sind für ihn hohe und gehaltene Margen sowie ein steigender freier Cashflow. Einen geringen Aufpreis für wahrhaft herausragendes Wachstum hält er für gerechtfertigt, denn die Zeit arbeitet für ihn.' },
      { n: 'Ray Dalio', s: 'Makro und Regime', p: 'Er betrachtet ein Unternehmen durch das Prisma der Makroökonomie und der Marktregime. Er fragt, wie sich das Unternehmen in verschiedenen Welten verhält: bei hoher und niedriger Inflation, in Aufschwung und Rezession. Seine Beweise sind die Sensitivität des Geschäfts gegenüber Zinsen, die Verschuldung, die Zyklizität der Nachfrage sowie die Position im Schuldenzyklus. Er schätzt Widerstandsfähigkeit und Diversifikation, denn niemand kann die Zukunft punktgenau vorhersagen. Er bewertet die Rolle des Unternehmens im gesamten Portfolio, nicht eine einzelne Position für sich genommen.' },
      { n: 'Michael Burry', s: 'Contrarian', p: 'Er liest die Fußnoten in den Berichten, nicht die Schlagzeilen. Er sucht Asymmetrien: verborgenen Wert oder eine verborgene Blase, die die Masse nicht erkennt. Sein Beweis ist die tatsächliche Bilanz und die Cashflows, die reale Verschuldung sowie die Qualität der Gewinne. Er geht gegen den Konsens, aber nur dann, wenn die Zahlen ihn stützen. Er fragt offen, warum der Markt etwas so bewertet, wie er es tut, und ob er damit recht hat.' },
      { n: 'Howard Marks', s: 'Zyklen und Risiko', p: 'Er denkt auf der zweiten Ebene. Die erste Ebene sagt „gutes Unternehmen, kaufen”; er fragt, ob alle das bereits wissen und ob es im Kurs steckt. Am wichtigsten ist für ihn das Risiko, verstanden als dauerhafter Kapitalverlust. Er untersucht, wo wir im Stimmungszyklus stehen, wie groß der Abstand zwischen Kurs und Wert ist und ob die Asymmetrie dem Käufer entgegenkommt. Er betont immer wieder, dass über die künftige Rendite der Preis entscheidet, den man heute zahlt.' },
      { n: 'Nassim Taleb', s: 'Ruinrisiko', p: 'Er achtet auf eine einzige Sache: dass nichts das Portfolio sprengt. Er wählt keine Gewinner aus, er bewertet Fragilität. Seine Beweise sind der Hebel, das Verhältnis von Schulden zu Liquidität, die Liquidierbarkeit sowie die Abhängigkeit von fortlaufender Finanzierung. Er sucht nach Tail-Risiken, seltenen Ereignissen, die dauerhaft zerstören. Er hat ein Vetorecht: Mag die Bewertung noch so verlockend sein, wenn das Geschäft pleitegehen kann, verlangt er, die Position zu begrenzen oder Abstand zu halten.' },
    ],
    scientists: [
      { n: 'Benoit Mandelbrot', s: 'fette Ränder', p: 'Der Mathematiker, der daran erinnert, dass Märkte nicht sanft sind. Die Volatilität hat fette Ränder, heftige Bewegungen treten also weit häufiger auf, als es die Glockenkurve annimmt. Seine Beweise sind die Volatilitätshistorie, das Beta sowie die Exponierung gegenüber Extremen. Er warnt, wenn die Bewertung eine glatte Zukunft unterstellt, die Risikostruktur aber etwas anderes sagt. Er fragt nicht nach dem durchschnittlichen Szenario, sondern danach, wie fett der Rand ist und ob er schaden kann.' },
      { n: 'Strenger Statistiker', s: 'Signal gegen Rauschen', p: 'Das Gewissen der Strenge im Rat. Er trennt das Signal vom Rauschen und nimmt im Zweifel an, dass eine Beobachtung zufällig ist, solange der Beweis nicht überwiegt. Seine Werkzeuge sind die Basisrate, also wie ähnliche Unternehmen üblicherweise enden, das bayessche Denken sowie die Kalibrierung. Er prüft, ob die These auf harten Daten beruht oder auf einer Erzählung, und ob die Daten keine Fehler enthalten. Ist der Beweis schwach, senkt er die Gewissheit des gesamten Rates und sagt gelassen „ich weiß es nicht”.' },
      { n: 'George Soros', s: 'Reflexivität und Spiel', p: 'Er betrachtet den Markt wie ein Spiel mit Rückkopplung: Kurse beeinflussen die Fundamentaldaten, und die Fundamentaldaten beeinflussen die Kurse. Seine erste Frage lautet, warum eine bestimmte Gelegenheit überhaupt existiert und wer auf der anderen Seite des Geschäfts steht. Beweis ist für ihn die Diskrepanz zwischen der Markterzählung und den Zahlen sowie die Phase der Stimmungsschleife. Er sucht Momente, in denen der Konsens falsch liegt und die Masse aus Emotion handelt. Er unterscheidet die echte Gelegenheit von der Falle, in der die Gegenseite mehr weiß.' },
      { n: 'Fachtechnologe', s: 'ist der Burggraben echt', p: 'Er beurteilt, ob der Vorteil des Unternehmens von der Produkt- und Technologieseite her echt ist und nicht nur in den Zahlen. Er fragt, wo eine Technologie auf der Adoptionskurve liegt und ob sie sich in einem Jahrzehnt gegen billigere Konkurrenz behaupten kann. Seine Beweise sind die Bruttomargen als Maß für die Produktstärke, der Umfang der Reinvestitionen sowie die Höhe der Eintrittsbarriere. Er erklärt in einfacher Sprache, worin der Burggraben besteht oder warum er fehlt. Er weist auf das Risiko hin, dass eine neue Technologie die Spielregeln verändert.' },
      { n: 'Markthistoriker', s: 'Zyklen und Analogien', p: 'Er erinnert daran, dass es das schon einmal gab. Manien und Panik folgen einem wiederkehrenden Muster, nur die Akteure wechseln. Seine Beweise sind historische Analogien: die Eisenbahn-, Radio- und Internetblasen, die Schuldenkrisen. Er prüft, ob die heutige Bewertung einem bekannten Gipfel der Euphorie oder einem bekannten Tief der Abneigung gleicht. Er erinnert daran, dass die Worte „diesmal ist es anders” meist am teuersten kommen.' },
      { n: 'Verhaltenspsychologe', s: 'kognitive Verzerrungen', p: 'Er untersucht, wo die Masse und der Rat selbst sich irren. Der Markt besteht aus Menschen mit vorhersehbaren Fehlern: Herdentrieb, Verlustaversion, Selbstüberschätzung, Fortschreibung des jüngsten Trends. Seine Beweise sind die Stimmung gegenüber dem Unternehmen sowie der Abstand des Kurses vom Wert. Er achtet auch auf den Rat selbst, ob er sich nicht in die Qualität des Unternehmens verliebt hat und ob er der Erzählung erliegt. Extreme Angst liest er als mögliche Gelegenheit, extreme Gier als Warnung.' },
    ],
    redteam: { n: 'Red Team', s: 'Advocatus Diaboli', p: 'Seine einzige Aufgabe ist es, die These zu widerlegen, bevor du Kapital riskierst. Es führt einen Premortem durch: Es nimmt an, ein Jahr sei vergangen und die Investition habe die Hälfte ihres Wertes verloren, und beschreibt dann den wahrscheinlichsten Weg zu diesem Verlust. Es sucht das stärkste Gegenargument einer intelligenten Gegenseite sowie die fragilste Annahme der These. Beweis ist für es ein konkretes, glaubwürdiges Szenario des Scheiterns. Nur eine These, die diesen Angriff übersteht, gelangt mit voller Kraft in den Bericht.' },
    methodsTitle: 'Disziplin und Methoden',
    methods: [
      { n: 'Daten an der Quelle', p: 'Die Fundamentaldaten stammen direkt aus den Berichten des Unternehmens (SEC EDGAR, 10-K/10-Q). Die Kennzahlen berechnen wir selbst, und eine Kontrollschicht verwirft Artefakte und vermerkt Quelle sowie Konfidenz jeder Zahl. Schluss mit Zahlen, die Zeiträume vermischen.' },
      { n: 'Gedächtnis', p: 'Der Rat erinnert sich an seine früheren Analysen und an die Basisrate seiner Urteile. Jedes neue Unternehmen beginnt mit der Außensicht, nicht mit dem griffigen Narrativ.' },
      { n: 'Dreams', p: 'Vor einem Urteil träumt der Rat drei Zukunftspfade des Unternehmens (Bull, Base, Bear), jeden mit Auslöser und Warnsignal. Die Entscheidung wird über die Verteilung gewichtet, nicht über einen einzelnen Punkt.' },
      { n: 'Kalibrierung und Basisraten', p: 'Die Konfidenz soll der Stärke der Belege entsprechen, nicht der Emotion. Der Rat aktualisiert seine Überzeugungen bayesianisch und vergleicht das Unternehmen mit einer Referenzklasse zuvor untersuchter Firmen.' },
      { n: 'Datenaudit', p: 'Der Statistiker und das Red Team prüfen die Zahlen, bevor sie in den Bericht gelangen. Abweichungen zwischen Quellen werden offen markiert, nicht geglättet.' },
    ],
    reportsTitle: 'Berichte',
    disclaimerTitle: 'Haftungsausschluss',
    disclaimer: 'Die Materialien im Bereich D-LOGIC Capital haben bildenden und dokumentierenden Charakter. Sie zeigen den Analyseprozess, der für die eigenen Zwecke des Autors durchgeführt wird. Sie sind keine Anlageberatung, keine Empfehlung im Sinne der gesetzlichen Vorschriften und keine Aufforderung zum Kauf oder Verkauf von Finanzinstrumenten. Mit dem Investieren ist das Risiko eines Kapitalverlusts verbunden. Jeder trifft seine Entscheidungen in eigener Verantwortung und sollte sie mit einem lizenzierten Berater abstimmen. Der Autor haftet nicht für Entscheidungen, die auf Grundlage dieser Inhalte getroffen werden. Die Daten stammen aus öffentlichen Quellen und können Fehler enthalten.',
    backHome: 'Startseite',
    priceLabel: 'Kurs',
    moreAbout: 'Mehr über D-LOGIC Capital',
  },
};

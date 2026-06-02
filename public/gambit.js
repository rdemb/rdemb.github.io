/* =====================================================================
   GAMBIT — agents, emblems, board renderer, managers, UI
   Requires gambit-chess.js (window.Chess)
   ===================================================================== */
(function(){
"use strict";
const C=window.Chess;
const docEl=document.documentElement;
const reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------- the 8 minds ----------
   personality: depth, temp(erature), risk, aggr(ession)
   emblem: generative sprite type ; hue: warm accent hue 20–52
*/
const MINDS=[
 { id:'iskra', name:'Iskra', emblem:'burst', hue:44, elo:1200, p:{depth:2,temp:85,risk:0.80,aggr:0.85},
   style:{pl:'ADHD · iskra. Szybko, w błyskach, kocha chaos i ofiary.',en:'ADHD · spark. Fast, in flashes, loves chaos and sacrifices.',de:'ADHS · Funke. Schnell, in Blitzen, liebt Chaos und Opfer.'} },
 { id:'kanon', name:'Kanon', emblem:'poly', hue:168, elo:1200, p:{depth:4,temp:12,risk:0.18,aggr:0.40},
   style:{pl:'Autyzm · architekt. Mistrz wzorca, liczy głęboko, niewzruszony.',en:'Autism · architect. Master of pattern, calculates deep, unshakable.',de:'Autismus · Architekt. Meister des Musters, rechnet tief, unerschütterlich.'} },
 { id:'cien', name:'Cień', emblem:'fortress', hue:222, elo:1200, p:{depth:3,temp:20,risk:0.15,aggr:0.25},
   style:{pl:'Lęk · strażnik. Mur i profilaktyka, czeka na cudzy błąd.',en:'Anxiety · sentinel. Wall and prophylaxis, waits for the other to err.',de:'Angst · Wächter. Mauer und Prophylaxe, wartet auf den Fehler.'} },
 { id:'zegar', name:'Zegar', emblem:'weave', hue:40, elo:1200, p:{depth:4,temp:8,risk:0.10,aggr:0.35},
   style:{pl:'Perfekcjonizm · zegarmistrz. Precyzja jak mechanizm, zero błędów.',en:'Perfectionism · watchmaker. Precision like a mechanism, zero mistakes.',de:'Perfektionismus · Uhrmacher. Präzision wie ein Uhrwerk, null Fehler.'} },
 { id:'poeta', name:'Poeta', emblem:'ribbon', hue:12, elo:1200, p:{depth:2,temp:70,risk:0.85,aggr:0.75},
   style:{pl:'Romantyk. Gra dla piękna, gambity i ofiary, choćby przegrać.',en:'Romantic. Plays for beauty, gambits and sacrifices, even to lose.',de:'Romantiker. Spielt für Schönheit, Gambits und Opfer, selbst zum Verlieren.'} },
 { id:'rachuba', name:'Rachuba', emblem:'radar', hue:200, elo:1200, p:{depth:3,temp:15,risk:0.25,aggr:0.45},
   style:{pl:'Analityk · lodowiec. Czysta kalkulacja, zero emocji.',en:'Analyst · glacier. Pure calculation, zero emotion.',de:'Analytiker · Gletscher. Reine Kalkulation, null Emotion.'} },
 { id:'echo', name:'Echo', emblem:'chaos', hue:270, elo:1200, p:{depth:3,temp:30,risk:0.40,aggr:0.50},
   style:{pl:'Empatia · lustro. Czyta i naśladuje, uczy się najszybciej.',en:'Empathy · mirror. Reads and mirrors, learns fastest.',de:'Empathie · Spiegel. Liest und spiegelt, lernt am schnellsten.'} },
 { id:'burza', name:'Burza', emblem:'flame', hue:8, elo:1200, p:{depth:2,temp:60,risk:0.90,aggr:0.95},
   style:{pl:'Mania · sztorm. Bezustanny atak, gra na całość.',en:'Mania · storm. Relentless attack, all-in.',de:'Manie · Sturm. Pausenloser Angriff, alles auf eine Karte.'} }
];
const byId={}; MINDS.forEach(m=>byId[m.id]=m);

/* stats container per mind */
MINDS.forEach(m=>{ m.w=0; m.l=0; m.d=0; m.form=0; m.elo0=m.elo; m.mood='spokojny'; m.live=false; });

/* ---------- i18n ---------- */
const T={
 pl:{ "nav.services":"usługi","nav.lab":"lab","nav.algo":"żywy algorytm","nav.blog":"blog","nav.contact":"kontakt",
  "hero.eyebrow":"Projekt · sztuczne umysły · na żywo","hero.tag":"ewoluujące umysły szachowe",
  "hero.lead":"Osiem neuroróżnorodnych umysłów uczy się grać w szachy. Grają ze sobą bez przerwy, ewoluują, pamiętają rywali i śnią. Każdy to inny rodzaj geniuszu, nie etykieta. Oglądaj ranking na żywo albo usiądź do partii z wybranym z nich.",
  "hero.cta1":"Oglądaj stoły","hero.live":"4 szachownice · 24/7","hero.s1":"rozegranych partii","hero.s2":"lider rankingu","hero.s3":"trwa turniej (h)","hero.featured":"umysł dnia","hero.thinking":"myśli na żywo",
  "boards.eyebrow":"Stoły turniejowe","boards.title":"Cztery partie w tej chwili","boards.lead":"Każdy ruch to realne, legalne szachy — generowane na żywo w przeglądarce. Ósemka sama dobiera sobie przeciwników.",
  "minds.eyebrow":"Ósemka umysłów","minds.title":"Każdy gra inaczej, bo myśli inaczej","minds.lead":"Inny styl poznawczy = inna ewaluacja, głębia, temperatura i skłonność do ryzyka. Z czasem słabsi uczą się od silniejszych i ewoluują we śnie.",
  "elo.eyebrow":"Klasyfikacja","elo.title":"Ranking ELO — na żywo","elo.lead":"Wynik aktualizuje się po każdej partii. Nastrój zależy od ostatnich rezultatów — wygrane rozpalają, porażki studzą.",
  "elo.h.mind":"umysł","elo.h.elo":"ELO","elo.h.wpr":"W·P·R","elo.h.mood":"nastrój",
  "eter.title":"eter — co mówią między ruchami","eter.live":"na żywo",
  "play.eyebrow":"Zagraj z umysłem","play.title":"Usiądź do partii z jednym z moich graczy","play.lead":"Wybierz umysł i zagraj prawdziwą partię tu, w przeglądarce. Grasz białymi, on liczy naprawdę. Jeśli akurat gra w turnieju, możesz usiąść do sparingu albo zaczekać. Twój wynik trafia do tabeli ELO pod Twoim nickiem.",
  "play.f.mind":"wybrany umysł","play.f.email":"twój e-mail","play.f.nick":"twój nick","play.free":"wolny, siadaj do gry","play.busy":"w grze, zagraj sparing lub zaczekaj","play.f.btn":"Zagraj teraz","play.note":"Grasz białymi, bezpośrednio w przeglądarce. Wynik trafia do tabeli ELO, bez konta i bez maila.",
  "foot.tag":"GAMBIT — część studia D-LOGIC. Silnik gra non-stop na własnym serwerze · python-chess.","foot.h1":"Projekt","foot.h2":"Studio","foot.note":"Każdy ruch zapisany. Każda partia liczona.",
  "t.depth":"głębia","t.temp":"temperat.","t.risk":"ryzyko","t.aggr":"agresja",
  "st.think":"myśli…","st.live":"na żywo","st.mate":"mat","st.draw":"remis","st.win":"wygrana",
  "gm.turn":"Twój ruch, grasz białymi","gm.check":"Szach!","gm.win":"Mat! Wygrywasz 🏆","gm.lose":"Tym razem wygrał umysł.","gm.draw":"Remis.","gm.resign":"Poddaj","gm.new":"Nowa partia","elo.you":"Ty" },
 en:{ "nav.services":"services","nav.lab":"lab","nav.algo":"living algorithm","nav.blog":"blog","nav.contact":"contact",
  "hero.eyebrow":"Project · artificial minds · live","hero.tag":"evolving chess minds",
  "hero.lead":"Eight neurodivergent minds learn to play chess. They play each other non-stop, evolve, remember rivals and dream. Each is a different kind of genius, not a label. Watch the ranking live or sit down for a game with one of them.",
  "hero.cta1":"Watch the tables","hero.live":"4 boards · 24/7","hero.s1":"games played","hero.s2":"ranking leader","hero.s3":"tournament running (h)","hero.featured":"mind of the day","hero.thinking":"thinking live",
  "boards.eyebrow":"Tournament tables","boards.title":"Four games, right now","boards.lead":"Every move is real, legal chess — generated live in your browser. The eight pick their own opponents.",
  "minds.eyebrow":"The eight minds","minds.title":"Each plays differently because each thinks differently","minds.lead":"A different cognitive style = different evaluation, depth, temperature and appetite for risk. Over time the weaker learn from the stronger and evolve in their sleep.",
  "elo.eyebrow":"Classification","elo.title":"ELO ranking — live","elo.lead":"The score updates after every game. Mood follows recent results — wins ignite, losses cool down.",
  "elo.h.mind":"mind","elo.h.elo":"ELO","elo.h.wpr":"W·L·D","elo.h.mood":"mood",
  "eter.title":"the ether — what they say between moves","eter.live":"live",
  "play.eyebrow":"Play a mind","play.title":"Sit down for a game with one of my players","play.lead":"Pick a mind and play a real game, right here in your browser. You play White, it calculates for real. If it's busy in a tournament, sit down for a sparring game or wait. Your result joins the ELO table under your nick.",
  "play.f.mind":"chosen mind","play.f.email":"your email","play.f.nick":"your nick","play.free":"free, sit down","play.busy":"in a game, spar now or wait","play.f.btn":"Play now","play.note":"You play White, right in the browser. Your result joins the ELO table, no account, no email.",
  "foot.tag":"GAMBIT — part of D-LOGIC studio. The engine plays non-stop on its own server · python-chess.","foot.h1":"Project","foot.h2":"Studio","foot.note":"Every move recorded. Every game counted.",
  "t.depth":"depth","t.temp":"temperat.","t.risk":"risk","t.aggr":"aggression",
  "st.think":"thinking…","st.live":"live","st.mate":"mate","st.draw":"draw","st.win":"win",
  "gm.turn":"Your move, you play White","gm.check":"Check!","gm.win":"Checkmate! You win 🏆","gm.lose":"The mind won this time.","gm.draw":"Draw.","gm.resign":"Resign","gm.new":"New game","elo.you":"you" },
 de:{ "nav.services":"Leistungen","nav.lab":"Lab","nav.algo":"lebender Algorithmus","nav.blog":"Blog","nav.contact":"Kontakt",
  "hero.eyebrow":"Projekt · künstliche Geister · live","hero.tag":"sich entwickelnde Schachgeister",
  "hero.lead":"Acht neurodivergente Geister lernen Schach. Sie spielen ununterbrochen gegeneinander, entwickeln sich, erinnern sich an Rivalen und träumen. Jeder ist eine andere Art Genie, kein Etikett. Verfolge das Ranking live oder setz dich zu einer Partie mit einem von ihnen.",
  "hero.cta1":"Tische ansehen","hero.live":"4 Bretter · 24/7","hero.s1":"gespielte Partien","hero.s2":"Ranglistenführer","hero.s3":"Turnier läuft (h)","hero.featured":"Geist des Tages","hero.thinking":"denkt live",
  "boards.eyebrow":"Turniertische","boards.title":"Vier Partien, gerade jetzt","boards.lead":"Jeder Zug ist echtes, legales Schach — live im Browser erzeugt. Die acht wählen ihre Gegner selbst.",
  "minds.eyebrow":"Die acht Geister","minds.title":"Jeder spielt anders, weil jeder anders denkt","minds.lead":"Ein anderer kognitiver Stil = andere Bewertung, Tiefe, Temperatur und Risikobereitschaft. Mit der Zeit lernen die Schwächeren von den Stärkeren und entwickeln sich im Schlaf.",
  "elo.eyebrow":"Klassifikation","elo.title":"ELO-Rangliste — live","elo.lead":"Die Wertung aktualisiert sich nach jeder Partie. Die Stimmung folgt den letzten Ergebnissen — Siege entfachen, Niederlagen kühlen ab.",
  "elo.h.mind":"Geist","elo.h.elo":"ELO","elo.h.wpr":"S·N·R","elo.h.mood":"Stimmung",
  "eter.title":"der Äther — was sie zwischen den Zügen sagen","eter.live":"live",
  "play.eyebrow":"Spiel gegen einen Geist","play.title":"Setz dich zu einer Partie mit einem meiner Spieler","play.lead":"Wähle einen Geist und spiel eine echte Partie, direkt im Browser. Du spielst Weiß, er rechnet wirklich. Spielt er gerade ein Turnier, setz dich zum Sparring oder warte. Dein Ergebnis kommt unter deinem Nick in die ELO-Tabelle.",
  "play.f.mind":"gewählter Geist","play.f.email":"deine E-Mail","play.f.nick":"dein Nick","play.free":"frei, setz dich","play.busy":"im Spiel, spar jetzt oder warte","play.f.btn":"Jetzt spielen","play.note":"Du spielst Weiß, direkt im Browser. Dein Ergebnis kommt in die ELO-Tabelle, kein Konto, keine E-Mail.",
  "foot.tag":"GAMBIT — Teil des D-LOGIC Studios. Die Engine spielt rund um die Uhr auf eigenem Server · python-chess.","foot.h1":"Projekt","foot.h2":"Studio","foot.note":"Jeder Zug gespeichert. Jede Partie gezählt.",
  "t.depth":"Tiefe","t.temp":"Temperat.","t.risk":"Risiko","t.aggr":"Aggression",
  "st.think":"denkt…","st.live":"live","st.mate":"matt","st.draw":"remis","st.win":"Sieg",
  "gm.turn":"Du bist am Zug, du spielst Weiß","gm.check":"Schach!","gm.win":"Matt! Du gewinnst 🏆","gm.lose":"Diesmal gewann der Geist.","gm.draw":"Remis.","gm.resign":"Aufgeben","gm.new":"Neue Partie","elo.you":"du" }
};
let lang="pl"; try{ lang=localStorage.getItem("dlogic-lang")||"pl"; }catch(e){}
function tr(k){ return (T[lang]||T.pl)[k]||(T.pl[k]||k); }

/* mood names + eter banter pools (per lang) */
const MOODS={
 pl:{hot:'rozpalony',up:'pewny siebie',calm:'spokojny',low:'skupiony',cold:'ostygły',dream:'śni'},
 en:{hot:'on fire',up:'confident',calm:'calm',low:'focused',cold:'cooled',dream:'dreaming'},
 de:{hot:'in Flammen',up:'selbstsicher',calm:'ruhig',low:'fokussiert',cold:'abgekühlt',dream:'träumt'}
};
const BANTER={
 pl:{ think:['liczę warianty…','widzę coś w tej strukturze.','tempo, tempo.','to nie jest jeszcze jasne.','czuję inicjatywę.','spokojnie, mam plan.'],
   capture:['biorę. tak jest czyściej.','materiał to materiał.','dziękuję za figurę.','wymiana na moją korzyść.'],
   check:['szach. twój król drży.','goń króla, reszta się ułoży.','presja rośnie.'],
   win:['mat. dobra partia.','liczby się zgadzały.','to było do przewidzenia.','śpij, jutro rewanż.'],
   lose:['przegrałem uczciwie.','zapamiętam ten wariant.','nauczę się tego we śnie.','silniejszy wygrał.'],
   idle:['między ruchami też się uczę.','pamiętam naszą ostatnią partię.','śniłem o tej pozycji.','każdy ruch zapisany.'] },
 en:{ think:['calculating lines…','I see something in this structure.','tempo, tempo.','not clear yet.','I feel the initiative.','easy, I have a plan.'],
   capture:['I take. cleaner this way.','material is material.','thanks for the piece.','trade in my favour.'],
   check:['check. your king trembles.','chase the king, the rest follows.','pressure rising.'],
   win:['mate. good game.','the numbers added up.','that was foreseeable.','sleep, rematch tomorrow.'],
   lose:['I lost fair and square.','I will remember this line.','I will learn it in my sleep.','the stronger one won.'],
   idle:['I learn between moves too.','I remember our last game.','I dreamt of this position.','every move recorded.'] },
 de:{ think:['berechne Varianten…','ich sehe etwas in dieser Struktur.','Tempo, Tempo.','noch nicht klar.','ich spüre die Initiative.','ruhig, ich habe einen Plan.'],
   capture:['ich nehme. so ist es sauberer.','Material ist Material.','danke für die Figur.','Abtausch zu meinen Gunsten.'],
   check:['Schach. dein König zittert.','jag den König, der Rest folgt.','der Druck steigt.'],
   win:['matt. gutes Spiel.','die Zahlen stimmten.','das war absehbar.','schlaf, morgen Revanche.'],
   lose:['ich habe fair verloren.','ich merke mir diese Variante.','ich lerne es im Schlaf.','der Stärkere gewann.'],
   idle:['auch zwischen Zügen lerne ich.','ich erinnere mich an unsere letzte Partie.','ich träumte von dieser Stellung.','jeder Zug gespeichert.'] }
};

/* ---------- THEME helpers ---------- */
function cssv(n){ return getComputedStyle(docEl).getPropertyValue(n).trim(); }
function warm(hue,l,s){ return 'hsl('+hue+','+(s==null?78:s)+'%,'+l+'%)'; }

/* =====================================================================
   EMBLEM SPRITES — each mind is an animated 2D generative organism
   drawEmblem(ctx, W, H, mind, t, mood01, think01)
   mood01: 0(low)..1(hot) ; think01: 0..1 pulse when it's thinking
   ===================================================================== */
function drawEmblem(ctx, W, H, mind, t, mood, think){
  const cx=W/2, cy=H/2, R=Math.min(W,H)*0.5;
  const hue=mind.hue;
  const speed = reduce?0.0:1;
  const energy = 0.55 + mood*0.5 + think*0.25;
  ctx.clearRect(0,0,W,H);
  // soft radial glow base
  const dark = docEl.getAttribute('data-theme')!=='light';
  const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.1);
  g.addColorStop(0, 'hsla('+hue+',80%,'+(dark?22:62)+'%,'+(0.30+mood*0.25)+')');
  g.addColorStop(1, 'hsla('+hue+',80%,'+(dark?8:80)+'%,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(cx,cy);
  ctx.globalCompositeOperation = dark?'lighter':'source-over';
  const A=(a)=> 'hsla('+hue+',85%,'+(dark?60:38)+'%,'+a+')';
  const HOT=(a)=> 'hsla('+hue+',92%,'+(dark?72:46)+'%,'+a+')';

  switch(mind.emblem){
    case 'burst': { // KAIROS — rotating triangle burst
      const rot=t*0.0006*speed*(1+mood);
      const n=6;
      for(let k=0;k<n;k++){ const a=rot+k/n*TAU; const r=R*(0.34+0.12*Math.sin(t*0.003*speed+k));
        ctx.save(); ctx.rotate(a); ctx.beginPath();
        ctx.moveTo(0,-r*1.4); ctx.lineTo(r*0.5,r*0.5); ctx.lineTo(-r*0.5,r*0.5); ctx.closePath();
        ctx.strokeStyle=A(0.5*energy); ctx.lineWidth=1.4; ctx.stroke(); ctx.restore(); }
      ctx.fillStyle=HOT(0.85); ctx.beginPath(); ctx.arc(0,0,R*0.10*(1+think*0.5),0,TAU); ctx.fill();
      break; }
    case 'weave': { // LOOM — lissajous weave
      ctx.strokeStyle=A(0.55*energy); ctx.lineWidth=1.2; ctx.beginPath();
      const a=3,b=2, ph=t*0.0009*speed;
      for(let i=0;i<=220;i++){ const u=i/220*TAU; const x=Math.sin(a*u+ph)*R*0.78; const y=Math.sin(b*u)*R*0.78; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
      ctx.stroke();
      ctx.strokeStyle=HOT(0.4*energy); ctx.beginPath();
      for(let i=0;i<=220;i++){ const u=i/220*TAU; const x=Math.sin(2*u-ph)*R*0.6; const y=Math.sin(3*u+ph)*R*0.6; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
      ctx.stroke(); break; }
    case 'flame': { // EMBER — flame particles
      const n=reduce?10:26;
      for(let k=0;k<n;k++){ const seed=k*12.9898; const fx=(Math.sin(seed)*R*0.5);
        const ph=(t*0.0016*speed*(1+mood)+k*0.4)%1; const y=R*0.7 - ph*R*1.5;
        const x=fx*(1-ph)+Math.sin(t*0.004+k)*R*0.12;
        const s=(1-ph)*R*0.16*energy;
        ctx.fillStyle=HOT(0.6*(1-ph)); ctx.beginPath(); ctx.arc(x,y,Math.max(0.5,s),0,TAU); ctx.fill(); }
      ctx.fillStyle=HOT(0.5); ctx.beginPath(); ctx.ellipse(0,R*0.55,R*0.5,R*0.18,0,0,TAU); ctx.fill();
      break; }
    case 'poly': { // VERTEX — rotating polygon wireframe
      const rot=t*0.0004*speed; const layers=3;
      for(let L=0;L<layers;L++){ const sides=5+L; const r=R*(0.32+L*0.22); ctx.save(); ctx.rotate(rot*(L%2?-1:1)+L);
        ctx.beginPath(); for(let i=0;i<=sides;i++){ const a=i/sides*TAU; const x=Math.cos(a)*r,y=Math.sin(a)*r; i?ctx.lineTo(x,y):ctx.moveTo(x,y);} 
        ctx.strokeStyle=A((0.6-L*0.13)*energy); ctx.lineWidth=1.3; ctx.stroke();
        for(let i=0;i<sides;i++){ const a=i/sides*TAU; ctx.fillStyle=HOT(0.5*energy); ctx.beginPath(); ctx.arc(Math.cos(a)*r,Math.sin(a)*r,1.6,0,TAU); ctx.fill(); }
        ctx.restore(); }
      break; }
    case 'radar': { // NOCTUA — radar sweep + concentric
      for(let r=R*0.22;r<R*0.95;r+=R*0.2){ ctx.strokeStyle=A(0.18*energy); ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,0,r,0,TAU); ctx.stroke(); }
      const sweep=t*0.0014*speed;
      const grad=ctx.createConicGradient? null:null;
      ctx.save(); ctx.rotate(sweep);
      ctx.fillStyle=HOT(0.22*energy); ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R*0.92,-0.5,0.0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=HOT(0.7*energy); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(R*0.92,0); ctx.stroke(); ctx.restore();
      // blips
      for(let k=0;k<4;k++){ const a=k*1.7+Math.sin(t*0.001+k); const r=R*(0.4+0.3*Math.sin(t*0.0007+k*2)); const bl=(Math.sin(sweep-a)+1)/2;
        ctx.fillStyle=HOT(0.2+0.7*Math.pow(bl,6)); ctx.beginPath(); ctx.arc(Math.cos(a)*r,Math.sin(a)*r,2.2,0,TAU); ctx.fill(); }
      break; }
    case 'chaos': { // FLUX — chaotic jitter cloud (Clifford-ish)
      let x=0.1,y=0.1; const a=1.6+Math.sin(t*0.0004)*0.7,b=-1.8+Math.cos(t*0.0003)*0.6,c=1.2,d=0.9;
      ctx.fillStyle=A(0.5*energy);
      const N=reduce?180:520;
      for(let i=0;i<N;i++){ const nx=Math.sin(a*y)+c*Math.cos(a*x); const ny=Math.sin(b*x)+d*Math.cos(b*y); x=nx;y=ny;
        ctx.fillRect(x*R*0.42, y*R*0.42, 1.1,1.1); }
      break; }
    case 'fortress': { // ATLAS — stacked fortress bars
      const cols=5; const bw=R*0.26;
      for(let i=0;i<cols;i++){ const x=(i-(cols-1)/2)*bw*1.05; const h=R*(0.5+0.32*Math.abs(Math.sin(t*0.0011*speed+i*0.9)))*energy;
        ctx.fillStyle=A(0.4+0.12*((i%2)));
        ctx.fillRect(x-bw*0.42, R*0.55-h, bw*0.84, h);
        ctx.strokeStyle=HOT(0.5); ctx.lineWidth=1; ctx.strokeRect(x-bw*0.42, R*0.55-h, bw*0.84, h); }
      ctx.strokeStyle=A(0.5); ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-R*0.8,R*0.55); ctx.lineTo(R*0.8,R*0.55); ctx.stroke();
      break; }
    case 'ribbon': { // ARIA — smooth sine ribbon
      for(let L=0;L<3;L++){ ctx.strokeStyle=A((0.5-L*0.13)*energy); ctx.lineWidth=2-L*0.5; ctx.beginPath();
        for(let i=0;i<=120;i++){ const u=i/120; const x=(u-0.5)*R*1.7; const y=Math.sin(u*TAU*1.5 + t*0.0016*speed + L*0.9)*R*0.4*(1-L*0.18); i?ctx.lineTo(x,y):ctx.moveTo(x,y); }
        ctx.stroke(); }
      ctx.fillStyle=HOT(0.8); const hx=Math.sin(t*0.0016*speed)*R*0.0; ctx.beginPath(); ctx.arc(hx,Math.sin(t*0.0016*speed)*R*0.4,R*0.07,0,TAU); ctx.fill();
      break; }
  }
  ctx.restore();
}

/* register an emblem canvas to the shared RAF; returns control obj */
const emblemCanvases=[];
function addEmblem(canvas, mind, opts){
  opts=opts||{};
  const ctx=canvas.getContext('2d');
  const obj={canvas,ctx,mind,opts,W:0,H:0,dpr:1, mood:0.4, think:0};
  function size(){ const r=canvas.getBoundingClientRect(); obj.dpr=Math.min(devicePixelRatio||1,2); obj.W=Math.max(1,r.width); obj.H=Math.max(1,r.height); canvas.width=obj.W*obj.dpr; canvas.height=obj.H*obj.dpr; ctx.setTransform(obj.dpr,0,0,obj.dpr,0,0); }
  obj.size=size; size();
  emblemCanvases.push(obj);
  return obj;
}

/* =====================================================================
   BOARD RENDERER — premium 2D board
   ===================================================================== */
const GLYPH={ w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'}, b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'} };
const SOLID={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};

function Board(opts){
  const canvas=opts.canvas, ctx=canvas.getContext('2d');
  const self={};
  let W=0,H=0,dpr=1, cell=0;
  let state=C.newGame();
  let display=state.board.slice();   // board drawn while a move animates (pre-move minus moving piece)
  let anim=null;                     // {pieces:[{piece,from,to}], cap:{sq,piece}|null, start, dur}
  let lastMove=null, fx=[];          // capture rings
  let checkSq=-1;
  self.white=opts.white; self.black=opts.black;
  self.over=false; self.result=null; self.moveNo=0; self.evalCp=0; self.evalShown=0.5;
  self.acc=0; self.interval=opts.interval||2200; self.onMove=opts.onMove; self.onEnd=opts.onEnd; self.onStart=opts.onStart;
  self.getTurn=function(){ return state.turn; };
  self.isAnim=function(){ return !!anim; };

  function size(){ const r=canvas.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2); W=Math.max(8,r.width); H=W; canvas.width=W*dpr; canvas.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); cell=W/8; }
  self.size=size; size();

  self.reset=function(white,black){
    state=C.newGame(); display=state.board.slice(); anim=null; lastMove=null; fx=[]; checkSq=-1;
    self.white=white; self.black=black; self.over=false; self.result=null; self.moveNo=0; self.evalCp=0; self.evalShown=0.5; self.acc=0;
    white.live=true; black.live=true;
  };

  function startMove(){
    if(self.over) return;
    const mind = state.turn==='w'? self.white : self.black;
    const m=C.pickMove(state, mind.p);
    if(!m){ finish(); return; }
    const movingPiece=state.board[m.from];
    const pieces=[{piece:movingPiece, from:m.from, to:m.to}];
    let cap=null;
    if(m.cap){ if(m.ep){ const tr=m.to>>3, tc=m.to&7; const capRow= movingPiece.c==='w'?tr+1:tr-1; const cs=capRow*8+tc; cap={sq:cs, piece:state.board[cs]}; }
               else cap={sq:m.to, piece:state.board[m.to]}; }
    if(m.castle){ const row=m.to>>3; if(m.castle==='K') pieces.push({piece:state.board[row*8+7], from:row*8+7, to:row*8+5}); else pieces.push({piece:state.board[row*8+0], from:row*8+0, to:row*8+3}); }
    // build display board: pre-move board with 'from' squares emptied
    display=state.board.slice(); for(const pc of pieces) display[pc.from]=null;
    anim={ pieces, cap, m, start:performance.now(), dur: reduce?1:opts.animDur||380 };
  }
  function commit(){
    const m=anim.m; const ns=C.makeMove(state, m);
    if(anim.cap){ fx.push({sq:anim.cap.sq, start:performance.now()}); }
    state=ns; display=state.board.slice(); lastMove={from:m.from,to:m.to};
    anim=null; self.moveNo=state.full;
    // eval
    const cp = C.evaluate(state.board); self.evalCp = state.turn==='w'?cp:cp; // white-positive
    checkSq = C.inCheck(state.board, state.turn)? C.kingSq(state.board, state.turn) : -1;
    if(self.onMove) self.onMove(self, m, anim);
    const st=C.status(state);
    if(st.over){ self.over=true; self.result=st; if(self.onEnd) self.onEnd(self, st); }
  }
  function finish(){ self.over=true; self.result={over:true,result:'½-½',reason:'nomove'}; if(self.onEnd) self.onEnd(self,self.result); }

  self.tickSim=function(dt){
    if(self.over) return;
    if(anim){ /* animating: handled in draw; commit when done */
      if(performance.now()-anim.start >= anim.dur){ commit(); }
    } else {
      self.acc+=dt;
      if(self.acc>=self.interval){ self.acc=0; startMove(); }
    }
  };

  // ===== TRYB SERWERA: pozycje z chess.json (silnik na VPS), nie z lokalnego sim =====
  function fenToDisplay(fen){ const rows=fen.split(' ')[0].split('/'); const d=new Array(64).fill(null);
    for(let r=0;r<8;r++){ let c=0; for(const ch of rows[r]){ if(ch>='1'&&ch<='8'){ c+=+ch; } else { const w=ch===ch.toUpperCase(); d[r*8+c]={c:w?'w':'b',t:ch.toLowerCase()}; c++; } } } return d; }
  function algSq(x){ return (8-(+x[1]))*8 + 'abcdefgh'.indexOf(x[0]); }
  function findKing(d,turn){ for(let i=0;i<64;i++){ const p=d[i]; if(p&&p.t==='k'&&p.c===turn) return i; } return -1; }
  self.setServer=function(fen,lastUci,evalcp,check){
    display=fenToDisplay(fen);
    lastMove=(lastUci&&lastUci.length>=4)?{from:algSq(lastUci.slice(0,2)),to:algSq(lastUci.slice(2,4))}:null;
    const turn=(fen.split(' ')[1]||'w'); self._turn=turn;
    checkSq=check?findKing(display,turn):-1;
    self.evalCp=(evalcp||0)*100; anim=null;
  };
  self.getTurn=function(){ return self.local? state.turn : (self._turn||'w'); };
  self.tick=function(dt){ if(self.local) self.tickSim(dt); };  // lokalny sim TYLKO w trybie fallback; w trybie serwera ruchy z setServer
  self.draw=function(now){
    const light=cssv('--sq-light'), dark=cssv('--sq-dark'), acc=cssv('--accent');
    const accRGB=(cssv('--accent-rgb')||'232,178,58');
    const isLight = docEl.getAttribute('data-theme')==='light';
    // squares
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){ ctx.fillStyle=((r+c)&1)?dark:light; ctx.fillRect(c*cell,r*cell,cell+0.5,cell+0.5); }
    // last move highlight
    if(lastMove){ for(const s of [lastMove.from,lastMove.to]){ const c=s&7,r=s>>3; ctx.fillStyle='rgba('+accRGB+',0.16)'; ctx.fillRect(c*cell,r*cell,cell,cell); } }
    // check glow
    if(checkSq>=0){ const c=checkSq&7,r=checkSq>>3; const pul=0.3+0.25*Math.sin(now*0.006); ctx.save(); ctx.fillStyle='rgba(232,103,90,'+pul+')'; ctx.fillRect(c*cell,r*cell,cell,cell); ctx.restore(); }
    // coordinates (mono, subtle)
    ctx.font='600 '+(cell*0.16)+"px 'JetBrains Mono Variable',monospace"; ctx.textBaseline='alphabetic';
    for(let i=0;i<8;i++){ ctx.fillStyle=((i)&1)?'rgba('+accRGB+',0.30)':'rgba('+accRGB+',0.18)';
      ctx.fillText(8-i, 3, i*cell+cell*0.2); // ranks left
      ctx.fillText("abcdefgh"[i], i*cell+cell*0.78, H-4); } // files bottom
    // pieces (static)
    function drawPiece(piece, px, py, alpha){
      if(!piece) return;
      const sz=cell*0.78; ctx.font=sz+"px 'Segoe UI Symbol','Arial Unicode MS',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle';
      const isW=piece.c==='w'; const glyph=SOLID[piece.t];
      ctx.save(); ctx.globalAlpha=alpha==null?1:alpha;
      // shadow
      ctx.shadowColor='rgba(0,0,0,'+(isLight?0.22:0.5)+')'; ctx.shadowBlur=cell*0.10; ctx.shadowOffsetY=cell*0.05;
      // body fill
      ctx.fillStyle = isW ? (isLight?'#FCFBF6':'#ECE8DC') : (isLight?'#2B2E35':'#10131A');
      ctx.fillText(glyph, px, py);
      ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0;
      // rim / outline
      ctx.lineWidth=Math.max(1,cell*0.022); ctx.strokeStyle = isW ? (isLight?'#B9B4A2':'#7C776A') : (isLight?'#0E1014':'#454B57');
      ctx.strokeText(glyph, px, py);
      ctx.restore();
    }
    for(let s=0;s<64;s++){ const p=display[s]; if(!p)continue; const c=s&7,r=s>>3; drawPiece(p, c*cell+cell/2, r*cell+cell/2); }
    // animating pieces
    if(anim){ const t=clamp((now-anim.start)/anim.dur,0,1), e=easeIO(t);
      if(anim.cap){ drawPiece(anim.cap.piece, (anim.cap.sq&7)*cell+cell/2, (anim.cap.sq>>3)*cell+cell/2, 1-e); }
      for(const pc of anim.pieces){ const fc=pc.from&7,fr=pc.from>>3, tc=pc.to&7,tr=pc.to>>3;
        const px=lerp(fc,tc,e)*cell+cell/2, py=lerp(fr,tr,e)*cell+cell/2; drawPiece(pc.piece, px, py); }
    }
    // capture rings
    fx=fx.filter(f=>now-f.start<420);
    for(const f of fx){ const t=(now-f.start)/420; const c=f.sq&7,r=f.sq>>3; ctx.save(); ctx.globalAlpha=(1-t)*0.7; ctx.strokeStyle='rgba('+accRGB+',1)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(c*cell+cell/2,r*cell+cell/2, t*cell*0.6, 0, TAU); ctx.stroke(); ctx.restore(); }
  };
  return self;
}

/* =====================================================================
   APP — build UI, manage 4 boards, ELO, eter, RAF
   ===================================================================== */
const boards=[];
let featured=null;

/* ELO update (simple) */
function applyResult(white, black, result){
  // result: '1-0' white wins, '0-1' black wins, else draw
  const Ea=1/(1+Math.pow(10,(black.elo-white.elo)/400));
  const Sa = result==='1-0'?1 : result==='0-1'?0 : 0.5;
  const K=24;
  const dW=Math.round(K*(Sa-Ea)); white.elo+=dW; black.elo-=dW;
  if(Sa===1){white.w++;black.l++; white.form=Math.min(3,white.form+1); black.form=Math.max(-3,black.form-1);}
  else if(Sa===0){white.l++;black.w++; white.form=Math.max(-3,white.form-1); black.form=Math.min(3,black.form+1);}
  else {white.d++;black.d++;}
  refreshMoods(); renderElo();
  appState.games++;
}
function refreshMoods(){
  const md=MOODS[lang]||MOODS.pl;
  for(const m of MINDS){ m.moodKey = m.form>=2?'hot':m.form===1?'up':m.form===0?'calm':m.form===-1?'low':'cold'; m.mood=md[m.moodKey]; m.mood01 = clamp((m.form+3)/6,0,1); }
}

/* eter feed */
const eterMax=9;
function pushEter(mind, type){
  const pool=(BANTER[lang]||BANTER.pl)[type]||[]; if(!pool.length) return;
  const msg=pool[(Math.random()*pool.length)|0];
  const feed=document.getElementById('eterFeed'); if(!feed) return;
  const now=new Date(); const hh=String(now.getHours()).padStart(2,'0'), mm=String(now.getMinutes()).padStart(2,'0');
  const div=document.createElement('div'); div.className='eter-line';
  div.innerHTML='<span class="time">'+hh+':'+mm+'</span><span class="who">'+mind.name+'</span><span class="msg">'+msg+'</span>';
  feed.insertBefore(div, feed.firstChild);
  while(feed.children.length>eterMax) feed.removeChild(feed.lastChild);
}

const appState={ games:0, tourneyH: 0 };
let SERVER_BASE=null, ELO0_PENDING=true, MODE='init', serverTries=0, localBanterTimer=0;
function applyEter(chat){
  const feed=document.getElementById('eterFeed'); if(!feed) return;
  const bid={}; MINDS.forEach(m=>bid[m.id]=m);
  const recent=(chat||[]).slice(-eterMax).slice().reverse();
  feed.innerHTML=recent.map(c=>{ const m=bid[c.by]; if(!m) return '';
    const msg=(typeof c.msg==='string')?c.msg:((c.msg&&(c.msg[lang]||c.msg.pl))||'');
    const t=new Date((c.t||0)*1000); const hh=String(t.getHours()).padStart(2,'0'),mm=String(t.getMinutes()).padStart(2,'0');
    return '<div class="eter-line"><span class="time">'+hh+':'+mm+'</span><span class="who">'+m.name+'</span><span class="msg">'+msg+'</span></div>';
  }).join('');
}
async function pollServer(){
  let gotData=false;
  try{
    if(SERVER_BASE===null){ const j=await (await fetch('/pracownia-demos.json',{cache:'no-store'})).json(); SERVER_BASE=(j.base||'').replace(/\/+$/,''); }
    if(SERVER_BASE){ const d=await (await fetch(SERVER_BASE+'/_live/chess.json',{cache:'no-store'})).json(); applyServer(d); MODE='server'; gotData=true; serverTries=0; }
  }catch(e){}
  if(gotData){ setTimeout(pollServer,2000); return; }      // serwer zywy — odswiezamy dalej
  serverTries++;
  // serwer milczy (martwy tunel / brak base) -> wlacz lokalna symulacje (AI vs AI), jak w referencji
  if(MODE!=='local' && (serverTries>=2 || !SERVER_BASE)){ startLocalSim(); return; }
  if(MODE!=='local') setTimeout(pollServer, 2000);
}
function applyServer(d){
  if(!d||!d.agents) return;
  const by={}; d.agents.forEach(a=>by[a.id]=a);
  for(const m of MINDS){ const a=by[m.id]; if(!a)continue; m.elo=a.elo; m.w=a.w; m.l=a.l; m.d=a.d; m.mood=a.mood; m.mood01=clamp(((a.streak||0)+3)/6,0,1); m.live=a.playing!=null; }
  if(ELO0_PENDING){ MINDS.forEach(m=>m.elo0=m.elo); ELO0_PENDING=false; }
  renderElo(); refreshPlayStatus();
  (d.boards||[]).slice().sort((x,y)=>x.id-y.id).forEach((sv,i)=>{ const board=boards[i]; if(!board)return; board.white=by[sv.white]||board.white; board.black=by[sv.black]||board.black; board.setServer(sv.fen,sv.lastUci,sv.evalcp,sv.check); board.moveNo=sv.ply; fillBoardCardServer(board._card, board, sv); });
  const lead=by[(d.ranking||[])[0]]; if(lead){ featured=MINDS.find(m=>m.id===lead.id)||featured; const sl=document.getElementById('statLeader'); if(sl)sl.textContent=lead.name; }
  const sg=document.getElementById('statGames'); if(sg)sg.textContent=(d.totalGames||0).toLocaleString('pl');
  const stt=document.getElementById('statTourney'); if(stt)stt.textContent=Math.max(1,Math.round(((d.t||0)-(d.since||0))/3600));
  applyEter(d.chat);
}

/* pairing: pick two distinct minds, weighted to mix */
function pickPair(exclude){
  const pool=MINDS.filter(m=>!exclude || !exclude.has(m.id));
  let a=pool[(Math.random()*pool.length)|0];
  let b; do{ b=MINDS[(Math.random()*MINDS.length)|0]; }while(b.id===a.id);
  return Math.random()<0.5?[a,b]:[b,a];
}

function buildBoards(){
  const host=document.getElementById('boards'); if(!host) return; host.innerHTML='';
  for(let i=0;i<4;i++){
    const w=MINDS[(i*2)%8], bl=MINDS[(i*2+1)%8];
    const card=document.createElement('div'); card.className='board-card';
    card.innerHTML=
      '<div class="bc-top"><span class="bc-table">stół 0'+(i+1)+'</span><span class="bc-status"><span class="d"></span><span class="bcs-txt">'+tr('st.live')+'</span></span></div>'+
      '<div class="bc-players">'+
        '<div class="player" data-side="w"><div class="av"><canvas></canvas></div><div class="pn"><b></b><span></span></div><span class="side w"></span></div>'+
        '<div class="player" data-side="b"><div class="av"><canvas></canvas></div><div class="pn"><b></b><span></span></div><span class="side b"></span></div>'+
      '</div>'+
      '<div class="board-wrap"><canvas></canvas></div>'+
      '<div class="evalbar"><i></i></div>'+
      '<div class="bc-foot"><span data-i18n-skip>ruch <span class="mv">1</span></span><span class="bc-open">— · —</span></div>';
    host.appendChild(card);
    const bcanvas=card.querySelector('.board-wrap canvas');
    const board=Board({ canvas:bcanvas, white:w, black:bl, interval:2200, animDur:1 });
    board._card=card;
    board._avW=addEmblem(card.querySelector('.player[data-side=w] .av canvas'), w);
    board._avB=addEmblem(card.querySelector('.player[data-side=b] .av canvas'), bl);
    boards.push(board);
  }
}
function fillBoardCardServer(card, b, sv){
  if(!card) return;
  card.querySelector('.player[data-side=w] .pn b').textContent=b.white.name;
  card.querySelector('.player[data-side=b] .pn b').textContent=b.black.name;
  if(b._avW) b._avW.mind=b.white; if(b._avB) b._avB.mind=b.black;
  const open=card.querySelector('.bc-open'); if(open) open.textContent=(sv.lastSan||'—');
  const txt=card.querySelector('.bcs-txt'); if(txt) txt.textContent= sv.result? (sv.check?tr('st.mate'):tr('st.draw')) : tr('st.live');
}
function fillBoardCard(card, b){
  card.querySelector('.player[data-side=w] .pn b').textContent=b.white.name;
  card.querySelector('.player[data-side=b] .pn b').textContent=b.black.name;
  card._avW && (card._avWmind=b.white); card._avBmind=b.black;
  updateBoardCard(card,b);
}
function updateBoardCard(card, b){
  const wEl=card.querySelector('.player[data-side=w]'), bEl=card.querySelector('.player[data-side=b]');
  const turnW = b._turnW = (b.over?false:true); // visual handled below
  const movingW = !b.over && (b.moveNo>0? null:null);
  // active = whose turn now
  const sideToMove = b.over? null : (b.result? null : null);
  // determine turn from board internal: approximate via moveNo parity is unreliable; use thinking flag set in tick
  card.querySelector('.player[data-side=w] .pn span').textContent='ELO '+b.white.elo;
  card.querySelector('.player[data-side=b] .pn span').textContent='ELO '+b.black.elo;
  const mv=card.querySelector('.mv'); if(mv) mv.textContent=b.moveNo||1;
  // eval bar (white-positive cp -> 0..1)
  const cp=clamp(b.evalCp,-1000,1000); const pct=1/(1+Math.pow(10,-cp/400));
  b.evalShown=lerp(b.evalShown,pct,0.5);
  const bar=card.querySelector('.evalbar i'); if(bar) bar.style.width=(b.evalShown*100).toFixed(1)+'%';
}
function maybeBanter(b, m){
  if(Math.random()<0.5){ const mind = Math.random()<0.5?b.white:b.black; const type = m && m.cap? (Math.random()<0.5?'capture':'think') : (Math.random()<0.25?'check':'think'); pushEter(mind, type); }
}
function endBoard(card, b, st, used){
  const txt=card.querySelector('.bcs-txt');
  let result='½-½';
  if(st.result==='1-0'){ result='1-0'; }
  else if(st.result==='0-1'){ result='0-1'; }
  if(st.reason==='mate'){ txt.textContent=tr('st.mate'); pushEter(st.result==='1-0'?b.white:b.black,'win'); pushEter(st.result==='1-0'?b.black:b.white,'lose'); }
  else { txt.textContent=tr('st.draw'); }
  applyResult(b.white,b.black, result);
  // reseed after a pause
  setTimeout(()=>{
    used.delete(b.white.id); used.delete(b.black.id);
    let pair, guard=0; do{ pair=pickPair(); guard++; }while(guard<8 && (used.has(pair[0].id)||used.has(pair[1].id)));
    used.add(pair[0].id); used.add(pair[1].id);
    b.reset(pair[0],pair[1]);
    b._avW.mind=pair[0]; b._avB.mind=pair[1];
    txt.textContent=tr('st.live');
    fillBoardCard(card,b);
  }, 2600);
}

/* ---------- LOKALNY FALLBACK: gdy VPS milczy, stoly graja AI vs AI w przegladarce ---------- */
function startLocalSim(){
  if(MODE==='local') return; MODE='local';
  const host=document.getElementById('boards'); if(!host) return;
  boards.length=0; host.innerHTML='';
  const intervals=[1900,2500,2150,2800]; const used=new Set();
  for(let i=0;i<4;i++){
    let pair, guard=0; do{ pair=pickPair(); guard++; }while(guard<8 && (used.has(pair[0].id)||used.has(pair[1].id)));
    used.add(pair[0].id); used.add(pair[1].id);
    const card=document.createElement('div'); card.className='board-card';
    card.innerHTML=
      '<div class="bc-top"><span class="bc-table">stół 0'+(i+1)+'</span><span class="bc-status"><span class="d"></span><span class="bcs-txt">'+tr('st.live')+'</span></span></div>'+
      '<div class="bc-players">'+
        '<div class="player" data-side="w"><div class="av"><canvas></canvas></div><div class="pn"><b></b><span></span></div><span class="side w"></span></div>'+
        '<div class="player" data-side="b"><div class="av"><canvas></canvas></div><div class="pn"><b></b><span></span></div><span class="side b"></span></div>'+
      '</div>'+
      '<div class="board-wrap"><canvas></canvas></div>'+
      '<div class="evalbar"><i></i></div>'+
      '<div class="bc-foot"><span data-i18n-skip>ruch <span class="mv">1</span></span><span class="bc-open">— · —</span></div>';
    host.appendChild(card);
    const board=Board({ canvas:card.querySelector('.board-wrap canvas'), white:pair[0], black:pair[1], interval:intervals[i], animDur:380,
      onMove:(b,m)=>{ updateBoardCard(card,b); maybeBanter(b,m); },
      onEnd:(b,st)=>{ endBoard(card,b,st,used); } });
    board.local=true; board._card=card;
    board._avW=addEmblem(card.querySelector('.player[data-side=w] .av canvas'), pair[0]);
    board._avB=addEmblem(card.querySelector('.player[data-side=b] .av canvas'), pair[1]);
    fillBoardCard(card, board);
    boards.push(board);
  }
  const sg=document.getElementById('statGames'); if(sg) countUp(sg, appState.games=1240+((Math.random()*60)|0), 1500);
  const stt=document.getElementById('statTourney'); if(stt) countUp(stt, 312, 1500);
  for(let k=0;k<3;k++){ pushEter(MINDS[(Math.random()*MINDS.length)|0],'idle'); }
  if(!localBanterTimer) localBanterTimer=setInterval(()=>{ if(reduce)return; if(Math.random()<0.6) pushEter(MINDS[(Math.random()*MINDS.length)|0],'idle'); }, 5200);
  if(reduce){ boards.forEach(b=>{ for(let k=0;k<24;k++) b.tickSim(b.interval); b.draw(performance.now()); }); }
  else setTimeout(()=>{ emblemCanvases.forEach(e=>e.size()); boards.forEach(b=>b.size()); }, 60);
}

/* minds grid */
function buildMinds(){
  const host=document.getElementById('mindsGrid'); host.innerHTML='';
  for(const m of MINDS){
    const el=document.createElement('div'); el.className='mind';
    el.innerHTML=
      '<div class="mind-emblem"><canvas></canvas><span class="elo">'+m.elo+'</span><span class="mood">'+(m.mood||'')+'</span></div>'+
      '<h3>'+m.name+'<span class="codeno">#'+(MINDS.indexOf(m)+1).toString().padStart(2,'0')+'</span></h3>'+
      '<div class="style">'+(m.style[lang]||m.style.pl)+'</div>'+
      '<div class="traits">'+
        traitRow('t.depth', m.p.depth/3)+
        traitRow('t.temp', m.p.temp/100)+
        traitRow('t.risk', m.p.risk)+
        traitRow('t.aggr', m.p.aggr)+
      '</div>';
    host.appendChild(el);
    m._card=el; m._emblem=addEmblem(el.querySelector('canvas'), m);
    m._eloEl=el.querySelector('.elo'); m._moodEl=el.querySelector('.mood');
  }
  // animate trait bars in on reveal
  setTimeout(()=>document.querySelectorAll('.trait .bar i').forEach(i=>i.style.width=i.dataset.w+'%'), 300);
}
function traitRow(key, v){ return '<div class="trait"><span data-i18n="'+key+'">'+tr(key)+'</span><div class="bar"><i data-w="'+Math.round(v*100)+'"></i></div></div>'; }

/* ELO table */
function renderElo(){
  const body=document.getElementById('eloBody'); if(!body) return;
  const sorted=[...MINDS, ...(HUMAN?[HUMAN]:[])].sort((a,b)=>b.elo-a.elo);
  const md=MOODS[lang]||MOODS.pl;
  body.innerHTML='';
  sorted.forEach((m,i)=>{
    const tr_=document.createElement('tr');
    if(m.human) tr_.className='you';
    const delta=m.elo-m.elo0; const dStr= delta===0?'':'<span class="elo-delta '+(delta>0?'up':'dn')+'">'+(delta>0?'▲':'▼')+Math.abs(delta)+'</span>';
    const youTag = m.human?' <span class="you-tag">'+tr('elo.you')+'</span>':'';
    tr_.innerHTML=
      '<td class="elo-rank '+(i===0?'top':'')+'">'+(i+1)+'</td>'+
      '<td><div class="elo-name"><div class="av"><canvas></canvas></div><b>'+m.name+youTag+'</b></div></td>'+
      '<td style="text-align:right"><span class="elo-elo">'+m.elo+'</span>'+dStr+'</td>'+
      '<td style="text-align:right" class="hide-m"><span class="elo-wpr"><span class="w">'+m.w+'</span>·<span class="l">'+m.l+'</span>·'+m.d+'</span></td>'+
      '<td class="hide-m"><span class="elo-mood" style="color:hsl('+m.hue+',70%,'+(docEl.getAttribute("data-theme")==="light"?40:62)+'%)">'+(m.mood||md.calm)+'</span></td>';
    body.appendChild(tr_);
    const cv=tr_.querySelector('canvas'); addEmblem(cv, m);
  });
  // leader stat
  const leader=document.getElementById('statLeader'); if(leader) leader.textContent=sorted[0].name;
}

/* play picker */
let picked=MINDS[4];
function buildPicker(){
  const host=document.getElementById('pickGrid'); host.innerHTML='';
  MINDS.forEach((m,i)=>{
    const el=document.createElement('button'); el.type='button'; el.className='pick'+(m===picked?' on':'');
    el.innerHTML='<div class="av"><canvas></canvas></div><div class="nm">'+m.name+'</div><div class="chk">✓</div>';
    el.addEventListener('click',()=>{ picked=m; document.querySelectorAll('.pick').forEach(p=>p.classList.remove('on')); el.classList.add('on'); document.getElementById('pickedName').value=m.name; refreshPlayStatus(); });
    host.appendChild(el); addEmblem(el.querySelector('canvas'), m);
  });
  const pn=document.getElementById('pickedName'); if(pn) pn.value=picked.name;
  const nickIn=document.getElementById('playNick'); if(nickIn && !nickIn.value){ try{ nickIn.value=localStorage.getItem('gambit-nick')||''; }catch(_){} }
  refreshPlayStatus();
}

/* ---------- shared RAF ---------- */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let dt=now-last; last=now; if(dt>60)dt=60;
  // boards
  for(const b of boards){ b.tick(dt); b.draw(now);
    const card=b._card;
    if(card){
      const side=b.over?null:b.getTurn();
      const wEl=card.querySelector('.player[data-side=w]'), bEl=card.querySelector('.player[data-side=b]');
      wEl.classList.toggle('active', side==='w'); bEl.classList.toggle('active', side==='b');
      const wS=wEl.querySelector('.pn span'), bS=bEl.querySelector('.pn span');
      if(!b.over){ wS.textContent = side==='w'? tr('st.think') : 'ELO '+b.white.elo; wS.classList.toggle('think',side==='w');
                   bS.textContent = side==='b'? tr('st.think') : 'ELO '+b.black.elo; bS.classList.toggle('think',side==='b'); }
      // live eval bar smoothing
      const cp=clamp(b.evalCp,-1000,1000); const pct=1/(1+Math.pow(10,-cp/400)); b.evalShown=lerp(b.evalShown,pct,0.08);
      const bar=card.querySelector('.evalbar i'); if(bar) bar.style.width=(b.evalShown*100).toFixed(1)+'%';
      const mv=card.querySelector('.mv'); if(mv) mv.textContent=b.moveNo||1;
    }
  }
  // emblems
  if(!reduce){ for(const e of emblemCanvases){ const m=e.mind; const mood=m.mood01!=null?m.mood01:0.4; const think = m.live?0.4:0.0; drawEmblem(e.ctx, e.W, e.H, m, now, mood, think); } }
  // hero label
  if(featured){ const b=document.getElementById('heroName'); if(b) b.textContent=featured.name; }
}
function drawStaticEmblems(){ for(const e of emblemCanvases){ drawEmblem(e.ctx, e.W, e.H, e.mind, 1200, e.mind.mood01||0.4, 0); } }

/* ---------- count-up + reveal + chrome ---------- */
function setLabel(el, txt){
  if(txt==null) return;
  // podmien TYLKO pierwszy wezel tekstowy — zachowuje elementy-dzieci (np. strzalke ▾ przy "Projekty")
  for(const n of el.childNodes){ if(n.nodeType===3){ n.nodeValue=txt; return; } }
  el.insertBefore(document.createTextNode(txt), el.firstChild);
}
function applyLang(l){
  lang=l; docEl.lang=l;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    // Wspolna nawigacja (SiteNav) niesie data-pl/-en/-de — to ma priorytet.
    // Slownika T uzywamy TYLKO gdy klucz naprawde istnieje; inaczej nie ruszamy elementu.
    // (bez tego linki menu pokazywaly surowe klucze: "nav.home", "nav.about", ...).
    const dv=el.getAttribute('data-'+l);
    if(dv!=null){ setLabel(el, dv); return; }
    const k=el.getAttribute('data-i18n'), dict=(T[l]||T.pl);
    if(Object.prototype.hasOwnProperty.call(dict,k)) setLabel(el, dict[k]);
  });
  document.querySelectorAll('#lang button, #lang a').forEach(b=>b.classList.toggle('on',b.dataset.lang===l));
  try{ localStorage.setItem('dlogic-lang',l); }catch(e){}
  refreshMoods();
  // rebuild language-dependent content
  buildMinds(); renderElo(); buildPicker();
  setTimeout(()=>document.querySelectorAll('.trait .bar i').forEach(i=>i.style.width=i.dataset.w+'%'),60);
}
var _lg=document.getElementById('lang'); if(_lg) _lg.addEventListener('click',e=>{ const b=e.target.closest('[data-lang]'); if(b) applyLang(b.dataset.lang); });

const sun='<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
const moon='<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
let theme='dark'; try{ theme=localStorage.getItem('dlogic-theme')||'dark'; }catch(e){}
function applyTheme(t){ theme=t; docEl.setAttribute('data-theme',t); const s=document.querySelector('#theme svg'); if(s) s.innerHTML=t==='dark'?sun:moon; try{localStorage.setItem('dlogic-theme',t);}catch(e){} if(reduce) drawStaticEmblems(); }
var _tb=document.getElementById('theme'); if(_tb) _tb.addEventListener('click',()=>applyTheme(theme==='dark'?'light':'dark'));

/* nav scroll + progress */
const nav=document.getElementById('nav'), prog=document.getElementById('progress');
if(nav||prog){
function onScroll(){ const st=scrollY; if(nav) nav.classList.toggle('scrolled',st>10); const h=document.documentElement.scrollHeight-innerHeight; if(prog)prog.style.width=(h>0?st/h*100:0)+'%'; }
addEventListener('scroll',onScroll,{passive:true}); onScroll(); }
var _mb=document.getElementById('menu'); if(_mb) _mb.addEventListener('click',()=>{ const t=document.getElementById('stoly'); if(t) scrollTo({top:t.offsetTop-50,behavior:reduce?'auto':'smooth'}); });

/* ticker */
(function(){ const terms=['REALNE SZACHY','24/7','EWOLUCJA WE ŚNIE','PAMIĘĆ RYWALI','8 UMYSŁÓW','python-chess','ELO NA ŻYWO','MAT > REMIS','NEURORÓŻNORODNOŚĆ','LEGALNE RUCHY']; const tk=document.getElementById('ticker'); if(!tk)return; let h=''; for(let k=0;k<2;k++) terms.forEach(t=>h+='<span><i>◢</i>'+t+'</span>'); tk.innerHTML=h; })();

/* reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.08,rootMargin:'0px 0px -6% 0px'});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* count-up */
function countUp(el,target,dur,dec){ if(reduce){ el.textContent=dec?target.toFixed(dec):Math.round(target).toLocaleString('pl'); return; } const t0=performance.now(); (function s(now){ const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3),v=target*e; el.textContent=dec?v.toFixed(dec):Math.round(v).toLocaleString('pl'); if(p<1)requestAnimationFrame(s); })(t0); }

/* play form — siadamy do partii w przegladarce (bez maila/kolejki) */
var _pf=document.getElementById('playForm');
if(_pf) _pf.addEventListener('submit',e=>{
  e.preventDefault();
  const fallback = lang==='de'?'Gast':lang==='en'?'Guest':'Gość';
  const nick=((document.getElementById('playNick')||{}).value||'').trim() || fallback;
  try{ localStorage.setItem('gambit-nick', nick); }catch(_){}
  openGame(picked, nick);
});

/* =====================================================================
   GRA CZLOWIEK vs UMYSL — pelna partia w przegladarce (lokalny silnik C).
   Czlowiek gra bialymi (dol planszy), umysl odpowiada przez C.pickMove.
   Wynik z nickiem trafia do tabeli ELO (HUMAN, trzymany w localStorage).
   ===================================================================== */
let HUMAN=null;
function humanMoods(){ return MOODS[lang]||MOODS.pl; }
function loadHuman(){
  try{ const s=JSON.parse(localStorage.getItem('gambit-human')||'null');
    if(s&&s.name) HUMAN={ id:'__you', name:s.name, human:true, elo:s.elo||1200, w:s.w||0, l:s.l||0, d:s.d||0, elo0:s.elo||1200, emblem:'ribbon', hue:150, mood:s.mood||'' };
  }catch(e){}
}
function ensureHuman(nick){
  if(HUMAN){ if(nick) HUMAN.name=nick; }
  else HUMAN={ id:'__you', name:nick||'Gość', human:true, elo:1200, w:0, l:0, d:0, elo0:1200, emblem:'ribbon', hue:150, mood:'' };
}
function saveHuman(){ if(!HUMAN)return; try{ localStorage.setItem('gambit-human', JSON.stringify({name:HUMAN.name,elo:HUMAN.elo,w:HUMAN.w,l:HUMAN.l,d:HUMAN.d,mood:HUMAN.mood})); }catch(e){} }

/* status "wolny / w grze" przy wybranym umysle */
function refreshPlayStatus(){
  const el=document.getElementById('playStatus'); if(!el)return;
  const busy=!!(picked&&picked.live);
  el.className='play-status'+(busy?' busy':'');
  const t=el.querySelector('.t'); if(t) t.textContent= busy? tr('play.busy') : tr('play.free');
}

/* stan jednej partii gracza */
const HG={ g:null, mind:null, sel:-1, legal:[], over:true, anim:null, last:null, check:-1, busyAI:false, _raf:0, W:0, cell:0, dpr:1, canvas:null, ctx:null, modal:null, statusEl:null };
function setGmStatus(t, cls){ if(HG.statusEl){ HG.statusEl.textContent=t; HG.statusEl.className='gm-status'+(cls?(' '+cls):''); } }
function gmSize(){ const c=HG.canvas; if(!c)return; const r=c.getBoundingClientRect(); HG.dpr=Math.min(devicePixelRatio||1,2); HG.W=Math.max(8,r.width); c.width=HG.W*HG.dpr; c.height=HG.W*HG.dpr; HG.ctx.setTransform(HG.dpr,0,0,HG.dpr,0,0); HG.cell=HG.W/8; }
function openGame(mind, nick){
  ensureHuman(nick); saveHuman();
  HG.modal=document.getElementById('gmModal'); HG.canvas=document.getElementById('gmBoard'); HG.statusEl=document.getElementById('gmStatus');
  if(!HG.modal||!HG.canvas) return;
  HG.ctx=HG.canvas.getContext('2d');
  HG.mind=mind; HG.g=C.newGame(); HG.sel=-1; HG.legal=[]; HG.over=false; HG.anim=null; HG.last=null; HG.check=-1; HG.busyAI=false;
  const you=document.getElementById('gmYou'); if(you) you.textContent=HUMAN.name;
  const mn=document.getElementById('gmMind'); if(mn) mn.textContent=mind.name+' · ELO '+mind.elo;
  HG.modal.classList.add('open'); document.body.style.overflow='hidden';
  setGmStatus(tr('gm.turn'));
  setTimeout(()=>{ gmSize(); drawHG(performance.now()); }, 30);
  if(!HG._raf) HG._raf=requestAnimationFrame(hgFrame);
}
function closeGame(){ if(HG.modal) HG.modal.classList.remove('open'); document.body.style.overflow=''; HG.over=true; if(HG._raf){ cancelAnimationFrame(HG._raf); HG._raf=0; } }
function hgFrame(now){ HG._raf=requestAnimationFrame(hgFrame); if(HG.anim && now-HG.anim.start>=HG.anim.dur){ const after=HG.anim.after; HG.anim=null; if(after) after(); } drawHG(now); }

function drawHG(now){
  const ctx=HG.ctx; if(!ctx)return; const cell=HG.cell, W=HG.W;
  const light=cssv('--sq-light'), dark=cssv('--sq-dark'), accRGB=(cssv('--accent-rgb')||'232,178,58');
  const isLight=docEl.getAttribute('data-theme')==='light';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){ ctx.fillStyle=((r+c)&1)?dark:light; ctx.fillRect(c*cell,r*cell,cell+0.5,cell+0.5); }
  if(HG.last){ for(const s of [HG.last.from,HG.last.to]){ const c=s&7,r=s>>3; ctx.fillStyle='rgba('+accRGB+',0.16)'; ctx.fillRect(c*cell,r*cell,cell,cell);} }
  if(HG.check>=0){ const c=HG.check&7,r=HG.check>>3; const pul=0.3+0.25*Math.sin((now||0)*0.006); ctx.fillStyle='rgba(232,103,90,'+pul+')'; ctx.fillRect(c*cell,r*cell,cell,cell); }
  if(HG.sel>=0){ const c=HG.sel&7,r=HG.sel>>3; ctx.fillStyle='rgba('+accRGB+',0.26)'; ctx.fillRect(c*cell,r*cell,cell,cell); }
  ctx.font='600 '+(cell*0.16)+"px 'JetBrains Mono Variable',monospace"; ctx.textBaseline='alphabetic';
  for(let i=0;i<8;i++){ ctx.fillStyle='rgba('+accRGB+','+((i&1)?0.30:0.18)+')'; ctx.fillText(8-i,3,i*cell+cell*0.2); ctx.fillText("abcdefgh"[i], i*cell+cell*0.78, W-4); }
  const board=HG.g.board;
  function piece(p,px,py,alpha){ if(!p)return; const sz=cell*0.78; ctx.font=sz+"px 'Segoe UI Symbol','Arial Unicode MS',sans-serif"; ctx.textAlign='center'; ctx.textBaseline='middle'; const isW=p.c==='w'; const glyph=SOLID[p.t];
    ctx.save(); ctx.globalAlpha=alpha==null?1:alpha; ctx.shadowColor='rgba(0,0,0,'+(isLight?0.22:0.5)+')'; ctx.shadowBlur=cell*0.10; ctx.shadowOffsetY=cell*0.05;
    ctx.fillStyle=isW?(isLight?'#FCFBF6':'#ECE8DC'):(isLight?'#2B2E35':'#10131A'); ctx.fillText(glyph,px,py);
    ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetY=0; ctx.lineWidth=Math.max(1,cell*0.022); ctx.strokeStyle=isW?(isLight?'#B9B4A2':'#7C776A'):(isLight?'#0E1014':'#454B57'); ctx.strokeText(glyph,px,py); ctx.restore(); }
  const animFrom=HG.anim?HG.anim.from:-1;
  for(let s=0;s<64;s++){ const p=board[s]; if(!p||s===animFrom)continue; const c=s&7,r=s>>3; piece(p,c*cell+cell/2,r*cell+cell/2); }
  if(HG.sel>=0){ for(const m of HG.legal){ const c=m.to&7,r=m.to>>3; if(board[m.to]){ ctx.save(); ctx.strokeStyle='rgba('+accRGB+',0.7)'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(c*cell+cell/2,r*cell+cell/2,cell*0.42,0,TAU); ctx.stroke(); ctx.restore(); } else { ctx.save(); ctx.fillStyle='rgba('+accRGB+',0.5)'; ctx.beginPath(); ctx.arc(c*cell+cell/2,r*cell+cell/2,cell*0.15,0,TAU); ctx.fill(); ctx.restore(); } } }
  if(HG.anim){ const t=clamp(((now||performance.now())-HG.anim.start)/HG.anim.dur,0,1), e=easeIO(t); const fc=HG.anim.from&7,fr=HG.anim.from>>3,tc=HG.anim.to&7,tr2=HG.anim.to>>3; piece(HG.anim.piece, lerp(fc,tc,e)*cell+cell/2, lerp(fr,tr2,e)*cell+cell/2); }
}
function hgClick(ev){
  if(HG.over||HG.busyAI||HG.anim||!HG.g||HG.g.turn!=='w') return;
  const r=HG.canvas.getBoundingClientRect(); const cw=r.width/8;
  const c=Math.floor((ev.clientX-r.left)/cw), rr=Math.floor((ev.clientY-r.top)/cw);
  if(c<0||c>7||rr<0||rr>7)return; const s=rr*8+c;
  if(HG.sel>=0){ const mv=HG.legal.find(m=>m.to===s); if(mv){ doHumanMove(mv); return; } }
  const p=HG.g.board[s];
  if(p&&p.c==='w'){ HG.sel=s; HG.legal=C.legalMoves(HG.g).filter(m=>m.from===s); } else { HG.sel=-1; HG.legal=[]; }
  drawHG(performance.now());
}
function doHumanMove(mv){ const piece=HG.g.board[mv.from]; HG.sel=-1; HG.legal=[]; HG.anim={ from:mv.from, to:mv.to, piece, start:performance.now(), dur:reduce?1:200, after:()=>commitHuman(mv) }; }
function commitHuman(mv){
  HG.g=C.makeMove(HG.g,mv); HG.last={from:mv.from,to:mv.to};
  HG.check=C.inCheck(HG.g.board,HG.g.turn)?C.kingSq(HG.g.board,HG.g.turn):-1;
  const st=C.status(HG.g); if(st.over){ endGame(st); return; }
  HG.busyAI=true; setGmStatus(HG.mind.name+' · '+tr('st.think'),'think');
  setTimeout(aiMove, reduce?60:520+Math.random()*440);
}
function aiMove(){
  if(HG.over) return;
  const m=C.pickMove(HG.g, HG.mind.p); if(!m){ endGame({over:true,result:'½-½',reason:'nomove'}); return; }
  const piece=HG.g.board[m.from];
  HG.anim={ from:m.from, to:m.to, piece, start:performance.now(), dur:reduce?1:230, after:()=>{
    HG.g=C.makeMove(HG.g,m); HG.last={from:m.from,to:m.to}; HG.busyAI=false;
    HG.check=C.inCheck(HG.g.board,HG.g.turn)?C.kingSq(HG.g.board,HG.g.turn):-1;
    const st=C.status(HG.g); if(st.over){ endGame(st); return; }
    setGmStatus(HG.check>=0?tr('gm.check'):tr('gm.turn'), HG.check>=0?'check':'');
  } };
}
function endGame(st){
  HG.over=true; HG.busyAI=false; HG.sel=-1; HG.legal=[];
  let sa=0.5, key='gm.draw', cls='draw';
  if(st.reason==='resign'){ sa=0; key='gm.lose'; cls='lose'; }
  else if(st.reason==='mate'){ if(st.result==='1-0'){ sa=1; key='gm.win'; cls='win'; } else { sa=0; key='gm.lose'; cls='lose'; } }
  gameResult(HUMAN, HG.mind, sa); setGmStatus(tr(key), cls);
}
function gameResult(human, mind, sa){
  const Ea=1/(1+Math.pow(10,(mind.elo-human.elo)/400)), K=28, d=Math.round(K*(sa-Ea));
  human.elo=Math.max(100, human.elo+d);
  if(sa===1)human.w++; else if(sa===0)human.l++; else human.d++;
  const md=humanMoods(); human.mood= sa===1?md.hot : sa===0?md.cold : md.calm;
  saveHuman(); renderElo();
}
function wireGame(){
  const cv=document.getElementById('gmBoard'); if(cv) cv.addEventListener('click', hgClick);
  document.querySelectorAll('[data-gm-close]').forEach(el=>el.addEventListener('click', closeGame));
  const rs=document.getElementById('gmResign'); if(rs) rs.addEventListener('click',()=>{ if(!HG.over) endGame({over:true,reason:'resign'}); });
  const nw=document.getElementById('gmNew'); if(nw) nw.addEventListener('click',()=>{ if(HG.mind) openGame(HG.mind, HUMAN?HUMAN.name:null); });
  addEventListener('keydown',e=>{ if(e.key==='Escape') closeGame(); });
  addEventListener('resize',()=>{ if(HG.modal&&HG.modal.classList.contains('open')){ gmSize(); drawHG(performance.now()); } });
}

/* ---------- BOOT ---------- */
function boot(){
  applyTheme(theme);
  loadHuman();
  refreshMoods();
  buildBoards(); buildMinds(); renderElo(); buildPicker();
  wireGame();
  // hero featured emblem = current leader-ish
  featured=[...MINDS].sort((a,b)=>b.elo-a.elo)[0];
  const heroC=document.getElementById('heroEmblem'); if(heroC){ addEmblem(heroC, featured, {hero:true}); }
  applyLang(lang);
  document.getElementById('statLeader').textContent=featured.name;
  // stats count-up
  pollServer();  // start: dane z serwerowego silnika
  document.getElementById('yr').textContent=new Date().getFullYear();
  // size all emblem canvases now that layout settled
  setTimeout(()=>{ emblemCanvases.forEach(e=>e.size()); boards.forEach(b=>b.size()); }, 60);
  if(reduce){ drawStaticEmblems(); for(const b of boards){ for(let k=0;k<30;k++) b.tick(b.interval); b.draw(performance.now()); } }
  else requestAnimationFrame(frame);

  // refresh elo emblem moods periodically
  setInterval(()=>{ MINDS.forEach(m=>{ if(m._eloEl)m._eloEl.textContent=m.elo; if(m._moodEl)m._moodEl.textContent=m.mood||''; }); }, 1500);
}
addEventListener('resize',()=>{ clearTimeout(window.__grz); window.__grz=setTimeout(()=>{ emblemCanvases.forEach(e=>e.size()); boards.forEach(b=>b.size()); },160); });

if(C){ boot(); } else { console.error('Chess engine missing'); }
})();

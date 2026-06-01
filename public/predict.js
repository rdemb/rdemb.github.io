/* ============================================================
   D-LOGIC , warstwa PRZEWIDYWANIA dla Organizmu rynku.
   Uczciwa gra (bez hazardu, bez kont): codziennie obstawiasz P(wzrost) dla
   BTC/ETH/SOL, rozstrzyga się po 24h z REALNEJ ceny (market.json). Punktacja
   właściwą regułą (Brier) + Brier Index 0..100% (agregat >=8), seria, kalibracja,
   historia. Wszystko w localStorage (prywatnie, w przeglądarce).
   ============================================================ */
(function(){
"use strict";
var KEY="dlogic-predict-v1", base=null, prices={}, asset="BTC", DAY=86400000;
var L = (function(){ try{return (localStorage.getItem("dlogic-lang")||"pl");}catch(e){return "pl";} })();
function load(){ try{return JSON.parse(localStorage.getItem(KEY))||{h:[]};}catch(e){return {h:[]};} }
function save(){ try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){} }
var S=load();
function utcDay(ts){ return new Date(ts).toISOString().slice(0,10); }
function today(){ return utcDay(Date.now()); }

/* ---------- styl (na tokenach strony) ---------- */
var css=
"#pqBtn{position:fixed;left:34px;bottom:30px;z-index:36;pointer-events:auto;font-family:'JetBrains Mono Variable',monospace;font-size:11px;letter-spacing:.08em;color:var(--text);border:1px solid var(--chip-line);background:var(--chip);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:9px;padding:9px 14px;display:inline-flex;align-items:center;gap:9px;transition:.2s}"+
"#pqBtn:hover{border-color:var(--accent)}#pqBtn .dot{width:7px;height:7px;border-radius:50%;background:var(--live);box-shadow:0 0 8px var(--live)}#pqBtn.todo .dot{background:var(--accent);box-shadow:0 0 8px var(--accent);animation:pqb 1.5s infinite}@keyframes pqb{50%{opacity:.3}}"+
"#pqPanel{position:fixed;top:0;right:0;bottom:0;width:min(400px,92vw);z-index:70;background:var(--bg);border-left:1px solid var(--line);transform:translateX(102%);transition:transform .4s cubic-bezier(.4,0,.2,1);overflow-y:auto;padding:24px 22px 40px;box-shadow:-30px 0 80px -40px rgba(0,0,0,.8)}"+
"#pqPanel.open{transform:none}"+
".pq-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}"+
".pq-head h3{font-family:'Space Grotesk Variable',sans-serif;font-size:19px;font-weight:600}"+
".pq-x{font-size:20px;color:var(--muted);width:30px;height:30px;border-radius:8px}.pq-x:hover{color:var(--accent)}"+
".pq-sub{font-family:'JetBrains Mono Variable',monospace;font-size:11px;color:var(--muted);letter-spacing:.04em;margin-bottom:18px}"+
".pq-assets{display:flex;gap:3px;border:1px solid var(--line);border-radius:9px;padding:3px;margin-bottom:14px}"+
".pq-assets button{flex:1;font-family:'JetBrains Mono Variable',monospace;font-size:12px;font-weight:600;padding:7px;border-radius:6px;color:var(--muted)}.pq-assets button.on{background:var(--accent);color:#06070A}"+
".pq-q{border:1px solid var(--line);border-radius:13px;padding:16px;background:var(--panel)}"+
".pq-q .qt{font-size:15px;line-height:1.45;margin-bottom:6px}.pq-q .qp{font-family:'JetBrains Mono Variable',monospace;font-size:11.5px;color:var(--muted)}"+
".pq-slider{margin:16px 0 6px}.pq-slider input{width:100%;accent-color:var(--accent)}"+
".pq-val{display:flex;justify-content:space-between;font-family:'JetBrains Mono Variable',monospace;font-size:12px;color:var(--muted)}.pq-val b{color:var(--accent);font-size:15px}"+
".pq-quick{display:flex;gap:6px;margin:12px 0}.pq-quick button{flex:1;font-family:'JetBrains Mono Variable',monospace;font-size:11px;padding:6px;border-radius:7px;border:1px solid var(--line);color:var(--muted)}.pq-quick button:hover{border-color:var(--accent);color:var(--text)}"+
".pq-go{width:100%;margin-top:8px;background:var(--accent);color:#06070A;font-family:'JetBrains Mono Variable',monospace;font-weight:600;font-size:13px;padding:13px;border-radius:10px;transition:.2s}.pq-go:hover{background:var(--accent-soft)}.pq-go:disabled{opacity:.4;cursor:default}"+
".pq-locked{border:1px solid var(--chip-line);background:var(--chip);border-radius:13px;padding:16px;font-family:'JetBrains Mono Variable',monospace;font-size:12.5px;line-height:1.6}.pq-locked b{color:var(--accent)}"+
".pq-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:18px 0}"+
".pq-stat{border:1px solid var(--line);border-radius:11px;padding:12px;text-align:center}.pq-stat b{font-family:'Space Grotesk Variable',sans-serif;font-size:24px;font-weight:600;color:var(--accent);display:block;line-height:1;font-variant-numeric:tabular-nums}.pq-stat span{font-family:'JetBrains Mono Variable',monospace;font-size:9.5px;color:var(--muted);margin-top:8px;display:block;letter-spacing:.04em}"+
".pq-sech{font-family:'JetBrains Mono Variable',monospace;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:20px 0 10px}"+
"#pqCal{width:100%;height:130px;display:block;border:1px solid var(--line);border-radius:11px;background:var(--panel)}"+
".pq-hist{display:flex;flex-direction:column;gap:1px}.pq-row{display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono Variable',monospace;font-size:12px;padding:8px 2px;border-bottom:1px dashed var(--line)}.pq-row .d{color:var(--muted)}.pq-row .r{font-weight:600}.pq-row .hit{color:var(--live)}.pq-row .miss{color:#e06a5a}.pq-row .pend{color:var(--muted)}"+
".pq-note{font-family:'JetBrains Mono Variable',monospace;font-size:10.5px;color:var(--muted);line-height:1.6;margin-top:18px}"+
"@media(max-width:860px){#pqPanel{width:100vw}#pqBtn{left:16px;bottom:auto;top:62px}}";
var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

/* ---------- DOM ---------- */
var btn=document.createElement("button"); btn.id="pqBtn"; btn.innerHTML='<span class="dot"></span><span id="pqBtnTxt">prognoza</span>';
(document.querySelector(".controls")? document.body : document.body).appendChild(btn);
var panel=document.createElement("div"); panel.id="pqPanel"; document.body.appendChild(panel);
btn.addEventListener("click",function(){ panel.classList.add("open"); render(); });

var TXT={ pl:{t:"Prognoza dnia",sub:"gra na niby · bez pieniędzy · liczona właściwą regułą",q:"Czy %A% będzie wyżej za 24h niż teraz?",up:"szansa na wzrost",go:"Zablokuj prognozę",locked:"Zablokowane na dziś: <b>%P%%</b> szansy na wzrost %A%.<br>Cena wejścia: <b>%E%</b>.<br>Rozstrzygnie się ok. <b>%T%</b>.",
   st_streak:"seria (dni)",st_acc:"trafność",st_bi:"Brier Index",st_n:"prognoz",cal:"Kalibracja , obiecane vs trafione",hist:"Historia",note:"Brier Index (0,100%) pokazuję dopiero po 8 rozstrzygniętych , wcześniej to nie byłoby uczciwe (reguła jest właściwa tylko na agregacie). Wszystko liczone lokalnie u Ciebie.",hit:"trafione",miss:"pudło",pend:"czeka",none:"Brak prognoz , zacznij dziś."},
  en:{t:"Daily forecast",sub:"play money · no cash · scored by a proper rule",q:"Will %A% be higher in 24h than now?",up:"chance it rises",go:"Lock prediction",locked:"Locked for today: <b>%P%%</b> chance %A% rises.<br>Entry price: <b>%E%</b>.<br>Resolves around <b>%T%</b>.",
   st_streak:"streak (days)",st_acc:"accuracy",st_bi:"Brier Index",st_n:"forecasts",cal:"Calibration , promised vs hit",hist:"History",note:"I show the Brier Index (0,100%) only after 8 resolved , earlier would not be honest (the rule is proper only on aggregate). Everything is computed locally on your device.",hit:"hit",miss:"miss",pend:"pending",none:"No forecasts , start today."},
  de:{t:"Tagesprognose",sub:"Spielgeld · kein Bargeld · mit korrekter Regel bewertet",q:"Wird %A% in 24h höher sein als jetzt?",up:"Chance auf Anstieg",go:"Prognose sperren",locked:"Heute gesperrt: <b>%P%%</b> Chance, dass %A% steigt.<br>Einstieg: <b>%E%</b>.<br>Auflösung ca. <b>%T%</b>.",
   st_streak:"Serie (Tage)",st_acc:"Treffer",st_bi:"Brier-Index",st_n:"Prognosen",cal:"Kalibrierung , versprochen vs getroffen",hist:"Verlauf",note:"Den Brier-Index (0,100%) zeige ich erst ab 8 aufgelösten , früher wäre es nicht ehrlich. Alles lokal bei dir berechnet.",hit:"Treffer",miss:"daneben",pend:"offen",none:"Keine Prognosen , fang heute an."} };
function tx(k){ return (TXT[L]||TXT.pl)[k]; }

/* ---------- logika ---------- */
function resolve(){ var now=Date.now(),ch=false; S.h.forEach(function(r){ if(r.o==null && now>=r.ra && prices[r.a]){ r.o=prices[r.a]>r.e?1:0; r.b=Math.pow(r.p-r.o,2); ch=true; } }); if(ch) save(); }
function resolved(){ return S.h.filter(function(r){return r.o!=null;}); }
function streak(){ var days={}; S.h.forEach(function(r){days[r.day]=1;}); var n=0,d=new Date(); var t=today();
  if(!days[t]){ d.setUTCDate(d.getUTCDate()-1); if(!days[utcDay(d.getTime())]) return 0; }
  d=new Date(); for(;;){ var k=utcDay(d.getTime()); if(days[k]){n++;d.setUTCDate(d.getUTCDate()-1);} else break; if(n>9999)break; } return n; }
function brierIndex(){ var r=resolved(); if(r.length<8) return null; var m=r.reduce(function(s,x){return s+x.b;},0)/r.length; return Math.round((1-Math.sqrt(m))*100); }
function accuracy(){ var r=resolved(); if(!r.length) return null; var hit=r.filter(function(x){return (x.p>0.5)===(x.o===1) || x.p===0.5;}).length; return Math.round(hit/r.length*100); }
function predict(p){ var day=today(); if(S.h.some(function(r){return r.day===day;})) return; var e=prices[asset]; if(!e) return;
  S.h.push({day:day,a:asset,p:p,e:e,t:Date.now(),ra:Date.now()+DAY,o:null,b:null}); save(); render(); }

/* ---------- render ---------- */
function fmtPrice(v){ return v>=1000?v.toFixed(0):v.toFixed(2); }
function render(){
  resolve();
  var day=today(), mine=S.h.filter(function(r){return r.day===day;})[0];
  var bi=brierIndex(), acc=accuracy(), stk=streak(), n=S.h.length;
  btn.classList.toggle("todo", !mine);
  document.getElementById("pqBtnTxt").textContent = mine? tx("st_streak").split(" ")[0]+" "+stk : "prognoza";
  var html='<div class="pq-head"><h3>'+tx("t")+'</h3><button class="pq-x" id="pqX">✕</button></div><div class="pq-sub">'+tx("sub")+'</div>';
  html+='<div class="pq-assets" id="pqA">'+["BTC","ETH","SOL"].map(function(a){return '<button data-a="'+a+'"'+(a===asset?' class="on"':'')+'>'+a+'</button>';}).join("")+'</div>';
  if(mine){
    var rt=new Date(mine.ra).toISOString().slice(11,16)+" UTC "+utcDay(mine.ra).slice(5);
    html+='<div class="pq-locked">'+tx("locked").replace("%P%",Math.round(mine.p*100)).replace(/%A%/g,mine.a).replace("%E%",fmtPrice(mine.e)).replace("%T%",rt)+'</div>';
  } else {
    var pr=prices[asset];
    html+='<div class="pq-q"><div class="qt">'+tx("q").replace("%A%",asset)+'</div><div class="qp">'+(pr?("cena: "+fmtPrice(pr)):"...")+'</div>'+
      '<div class="pq-slider"><input type="range" id="pqR" min="2" max="98" value="55"></div>'+
      '<div class="pq-val"><span>'+tx("up")+'</span><b id="pqV">55%</b></div>'+
      '<div class="pq-quick">'+[20,40,60,80].map(function(v){return '<button data-v="'+v+'">'+v+'%</button>';}).join("")+'</div>'+
      '<button class="pq-go" id="pqGo"'+(pr?"":" disabled")+'>'+tx("go")+'</button></div>';
  }
  html+='<div class="pq-stats">'+
    '<div class="pq-stat"><b>'+stk+'</b><span>'+tx("st_streak")+'</span></div>'+
    '<div class="pq-stat"><b>'+(acc==null?"·":acc+"%")+'</b><span>'+tx("st_acc")+'</span></div>'+
    '<div class="pq-stat"><b>'+(bi==null?"·":bi+"%")+'</b><span>'+tx("st_bi")+'</span></div>'+
    '<div class="pq-stat"><b>'+n+'</b><span>'+tx("st_n")+'</span></div></div>';
  html+='<div class="pq-sech">'+tx("cal")+'</div><canvas id="pqCal"></canvas>';
  html+='<div class="pq-sech">'+tx("hist")+'</div>';
  if(!S.h.length) html+='<div class="pq-note">'+tx("none")+'</div>';
  else { html+='<div class="pq-hist">'; S.h.slice().reverse().slice(0,12).forEach(function(r){
    var cls=r.o==null?"pend":(((r.p>0.5)===(r.o===1))?"hit":"miss"), lab=r.o==null?tx("pend"):(((r.p>0.5)===(r.o===1))?tx("hit"):tx("miss"));
    html+='<div class="pq-row"><span class="d">'+r.day.slice(5)+' · '+r.a+'</span><span>'+Math.round(r.p*100)+'%</span><span class="r '+cls+'">'+lab+'</span></div>'; }); html+='</div>'; }
  html+='<div class="pq-note">'+tx("note")+'</div>';
  panel.innerHTML=html;
  document.getElementById("pqX").addEventListener("click",function(){ panel.classList.remove("open"); });
  panel.querySelectorAll("#pqA button").forEach(function(b){ b.addEventListener("click",function(){ asset=b.dataset.a; render(); }); });
  if(!mine){ var r=document.getElementById("pqR"),v=document.getElementById("pqV");
    if(r){ r.addEventListener("input",function(){ v.textContent=r.value+"%"; }); }
    panel.querySelectorAll(".pq-quick button").forEach(function(b){ b.addEventListener("click",function(){ r.value=b.dataset.v; v.textContent=b.dataset.v+"%"; }); });
    var go=document.getElementById("pqGo"); if(go) go.addEventListener("click",function(){ predict((+r.value)/100); });
  }
  drawCal();
}
function drawCal(){ var c=document.getElementById("pqCal"); if(!c) return; var r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2); c.width=r.width*dpr;c.height=r.height*dpr; var x=c.getContext("2d"); x.setTransform(dpr,0,0,dpr,0,0); var w=r.width,h=r.height; x.clearRect(0,0,w,h);
  x.strokeStyle="rgba(255,255,255,.10)"; x.lineWidth=1; x.beginPath(); x.moveTo(0,h); x.lineTo(w,0); x.stroke(); // idealna kalibracja (diagonala)
  var res=resolved(); var B=[[0,.2],[.2,.4],[.4,.6],[.6,.8],[.8,1]];
  B.forEach(function(rg,i){ var pts=res.filter(function(p){return p.p>=rg[0]&&p.p<rg[1]+(i==4?0.001:0);}); if(!pts.length) return;
    var avgP=pts.reduce(function(s,p){return s+p.p;},0)/pts.length, rate=pts.reduce(function(s,p){return s+p.o;},0)/pts.length;
    var px=avgP*w, py=h-rate*h; x.fillStyle="var(--accent)"; x.fillStyle="#E8B23A"; x.beginPath(); x.arc(px,py,3+Math.min(6,pts.length),0,7); x.globalAlpha=.85; x.fill(); x.globalAlpha=1; });
}

/* ---------- market poll ---------- */
(function poll(){ (async function(){
  try{ if(!base){ var j=await (await fetch("/pracownia-demos.json",{cache:"no-store"})).json(); base=(j.base||"").replace(/\/+$/,""); }
    if(base){ var d=await (await fetch(base+"/_live/market.json",{cache:"no-store"})).json(); if(d.assets) for(var k in d.assets) prices[k]=d.assets[k].price; resolve(); if(panel.classList.contains("open")) render(); }
  }catch(e){}
  // odśwież kropkę przycisku (czy dziś już prognozowano)
  var done=S.h.some(function(r){return r.day===today();}); btn.classList.toggle("todo",!done);
  if(!done){ document.getElementById("pqBtnTxt").textContent="prognoza"; }
  setTimeout(poll,5000);
})(); })();
})();

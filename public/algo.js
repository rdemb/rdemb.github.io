/* ============================================================
   D-LOGIC , silniki "Organizmu rynku" (4 algorytmy)
   Kazdy napędzany NA ŻYWO realnym rynkiem (market.json): order-flow,
   zmienność, momentum, intensywność. Interfejs: factory -> {meta,init,frame,resize,info}.
   ============================================================ */
(function(){
"use strict";

/* ---------- rynek na żywo ---------- */
var MK={flow:0,vol:.2,mom:0,intensity:.5,regime:"",price:0,chg:0,asset:"BTC"};
var M ={flow:0,vol:.2,mom:0,intensity:.5};
function tickM(){ M.flow+=(MK.flow-M.flow)*.03; M.vol+=(MK.vol-M.vol)*.03; M.mom+=(MK.mom-M.mom)*.03; M.intensity+=(MK.intensity-M.intensity)*.03; }
function hue(){ return M.flow>=0 ? 45+M.flow*95 : 45+M.flow*38; }   // +zielony .. bursztyn .. -czerwony
function flowStr(){ return (MK.flow>=0?"+":"")+ (MK.flow||0).toFixed(2); }
var _base=null;
function pollMarket(){
  (async function(){
    try{
      if(!_base){ var j=await (await fetch("/pracownia-demos.json",{cache:"no-store"})).json(); _base=(j.base||"").replace(/\/+$/,""); }
      if(_base){ var d=await (await fetch(_base+"/_live/market.json",{cache:"no-store"})).json(); var a=d.assets&&d.assets[MK.asset]; if(a){ MK.flow=a.flow;MK.vol=a.vol;MK.mom=a.mom;MK.intensity=a.intensity;MK.regime=a.regime;MK.price=a.price;MK.chg=a.chg24h; } }
    }catch(e){}
    setTimeout(pollMarket,4000);
  })();
}
pollMarket();
window.DLOGIC_MARKET=MK;

/* ---------- helpers ---------- */
function noiseGen(seed){
  var perm=new Uint8Array(512),p=[],i,s=seed||7;
  for(i=0;i<256;i++)p[i]=i;
  for(i=255;i>0;i--){s=(s*16807)%2147483647;var j=s%(i+1),t=p[i];p[i]=p[j];p[j]=t;}
  for(i=0;i<512;i++)perm[i]=p[i&255];
  function fd(t){return t*t*t*(t*(t*6-15)+10);} function lp(a,b,t){return a+t*(b-a);}
  function gr(h,x,y){return((h&1)?-x:x)+((h&2)?-y:y);}
  return function(x,y){var X=Math.floor(x)&255,Y=Math.floor(y)&255;x-=Math.floor(x);y-=Math.floor(y);
    var u=fd(x),v=fd(y),aa=perm[perm[X]+Y],ab=perm[perm[X]+Y+1],ba=perm[perm[X+1]+Y],bb=perm[perm[X+1]+Y+1];
    return lp(lp(gr(aa,x,y),gr(ba,x-1,y),u),lp(gr(ab,x,y-1),gr(bb,x-1,y-1),u),v);};
}
function fade(ctx,W,H,a){ ctx.globalCompositeOperation="source-over"; ctx.fillStyle="rgba(6,7,10,"+a+")"; ctx.fillRect(0,0,W,H); }
function L(pl,en,de){ return {pl:pl,en:en,de:de}; }

/* ============================================================ 1) ŚLUZOWIEC / PHYSARUM */
function makeSlime(){
  var ag,gw,gh,grid,tmp,off,offctx,img,W,H,N,noise=noiseGen(11);
  function init(env){
    W=env.W;H=env.H; var sc=env.mobile?5:4; gw=Math.max(80,Math.floor(W/sc)); gh=Math.max(60,Math.floor(H/sc));
    grid=new Float32Array(gw*gh); tmp=new Float32Array(gw*gh);
    off=document.createElement("canvas"); off.width=gw; off.height=gh; offctx=off.getContext("2d"); img=offctx.createImageData(gw,gh);
    N=env.mobile?1400:2600; ag=new Float32Array(N*3);
    for(var i=0;i<N;i++){ ag[i*3]=Math.random()*gw; ag[i*3+1]=Math.random()*gh; ag[i*3+2]=Math.random()*6.283; }
    env.ctx.fillStyle="#06070A"; env.ctx.fillRect(0,0,W,H);
  }
  function sense(x,y,a){ var sx=Math.floor(x+Math.cos(a)*9), sy=Math.floor(y+Math.sin(a)*9); if(sx<0)sx+=gw; if(sx>=gw)sx-=gw; if(sy<0)sy+=gh; if(sy>=gh)sy-=gh; return grid[sy*gw+sx]; }
  function frame(env,dt){
    tickM(); var ctx=env.ctx; var SA=0.55+M.vol*0.9, ST=0.45, dep=4+M.intensity*5;
    var biasA=Math.atan2(M.mom*0.5,M.flow), biasW=Math.min(.5,Math.abs(M.flow)*0.5);
    for(var i=0;i<N;i++){ var x=ag[i*3],y=ag[i*3+1],a=ag[i*3+2];
      var c=sense(x,y,a),l=sense(x,y,a-SA),r=sense(x,y,a+SA);
      if(c>l&&c>r){} else if(l>r) a-=ST; else if(r>l) a+=ST; else a+=(Math.random()-.5)*ST;
      a=a*(1-biasW)+biasA*biasW + (Math.random()-.5)*0.08*M.vol;
      x+=Math.cos(a)*(1.0); y+=Math.sin(a)*(1.0);
      if(x<0)x+=gw; if(x>=gw)x-=gw; if(y<0)y+=gh; if(y>=gh)y-=gh;
      grid[(y|0)*gw+(x|0)]+=dep; ag[i*3]=x; ag[i*3+1]=y; ag[i*3+2]=a;
    }
    // dyfuzja + zanik
    var decay=0.90;
    for(var yy=0;yy<gh;yy++)for(var xx=0;xx<gw;xx++){ var idx=yy*gw+xx,
        xl=xx?idx-1:idx+gw-1, xr=xx<gw-1?idx+1:idx-gw+1, yu=yy?idx-gw:idx+(gh-1)*gw, yd=yy<gh-1?idx+gw:idx-(gh-1)*gw;
      tmp[idx]=((grid[idx]*4+grid[xl]+grid[xr]+grid[yu]+grid[yd])/8)*decay; }
    var t=grid; grid=tmp; tmp=t;
    // render gridu -> kolor rynku
    var h=hue()/360, dd=img.data;
    function hsl(hh,s,l,o){ /* hh 0..1 */ var q=l<.5?l*(1+s):l+s-l*s,p=2*l-q; function c(t){t=(t+1)%1;return (t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p);} return [c(hh+1/3)*255|0,c(hh)*255|0,c(hh-1/3)*255|0]; }
    for(var k=0;k<gw*gh;k++){ var v=grid[k]; if(v>1){ var l=Math.min(.62,0.12+Math.log(v)*0.12); var rgb=hsl(h,0.6+M.vol*0.3,l); dd[k*4]=rgb[0];dd[k*4+1]=rgb[1];dd[k*4+2]=rgb[2];dd[k*4+3]=255; } else { dd[k*4]=6;dd[k*4+1]=7;dd[k*4+2]=10;dd[k*4+3]=255; } }
    offctx.putImageData(img,0,0);
    ctx.globalCompositeOperation="source-over"; ctx.imageSmoothingEnabled=true; ctx.drawImage(off,0,0,gw,gh,0,0,W,H);
    // kursor = pokarm
    if(env.pointer.active){ var px=env.pointer.x/W*gw, py=env.pointer.y/H*gh, rad=env.pointer.down?7:4; for(var q2=0;q2<60;q2++){var an=Math.random()*6.283,rr=Math.random()*rad; var gx=(px+Math.cos(an)*rr)|0,gy=(py+Math.sin(an)*rr)|0; if(gx>=0&&gx<gw&&gy>=0&&gy<gh) grid[gy*gw+gx]+=20;} }
  }
  function info(){ return [{k:"flow",v:flowStr()},{k:"vol",v:(MK.vol||0).toFixed(2)},{k:"agenty",v:N}]; }
  return { meta:{ id:"slime", name:L("Splot","Plexus","Geflecht"), latin:"Physarum polycephalum",
      sub:L("emergentna sieć · napędzana order-flow","emergent network · driven by order-flow","emergentes Netz · vom Orderfluss getrieben"),
      desc:L("Tysiące komórek bez mózgu budują optymalną sieć. Napór kupna/sprzedaży z rynku zakrzywia ich ruch, zmienność rozprasza ślady.","Thousands of brainless cells build an optimal network. Market buy/sell pressure bends their motion, volatility scatters the trails.","Tausende hirnlose Zellen bauen ein optimales Netz. Marktdruck biegt ihre Bewegung, Volatilität streut die Spuren.") },
    init:init, frame:frame, resize:init, info:info };
}

/* ============================================================ 2) MURMURACJA / BOIDS */
function makeMurmur(){
  var b,N,W,H,cell,cols,rows,heads;
  function init(env){ W=env.W;H=env.H; N=env.mobile?320:680; b=[]; for(var i=0;i<N;i++) b.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2}); env.ctx.fillStyle="#06070A"; env.ctx.fillRect(0,0,W,H); }
  function frame(env,dt){ tickM(); var ctx=env.ctx; fade(ctx,W,H,0.16);
    var cs=46, cols=Math.ceil(W/cs)+1, rows=Math.ceil(H/cs)+1, G={}; for(var i=0;i<N;i++){ var k=(b[i].x/cs|0)+","+(b[i].y/cs|0); (G[k]||(G[k]=[])).push(i); }
    var maxSpd=2.0+M.intensity*2.6+Math.abs(M.mom)*2.2, coh=0.0009+ (M.flow>0?M.flow:0)*0.003, sep=0.05+M.vol*0.06, ali=0.04+(0.5-Math.min(.5,M.vol))*0.06;
    var driftA=Math.atan2(M.mom*0.6,M.flow+0.0001), driftW=Math.min(0.9,Math.abs(M.flow)*0.8+Math.abs(M.mom)*0.5);
    var h=hue();
    for(var i2=0;i2<N;i2++){ var p=b[i2],cx=p.x/cs|0,cy=p.y/cs|0,ax=0,ay=0,sx=0,sy=0,hx=0,hy=0,n=0;
      for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++){ var arr=G[(cx+dx)+","+(cy+dy)]; if(!arr)continue; for(var t=0;t<arr.length;t++){ var o=b[arr[t]]; if(o===p)continue; var ddx=o.x-p.x,ddy=o.y-p.y,d2=ddx*ddx+ddy*ddy; if(d2>2600)continue; n++; hx+=o.vx;hy+=o.vy; ax+=o.x;ay+=o.y; if(d2<420){ sx-=ddx; sy-=ddy; } } }
      if(n){ ax=ax/n-p.x; ay=ay/n-p.y; p.vx+=ax*coh+hx/n*ali*0.1; p.vy+=ay*coh+hy/n*ali*0.1; }
      p.vx+=sx*sep*0.01; p.vy+=sy*sep*0.01;
      p.vx+=(Math.cos(driftA)*maxSpd-p.vx)*driftW*0.02; p.vy+=(Math.sin(driftA)*maxSpd-p.vy)*driftW*0.02;
      p.vx+=(Math.random()-.5)*M.vol*0.4; p.vy+=(Math.random()-.5)*M.vol*0.4;
      var sp=Math.hypot(p.vx,p.vy)||1; if(sp>maxSpd){p.vx=p.vx/sp*maxSpd;p.vy=p.vy/sp*maxSpd;}
      p.x+=p.vx;p.y+=p.vy; if(p.x<0)p.x+=W; if(p.x>W)p.x-=W; if(p.y<0)p.y+=H; if(p.y>H)p.y-=H;
      if(env.pointer.active){ var pdx=p.x-env.pointer.x,pdy=p.y-env.pointer.y,pd=pdx*pdx+pdy*pdy; if(pd<26000){ var f=env.pointer.down?0.04:-0.02; p.vx+=pdx*f*0.01; p.vy+=pdy*f*0.01; } }
      var ang=Math.atan2(p.vy,p.vx);
      ctx.fillStyle="hsla("+h+","+(60+M.vol*30)+"%,"+(58+sp*4)+"%,0.92)";
      ctx.beginPath(); ctx.moveTo(p.x+Math.cos(ang)*5,p.y+Math.sin(ang)*5); ctx.lineTo(p.x+Math.cos(ang+2.5)*3,p.y+Math.sin(ang+2.5)*3); ctx.lineTo(p.x+Math.cos(ang-2.5)*3,p.y+Math.sin(ang-2.5)*3); ctx.closePath(); ctx.fill();
    }
  }
  function info(){ return [{k:"flow",v:flowStr()},{k:"vol",v:(MK.vol||0).toFixed(2)},{k:"ptaki",v:N}]; }
  return { meta:{ id:"murmur", name:L("Rój","Swarm","Schwarm"), latin:"boids · Reynolds",
      sub:L("rój · spójność z order-flow","flock · cohesion from order-flow","Schwarm · Kohäsion aus Orderfluss"),
      desc:L("Trzy proste reguły rodzą stado. Przewaga kupujących ściąga roj w jednym kierunku, zmienność go rozprasza.","Three simple rules make a flock. Buyer dominance pulls the swarm one way, volatility scatters it.","Drei einfache Regeln ergeben einen Schwarm. Käuferdominanz zieht ihn in eine Richtung, Volatilität streut ihn.") },
    init:init, frame:frame, resize:init, info:info };
}

/* ============================================================ 3) ATRAKTOR (de Jong) */
function makeAttractor(){
  var x,y,W,H,A,B,C,D,tA,tB,tC,tD;
  function init(env){ W=env.W;H=env.H; x=Math.random();y=Math.random(); A=tA=1.4;B=tB=-2.3;C=tC=2.4;D=tD=-2.1; env.ctx.fillStyle="#06070A"; env.ctx.fillRect(0,0,W,H); }
  function frame(env,dt){ tickM(); var ctx=env.ctx; fade(ctx,W,H,0.055);
    // parametry dryfuja z rynkiem (flow/vol/mom) -> morfujący ksztalt
    tA=1.6+M.flow*1.3; tB=-2.0+M.mom*1.2; tC=2.2+M.vol*1.4; tD=-2.0-M.flow*0.8;
    A+=(tA-A)*.02;B+=(tB-B)*.02;C+=(tC-C)*.02;D+=(tD-D)*.02;
    var cx=W/2,cy=H/2,scl=Math.min(W,H)*0.23, pts=env.mobile?5000:11000, h=hue();
    ctx.globalCompositeOperation="lighter";
    for(var i=0;i<pts;i++){ var nx=Math.sin(A*y)-Math.cos(B*x), ny=Math.sin(C*x)-Math.cos(D*y); x=nx;y=ny;
      var px=cx+x*scl, py=cy+y*scl; var sp=(Math.abs(nx)+Math.abs(ny));
      ctx.fillStyle="hsla("+(h+sp*14)+","+(62+M.vol*28)+"%,"+(55)+"%,0.05)"; ctx.fillRect(px,py,1.2,1.2);
    }
    ctx.globalCompositeOperation="source-over";
    if(env.pointer.active){ var rx=(env.pointer.x-cx)/scl, ry=(env.pointer.y-cy)/scl; tA+=rx*0.4; tC+=ry*0.4; }
  }
  function info(){ return [{k:"flow",v:flowStr()},{k:"a",v:A.toFixed(2)},{k:"c",v:C.toFixed(2)}]; }
  return { meta:{ id:"attractor", name:L("Orbita","Orbit","Orbit"), latin:"de Jong · układ dynamiczny",
      sub:L("chaos deterministyczny · ksztalt z rynku","deterministic chaos · shape from the market","deterministisches Chaos · Form aus dem Markt"),
      desc:L("Cztery liczby i pętla rodzą nieskończony, nigdy nie powtarzający się wzor. Rynek przestawia te liczby , ksztalt żyje z danymi.","Four numbers and a loop yield an infinite, never-repeating pattern. The market shifts those numbers , the shape lives with the data.","Vier Zahlen und eine Schleife ergeben ein unendliches Muster. Der Markt verschiebt sie , die Form lebt mit den Daten.") },
    init:init, frame:frame, resize:init, info:info };
}

/* ============================================================ 4) POLE WIROWE (curl-noise) */
function makeVortex(){
  var P,N,W,H,t=0,noise=noiseGen(7);
  function init(env){ W=env.W;H=env.H; N=env.mobile?700:1700; P=[]; for(var i=0;i<N;i++) P.push({x:Math.random()*W,y:Math.random()*H,vx:0,vy:0,l:30+Math.random()*200}); env.ctx.fillStyle="#06070A"; env.ctx.fillRect(0,0,W,H); }
  function angle(x,y){ var sc=0.0013+M.vol*0.004, a=noise(x*sc,y*sc+t*0.10)*Math.PI*(2.2+M.vol*3.0); var cur=Math.atan2(M.mom*0.7,M.flow+0.0001), mag=Math.min(0.85,Math.abs(M.flow)*0.9+Math.abs(M.mom)*0.7); return a*(1-mag)+cur*mag; }
  function frame(env,dt){ tickM(); var ctx=env.ctx; ctx.globalCompositeOperation="source-over"; ctx.fillStyle="rgba(6,7,10,"+(0.12-M.vol*0.05)+")"; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation="lighter";
    var h=hue(), spd=0.6+M.intensity*1.6+Math.abs(M.mom)*1.2;
    for(var i=0;i<N;i++){ var q=P[i],a=angle(q.x,q.y); q.vx=(q.vx+Math.cos(a)*0.12*spd)*0.92; q.vy=(q.vy+Math.sin(a)*0.12*spd)*0.92;
      var px=q.x,py=q.y; q.x+=q.vx;q.y+=q.vy;q.l--; var v=Math.min(Math.hypot(q.vx,q.vy),3),al=Math.min(0.7,0.1+v*0.4);
      if(env.pointer.active){ var dx=q.x-env.pointer.x,dy=q.y-env.pointer.y,d2=dx*dx+dy*dy,R=env.pointer.down?200:140; if(d2<R*R){var d=Math.sqrt(d2)||1,nx=dx/d,ny=dy/d,f=1-d/R; q.vx+=-ny*f*1.2; q.vy+=nx*f*1.2; if(env.pointer.down){q.vx-=nx*f*0.8;q.vy-=ny*f*0.8;}} }
      ctx.strokeStyle="hsla("+h+","+(55+M.vol*35)+"%,"+(52+v*8)+"%,"+al+")"; ctx.lineWidth=0.9+M.intensity*0.7; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(q.x,q.y); ctx.stroke();
      if(q.l<0||q.x<-20||q.x>W+20||q.y<-20||q.y>H+20){ q.x=Math.random()*W;q.y=Math.random()*H;q.vx=q.vy=0;q.l=30+Math.random()*200; } }
    ctx.globalCompositeOperation="source-over"; t+=0.016;
  }
  function info(){ return [{k:"flow",v:flowStr()},{k:"vol",v:(MK.vol||0).toFixed(2)},{k:"cząstki",v:N}]; }
  return { meta:{ id:"vortex", name:L("Nurt","Current","Strömung"), latin:"curl-noise · pole przepływu",
      sub:L("prąd = order-flow · turbulencja = zmienność","current = order-flow · turbulence = volatility","Strömung = Orderfluss · Turbulenz = Volatilität"),
      desc:L("Niewidzialne pole sił niesie tysiące cząstek. Przepływ zleceń to prąd, zmienność to turbulencja , dosłownie widzisz nastój rynku.","An invisible force field carries thousands of particles. Order flow is the current, volatility the turbulence , you literally see the market mood.","Ein unsichtbares Kraftfeld trägt tausende Partikel. Orderfluss ist die Strömung, Volatilität die Turbulenz.") },
    init:init, frame:frame, resize:init, info:info };
}

window.ALGO_ENGINES=[makeSlime, makeMurmur, makeAttractor, makeVortex];
})();

/* =====================================================================
   GAMBIT — legal chess engine (vanilla JS)
   Board: 64 array, sq = row*8+col. row 0 = rank 8 (top), col 0 = file a.
   White ('w') moves UP (toward row 0). Pieces: 'p n b r q k'.
   Exposes window.Chess = { newGame, legalMoves, makeMove, pickMove,
                            inCheck, status, sqName, INITIAL }
   ===================================================================== */
(function(){
"use strict";
const W='w', B='b';
const INF=1e9, MATE=100000;

function rc(sq){ return [sq>>3, sq&7]; }
function sq(r,c){ return r*8+c; }
function onBoard(r,c){ return r>=0&&r<8&&c>=0&&c<8; }
function sqName(s){ const [r,c]=rc(s); return "abcdefgh"[c]+(8-r); }

/* ---- initial position ---- */
function newGame(){
  const b=new Array(64).fill(null);
  const back=['r','n','b','q','k','b','n','r'];
  for(let c=0;c<8;c++){
    b[sq(0,c)]={t:back[c],c:B};
    b[sq(1,c)]={t:'p',c:B};
    b[sq(6,c)]={t:'p',c:W};
    b[sq(7,c)]={t:back[c],c:W};
  }
  return { board:b, turn:W, castle:{wK:true,wQ:true,bK:true,bQ:true}, ep:null, half:0, full:1 };
}

/* ---- attack detection ---- */
const KN=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const DIAG=[[-1,-1],[-1,1],[1,-1],[1,1]];
const ORTH=[[-1,0],[1,0],[0,-1],[0,1]];

function isAttacked(board, s, by){
  const [r,c]=rc(s);
  // pawns
  const pd = by===W ? 1 : -1; // attacker pawn sits at r+pd (white pawns are below, attack upward)
  for(const dc of [-1,1]){ const rr=r+pd, cc=c+dc; if(onBoard(rr,cc)){ const p=board[sq(rr,cc)]; if(p&&p.c===by&&p.t==='p') return true; } }
  // knights
  for(const [dr,dc] of KN){ const rr=r+dr,cc=c+dc; if(onBoard(rr,cc)){ const p=board[sq(rr,cc)]; if(p&&p.c===by&&p.t==='n') return true; } }
  // king
  for(const [dr,dc] of KG){ const rr=r+dr,cc=c+dc; if(onBoard(rr,cc)){ const p=board[sq(rr,cc)]; if(p&&p.c===by&&p.t==='k') return true; } }
  // sliders
  for(const [dr,dc] of DIAG){ let rr=r+dr,cc=c+dc; while(onBoard(rr,cc)){ const p=board[sq(rr,cc)]; if(p){ if(p.c===by&&(p.t==='b'||p.t==='q')) return true; break; } rr+=dr; cc+=dc; } }
  for(const [dr,dc] of ORTH){ let rr=r+dr,cc=c+dc; while(onBoard(rr,cc)){ const p=board[sq(rr,cc)]; if(p){ if(p.c===by&&(p.t==='r'||p.t==='q')) return true; break; } rr+=dr; cc+=dc; } }
  return false;
}
function kingSq(board, col){ for(let i=0;i<64;i++){ const p=board[i]; if(p&&p.t==='k'&&p.c===col) return i; } return -1; }
function inCheck(board, col){ const k=kingSq(board,col); return k<0?false:isAttacked(board,k, col===W?B:W); }

/* ---- pseudo-legal move generation ---- */
function pseudo(state){
  const {board,turn,castle,ep}=state, moves=[];
  const me=turn, opp=turn===W?B:W;
  for(let s=0;s<64;s++){
    const p=board[s]; if(!p||p.c!==me) continue;
    const [r,c]=rc(s);
    if(p.t==='p'){
      const dir = me===W?-1:1, startRow = me===W?6:1, promoRow = me===W?0:7;
      // forward
      const r1=r+dir;
      if(onBoard(r1,c)&&!board[sq(r1,c)]){
        if(r1===promoRow) moves.push({from:s,to:sq(r1,c),promo:'q'});
        else { moves.push({from:s,to:sq(r1,c)});
          const r2=r+dir*2; if(r===startRow&&!board[sq(r2,c)]) moves.push({from:s,to:sq(r2,c),dbl:true}); }
      }
      // captures + ep
      for(const dc of [-1,1]){ const cc=c+dc; if(!onBoard(r1,cc)) continue; const ts=sq(r1,cc), tp=board[ts];
        if(tp&&tp.c===opp){ if(r1===promoRow) moves.push({from:s,to:ts,promo:'q',cap:true}); else moves.push({from:s,to:ts,cap:true}); }
        else if(ep!==null&&ts===ep) moves.push({from:s,to:ts,ep:true,cap:true});
      }
    } else if(p.t==='n'){
      for(const [dr,dc] of KN){ const rr=r+dr,cc=c+dc; if(!onBoard(rr,cc))continue; const tp=board[sq(rr,cc)]; if(!tp) moves.push({from:s,to:sq(rr,cc)}); else if(tp.c===opp) moves.push({from:s,to:sq(rr,cc),cap:true}); }
    } else if(p.t==='k'){
      for(const [dr,dc] of KG){ const rr=r+dr,cc=c+dc; if(!onBoard(rr,cc))continue; const tp=board[sq(rr,cc)]; if(!tp) moves.push({from:s,to:sq(rr,cc)}); else if(tp.c===opp) moves.push({from:s,to:sq(rr,cc),cap:true}); }
      // castling
      const row = me===W?7:0;
      if(s===sq(row,4) && !inCheck(board,me)){
        const kRight = me===W?castle.wK:castle.bK, qRight = me===W?castle.wQ:castle.bQ;
        if(kRight && !board[sq(row,5)] && !board[sq(row,6)] && board[sq(row,7)] && board[sq(row,7)].t==='r'
           && !isAttacked(board,sq(row,5),opp) && !isAttacked(board,sq(row,6),opp))
          moves.push({from:s,to:sq(row,6),castle:'K'});
        if(qRight && !board[sq(row,3)] && !board[sq(row,2)] && !board[sq(row,1)] && board[sq(row,0)] && board[sq(row,0)].t==='r'
           && !isAttacked(board,sq(row,3),opp) && !isAttacked(board,sq(row,2),opp))
          moves.push({from:s,to:sq(row,2),castle:'Q'});
      }
    } else {
      const dirs = p.t==='b'?DIAG : p.t==='r'?ORTH : DIAG.concat(ORTH);
      for(const [dr,dc] of dirs){ let rr=r+dr,cc=c+dc; while(onBoard(rr,cc)){ const tp=board[sq(rr,cc)]; if(!tp) moves.push({from:s,to:sq(rr,cc)}); else { if(tp.c===opp) moves.push({from:s,to:sq(rr,cc),cap:true}); break; } rr+=dr; cc+=dc; } }
    }
  }
  return moves;
}

/* ---- apply a move -> new immutable state ---- */
function makeMove(state, m){
  const board=state.board.slice();
  const castle={...state.castle};
  const p=board[m.from];
  let ep=null;
  board[m.to]=p; board[m.from]=null;
  // promotion
  if(m.promo) board[m.to]={t:m.promo,c:p.c};
  // en passant capture
  if(m.ep){ const [tr,tc]=rc(m.to); const capRow = p.c===W?tr+1:tr-1; board[sq(capRow,tc)]=null; }
  // double push sets ep square
  if(m.dbl){ const [fr,fc]=rc(m.from); ep = sq((fr+ (p.c===W?-1:1)), fc); }
  // castling: move rook
  if(m.castle){ const [kr]=rc(m.to); const row=kr; if(m.castle==='K'){ board[sq(row,5)]=board[sq(row,7)]; board[sq(row,7)]=null; } else { board[sq(row,3)]=board[sq(row,0)]; board[sq(row,0)]=null; } }
  // update castle rights
  if(p.t==='k'){ if(p.c===W){castle.wK=castle.wQ=false;} else {castle.bK=castle.bQ=false;} }
  const touch=(s)=>{ if(s===sq(7,0))castle.wQ=false; if(s===sq(7,7))castle.wK=false; if(s===sq(0,0))castle.bQ=false; if(s===sq(0,7))castle.bK=false; };
  touch(m.from); touch(m.to);
  const half = (p.t==='p'||m.cap)?0:state.half+1;
  return { board, turn: state.turn===W?B:W, castle, ep, half, full: state.turn===B?state.full+1:state.full };
}

/* ---- legal moves ---- */
function legalMoves(state){
  const me=state.turn, out=[];
  for(const m of pseudo(state)){ const ns=makeMove(state,m); if(!inCheck(ns.board,me)) out.push(m); }
  return out;
}

/* ---- evaluation ---- */
const VAL={p:100,n:320,b:330,r:500,q:900,k:0};
// piece-square tables (white perspective, sq index a8=0 .. h1=63)
const PST={
 p:[0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
 n:[-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
 b:[-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
 r:[0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
 q:[-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
 k:[-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
};
function mir(s){ const [r,c]=rc(s); return sq(7-r,c); }
function evaluate(board){ // white-positive
  let sc=0;
  for(let s=0;s<64;s++){ const p=board[s]; if(!p) continue;
    if(p.c===W) sc += VAL[p.t] + PST[p.t][s];
    else sc -= VAL[p.t] + PST[p.t][mir(s)];
  }
  return sc;
}
function evalSide(state){ const e=evaluate(state.board); return state.turn===W?e:-e; }

/* ---- negamax + alpha-beta ---- */
function orderMoves(ms){ ms.sort((a,b)=>((b.cap?1:0)-(a.cap?1:0))); return ms; }
function negamax(state, depth, alpha, beta){
  if(depth<=0) return evalSide(state);
  const moves=legalMoves(state);
  if(!moves.length) return inCheck(state.board,state.turn)? -MATE-depth : 0;
  orderMoves(moves);
  let best=-INF;
  for(const m of moves){ const ns=makeMove(state,m); const v=-negamax(ns,depth-1,-beta,-alpha);
    if(v>best)best=v; if(best>alpha)alpha=best; if(alpha>=beta)break; }
  return best;
}

/* ---- pick a move with personality ---- */
function pickMove(state, p){
  p=p||{depth:2,temp:40,risk:0.4,aggr:0.4};
  const moves=legalMoves(state);
  if(!moves.length) return null;
  const opp=state.turn===W?B:W;
  const scored=moves.map(m=>{
    const ns=makeMove(state,m);
    let sc=-negamax(ns, p.depth-1, -INF, INF);
    if(m.cap) sc += p.risk*30;
    if(m.promo) sc += 40;
    if(inCheck(ns.board, opp)) sc += p.aggr*35;          // gives check
    if(m.castle) sc += 12;
    sc += (Math.random()-0.5)*p.temp;                     // temperature jitter
    return {m,sc};
  });
  scored.sort((a,b)=>b.sc-a.sc);
  // softmax-ish sample among the top few, sharper for low temp
  const width=Math.max(1, Math.min(scored.length, p.temp>60?5:p.temp>30?3:2));
  const top=scored.slice(0,width);
  const T=Math.max(6,p.temp);
  const max=top[0].sc;
  let sum=0; const w=top.map(o=>{ const e=Math.exp((o.sc-max)/T); sum+=e; return e; });
  let rnd=Math.random()*sum;
  for(let i=0;i<top.length;i++){ rnd-=w[i]; if(rnd<=0) return top[i].m; }
  return top[0].m;
}

/* ---- status ---- */
function status(state){
  const moves=legalMoves(state);
  if(!moves.length) return inCheck(state.board,state.turn)?{over:true,result:state.turn===W?'0-1':'1-0',reason:'mate'}:{over:true,result:'½-½',reason:'stalemate'};
  if(state.half>=100) return {over:true,result:'½-½',reason:'50-move'};
  // insufficient material (only kings, or K+minor)
  let majors=0, minors=0, pawns=0;
  for(const p of state.board){ if(!p)continue; if(p.t==='q'||p.t==='r')majors++; else if(p.t==='b'||p.t==='n')minors++; else if(p.t==='p')pawns++; }
  if(majors===0&&pawns===0&&minors<=1) return {over:true,result:'½-½',reason:'material'};
  return {over:false};
}

window.Chess={ newGame, legalMoves, makeMove, pickMove, inCheck, status, sqName, evaluate, kingSq };
})();

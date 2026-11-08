const express=require('express'),http=require('http'),{Server}=require('socket.io');
const app=express();app.use(express.static('public'));
const srv=http.createServer(app),io=new Server(srv),C=require('./cards.json'),rooms={};
const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const oth=t=>t==='A'?'B':'A';
const seat=(r,t,p)=>Object.keys(r.m).find(s=>r.m[s].team===t&&r.m[s].pos===p);
const tot=c=>c.p.ovr+c.s.ovr, nm=(s,c)=>`${r0(s)} ${c.p.name}(${c.p.ovr})+${c.s.name}[${c.s.target}](${c.s.ovr})`;
const r0=s=>s;
function deal(r){const g=r.g;g.h={};
 for(const t of['A','B']){
  const P=sh(C.players.filter(x=>x.pos!=='GOALKEEPER')),S=sh(C.skills.filter(x=>x.pos!=='GOALKEEPER'));
  g.h[seat(r,t,'GK')]={P:sh(C.players.filter(x=>x.pos==='GOALKEEPER')).slice(0,8),S:sh(C.skills.filter(x=>x.pos==='GOALKEEPER')).slice(0,8)};
  g.h[seat(r,t,'MID')]={P:P.slice(0,8),S:S.slice(0,8)};
  g.h[seat(r,t,'STR')]={P:P.slice(8,16),S:S.slice(8,16)};}}
function need(r){const g=r.g,a=g.att,d=oth(a);
 if(g.ph==='tackle')return[seat(r,a,'MID'),seat(r,d,'MID')];
 if(g.ph==='shot')return g.mid?[seat(r,d,'GK')]:[seat(r,a,'STR'),seat(r,d,'GK')];
 if(g.ph==='disc')return Object.keys(r.m).filter(s=>r.m[s].pos&&!g.done[s]);
 return[]}
const who=(r,s)=>`${r.m[s].team}-${r.m[s].pos}(${r.m[s].name})`;
function reveal(r){const g=r.g;for(const s in g.sub){const c=g.sub[s];g.dis.push(nm(who(r,s),c))}}
function step(r){const g=r.g;if(!need(r).every(s=>g.sub[s]))return;
 const a=g.att,d=oth(a),L=m=>g.log.push(m);
 if(g.ph==='tackle'){const sa=seat(r,a,'MID'),sd=seat(r,d,'MID'),A=g.sub[sa],D=g.sub[sd];
  L(`⚔️ আক্রমণ ${nm(who(r,sa),A)} = ${tot(A)} | ট্যাকল ${nm(who(r,sd),D)} = ${tot(D)}`);reveal(r);g.sub={};
  if(tot(D)>tot(A)){L(`🛑 ট্যাকল সফল! বল এখন টিম ${d}-এর`);return endRound(r)}
  if(/Shot|Header|Finish/.test(A.s.name)){g.mid=true;g.shot={ovr:tot(A)-3,t:A.s.target};L(`🎯 মিডফিল্ড থেকে শট (থ্রেট -৩): ${g.shot.ovr}, লক্ষ্য ${g.shot.t}`)}
  else{g.mid=false;L('✅ আক্রমণ পার, বল স্ট্রাইকারের কাছে')}
  g.ph='shot';return}
 if(g.ph==='shot'){const sg=seat(r,d,'GK'),G=g.sub[sg];let sv=tot(G),sc,st;
  if(g.mid){sc=g.shot.ovr;st=g.shot.t}else{const ss=seat(r,a,'STR'),S=g.sub[ss];sc=tot(S);st=S.s.target;L(`🥅 শট ${nm(who(r,ss),S)} = ${sc}`)}
  const miss=G.s.target!==st;if(miss)sv-=4;
  L(`🧤 সেভ ${nm(who(r,sg),G)} = ${tot(G)}${miss?' (লক্ষ্য মেলেনি, -৪ ⇒ '+sv+')':''}`);reveal(r);g.sub={};
  if(sc>sv){g.sc[a]++;const sk=g.mid?seat(r,a,'MID'):seat(r,a,'STR');g.gl[sk]=(g.gl[sk]||0)+1;L(`⚽ গোল! টিম ${a} — স্কোর A ${g.sc.A} : ${g.sc.B} B`)}
  else if(sc<sv)L('🧤 সেভ! বল টিম '+d+'-এর');else L('🚩 থ্রেট সমান = কর্নার (v1-এ: বল ডিফেন্ডারদের)');
  return endRound(r)}
 if(g.ph==='disc'){reveal(r);g.sub={};g.done={};g.round++;
  if(g.round%8===0){if(g.set>=g.sets){g.ph='over';const{A,B}=g.sc;L(`🏁 ম্যাচ শেষ! A ${A} : ${B} B — ${A>B?'টিম A জিতেছে':B>A?'টিম B জিতেছে':'ড্র (এক্সট্রা টাইম পরের ভার্সনে)'}`);return}
   g.set++;deal(r);L(`🔔 সেট ${g.set-1} শেষ, নতুন কার্ড বিলি হলো`)}
  g.ph='tackle';L(`— রাউন্ড ${g.round+1}: টিম ${g.att}-এর বল —`)}}
function endRound(r){const g=r.g;g.ph='disc';g.mid=false;g.att=oth(g.att);g.log.push('🗑️ রাউন্ড শেষ: যারা কার্ড খেলেনি তারা ১টা প্লেয়ার + ১টা স্কিল কার্ড ফেলুন');step(r)}
function view(r,sid){const g=r.g;return{code:r.code,me:sid,host:r.host===sid,
 m:Object.entries(r.m).map(([id,x])=>({id,...x})),
 g:g&&{id:g.id,gl:g.gl,sc:g.sc,round:g.round+1,set:g.set,sets:g.sets,ph:g.ph,att:g.att,need:need(r).filter(s=>!g.sub[s]),hand:g.h[sid]||null,log:g.log.slice(-40),dis:g.dis.slice(-24)}}}
const emit=r=>Object.keys(r.m).forEach(s=>io.to(s).emit('state',view(r,s)));
io.on('connection',so=>{
 so.on('join',({code,name,as})=>{code=String(code||'').trim().toUpperCase();name=String(name||'').trim().slice(0,16);if(!code||!name)return;
  let r=rooms[code]=rooms[code]||{code,m:{},host:so.id,g:null};
  const old=Object.keys(r.m).find(s=>r.m[s].name===name&&!io.sockets.sockets.get(s));
  if(old){r.m[so.id]=r.m[old];delete r.m[old];if(r.host===old)r.host=so.id;
   if(r.g){const g=r.g;for(const k of['h','done','sub','gl'])if(g[k][old]!==undefined){g[k][so.id]=g[k][old];delete g[k][old]}}}
  else{if(as==='viewer'&&Object.values(r.m).filter(x=>x.view).length>=5)return so.emit('err','ভিউয়ার ভর্তি (৫ জন)');
   if(Object.values(r.m).some(x=>x.name===name))return so.emit('err','এই নামে আগেই কেউ আছে');
   if(r.g&&as!=='viewer')return so.emit('err','খেলা শুরু হয়ে গেছে, ভিউয়ার হিসেবে ঢুকুন');
   r.m[so.id]={name,view:as==='viewer'}}
  so.rm=code;so.join(code);emit(r)});
 so.on('seat',({team,pos})=>{const r=rooms[so.rm];if(!r||r.g||!r.m[so.id]||r.m[so.id].view)return;
  if(!['A','B'].includes(team)||!['GK','MID','STR'].includes(pos)||seat(r,team,pos))return;
  Object.assign(r.m[so.id],{team,pos});emit(r)});
 so.on('start',({sets})=>{const r=rooms[so.rm];if(!r||r.g||r.host!==so.id)return;
  for(const t of['A','B'])for(const p of['GK','MID','STR'])if(!seat(r,t,p))return so.emit('err','৬টা সিট ভরেনি');
  r.g={sets:Math.max(1,Math.min(20,+sets||1)),set:1,round:0,sc:{A:0,B:0},gl:{},id:Date.now(),att:'A',ph:'tackle',sub:{},done:{},log:['⚽ খেলা শুরু! টিম A-এর বল'],dis:[]};
  deal(r);emit(r)});
 so.on('play',({pi,si})=>{const r=rooms[so.rm];if(!r||!r.g)return;const g=r.g;
  if(!need(r).includes(so.id)||g.sub[so.id])return;const h=g.h[so.id],p=h.P[pi],s=h.S[si];if(!p||!s)return;
  h.P.splice(pi,1);h.S.splice(si,1);g.sub[so.id]={p,s};if(g.ph!=='disc')g.done[so.id]=true;
  step(r);emit(r)});
 so.on('disconnect',()=>{const r=rooms[so.rm];if(!r)return;if(!r.g){delete r.m[so.id];if(r.host===so.id)r.host=Object.keys(r.m)[0];}emit(r)});
});
srv.listen(process.env.PORT||3000,()=>console.log('running'));

import * as L from '../js/logic.js';
import { PLANTS, MIN, STUNDE } from '../js/data.js';
let ok=0,bad=0; const eq=(a,b,m)=>{ if(JSON.stringify(a)===JSON.stringify(b)){ok++}else{bad++;console.log('FAIL',m,a,b)} };
const t0 = Date.UTC(2026,10,8,12,0,0);
const st = L.neuerStand(t0);
eq(st.geld,20,'geld');
// Grundsaat kaufen & pflanzen
eq(L.samenKaufen(st,'karotte-grund',3,t0).ok,true,'kaufen');
eq(st.geld,14,'geld nach kauf');
const key = L.itemKey('karotte',[]);
let r = L.pflanzen(st,0,key,t0,()=>0.99); eq(r.ok,true,'pflanzen');
eq(st.tiles[0].id,'karotte','tile');
eq(L.pflanzen(st,0,key,t0).ok,false,'doppelt');
eq(L.pflanzen(st,15,key,t0).ok,false,'nicht gekauft');
// Wachstum: 3 Minuten * Tempo; nach 10 Min reif
L.tick(st,t0+10*MIN,()=>0.99);
eq(L.istReif(st.tiles[0]),true,'reif nach 10 min');
r = L.ernten(st,0,()=>0.99); eq(r.ok,true,'ernten'); eq(st.tiles[0],null,'feld frei'); eq(L.lagerAnzahl(st),1,'lager');
const v = L.verkaufen(st,key,1,t0+10*MIN); eq(v>=4,true,'verkauf '+v);
// Offline 3 Tage ohne Fehler
const st2 = L.neuerStand(t0); L.samenKaufen(st2,'karotte-grund',1,t0);
L.pflanzen(st2,1,key,t0,()=>0.99); L.tick(st2,t0+3*24*STUNDE);
eq(L.istReif(st2.tiles[1]),true,'offline reif');
// Markt deterministisch
const a = L.marktSortiment(L.neuerStand(t0),t0).map(x=>x.id), b = L.marktSortiment(L.neuerStand(t0),t0).map(x=>x.id);
eq(a,b,'markt deterministisch'); eq(a.length,4,'4 karten'); console.log('Markt:',a.join(','));
// Ruf-Gate: am Anfang nur bis selten
eq(a.every(id=>['gewöhnlich','ungewöhnlich','selten'].includes(PLANTS[id].rar)),true,'rufgate');
// Multi-Pflanze
const st3=L.neuerStand(t0); st3.samen.push({id:'salat',muts:[],n:1}); L.pflanzen(st3,0,L.itemKey('salat',[]),t0,()=>0.99);
L.tick(st3,t0+30*MIN,()=>0.99); const e1=L.ernten(st3,0,()=>0.5); eq(e1.ok,true,'multi ernten'); eq(st3.tiles[0]!==null,true,'multi bleibt'); eq(st3.tiles[0].ernten,1,'ernten=1');
// Lager voll
const st4=L.neuerStand(t0); st4.lager.push({id:'karotte',muts:[],n:40}); st4.samen.push({id:'karotte',muts:[],n:1}); L.pflanzen(st4,0,key,t0,()=>0.99); L.tick(st4,t0+30*MIN,()=>0.99);
eq(L.ernten(st4,0).ok,false,'lager voll');
// Felder kaufen
const st5=L.neuerStand(t0); st5.geld=1000; eq(L.feldKaufen(st5).ok,true,'feld'); eq(st5.felder,11,'felder');
// Wetter/Jahreszeit Verteilung
const cnt={}; for(let i=0;i<4*8*9;i++){const w=L.weatherAt(t0+i*L.WETTER_MS); cnt[w]=(cnt[w]||0)+1} console.log('Wetter',cnt);
// Wirtschaft grob: Karotte-Zyklus
console.log('Seasons',[0,1,2,3].map(i=>L.seasonAt(t0+i*L.SEASON_MS)));
// Speichern/Laden
const j=JSON.stringify(st); const m=L.migriere(JSON.parse(j)); eq(m.felder,st.felder,'migrate');
console.log(ok,'ok',bad,'fehler');

// ── Aufbruch und Aufträge ──
import * as Rz from '../js/reisen.js';
import * as Au from '../js/auftraege.js';
import { PLANTS as PL } from '../js/data.js';
{
  let o=0,f=0; const e=(a,b,m)=>{ if(JSON.stringify(a)===JSON.stringify(b)){o++}else{f++;console.log('FAIL',m,a,b)} };
  for (const g of Rz.GEBIETE) { for (const id of g.pool) e(!!PL[id],true,'pool '+g.id+':'+id); for (const [id] of (g.geheim||[])) e(!!PL[id],true,'geheim '+id); }
  const t0 = Date.UTC(2026,10,8,12,0,0), s = L.neuerStand(t0); s.geld = 100;
  e(Rz.reiseStarten(s,0,0,t0).ok,true,'reise start'); e(s.geld,90,'proviant');
  e(Rz.reiseStarten(s,0,0,t0).ok,false,'nur 1 slot');
  e(Rz.reiseStarten(s,3,0,t0).ok,false,'gebiet gesperrt');
  e(Rz.reiseAbschliessen(s,0,'a',t0+5*MIN).ok,false,'noch unterwegs');
  const ruf0 = s.ruf; const r = Rz.reiseAbschliessen(s,0,'a',t0+11*MIN);
  e(r.ok,true,'abschluss'); e(r.samen.length>=1,true,'samen da'); e(s.reisen.length,0,'reise weg'); e(s.ruf>ruf0,true,'ruf+');
  e(s.samen.reduce((a,x)=>a+x.n,0)>=2,true,'samen in tasche');
  // deterministisch
  const a1 = L.neuerStand(t0), a2 = L.neuerStand(t0); [a1,a2].forEach(x=>{x.geld=100; Rz.reiseStarten(x,0,1,t0)});
  e(JSON.stringify(Rz.reiseAbschliessen(a1,0,'b',t0+40*MIN)), JSON.stringify(Rz.reiseAbschliessen(a2,0,'b',t0+40*MIN)),'reise deterministisch');
  // Insel liefert bei vielen Versuchen mal Geheimpflanze
  let geheim = 0; for (let i=0;i<4000;i++){ const x=L.neuerStand(t0+i*1000); x.ruf=500; x.geld=1e9; x.reisen.push({gi:6,di:2,start:t0,ende:t0+1,seed:hash(i)}); const rr=Rz.reiseAbschliessen(x,0,'a',t0+10); if(rr.samen.some(q=>['galaxiebluete','urweltfarn','omegarose'].includes(q.id))) geheim++; }
  function hash(i){ return (i*2654435761)>>>0; }
  e(geheim>0 && geheim<400,true,'geheim selten: '+geheim+'/4000');
  // Aufträge
  const q = L.neuerStand(t0); Au.auftraegeAuffuellen(q,t0); e(q.auftraege.length,3,'3 aufträge');
  const a = q.auftraege[0]; q.lager.push({id:a.id,muts:a.mut?['gold']:[],n:a.n}); const g0=q.geld;
  e(Au.liefern(q,0,t0).ok,true,'liefern'); e(q.geld>g0,true,'lohn'); e(q.auftraege.length,3,'neu aufgefüllt'); e(q.lager.length,0,'lager leer');
  e(Au.liefern(q,0,t0).ok,false,'zu wenig');
  Au.auftraegeAuffuellen(q,t0+4*STUNDE); e(q.auftraege.every(x=>x.bis>t0+4*STUNDE),true,'abgelaufen ersetzt');
  console.log(o,'ok',f,'fehler (Aufbruch/Aufträge)');
}

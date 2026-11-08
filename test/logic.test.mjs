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

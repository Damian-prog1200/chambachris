// Antoine: ln(Psat [kPa]) = A - B / (T [°C] + C)
const SUST={Benceno:["C₆H₆",13.7819,2726.81,217.572],Tolueno:["C₇H₈",13.9320,3056.96,217.625],Acetona:["C₃H₆O",14.3145,2756.22,228.060],Metanol:["CH₄O",16.5785,3638.27,239.500],Etanol:["C₂H₆O",16.8958,3795.17,230.918],Agua:["H₂O",16.3872,3885.70,230.170],"n-Hexano":["C₆H₁₄",13.8193,2696.04,224.317],"n-Heptano":["C₇H₁₆",13.8622,2910.26,216.432]};
// factor = unidades de presión por 1 kPa; off = desplazamiento de temperatura
const UNITS=[{p:"kPa",t:"°C",f:1,off:0},{p:"mmHg",t:"°C",f:760/101.325,off:0},{p:"bar",t:"K",f:.01,off:273.15},{p:"mmHg",t:"K",f:760/101.325,off:273.15}];
const $=id=>document.getElementById(id);
const num=s=>{s=String(s).trim().replace(",",".");return s===""?NaN:Number(s)};
let unit=0,mode="T",res=null;

function fillAntoine(i){const n=$("s"+i).value,d=SUST[n];$("a"+i).innerHTML=`<header><span>CONSTANTES DE ANTOINE</span><span>${d[0]}</span></header><div class="g">${["A","B","C"].map((k,j)=>`<label>${k}<input type="text" readonly tabindex="-1" id="${k}${i}" value="${j==0?d[1].toFixed(4):j==1?d[2].toFixed(2):d[3].toFixed(3)}"></label>`).join("")}</div>`}
[1,2].forEach(i=>{$("s"+i).innerHTML=Object.keys(SUST).map(n=>`<option>${n}</option>`).join("");$("s"+i).value=i==1?"Benceno":"Tolueno";fillAntoine(i);$("s"+i).onchange=()=>{fillAntoine(i);pending()}});

function drawUnits(){$("units").innerHTML=UNITS.map((u,i)=>`<button type="button" aria-pressed="${i==unit}" data-i="${i}"><em>${i+1}</em>${u.p}<small>${u.t}</small></button>`).join("");$("datoU").textContent=mode=="P"?UNITS[unit].t:UNITS[unit].p;$("datoLbl").textContent="Dato de entrada: "+(mode=="P"?"temperatura":"presión")}
const fmtIn=v=>String(+v.toFixed(6));
$("units").onclick=e=>{const b=e.target.closest("button");if(!b)return;const i=+b.dataset.i,o=UNITS[unit],n=UNITS[i],v=num($("dato").value);if(isFinite(v))$("dato").value=fmtIn(mode=="P"?v-o.off+n.off:v/o.f*n.f);unit=i;drawUnits();calc()};
$("tipo").onchange=()=>{mode=$("tipo").value;$("dato").value=fmtIn(mode=="P"?75+UNITS[unit].off:101.325*UNITS[unit].f);drawUnits();calc()};
$("sw").onclick=()=>{const on=$("sw").getAttribute("aria-checked")!="true";$("sw").setAttribute("aria-checked",on);$("moles").hidden=!on;calc()};

function solve(c){ // c = {mode, v (°C o kPa), a, b, z}
 const ps=(s,T)=>Math.exp(s[0]-s[1]/(T+s[2])), tb=(s,P)=>s[1]/(s[0]-Math.log(P))-s[2];
 const root=(f,lo,hi)=>{if(lo>hi)[lo,hi]=[hi,lo];const up=f(hi)>f(lo);for(let i=0;i<80;i++){const m=(lo+hi)/2;(f(m)>0)==up?hi=m:lo=m}return(lo+hi)/2};
 const {a,b,z,v}=c;
 if(c.mode=="P"){const p1=ps(a,v),p2=ps(b,v),liq=x=>x*p1+(1-x)*p2,y=x=>x*p1/liq(x),dew=1/(z/p1+(1-z)/p2);
  return{liq,y,vap:yy=>1/(yy/p1+(1-yy)/p2),bub:liq(z),bubY:y(z),dew,dewX:z*dew/p1,b1:tb(a,101.325),b2:tb(b,101.325)}}
 const t1=tb(a,v),t2=tb(b,v);
 const bubT=x=>root(T=>x*ps(a,T)+(1-x)*ps(b,T)-v,t1,t2), dewT=yy=>root(T=>v*(yy/ps(a,T)+(1-yy)/ps(b,T))-1,t1,t2);
 const y=x=>x*ps(a,bubT(x))/v,d=dewT(z);
 return{liq:bubT,y,vap:dewT,bub:bubT(z),bubY:y(z),dew:d,dewX:z*v/ps(a,d),b1:t1,b2:t2}}

function status(t,c){$("badge").textContent=t;$("badge").className="badge "+c}
function pending(){status("Cambios sin calcular","pend")}
function calc(){
 const u=UNITS[unit],raw=num($("dato").value);
 const v=mode=="P"?raw-u.off:raw/u.f;
 const cons=i=>["A","B","C"].map(k=>num($(k+i).value)),a=cons(1),b=cons(2);
 const on=$("sw").getAttribute("aria-checked")=="true";let z=.5;
 if(on){const m=num($("n1").value),n=num($("n2").value);if(!(m>=0&&n>=0&&m+n>0))return status("Revisa los moles","err");z=m/(m+n)}
 if(![...a,...b,v].every(isFinite))return status("Hay un dato no numérico","err");
 if(mode=="T"&&!(v>0))return status("La presión debe ser mayor que 0","err");
 if(mode=="P"&&!(v+a[2]>0&&v+b[2]>0))return status("Temperatura fuera de rango","err");
 const s=solve({mode,v,a,b,z});
 if(![s.bub,s.dew,s.bubY,s.dewX,s.b1,s.b2].every(isFinite))return status("Sin solución con estos datos","err");
 const out=k=>mode=="P"?k*u.f:k+u.off, U=mode=="P"?u.p:u.t, tU=u.t;
 res={...s,z,out,U};
 const n1=$("s1").value,n2=$("s2").value;
 $("sub").textContent=`Sistema binario ${n1} — ${n2} a ${$("dato").value} ${mode=="P"?u.t:u.p}`;
 $("cKick").textContent=(mode=="P"?"Presión":"Temperatura")+" — Composición";
 $("zKick").textContent=`Composición z₁ = ${z.toFixed(2)}`;
 $("chip").textContent=`${$("dato").value} ${mode=="P"?u.t:u.p}`;
 $("boilAt").textContent="a "+(mode=="P"?(101.325*u.f).toFixed(unit==2?3:2)+" "+u.p:$("dato").value+" "+u.p);
 $("bn1").textContent=n1;$("bn2").textContent=n2;
 $("b1").textContent=(s.b1+u.off).toFixed(2)+" "+tU;$("b2").textContent=(s.b2+u.off).toFixed(2)+" "+tU;
 const dec=U=="bar"?4:2;
 $("bub").textContent=out(s.bub).toFixed(dec);$("dew").textContent=out(s.dew).toFixed(dec);
 document.querySelectorAll(".u").forEach(e=>e.textContent=U);
 $("bubX").textContent="y₁ = "+s.bubY.toFixed(4);$("dewX").textContent="x₁ = "+s.dewX.toFixed(4);
 $("thV").textContent=(mode=="P"?"Presión ":"Temp. ")+U;$("thV").style.textTransform="none";
 $("rows").innerHTML=[0,.25,.5,.75,1].map(x=>`<tr class="${Math.abs(x-z)<1e-6?"hi":""}"><td>${x.toFixed(4)}</td><td>${s.y(x).toFixed(4)}</td><td>${out(s.liq(x)).toFixed(4)}</td></tr>`).join("");
 status("Sistema convergente","");draw()}

function draw(){if(!res)return;
 const W=Math.max(260,$("chart").clientWidth),H=W<500?280:330,L=62,R=12,T=14,B=44;
 const {out,z}=res,N=100,xs=[...Array(N+1)].map((_,i)=>i/N);
 const liq=xs.map(x=>[x,out(res.liq(x))]),vap=xs.map(x=>[x,out(res.vap(x))]);
 const all=[...liq,...vap].map(p=>p[1]);let lo=Math.min(...all),hi=Math.max(...all);
 const span=(hi-lo)||1,raw=span/4,mag=10**Math.floor(Math.log10(raw)),step=[1,2,2.5,5,10].find(m=>m*mag>=raw)*mag;
 lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;if(hi==lo)hi=lo+step;
 const X=x=>L+x*(W-L-R),Y=v=>T+(hi-v)/(hi-lo)*(H-T-B),path=d=>d.map((p,i)=>(i?"L":"M")+X(p[0]).toFixed(1)+" "+Y(p[1]).toFixed(1)).join("");
 let g="";for(let v=lo;v<=hi+step/2;v+=step)g+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e8eef5"/><text x="${L-8}" y="${Y(v)+3}" text-anchor="end">${+v.toFixed(3)}</text>`;
 for(let i=0;i<=5;i++){const x=i/5;g+=`<line y1="${T}" y2="${H-B}" x1="${X(x)}" x2="${X(x)}" stroke="#e8eef5"/><text x="${X(x)}" y="${H-B+18}" text-anchor="middle">${x.toFixed(1)}</text>`}
 const mark=(val,col,dark,name,dy)=>{const px=X(z),py=Y(out(val)),tx=Math.max(L,Math.min(px+(z>.8?-76:14),W-R-62)),ty=Math.max(0,Math.min(py+dy,H-B-24));return`<circle cx="${px}" cy="${py}" r="11" fill="${col}" opacity=".15"/><circle cx="${px}" cy="${py}" r="5.5" fill="#fff" stroke="${col}" stroke-width="2.6"/><rect x="${tx}" y="${ty}" width="62" height="24" rx="6" fill="${dark}"/><text class="tag" x="${tx+31}" y="${ty+16}" text-anchor="middle">${name}</text>`};
 const up=res.bub>res.dew; // la etiqueta del punto superior va arriba
 $("chart").innerHTML=`<svg width="${W}" height="${H}" role="img" aria-label="Diagrama de equilibrio líquido-vapor"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0056b3" stop-opacity=".09"/><stop offset="1" stop-color="#0056b3" stop-opacity="0"/></linearGradient></defs>${g}
 <path d="${path(liq)}L${X(1)} ${H-B}L${X(0)} ${H-B}Z" fill="url(#g)"/>
 <line x1="${X(z)}" x2="${X(z)}" y1="${T-8}" y2="${H-B}" stroke="#94a3b8" stroke-dasharray="5 5"/>
 <path d="${path(liq)}" fill="none" stroke="#0056b3" stroke-width="2.8"/><path d="${path(vap)}" fill="none" stroke="#00a896" stroke-width="2.8"/>
 ${mark(res.bub,"#0056b3","#0f3a68","Burbuja",up?-34:12)}${mark(res.dew,"#00a896","#007d70","Rocío",up?12:-34)}
 <text class="t" x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">Fracción Molar (x₁, y₁)</text>
 <text class="t" transform="translate(12 ${(H-B)/2}) rotate(-90)" text-anchor="middle">${res.U=="°C"||res.U=="K"?"Temperatura":"Presión"} del Sistema (${res.U})</text></svg>`;
 const el=$("chart").firstChild;el.onpointermove=e=>{const x=Math.max(0,Math.min(1,(e.clientX-el.getBoundingClientRect().left-L)/(W-L-R)));$("hover").textContent=`Composición ${x.toFixed(3)}  |  Líquido: ${out(res.liq(x)).toFixed(3)}  |  Vapor: ${out(res.vap(x)).toFixed(3)} ${res.U}`};
 el.onpointerleave=()=>$("hover").textContent=""}

document.querySelector("aside").addEventListener("input",e=>{if(e.target.matches("input"))pending()});
document.querySelector("aside").addEventListener("keydown",e=>{if(e.key=="Enter"&&e.target.matches("input"))calc()});
$("calc").onclick=calc;
new ResizeObserver(()=>draw()).observe($("chart"));
drawUnits();calc();

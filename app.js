(function(){
"use strict";
const C = window.SITE_CONFIG;
const $ = (s,r=document)=>r.querySelector(s);
const rub = n => new Intl.NumberFormat("ru-RU").format(Math.round(n))+" ₽";
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- аналитика ---------- */
const A = C.analytics||{};
if(A.yandexMetrikaId){
  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
  ym(A.yandexMetrikaId,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});
}
if(A.ga4Id){
  const s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+A.ga4Id;document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag("js",new Date());gtag("config",A.ga4Id);
}
function goal(name,params){
  try{ if(A.yandexMetrikaId&&window.ym) ym(A.yandexMetrikaId,"reachGoal",name,params); }catch(e){}
  try{ if(A.ga4Id&&window.gtag) gtag("event",name,params||{}); }catch(e){}
  if(!A.yandexMetrikaId&&!A.ga4Id) console.debug("[goal]",name,params||"");
}
document.addEventListener("click",e=>{const g=e.target.closest("[data-goal]"); if(g) goal(g.dataset.goal);});

/* ---------- контакты ---------- */
document.querySelectorAll("[data-phone]").forEach(a=>{a.textContent=C.clinic.phone;a.href="tel:"+C.clinic.phoneHref;});
$("#privacyLink").href=C.clinic.privacyUrl;
$("#year").textContent=new Date().getFullYear();
$("#license").textContent=C.clinic.licenseText;
$("#fTg").href=C.clinic.telegram;$("#fWa").href=C.clinic.whatsapp;
$("#fAddr").innerHTML=C.clinics.map(c=>esc(c.address)).join("<br>");
if(C.clinic.heroImage) $("#heroBg").style.backgroundImage="url('"+C.clinic.heroImage+"')";

/* ---------- калькулятор ---------- */
const state={}; // id -> qty (0 = не выбрано)
const box=$("#services");
if(!C.pricesApproved) $("#demoBanner").hidden=false;
C.services.forEach(s=>{
  state[s.id]=0;
  const row=document.createElement("label");row.className="svc";row.dataset.id=s.id;
  row.innerHTML=`<input type="checkbox" aria-label="${esc(s.name)}"><span class="nm">${esc(s.name)}<small>${esc(s.unit||"")}</small></span>
  ${s.qty?`<span class="qty"><button type="button" data-d="-1" aria-label="Меньше">−</button><span>1</span><button type="button" data-d="1" aria-label="Больше">+</button></span>`:""}`;
  box.appendChild(row);
});
box.addEventListener("click",e=>{
  const b=e.target.closest(".qty button"); if(!b) return;
  e.preventDefault();
  const row=b.closest(".svc"),id=row.dataset.id;
  state[id]=Math.min(32,Math.max(1,(state[id]||1)+Number(b.dataset.d)));
  row.querySelector(".qty span").textContent=state[id];
  calc();
});
box.addEventListener("change",e=>{
  const row=e.target.closest(".svc"); if(!row) return;
  const id=row.dataset.id;
  state[id]=e.target.checked?Math.max(1,state[id]||1):0;
  row.classList.toggle("on",e.target.checked);
  calc(); goal("calc_select",{service:id});
});
let totals={msk:0,dyn:0,names:[]};
function calc(){
  let msk=0,dyn=0,names=[];
  C.services.forEach(s=>{const q=state[s.id]; if(q){msk+=s.moscow*q;dyn+=s.dynasty*q;names.push(s.name+(q>1?" ×"+q:""));}});
  totals={msk,dyn,names};
  const diff=msk-dyn, pct=msk>0?Math.round(diff/msk*100):0;
  $("#sMsk").textContent=rub(msk);$("#sDyn").textContent=rub(dyn);
  $("#sSave").textContent=diff>0?rub(diff):"—";
  $("#sPct").textContent=diff>0?`≈ ${pct}% от московской цены`:"";
  $("#sNote").textContent=names.length?(diff>0?"Экономия ориентировочная и зависит от клинической ситуации.":"Для выбранных услуг цены не заданы или разница отсутствует."):"Выберите хотя бы одну услугу.";
}
calc();

/* ---------- туризм / акции / доверие ---------- */
const IMGATTR=' loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'"';
$("#tourIntro").textContent=C.tourism.intro;
$("#hotels").textContent=C.tourism.hotels;
$("#places").innerHTML=C.tourism.places.map(p=>{
  const st=p.image?` style="background-image:linear-gradient(0deg,rgba(0,0,0,.2),rgba(0,0,0,.2)),url('${esc(p.image)}')"`:"";
  const tag=p.link?`a href="${esc(p.link)}" target="_blank" rel="noopener"`:"div";
  return `<${tag} class="place rv"${st}><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></${p.link?"a":"div"}>`;
}).join("");
$("#offersList").innerHTML=C.offers.map(o=>`
  <article class="card offer rv ${o.featured?"featured":""}">
    <span class="badge">${esc(o.badge)}</span><h3>${esc(o.title)}</h3><p>${esc(o.text)}</p>
    <ul class="perks">${o.perks.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>
    <a class="btn ${o.featured?"gold":""}" href="#calc" data-goal="cta_offer_${esc(o.id)}">Рассчитать стоимость</a>
  </article>`).join("");
$("#offersNote").textContent=C.offersNote||"";
$("#docs").innerHTML=C.doctors.map(d=>`
  <article class="doc"><div class="ph"><img src="${esc(d.photo)}" alt="${esc(d.name)}"${IMGATTR}>
  <div class="yrs"><b>${d.years}</b><small>лет опыта</small></div></div>
  <div class="dbody"><h3>${esc(d.name)}</h3><div class="role">${esc(d.role)}</div>${d.clinic?`<div class="cl">«Династия» ${esc(d.clinic)}</div>`:""}</div></article>`).join("");
$("#clinics").innerHTML=C.clinics.map(c=>`
  <article class="clinic rv"><div class="img" style="background-image:url('${esc(c.image)}')"></div>
  <div class="cbody"><h3>${esc(c.name)}</h3><p>${esc(c.address)}</p><a href="${esc(c.map)}" target="_blank" rel="noopener">Показать на карте →</a></div></article>`).join("");
$("#ratings").innerHTML=C.ratings.map(r=>{
  const full=Math.round(parseFloat(r.score));
  return `<div class="rt rv"><b>${esc(r.score)}</b><div class="st">${"★".repeat(full)}${"☆".repeat(5-full)}</div><span>${esc(r.src)}</span></div>`;}).join("");
$("#reviews").innerHTML=C.reviews.map(r=>`
  <figure class="card rev rv" style="margin:0"><blockquote>${esc(r.text)}</blockquote>
  <figcaption class="meta">${esc(r.src)} · ${esc(r.date)}</figcaption></figure>`).join("");
$("#faqList").innerHTML=C.faq.map(f=>`<details class="rv"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
const mq=C.badges.map(b=>`<span>${esc(b)}</span>`).join("");
$("#marquee").innerHTML=mq+mq;
$("#stats").innerHTML=C.stats.map(s=>`<div class="stat rv"><b data-to="${s.value}" data-dec="${s.dec||0}" data-fmt="${s.fmt?1:0}" data-suf="${esc(s.suffix)}">0</b><span>${esc(s.label)}</span></div>`).join("");

/* ---------- анимации появления и счётчики ---------- */
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
function countUp(el){
  const to=+el.dataset.to,dec=+el.dataset.dec,fmt=el.dataset.fmt==="1",suf=el.dataset.suf;
  const out=v=>(fmt?new Intl.NumberFormat("ru-RU").format(Math.round(v)):v.toFixed(dec))+suf;
  if(reduce){el.textContent=out(to);return;}
  const t0=performance.now(),D=1600;
  (function f(t){const k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);el.textContent=out(to*e);if(k<1)requestAnimationFrame(f);})(t0);
}
if("IntersectionObserver" in window&&!reduce){
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return; e.target.classList.add("vis");
    e.target.querySelectorAll("[data-to]").forEach(countUp); io.unobserve(e.target);
  }),{threshold:.12});
  document.querySelectorAll(".rv").forEach((el,i)=>{el.style.transitionDelay=(i%4)*70+"ms";io.observe(el);});
}else{
  document.querySelectorAll(".rv").forEach(el=>el.classList.add("vis"));
  document.querySelectorAll("[data-to]").forEach(countUp);
}

/* ---------- анкета ---------- */
const form=$("#quiz"),steps=[...form.querySelectorAll(".q")],bar=$("#bar");
let cur=0,started=false,sending=false;
function show(i){
  cur=i;steps.forEach((s,k)=>s.classList.toggle("active",k===i));
  bar.style.width=Math.min(100,(i/4)*100+10)+"%";
  $("#prev").style.visibility=(i===0||i===4)?"hidden":"visible";
  $("#next").textContent=i===3?"Отправить заявку":"Далее";
  $("#quizNav").style.display=i===4?"none":"flex";
}
function err(m){steps[cur].querySelector(".err").textContent=m||"";return !m;}
function validate(){
  err("");
  if(cur===0&&!form.treatment.value) return err("Выберите направление лечения");
  if(cur===1&&!form.jaw.value) return err("Выберите вариант");
  if(cur===2&&!form.ct.value) return err("Укажите, есть ли у вас КТ");
  if(cur===2&&form.ctfile.files[0]&&form.ctfile.files[0].size>50*1024*1024) return err("Файл больше 50 МБ — отправьте КТ позже, координатор подскажет способ");
  if(cur===3){
    const digits=form.phone.value.replace(/\D/g,"");
    if(digits.length<10||digits.length>12) return err("Введите корректный номер телефона");
    if(!form.consent.checked) return err("Необходимо согласие на обработку персональных данных");
  }
  return true;
}
form.addEventListener("change",e=>{
  if(!started){started=true;goal("quiz_start");}
  if(e.target.name==="ct") $("#ctUpload").hidden=form.ct.value!=="Да";
  if(e.target.type==="radio"&&cur<2&&validate()){ setTimeout(()=>{show(cur+1);},180); }
});
$("#prev").onclick=()=>show(Math.max(0,cur-1));
$("#next").onclick=async()=>{
  if(!validate()) return;
  if(cur<3) return show(cur+1);
  if(sending) return; sending=true; $("#next").disabled=true; $("#next").textContent="Отправляем…";
  try{
    await submit();
    goal("lead_submit",{treatment:form.treatment.value});
    show(4);
  }catch(e){
    err("Не удалось отправить заявку. Позвоните нам: "+C.clinic.phone+" или попробуйте ещё раз.");
    $("#next").textContent="Отправить заявку";
  }finally{ sending=false; $("#next").disabled=false; }
};
form.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.tagName!=="TEXTAREA"){e.preventDefault();$("#next").click();} });
form.addEventListener("submit",e=>e.preventDefault());

async function submit(){
  if(form.company.value) return; // honeypot: бот — молча «успех»
  const fd=new FormData();
  fd.append("treatment",form.treatment.value);fd.append("jaw",form.jaw.value);fd.append("ct",form.ct.value);
  fd.append("name",form.name.value.trim());fd.append("phone",form.phone.value.trim());
  fd.append("consent","yes");fd.append("page",location.href);
  fd.append("calc",totals.names.length?`${totals.names.join("; ")} | Москва ${rub(totals.msk)} | Династия ${rub(totals.dyn)}`:"");
  if(form.ctfile.files[0]) fd.append("ctfile",form.ctfile.files[0]);
  if(!C.formEndpoint){ console.info("[DEMO] заявка (endpoint не задан):",Object.fromEntries(fd)); await new Promise(r=>setTimeout(r,500)); return; }
  const r=await fetch(C.formEndpoint,{method:"POST",body:fd});
  if(!r.ok) throw new Error("HTTP "+r.status);
}
show(0);
})();

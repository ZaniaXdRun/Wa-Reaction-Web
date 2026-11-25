"use strict";
const API_ENDPOINT = "https://api-cloud.my.id/tools/rchv2";
const MAX = 15;
const QUICK = ["🔥","😎","❤️","😂","👍","🙏","😍","🎉","💯","👏","🤩","✨","💪","🥳","😮","😢","🤣","😘","🥰","💕","🤯","😱","💥","⚡"];
const $ = id => document.getElementById(id);

let picked = [], historyData = [], sending = false, toastTimer;
const STORE_H = "zaa_react_history", STORE_T = "zaa_react_theme";

/* ---------- UI helpers ---------- */
function toast(msg){
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove("show"),2600);
}
function notice(ok,title,msg){
  const n=$("notice"); n.className="notice show "+(ok?"ok":"err");
  $("noticeTitle").textContent=title; $("noticeMsg").textContent=msg;
}

/* ---------- theme ---------- */
function applyTheme(dark){
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("themeIcon").innerHTML = dark
    ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'
    : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0a1015" : "#eef2f5";
  try{ localStorage.setItem(STORE_T, dark?"dark":"light"); }catch{}
}
applyTheme((()=>{try{return localStorage.getItem(STORE_T)!=="light"}catch{return true}})());
$("themeBtn").onclick = ()=> applyTheme(document.documentElement.dataset.theme!=="dark");

/* ---------- emoji ---------- */
function renderQuick(){
  const w=$("quick"); w.innerHTML="";
  QUICK.forEach(e=>{
    const b=document.createElement("button");
    b.type="button"; b.className="emoji-btn"; b.textContent=e; b.title="Tambah "+e;
    b.onclick=()=>add([e]); w.appendChild(b);
  });
}
function extract(text){
  try{
    const re=/\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*/gu;
    return [...new Set(text.match(re)||[])];
  }catch{
    return [...new Set(Array.from(text).filter(c=>{const n=c.codePointAt(0);return (n>=0x1F300&&n<=0x1FAFF)||(n>=0x2600&&n<=0x27BF)}))];
  }
}
function add(list){
  let n=0;
  list.forEach(e=>{ if(!e||picked.includes(e)||picked.length>=MAX) return; picked.push(e); n++; });
  renderPicked();
  if(picked.length>=MAX) toast("Maksimal 15 emoji.");
  else if(n>0) toast("Emoji ditambahkan.");
}
function renderPicked(){
  const box=$("selected"); box.innerHTML="";
  if(!picked.length){
    const s=document.createElement("span"); s.className="empty-text"; s.textContent="Belum ada emoji dipilih"; box.appendChild(s);
  }
  picked.forEach((e,i)=>{
    const chip=document.createElement("div"); chip.className="chip";
    const sym=document.createElement("span"); sym.textContent=e;
    const x=document.createElement("button"); x.textContent="×"; x.title="Hapus"; x.onclick=()=>{picked.splice(i,1);renderPicked()};
    chip.append(sym,x); box.appendChild(chip);
  });
  const c=$("count"); c.textContent=picked.length+" / 15"; c.classList.toggle("max",picked.length>=MAX);
}
$("manual").addEventListener("input",e=>{const f=extract(e.target.value);if(f.length){add(f);e.target.value=""}});
$("manual").addEventListener("paste",e=>{e.preventDefault();const f=extract(e.clipboardData.getData("text"));f.length?add(f):toast("Emoji tidak ditemukan.")});
$("clearBtn").onclick=()=>{picked=[];renderPicked();toast("Pilihan dikosongkan.")};
$("pasteBtn").onclick=async()=>{
  try{const t=await navigator.clipboard.readText();if(!t){toast("Clipboard kosong.");return}$("link").value=t.trim();toast("Link ditempel.")}
  catch{toast("Tempel manual saja.");$("link").focus()}
};

/* ---------- history ---------- */
function loadHistory(){try{historyData=JSON.parse(localStorage.getItem(STORE_H)||"[]");if(!Array.isArray(historyData))historyData=[]}catch{historyData=[]}renderHist();stats()}
function saveHistory(){try{localStorage.setItem(STORE_H,JSON.stringify(historyData))}catch{toast("Penyimpanan browser tidak tersedia.")}}
function addHistory(item){historyData.unshift(item);historyData=historyData.slice(0,30);saveHistory();renderHist();stats()}
function stats(){
  const ok=historyData.filter(x=>x.success).length;
  $("sTotal").textContent=historyData.length; $("sOk").textContent=ok; $("sFail").textContent=historyData.length-ok;
}
function renderHist(){
  const w=$("hist"); w.innerHTML="";
  if(!historyData.length){w.innerHTML='<div class="hist-empty">Belum ada riwayat aktivitas.</div>';return}
  historyData.forEach(it=>{
    const c=document.createElement("div"); c.className="hitem";
    const top=document.createElement("div"); top.className="htop";
    const b=document.createElement("span"); b.className="badge "+(it.success?"ok":"fail"); b.textContent=it.success?"BERHASIL":"GAGAL";
    const tm=document.createElement("span"); tm.className="htime";
    const d=new Date(it.time); tm.textContent=isNaN(d.getTime())?"-":d.toLocaleString("id-ID",{dateStyle:"short",timeStyle:"short"});
    top.append(b,tm);
    const l=document.createElement("div"); l.className="hlink"; l.textContent=it.link; l.title=it.link;
    const em=document.createElement("div"); em.className="hemo"; em.textContent=(it.emojis||[]).join(" ");
    c.append(top,l,em); w.appendChild(c);
  });
}
$("clearHist").onclick=()=>{if(!historyData.length){toast("Riwayat masih kosong.");return}if(!confirm("Hapus semua riwayat?"))return;historyData=[];saveHistory();renderHist();stats();toast("Riwayat dihapus.")};

/* ---------- cacing makan buah (canvas) ---------- */
const cv=$("wormCanvas"), cx=cv.getContext("2d");
let anim=null, loopTimer=null, CW=340, CH=170;
function sizeCanvas(){
  const dpr=window.devicePixelRatio||1, r=cv.getBoundingClientRect();
  CW=r.width||340; CH=170; cv.width=CW*dpr; cv.height=CH*dpr; cx.setTransform(dpr,0,0,dpr,0,0);
}
sizeCanvas(); window.addEventListener("resize",sizeCanvas);

function apple(cxp,cyp,r){
  cx.beginPath();
  cx.moveTo(cxp,cyp-r*.32);
  cx.bezierCurveTo(cxp-r*.22,cyp-r*.92,cxp-r*1.12,cyp-r*.6,cxp-r*.96,cyp+r*.14);
  cx.bezierCurveTo(cxp-r*.84,cyp+r*.92,cxp-r*.2,cyp+r*1.06,cxp,cyp+r*.74);
  cx.bezierCurveTo(cxp+r*.2,cyp+r*1.06,cxp+r*.84,cyp+r*.92,cxp+r*.96,cyp+r*.14);
  cx.bezierCurveTo(cxp+r*1.12,cyp-r*.6,cxp+r*.22,cyp-r*.92,cxp,cyp-r*.32);
  cx.closePath();
}
function startWorm(){
  if(loopTimer) return;
  anim={t:0,phase:"approach",fruit:1,bite:0,crumbs:[],chew:0,headX:CW*.14};
  drawWorm();
  loopTimer=setInterval(drawWorm,16);
}
function stopWorm(){ if(loopTimer)clearInterval(loopTimer); loopTimer=null; anim=null; }
function drawWorm(){
  const a=anim; a.t+=.016;
  cx.clearRect(0,0,CW,CH);
  const baseY=CH*.62, fx=CW*.76, fy=CH*.55, R=34*a.fruit;
  const surface=getComputedStyle(document.documentElement).getPropertyValue("--surface").trim()||"#111b23";

  // ground shadow
  cx.fillStyle="rgba(0,0,0,.18)";
  cx.beginPath(); cx.ellipse(CW*.5,baseY+30,CW*.34,7,0,0,Math.PI*2); cx.fill();

  // fruit
  if(a.fruit>.06){
    const grad=cx.createRadialGradient(fx-8,fy-10,4,fx,fy,R*1.3);
    grad.addColorStop(0,"#ff8a7a"); grad.addColorStop(.55,"#f04452"); grad.addColorStop(1,"#b91d33");
    apple(fx,fy,R); cx.fillStyle=grad; cx.fill();
    cx.strokeStyle="rgba(255,255,255,.14)"; cx.lineWidth=1.5; cx.stroke();
    // stem
    cx.strokeStyle="#6b4423"; cx.lineWidth=4; cx.lineCap="round";
    cx.beginPath(); cx.moveTo(fx,fy-R*.34); cx.quadraticCurveTo(fx+5,fy-R*.75,fx+12,fy-R*.8); cx.stroke();
    // leaf
    cx.fillStyle="#7ec850";
    cx.beginPath(); cx.ellipse(fx+22,fy-R*.85,12,6,-.5,0,Math.PI*2); cx.fill();
    // bite mark (background-colored circle on left edge)
    if(a.phase==="eat"){
      const br=R*.55+a.bite*R*.4;
      cx.fillStyle=surface;
      cx.beginPath(); cx.arc(fx-R*.92,fy-R*.1,br,0,Math.PI*2); cx.fill();
    }
  }

  // crumbs
  a.crumbs=a.crumbs.filter(c=>c.life>0);
  a.crumbs.forEach(c=>{
    c.x+=c.vx; c.y+=c.vy; c.vy+=.12; c.life-=.02;
    cx.globalAlpha=Math.max(0,c.life); cx.fillStyle="#f04452";
    cx.beginPath(); cx.arc(c.x,c.y,c.r,0,Math.PI*2); cx.fill();
  });
  cx.globalAlpha=1;

  // worm body
  const segs=7, gap=15, amp=9;
  const targetX=fx-R-14;
  if(a.phase==="approach"){
    a.headX+=(targetX-a.headX)*.055;
    if(targetX-a.headX<5){a.phase="eat";a.chew=0; a.headX=targetX}
  }else if(a.phase==="eat"){
    a.chew+=.09;
    if(Math.floor(a.chew)%2===0 && a.bite===0){
      a.bite=.18;
      for(let i=0;i<4;i++)a.crumbs.push({x:fx-R*.85,y:fy, vx:(Math.random()-.5)*3+.5, vy:-Math.random()*3-1, r:1.5+Math.random()*2, life:1});
    }
    a.bite*=.9;
    a.fruit-=.018;
    if(a.fruit<=.07){a.phase="happy";a.t=0}
  }else if(a.phase==="happy"){
    if(a.t>2.1){a.phase="reset";a.t=0}
  }else if(a.phase==="reset"){
    a.fruit+=(1-a.fruit)*.03; a.headX+=(CW*.14-a.headX)*.04;
    if(a.fruit>.98){a.fruit=1;a.headX=CW*.14;a.phase="approach"}
  }

  for(let i=segs-1;i>=0;i--){
    const x=a.headX-i*gap;
    const y=baseY+Math.sin(a.t*4-i*.55)*amp*(a.phase==="happy"?1.7:1);
    const rad=(a.phase==="happy"?10:12.5)-i*.75;
    const g=cx.createLinearGradient(x,y-rad,x,y+rad);
    g.addColorStop(0,i===0?"#b6f36a":"#7ed94a"); g.addColorStop(1,i===0?"#5ba832":"#3f8f2b");
    cx.beginPath(); cx.arc(x,y,Math.max(3,rad),0,Math.PI*2); cx.fillStyle=g; cx.fill();
    cx.strokeStyle="rgba(0,0,0,.14)"; cx.lineWidth=1; cx.stroke();
    // tiny legs
    if(i%2===0){
      cx.strokeStyle="#4a9c30"; cx.lineWidth=2;
      const ly=y+rad-1;
      cx.beginPath(); cx.moveTo(x-3,ly); cx.lineTo(x-6,ly+6); cx.stroke();
    }
  }
  // head details
  const hx=a.headX, hy=baseY+Math.sin(a.t*4)*amp;
  // antennae
  cx.strokeStyle="#4a9c30"; cx.lineWidth=2;
  cx.beginPath(); cx.moveTo(hx-3,hy-11); cx.quadraticCurveTo(hx-8,hy-24,hx-13,hy-24); cx.stroke();
  cx.beginPath(); cx.moveTo(hx+3,hy-11); cx.quadraticCurveTo(hx+8,hy-24,hx+13,hy-24); cx.stroke();
  cx.fillStyle="#a3e635";
  cx.beginPath(); cx.arc(hx-13,hy-24,3,0,Math.PI*2); cx.fill();
  cx.beginPath(); cx.arc(hx+13,hy-24,3,0,Math.PI*2); cx.fill();
  // eyes
  cx.fillStyle="#fff";
  cx.beginPath(); cx.arc(hx+3,hy-4,4,0,Math.PI*2); cx.fill();
  cx.beginPath(); cx.arc(hx+9,hy-4,4,0,Math.PI*2); cx.fill();
  cx.fillStyle="#10240c";
  cx.beginPath(); cx.arc(hx+4,hy-4,1.8,0,Math.PI*2); cx.fill();
  cx.beginPath(); cx.arc(hx+10,hy-4,1.8,0,Math.PI*2); cx.fill();
  // mouth
  const open=(a.phase==="eat")?(Math.floor(a.chew)%2===0?5:1):2;
  cx.strokeStyle="#204a12"; cx.lineWidth=2;
  cx.beginPath(); cx.arc(hx+8,hy+6,4,-.2,Math.PI+.2+open*.08); cx.stroke();
}

/* ---------- API ---------- */
function validLink(v){
  try{const u=new URL(v);return ["whatsapp.com","www.whatsapp.com"].includes(u.hostname.toLowerCase())&&u.pathname.includes("/channel/")}catch{return false}
}
function rateLimited(status,msg){
  if(status===429)return true;
  const t=String(msg||"").toLowerCase();
  return ["rate limit","too many requests","quota exceeded","usage limit","limit reached","terlalu banyak permintaan","batas penggunaan","kuota habis"].some(k=>t.includes(k));
}
async function callProvider(link,emojis){
  const p=new URLSearchParams({link,emoji:emojis.join("")});
  const res=await fetch(API_ENDPOINT+"?"+p,{headers:{Accept:"application/json"}});
  const raw=await res.text();
  let data; try{data=JSON.parse(raw)}catch{data={message:raw||"Provider tidak memberi respons JSON."}}
  const m=data.message||data.error||data.msg||data.result||"Tidak ada pesan dari provider.";
  if(rateLimited(res.status,m)){const e=new Error("Batas penggunaan provider tercapai. Coba lagi nanti.");e.rate=true;throw e}
  if(res.status===401||res.status===403)throw new Error("Provider menolak akses.");
  if(!res.ok)throw new Error(m);
  if(data.status===false||data.success===false||data.ok===false||data.error)throw new Error(m);
  return data;
}

$("sendBtn").onclick=async()=>{
  if(sending)return;
  const link=$("link").value.trim();
  if(!link){toast("Masukkan link postingan dulu.");$("link").focus();return}
  if(!validLink(link)){toast("Link WhatsApp Channel tidak valid.");$("link").focus();return}
  if(!picked.length){toast("Pilih minimal satu emoji.");return}

  sending=true; $("sendBtn").disabled=true;
  $("sendBtn").innerHTML='<span class="mini-worm"><i></i><i></i><i></i><i></i></span><span>Mengirim...</span>';
  $("overlay").classList.add("show");
  $("loadTitle").innerHTML='Mengirim reaksi<span class="dots"><i></i><i></i><i></i></span>';
  $("notice").className="notice";
  startWorm();

  const emojis=[...picked];
  try{
    const data=await callProvider(link,emojis);
    const msg=data.message||data.msg||"Respons berhasil diterima dari provider.";
    notice(true,"Respons diterima",String(msg));
    addHistory({success:true,link,emojis,message:String(msg),time:new Date().toISOString()});
    toast("Permintaan berhasil diproses.");
  }catch(e){
    const msg=e.rate?e.message:(e.name==="TypeError"?"Tidak dapat terhubung ke provider. Cek koneksi atau CORS.":(e.message||"Terjadi kesalahan."));
    notice(false,e.rate?"Batas provider tercapai":"Permintaan gagal",msg);
    addHistory({success:false,link,emojis,message:msg,time:new Date().toISOString()});
    toast(e.rate?"Batas penggunaan provider tercapai.":"Permintaan gagal diproses.");
  }finally{
    setTimeout(()=>{
      stopWorm(); $("overlay").classList.remove("show");
      sending=false; $("sendBtn").disabled=false;
      $("sendBtn").innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg><span>Kirim Reaksi</span>';
    },900);
  }
};


/* ---------- audio player melayang ---------- */
const TRACKS = Array.from({length:6},(_,i)=>`audio${i+1}.mp3`);
const audio=$("audioEl");
let track=0, audioReady=false;

function setTrack(i){
  track=(i+TRACKS.length)%TRACKS.length;
  audio.src="./"+TRACKS[track];
  $("audioTrack").textContent=TRACKS[track];
  $("audioFill").style.width="0%";
  $("audioToggle").textContent="▶";
}
function toggleAudio(){
  if(audio.paused){
    $("audioToggle").textContent="❚❚";
    audio.play().then(()=>{$("audioNote").textContent=TRACKS[track]}).catch(()=>{$("audioToggle").textContent="▶";toast("File audio belum ada / gagal diputar.")});
  }else{
    audio.pause();$("audioToggle").textContent="▶";
  }
}
audio.addEventListener("canplay",()=>audioReady=true);
audio.addEventListener("error",()=>{audioReady=false;$("audioToggle").textContent="▶";$("audioNote").textContent=TRACKS[track]+" belum ada — taruh file di folder ini"});
audio.addEventListener("ended",()=>{setTrack(track+1);audio.play().then(()=>$("audioToggle").textContent="❚❚").catch(()=>{})});
audio.addEventListener("timeupdate",()=>{if(audio.duration)$("audioFill").style.width=(audio.currentTime/audio.duration*100)+"%"});
$("audioFab").onclick=()=>$("audioPop").classList.toggle("show");
$("audioClose").onclick=()=>$("audioPop").classList.remove("show");
$("audioPrev").onclick=()=>setTrack(track-1);
$("audioNext").onclick=()=>setTrack(track+1);
$("audioToggle").onclick=toggleAudio;
setTrack(0);

/* init */
renderQuick(); renderPicked(); loadHistory();

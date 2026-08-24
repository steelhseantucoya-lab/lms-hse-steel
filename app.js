
const MODULES = [
  {n:1,title:"CONOCE STEEL Y NUESTRA CULTURA HSE",duration:"10:46",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-01/modulo_01_lms_1080p.mp4",recapPdf:"assets/docs/modulo01_conoce_steel_cultura_hse.pdf"},
  {n:2,title:"REGLAS QUE NO SE NEGOCIAN",duration:"13:30",video:"assets/videos/modulo02.mp4"},
  {n:3,title:"ANTES DE HACER, PIENSA",duration:"15:00",video:"assets/videos/modulo03.mp4"},
  {n:4,title:"CONTROLES CRÍTICOS — EdC",duration:"16:00",video:"assets/videos/modulo04.mp4"},
  {n:5,title:"AGENTES PELIGROSOS",duration:"14:00",video:"assets/videos/modulo05.mp4"},
  {n:6,title:"EMERGENCIAS",duration:"13:30",video:"assets/videos/modulo06.mp4"},
  {n:7,title:"YO VEO · YO ACTÚO · YO REPORTO",duration:"13:30",video:"assets/videos/modulo07.mp4"},
  {n:8,title:"APTITUD PARA TRABAJAR",duration:"12:30",video:"assets/videos/modulo08.mp4"},
  {n:9,title:"VIVIR LA SEGURIDAD EN TERRENO",duration:"15:00",video:"assets/videos/modulo09.mp4"},
  {n:10,title:"DESAFÍO FINAL HSE STEEL",duration:"18:00",video:"assets/videos/modulo10.mp4"}
];

const moduleByNo = n => MODULES.find(m=>m.n===Number(n));
let sb=null,currentUser=null,currentProfile=null,currentModule=null;
const cfg=window.STEEL_LMS_CONFIG||{};
if(cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY){
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);
}
const $=s=>document.querySelector(s);
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const app=html=>document.getElementById("app").innerHTML=html;

function landing(){
  app(`<div class="landing">
    <div class="landing-panel">
      <div class="brand">STEEL <span>HSE LMS</span></div>
      <h1>INDUCCIÓN HOMBRE NUEVO</h1>
      <p>Capacitación HSE con trazabilidad, evaluaciones, progreso y vigencia anual.</p>
      <div class="landing-grid">
        <div class="login-card"><h2>TRABAJADOR</h2><p>Ingresa a tus módulos, videos, evaluaciones y certificado.</p><button class="primary" onclick="loginView('worker')">INGRESAR COMO TRABAJADOR</button></div>
        <div class="login-card"><h2>ADMINISTRADOR HSE</h2><p>Gestiona trabajadores, resultados, brechas, vigencias y certificados.</p><button class="primary" onclick="loginView('admin')">INGRESAR COMO ADMINISTRADOR HSE</button></div>
      </div>
    </div>
  </div>`);
}

function loginView(role){
  app(`<div class="landing"><div class="auth-card">
    <div class="eyebrow">${role==="admin"?"ADMINISTRADOR HSE":"TRABAJADOR"}</div>
    <h2>INICIAR SESIÓN</h2>
    <label>CORREO</label><input id="email" type="email">
    <label>CONTRASEÑA</label><input id="password" type="password">
    <div id="loginMsg"></div>
    <button class="primary" onclick="signIn('${role}')">INGRESAR</button>
    <button class="secondary" onclick="landing()">VOLVER</button>
  </div></div>`);
}

async function signIn(expectedRole){
  const msg=$("#loginMsg");
  msg.textContent="Validando...";
  if(!sb){msg.textContent="Supabase no está configurado.";return;}
  const {data,error}=await sb.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
  if(error){msg.textContent=error.message;return;}
  currentUser=data.user;
  const {data:profile,error:pe}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
  if(pe||!profile){await sb.auth.signOut();msg.textContent="Perfil no configurado.";return;}
  if(profile.role!==expectedRole){await sb.auth.signOut();msg.textContent="Rol de acceso incorrecto.";return;}
  currentProfile=profile;
  roleHome();
}

function roleHome(){ currentProfile.role==="admin" ? adminDashboard() : workerDashboard(); }
async function logout(){ try{await sb.auth.signOut()}catch(e){} currentUser=null;currentProfile=null;landing(); }

function shell(content,admin=false,active="home"){
  const workerNav = `
    <button class="nav ${active==="home"?"active":""}" onclick="workerDashboard()">INICIO</button>
    <button class="nav ${active==="route"?"active":""}" onclick="workerDashboard()">MI RUTA HSE</button>
    <button class="nav ${active==="progress"?"active":""}" onclick="workerProgress()">PROGRESO</button>
    <button class="nav ${active==="cert"?"active":""}" onclick="workerCertificate()">CERTIFICADO</button>`;
  const adminNav = `
    <button class="nav ${active==="home"?"active":""}" onclick="adminDashboard()">RESUMEN HSE</button>
    <button class="nav ${active==="workers"?"active":""}" onclick="adminWorkers()">TRABAJADORES</button>
    <button class="nav ${active==="modules"?"active":""}" onclick="adminModules()">MÓDULOS</button>
    <button class="nav ${active==="results"?"active":""}" onclick="adminResults()">RESULTADOS Y BRECHAS</button>
    <button class="nav ${active==="certs"?"active":""}" onclick="adminCertificates()">CERTIFICADOS</button>`;
  app(`<div class="layout">
    <aside class="sidebar">
      <div class="sidebar-brand">STEEL <span>HSE LMS</span></div>
      <div class="sidebar-sub">INDUCCIÓN HOMBRE NUEVO</div>
      ${admin?adminNav:workerNav}
      <button class="nav" onclick="logout()">CERRAR SESIÓN</button>
    </aside>
    <main class="main">
      <header class="topbar"><div>HSE LMS · PRODUCCIÓN</div><div><b>${esc(currentProfile.full_name||"")}</b><span>${esc(currentProfile.role||"")}</span></div></header>
      ${content}
    </main>
  </div>`);
}

async function workerDashboard(){
  const {data:rows}=await sb.from("module_progress").select("*").eq("user_id",currentUser.id).order("module_no");
  const progress=rows||[];
  const completed=progress.filter(x=>x.status==="approved").length;
  const cards=MODULES.map(m=>{
    const p=progress.find(x=>x.module_no===m.n);
    const unlocked=m.n===1||progress.some(x=>x.module_no===m.n-1&&x.status==="approved");
    return `<div class="module-card ${unlocked?"":"locked"}" ${unlocked?`onclick="openModule(${m.n})"`:""}>
      <div class="module-visual module-${m.n}">
        <div class="module-no">${String(m.n).padStart(2,"0")}</div>
        <div class="module-icon">${["HSE","RC","ARTP","EdC","GAS","SOS","VER","APTO","360°","FINAL"][m.n-1]}</div>
      </div>
      <div class="module-info">
        <h3>${esc(m.title)}</h3>
        <p>${m.duration} min</p>
        <span class="pill ${p?.status==="approved"?"ok":""}">${p?.status==="approved"?"APROBADO":unlocked?"DISPONIBLE":"BLOQUEADO"}</span>
      </div>
    </div>`;
  }).join("");
  shell(`<section class="hero"><div class="eyebrow">INDUCCIÓN HOMBRE NUEVO</div><h1>BIENVENIDO, ${esc(currentProfile.full_name)}</h1>
  <p>Completa tu ruta HSE en orden. Cada resultado queda registrado.</p>
  <div class="progress"><span style="width:${completed*10}%"></span></div><b>${completed}/10 MÓDULOS COMPLETADOS</b></section>
  <section class="content"><h2>TU RUTA DE APRENDIZAJE</h2><div class="module-grid">${cards}</div></section>`,false,"home");
}

async function openModule(n){
  currentModule=moduleByNo(n);
  const {data:p}=await sb.from("module_progress").select("*").eq("user_id",currentUser.id).eq("module_no",n).single();
  renderModulePlayer(p||{});
}

function renderModulePlayer(progress){
  const m=currentModule;
  const videoExistsNotice=`<div id="videoMissing" class="video-missing" hidden>
    <b>VIDEO PENDIENTE DE CARGA</b>
    <span>El reproductor está listo. Debe existir <code>${esc(m.video)}</code> en GitHub.</span>
  </div>`;
  shell(`<section class="module-header">
    <div><div class="eyebrow">MÓDULO ${String(m.n).padStart(2,"0")}</div><h1>${esc(m.title)}</h1></div>
    <div class="duration">DURACIÓN: ${m.duration} MIN</div>
  </section>
  <section class="video-shell">
    <div class="video-banner">
      <div class="steel-logo">STEEL</div>
      <div class="video-title">${esc(m.title)}</div>
      <div class="video-lock">NO PUEDES ADELANTAR</div>
    </div>
    <div class="video-wrap">
      <video id="courseVideo" preload="metadata" playsinline controlslist="nodownload noplaybackrate" disablepictureinpicture>
        <source src="${esc(m.video)}" type="video/mp4">
      </video>
      ${videoExistsNotice}
    </div>
    <div class="custom-controls">
      <button id="playBtn" class="round" onclick="togglePlay()">▶</button>
      <div class="time" id="timeLabel">00:00 / ${m.duration}</div>
      <div class="video-progress"><span id="videoProgress" style="width:0%"></span></div>
      <div class="lock-label">🔒 AVANCE BLOQUEADO · 1×</div>
    </div>
  </section>
  <section class="stage-tabs">
    <div class="stage done"><b>OBJETIVO</b><span>¿Qué aprenderás?</span></div>
    <div class="stage active"><b>VIDEO</b><span>En curso</span></div>
    <div class="stage ${progress.video_completed?"done":""}"><b>REPASO</b><span>${progress.video_completed?"Disponible":"Bloqueado"}</span></div>
    <div class="stage ${progress.recap_completed?"done":""}"><b>EVALUACIÓN</b><span>${progress.recap_completed?"Disponible":"Bloqueado"}</span></div>
  </section>
  <section class="content">
    <div class="action-row">
      <button class="secondary" onclick="workerDashboard()">← VOLVER A MI RUTA</button>
      <button id="continueBtn" class="primary" ${progress.video_completed?"":"disabled"} onclick="startRecap()">CONTINUAR AL REPASO</button>
    </div>
  </section>`,false,"route");
  setupVideo(progress.max_video_seconds||0,progress.video_completed||false);
}

function setupVideo(savedMax,alreadyCompleted){
  const v=$("#courseVideo"), missing=$("#videoMissing"), playBtn=$("#playBtn"), continueBtn=$("#continueBtn");
  let maxAllowed=Math.max(0,Number(savedMax||0));
  let lastSave=0;
  v.playbackRate=1;
  v.addEventListener("error",()=>{missing.hidden=false;});
  v.addEventListener("loadedmetadata",()=>{
    if(maxAllowed>0 && maxAllowed<v.duration) v.currentTime=Math.min(maxAllowed,v.duration);
    updateVideoUI();
  });
  v.addEventListener("ratechange",()=>{ if(v.playbackRate!==1) v.playbackRate=1; });
  v.addEventListener("seeking",()=>{
    if(v.currentTime>maxAllowed+1.2) v.currentTime=maxAllowed;
  });
  v.addEventListener("timeupdate",async()=>{
    if(v.currentTime>maxAllowed) maxAllowed=v.currentTime;
    updateVideoUI();
    if(Math.floor(v.currentTime)-lastSave>=8){
      lastSave=Math.floor(v.currentTime);
      await sb.from("module_progress").update({max_video_seconds:Math.floor(maxAllowed),status:"in_progress",updated_at:new Date().toISOString()}).eq("user_id",currentUser.id).eq("module_no",currentModule.n);
    }
  });
  v.addEventListener("ended",async()=>{
    maxAllowed=v.duration;
    await sb.from("module_progress").update({max_video_seconds:Math.floor(v.duration),video_completed:true,status:"in_progress",updated_at:new Date().toISOString()}).eq("user_id",currentUser.id).eq("module_no",currentModule.n);
    continueBtn.disabled=false;
    continueBtn.textContent="CONTINUAR AL REPASO";
    playBtn.textContent="↻";
  });
}
function togglePlay(){const v=$("#courseVideo");if(v.paused)v.play();else v.pause();updatePlayButton()}
function updatePlayButton(){const v=$("#courseVideo");$("#playBtn").textContent=v.paused?"▶":"❚❚"}
function updateVideoUI(){const v=$("#courseVideo");if(!v||!isFinite(v.duration))return;$("#videoProgress").style.width=`${Math.min(100,(v.currentTime/v.duration)*100)}%`;$("#timeLabel").textContent=`${fmt(v.currentTime)} / ${fmt(v.duration)}`;updatePlayButton()}
function fmt(s){s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}

async function startRecap(){
  const {data:p}=await sb.from("module_progress")
    .select("*")
    .eq("user_id",currentUser.id)
    .eq("module_no",currentModule.n)
    .single();

  if(!p?.video_completed){
    alert("Debes terminar el video antes de continuar.");
    return;
  }

  const pdf=currentModule.recapPdf||"";

  shell(`
    <section class="module-header">
      <div>
        <div class="eyebrow">
          MÓDULO ${String(currentModule.n).padStart(2,"0")} · REPASO
        </div>
        <h1>${esc(currentModule.title)}</h1>
      </div>
    </section>

    <section class="content">
      <div class="panel">
        <h2>REPASO DEL MÓDULO</h2>
        <p>Revisa y descarga el material antes de rendir la evaluación.</p>

        <div style="margin:24px 0;padding:22px;border:1px solid #d8e0e6;border-radius:12px;background:#fff">
          <h3>MÓDULO 01 — CONOCE STEEL Y NUESTRA CULTURA HSE</h3>
          <p>Material oficial de repaso en formato PDF.</p>

          <a class="primary"
             href="${esc(pdf)}"
             target="_blank"
             rel="noopener">
            DESCARGAR PDF DEL MÓDULO 01
          </a>
        </div>

        <button class="primary" onclick="completeRecap()">
          CONTINUAR A LA EVALUACIÓN
        </button>
      </div>
    </section>
  `,false,"route");
}

async function completeRecap(){
  await sb.from("module_progress")
    .update({
      recap_completed:true,
      case_completed:true,
      updated_at:new Date().toISOString()
    })
    .eq("user_id",currentUser.id)
    .eq("module_no",currentModule.n);

  loadAssessment();
}
function startCase(){
  shell(`<section class="module-header"><div><div class="eyebrow">MÓDULO ${String(currentModule.n).padStart(2,"0")} · CASO DE TERRENO</div><h1>${esc(currentModule.title)}</h1></div></section>
  <section class="content"><div class="panel"><h2>CAMBIÓ LA CONDICIÓN DE TRABAJO</h2><p>Durante la ejecución detectas que uno de los controles definidos ya no puede aplicarse como estaba planificado.</p>
  <button class="answer" onclick="caseAnswer(false)">A) CONTINUAR CON MÁS PRECAUCIÓN.</button>
  <button class="answer" onclick="caseAnswer(true)">B) DETENER, COMUNICAR, REEVALUAR Y RESTABLECER CONTROLES.</button>
  <button class="answer" onclick="caseAnswer(false)">C) TERMINAR RÁPIDO Y REPORTAR DESPUÉS.</button>
  <div id="caseMsg"></div></div></section>`,false,"route");
}
async function caseAnswer(ok){
  if(!ok){$("#caseMsg").innerHTML='<div class="warning">Respuesta incorrecta. El riesgo debe controlarse antes de continuar.</div>';return}
  await sb.from("module_progress").update({case_completed:true,updated_at:new Date().toISOString()}).eq("user_id",currentUser.id).eq("module_no",currentModule.n);
  $("#caseMsg").innerHTML='<div class="success">Correcto. Ahora puedes rendir la evaluación.</div><button class="primary" onclick="loadAssessment()">IR A EVALUACIÓN</button>';
}
async function loadAssessment(){
  const {data,error}=await sb.functions.invoke("get-module-assessment",{body:{module_no:currentModule.n}});
  if(error||data?.error){alert(data?.error||error.message);return}
  renderAssessment(data);
}
function renderAssessment(data){
  const qs=data.questions.map((q,i)=>`<div class="question"><div class="eyebrow">PREGUNTA ${i+1}${q.critical?" · CRÍTICA":""}</div><h3>${esc(q.question)}</h3>${q.options.map(o=>`<label class="option"><input type="radio" name="q_${q.id}" value="${o.key}"><span>${esc(o.text)}</span></label>`).join("")}</div>`).join("");
  shell(`<section class="module-header"><div><div class="eyebrow">MÓDULO ${String(currentModule.n).padStart(2,"0")} · EVALUACIÓN</div><h1>${esc(currentModule.title)}</h1></div></section>
  <section class="content">${qs}<button class="primary" onclick='submitAssessment(${JSON.stringify(data).replace(/'/g,"&#39;")})'>ENVIAR EVALUACIÓN</button><div id="evalMsg"></div></section>`,false,"route");
}
async function submitAssessment(data){
  const answers=[];
  for(const q of data.questions){const s=document.querySelector(`input[name="q_${q.id}"]:checked`);if(!s){$("#evalMsg").innerHTML='<div class="warning">Debes responder todas las preguntas.</div>';return}answers.push({question_id:q.id,option:s.value})}
  const {data:r,error}=await sb.functions.invoke("submit-module-assessment",{body:{module_no:currentModule.n,answers,started_at:new Date().toISOString()}});
  if(error||r?.error){alert(r?.error||error.message);return}
  shell(`<section class="hero"><div class="eyebrow">RESULTADO</div><h1>${r.passed?"MÓDULO APROBADO":"REFUERZO REQUERIDO"}</h1><p>Nota: <b>${r.score}%</b> · Fallas críticas: <b>${r.critical_failures||0}</b> · Intento: <b>${r.attempts||1}</b></p></section>
  <section class="content"><button class="primary" onclick="workerDashboard()">VOLVER A MI RUTA HSE</button></section>`,false,"route");
}

async function workerProgress(){workerDashboard()}
async function workerCertificate(){shell(`<section class="content"><div class="panel"><h2>CERTIFICADO</h2><p>Se habilita al aprobar los 10 módulos. Vigencia: 1 año desde la fecha de emisión.</p></div></section>`,false,"cert")}

/* ADMIN */
async function adminDashboard(){
  const [{count:workers},{data:progress},{data:certs}]=await Promise.all([
    sb.from("profiles").select("*",{count:"exact",head:true}).eq("role","worker"),
    sb.from("module_progress").select("status,score"),
    sb.from("certificates").select("status")
  ]);
  const scores=(progress||[]).filter(x=>x.score!=null);const avg=scores.length?Math.round(scores.reduce((a,b)=>a+b.score,0)/scores.length):0;
  shell(`<section class="hero"><div class="eyebrow">PANEL ADMINISTRADOR HSE</div><h1>CONTROL DE INDUCCIÓN HOMBRE NUEVO</h1><p>Información en tiempo real desde Supabase.</p></section>
  <section class="content"><div class="kpi-grid"><div><span>TRABAJADORES</span><b>${workers||0}</b></div><div><span>MÓDULOS APROBADOS</span><b>${(progress||[]).filter(x=>x.status==="approved").length}</b></div><div><span>PROMEDIO</span><b>${avg}%</b></div><div><span>CERTIFICADOS</span><b>${(certs||[]).filter(x=>x.status==="valid").length}</b></div></div></section>`,true,"home");
}
async function adminWorkers(){
  const {data:workers}=await sb.from("profiles").select("*").eq("role","worker").order("full_name");
  shell(`<section class="content">
    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:14px">
      <div><div class="eyebrow">GESTIÓN REAL</div><h1 style="margin:4px 0">TRABAJADORES</h1>
      <p style="margin:0;color:#66737d">${(workers||[]).length} trabajador(es) registrados</p></div>
      <button class="primary" onclick="adminNewWorker()">+ CREAR TRABAJADOR</button>
    </div>
    <div class="panel"><table><thead><tr><th>NOMBRE</th><th>RUT</th><th>CARGO</th><th>ÁREA / FAENA</th><th>CUENTA</th></tr></thead>
    <tbody>${(workers||[]).map(w=>`<tr>
      <td><b>${esc(w.full_name)}</b><br><span style="color:#66737d;font-size:12px">${esc(w.email||"")}</span></td>
      <td>${esc(w.rut||"—")}</td><td>${esc(w.job_title||"—")}</td><td>${esc(w.site_area||"—")}</td>
      <td><span class="pill ${w.account_verified?"ok":""}">${w.account_verified?"VERIFICADA":"PENDIENTE"}</span></td>
    </tr>`).join("")}</tbody></table></div>
  </section>`,true,"workers");
}

function adminNewWorker(){
  shell(`<section class="content"><div class="panel" style="max-width:850px">
    <div class="eyebrow">NUEVO TRABAJADOR</div><h1>CREAR CUENTA PARA INDUCCIÓN HOMBRE NUEVO</h1>
    <p style="color:#66737d">La contraseña inicial se define aquí y después no queda visible en el panel.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div><label>NOMBRE COMPLETO *</label><input id="nw_name" style="width:100%;padding:12px;border:1px solid #d8e0e6;border-radius:9px"></div>
      <div><label>RUT</label><input id="nw_rut" style="width:100%;padding:12px;border:1px solid #d8e0e6;border-radius:9px"></div>
      <div><label>CORREO *</label><input id="nw_email" type="email" style="width:100%;padding:12px;border:1px solid #d8e0e6;border-radius:9px"></div>
      <div><label>CONTRASEÑA INICIAL *</label><input id="nw_password" type="password" style="width:100%;padding:12px;border:1px solid #d8e0e6;border-radius:9px"></div>
      <div><label>CARGO</label><input id="nw_job" style="width:100%;padding:12px;border:1px solid #d8e0e6;border-radius:9px"></div>
      <div><label>ÁREA / FAENA</label><input id="nw_area" style="width:100%;padding:12px;border:1px solid #d8e0e6;border-radius:9px"></div>
    </div>
    <div id="nw_msg" style="margin-top:12px"></div>
    <div style="display:flex;gap:10px;margin-top:15px">
      <button class="primary" onclick="createWorker()">CREAR CUENTA</button>
      <button class="secondary" onclick="adminWorkers()">CANCELAR</button>
    </div>
  </div></section>`,true,"workers");
}

async function createWorker(){
  const msg=$("#nw_msg");
  const payload={
    full_name:$("#nw_name").value.trim(), rut:$("#nw_rut").value.trim(),
    email:$("#nw_email").value.trim(), password:$("#nw_password").value,
    job_title:$("#nw_job").value.trim(), site_area:$("#nw_area").value.trim(),
    company:"STEEL INGENIERÍA"
  };
  if(!payload.full_name||!payload.email||!payload.password){
    msg.innerHTML='<div class="warning">Completa nombre, correo y contraseña.</div>'; return;
  }
  msg.innerHTML='<div class="warning">Creando cuenta...</div>';
  const {data,error}=await sb.functions.invoke("admin-create-worker",{body:payload});
  if(error||data?.error){
    msg.innerHTML=`<div class="warning"><b>Error:</b> ${esc(data?.error||error?.message||"No fue posible crear el trabajador.")}</div>`; return;
  }
  msg.innerHTML='<div class="success"><b>Cuenta creada correctamente.</b></div>';
  setTimeout(adminWorkers,700);
}

async function adminModules(){shell(`<section class="content"><h1>MÓDULOS</h1><div class="module-grid">${MODULES.map(m=>`<div class="module-card"><div class="module-visual module-${m.n}"><div class="module-no">${String(m.n).padStart(2,"0")}</div></div><div class="module-info"><h3>${esc(m.title)}</h3><p>${m.duration} min</p><span class="pill ok">PUBLICADO</span></div></div>`).join("")}</div></section>`,true,"modules")}
async function adminResults(){shell(`<section class="content"><div class="panel"><h1>RESULTADOS Y BRECHAS</h1><p>Notas, intentos y fallas críticas quedan almacenadas en Supabase.</p></div></section>`,true,"results")}
async function adminCertificates(){shell(`<section class="content"><div class="panel"><h1>CERTIFICADOS</h1><p>Vigencia de 1 año desde la emisión.</p></div></section>`,true,"certs")}

async function bootstrap(){
  if(!sb){landing();return}
  const {data:{session}}=await sb.auth.getSession();
  if(!session){landing();return}
  currentUser=session.user;
  const {data:profile}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
  if(!profile){landing();return}
  currentProfile=profile;
  roleHome();
}
bootstrap();


const MODULES = [
  {n:1,title:"CONOCE STEEL Y NUESTRA CULTURA HSE",duration:"10:46",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-01/modulo_01_lms_1080p.mp4",recapPdf:"assets/docs/modulo01_conoce_steel_cultura_hse.pdf"},
  {n:2,title:"REGLAS QUE NO SE NEGOCIAN",duration:"09:56",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-02/MODULO.2.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-02/MODULO.2.pdf"},
  {n:3,title:"ANTES DE HACER, PIENSA",duration:"09:14",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-03/MODULO.3.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-03/MODULO.3.pdf"},
  {n:4,title:"CONTROLES CRÍTICOS — EdC",duration:"10:23",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-04/MODULO.4.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-04/MODULO.4.pdf"},
  {n:5,title:"AGENTES PELIGROSOS",duration:"11:30",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-05/MODULO.5.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-05/MODULO.5.pdf"},
  {n:6,title:"EMERGENCIAS",duration:"10:19",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-06/MODULO.6.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-06/MODULO.6.pdf"},
  {n:7,title:"YO VEO · YO ACTÚO · YO REPORTO",duration:"12:29",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-07/MODULO.7.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-07/MODULO.7.pdf"},
  {n:8,title:"APTITUD PARA TRABAJAR",duration:"11:23",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-08/MODULO.8.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-08/MODULO.8.pdf"},
  {n:9,title:"VIVIR LA SEGURIDAD EN TERRENO",duration:"10:19",video:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-09/MODULO.9.mp4",recapPdf:"https://github.com/steelhseantucoya-lab/lms-hse-steel/releases/download/modulo-09/MODULO.9.pdf"},
  {n:10,title:"EVALUACIÓN FINAL HSE STEEL",duration:"",finalAssessment:true}
];

const moduleByNo = n => MODULES.find(m=>m.n===Number(n));
let sb=null,currentUser=null,currentProfile=null,currentModule=null,currentCertificate=null;
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
<button class="nav ${active==="home"?"active":""}" onclick="workerHome()">INICIO</button>
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
async function workerHome(){
  const {data:rows} = await sb
    .from("module_progress")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("module_no");

  const progress = rows || [];
  const completed = progress.filter(x => x.status === "approved").length;
  const percent = Math.round((completed / 10) * 100);

  shell(`
    <section class="hero">
      <div class="eyebrow">INDUCCIÓN HOMBRE NUEVO</div>

      <h1>BIENVENIDO, ${esc(currentProfile.full_name)}</h1>

      <p>
        Continúa tu proceso de inducción HSE.
        Tu avance y resultados quedan registrados automáticamente.
      </p>

      <div class="progress">
        <span style="width:${percent}%"></span>
      </div>

      <b>${completed}/10 MÓDULOS COMPLETADOS</b>
    </section>

    <section class="content">
      <div class="panel">
        <h2>ESTADO DE TU INDUCCIÓN</h2>

        <p>
          Has aprobado <b>${completed}</b> de 10 módulos.
        </p>

        <div class="action-row">
          <button class="primary" onclick="workerDashboard()">
            CONTINUAR MI RUTA HSE
          </button>

          <button class="secondary" onclick="workerProgress()">
            VER MI PROGRESO
          </button>
        </div>
      </div>
    </section>
  `, false, "home");
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
        <div class="module-icon">${["HSE","RC","PASO 0","EdC","GAS","SOS","VER","APTO","360°","FINAL"][m.n-1]}</div>
      </div>
      <div class="module-info">
        <h3>${esc(m.title)}</h3>
        <p>${m.finalAssessment?"EVALUACIÓN INTEGRADA":`${m.duration} min`}</p>
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
  if(n===10){renderFinalAssessmentIntro(p||{});return}
  renderModulePlayer(p||{});
}

function renderFinalAssessmentIntro(progress){
  const approved=progress.status==="approved";
  shell(`<section class="module-header">
    <div><div class="eyebrow">MÓDULO 10 · EVALUACIÓN FINAL</div><h1>EVALUACIÓN FINAL HSE STEEL</h1></div>
    <div class="duration">MÓDULOS 01 AL 09</div>
  </section>
  <section class="content"><div class="panel">
    <h2>${approved?"CURSO APROBADO":"DEMUESTRA LO APRENDIDO"}</h2>
    <p>Esta evaluación integra los contenidos de todos los módulos anteriores. Contiene <b>10 preguntas</b>: al menos una de cada Módulo 1 al 9 y una pregunta adicional.</p>
    <div style="margin:18px 0;padding:18px;border:1px solid #f36f21;border-radius:12px;background:#fff">
      <p><b>Exigencia de aprobación:</b> mínimo 80% y ninguna respuesta crítica incorrecta.</p>
      <p>Al aprobar, finalizarás el curso LMS HSE STEEL y se habilitará tu certificado.</p>
    </div>
    ${approved?'<div class="success">Evaluación final aprobada. Tu certificado está disponible.</div><button class="primary" onclick="workerCertificate()">VER CERTIFICADO</button>':'<button class="primary" onclick="loadAssessment()">COMENZAR EVALUACIÓN FINAL</button>'}
    <button class="secondary" onclick="workerDashboard()">← VOLVER A MI RUTA</button>
  </div></section>`,false,"route");
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
  v.addEventListener("error",()=>{
    console.error("Error de video:",v.error);
    missing.hidden=false;
    playBtn.disabled=true;
  });
  v.addEventListener("loadedmetadata",()=>{
    if(maxAllowed>0 && maxAllowed<v.duration) v.currentTime=Math.min(maxAllowed,v.duration);
    updateVideoUI();
  });
  v.addEventListener("ratechange",()=>{
    if(v.playbackRate!==1) v.playbackRate=1;
  });
  v.addEventListener("seeking",()=>{
    if(!alreadyCompleted && v.currentTime>maxAllowed+1.5) v.currentTime=maxAllowed;
  });
  v.addEventListener("timeupdate", async () => {
    if(alreadyCompleted || v.currentTime<=maxAllowed+1.5){
      if(v.currentTime>maxAllowed) maxAllowed=v.currentTime;
    }
  updateVideoUI();

  // Marca el video como completado al llegar prácticamente al final
  if (
    isFinite(v.duration) &&
    v.duration > 0 &&
    v.currentTime >= v.duration - 1
  ) {
    maxAllowed = v.duration;

    const { data, error } = await sb
      .from("module_progress")
      .update({
        max_video_seconds: Math.floor(v.duration),
        video_completed: true,
        status: "in_progress",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", currentUser.id)
      .eq("module_no", currentModule.n)
      .select();

    if (error) {
      console.error("ERROR AL COMPLETAR VIDEO:", error);
      alert("Error guardando finalización del video: " + error.message);
      return;
    }

    console.log("VIDEO COMPLETADO GUARDADO:", data);

    continueBtn.disabled = false;
    continueBtn.textContent = "CONTINUAR AL REPASO";
    return;
  }

  if(Math.floor(v.currentTime)-lastSave>=8){
    lastSave=Math.floor(v.currentTime);

    await sb.from("module_progress").update({
      max_video_seconds:Math.floor(maxAllowed),
      status:"in_progress",
      updated_at:new Date().toISOString()
    })
    .eq("user_id",currentUser.id)
    .eq("module_no",currentModule.n);
  }
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
  const recapMessages={
    1:"En STEEL vivimos una cultura preventiva basada en anticipar los riesgos, cumplir los controles, actuar a tiempo y cuidarnos entre todos.",
    2:"Las reglas que no se negocian protegen la vida y deben cumplirse siempre, sin excepciones ni atajos.",
    3:"Antes de comenzar una tarea, detente y piensa: identifica los peligros, evalúa los riesgos y confirma que los controles estén implementados y sean efectivos.",
    4:"Los controles críticos evitan consecuencias graves o fatales. Antes de ejecutar, verifica en terreno que cada control del EdC esté presente, implementado y sea efectivo.",
    5:"Reconoce los agentes peligrosos presentes en la tarea, conoce sus vías de exposición y aplica los controles definidos: monitoreo, segregación, ventilación, higiene y EPP adecuado.",
    6:"Ante una emergencia, protege primero tu integridad, reconoce los peligros, activa oportunamente el plan y comunica qué ocurrió, la ubicación exacta, las personas involucradas y los riesgos presentes. Evacúa por las rutas establecidas y dirígete al punto de encuentro.",
    7:"Observa activamente el entorno, identifica las desviaciones y actúa de manera segura. Si no puedes corregirlas, detén, segrega y comunica. Reporta hechos, ubicación, riesgo y acciones tomadas, y verifica el cierre con evidencia para evitar que el evento se repita.",
    8:"Estar apto para trabajar significa contar con condiciones físicas y mentales que permitan ejecutar la tarea de manera segura. Informa oportunamente la fatiga, somnolencia, malestar, alteraciones emocionales o medicamentos que puedan afectar tu desempeño; no conduzcas ni operes equipos hasta aplicar las medidas definidas.",
    9:"Vivir la seguridad en terreno exige disciplina operacional: respeta el plan de tránsito, confirma comunicación antes de acercarte a equipos, mantente fuera de los puntos ciegos, usa siempre el cinturón y detén la maniobra si se pierde el control. Retira herramientas defectuosas y aplica bloqueo y verificación de energía antes de intervenir."
  };
  const recapMessage=recapMessages[currentModule.n]||"Repasa los conceptos principales del módulo y verifica los controles antes de continuar.";

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

  <div style="margin:18px 0;padding:20px;border:1px solid #d8e0e6;border-radius:12px;background:#fff">
    <h3>MÓDULO ${String(currentModule.n).padStart(2,"0")} — ${esc(currentModule.title)}</h3>

    <p>${esc(recapMessage)}</p>

    <p><b>Recuerda:</b> ante una condición insegura, detén la tarea, comunica y restablece los controles antes de continuar.</p>
  </div>

  <div style="margin:18px 0;padding:20px;border:1px solid #f36f21;border-radius:12px;background:#fff">
    <h3>MATERIAL DE APOYO</h3>
    <p>Abre el PDF del Módulo ${String(currentModule.n).padStart(2,"0")} para reforzar el contenido.</p>

    ${pdf ? `<a class="primary"
       href="${esc(pdf)}"
       target="_blank"
       rel="noopener">
      ABRIR PDF DEL MÓDULO ${String(currentModule.n).padStart(2,"0")}
    </a>` : `<div class="warning">El PDF de repaso aún no está disponible.</div>`}
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
  shell(`<section class="hero"><div class="eyebrow">RESULTADO</div><h1>${r.passed?(currentModule.n===10?"CURSO LMS APROBADO":"MÓDULO APROBADO"):"REFUERZO REQUERIDO"}</h1><p>Nota: <b>${r.score}%</b> · Fallas críticas: <b>${r.critical_failures||0}</b> · Intento: <b>${r.attempts||1}</b></p></section>
  <section class="content"><button class="primary" onclick="workerDashboard()">VOLVER A MI RUTA HSE</button></section>`,false,"route");
}

async function workerProgress(){workerDashboard()}
function formatCertificateDate(value){
  if(!value)return "—";
  const [y,m,d]=String(value).slice(0,10).split("-");
  return `${d}-${m}-${y}`;
}
async function workerCertificate(){
  shell(`<section class="content"><div class="panel"><h2>CERTIFICADO</h2><p>Cargando certificado...</p></div></section>`,false,"cert");
  const {data:cert,error}=await sb.from("certificates").select("*")
    .eq("user_id",currentUser.id).eq("status","valid")
    .order("issued_at",{ascending:false}).limit(1).maybeSingle();
  if(error){
    shell(`<section class="content"><div class="panel"><h2>CERTIFICADO</h2><div class="warning">No fue posible consultar el certificado: ${esc(error.message)}</div></div></section>`,false,"cert");
    return;
  }
  if(!cert){
    shell(`<section class="content"><div class="panel"><h2>CERTIFICADO</h2><div class="warning">Aún no existe un certificado vigente. Verifica que los 10 módulos estén aprobados.</div></div></section>`,false,"cert");
    return;
  }
  currentCertificate=cert;
  shell(`<section class="content">
    <div class="certificate-preview">
      <div class="certificate-border">
        <div class="certificate-brand">STEEL <span>HSE LMS</span></div>
        <div class="certificate-kicker">CERTIFICADO DE APROBACIÓN</div>
        <h1>INDUCCIÓN HOMBRE NUEVO</h1>
        <p>STEEL INGENIERÍA certifica que</p>
        <h2>${esc(currentProfile.full_name||"")}</h2>
        <p class="certificate-rut">RUT: ${esc(currentProfile.rut||"—")}</p>
        <p>ha aprobado satisfactoriamente los 10 módulos y la evaluación final del curso LMS HSE STEEL.</p>
        <div class="certificate-data">
          <div><b>EMISIÓN</b><span>${formatCertificateDate(cert.issued_at)}</span></div>
          <div><b>VIGENCIA</b><span>${formatCertificateDate(cert.expires_at)}</span></div>
          <div><b>CÓDIGO</b><span>${esc(cert.certificate_code)}</span></div>
        </div>
        <div class="certificate-footer">STEEL INGENIERÍA · ANTUCOYA · ${esc(cert.lms_version||"LMS HSE")}</div>
      </div>
    </div>
    <div class="action-row" style="margin-top:18px">
      <button class="primary" onclick="downloadCertificatePdf()">DESCARGAR CERTIFICADO EN PDF</button>
      <button class="secondary" onclick="workerDashboard()">VOLVER A MI RUTA</button>
    </div>
  </section>`,false,"cert");
}
function downloadCertificatePdf(){
  if(!currentCertificate){alert("Primero debes cargar el certificado.");return}
  if(!window.jspdf?.jsPDF){alert("No fue posible cargar el generador PDF. Recarga la página e intenta nuevamente.");return}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  const w=297,h=210;
  doc.setFillColor(247,250,252);doc.rect(0,0,w,h,"F");
  doc.setDrawColor(8,31,43);doc.setLineWidth(3);doc.rect(8,8,w-16,h-16);
  doc.setDrawColor(243,111,33);doc.setLineWidth(1);doc.rect(13,13,w-26,h-26);
  doc.setFillColor(8,31,43);doc.rect(18,18,w-36,30,"F");
  doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(24);
  doc.text("STEEL",25,37);
  doc.setTextColor(243,111,33);doc.text("HSE LMS",62,37);
  doc.setTextColor(8,31,43);doc.setFontSize(13);doc.text("CERTIFICADO DE APROBACIÓN",w/2,66,{align:"center"});
  doc.setFontSize(25);doc.text("INDUCCIÓN HOMBRE NUEVO",w/2,82,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(12);doc.text("STEEL INGENIERÍA certifica que",w/2,98,{align:"center"});
  doc.setFont("helvetica","bold");doc.setFontSize(22);doc.setTextColor(243,111,33);
  doc.text(String(currentProfile.full_name||"").toUpperCase(),w/2,116,{align:"center"});
  doc.setTextColor(8,31,43);doc.setFont("helvetica","normal");doc.setFontSize(11);
  doc.text(`RUT: ${currentProfile.rut||"—"}`,w/2,126,{align:"center"});
  doc.text("ha aprobado satisfactoriamente los 10 módulos y la evaluación final del curso LMS HSE STEEL.",w/2,140,{align:"center"});
  doc.setFontSize(10);
  doc.text(`Emisión: ${formatCertificateDate(currentCertificate.issued_at)}`,35,160);
  doc.text(`Vigencia: ${formatCertificateDate(currentCertificate.expires_at)}`,w/2,160,{align:"center"});
  doc.text(`Código: ${currentCertificate.certificate_code}`,w-35,160,{align:"right"});
  doc.setDrawColor(8,31,43);doc.line(105,178,192,178);
  doc.setFont("helvetica","bold");doc.text("STEEL INGENIERÍA · HSE",w/2,184,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(`ANTUCOYA · ${currentCertificate.lms_version||"LMS HSE"}`,w/2,190,{align:"center"});
  const safeName=String(currentProfile.full_name||"trabajador").replace(/[^a-zA-Z0-9]+/g,"_");
  doc.save(`Certificado_LMS_HSE_STEEL_${safeName}.pdf`);
}

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

async function adminModules(){shell(`<section class="content"><h1>MÓDULOS</h1><div class="module-grid">${MODULES.map(m=>`<div class="module-card"><div class="module-visual module-${m.n}"><div class="module-no">${String(m.n).padStart(2,"0")}</div></div><div class="module-info"><h3>${esc(m.title)}</h3><p>${m.finalAssessment?"EVALUACIÓN INTEGRADA":`${m.duration} min`}</p><span class="pill ok">PUBLICADO</span></div></div>`).join("")}</div></section>`,true,"modules")}
async function adminResults(){
  shell(`<section class="content"><div class="panel"><h1>RESULTADOS Y BRECHAS</h1><p>Cargando resultados...</p></div></section>`,true,"results");
  const [{data:workers,error:workersError},{data:progress,error:progressError}]=await Promise.all([
    sb.from("profiles").select("id,full_name,rut,email,job_title,site_area").eq("role","worker").order("full_name"),
    sb.from("module_progress").select("user_id,module_no,status,score,attempts,critical_failures,approved_at").order("module_no")
  ]);
  const error=workersError||progressError;
  if(error){
    shell(`<section class="content"><div class="panel"><h1>RESULTADOS Y BRECHAS</h1><div class="warning">No fue posible cargar los resultados: ${esc(error.message)}</div></div></section>`,true,"results");
    return;
  }
  const rows=(workers||[]).map(w=>{
    const mods=(progress||[]).filter(p=>p.user_id===w.id);
    const approved=mods.filter(p=>p.status==="approved");
    const scored=mods.filter(p=>p.score!=null);
    const average=scored.length?Math.round(scored.reduce((sum,p)=>sum+Number(p.score||0),0)/scored.length):0;
    const attempts=mods.reduce((sum,p)=>sum+Number(p.attempts||0),0);
    const critical=mods.reduce((sum,p)=>sum+Number(p.critical_failures||0),0);
    const final=mods.find(p=>p.module_no===10);
    const courseApproved=approved.length===10;
    return {w,mods,approved:approved.length,average,attempts,critical,final,courseApproved};
  });
  const approvedCourses=rows.filter(r=>r.courseApproved).length;
  shell(`<section class="content">
    <div class="section-title"><div class="eyebrow">SEGUIMIENTO EN TIEMPO REAL</div><h1>RESULTADOS Y BRECHAS</h1><p style="color:#66737d">Resultados registrados en los 10 módulos del curso.</p></div>
    <div class="kpi-grid" style="margin:18px 0">
      <div><span>TRABAJADORES</span><b>${rows.length}</b></div>
      <div><span>CURSOS APROBADOS</span><b>${approvedCourses}</b></div>
      <div><span>EN PROCESO</span><b>${rows.length-approvedCourses}</b></div>
      <div><span>CERTIFICABLES</span><b>${approvedCourses}</b></div>
    </div>
    <div class="panel" style="overflow-x:auto"><table>
      <thead><tr><th>TRABAJADOR</th><th>RUT</th><th>AVANCE</th><th>PROMEDIO</th><th>EVALUACIÓN FINAL</th><th>INTENTOS</th><th>FALLAS CRÍTICAS</th><th>ESTADO</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td><b>${esc(r.w.full_name||"—")}</b><br><span style="color:#66737d;font-size:12px">${esc(r.w.email||"")}</span></td>
        <td>${esc(r.w.rut||"—")}</td>
        <td><b>${r.approved}/10</b></td>
        <td>${r.average}%</td>
        <td>${r.final?.score!=null?`${r.final.score}%`:"—"}</td>
        <td>${r.attempts}</td>
        <td>${r.critical}</td>
        <td><span class="pill ${r.courseApproved?"ok":""}">${r.courseApproved?"CURSO APROBADO":r.approved?"EN PROCESO":"SIN INICIAR"}</span></td>
      </tr>`).join("")}</tbody>
    </table></div>
    <div style="margin-top:18px">
      ${rows.map(r=>`<details class="panel" style="margin-bottom:10px">
        <summary style="cursor:pointer;font-weight:800">${esc(r.w.full_name||"TRABAJADOR")} · DETALLE POR MÓDULO</summary>
        <div style="overflow-x:auto;margin-top:12px"><table><thead><tr><th>MÓDULO</th><th>ESTADO</th><th>NOTA</th><th>INTENTOS</th><th>FALLAS CRÍTICAS</th><th>APROBACIÓN</th></tr></thead>
        <tbody>${Array.from({length:10},(_,i)=>{
          const p=r.mods.find(x=>x.module_no===i+1);
          return `<tr><td>${String(i+1).padStart(2,"0")}</td><td>${p?.status==="approved"?"APROBADO":p?.status==="in_progress"?"EN PROCESO":"NO INICIADO"}</td><td>${p?.score!=null?p.score+"%":"—"}</td><td>${p?.attempts||0}</td><td>${p?.critical_failures||0}</td><td>${p?.approved_at?new Date(p.approved_at).toLocaleDateString("es-CL"):"—"}</td></tr>`;
        }).join("")}</tbody></table></div>
      </details>`).join("")}
    </div>
  </section>`,true,"results");
}
async function adminCertificates(){
  shell(`<section class="content"><div class="panel"><h1>CERTIFICADOS</h1><p>Cargando certificados...</p></div></section>`,true,"certs");
  const [{data:certs,error:certError},{data:workers,error:workerError}]=await Promise.all([
    sb.from("certificates").select("*").order("issued_at",{ascending:false}),
    sb.from("profiles").select("id,full_name,rut,email,job_title,site_area").eq("role","worker")
  ]);
  const error=certError||workerError;
  if(error){
    shell(`<section class="content"><div class="panel"><h1>CERTIFICADOS</h1><div class="warning">No fue posible cargar los certificados: ${esc(error.message)}</div></div></section>`,true,"certs");
    return;
  }
  const rows=(certs||[]).map(cert=>({cert,worker:(workers||[]).find(w=>w.id===cert.user_id)}));
  shell(`<section class="content">
    <div class="section-title"><div class="eyebrow">CONTROL DOCUMENTAL</div><h1>CERTIFICADOS</h1><p style="color:#66737d">Vigencia de 1 año desde la fecha de emisión.</p></div>
    <div class="kpi-grid" style="margin:18px 0">
      <div><span>EMITIDOS</span><b>${rows.length}</b></div>
      <div><span>VIGENTES</span><b>${rows.filter(r=>r.cert.status==="valid").length}</b></div>
      <div><span>VENCIDOS / ANULADOS</span><b>${rows.filter(r=>r.cert.status!=="valid").length}</b></div>
      <div><span>TRABAJADORES CERTIFICADOS</span><b>${new Set(rows.map(r=>r.cert.user_id)).size}</b></div>
    </div>
    <div class="panel" style="overflow-x:auto">
      ${rows.length?`<table><thead><tr><th>TRABAJADOR</th><th>RUT</th><th>CÓDIGO</th><th>EMISIÓN</th><th>VIGENCIA</th><th>VERSIÓN</th><th>ESTADO</th><th>ACCIÓN</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td><b>${esc(r.worker?.full_name||"—")}</b><br><span style="color:#66737d;font-size:12px">${esc(r.worker?.email||"")}</span></td>
        <td>${esc(r.worker?.rut||"—")}</td><td><b>${esc(r.cert.certificate_code||"—")}</b></td>
        <td>${formatCertificateDate(r.cert.issued_at)}</td><td>${formatCertificateDate(r.cert.expires_at)}</td>
        <td>${esc(r.cert.lms_version||"—")}</td><td><span class="pill ${r.cert.status==="valid"?"ok":""}">${r.cert.status==="valid"?"VIGENTE":esc(r.cert.status||"—").toUpperCase()}</span></td>
        <td><button class="secondary" onclick="downloadAdminCertificate('${r.cert.id}')">DESCARGAR PDF</button></td>
      </tr>`).join("")}</tbody></table>`:'<div class="warning">Todavía no existen certificados emitidos.</div>'}
    </div>
  </section>`,true,"certs");
}
async function downloadAdminCertificate(certificateId){
  const [{data:cert,error:certError},{data:workers,error:workersError}]=await Promise.all([
    sb.from("certificates").select("*").eq("id",certificateId).single(),
    sb.from("profiles").select("id,full_name,rut").eq("role","worker")
  ]);
  if(certError||workersError||!cert){alert(certError?.message||workersError?.message||"No fue posible cargar el certificado.");return}
  const worker=(workers||[]).find(w=>w.id===cert.user_id);
  if(!worker){alert("No se encontró el trabajador asociado.");return}
  if(!window.jspdf?.jsPDF){alert("No fue posible cargar el generador PDF. Recarga la página.");return}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  const w=297,h=210;
  doc.setFillColor(247,250,252);doc.rect(0,0,w,h,"F");
  doc.setDrawColor(8,31,43);doc.setLineWidth(3);doc.rect(8,8,w-16,h-16);
  doc.setDrawColor(243,111,33);doc.setLineWidth(1);doc.rect(13,13,w-26,h-26);
  doc.setFillColor(8,31,43);doc.rect(18,18,w-36,30,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(24);doc.setTextColor(255,255,255);doc.text("STEEL",25,37);
  doc.setTextColor(243,111,33);doc.text("HSE LMS",62,37);
  doc.setTextColor(8,31,43);doc.setFontSize(13);doc.text("CERTIFICADO DE APROBACIÓN",w/2,66,{align:"center"});
  doc.setFontSize(25);doc.text("INDUCCIÓN HOMBRE NUEVO",w/2,82,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(12);doc.text("STEEL INGENIERÍA certifica que",w/2,98,{align:"center"});
  doc.setFont("helvetica","bold");doc.setFontSize(22);doc.setTextColor(243,111,33);doc.text(String(worker.full_name||"").toUpperCase(),w/2,116,{align:"center"});
  doc.setTextColor(8,31,43);doc.setFont("helvetica","normal");doc.setFontSize(11);doc.text(`RUT: ${worker.rut||"—"}`,w/2,126,{align:"center"});
  doc.text("ha aprobado satisfactoriamente los 10 módulos y la evaluación final del curso LMS HSE STEEL.",w/2,140,{align:"center"});
  doc.setFontSize(10);doc.text(`Emisión: ${formatCertificateDate(cert.issued_at)}`,35,160);
  doc.text(`Vigencia: ${formatCertificateDate(cert.expires_at)}`,w/2,160,{align:"center"});
  doc.text(`Código: ${cert.certificate_code}`,w-35,160,{align:"right"});
  doc.setDrawColor(8,31,43);doc.line(105,178,192,178);doc.setFont("helvetica","bold");doc.text("STEEL INGENIERÍA · HSE",w/2,184,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(`ANTUCOYA · ${cert.lms_version||"LMS HSE"}`,w/2,190,{align:"center"});
  const safeName=String(worker.full_name||"trabajador").replace(/[^a-zA-Z0-9]+/g,"_");
  doc.save(`Certificado_LMS_HSE_STEEL_${safeName}.pdf`);
}

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


const MODULES=[
  "CONOCE STEEL Y NUESTRA CULTURA HSE",
  "REGLAS QUE NO SE NEGOCIAN",
  "ANTES DE HACER, PIENSA",
  "CONTROLES CRÍTICOS — EdC APLICABLES",
  "AGENTES PELIGROSOS Y EXPOSICIÓN",
  "EMERGENCIAS — ACTÚA, NO OBSERVES",
  "YO VEO · YO ACTÚO · YO REPORTO",
  "APTITUD PARA TRABAJAR",
  "VIVIR LA SEGURIDAD EN TERRENO",
  "DESAFÍO FINAL HSE STEEL"
];

const MODULE_CASES={
  1:{title:"CAMBIO DE CONDICIONES",text:"La tarea estaba planificada, pero al llegar al punto de trabajo observas que las condiciones cambiaron y uno de los controles definidos ya no puede implementarse.",options:[["Continuar porque la tarea ya estaba planificada.",false],["Detener, comunicar el cambio, reevaluar el riesgo y asegurar controles antes de continuar.",true],["Ejecutar solo la parte más rápida.",false]]},
  2:{title:"REGLA CARDINAL",text:"Para terminar una tarea a tiempo, un compañero propone puentear temporalmente un sistema de seguridad.",options:[["Aceptar si es por pocos minutos.",false],["Detener y corregir la condición sin anular la protección.",true],["Continuar si el supervisor está cerca.",false]]},
  3:{title:"TRABAJO NO PLANIFICADO",text:"Aparece una tarea adicional que no está incluida en la ARTP vigente.",options:[["Hacerla porque es corta.",false],["Aplicar ART para evaluar el trabajo no planificado antes de comenzar.",true],["Agregarla verbalmente y seguir.",false]]},
  4:{title:"FALLA DE CONTROL CRÍTICO",text:"Un control crítico definido para la tarea está degradado y no entrega la protección esperada.",options:[["Continuar con mayor atención.",false],["Detener hasta restablecer un control efectivo.",true],["Reducir el tiempo de exposición.",false]]},
  5:{title:"ALARMA DE GAS",text:"Mientras trabajas fuera de cabina, tu detector personal activa una alarma.",options:[["Silenciarlo y terminar la tarea.",false],["Retirarte según el plan, informar y seguir instrucciones.",true],["Dejar el detector en la cabina y continuar.",false]]},
  6:{title:"EMERGENCIA",text:"Se declara una emergencia y observas una zona con peligro activo donde podría haber una persona involucrada.",options:[["Ingresar inmediatamente para ayudar.",false],["Protegerte, activar la respuesta y no ingresar sin condiciones seguras.",true],["Esperar sin comunicar.",false]]},
  7:{title:"DESVIACIÓN EN TERRENO",text:"Detectas una condición insegura que puedes corregir sin exponerte.",options:[["Pasar de largo.",false],["Actuar de forma segura y reportar la desviación.",true],["Esperar al final del turno.",false]]},
  8:{title:"FATIGA",text:"Antes de conducir sientes somnolencia y dificultad para concentrarte.",options:[["Tomar café y conducir más lento.",false],["Reportar la condición y aplicar las medidas definidas antes de conducir.",true],["Abrir la ventana y continuar.",false]]},
  9:{title:"PLAN DE TRÁNSITO",text:"Necesitas ingresar a un sector con movimiento de camiones tolva y equipos pesados.",options:[["Ingresar detrás de otro vehículo.",false],["Solicitar autorización y confirmar la coordinación antes de ingresar.",true],["Tocar bocina e ingresar.",false]]},
  10:{title:"DESAFÍO INTEGRADO",text:"Durante una tarea cambian las condiciones, falta un control crítico y además un trabajador propone continuar para no atrasarse.",options:[["Continuar y reportar después.",false],["Detener, reevaluar, restablecer controles y recién después continuar.",true],["Reducir la duración de la tarea.",false]]}
};

let sb=null,currentUser=null,currentProfile=null;
const cfg=window.STEEL_LMS_CONFIG||{};
const configured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.startsWith("REEMPLAZAR");
if(configured) sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);

const $=s=>document.querySelector(s);
const root=html=>document.getElementById("app").innerHTML=html;
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function landing(){
  root(`<div class="landing"><div class="landing-box">
    <div class="brand"><span>STEEL</span> HSE LMS</div>
    <h1>INDUCCIÓN HOMBRE NUEVO</h1>
    <p>HOJA DE RUTA → LMS EDUCATIVO → LIBRO EDUCATIVO → TERRENO</p>
    <div class="roles">
      <div class="role"><h2>TRABAJADOR</h2><p>Ruta HSE, módulos audiovisuales, evaluaciones, progreso y certificado.</p><button class="btn" onclick="loginScreen('worker')">INGRESAR COMO TRABAJADOR</button></div>
      <div class="role"><h2>ADMINISTRADOR HSE</h2><p>Trabajadores, avances, brechas, vigencias, certificados y contenidos.</p><button class="btn" onclick="loginScreen('admin')">INGRESAR COMO ADMINISTRADOR HSE</button></div>
    </div>
  </div></div>`);
}

function loginScreen(expectedRole){
  root(`<div class="landing"><div class="login">
    <div class="orange"><b>${expectedRole==="admin"?"ADMINISTRADOR HSE":"TRABAJADOR"}</b></div>
    <h2>Iniciar sesión</h2>
    <div class="field"><label>CORREO</label><input id="email" type="email" autocomplete="username"></div>
    <div class="field"><label>CONTRASEÑA</label><input id="pass" type="password" autocomplete="current-password"></div>
    <div id="msg" class="mut" style="min-height:22px"></div>
    <button class="btn" onclick="signIn('${expectedRole}')">INICIAR SESIÓN</button>
    <button class="btn out" onclick="landing()">VOLVER</button>
  </div></div>`);
}

async function signIn(expectedRole){
  $("#msg").textContent="Validando...";
  const {data,error}=await sb.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#pass").value});
  if(error){$("#msg").textContent=error.message;return}
  currentUser=data.user;
  const {data:profile,error:pe}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
  if(pe||!profile){await sb.auth.signOut();$("#msg").textContent="Perfil no configurado.";return}
  if(profile.role!==expectedRole){await sb.auth.signOut();$("#msg").textContent="Esta cuenta no corresponde al tipo de acceso seleccionado.";return}
  currentProfile=profile;
  expectedRole==="admin"?adminDashboard():workerDashboard();
}
async function signOut(){stopNarration();if(sb)await sb.auth.signOut();currentUser=null;currentProfile=null;landing()}

function shell(content,admin=false,active="dashboard"){
  const adminNav=`
    <button class="nav ${active==="dashboard"?"on":""}" onclick="adminDashboard()">RESUMEN HSE</button>
    <button class="nav ${active==="workers"?"on":""}" onclick="adminWorkers()">TRABAJADORES</button>
    <button class="nav ${active==="modules"?"on":""}" onclick="adminModules()">MÓDULOS</button>
    <button class="nav ${active==="questions"?"on":""}" onclick="adminQuestions()">BANCO DE PREGUNTAS</button>
    <button class="nav ${active==="results"?"on":""}" onclick="adminResults()">RESULTADOS Y BRECHAS</button>
    <button class="nav ${active==="expirations"?"on":""}" onclick="adminExpirations()">VIGENCIAS</button>
    <button class="nav ${active==="certificates"?"on":""}" onclick="adminCertificates()">CERTIFICADOS</button>`;
  const workerNav=`
    <button class="nav on" onclick="workerDashboard()">INICIO</button>
    <button class="nav">MI PERFIL</button>
    <button class="nav" onclick="workerDashboard()">MI RUTA HSE</button>
    <button class="nav">PROGRESO</button>
    <button class="nav">CERTIFICADO</button>`;
  root(`<div class="shell"><aside class="side">
    <h2><span class="orange">STEEL</span> HSE LMS</h2>
    <p style="font-size:11px;color:#aebbc4">INDUCCIÓN HOMBRE NUEVO</p>
    ${admin?adminNav:workerNav}
    <button class="nav" onclick="signOut()">CERRAR SESIÓN</button>
  </aside><main class="main"><header class="top">
    <b>HSE LMS · PRODUCCIÓN</b>
    <div><b>${esc(currentProfile?.full_name||"")}</b><div class="mut" style="font-size:12px">${esc(currentProfile?.role||"")}</div></div>
  </header>${content}</main></div>`);
}

async function workerDashboard(){
  stopNarration();
  const [{data:rows},{data:meta}]=await Promise.all([
    sb.from("module_progress").select("*").eq("user_id",currentUser.id).order("module_no"),
    sb.from("lms_modules").select("*").eq("published",true).order("module_no")
  ]);
  const progress=rows||[], modules=meta||[];
  const completed=progress.filter(x=>x.status==="approved").length;
  const cards=MODULES.map((name,i)=>{
    const n=i+1,r=progress.find(x=>x.module_no===n),m=modules.find(x=>x.module_no===n);
    const done=r?.status==="approved";
    const unlocked=n===1||progress.some(x=>x.module_no===n-1&&x.status==="approved");
    return `<div class="module ${unlocked?"":"lock"}" ${unlocked?`onclick="openWorkerModule(${n})"`:""} style="${unlocked?"cursor:pointer":""}">
      <div class="module-top module-art art-${n}">
        <div class="mod-num">M${String(n).padStart(2,"0")}</div>
        <div class="mod-symbol">${moduleSymbol(n)}</div>
      </div>
      <div class="module-body">
        <h3>${name}</h3>
        <div class="mut">${m?.duration_minutes||15} min aprox.</div>
        <span class="badge ${done?"ok":""}">${done?"APROBADO":unlocked?"DISPONIBLE":"BLOQUEADO"}</span>
        ${r?.score!=null?` <b>${r.score}%</b>`:""}
        ${unlocked?'<div class="open-module">ABRIR MÓDULO →</div>':""}
      </div>
    </div>`;
  }).join("");
  shell(`<div class="page">
    <section class="hero"><div class="orange"><b>INDUCCIÓN HOMBRE NUEVO</b></div>
      <h1>BIENVENIDO, ${esc(currentProfile.full_name)}</h1>
      <p>Tu avance se registra en Supabase y queda asociado a tu cuenta personal.</p>
      <div style="max-width:500px"><div class="progress"><span style="width:${completed*10}%"></span></div><p><b>${completed}/10 módulos completados</b></p></div>
    </section>
    <h2>Tu ruta de aprendizaje</h2><div class="modules">${cards}</div>
  </div>`,false);
}

function moduleSymbol(n){
  const syms=["HSE","RC","ARTP","EdC","GAS","SOS","VER","APTO","360°","FINAL"];
  return syms[n-1];
}

let course={moduleNo:0,module:null,scenes:[],sceneIndex:0,phase:"objective",assessment:null,startedAt:null,speaking:false};

function stopNarration(){try{speechSynthesis.cancel()}catch(e){} course.speaking=false}
function narrate(text,onEnd){
  stopNarration();
  if(!("speechSynthesis" in window)){setTimeout(()=>onEnd&&onEnd(),1200);return}
  const u=new SpeechSynthesisUtterance(text);u.lang="es-CL";u.rate=.90;u.pitch=1;
  course.speaking=true;document.body.classList.add("avatar-speaking");
  const done=()=>{if(!course.speaking)return;course.speaking=false;document.body.classList.remove("avatar-speaking");onEnd&&onEnd()};
  u.onend=done;u.onerror=done;speechSynthesis.speak(u);
}

async function openWorkerModule(n){
  stopNarration();
  const prevOk=n===1||await isModuleApproved(n-1);
  if(!prevOk){alert("Debes aprobar el módulo anterior.");return}
  const [{data:m,error:me},{data:scenes,error:se},{data:p,error:pe}]=await Promise.all([
    sb.from("lms_modules").select("*").eq("module_no",n).eq("published",true).single(),
    sb.from("module_scenes").select("*").eq("module_no",n).eq("published",true).order("scene_no"),
    sb.from("module_progress").select("*").eq("user_id",currentUser.id).eq("module_no",n).single()
  ]);
  if(me||se||pe){console.error(me||se||pe);alert("No fue posible cargar el módulo.");return}
  course={moduleNo:n,module:m,scenes:scenes||[],sceneIndex:0,phase:"objective",assessment:null,startedAt:null,speaking:false};
  if(p?.status==="approved")course.phase="approved";
  else if(p?.case_completed)course.phase="assessment_ready";
  else if(p?.recap_completed)course.phase="case";
  else if(p?.video_completed)course.phase="recap";
  renderCourse();
}
async function isModuleApproved(n){
  const {data}=await sb.from("module_progress").select("status").eq("user_id",currentUser.id).eq("module_no",n).single();
  return data?.status==="approved";
}

function renderCourse(){
  stopNarration();
  let body="";
  if(course.phase==="objective")body=objectiveView();
  if(course.phase==="video")body=videoView();
  if(course.phase==="recap")body=recapView();
  if(course.phase==="case")body=caseView();
  if(course.phase==="assessment_ready")body=assessmentReadyView();
  if(course.phase==="assessment")body=assessmentView();
  if(course.phase==="approved")body=approvedView();
  shell(`<div class="page course-page">
    <button class="btn out" onclick="workerDashboard()">← VOLVER A MI RUTA</button>
    <div class="course-header"><div><span class="orange">MÓDULO ${String(course.moduleNo).padStart(2,"0")}</span><h1>${esc(course.module.title)}</h1><p>${esc(course.module.objective)}</p></div><div class="course-meta">${course.module.duration_minutes} MIN · ${esc(course.module.version)}</div></div>
    ${body}
  </div>`,false);
  if(course.phase==="video")setTimeout(playScene,300);
}

function objectiveView(){
  return `<div class="stage-card"><div class="phase-kicker">OBJETIVO</div><h2>Lo que aprenderás</h2><p class="big-copy">${esc(course.module.objective)}</p>
    <div class="flow-strip"><span>VIDEO AUDIOVISUAL</span><span>REPASO</span><span>CASO DE TERRENO</span><span>EVALUACIÓN</span></div>
    <button class="btn big-btn" onclick="startVideo()">COMENZAR MÓDULO</button></div>`;
}
function startVideo(){course.sceneIndex=0;course.phase="video";renderCourse()}

function presenterSvg(){
 return `<svg class="presenter-svg" viewBox="0 0 330 430" aria-label="Relator STEEL">
 <defs><linearGradient id="vest" x1="0" x2="1"><stop offset="0" stop-color="#f36f21"/><stop offset="1" stop-color="#ff8b39"/></linearGradient></defs>
 <circle cx="165" cy="115" r="68" fill="#d7a078"/><path d="M95 108c12-70 129-86 144 0" fill="#f4f4f4"/><rect x="112" y="55" width="106" height="22" rx="8" fill="#fff"/><text x="165" y="72" text-anchor="middle" font-weight="900" font-size="18" fill="#111">steel</text>
 <rect x="115" y="118" width="100" height="9" rx="5" fill="#24292d"/><circle cx="142" cy="126" r="4" fill="#111"/><circle cx="188" cy="126" r="4" fill="#111"/>
 <path class="avatar-mouth" d="M145 155 Q165 168 185 155" stroke="#5f2e25" stroke-width="6" fill="none" stroke-linecap="round"/>
 <path d="M83 235 Q165 185 247 235 L275 425 H55Z" fill="url(#vest)"/><path d="M112 223 L142 425 H78L58 260Z" fill="#222c34"/><path d="M218 223 L188 425 H252L272 260Z" fill="#222c34"/>
 <path d="M96 244 L234 244" stroke="#e8edf0" stroke-width="15"/><path d="M82 305 L250 305" stroke="#e8edf0" stroke-width="12"/>
 <rect x="137" y="264" width="66" height="28" rx="6" fill="#0b1116"/><text x="170" y="284" text-anchor="middle" fill="#fff" font-size="16" font-weight="900">steel</text>
 </svg>`;
}

function videoView(){
  const s=course.scenes[course.sceneIndex], total=course.scenes.length, pct=Math.round((course.sceneIndex/Math.max(total,1))*100);
  return `<div class="video-frame">
    <div class="video-top"><div><b>M${String(course.moduleNo).padStart(2,"0")} · ${esc(course.module.title)}</b></div><div>ESCENA ${course.sceneIndex+1}/${total}</div></div>
    <div class="video-stage art-${course.moduleNo}">
      <div class="presenter-wrap">${presenterSvg()}<div class="presenter-name">RELATOR HSE STEEL</div></div>
      <div class="scene-copy">
        <div class="phase-kicker">ENSEÑANZA AUDIOVISUAL</div>
        <h2>${esc(s?.title||"")}</h2>
        <div class="visual-callout">${esc(s?.visual_text||"")}</div>
        <div class="subtitles">${esc(s?.narration||"")}</div>
      </div>
    </div>
    <div class="video-controls">
      <div class="video-progress"><span style="width:${pct}%"></span></div>
      <div class="control-row"><div><b>NARRACIÓN AUTOMÁTICA</b> · velocidad 1× · <b>NO PUEDES ADELANTAR</b></div><button class="btn alt" onclick="replayScene()">REPETIR EXPLICACIÓN</button></div>
    </div>
  </div>`;
}

function playScene(){
  if(course.phase!=="video")return;
  const s=course.scenes[course.sceneIndex]; if(!s)return;
  narrate(s.narration||"",async()=>{
    if(course.phase!=="video")return;
    await new Promise(r=>setTimeout(r,700));
    if(course.sceneIndex<course.scenes.length-1){course.sceneIndex++;renderCourse()}
    else await finishVideo();
  });
}
function replayScene(){stopNarration();setTimeout(playScene,150)}
async function finishVideo(){
  const {error}=await sb.from("module_progress").update({video_completed:true,status:"in_progress",updated_at:new Date().toISOString()}).eq("user_id",currentUser.id).eq("module_no",course.moduleNo);
  if(error){alert(error.message);return}
  course.phase="recap";renderCourse();
}

function recapView(){
  const items=course.scenes.slice(0,Math.min(6,course.scenes.length)).map(s=>`<div class="recap-item"><b>${esc(s.title)}</b><span>${esc(s.visual_text)}</span></div>`).join("");
  return `<div class="stage-card"><div class="phase-kicker">REPASO VISUAL</div><h2>Lo esencial antes de continuar</h2><div class="recap-grid">${items}</div><button class="btn big-btn" onclick="completeRecap()">CONTINUAR AL CASO DE TERRENO</button></div>`;
}
async function completeRecap(){
  const {error}=await sb.from("module_progress").update({recap_completed:true,updated_at:new Date().toISOString()}).eq("user_id",currentUser.id).eq("module_no",course.moduleNo);
  if(error){alert(error.message);return}
  course.phase="case";renderCourse();
}

function caseView(){
  const c=MODULE_CASES[course.moduleNo];
  return `<div class="stage-card"><div class="phase-kicker">CASO DE TERRENO</div><h2>${esc(c.title)}</h2><p class="big-copy">${esc(c.text)}</p>
    <div class="case-options">${c.options.map((o,i)=>`<button class="case-btn" onclick="answerCase(${o[1]},${i})">${String.fromCharCode(65+i)}) ${esc(o[0])}</button>`).join("")}</div><div id="case_feedback"></div></div>`;
}
async function answerCase(ok){
  const el=$("#case_feedback");
  if(!ok){el.innerHTML='<div class="notice"><b>Respuesta incorrecta.</b> Revisa el principio preventivo del módulo e inténtalo nuevamente.</div>';return}
  el.innerHTML='<div class="notice"><b>Correcto.</b> La decisión controla el riesgo antes de continuar.</div>';
  const {error}=await sb.from("module_progress").update({case_completed:true,updated_at:new Date().toISOString()}).eq("user_id",currentUser.id).eq("module_no",course.moduleNo);
  if(error){alert(error.message);return}
  setTimeout(()=>{course.phase="assessment_ready";renderCourse()},800);
}

function assessmentReadyView(){
  const count=course.moduleNo===10?10:5;
  return `<div class="stage-card"><div class="phase-kicker">EVALUACIÓN</div><h2>${count} preguntas aleatorias</h2><p class="big-copy">Las preguntas y alternativas se mezclan en cada intento. La corrección se realiza en Supabase.</p>
  <div class="notice"><b>Aprobación:</b> mínimo 80% y ninguna pregunta crítica incorrecta.</div><button class="btn big-btn" onclick="loadAssessment()">COMENZAR EVALUACIÓN</button></div>`;
}
async function loadAssessment(){
  const {data,error}=await sb.functions.invoke("get-module-assessment",{body:{module_no:course.moduleNo}});
  if(error||data?.error){alert(data?.error||error?.message||"No fue posible cargar la evaluación.");return}
  course.assessment=data;course.startedAt=new Date().toISOString();course.phase="assessment";renderCourse();
}

function assessmentView(){
  const a=course.assessment;
  return `<div><div class="notice"><b>Evaluación en curso.</b> Responde todas las preguntas antes de enviar.</div>
  ${a.questions.map((q,i)=>`<div class="question-card"><div class="phase-kicker">PREGUNTA ${i+1} DE ${a.questions.length}${q.critical?" · CRÍTICA":""}</div><h3>${esc(q.question)}</h3>${q.options.map(o=>`<label class="answer-option"><input type="radio" name="q_${q.id}" value="${o.key}"><span>${esc(o.text)}</span></label>`).join("")}</div>`).join("")}
  <button class="btn big-btn" onclick="submitAssessment()">ENVIAR EVALUACIÓN</button><div id="assessment_msg"></div></div>`;
}
async function submitAssessment(){
  const a=course.assessment,answers=[];
  for(const q of a.questions){const s=document.querySelector(`input[name="q_${q.id}"]:checked`);if(!s){$("#assessment_msg").innerHTML='<div class="notice">Debes responder todas las preguntas.</div>';return}answers.push({question_id:q.id,option:s.value})}
  const {data,error}=await sb.functions.invoke("submit-module-assessment",{body:{module_no:course.moduleNo,answers,started_at:course.startedAt}});
  if(error||data?.error){alert(data?.error||error?.message||"No fue posible corregir.");return}
  renderAssessmentResult(data);
}
function renderAssessmentResult(r){
  const passed=!!r.passed;
  shell(`<div class="page"><section class="hero"><div class="orange"><b>MÓDULO ${String(course.moduleNo).padStart(2,"0")} · RESULTADO</b></div><h1>${passed?"MÓDULO APROBADO":"REFUERZO REQUERIDO"}</h1><p>Resultado registrado en Supabase.</p></section>
  <div class="grid4" style="margin-top:14px"><div class="card"><div class="mut">NOTA</div><div class="metric">${r.score}%</div></div><div class="card"><div class="mut">ESTADO</div><div class="metric small-metric">${passed?"APROBADO":"NO APROBADO"}</div></div><div class="card"><div class="mut">FALLAS CRÍTICAS</div><div class="metric">${r.critical_failures||0}</div></div><div class="card"><div class="mut">INTENTO</div><div class="metric">${r.attempts||1}</div></div></div>
  <div class="notice"><b>Brechas:</b> ${(r.weak_topics||[]).map(esc).join(", ")||"Sin brechas registradas"}</div>
  ${r.certificate?`<div class="notice"><b>Certificado generado:</b> ${esc(r.certificate.certificate_code)} · vigente hasta ${esc(r.certificate.expires_at)}</div>`:""}
  <button class="btn" onclick="workerDashboard()">${passed?"VOLVER A MI RUTA HSE":"VOLVER A REPASAR"}</button></div>`,false);
}
function approvedView(){return `<div class="stage-card"><div class="phase-kicker">APROBADO</div><h2>Módulo completado</h2><p class="big-copy">Tu resultado ya está registrado. Puedes continuar con tu ruta HSE.</p><button class="btn" onclick="workerDashboard()">VOLVER A MI RUTA</button></div>`}

/* ADMIN */
async function adminDashboard(){
  const [{count:workers},{data:progs},{data:certs}]=await Promise.all([
    sb.from("profiles").select("*",{count:"exact",head:true}).eq("role","worker"),
    sb.from("module_progress").select("status,score,module_no"),
    sb.from("certificates").select("id,status")
  ]);
  const approved=(progs||[]).filter(x=>x.status==="approved").length;
  const avg=(progs||[]).filter(x=>x.score!=null),average=avg.length?Math.round(avg.reduce((a,b)=>a+b.score,0)/avg.length):0;
  shell(`<div class="page"><section class="hero"><div class="orange"><b>PANEL ADMINISTRADOR HSE</b></div><h1>CONTROL DE INDUCCIÓN HOMBRE NUEVO</h1><p>Información en tiempo real desde Supabase.</p></section>
  <div class="grid4" style="margin-top:15px"><div class="card"><div class="mut">TRABAJADORES</div><div class="metric">${workers||0}</div></div><div class="card"><div class="mut">MÓDULOS APROBADOS</div><div class="metric">${approved}</div></div><div class="card"><div class="mut">PROMEDIO</div><div class="metric">${average}%</div></div><div class="card"><div class="mut">CERTIFICADOS</div><div class="metric">${(certs||[]).filter(x=>x.status==="valid").length}</div></div></div></div>`,true,"dashboard");
}
async function adminWorkers(){
  const {data:workers,error}=await sb.from("profiles").select("*").eq("role","worker").order("full_name");if(error){alert(error.message);return}
  const rows=(workers||[]).map(w=>`<tr><td><b>${esc(w.full_name)}</b><br><span class="mut">${esc(w.email||"")}</span></td><td>${esc(w.rut||"—")}</td><td>${esc(w.job_title||"—")}</td><td>${esc(w.site_area||"—")}</td><td>${w.account_verified?'<span class="badge ok">VERIFICADA</span>':'PENDIENTE'}</td><td><button class="btn out" onclick="adminWorkerDetail('${w.id}')">REVISAR</button></td></tr>`).join("");
  shell(`<div class="page"><div class="admin-title"><div><span class="orange">GESTIÓN REAL</span><h1>TRABAJADORES</h1></div><button class="btn" onclick="adminNewWorker()">+ CREAR TRABAJADOR</button></div><div class="card"><div style="overflow:auto"><table class="table"><thead><tr><th>TRABAJADOR</th><th>RUT</th><th>CARGO</th><th>ÁREA / FAENA</th><th>CUENTA</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6">Sin trabajadores.</td></tr>'}</tbody></table></div></div></div>`,true,"workers");
}
function adminNewWorker(){
  shell(`<div class="page"><div class="card" style="max-width:850px"><span class="orange">NUEVO TRABAJADOR</span><h2>Crear cuenta</h2><div class="form-grid">
  <div class="field"><label>NOMBRE COMPLETO *</label><input id="nw_name"></div><div class="field"><label>RUT</label><input id="nw_rut"></div>
  <div class="field"><label>CORREO *</label><input id="nw_email" type="email"></div><div class="field"><label>CONTRASEÑA *</label><input id="nw_password" type="password"></div>
  <div class="field"><label>CARGO</label><input id="nw_job"></div><div class="field"><label>ÁREA / FAENA</label><input id="nw_area"></div></div><div id="nw_msg"></div>
  <button class="btn" onclick="createWorker()">CREAR CUENTA</button> <button class="btn out" onclick="adminWorkers()">CANCELAR</button></div></div>`,true,"workers");
}
async function createWorker(){
  const el=$("#nw_msg"),payload={full_name:$("#nw_name").value.trim(),rut:$("#nw_rut").value.trim(),email:$("#nw_email").value.trim(),password:$("#nw_password").value,job_title:$("#nw_job").value.trim(),site_area:$("#nw_area").value.trim(),company:"STEEL INGENIERÍA"};
  if(!payload.full_name||!payload.email||!payload.password){el.innerHTML='<div class="notice">Faltan datos obligatorios.</div>';return}
  const {data,error}=await sb.functions.invoke("admin-create-worker",{body:payload});
  if(error||data?.error){el.innerHTML=`<div class="notice">Error: ${esc(data?.error||error?.message)}</div>`;return}
  el.innerHTML='<div class="notice"><b>Cuenta creada.</b></div>';setTimeout(adminWorkers,700);
}
async function adminWorkerDetail(id){
  const [{data:w},{data:p},{data:a},{data:c}]=await Promise.all([
    sb.from("profiles").select("*").eq("id",id).single(),
    sb.from("module_progress").select("*").eq("user_id",id).order("module_no"),
    sb.from("assessment_attempts").select("*").eq("user_id",id).order("completed_at",{ascending:false}),
    sb.from("certificates").select("*").eq("user_id",id).order("issued_at",{ascending:false})
  ]);
  shell(`<div class="page"><button class="btn out" onclick="adminWorkers()">← VOLVER</button><div class="card" style="margin-top:12px"><span class="orange">FICHA DEL TRABAJADOR</span><h2>${esc(w.full_name)}</h2><div class="grid4"><div><span class="mut">RUT</span><br><b>${esc(w.rut||"—")}</b></div><div><span class="mut">CARGO</span><br><b>${esc(w.job_title||"—")}</b></div><div><span class="mut">ÁREA</span><br><b>${esc(w.site_area||"—")}</b></div><div><span class="mut">CERTIFICADOS</span><br><b>${(c||[]).length}</b></div></div><h3>Progreso</h3><table class="table"><tr><th>MÓDULO</th><th>ESTADO</th><th>NOTA</th><th>INTENTOS</th><th>FALLAS CRÍTICAS</th></tr>${(p||[]).map(x=>`<tr><td>M${String(x.module_no).padStart(2,"0")}</td><td>${esc(x.status)}</td><td>${x.score==null?"—":x.score+"%"}</td><td>${x.attempts}</td><td>${x.critical_failures}</td></tr>`).join("")}</table><div class="notice"><b>Intentos totales:</b> ${(a||[]).length}</div></div></div>`,true,"workers");
}
async function adminModules(){
  const {data}=await sb.from("lms_modules").select("*").order("module_no");
  shell(`<div class="page"><h1>MÓDULOS Y CONTENIDOS</h1><div class="modules">${(data||[]).map(m=>`<div class="module"><div class="module-top art-${m.module_no}"><div class="mod-num">M${String(m.module_no).padStart(2,"0")}</div><div class="mod-symbol">${moduleSymbol(m.module_no)}</div></div><div class="module-body"><h3>${esc(m.title)}</h3><div>${m.duration_minutes} min · ${esc(m.version)}</div><span class="badge ok">PUBLICADO</span></div></div>`).join("")}</div></div>`,true,"modules");
}
function placeholder(title,active,msg){shell(`<div class="page"><div class="card"><span class="orange">PANEL HSE</span><h1>${title}</h1><p>${msg}</p></div></div>`,true,active)}
function adminQuestions(){placeholder("BANCO DE PREGUNTAS","questions","Evaluaciones aleatorias: 5 preguntas en módulos 01–09 y 10 preguntas en el Módulo 10.")}
function adminResults(){placeholder("RESULTADOS Y BRECHAS","results","Notas, intentos, fallas críticas y temas débiles se registran en Supabase.")}
function adminExpirations(){placeholder("VIGENCIAS","expirations","El certificado final tiene vigencia de un año desde su emisión.")}
async function adminCertificates(){
  const {data}=await sb.from("certificates").select("*,profiles(full_name,rut)").order("issued_at",{ascending:false});
  shell(`<div class="page"><h1>CERTIFICADOS</h1><div class="card"><table class="table"><tr><th>TRABAJADOR</th><th>CÓDIGO</th><th>EMISIÓN</th><th>VENCE</th><th>ESTADO</th></tr>${(data||[]).map(c=>`<tr><td>${esc(c.profiles?.full_name||"")}</td><td>${esc(c.certificate_code)}</td><td>${esc(c.issued_at)}</td><td>${esc(c.expires_at)}</td><td>${esc(c.status)}</td></tr>`).join("")}</table></div></div>`,true,"certificates");
}

async function bootstrap(){
  if(!sb){landing();return}
  const {data:{session}}=await sb.auth.getSession();if(!session){landing();return}
  currentUser=session.user;const {data:profile}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();if(!profile){landing();return}
  currentProfile=profile;profile.role==="admin"?adminDashboard():workerDashboard();
}
bootstrap();


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

let sb=null,currentUser=null,currentProfile=null;
const cfg=window.STEEL_LMS_CONFIG||{};
const configured=cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("REEMPLAZAR");

if(configured){
  sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY);
}

const $=s=>document.querySelector(s);
const root=html=>document.getElementById("app").innerHTML=html;
const esc=(v="")=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate=v=>v?new Date(v).toLocaleDateString("es-CL"):"—";

function landing(){
  root(`<div class="landing"><div class="landing-box">
    <div class="brand"><span>STEEL</span> HSE LMS</div>
    <h1>INDUCCIÓN HOMBRE NUEVO</h1>
    <p>HOJA DE RUTA → LMS EDUCATIVO → LIBRO EDUCATIVO → TERRENO</p>
    <div class="roles">
      <div class="role"><h2>👷 TRABAJADOR</h2><p>Ingresa a tu ruta, módulos, evaluaciones, progreso y certificado.</p><button class="btn" onclick="loginScreen('worker')">INGRESAR COMO TRABAJADOR</button></div>
      <div class="role"><h2>🛡️ ADMINISTRADOR HSE</h2><p>Gestiona trabajadores, avances, brechas, vigencias, certificados y contenidos.</p><button class="btn" onclick="loginScreen('admin')">INGRESAR COMO ADMINISTRADOR HSE</button></div>
    </div>
    ${configured?'':'<div class="notice" style="color:#17212b;margin-top:20px"><b>Modo instalación:</b> falta conectar Supabase.</div>'}
  </div></div>`);
}

function loginScreen(expectedRole){
  root(`<div class="landing"><div class="login">
    <div class="orange"><b>${expectedRole==='admin'?'ADMINISTRADOR HSE':'TRABAJADOR'}</b></div>
    <h2>Iniciar sesión</h2>
    <div class="field"><label>CORREO</label><input id="email" type="email" autocomplete="username"></div>
    <div class="field"><label>CONTRASEÑA</label><input id="pass" type="password" autocomplete="current-password"></div>
    <div id="msg" class="mut" style="min-height:20px"></div>
    <button class="btn" onclick="signIn('${expectedRole}')">INICIAR SESIÓN</button>
    <button class="btn out" onclick="landing()">VOLVER</button>
  </div></div>`);
}

async function signIn(expectedRole){
  if(!sb){$("#msg").textContent="Supabase aún no está configurado.";return}
  $("#msg").textContent="Validando...";
  const email=$("#email").value.trim(),password=$("#pass").value;
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  if(error){$("#msg").textContent=error.message;return}
  currentUser=data.user;
  const {data:profile,error:pe}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
  if(pe||!profile){await sb.auth.signOut();$("#msg").textContent="Perfil no configurado.";return}
  if(profile.role!==expectedRole){await sb.auth.signOut();$("#msg").textContent="Esta cuenta no corresponde al tipo de acceso seleccionado.";return}
  currentProfile=profile;
  expectedRole==="admin"?adminDashboard():workerDashboard();
}

async function signOut(){if(sb)await sb.auth.signOut();currentUser=null;currentProfile=null;landing()}

function shell(content,admin=false,active="dashboard"){
  const adminNav=`
    <button class="nav ${active==="dashboard"?"on":""}" onclick="adminDashboard()">🏠 RESUMEN HSE</button>
    <button class="nav ${active==="workers"?"on":""}" onclick="adminWorkers()">👥 TRABAJADORES</button>
    <button class="nav ${active==="modules"?"on":""}" onclick="adminModules()">📚 MÓDULOS</button>
    <button class="nav ${active==="questions"?"on":""}" onclick="adminQuestions()">📝 BANCO DE PREGUNTAS</button>
    <button class="nav ${active==="results"?"on":""}" onclick="adminResults()">📊 RESULTADOS Y BRECHAS</button>
    <button class="nav ${active==="expirations"?"on":""}" onclick="adminExpirations()">⏳ VIGENCIAS</button>
    <button class="nav ${active==="certificates"?"on":""}" onclick="adminCertificates()">🏆 CERTIFICADOS</button>`;
  const workerNav=`
    <button class="nav on">🏠 INICIO</button>
    <button class="nav">👤 MI PERFIL</button>
    <button class="nav">🧭 MI RUTA HSE</button>
    <button class="nav">📊 PROGRESO</button>
    <button class="nav">🏆 CERTIFICADO</button>`;
  root(`<div class="shell"><aside class="side"><h2><span class="orange">STEEL</span> HSE LMS</h2><p style="font-size:11px;color:#aebbc4">INDUCCIÓN HOMBRE NUEVO</p>
    ${admin?adminNav:workerNav}
    <button class="nav" onclick="signOut()">↪ CERRAR SESIÓN</button>
  </aside><main class="main"><header class="top"><b>HSE LMS · PRODUCCIÓN</b><div><b>${esc(currentProfile?.full_name||"")}</b><div class="mut" style="font-size:12px">${esc(currentProfile?.role||"")}</div></div></header>${content}</main></div>`);
}

async function workerDashboard(){
  const {data:rows}=await sb.from("module_progress").select("*").eq("user_id",currentUser.id).order("module_no");
  const progress=rows||[],completed=progress.filter(x=>x.status==="approved").length;
  const cards=MODULES.map((name,i)=>{
    const n=i+1,r=progress.find(x=>x.module_no===n),done=r?.status==="approved";
    const unlocked=n===1||progress.some(x=>x.module_no===n-1&&x.status==="approved");
    return `<div class="module ${unlocked?'':'lock'}"><div class="module-top"><b>M${String(n).padStart(2,"0")}</b><h3>${name}</h3></div><div class="module-body"><span class="badge ${done?'ok':''}">${done?'APROBADO':unlocked?'DISPONIBLE':'BLOQUEADO'}</span>${r?.score!=null?` <b>${r.score}%</b>`:""}</div></div>`;
  }).join("");
  shell(`<div class="page"><section class="hero"><div class="orange"><b>INDUCCIÓN HOMBRE NUEVO</b></div><h1>BIENVENIDO, ${esc(currentProfile.full_name)}</h1><p>Tu avance queda registrado en línea y asociado a tu cuenta personal.</p><div style="max-width:480px"><div class="progress"><span style="width:${completed*10}%"></span></div><p><b>${completed}/10 módulos completados</b></p></div></section><h2>Tu ruta HSE</h2><div class="modules">${cards}</div></div>`,false);
}

async function adminDashboard(){
  const [{count:workers},{data:progs},{data:certs}]=await Promise.all([
    sb.from("profiles").select("*",{count:"exact",head:true}).eq("role","worker"),
    sb.from("module_progress").select("status,score,module_no"),
    sb.from("certificates").select("id,expires_at,status")
  ]);
  const approved=(progs||[]).filter(x=>x.status==="approved").length;
  const avg=(progs||[]).filter(x=>x.score!=null);
  const average=avg.length?Math.round(avg.reduce((a,b)=>a+b.score,0)/avg.length):0;
  const validCerts=(certs||[]).filter(x=>x.status==="valid").length;
  shell(`<div class="page"><section class="hero"><div class="orange"><b>PANEL ADMINISTRADOR HSE</b></div><h1>CONTROL DE INDUCCIÓN HOMBRE NUEVO</h1><p>Información obtenida desde Supabase en tiempo real.</p></section>
  <div class="grid4" style="margin-top:15px"><div class="card"><div class="mut">TRABAJADORES</div><div class="metric">${workers||0}</div></div><div class="card"><div class="mut">MÓDULOS APROBADOS</div><div class="metric">${approved}</div></div><div class="card"><div class="mut">PROMEDIO</div><div class="metric">${average}%</div></div><div class="card"><div class="mut">CERTIFICADOS VIGENTES</div><div class="metric">${validCerts}</div></div></div>
  <div class="notice"><b>Producción:</b> usuarios, avance, intentos, notas, certificados y vigencias quedan en base de datos. Los permisos se controlan con RLS.</div></div>`,true,"dashboard");
}

async function adminWorkers(){
  const {data:workers,error}=await sb.from("profiles").select("*").eq("role","worker").order("full_name");
  if(error){alert(error.message);return}
  const rows=(workers||[]).map(w=>`
    <tr>
      <td><b>${esc(w.full_name)}</b><br><span class="mut" style="font-size:12px">${esc(w.email||"")}</span></td>
      <td>${esc(w.rut||"—")}</td>
      <td>${esc(w.job_title||"—")}</td>
      <td>${esc(w.site_area||"—")}</td>
      <td>${w.account_verified?'<span class="badge ok">VERIFICADA</span>':'<span class="badge">PENDIENTE</span>'}</td>
      <td><button class="btn out" style="padding:7px 10px" onclick="adminWorkerDetail('${w.id}')">REVISAR</button></td>
    </tr>`).join("");

  shell(`<div class="page">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap;margin-bottom:14px">
      <div><div class="orange"><b>GESTIÓN REAL</b></div><h1 style="margin:4px 0">TRABAJADORES</h1><div class="mut">${(workers||[]).length} trabajador(es) registrados</div></div>
      <button class="btn" onclick="adminNewWorker()">+ CREAR TRABAJADOR</button>
    </div>
    <div class="card">
      <div style="overflow:auto"><table class="table">
        <thead><tr><th>TRABAJADOR</th><th>RUT</th><th>CARGO</th><th>ÁREA / FAENA</th><th>CUENTA</th><th></th></tr></thead>
        <tbody>${rows||'<tr><td colspan="6">Aún no existen trabajadores.</td></tr>'}</tbody>
      </table></div>
    </div>
  </div>`,true,"workers");
}

function adminNewWorker(){
  shell(`<div class="page"><div class="card" style="max-width:850px">
    <div class="orange"><b>NUEVO TRABAJADOR</b></div><h2>Crear cuenta para Inducción Hombre Nuevo</h2>
    <p class="mut">La contraseña se define aquí y no queda visible en el panel después de crear la cuenta.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="field"><label>NOMBRE COMPLETO *</label><input id="nw_name"></div>
      <div class="field"><label>RUT</label><input id="nw_rut" placeholder="12.345.678-9"></div>
      <div class="field"><label>CORREO *</label><input id="nw_email" type="email"></div>
      <div class="field"><label>CONTRASEÑA INICIAL *</label><input id="nw_password" type="password" minlength="8"></div>
      <div class="field"><label>CARGO</label><input id="nw_job"></div>
      <div class="field"><label>ÁREA / FAENA</label><input id="nw_area" placeholder="ANTUCOYA · ÁREA RIPIOS"></div>
    </div>
    <div id="nw_msg" class="notice" style="display:none"></div>
    <button class="btn" onclick="createWorker()">CREAR CUENTA</button>
    <button class="btn out" onclick="adminWorkers()">CANCELAR</button>
  </div></div>`,true,"workers");
}

async function createWorker(){
  const el=$("#nw_msg");
  const payload={
    full_name:$("#nw_name").value.trim(),
    rut:$("#nw_rut").value.trim(),
    email:$("#nw_email").value.trim(),
    password:$("#nw_password").value,
    job_title:$("#nw_job").value.trim(),
    site_area:$("#nw_area").value.trim(),
    company:"STEEL INGENIERÍA"
  };
  if(!payload.full_name||!payload.email||!payload.password){
    el.style.display="block";el.innerHTML="<b>Faltan datos.</b> Nombre, correo y contraseña son obligatorios.";return;
  }
  el.style.display="block";el.innerHTML="<b>Creando cuenta...</b>";
  const {data,error}=await sb.functions.invoke("admin-create-worker",{body:payload});
  if(error){
    let msg=error.message||"No fue posible crear el trabajador.";
    try{ if(error.context){ const j=await error.context.json(); msg=j.error||msg; } }catch(e){}
    el.innerHTML=`<b>Error:</b> ${esc(msg)}`;return;
  }
  if(data?.error){el.innerHTML=`<b>Error:</b> ${esc(data.error)}`;return}
  el.innerHTML=`<b>✓ Cuenta creada correctamente.</b> ${esc(data.full_name)} ya puede iniciar sesión como Trabajador.`;
  setTimeout(()=>adminWorkers(),1200);
}

async function adminWorkerDetail(id){
  const [{data:w,error:e1},{data:progress,error:e2},{data:attempts},{data:certs}]=await Promise.all([
    sb.from("profiles").select("*").eq("id",id).single(),
    sb.from("module_progress").select("*").eq("user_id",id).order("module_no"),
    sb.from("assessment_attempts").select("*").eq("user_id",id).order("completed_at",{ascending:false}),
    sb.from("certificates").select("*").eq("user_id",id).order("issued_at",{ascending:false})
  ]);
  if(e1||e2){alert((e1||e2).message);return}
  const approved=(progress||[]).filter(x=>x.status==="approved").length;
  const table=(progress||[]).map(r=>`<tr><td>M${String(r.module_no).padStart(2,"0")}</td><td>${MODULES[r.module_no-1]}</td><td>${esc(r.status)}</td><td>${r.score==null?"—":r.score+"%"}</td><td>${r.attempts}</td><td>${r.critical_failures}</td></tr>`).join("");
  shell(`<div class="page">
    <button class="btn out" onclick="adminWorkers()">← VOLVER</button>
    <div class="card" style="margin-top:14px">
      <div class="orange"><b>FICHA DEL TRABAJADOR</b></div>
      <h2>${esc(w.full_name)}</h2>
      <div class="grid4">
        <div><div class="mut">RUT</div><b>${esc(w.rut||"—")}</b></div>
        <div><div class="mut">CARGO</div><b>${esc(w.job_title||"—")}</b></div>
        <div><div class="mut">ÁREA / FAENA</div><b>${esc(w.site_area||"—")}</b></div>
        <div><div class="mut">AVANCE</div><b>${approved}/10</b></div>
      </div>
      <h3 style="margin-top:22px">Progreso por módulo</h3>
      <div style="overflow:auto"><table class="table"><tr><th>MÓDULO</th><th>NOMBRE</th><th>ESTADO</th><th>NOTA</th><th>INTENTOS</th><th>CRÍTICAS</th></tr>${table}</table></div>
      <div class="notice"><b>Intentos registrados:</b> ${(attempts||[]).length} · <b>Certificados:</b> ${(certs||[]).length}</div>
    </div>
  </div>`,true,"workers");
}

function placeholder(title,active,msg){
  shell(`<div class="page"><div class="card"><div class="orange"><b>EN CONSTRUCCIÓN</b></div><h1>${title}</h1><p class="mut">${msg}</p><div class="notice"><b>Siguiente etapa:</b> esta pantalla será conectada al contenido real del LMS.</div></div></div>`,true,active);
}
function adminModules(){placeholder("MÓDULOS","modules","Aquí administraremos enseñanza, video, repaso, caso y evaluación de los 10 módulos.")}
function adminQuestions(){placeholder("BANCO DE PREGUNTAS","questions","Aquí se administrarán preguntas, alternativas, criticidad y aleatorización.")}
function adminResults(){placeholder("RESULTADOS Y BRECHAS","results","Aquí se mostrarán notas, intentos, preguntas críticas y brechas por tema.")}
function adminExpirations(){placeholder("VIGENCIAS","expirations","Aquí se controlarán alertas 60/30/15 días y vencimientos de la inducción.")}
function adminCertificates(){placeholder("CERTIFICADOS","certificates","Aquí se visualizarán certificados emitidos, vigencia y estado.")}

async function bootstrap(){
  if(!sb){landing();return}
  const {data:{session}}=await sb.auth.getSession();
  if(!session){landing();return}
  currentUser=session.user;
  const {data:profile}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
  if(!profile){landing();return}
  currentProfile=profile;
  profile.role==="admin"?adminDashboard():workerDashboard();
}
bootstrap();

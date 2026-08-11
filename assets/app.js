
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

function landing(){
  root(`<div class="landing"><div class="landing-box">
    <div class="brand"><span>STEEL</span> HSE LMS</div>
    <h1>INDUCCIÓN HOMBRE NUEVO</h1>
    <p>HOJA DE RUTA → LMS EDUCATIVO → LIBRO EDUCATIVO → TERRENO</p>
    <div class="roles">
      <div class="role"><h2>👷 TRABAJADOR</h2><p>Ingresa a tu ruta, módulos, evaluaciones, progreso y certificado.</p><button class="btn" onclick="loginScreen('worker')">INGRESAR COMO TRABAJADOR</button></div>
      <div class="role"><h2>🛡️ ADMINISTRADOR HSE</h2><p>Gestiona trabajadores, avances, brechas, vigencias, certificados y contenidos.</p><button class="btn" onclick="loginScreen('admin')">INGRESAR COMO ADMINISTRADOR HSE</button></div>
    </div>
    ${configured?'':'<div class="notice" style="color:#17212b;margin-top:20px"><b>Modo instalación:</b> falta conectar Supabase en <code>assets/config.js</code>.</div>'}
  </div></div>`);
}

function loginScreen(expectedRole){
  root(`<div class="landing"><div class="login">
    <div class="orange"><b>${expectedRole==='admin'?'ADMINISTRADOR HSE':'TRABAJADOR'}</b></div>
    <h2>Iniciar sesión</h2>
    <div class="field"><label>CORREO</label><input id="email" type="email"></div>
    <div class="field"><label>CONTRASEÑA</label><input id="pass" type="password"></div>
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

function shell(content,admin=false,active="Inicio"){
  root(`<div class="shell"><aside class="side"><h2><span class="orange">STEEL</span> HSE LMS</h2><p style="font-size:11px;color:#aebbc4">INDUCCIÓN HOMBRE NUEVO</p>
    ${admin?`
      <button class="nav on">🏠 RESUMEN HSE</button><button class="nav">👥 TRABAJADORES</button><button class="nav">📚 MÓDULOS</button><button class="nav">📝 BANCO DE PREGUNTAS</button><button class="nav">📊 RESULTADOS Y BRECHAS</button><button class="nav">⏳ VIGENCIAS</button><button class="nav">🏆 CERTIFICADOS</button>
    `:`
      <button class="nav on">🏠 INICIO</button><button class="nav">👤 MI PERFIL</button><button class="nav">🧭 MI RUTA HSE</button><button class="nav">📊 PROGRESO</button><button class="nav">🏆 CERTIFICADO</button>
    `}
    <button class="nav" onclick="signOut()">↪ CERRAR SESIÓN</button>
  </aside><main class="main"><header class="top"><b>HSE LMS · PRODUCCIÓN</b><div><b>${currentProfile?.full_name||""}</b><div class="mut" style="font-size:12px">${currentProfile?.role||""}</div></div></header>${content}</main></div>`);
}

async function workerDashboard(){
  const {data:rows}=await sb.from("module_progress").select("*").eq("user_id",currentUser.id);
  const progress=rows||[],completed=progress.filter(x=>x.status==="approved").length;
  const cards=MODULES.map((name,i)=>{
    const n=i+1,r=progress.find(x=>x.module_no===n),done=r?.status==="approved";
    const unlocked=n===1||progress.some(x=>x.module_no===n-1&&x.status==="approved");
    return `<div class="module ${unlocked?'':'lock'}"><div class="module-top"><b>M${String(n).padStart(2,"0")}</b><h3>${name}</h3></div><div class="module-body"><span class="badge ${done?'ok':''}">${done?'APROBADO':unlocked?'DISPONIBLE':'BLOQUEADO'}</span>${r?.score!=null?` <b>${r.score}%</b>`:""}</div></div>`
  }).join("");
  shell(`<div class="page"><section class="hero"><div class="orange"><b>INDUCCIÓN HOMBRE NUEVO</b></div><h1>BIENVENIDO, ${currentProfile.full_name}</h1><p>Tu avance queda registrado en línea y asociado a tu cuenta personal.</p><div style="max-width:480px"><div class="progress"><span style="width:${completed*10}%"></span></div><p><b>${completed}/10 módulos completados</b></p></div></section><h2>Tu ruta HSE</h2><div class="modules">${cards}</div></div>`,false);
}

async function adminDashboard(){
  const [{count:workers},{data:progs},{data:certs}]=await Promise.all([
    sb.from("profiles").select("*",{count:"exact",head:true}).eq("role","worker"),
    sb.from("module_progress").select("status,score,module_no"),
    sb.from("certificates").select("id,expires_at")
  ]);
  const approved=(progs||[]).filter(x=>x.status==="approved").length;
  const avg=(progs||[]).filter(x=>x.score!=null);
  const average=avg.length?Math.round(avg.reduce((a,b)=>a+b.score,0)/avg.length):0;
  shell(`<div class="page"><section class="hero"><div class="orange"><b>PANEL ADMINISTRADOR HSE</b></div><h1>CONTROL DE INDUCCIÓN HOMBRE NUEVO</h1><p>Información obtenida desde Supabase en tiempo real.</p></section>
  <div class="grid4" style="margin-top:15px"><div class="card"><div class="mut">TRABAJADORES</div><div class="metric">${workers||0}</div></div><div class="card"><div class="mut">MÓDULOS APROBADOS</div><div class="metric">${approved}</div></div><div class="card"><div class="mut">PROMEDIO</div><div class="metric">${average}%</div></div><div class="card"><div class="mut">CERTIFICADOS</div><div class="metric">${(certs||[]).length}</div></div></div>
  <div class="notice"><b>Producción:</b> usuarios, avance, intentos, notas, certificados y vigencias quedan en base de datos. Los permisos se controlan con RLS.</div></div>`,true);
}

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

/* Shared worker/admin certificate preview and two-page PDF. */
const CERTIFICATE_LOGO = 'assets/steel-logo.png';
const CERTIFICATE_SUMMARIES = {
  1:'Cultura preventiva, anticipación de riesgos, cumplimiento de controles y cuidado entre compañeros.',
  2:'Reglas para proteger la vida; cumplimiento sin excepciones ni atajos.',
  3:'Identificación de peligros, evaluación de riesgos y verificación de controles antes de iniciar.',
  4:'Prevención de eventos graves y fatales; verificación en terreno de controles críticos efectivos.',
  5:'Vías de exposición, monitoreo, segregación, ventilación, higiene y uso de EPP adecuado.',
  6:'Activación del plan, comunicación, evacuación y llegada al punto de encuentro.',
  7:'Detección de desviaciones, actuación segura, detención, reporte y cierre con evidencia.',
  8:'Condiciones físicas y mentales; aviso de fatiga, somnolencia, malestar y medicamentos que afecten el desempeño.',
  9:'Tránsito, comunicación con equipos, puntos ciegos, cinturón, herramientas y bloqueo de energías.',
  10:'Evaluación integrada de los contenidos de los módulos 01 al 09.'
};
let certificateLogoPromise;
function certificateRows(progress){
  return MODULES.map(m=>{
    const p=progress.find(p=>Number(p.module_no)===m.n);
    if(!p||p.status!=='approved'||p.score==null||!Number.isFinite(Number(p.score))||Number(p.score)<0||Number(p.score)>100){
      throw new Error(`No se puede generar el anexo: falta la aprobación o la nota registrada del módulo ${String(m.n).padStart(2,'0')}.`);
    }
    return {n:m.n,title:m.title,summary:CERTIFICATE_SUMMARIES[m.n],score:Number(p.score)};
  });
}
async function loadCertificateRows(userId){
  const {data,error}=await sb.from('module_progress').select('module_no,status,score,approved_at').eq('user_id',userId).order('module_no');
  if(error)throw new Error('No fue posible consultar los resultados: '+error.message);
  return certificateRows(data||[]);
}
function certificateHeaderHtml(){
  return `<div class="certificate-header"><img class="certificate-logo" src="${CERTIFICATE_LOGO}" alt="STEEL Ingeniería"><div class="certificate-brand">HSE <span>LMS</span></div></div>`;
}
function certificatePreviewHtml(cert,worker,rows){
  const footer=`STEEL INGENIERÍA · ANTUCOYA · ${esc(cert.lms_version||'LMS HSE')}`;
  const final=rows.find(r=>r.n===10);
  return `<div class="certificate-document">
    <div class="certificate-preview"><div class="certificate-border">
      ${certificateHeaderHtml()}<div class="certificate-kicker">CERTIFICADO DE APROBACIÓN</div>
      <h1>INDUCCIÓN HOMBRE NUEVO</h1><p>STEEL INGENIERÍA certifica que</p>
      <h2>${esc(worker.full_name||'')}</h2><p class="certificate-rut">RUT: ${esc(worker.rut||'—')}</p>
      <p>ha aprobado satisfactoriamente los 9 módulos de formación y el módulo 10 de evaluación final del curso LMS HSE STEEL.</p>
      <div class="certificate-data"><div><b>EMISIÓN</b><span>${formatCertificateDate(cert.issued_at)}</span></div>
      <div><b>VIGENCIA</b><span>${formatCertificateDate(cert.expires_at)}</span></div>
      <div><b>CÓDIGO</b><span>${esc(cert.certificate_code)}</span></div></div>
      <div class="certificate-footer">${footer}<br><span class="certificate-page">Página 1 de 2</span></div>
    </div></div>
    <div class="certificate-preview certificate-annex"><div class="certificate-border">
      ${certificateHeaderHtml()}<div class="certificate-kicker">ANEXO DEL CERTIFICADO</div><h1>MÓDULOS APROBADOS</h1>
      <div class="annex-person"><b>${esc(worker.full_name||'')}</b><span>RUT: ${esc(worker.rut||'—')} · Código: ${esc(cert.certificate_code)}</span>
      <span>Emisión: ${formatCertificateDate(cert.issued_at)} · Vigencia: ${formatCertificateDate(cert.expires_at)}</span></div>
      <div class="annex-table-wrap"><table class="annex-table"><thead><tr><th>N.º</th><th>Módulo</th><th>Contenidos resumidos</th><th>Resultado</th></tr></thead>
      <tbody>${rows.map(r=>`<tr><td>${String(r.n).padStart(2,'0')}</td><td><b>${esc(r.title)}</b></td><td>${esc(r.summary)}</td><td><b>${r.score}%</b><span class="annex-approved">APROBADO</span></td></tr>`).join('')}</tbody></table></div>
      <div class="annex-result"><b>Módulos aprobados: ${rows.length} de ${MODULES.length}</b><b>Evaluación final: ${final.score}%</b></div>
      <p class="annex-note">Este anexo forma parte del certificado de Inducción Hombre Nuevo y comparte su código, fecha de emisión y vigencia. Porcentajes correspondientes a las notas registradas por módulo.</p>
      <div class="certificate-footer">${footer}<br><span class="certificate-page">Página 2 de 2</span></div>
    </div></div></div>`;
}
function loadCertificateLogo(){
  if(!certificateLogoPromise){
    certificateLogoPromise=new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('No fue posible cargar el logo STEEL. Recarga la página e intenta nuevamente.'));
      img.src=CERTIFICATE_LOGO;
    }).catch(error=>{certificateLogoPromise=null;throw error;});
  }
  return certificateLogoPromise;
}
function drawCertificateFrame(doc,logo,cert,page){
  doc.setFillColor(255,255,255);doc.rect(0,0,297,210,'F');
  doc.setDrawColor(8,31,43);doc.setLineWidth(2);doc.rect(8,8,281,194);
  doc.setDrawColor(243,111,33);doc.setLineWidth(.5);doc.rect(12,12,273,186);
  doc.addImage(logo,'PNG',21,17,52,52*logo.naturalHeight/logo.naturalWidth);
  doc.setFont('helvetica','bold');doc.setFontSize(20);doc.setTextColor(8,31,43);doc.text('HSE LMS',276,34,{align:'right'});
  doc.setDrawColor(243,111,33);doc.line(21,45,276,45);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(82,97,107);
  doc.text(`STEEL INGENIERÍA · ANTUCOYA · ${cert.lms_version||'LMS HSE'}`,21,192);
  doc.text(`Página ${page} de 2`,276,192,{align:'right'});
}
function pdfFit(doc,text,width,maxSize,minSize=9){
  let size=maxSize;doc.setFontSize(size);
  while(size>minSize&&doc.getTextWidth(text)>width){size-=.5;doc.setFontSize(size);}
  return doc.splitTextToSize(text,width);
}
async function buildCertificatePdf(cert,worker,rows){
  if(!window.jspdf?.jsPDF)throw new Error('No fue posible cargar el generador PDF. Recarga la página.');
  // Revalidate before export, including callers outside the normal screen flow.
  if(rows.length!==MODULES.length||new Set(rows.map(r=>r.n)).size!==MODULES.length)throw new Error('El anexo está incompleto.');
  const logo=await loadCertificateLogo();
  const doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  doc.setProperties({title:'Inducción Hombre Nuevo - Certificado y módulos aprobados',author:'STEEL INGENIERÍA'});
  drawCertificateFrame(doc,logo,cert,1);
  doc.setFont('helvetica','bold');doc.setTextColor(243,111,33);doc.setFontSize(12);doc.text('CERTIFICADO DE APROBACIÓN',148.5,61,{align:'center'});
  doc.setTextColor(8,31,43);doc.setFontSize(25);doc.text('INDUCCIÓN HOMBRE NUEVO',148.5,78,{align:'center'});
  doc.setFont('helvetica','normal');doc.setFontSize(12);doc.text('STEEL INGENIERÍA certifica que',148.5,94,{align:'center'});
  doc.setFont('helvetica','bold');doc.setTextColor(243,111,33);
  const name=pdfFit(doc,String(worker.full_name||'').toUpperCase(),249,22,12);
  doc.text(name,148.5,112,{align:'center'});
  doc.setFont('helvetica','normal');doc.setTextColor(8,31,43);doc.setFontSize(11);doc.text(`RUT: ${worker.rut||'—'}`,148.5,126,{align:'center'});
  doc.setFontSize(10);doc.text('ha aprobado satisfactoriamente los 9 módulos de formación y el módulo 10 de evaluación final',148.5,139,{align:'center'});
  doc.text('del curso LMS HSE STEEL.',148.5,145,{align:'center'});
  const fields=[['EMISIÓN',formatCertificateDate(cert.issued_at),21,77],['VIGENCIA',formatCertificateDate(cert.expires_at),105,77],['CÓDIGO',cert.certificate_code||'—',189,87]];
  fields.forEach(([label,value,x,width])=>{doc.setDrawColor(8,31,43);doc.line(x,158,x+width,158);doc.setTextColor(243,111,33);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(label,x+width/2,164,{align:'center'});doc.setTextColor(8,31,43);pdfFit(doc,String(value),width,10);doc.text(String(value),x+width/2,171,{align:'center'});});
  doc.addPage('a4','landscape');drawCertificateFrame(doc,logo,cert,2);
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setTextColor(8,31,43);doc.text('ANEXO · MÓDULOS APROBADOS',21,55);
  pdfFit(doc,String(worker.full_name||'').toUpperCase(),255,10);doc.text(String(worker.full_name||'').toUpperCase(),21,62);
  doc.setFont('helvetica','normal');doc.setFontSize(8);
  doc.text(`RUT: ${worker.rut||'—'} · Código: ${cert.certificate_code}`,21,68);
  doc.text(`Emisión: ${formatCertificateDate(cert.issued_at)} · Vigencia: ${formatCertificateDate(cert.expires_at)}`,21,73);
  const x=[21,33,112,244,276];let y=78;
  doc.setFillColor(8,31,43);doc.rect(21,y,255,8,'F');doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);doc.setFontSize(8);
  ['N.º','MÓDULO','CONTENIDOS RESUMIDOS','RESULTADO'].forEach((s,i)=>doc.text(s,x[i]+2,y+5));y+=8;
  rows.forEach((r,i)=>{
    doc.setFontSize(7.5);doc.setFont('helvetica','bold');const title=doc.splitTextToSize(r.title,75);
    doc.setFont('helvetica','normal');const summary=doc.splitTextToSize(r.summary,128);
    const height=Math.max(8.5,Math.max(title.length,summary.length)*3+3);
    doc.setFillColor(...(i%2?[255,255,255]:[245,248,250]));doc.rect(21,y,255,height,'F');doc.setTextColor(8,31,43);
    doc.text(String(r.n).padStart(2,'0'),23,y+4);doc.setFont('helvetica','bold');doc.text(title,35,y+4);
    doc.setFont('helvetica','normal');doc.text(summary,114,y+4);
    doc.setFont('helvetica','bold');doc.setTextColor(20,129,92);doc.text(`${r.score}%`,260,y+3.5,{align:'center'});doc.setFontSize(6);doc.text('APROBADO',260,y+6.8,{align:'center'});
    doc.setDrawColor(216,224,230);doc.setLineWidth(.2);doc.line(21,y+height,276,y+height);y+=height;
  });
  if(y>178)throw new Error('Los contenidos exceden el espacio del anexo.');
  doc.setTextColor(8,31,43);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.text(`Módulos aprobados: ${rows.length} de ${MODULES.length}`,21,y+6);
  doc.text(`Evaluación final: ${rows.find(r=>r.n===10).score}%`,276,y+6,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(7);doc.text('Este anexo forma parte del certificado y comparte su código, fecha de emisión y vigencia.',21,y+12);
  return doc;
}
async function exportCertificatePdf(cert,worker){
  const rows=await loadCertificateRows(cert.user_id);
  const doc=await buildCertificatePdf(cert,worker,rows);
  const safeName=String(worker.full_name||'trabajador').replace(/[^a-zA-Z0-9]+/g,'_');
  doc.save(`Certificado_LMS_HSE_STEEL_${safeName}.pdf`);
}

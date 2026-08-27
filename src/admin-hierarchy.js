/* Admin hierarchy views: reuse existing workspace panel styles, no visual redesign. */
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const isAdmin=()=>{const r=document.querySelector('.workspace-role')?.textContent||'';return r.includes('Yönetici')||r.includes('Admin')};
 const avatar=p=>p?.avatar_data?`<span class="people-avatar" style="background-image:url('${p.avatar_data}');background-size:cover;background-position:center"></span>`:`<span class="people-avatar">${esc((p?.full_name||p?.username||'?').slice(0,1).toUpperCase())}</span>`;
 const get=resource=>fetch(`/api/app?resource=${encodeURIComponent(resource)}`,{credentials:'same-origin'}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Veri alınamadı');return d.items||[]});
 const tree=()=>fetch('/api/relationships?action=tree',{credentials:'same-origin'}).then(async r=>{const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Veri alınamadı');return d.teachers||[]});
 const panel=(title,sub,inner)=>`<section class="hub-panel"><button class="hub-header" type="button" data-admin-toggle aria-expanded="false"><span class="hub-title">${title}</span><span class="hub-chevron">⌄</span></button><div class="hub-body"><div class="hub-body-inner">${inner}</div></div></section>`;
 const bind=()=>document.querySelectorAll('[data-admin-toggle]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.addEventListener('click',()=>{const p=b.closest('.hub-panel');const open=p.classList.toggle('open');b.setAttribute('aria-expanded',String(open))})});
 async function students(){
  const c=document.querySelector('#workspaceContent');if(!c||!isAdmin())return;
  const teachers=await tree();
  c.innerHTML=`<div class="workspace-heading"><div><span class="eyebrow">KULLANICILAR</span><h2>Öğrenciler</h2><p>Öğretmenlere bağlı öğrencileri yönetin.</p></div><button class="button button-primary" data-page="students">+ Öğrenci Ekle</button></div><div class="people-tree">${teachers.map(t=>panel(`${avatar(t)}<strong>${esc(t.full_name)}</strong><small>Öğretmen · @${esc(t.username)}</small>` ,'',(t.students||[]).map(s=>panel(`${avatar(s)}<strong>${esc(s.full_name)}</strong><small>Öğrenci · @${esc(s.username)}</small>`,'','<div class="workspace-empty"><p>Öğrenci detayları için paneli açın.</p></div>')).join('')||'<div class="workspace-empty"><p>Bu öğretmene bağlı öğrenci yok.</p></div>')).join('')||'<div class="workspace-empty"><p>Öğretmen bulunamadı.</p></div>'}</div>`;
  bind();
 }
 async function groups(){
  const c=document.querySelector('#workspaceContent');if(!c||!isAdmin())return;
  const [groups,students]=await Promise.all([get('classes'),get('students')]);
  const by=new Map();students.forEach(s=>{if(!s.group_name)return;if(!by.has(s.group_name))by.set(s.group_name,[]);by.get(s.group_name).push(s)});
  c.innerHTML=`<div class="workspace-heading"><div><span class="eyebrow">KULLANICILAR</span><h2>Sınıf & Grup</h2><p>Grupları ve bağlı öğrencileri yönetin.</p></div><button class="button button-primary" data-page="classes">+ Yeni Grup</button></div><div class="people-tree">${groups.map(g=>panel(`<strong>${esc(g.name)}</strong><small>${esc(g.teacher_name||'Öğretmen atanmadı')} · ${Number(g.student_count||0)} öğrenci</small>`,'',(by.get(g.name)||[]).map(s=>`<article class="data-row">${avatar(s)}<div><b>${esc(s.full_name)}</b><span>Öğrenci · @${esc(s.username)}</span></div></article>`).join('')||'<div class="workspace-empty"><p>Bu grupta öğrenci yok.</p></div>')).join('')||'<div class="workspace-empty"><p>Henüz grup yok.</p></div>'}</div>`;
  bind();
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('.workspace-nav[data-page]');if(!b||!isAdmin())return;
  const p=b.dataset.page;
  if(p==='students'){setTimeout(()=>students().catch(console.error),0)}
  if(p==='classes'){setTimeout(()=>groups().catch(console.error),0)}
 },true);
})();

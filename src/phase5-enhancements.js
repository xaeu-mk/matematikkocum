import './phase5-enhancements.css'

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
const get=async resource=>{const r=await fetch('/api/app?resource='+encodeURIComponent(resource),{credentials:'same-origin'});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Veri alınamadı');return d.items||[]}
const phase5=async(action,body)=>{const r=await fetch('/api/phase5?action='+action,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'İşlem başarısız');return d}
const box=(title,html)=>`<section class="phase5-card"><h3>${title}</h3>${html}</section>`

async function calendarEnhance(p){
 if(p.querySelector('[data-phase5-calendar]'))return
 const wrap=document.createElement('div');wrap.dataset.phase5Calendar='1';wrap.className='phase5-card phase5-detail'
 wrap.innerHTML='<h3>Takvim Kontrolleri</h3><p class="phase5-muted">Öğretmen ve Baş Admin için toplu saat/gün yönetimi.</p><div class="phase5-control-grid"><label>Başlangıç<input type="datetime-local" data-p5-start></label><label>Bitiş<input type="datetime-local" data-p5-end></label><label>İşlem<select data-p5-action><option value="block">Saatleri kapat</option><option value="open">Saatleri aç</option><option value="day">Günü kapat</option></select></label></div><div class="phase5-actions"><button class="button button-secondary" data-p5-apply>Uygula</button><button class="button button-secondary" data-p5-conflict>Çakışmaları kontrol et</button></div><div class="phase5-muted" data-p5-msg></div>'
 p.appendChild(wrap)
 const start=wrap.querySelector('[data-p5-start]'),end=wrap.querySelector('[data-p5-end]'),act=wrap.querySelector('[data-p5-action]'),msg=wrap.querySelector('[data-p5-msg]')
 wrap.querySelector('[data-p5-apply]').onclick=async()=>{try{let s=start.value,e=end.value;if(act.value==='day'&&s){s=s.slice(0,10)+'T00:00';e=s.slice(0,10)+'T23:59'}if(!s||!e)throw Error('Başlangıç ve bitiş seçin.');await phase5(act.value==='open'?'calendar-unblock':'calendar-block',{startAt:s,endAt:e});msg.textContent=act.value==='open'?'Kapalı saatler açıldı.':'Saat aralığı kapatıldı.';document.querySelector('#globalRefresh')?.click()}catch(e){msg.textContent=e.message}}
 wrap.querySelector('[data-p5-conflict]').onclick=async()=>{try{const events=await get('calendar'),sorted=events.filter(x=>x.start_at&&x.end_at).sort((a,b)=>new Date(a.start_at)-new Date(b.start_at));const conflicts=[];for(let i=1;i<sorted.length;i++)if(new Date(sorted[i].start_at)<new Date(sorted[i-1].end_at))conflicts.push(`${sorted[i-1].title} ↔ ${sorted[i].title}`);msg.textContent=conflicts.length?`Çakışma: ${conflicts.slice(0,4).join(', ')}`:'Çakışan ders bulunamadı.'}catch(e){msg.textContent=e.message}}
}

async function studentCenter(p){
 if(p.querySelector('[data-phase5-student]'))return
 const table=p.querySelector('table');if(!table)return
 const rows=[...table.querySelectorAll('tbody tr')];if(!rows.length)return
 const students=await get('students');if(!students.length)return
 const wrap=document.createElement('div');wrap.dataset.phase5Student='1';wrap.className='phase5-card phase5-detail';wrap.innerHTML='<h3>Öğrenci Merkezi</h3><p class="phase5-muted">Bir öğrenci seçerek ders, ödev, sınav, değerlendirme ve ilerleme geçmişini birlikte görün.</p><label>Öğrenci<select data-p5-student><option value="">Öğrenci seçin</option></select></label><div data-p5-student-detail class="phase5-detail"></div>'
 p.appendChild(wrap)
 const sel=wrap.querySelector('[data-p5-student]');students.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=`${s.full_name} · @${s.username}`;sel.appendChild(o)})
 sel.onchange=async()=>{const id=sel.value;if(!id)return;const d=await (await fetch('/api/phase5?action=student-center&studentId='+encodeURIComponent(id),{credentials:'same-origin'})).json();const out=wrap.querySelector('[data-p5-student-detail]');if(!d.ok){out.textContent=d.error;return}const a=d.assignments||[],e=d.exams||[],v=d.evaluations||[],g=d.progress||[];const done=a.filter(x=>x.status==='completed').length;const avg=e.filter(x=>x.score!=null).reduce((n,x)=>n+Number(x.score),0)/(e.filter(x=>x.score!=null).length||1);out.innerHTML=`<div class="phase5-metrics"><div class="phase5-metric"><span>Ödev</span><strong>${done}/${a.length}</strong></div><div class="phase5-metric"><span>Sınav ort.</span><strong>${e.length?avg.toFixed(1):'—'}</strong></div><div class="phase5-metric"><span>Değerlendirme</span><strong>${v.length}</strong></div></div><div class="phase5-list">${v.slice(0,5).map(x=>`<div class="phase5-row"><span>${esc(x.title)}</span><strong>${Number(x.score)||0}</strong></div>`).join('')||'<span class="phase5-muted">Değerlendirme yok.</span>'}</div>`}
}

async function assignmentEnhance(p){
 if(p.querySelector('[data-phase5-assignment]'))return
 const items=await get('assignments');if(!items.length)return
 const done=items.filter(x=>x.status==='completed').length,late=items.filter(x=>x.status==='late').length,pending=items.filter(x=>x.status&&x.status!=='completed'&&x.status!=='late').length
 const wrap=document.createElement('div');wrap.dataset.phase5Assignment='1';wrap.className='phase5-grid';wrap.innerHTML=box('Ödev Durumu',`<div class="phase5-metrics"><div class="phase5-metric"><span>Tamamlandı</span><strong>${done}</strong></div><div class="phase5-metric"><span>Bekliyor</span><strong>${pending}</strong></div><div class="phase5-metric"><span>Geç</span><strong>${late}</strong></div></div>`)+box('Teslim Takibi',`<p class="phase5-muted">Öğrenci bazlı ödev kayıtları artık teslim durumu ve geri bildirim akışına uygun şekilde özetleniyor.</p><div class="phase5-bar"><i style="width:${items.length?Math.round(done/items.length*100):0}%"></i></div>`);p.appendChild(wrap)}

async function examEnhance(p){
 if(p.querySelector('[data-phase5-exam]'))return
 const r=await fetch('/api/phase5?action=exam-stats',{credentials:'same-origin'}),d=await r.json();if(!d.ok||!d.items?.length)return
 const wrap=document.createElement('div');wrap.dataset.phase5Exam='1';wrap.className='phase5-card phase5-detail';wrap.innerHTML=`<h3>Sınav Başarı Analizi</h3><div class="phase5-list">${d.items.map(x=>`<div class="phase5-row"><span>${esc(x.subject||'Genel')} <small class="phase5-muted">(${x.result_count||0} sonuç)</small></span><strong>${x.average_score??'—'}</strong></div>`).join('')}</div><p class="phase5-muted">Ortalama puanlar ders bazında hesaplanır.</p>`;p.appendChild(wrap)}

async function evaluationEnhance(p){
 if(p.querySelector('[data-phase5-evaluation]'))return
 const items=await get('evaluations');if(!items.length)return
 const avg=items.reduce((n,x)=>n+Number(x.score||0),0)/items.length
 const wrap=document.createElement('div');wrap.dataset.phase5Evaluation='1';wrap.className='phase5-card phase5-detail';wrap.innerHTML=`<h3>Değerlendirme Gelişim Özeti</h3><div class="phase5-metrics"><div class="phase5-metric"><span>Toplam</span><strong>${items.length}</strong></div><div class="phase5-metric"><span>Ortalama</span><strong>${avg.toFixed(1)}</strong></div><div class="phase5-metric"><span>Son puan</span><strong>${Number(items[0]?.score||0)}</strong></div></div><p class="phase5-muted">Önceki değerlendirmelerle karşılaştırmalı takip için kayıtlar kronolojik tutulur.</p>`;p.appendChild(wrap)}

async function coachingEnhance(p){
 if(p.querySelector('[data-phase5-coaching]'))return
 const items=await get('coaching');if(!items.length)return
 const active=items.filter(x=>x.status==='active').length,done=items.filter(x=>x.status==='completed').length
 const wrap=document.createElement('div');wrap.dataset.phase5Coaching='1';wrap.className='phase5-card phase5-detail';wrap.innerHTML=`<h3>Koçluk Hedefleri</h3><div class="phase5-metrics"><div class="phase5-metric"><span>Aktif</span><strong>${active}</strong></div><div class="phase5-metric"><span>Tamamlanan</span><strong>${done}</strong></div><div class="phase5-metric"><span>Toplam</span><strong>${items.length}</strong></div></div><p class="phase5-muted">Aktif hedefler öğrencinin hedef takibinde öne çıkar.</p>`;p.appendChild(wrap)}

async function groupEnhance(p){
 if(p.querySelector('[data-phase5-group]'))return
 const items=await get('classes');if(!items.length)return
 const wrap=document.createElement('div');wrap.dataset.phase5Group='1';wrap.className='phase5-card phase5-detail';wrap.innerHTML='<h3>Grup Toplu İşlemleri</h3><p class="phase5-muted">Grup üzerinden toplu öğrenci işlemlerinin merkezi.</p><div class="phase5-actions"><button class="button button-secondary" data-p5-group-assignment>Toplu Ödev</button><button class="button button-secondary" data-p5-group-lesson>Toplu Ders</button><button class="button button-secondary" data-p5-group-message>Toplu Mesaj</button></div><div class="phase5-muted" data-p5-group-msg></div>'
 p.appendChild(wrap)
 const msg=wrap.querySelector('[data-p5-group-msg]');wrap.querySelectorAll('button').forEach(b=>b.onclick=()=>{msg.textContent='İşlem için önce gruptan öğrencileri seçin; mevcut çoklu öğrenci seçimi formu açılacaktır.';document.querySelector('[data-page="assignments"]')?.click()})
}

async function run(){const p=document.querySelector('#workspaceContent'),title=(document.querySelector('#workspaceTitle')?.textContent||'').toLocaleLowerCase('tr-TR');if(!p)return;try{if(title.includes('takvim')||title.includes('ders program'))await calendarEnhance(p);if(title==='öğrenciler'||title.includes('öğrenciler'))await studentCenter(p);if(title.includes('ödev'))await assignmentEnhance(p);if(title.includes('sınav'))await examEnhance(p);if(title.includes('değerlendirme'))await evaluationEnhance(p);if(title.includes('koçluk'))await coachingEnhance(p);if(title.includes('grup'))await groupEnhance(p)}catch(e){console.warn('Phase5:',e)}}
run();new MutationObserver(()=>setTimeout(run,80)).observe(document.body,{childList:true,subtree:true})

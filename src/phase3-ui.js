import './phase3-ui.css'

const favKey='mk_favorites_v1'
const getFav=()=>JSON.parse(localStorage.getItem(favKey)||'[]')
const setFav=v=>localStorage.setItem(favKey,JSON.stringify(v))
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))

function notificationBell(){
  const actions=document.querySelector('.workspace-header-actions')
  if(!actions||document.querySelector('#phase3Notifications'))return
  const b=document.createElement('button');b.className='header-icon phase3-notify';b.id='phase3Notifications';b.setAttribute('aria-label','Bildirimler');b.innerHTML='🔔<span class="phase3-badge" hidden></span>'
  const panel=document.createElement('div');panel.className='phase3-notify-panel';panel.hidden=true;panel.innerHTML='<div class="phase3-notify-head"><strong>Bildirimler</strong><button type="button" data-notify-close>×</button></div><div class="phase3-notify-list"><span class="phase3-muted">Bildirimler yükleniyor…</span></div>'
  actions.prepend(b);actions.append(panel)
  b.onclick=async()=>{panel.hidden=!panel.hidden;if(!panel.hidden)await loadNotifications(panel)}
  panel.querySelector('[data-notify-close]').onclick=()=>panel.hidden=true
}
async function loadNotifications(panel){
  const list=panel.querySelector('.phase3-notify-list'), badge=document.querySelector('.phase3-badge')
  try{
    const [m,a]=await Promise.all([fetch('/api/app?resource=messages',{credentials:'same-origin'}).then(r=>r.json()),fetch('/api/app?resource=announcements',{credentials:'same-origin'}).then(r=>r.json()).catch(()=>({items:[]}))])
    const rows=[]
    ;(m.items||m.data||[]).filter(x=>!x.read_at).slice(0,8).forEach(x=>rows.push(`<div class="phase3-notify-item"><b>Yeni mesaj</b><span>${esc(x.body||'Yeni mesajınız var.')}</span></div>`))
    ;(a.items||a.data||[]).slice(0,5).forEach(x=>rows.push(`<div class="phase3-notify-item"><b>${esc(x.title||'Duyuru')}</b><span>${esc(x.body||'')}</span></div>`))
    list.innerHTML=rows.length?rows.join(''):'<span class="phase3-muted">Yeni bildiriminiz yok.</span>'
    if(badge){const n=rows.length;badge.textContent=n>9?'9+':n;badge.hidden=!n}
  }catch{list.innerHTML='<span class="phase3-muted">Bildirimler şu anda alınamadı.</span>'}
}
function favoriteButtons(){
  const page=document.querySelector('#workspaceContent');if(!page||page.dataset.phase3Fav==='1')return
  page.dataset.phase3Fav='1'
  const candidates=[...page.querySelectorAll('[data-student-id],[data-user-id]')]
  candidates.forEach(el=>{const id=el.dataset.studentId||el.dataset.userId;if(!id||el.querySelector('.phase3-fav'))return;const b=document.createElement('button');b.type='button';b.className='phase3-fav';b.textContent=getFav().includes(id)?'★':'☆';b.title='Favorilere ekle/çıkar';b.onclick=e=>{e.stopPropagation();const f=getFav(),i=f.indexOf(id);i>=0?f.splice(i,1):f.push(id);setFav(f);b.textContent=f.includes(id)?'★':'☆'};el.appendChild(b)})
}
function bulkSelection(){
 const page=document.querySelector('#workspaceContent');if(!page||page.dataset.phase3Bulk==='1')return
 const title=(page.querySelector('h2')?.textContent||'').toLocaleLowerCase('tr-TR');if(!title.includes('öğrenci'))return
 page.dataset.phase3Bulk='1'
 const rows=[...page.querySelectorAll('tr')].filter(x=>x.querySelector('td'))
 if(!rows.length)return
 rows.forEach(row=>{if(row.querySelector('.phase3-check'))return;const cb=document.createElement('input');cb.type='checkbox';cb.className='phase3-check';cb.setAttribute('aria-label','Öğrenciyi seç');const cell=row.querySelector('td');cell?.prepend(cb)})
 const head=page.querySelector('.workspace-heading')||page.firstElementChild;if(!head)return
 const bar=document.createElement('div');bar.className='phase3-bulkbar';bar.innerHTML='<span class="phase3-bulk-count">0 öğrenci seçildi</span><button type="button" data-bulk-all>Tümünü seç</button><button type="button" data-bulk-clear>Temizle</button>';head.after(bar)
 const update=()=>bar.querySelector('.phase3-bulk-count').textContent=`${page.querySelectorAll('.phase3-check:checked').length} öğrenci seçildi`
 page.addEventListener('change',e=>{if(e.target.classList.contains('phase3-check'))update()})
 bar.querySelector('[data-bulk-all]').onclick=()=>{page.querySelectorAll('.phase3-check').forEach(x=>x.checked=true);update()}
 bar.querySelector('[data-bulk-clear]').onclick=()=>{page.querySelectorAll('.phase3-check').forEach(x=>x.checked=false);update()}
}
function copyProtection(){
 document.addEventListener('copy',e=>{const t=e.target.closest?.('[data-no-copy],.sensitive-data');if(t){e.preventDefault();const s=getSelection()?.toString();if(s)navigator.clipboard?.writeText('').catch(()=>{})}},true)
 document.addEventListener('contextmenu',e=>{if(e.target.closest?.('[data-no-copy],.sensitive-data'))e.preventDefault()},true)
}
function boot(){
 notificationBell();copyProtection();const obs=new MutationObserver(()=>{notificationBell();favoriteButtons();bulkSelection()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(()=>{favoriteButtons();bulkSelection()},500)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot()

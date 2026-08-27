import './workspace-reference.css'
import { icon } from './icons.js'

const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]))
const roles = { admin: 'Yönetici', superadmin: 'Yönetici', teacher: 'Öğretmen', student: 'Öğrenci', parent: 'Veli' }

const navIcons = {
  dashboard: 'home', calendar: 'calendar', courses: 'book', students: 'users',
  teachers: 'graduation', classes: 'grid', assignments: 'check', exams: 'clipboard',
  progress: 'trending', evaluations: 'award', reports: 'barChart', coaching: 'target',
  messages: 'mail', videos: 'video', activity: 'activity', settings: 'settings'
}

const groups = {
  admin: [['dashboard', 'Genel Bakış'], ['calendar', 'Takvim'], ['courses', 'Dersler'], ['students', 'Öğrenciler'], ['teachers', 'Öğretmenler'], ['classes', 'Sınıf & Grup'], ['assignments', 'Ödevler'], ['exams', 'Sınavlar'], ['progress', 'Gelişim'], ['evaluations', 'Değerlendirmeler'], ['reports', 'Raporlar'], ['coaching', 'Koçluk'], ['messages', 'Mesajlar'], ['videos', 'Videolar'], ['activity', 'Aktivite'], ['settings', 'Ayarlar']],
  teacher: [['dashboard', 'Genel Bakış'], ['calendar', 'Takvim'], ['courses', 'Dersler'], ['students', 'Öğrenciler'], ['assignments', 'Ödevler'], ['exams', 'Sınavlar'], ['progress', 'Gelişim'], ['evaluations', 'Değerlendirmeler'], ['reports', 'Raporlar'], ['coaching', 'Koçluk'], ['messages', 'Mesajlar'], ['videos', 'Videolar'], ['settings', 'Ayarlar']],
  student: [['dashboard', 'Genel Bakış'], ['calendar', 'Ders Programım'], ['courses', 'Derslerim'], ['assignments', 'Ödevlerim'], ['exams', 'Sınavlarım'], ['progress', 'Gelişim'], ['videos', 'Videolar'], ['settings', 'Ayarlar']],
  parent: [['dashboard', 'Genel Bakış'], ['calendar', 'Ders Programı'], ['courses', 'Dersler'], ['assignments', 'Ödevler'], ['exams', 'Sınav Sonuçları'], ['progress', 'Gelişim'], ['evaluations', 'Değerlendirmeler'], ['coaching', 'Koçluk'], ['videos', 'Videolar'], ['settings', 'Ayarlar']]
}

const labels = Object.fromEntries(Object.values(groups).flat())

const nav = (role) => {
  const items = groups[role] || groups.student
  const sections = [
    ['Ana', ['dashboard']],
    ['Planlama', ['calendar', 'courses']],
    ['Kullanıcılar', ['students', 'teachers', 'classes']],
    ['Ölçme & Gelişim', ['assignments', 'exams', 'progress', 'evaluations', 'reports']],
    ['Koçluk & İletişim', ['coaching', 'messages', 'videos']],
    ['Sistem', ['activity', 'settings']]
  ]
  return sections.map(([title, keys]) => {
    const ok = keys.map(k => items.find(x => x[0] === k)).filter(Boolean)
    if (!ok.length) return ''
    if (ok.length === 1) return `<div class="nav-section"><span>${title}</span>${ok.map(([k, l]) => `<button class="workspace-nav" data-page="${k}">${icon(navIcons[k] || 'home', 20)}<span>${l}</span></button>`).join('')}</div>`
    return `<div class="nav-section nav-accordion"><button class="nav-accordion-head" data-nav-toggle aria-expanded="true"><span>${title}</span>${icon('chevronDown', 16)}</button><div class="nav-accordion-body">${ok.map(([k, l]) => `<button class="workspace-nav" data-page="${k}">${icon(navIcons[k] || 'home', 20)}<span>${l}</span></button>`).join('')}</div></div>`
  }).join('')
}

const empty = (title, text) => `<div class="workspace-empty"><div class="empty-icon">${icon('sparkles', 24)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`
const date = v => v ? new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v)) : ''

const modalField = (name, label, type = 'text', opts = {}) => {
  const required = opts.required !== false ? 'required' : ''
  const placeholder = opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''
  if (type === 'textarea') return `<label class="wide">${esc(label)}<textarea name="${name}" ${required} ${placeholder} rows="3"></textarea></label>`
  return `<label>${esc(label)}<input name="${name}" type="${type}" ${required} ${placeholder}></label>`
}

const modalShell = (ey, title, desc, formInner) => `<div class="modal-layer" id="wsModal"><div class="modal-backdrop" data-close-modal></div><section class="modal-card ws-modal-card"><button class="modal-close" data-close-modal aria-label="Kapat">${icon('x', 20)}</button><span class="eyebrow">${ey}</span><h2>${title}</h2><p class="modal-desc">${desc}</p><form id="wsModalForm" class="modern-form"><div class="form-grid">${formInner}</div><div class="modal-actions"><span class="modal-msg" id="wsModalMsg"></span><button type="button" class="button button-secondary" data-close-modal>Vazgeç</button><button class="button button-primary" type="submit">Kaydet</button></div></form></section></div>`

const forms = {
  courses: () => modalShell('AKADEMİK', 'Ders Oluştur', 'Yeni bir ders veya içerik kaydı oluştur.', modalField('title', 'Ders adı', 'text', { placeholder: 'Örn: Türev' }) + modalField('subject', 'Konu', 'text', { placeholder: 'Örn: Matematik' }) + modalField('description', 'Açıklama', 'textarea', { required: false, placeholder: 'Ders içeriği hakkında kısa bilgi' })),
  assignments: () => modalShell('AKADEMİK', 'Ödev Oluştur', 'Öğrencilere yeni ödev ata.', modalField('title', 'Ödev adı', 'text', { placeholder: 'Örn: Türev konusu soruları' }) + modalField('dueAt', 'Teslim tarihi', 'datetime-local') + modalField('description', 'Açıklama', 'textarea', { required: false, placeholder: 'Ödev detayları' })),
  exams: () => modalShell('ÖLÇME', 'Sınav Oluştur', 'Yeni sınav kaydı oluştur.', modalField('title', 'Sınav adı', 'text', { placeholder: 'Örn: TYT Matematik Denemesi' }) + modalField('subject', 'Ders', 'text', { placeholder: 'Örn: Matematik' }) + modalField('startsAt', 'Tarih', 'datetime-local') + modalField('durationMinutes', 'Süre (dakika)', 'number', { placeholder: '60' })),
  coaching: () => modalShell('KOÇLUK', 'Hedef Ekle', 'Öğrenci için koçluk planı oluştur.', modalField('studentId', 'Öğrenci ID', 'text', { placeholder: 'Öğrenci kimliği' }) + modalField('goal', 'Hedef', 'text', { placeholder: 'Örn: Haftalık 20 soru çöz' }) + modalField('notes', 'Notlar', 'textarea', { required: false, placeholder: 'Plan detayları' }) + modalField('nextReviewAt', 'Sonraki gözden geçirme', 'date', { required: false })),
  evaluations: () => modalShell('DEĞERLENDİRME', 'Değerlendirme', 'Öğrenci için değerlendirme kaydet.', modalField('studentId', 'Öğrenci ID', 'text', { placeholder: 'Öğrenci kimliği' }) + modalField('title', 'Başlık', 'text', { placeholder: 'Örn: 1. Dönem Performans' }) + modalField('score', 'Puan', 'number', { placeholder: '85' }) + modalField('feedback', 'Geri bildirim', 'textarea', { required: false, placeholder: 'Açıklama' })),
  progress: () => modalShell('GELİŞİM', 'İlerleme Ekle', 'Gelişim kaydı oluştur.', modalField('metric', 'Metrik', 'text', { placeholder: 'Örn: Çözülen soru sayısı' }) + modalField('value', 'Değer', 'number', { placeholder: '120' }) + modalField('target', 'Hedef', 'number', { required: false, placeholder: '200' }) + modalField('period', 'Dönem', 'text', { placeholder: 'Örn: 2026-08' })),
  videos: () => modalShell('ÖĞRENME', 'Video Ekle', 'Video ders kaydı oluştur.', modalField('title', 'Video adı', 'text', { placeholder: 'Örn: Limit konu anlatımı' }) + modalField('url', 'Video URL', 'url', { placeholder: 'https://…' }) + modalField('subject', 'Ders', 'text', { placeholder: 'Örn: Matematik' }) + modalField('description', 'Açıklama', 'textarea', { required: false, placeholder: 'Video içeriği' })),
  messages: () => modalShell('İLETİŞİM', 'Yeni Mesaj', 'Kullanıcıya mesaj gönder.', modalField('receiverId', 'Alıcı ID', 'text', { placeholder: 'Alıcı kimliği' }) + modalField('body', 'Mesaj', 'textarea', { placeholder: 'Mesajınız' })),
  calendar: () => modalShell('PLANLAMA', 'Plan Ekle', 'Takvime yeni etkinlik ekle.', modalField('title', 'Başlık', 'text', { placeholder: 'Örn: Matematik çalışması' }) + modalField('startAt', 'Başlangıç', 'datetime-local') + modalField('endAt', 'Bitiş', 'datetime-local', { required: false }) + modalField('description', 'Açıklama', 'textarea', { required: false, placeholder: 'Etkinlik detayı' })),
  teachers: () => modalShell('KULLANICILAR', 'Öğretmen Ekle', 'Yeni öğretmen hesabı oluştur.', modalField('username', 'Kullanıcı adı', 'text', { placeholder: 'ornek' }) + modalField('fullName', 'Ad Soyad', 'text', { placeholder: 'Ad Soyad' }) + modalField('email', 'E-posta', 'email', { required: false, placeholder: 'ornek@email.com' }) + modalField('password', 'Şifre', 'password', { placeholder: 'En az 8 karakter' })),
  classes: () => modalShell('KULLANICILAR', 'Yeni Grup', 'Sınıf veya grup oluştur.', modalField('name', 'Grup adı', 'text', { placeholder: 'Örn: 12-A Sınıfı' }) + `<label class="wide">Açıklama<textarea name="description" rows="2" placeholder="İsteğe bağlı"></textarea></label>`),
  students: () => modalShell('KULLANICILAR', 'Öğrenci Ekle', 'Yeni öğrenci hesabı oluştur.', modalField('username', 'Kullanıcı adı', 'text', { placeholder: 'ornek' }) + modalField('fullName', 'Ad Soyad', 'text', { placeholder: 'Ad Soyad' }) + modalField('email', 'E-posta', 'email', { required: false, placeholder: 'ornek@email.com' }) + modalField('password', 'Şifre', 'password', { placeholder: 'En az 8 karakter' }) + `<label>Sınıf seviyesi<input name="gradeLevel" type="text" placeholder="Örn: 12. sınıf"></label>` + `<label>Okul adı<input name="schoolName" type="text" placeholder="İsteğe bağlı"></label>` + `<label class="wide">Hedef<textarea name="goal" rows="2" placeholder="İsteğe bağlı"></textarea></label>`)
}

export const renderWorkspace = async (app, user, onLogout) => {
  app.innerHTML = `<div class="workspace"><aside class="workspace-sidebar" id="workspaceSidebar"><div class="workspace-brand"><span class="brand-mark">M</span><div><strong>Matematik Koçum</strong><small>Eğitim Yönetim Sistemi</small></div></div><div class="workspace-role"><span class="role-dot"></span>${roles[user.role] || 'Kullanıcı'}</div><nav>${nav(user.role)}</nav><div class="workspace-side-bottom"><button class="logout-button" id="workspaceLogout">${icon('logout', 18)} <span>Güvenli Çıkış</span></button><button class="sidebar-collapse-btn" id="sidebarCollapse" aria-label="Menüyü daralt" title="Daralt">${icon('panelLeft', 18)}</button></div></aside><section class="workspace-main"><header class="workspace-header"><button class="mobile-menu" id="mobileMenu">${icon('menu', 22)}</button><div class="header-title"><span class="eyebrow">${roles[user.role] || 'PANEL'}</span><h1 id="workspaceTitle">Genel Bakış</h1></div><div class="workspace-header-actions"><button class="header-icon" id="globalTheme">${icon('sun', 20)}</button><button class="header-icon" id="globalRefresh">${icon('refresh', 20)}</button><div class="profile-chip"><div class="profile-avatar">${esc((user.fullName || user.username).slice(0, 1).toUpperCase())}</div><div><strong>${esc(user.fullName || user.username)}</strong><small>@${esc(user.username)}</small></div></div></div></header><main id="workspaceContent" class="workspace-content"></main><div id="wsModalHost"></div></section></div>`

  const content = app.querySelector('#workspaceContent')
  let current = 'dashboard'
  let calDate = new Date()
  let selectedDate = new Date()

  const apiCache = new Map()
  const get = async (resource, ttl = 5000) => {
    const hit = apiCache.get(resource)
    if (hit && Date.now() - hit.t < ttl) return hit.d
    const r = await fetch(`/api/app?resource=${encodeURIComponent(resource)}`, { credentials: 'same-origin' })
    const d = await r.json()
    if (!r.ok || !d.ok) throw new Error(d.error || 'Veri alınamadı.')
    apiCache.set(resource, { t: Date.now(), d })
    return d
  }
  const post = async (resource, body, method = 'POST') => {
    const r = await fetch(`/api/app?resource=${encodeURIComponent(resource)}`, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await r.json()
    if (!r.ok || !d.ok) throw new Error(d.error || 'İşlem başarısız.')
    apiCache.clear()
    return d
  }

  const heading = (ey, title, text, action = '') => `<div class="workspace-heading"><div><span class="eyebrow">${ey}</span><h2>${title}</h2><p>${text}</p></div>${action}</div>`
  const card = (title, body) => `<section class="surface-card"><div class="surface-head"><h3>${title}</h3></div>${body}</section>`
  const stat = (l, v, m, i) => `<div class="metric-card"><div class="metric-icon">${icon(i, 20)}</div><span>${l}</span><strong>${v ?? 0}</strong><small>${m}</small></div>`

  const hub = (id, title, iconName, summary, content_html, open = false) => `<section class="hub-panel${open ? ' open' : ''}" data-hub="${id}"><button class="hub-header" data-hub-toggle="${id}" aria-expanded="${open}" aria-controls="hub-body-${id}"><span class="hub-icon">${icon(iconName, 20)}</span><span class="hub-title"><strong>${title}</strong><small>${summary}</small></span><span class="hub-chevron">${icon('chevronDown', 18)}</span></button><div class="hub-body" id="hub-body-${id}"><div class="hub-body-inner">${content_html}</div></div></section>`

  const dashboard = async () => {
    const d = (await get('dashboard', 2000)).data || {}
    const s = d.stats || {}
    const eventsHtml = d.events?.length ? `<div class="timeline">${d.events.slice(0, 6).map(e => `<div class="timeline-row"><span>${new Date(e.start_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span><div><b>${esc(e.title)}</b><small>${esc(e.description || e.type || 'Plan')}</small></div></div>`).join('')}</div>` : empty('Bugün için plan yok', 'Takvimden yeni bir çalışma veya ders planlayabilirsin.')
    content.innerHTML = heading('KONTROL MERKEZİ', `Hoş geldin, ${esc(user.fullName || user.username)}.`, 'Bugünkü eğitim yolculuğunun tamamı burada.') + `<div class="metric-grid">${stat('Dersler', s.courses, 'Aktif içerikler', 'book')}${stat('Ödevler', s.assignments, 'Takip edilen', 'check')}${stat('Sınavlar', s.exams, 'Ölçme kayıtları', 'clipboard')}${stat('Mesajlar', s.messages, `${s.unreadMessages || 0} okunmamış`, 'mail')}</div><div class="hub-container"><div class="hub-main">${hub('today-plan', 'Bugünkü Plan', 'calendar', `${d.events?.length || 0} etkinlik`, eventsHtml, true)}${hub('quick-access', 'Hızlı Erişim', 'grid', 'Kısayollar', `<div class="quick-actions"><button data-page="calendar">${icon('calendar', 20)}<b>Takvim</b><small>Gününü planla</small></button><button data-page="assignments">${icon('check', 20)}<b>Ödevler</b><small>Çalışmalarını takip et</small></button><button data-page="progress">${icon('trending', 20)}<b>Gelişim</b><small>Performansını incele</small></button><button data-page="messages">${icon('mail', 20)}<b>Mesajlar</b><small>İletişime geç</small></button></div>`, false)}</div><div class="hub-side">${hub('goals', 'Hedefler', 'target', 'Koçluk planları', d.goals?.length ? d.goals.slice(0, 4).map(g => `<div class="data-row"><div><b>${esc(g.goal || 'Hedef')}</b><small>${esc(g.status || 'Aktif')}</small></div><span class="status-badge ${g.status || 'active'}">${esc(g.status || 'Aktif')}</span></div>`).join('') : empty('Hedef yok', 'Henüz koçluk planı eklenmemiş.'), false)}${hub('progress', 'İlerleme', 'trending', 'Gelişim kayıtları', d.progress?.length ? d.progress.slice(0, 6).map(p => `<div class="data-row"><div><b>${esc(p.metric)}</b><small>${esc(p.period || '')} · ${p.value || 0}${p.target ? '/' + p.target : ''}</small></div></div>`).join('') : empty('Kayıt yok', 'İlerleme verisi henüz yok.'), false)}${hub('activity', 'Son Aktiviteler', 'activity', 'Sistem hareketleri', d.activity?.length ? d.activity.slice(0, 6).map(a => `<div class="data-row"><div><b>${esc(a.action)}</b><small>${esc(a.full_name || a.username || 'Sistem')}</small></div></div>`).join('') : empty('Aktivite yok', 'Sistem hareketleri burada görünecek.'), false)}</div></div>`
  }

  let calTeacherId = user.role === 'teacher' ? user.id : null
  let calTeachers = []
  let calEvents = []
  let calBlocks = []
  let calRole = user.role

  const HOURS = Array.from({ length: 16 }, (_, i) => i + 8)
  const SLOT_STATUSES = { open: { label: 'Açık', cls: 'open', color: 'var(--success)' }, busy: { label: 'Dolu', cls: 'busy', color: 'var(--primary)' }, closed: { label: 'Kapalı', cls: 'closed', color: 'var(--danger)' }, past: { label: 'Geçmiş', cls: 'past', color: 'var(--text-muted)' } }

  const calApi = async (action, params = {}, method = 'GET') => {
    const url = `/api/calendar?action=${action}` + (method === 'GET' ? '&' + new URLSearchParams(params).toString() : '')
    const opts = method === 'GET' ? { credentials: 'same-origin' } : { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }
    const r = await fetch(url, opts)
    const d = await r.json()
    if (!r.ok || !d.ok) throw new Error(d.error || 'Takvim hatası.')
    return d
  }

  const timeToMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0) }
  const overlap = (aS, aE, bS, bE) => aS < bE && bS < aE
  const todayStr = () => new Date().toISOString().slice(0, 10)

  const slotStatus = (ds, hour, events, blocks) => {
    const slotStart = timeToMin(hour)
    const slotEnd = slotStart + 60
    if (ds < todayStr()) return 'past'
    if (ds === todayStr() && slotEnd <= timeToMin(new Date().toTimeString().slice(0, 5))) return 'past'
    for (const e of events) { const eD = (e.start_at || '').slice(0, 10); if (eD !== ds) continue; const eS = timeToMin((e.start_at || '').slice(11, 16)); const eE = timeToMin((e.end_at || '').slice(11, 16)); if (overlap(slotStart, slotEnd, eS, eE)) return 'busy' }
    for (const b of blocks) { if (b.date !== ds) continue; const bS = timeToMin(b.start_time); const bE = timeToMin(b.end_time); if (overlap(slotStart, slotEnd, bS, bE)) return 'closed' }
    return 'open'
  }

  const daySummary = (ds, events, blocks) => {
    let busy = 0, closed = 0, past = 0
    for (const h of HOURS) { const s = slotStatus(ds, h + ':00', events, blocks); if (s === 'busy') busy++; else if (s === 'closed') closed++; else if (s === 'past') past++ }
    return { lessons: busy, closed, open: Math.max(0, HOURS.length - busy - closed - past) }
  }

  const calendar = async () => {
    const y = calDate.getFullYear(), m = calDate.getMonth()
    const firstDay = new Date(y, m, 1), daysInMonth = new Date(y, m + 1, 0).getDate()
    const offset = (firstDay.getDay() + 6) % 7
    const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const monthEnd = `${y}-${String(m + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const sel = selectedDate.toISOString().slice(0, 10)

    try {
      const d = await calApi('view', { start: monthStart, end: monthEnd, teacherId: calTeacherId })
      calEvents = d.events || []
      calBlocks = d.blocks || []
      calTeachers = d.teachers || []
      calTeacherId = d.teacherId || calTeacherId
      calRole = d.role || user.role
    } catch (e) { calEvents = []; calBlocks = [] }

    const canManage = calRole === 'admin' || calRole === 'teacher'
    const byDay = {}
    calEvents.forEach(e => { const k = (e.start_at || '').slice(0, 10); (byDay[k] ??= []).push(e) })
    const blocksByDay = {}
    calBlocks.forEach(b => { (blocksByDay[b.date] ??= []).push(b) })

    const cells = []
    for (let i = 0; i < offset; i++) cells.push('<div class="calendar-cell empty"></div>')
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const summary = daySummary(ds, calEvents, calBlocks)
      const isPast = ds < todayStr()
      cells.push(`<button class="calendar-cell ${ds === sel ? 'selected' : ''} ${isPast ? 'past-day' : ''}" data-cal-date="${ds}" ${isPast ? 'disabled' : ''} aria-label="${day} ${new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(calDate)}"><span class="cal-day-num">${day}</span>${summary.lessons > 0 ? `<i class="cal-dot busy"></i>` : ''}${summary.closed > 0 && summary.lessons === 0 ? `<i class="cal-dot closed"></i>` : ''}${canManage && !isPast ? `<div class="cal-cell-stats"><span>${summary.lessons} ders</span><span>${summary.open} açık</span>${summary.closed > 0 ? `<span>${summary.closed} kapalı</span>` : ''}</div>` : `<div class="cal-cell-stats"><span>${summary.lessons} ders</span></div>`}</button>`)
    }

    const slotsHtml = HOURS.map(h => {
      const hour = h + ':00'
      const status = slotStatus(sel, hour, calEvents, calBlocks)
      const st = SLOT_STATUSES[status]
      const event = calEvents.find(e => { const eD = (e.start_at || '').slice(0, 10); if (eD !== sel) return false; const eS = timeToMin((e.start_at || '').slice(11, 16)); const eE = timeToMin((e.end_at || '').slice(11, 16)); return overlap(timeToMin(hour), timeToMin(hour) + 60, eS, eE) })
      let action = ''
      if (status === 'open' && canManage) action = `<button class="slot-action" data-slot-book="${hour}">Ders Planla</button>`
      else if (status === 'open' && !canManage) action = `<span class="slot-avail">Müsait</span>`
      else if (status === 'busy' && canManage) action = `<button class="slot-action danger" data-slot-delete="${event?.id || ''}">Sil</button>`
      else if (status === 'closed' && canManage) action = `<button class="slot-action" data-slot-unblock="${hour}">Aç</button>`
      else if (status === 'closed' && !canManage) action = `<span class="slot-closed-label">Kapalı</span>`
      else if (status === 'past') action = `<span class="slot-past-label">Geçmiş</span>`
      return `<div class="cal-slot ${st.cls}" data-hour="${hour}"><span class="slot-time">${h.toString().padStart(2, '0')}:00</span><span class="slot-status ${st.cls}">${st.label}</span>${event ? `<span class="slot-event">${esc(event.title)}</span>` : ''}${action}</div>`
    }).join('')

    const teacherSelect = calRole === 'admin' && calTeachers.length ? `<select id="calTeacherSelect" class="cal-teacher-select">${calTeachers.map(t => `<option value="${t.id}" ${t.id === calTeacherId ? 'selected' : ''}>${esc(t.full_name)}</option>`).join('')}</select>` : ''
    const selectedBlocks = calBlocks.filter(b => b.date === sel)
    const dayToggleBtn = canManage ? `<button class="button button-secondary cal-day-toggle" data-day-toggle="${sel}">${selectedBlocks.length > HOURS.length / 2 ? icon('unlock', 16) + ' Günü Aç' : icon('lock', 16) + ' Günü Kapat'}</button>` : ''
    const bulkBtn = canManage ? `<button class="button button-secondary" data-bulk-open>${icon('grid', 16)} Toplu İşlem</button>` : ''

    content.innerHTML = heading('PLANLAMA', 'Takvim', 'Ders saatlerini, çalışma planlarını ve müsaitlik durumunu tek ekrandan yönetin.', canManage ? `<button class="button button-primary" data-lesson-open>${icon('calendarPlus', 18)} Ders Planla</button>` : '') + `<div class="calendar-toolbar-modern">${teacherSelect}<button data-cal-prev>${icon('chevronLeft', 20)}</button><strong>${new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(calDate)}</strong><button data-cal-next>${icon('chevronRight', 20)}</button><button data-cal-today class="button button-secondary">Bugün</button></div><div class="calendar-layout-modern"><section class="surface-card monthly-panel"><div class="calendar-panel-head"><div><h3>Aylık takvim</h3><p>${canManage ? 'Dersleri ve saatleri yönet' : 'Ders programını görüntüle'}</p></div><div class="calendar-legend"><span><i class="dot busy-dot"></i>Ders</span><span><i class="dot closed-dot"></i>Kapalı</span><span><i class="dot open-dot"></i>Açık</span></div></div><div class="weekday-row">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(x => `<span>${x}</span>`).join('')}</div><div class="month-grid">${cells.join('')}</div></section><aside class="surface-card day-panel"><div class="day-panel-head"><div><h3>${new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: '2-digit', month: 'long' }).format(selectedDate)}</h3><p>Saatlik program</p></div><div class="day-actions">${dayToggleBtn} ${bulkBtn}</div></div><div class="cal-slots">${slotsHtml}</div></aside></div>`

    if (calRole === 'admin') {
      const sel2 = content.querySelector('#calTeacherSelect')
      if (sel2) sel2.addEventListener('change', () => { calTeacherId = sel2.value; show('calendar') })
    }
  }

  const listPage = async (resource, ey, title, text, label = '') => {
    const d = await get(resource, 10000)
    const items = d.items || d.data?.items || []
    const action = label ? `<button class="button button-primary" data-add="${resource}">${icon('plus', 18)} ${label}</button>` : ''
    const rows = items.length ? items.map(x => `<article class="data-row"><div><b>${esc(x.title || x.name || x.subject || x.goal || 'Kayıt')}</b><span>${esc(x.description || x.body || x.feedback || x.full_name || x.student_name || '')}</span><small>${date(x.created_at || x.due_at || x.starts_at || x.start_at || x.next_review_at)}</small></div><span class="status-badge ${x.status || 'active'}">${esc(x.status || 'Aktif')}</span></article>`).join('') : empty('Henüz kayıt yok', 'Bu bölümde kayıt oluştuğunda burada görünecek.')
    content.innerHTML = heading(ey, title, text, action) + card(title, `<div class="data-list">${rows}</div>`)
  }

  const teachersPage = async () => {
    const d = await get('teachers', 10000)
    const items = d.items || []
    const action = user.role === 'admin' ? `<button class="button button-primary" data-add="teachers">${icon('plus', 18)} Öğretmen Ekle</button>` : ''
    const rows = items.length ? items.map(x => `<article class="data-row"><div><b>${esc(x.full_name || x.username)}</b><span>@${esc(x.username)}${x.email ? ' · ' + esc(x.email) : ''}</span><small>${x.student_count || 0} öğrenci</small></div><span class="status-badge ${x.is_active ? 'active' : 'inactive'}">${x.is_active ? 'Aktif' : 'Pasif'}</span></article>`).join('') : empty('Henüz öğretmen yok', 'Sisteme öğretmen eklendiğinde burada görünecek.')
    content.innerHTML = heading('KULLANICILAR', 'Öğretmenler', 'Öğretmen hesaplarını yönet.', action) + card('Öğretmen Listesi', `<div class="data-list">${rows}</div>`)
  }

  const studentsPage = async () => {
    const d = await get('students', 10000)
    const items = d.items || []
    const canAdd = user.role === 'admin' || user.role === 'teacher'
    const action = canAdd ? `<button class="button button-primary" data-add="students">${icon('plus', 18)} Öğrenci Ekle</button>` : ''
    const rows = items.length ? items.map(x => `<article class="data-row"><div><b>${esc(x.full_name || x.username)}</b><span>@${esc(x.username)}${x.email ? ' · ' + esc(x.email) : ''}</span><small>${esc(x.grade_level || '')}${x.group_name ? ' · ' + esc(x.group_name) : ''}${x.teacher_name ? ' · ' + esc(x.teacher_name) : ''}</small></div><span class="status-badge active">Öğrenci</span></article>`).join('') : empty('Henüz öğrenci yok', 'Sisteme öğrenci eklendiğinde burada görünecek.')
    content.innerHTML = heading('KULLANICILAR', 'Öğrenciler', 'Öğrenci hesaplarını yönet.', action) + card('Öğrenci Listesi', `<div class="data-list">${rows}</div>`)
  }

  const classesPage = async () => {
    const d = await get('classes', 10000)
    const items = d.items || []
    const canAdd = user.role === 'admin' || user.role === 'teacher'
    const action = canAdd ? `<button class="button button-primary" data-add="classes">${icon('plus', 18)} Yeni Grup</button>` : ''
    const rows = items.length ? items.map(x => `<article class="data-row"><div><b>${esc(x.name)}</b><span>${esc(x.description || '')}</span><small>${x.teacher_name ? 'Öğretmen: ' + esc(x.teacher_name) : ''}${x.student_count != null ? ' · ' + x.student_count + ' öğrenci' : ''}</small></div><span class="status-badge active">Grup</span></article>`).join('') : empty('Henüz grup yok', 'Sisteme grup eklendiğinde burada görünecek.')
    content.innerHTML = heading('KULLANICILAR', 'Sınıf & Grup Yönetimi', 'Sınıf ve grupları yönet.', action) + card('Grup Listesi', `<div class="data-list">${rows}</div>`)
  }

  const activityPage = async () => {
    const d = await get('activity', 10000)
    const items = d.items || []
    const rows = items.length ? items.map(x => `<article class="data-row"><div><b>${esc(x.action)}</b><span>${esc(x.full_name || x.username || 'Sistem')}</span><small>${date(x.created_at)}</small></div></article>`).join('') : empty('Aktivite yok', 'Sistem hareketleri burada görünecek.')
    content.innerHTML = heading('SİSTEM', 'Aktivite', 'Sistem hareketlerini incele.') + card('Son Hareketler', `<div class="data-list">${rows}</div>`)
  }

  const reportsPage = async () => {
    const d = await get('reports', 10000)
    const r = (d.items || [])[0] || {}
    content.innerHTML = heading('ANALİZ', 'Raporlar', 'Platform verilerini sade özetlerle incele.') + `<div class="metric-grid">${stat('Öğretmenler', r.teacherCount, 'Aktif', 'graduation')}${stat('Öğrenciler', r.studentCount, 'Aktif', 'users')}${stat('Dersler', r.courseCount, 'Toplam', 'book')}${stat('Gruplar', r.groupCount, 'Toplam', 'grid')}</div><div class="metric-grid">${stat('Sınavlar', r.examCount, 'Toplam', 'clipboard')}${stat('Ödevler', r.assignmentCount, 'Toplam', 'check')}${stat('Mesajlar', r.messageCount, 'Toplam', 'mail')}</div>`
  }

  const settingsPage = async () => {
    let settings = {}
    try { settings = (await get('settings', 5000)).settings || {} } catch {}
    content.innerHTML = heading('SİSTEM', 'Ayarlar', 'Hesap ve görünüm tercihlerini yönet.') + `<section class="surface-card"><div class="surface-head"><h3>Hesap Bilgileri</h3></div><div class="settings-summary"><div class="profile-avatar">${esc((user.fullName || user.username).slice(0, 1).toUpperCase())}</div><div class="settings-info"><b>${esc(user.fullName || user.username)}</b><span>@${esc(user.username)}</span><small>${roles[user.role] || user.role}</small></div></div></section>` + `<section class="surface-card"><div class="surface-head"><h3>Şifre Değiştir</h3></div><form id="passwordForm" class="modern-form"><div class="form-grid"><label>Mevcut şifre<input name="currentPassword" type="password" required placeholder="••••••••"></label><label>Yeni şifre<input name="newPassword" type="password" required placeholder="En az 8 karakter"></label><label>Yeni şifre tekrar<input name="confirmPassword" type="password" required placeholder="Tekrar girin"></label></div><div class="modal-actions"><span class="modal-msg" id="pwMsg"></span><button class="button button-primary" type="submit">Şifreyi Güncelle</button></div></form></section>`
    const pwForm = content.querySelector('#passwordForm')
    const pwMsg = content.querySelector('#pwMsg')
    if (pwForm) pwForm.addEventListener('submit', async e => {
      e.preventDefault()
      const data = Object.fromEntries(new FormData(e.currentTarget).entries())
      if (data.newPassword !== data.confirmPassword) { pwMsg.textContent = 'Yeni şifre tekrarı eşleşmiyor.'; return }
      if (data.newPassword.length < 8) { pwMsg.textContent = 'Yeni şifre en az 8 karakter olmalı.'; return }
      pwMsg.textContent = 'Güncelleniyor…'
      try {
        const r = await fetch('/api/auth/change-password', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        const d = await r.json()
        if (!r.ok || !d.ok) throw new Error(d.error || 'İşlem başarısız.')
        pwMsg.textContent = 'Şifre başarıyla güncellendi.'
        pwForm.reset()
      } catch (err) { pwMsg.textContent = err.message }
    })
  }

  const pages = {
    dashboard,
    calendar,
    courses: () => listPage('courses', 'AKADEMİK', 'Dersler', 'Derslerini ve içeriklerini yönet.', 'Ders Oluştur'),
    assignments: () => listPage('assignments', 'AKADEMİK', 'Ödevler', 'Teslim tarihlerini ve çalışmalarını takip et.', 'Ödev Oluştur'),
    exams: () => listPage('exams', 'ÖLÇME', 'Sınavlar', 'Sınav takvimini ve sonuçlarını incele.', 'Sınav Oluştur'),
    coaching: () => listPage('coaching', 'KOÇLUK', 'Koçluk', 'Hedeflerini ve takip planlarını yönet.', 'Hedef Ekle'),
    evaluations: () => listPage('evaluations', 'DEĞERLENDİRME', 'Değerlendirmeler', 'Geri bildirimleri takip et.', 'Değerlendirme'),
    progress: () => listPage('progress', 'GELİŞİM', 'Gelişim Merkezi', 'Performansını ölç ve hedeflerinle karşılaştır.', 'İlerleme Ekle'),
    videos: () => listPage('videos', 'ÖĞRENME', 'Video Dersler', 'Konu anlatımlarını tek kütüphanede bul.', 'Video Ekle'),
    messages: () => listPage('messages', 'İLETİŞİM', 'Mesajlar', 'Güvenli iletişim merkezinden mesajlarını yönet.', 'Yeni Mesaj'),
    reports: reportsPage,
    students: studentsPage,
    teachers: teachersPage,
    classes: classesPage,
    activity: activityPage,
    settings: settingsPage
  }

  const show = async (page) => {
    current = page
    app.querySelectorAll('.workspace-nav').forEach(b => b.classList.toggle('active', b.dataset.page === page))
    app.querySelector('#workspaceTitle').textContent = labels[page] || 'Panel'
    content.innerHTML = '<div class="workspace-loading"><span></span><span></span><span></span></div>'
    closeMobileNav()
    try { await (pages[page] || dashboard)() } catch (e) {
      content.innerHTML = `<div class="error-state">${icon('alert', 24)}<b>Bir sorun oluştu.</b><span>${esc(e.message)}</span><button class="button button-secondary" data-retry>Tekrar dene</button></div>`
    }
  }

  const modalHost = app.querySelector('#wsModalHost')
  const openModal = (resource) => {
    const formFn = forms[resource]
    if (!formFn) return
    modalHost.innerHTML = formFn()
    document.body.style.overflow = 'hidden'
    const layer = modalHost.querySelector('#wsModal')
    const form = modalHost.querySelector('#wsModalForm')
    const msg = modalHost.querySelector('#wsModalMsg')
    const close = () => { modalHost.innerHTML = ''; document.body.style.overflow = '' }
    modalHost.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', close))
    form.addEventListener('submit', async e => {
      e.preventDefault()
      const data = Object.fromEntries(new FormData(e.currentTarget).entries())
      msg.textContent = 'Kaydediliyor…'
      try {
        await post(resource, data)
        close()
        await show(current)
      } catch (err) {
        msg.textContent = err.message || 'Kaydetme başarısız.'
      }
    })
    form.querySelector('input')?.focus()
  }

  const sidebarEl = app.querySelector('.workspace-sidebar')
  const closeMobileNav = () => {
    sidebarEl.classList.remove('open')
    const bd = app.querySelector('#mobileBackdrop')
    if (bd) bd.remove()
    document.body.style.overflow = ''
  }
  const openMobileNav = () => {
    sidebarEl.classList.add('open')
    if (!app.querySelector('#mobileBackdrop')) {
      const bd = document.createElement('div')
      bd.id = 'mobileBackdrop'
      bd.className = 'mobile-backdrop'
      bd.addEventListener('click', closeMobileNav)
      app.appendChild(bd)
    }
    document.body.style.overflow = 'hidden'
  }

  app.addEventListener('click', async e => {
    const navToggle = e.target.closest('[data-nav-toggle]')
    if (navToggle) {
      const section = navToggle.closest('.nav-accordion')
      const isOpen = section.classList.toggle('collapsed')
      navToggle.setAttribute('aria-expanded', !isOpen)
      return
    }
    const n = e.target.closest('[data-page]')
    if (n) { await show(n.dataset.page); return }
    if (e.target.closest('[data-retry]')) { await show(current); return }
    const addBtn = e.target.closest('[data-add]')
    if (addBtn) { openModal(addBtn.dataset.add); return }
    const hubToggle = e.target.closest('[data-hub-toggle]')
    if (hubToggle) {
      const panel = hubToggle.closest('.hub-panel')
      const isOpen = panel.classList.toggle('open')
      hubToggle.setAttribute('aria-expanded', isOpen)
      return
    }
    if (e.target.closest('[data-cal-prev]')) { calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1); await show('calendar'); return }
    if (e.target.closest('[data-cal-next]')) { calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1); await show('calendar'); return }
    if (e.target.closest('[data-cal-today]')) { calDate = new Date(); selectedDate = new Date(); await show('calendar'); return }
    const day = e.target.closest('[data-cal-date]')
    if (day && !day.disabled) { selectedDate = new Date(day.dataset.calDate + 'T12:00:00'); await show('calendar'); return }
    const slotBook = e.target.closest('[data-slot-book]')
    if (slotBook) { openLessonModal(slotBook.dataset.slotBook); return }
    const slotDelete = e.target.closest('[data-slot-delete]')
    if (slotDelete && slotDelete.dataset.slotDelete) { await deleteEvent(slotDelete.dataset.slotDelete); return }
    const slotUnblock = e.target.closest('[data-slot-unblock]')
    if (slotUnblock) { await toggleSlot(slotUnblock.dataset.slotUnblock); return }
    const dayToggle = e.target.closest('[data-day-toggle]')
    if (dayToggle) { await toggleDay(dayToggle.dataset.dayToggle); return }
    const bulkOpen = e.target.closest('[data-bulk-open]')
    if (bulkOpen) { openBulkModal(); return }
    const lessonOpen = e.target.closest('[data-lesson-open]')
    if (lessonOpen) { openLessonModal(); return }
  })

  app.querySelector('#workspaceLogout').addEventListener('click', async () => { await onLogout(); location.reload() })
  app.querySelector('#globalRefresh').addEventListener('click', () => show(current))
  app.querySelector('#globalTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('mk_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  })
  app.querySelector('#mobileMenu').addEventListener('click', () => {
    if (sidebarEl.classList.contains('open')) closeMobileNav()
    else openMobileNav()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarEl.classList.contains('open')) closeMobileNav()
  })
  const sidebar = app.querySelector('#workspaceSidebar')
  const collapseBtn = app.querySelector('#sidebarCollapse')
  if (collapseBtn) {
    if (localStorage.getItem('mk_sidebar') === 'collapsed') sidebar.classList.add('collapsed')
    collapseBtn.addEventListener('click', () => {
      const isCollapsed = sidebar.classList.toggle('collapsed')
      localStorage.setItem('mk_sidebar', isCollapsed ? 'collapsed' : 'expanded')
      collapseBtn.setAttribute('aria-label', isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt')
      collapseBtn.title = isCollapsed ? 'Genişlet' : 'Daralt'
    })
  }
  const openLessonModal = (presetHour) => {
    const ds = selectedDate.toISOString().slice(0, 10)
    const startHour = presetHour || '09:00'
    const endHour = String(Number(startHour.split(':')[0]) + 1).padStart(2, '0') + ':00'
    const html = modalShell('DERS PLANLAMA', 'Ders Planla', 'Açık saate yeni ders ekle.', modalField('title', 'Ders adı', 'text', { placeholder: 'Örn: Matematik — Türev' }) + `<label>Tarih<input name="date" type="date" required value="${ds}"></label>` + `<label>Başlangıç<select name="startTime" required>${HOURS.map(h => `<option value="${h}:00" ${h + ':00' === startHour ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select></label>` + `<label>Bitiş<select name="endTime" required>${HOURS.map(h => `<option value="${h}:00" ${h + ':00' === endHour ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select></label>` + modalField('description', 'Açıklama', 'textarea', { required: false, placeholder: 'Ders içeriği' }))
    modalHost.innerHTML = html
    document.body.style.overflow = 'hidden'
    const form = modalHost.querySelector('#wsModalForm')
    const msg = modalHost.querySelector('#wsModalMsg')
    const close = () => { modalHost.innerHTML = ''; document.body.style.overflow = '' }
    modalHost.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', close))
    form.addEventListener('submit', async e => {
      e.preventDefault()
      const data = Object.fromEntries(new FormData(e.currentTarget).entries())
      if (calTeacherId) data.teacherId = calTeacherId
      msg.textContent = 'Kaydediliyor…'
      try { await calApi('create-event', data, 'POST'); close(); await show('calendar') } catch (err) { msg.textContent = err.message }
    })
    form.querySelector('input')?.focus()
  }

  const deleteEvent = async (id) => {
    if (!confirm('Bu dersi silmek istediğine emin misin?')) return
    try { await calApi('delete-event', { id }, 'POST'); await show('calendar') } catch (err) { alert(err.message) }
  }

  const toggleSlot = async (hour) => {
    const ds = selectedDate.toISOString().slice(0, 10)
    try { await calApi('toggle-slot', { date: ds, hour, teacherId: calTeacherId }, 'POST'); await show('calendar') } catch (err) { alert(err.message) }
  }

  const toggleDay = async (ds) => {
    try { const r = await calApi('toggle-day', { date: ds, teacherId: calTeacherId }, 'POST'); alert(r.action === 'closed' ? `${r.closedCount} saat kapatıldı.${r.skipped ? ' ' + r.skipped + ' saat ders nedeniyle atlandı.' : ''}` : `${r.closedCount} saat açıldı.${r.skipped ? ' ' + r.skipped + ' saat ders nedeniyle değiştirilemedi.' : ''}`); await show('calendar') } catch (err) { alert(err.message) }
  }

  const openBulkModal = () => {
    const ds = selectedDate.toISOString().slice(0, 10)
    const dsEnd = ds
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    const dayOpts = days.map((d, i) => `<label class="bulk-day"><input type="checkbox" name="days" value="${i}" ${i >= 1 && i <= 5 ? 'checked' : ''}> ${d}</label>`).join('')
    const html = modalShell('TOPLU İŞLEM', 'Toplu Saat İşlemi', 'Tarih aralığında saatleri toplu aç veya kapat.', `<label>Başlangıç tarihi<input name="startDate" type="date" required value="${ds}"></label><label>Bitiş tarihi<input name="endDate" type="date" required value="${dsEnd}"></label><label>Başlangıç saati<select name="startTime">${HOURS.map(h => `<option value="${h}:00" ${h === 8 ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select></label><label>Bitiş saati<select name="endTime">${HOURS.map(h => `<option value="${h}:00" ${h === 18 ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select></label><div class="wide bulk-days">${dayOpts}</div><label class="wide">İşlem<select name="action"><option value="block">Kapat</option><option value="open">Aç</option></select></label>` + modalField('reason', 'Açıklama', 'text', { required: false, placeholder: 'İsteğe bağlı' }))
    modalHost.innerHTML = html
    document.body.style.overflow = 'hidden'
    const form = modalHost.querySelector('#wsModalForm')
    const msg = modalHost.querySelector('#wsModalMsg')
    const close = () => { modalHost.innerHTML = ''; document.body.style.overflow = '' }
    modalHost.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', close))
    form.addEventListener('submit', async e => {
      e.preventDefault()
      const fd = new FormData(e.currentTarget)
      const data = { startDate: fd.get('startDate'), endDate: fd.get('endDate'), startTime: fd.get('startTime'), endTime: fd.get('endTime'), action: fd.get('action'), reason: fd.get('reason') || '', daysOfWeek: fd.getAll('days').map(Number), teacherId: calTeacherId }
      msg.textContent = 'İşleniyor…'
      try { const r = await calApi('bulk-operation', data, 'POST'); alert(r.action === 'block' ? `${r.processed} saat kapatıldı.${r.skipped ? ' ' + r.skipped + ' saat ders nedeniyle atlandı.' : ''}` : `${r.processed} saat açıldı.${r.skipped ? ' ' + r.skipped + ' saat ders nedeniyle değiştirilemedi.' : ''}`); close(); await show('calendar') } catch (err) { msg.textContent = err.message }
    })
    form.querySelector('input')?.focus()
  }

  show('dashboard')
}

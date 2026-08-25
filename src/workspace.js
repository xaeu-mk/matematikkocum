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
    return ok.length ? `<div class="nav-section"><span>${title}</span>${ok.map(([k, l]) => `<button class="workspace-nav" data-page="${k}">${icon(navIcons[k] || 'home', 20)}<span>${l}</span></button>`).join('')}</div>` : ''
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
  calendar: () => modalShell('PLANLAMA', 'Plan Ekle', 'Takvime yeni etkinlik ekle.', modalField('title', 'Başlık', 'text', { placeholder: 'Örn: Matematik çalışması' }) + modalField('startAt', 'Başlangıç', 'datetime-local') + modalField('endAt', 'Bitiş', 'datetime-local', { required: false }) + modalField('description', 'Açıklama', 'textarea', { required: false, placeholder: 'Etkinlik detayı' }))
}

export const renderWorkspace = async (app, user, onLogout) => {
  app.innerHTML = `<div class="workspace"><aside class="workspace-sidebar" id="workspaceSidebar"><div class="workspace-brand"><span class="brand-mark">M</span><div><strong>Matematik Koçum</strong><small>Eğitim Yönetim Sistemi</small></div></div><div class="workspace-role"><span class="role-dot"></span>${roles[user.role] || 'Kullanıcı'}</div><nav>${nav(user.role)}</nav><div class="workspace-side-bottom"><button class="workspace-nav" data-page="settings">${icon('settings', 20)}<span>Ayarlar</span></button><button class="logout-button" id="workspaceLogout">${icon('logout', 18)} <span>Güvenli Çıkış</span></button><button class="sidebar-collapse-btn" id="sidebarCollapse" aria-label="Menüyü daralt" title="Daralt">${icon('panelLeft', 18)}</button></div></aside><section class="workspace-main"><header class="workspace-header"><button class="mobile-menu" id="mobileMenu">${icon('menu', 22)}</button><div class="header-title"><span class="eyebrow">${roles[user.role] || 'PANEL'}</span><h1 id="workspaceTitle">Genel Bakış</h1></div><div class="workspace-header-actions"><button class="header-icon" id="globalTheme">${icon('sun', 20)}</button><button class="header-icon" id="globalRefresh">${icon('refresh', 20)}</button><div class="profile-chip"><div class="profile-avatar">${esc((user.fullName || user.username).slice(0, 1).toUpperCase())}</div><div><strong>${esc(user.fullName || user.username)}</strong><small>@${esc(user.username)}</small></div></div></div></header><main id="workspaceContent" class="workspace-content"></main><div id="wsModalHost"></div></section></div>`

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

  const calendar = async () => {
    let d
    try { d = await get('calendar', 10000) } catch { d = { items: [] } }
    const items = d.items || d.data?.items || []
    const y = calDate.getFullYear(), m = calDate.getMonth()
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate()
    const offset = (first.getDay() + 6) % 7
    const sel = selectedDate.toISOString().slice(0, 10)
    const byDay = {}
    items.forEach(x => { const k = (x.start_at || x.lesson_date || x.date || '').slice(0, 10); (byDay[k] ??= []).push(x) })
    const cells = []
    for (let i = 0; i < offset; i++) cells.push('<div class="calendar-cell empty"></div>')
    for (let day = 1; day <= days; day++) {
      const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const events = byDay[k] || []
      cells.push(`<button class="calendar-cell ${k === sel ? 'selected' : ''}" data-cal-date="${k}"><span>${day}</span>${events.slice(0, 3).map(() => '<i></i>').join('')}</button>`)
    }
    const selected = byDay[sel] || []
    const canAdd = user.role === 'admin' || user.role === 'teacher'
    content.innerHTML = heading('PLANLAMA', 'Takvim', 'Ders saatlerini, çalışma planlarını ve günlük uygunluğu tek ekrandan yönetin.', canAdd ? `<button class="button button-primary" data-add="calendar">${icon('plus', 18)} Plan Ekle</button>` : '') + `<div class="calendar-toolbar-modern"><button data-cal-prev>${icon('chevronLeft', 20)}</button><strong>${new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(calDate)}</strong><button data-cal-next>${icon('chevronRight', 20)}</button><button data-cal-today class="button button-secondary">Bugün</button></div><div class="calendar-layout-modern"><section class="surface-card monthly-panel"><div class="calendar-panel-head"><div><h3>Aylık takvim</h3><p>Geçmiş günler görüntülenebilir, yeni planlar yetkiye göre eklenir.</p></div><div class="calendar-legend"><span><i class="dot open-dot"></i>Plan</span></div></div><div class="weekday-row">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(x => `<span>${x}</span>`).join('')}</div><div class="month-grid">${cells.join('')}</div></section><aside class="surface-card day-panel"><div class="day-panel-head"><div><h3>${new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: '2-digit', month: 'long' }).format(selectedDate)}</h3><p>Günün programı</p></div></div>${selected.length ? selected.map(e => `<div class="calendar-event-row"><b>${esc(e.title || e.name || 'Plan')}</b><span>${date(e.start_at || e.lesson_date || e.date)}</span><small>${esc(e.description || e.type || '')}</small></div>`).join('') : empty('Plan yok', 'Bu gün için kayıt bulunmuyor.')}</aside></div>`
  }

  const listPage = async (resource, ey, title, text, label = '') => {
    const d = await get(resource, 10000)
    const items = d.items || d.data?.items || []
    const action = label ? `<button class="button button-primary" data-add="${resource}">${icon('plus', 18)} ${label}</button>` : ''
    const rows = items.length ? items.map(x => `<article class="data-row"><div><b>${esc(x.title || x.name || x.subject || x.goal || 'Kayıt')}</b><span>${esc(x.description || x.body || x.feedback || x.full_name || x.student_name || '')}</span><small>${date(x.created_at || x.due_at || x.starts_at || x.start_at || x.next_review_at)}</small></div><span class="status-badge ${x.status || 'active'}">${esc(x.status || 'Aktif')}</span></article>`).join('') : empty('Henüz kayıt yok', 'Bu bölümde kayıt oluştuğunda burada görünecek.')
    content.innerHTML = heading(ey, title, text, action) + card(title, `<div class="data-list">${rows}</div>`)
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
    reports: () => listPage('dashboard', 'ANALİZ', 'Raporlar', 'Platform verilerini sade özetlerle ince.'),
    students: () => listPage('students', 'KULLANICILAR', 'Öğrenciler', 'Öğrenci hesaplarını yönet.', 'Öğrenci Ekle'),
    teachers: () => listPage('users', 'KULLANICILAR', 'Öğretmenler', 'Öğretmen hesaplarını yönet.', 'Öğretmen Ekle'),
    classes: () => listPage('classes', 'KULLANICILAR', 'Sınıf & Grup Yönetimi', 'Sınıf ve grupları yönet.', 'Yeni Sınıf'),
    activity: () => listPage('activity', 'SİSTEM', 'Aktivite', 'Sistem hareketlerini incele.'),
    settings: async () => {
      content.innerHTML = heading('SİSTEM', 'Ayarlar', 'Hesap ve görünüm tercihlerini yönet.') + card('Hesap', `<div class="settings-summary"><b>${esc(user.fullName || user.username)}</b><span>@${esc(user.username)} · ${roles[user.role] || user.role}</span></div>`)
    }
  }

  const show = async (page) => {
    current = page
    app.querySelectorAll('.workspace-nav').forEach(b => b.classList.toggle('active', b.dataset.page === page))
    app.querySelector('#workspaceTitle').textContent = labels[page] || 'Panel'
    content.innerHTML = '<div class="workspace-loading"><span></span><span></span><span></span></div>'
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

  app.addEventListener('click', async e => {
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
    if (day) { selectedDate = new Date(day.dataset.calDate + 'T12:00:00'); await show('calendar'); return }
  })

  app.querySelector('#workspaceLogout').addEventListener('click', async () => { await onLogout(); location.reload() })
  app.querySelector('#globalRefresh').addEventListener('click', () => show(current))
  app.querySelector('#globalTheme').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('mk_theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  })
  app.querySelector('#mobileMenu').addEventListener('click', () => app.querySelector('.workspace-sidebar').classList.toggle('open'))
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
  show('dashboard')
}

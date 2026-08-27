const MAX_PDF = 2 * 1024 * 1024
let studentCache = null

const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))

async function getStudents() {
  if (studentCache) return studentCache
  const r = await fetch('/api/phase2?action=students', { credentials: 'same-origin' })
  const d = await r.json()
  if (!r.ok || !d.ok) throw new Error(d.error || 'Öğrenciler alınamadı.')
  studentCache = d.items || []
  return studentCache
}

function studentPicker(name='studentId', multiple=false) {
  return `<label class="wide"><span>Öğrenci${multiple ? 'ler' : ''}</span><input class="phase2-student-search" type="search" placeholder="Öğrenci ara…" autocomplete="off"><select name="${name}" class="phase2-student-select" ${multiple ? 'multiple size="5"' : ''} required><option value="">Öğrenci seçin</option></select><small class="form-help">İsim veya kullanıcı adıyla arayıp seçebilirsiniz.</small></label>`
}

function addOnce(form, key, html) {
  if (form.querySelector(`[data-phase2="${key}"]`)) return
  const wrap = document.createElement('div')
  wrap.dataset.phase2 = key
  wrap.className = 'wide phase2-extra'
  wrap.innerHTML = html
  const grid = form.querySelector('.form-grid') || form
  grid.appendChild(wrap)
}

async function setupStudents(form, multiple=false) {
  const select = form.querySelector('.phase2-student-select')
  const search = form.querySelector('.phase2-student-search')
  if (!select || select.dataset.ready) return
  select.dataset.ready = '1'
  const items = await getStudents()
  const render = filter => {
    const current = new Set([...select.selectedOptions].map(o => o.value))
    select.innerHTML = multiple ? '' : '<option value="">Öğrenci seçin</option>'
    items.filter(s => !filter || `${s.full_name} ${s.username}`.toLocaleLowerCase('tr-TR').includes(filter.toLocaleLowerCase('tr-TR'))).forEach(s => {
      const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.full_name} · @${s.username}`; o.selected = current.has(s.id); select.appendChild(o)
    })
  }
  render('')
  search?.addEventListener('input', () => render(search.value.trim()))
}

function addFile(form) {
  if (form.querySelector('[data-phase2="pdf"]')) return
  const wrap = document.createElement('div'); wrap.dataset.phase2 = 'pdf'; wrap.className = 'wide phase2-extra'
  wrap.innerHTML = '<label class="wide">PDF ekle (isteğe bağlı)<input name="attachment" type="file" accept="application/pdf,.pdf"><small class="form-help">En fazla 2 MB. PDF eklemek zorunlu değildir.</small></label>'
  ;(form.querySelector('.form-grid') || form).appendChild(wrap)
}

function addEvaluationFields(form) {
  if (form.querySelector('[data-phase2="evaluation"]')) return
  const wrap = document.createElement('div'); wrap.dataset.phase2 = 'evaluation'; wrap.className = 'wide phase2-extra'
  wrap.innerHTML = '<label>Kategori<select name="category"><option value="Genel">Genel</option><option value="Akademik">Akademik</option><option value="Davranış">Davranış</option><option value="Katılım">Katılım</option><option value="Ödev">Ödev</option></select></label><label>Seviye<select name="level"><option value="">Seçin</option><option>Başlangıç</option><option>Gelişiyor</option><option>İyi</option><option>Çok İyi</option></select></label><label class="wide">Güçlü yönler<textarea name="strengths" rows="3" placeholder="Öğrencinin güçlü olduğu alanlar"></textarea></label><label class="wide">Geliştirilmesi gerekenler<textarea name="improvements" rows="3" placeholder="Gelişim alanları"></textarea></label><label class="wide">Öğretmen notu<textarea name="teacherNote" rows="3" placeholder="Özel not"></textarea></label>'
  ;(form.querySelector('.form-grid') || form).appendChild(wrap)
}

function mark(form, type) { form.dataset.phase2Type = type }

async function enhanceModal(root) {
  const form = root.querySelector('#wsModalForm')
  if (!form || form.dataset.phase2Enhanced) return
  const text = (root.textContent || '').toLocaleLowerCase('tr-TR')
  form.dataset.phase2Enhanced = '1'
  try {
    if (text.includes('ders planla')) {
      const old = form.querySelector('input[name="title"]')
      addOnce(form, 'students', studentPicker('studentIds', true))
      await setupStudents(form, true); mark(form, 'lesson')
    } else if (text.includes('ödev oluştur')) {
      addOnce(form, 'students', studentPicker('studentIds', true)); addFile(form)
      await setupStudents(form, true); mark(form, 'assignment')
    } else if (text.includes('sınav oluştur')) {
      addOnce(form, 'students', studentPicker('studentIds', true)); addFile(form)
      await setupStudents(form, true); mark(form, 'exam')
    } else if (text.includes('değerlendirme')) {
      const old = form.querySelector('input[name="studentId"]')
      if (old) {
        const label = old.closest('label'); if (label) label.outerHTML = studentPicker('studentId', false)
      } else addOnce(form, 'students', studentPicker('studentId', false))
      addEvaluationFields(form); await setupStudents(form, false); mark(form, 'evaluation')
    } else if (text.includes('hedef ekle') || text.includes('ilerleme ekle')) {
      const old = form.querySelector('input[name="studentId"]')
      if (old) { const label = old.closest('label'); if (label) label.outerHTML = studentPicker('studentId', false) }
      await setupStudents(form, false)
    }
  } catch (e) {
    const msg = root.querySelector('#wsModalMsg'); if (msg) msg.textContent = e.message
  }
}

function fileToData(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file)
  })
}

async function submitPhase2(form, type) {
  const fd = new FormData(form)
  const ids = fd.getAll('studentIds').filter(Boolean)
  const studentId = fd.get('studentId')
  if ((type !== 'evaluation' && !ids.length) || (type === 'evaluation' && !studentId)) throw new Error('En az bir öğrenci seçmelisiniz.')
  const body = Object.fromEntries(fd.entries())
  if (type !== 'evaluation') body.studentIds = ids
  const file = fd.get('attachment')
  if (file && file.size) {
    if (file.type !== 'application/pdf') throw new Error('Sadece PDF dosyası ekleyebilirsiniz.')
    if (file.size > MAX_PDF) throw new Error('PDF boyutu en fazla 2 MB olabilir.')
    body.attachmentData = await fileToData(file); body.attachmentName = file.name; body.attachmentSize = file.size; body.attachmentType = file.type
  }
  delete body.attachment
  const endpoint = type === 'lesson' ? 'create-lesson' : type === 'assignment' ? 'create-assignment' : type === 'exam' ? 'create-exam' : 'create-evaluation'
  const r = await fetch(`/api/phase2?action=${endpoint}`, { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
  const d = await r.json()
  if (!r.ok || !d.ok) throw new Error(d.error || 'İşlem başarısız.')
  return d
}

function boot() {
  const observer = new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1) {
      if (n.id === 'wsModalHost' || n.querySelector?.('#wsModal')) enhanceModal(n)
      if (n.id === 'wsModal' || n.querySelector?.('#wsModalForm')) enhanceModal(n)
    }
  })))
  observer.observe(document.body, { childList: true, subtree: true })

  document.addEventListener('submit', async e => {
    const form = e.target.closest?.('#wsModalForm')
    if (!form || !form.dataset.phase2Type) return
    e.preventDefault(); e.stopImmediatePropagation()
    const root = form.closest('#wsModal') || document
    const msg = root.querySelector('#wsModalMsg')
    const buttons = [...form.querySelectorAll('button')]
    buttons.forEach(b => b.disabled = true)
    if (msg) msg.textContent = 'Kaydediliyor…'
    try {
      await submitPhase2(form, form.dataset.phase2Type)
      if (msg) msg.textContent = 'Kaydedildi.'
      setTimeout(() => {
        const close = root.querySelector('[data-close-modal]'); close?.click()
        document.querySelector('#globalRefresh')?.click()
      }, 250)
    } catch (err) {
      if (msg) msg.textContent = err.message
      buttons.forEach(b => b.disabled = false)
    }
  }, true)
}

boot()

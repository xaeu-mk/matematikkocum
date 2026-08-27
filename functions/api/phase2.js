import { requireSession } from './auth/_require.js'
import { randomId } from './auth/_crypto.js'

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const now = () => new Date().toISOString()
const safe = (v = '') => String(v).trim()
const MAX_PDF_BYTES = 2 * 1024 * 1024

async function getSession(context) {
  const db = context.env?.DB
  if (!db) return { error: json({ ok: false, error: 'D1 bağlantısı bulunamadı.' }, 503) }
  const auth = await requireSession(context.request, db)
  if (!auth.ok) return { error: json({ ok: false, error: 'Oturum geçersiz veya süresi dolmuş.' }, auth.status) }
  return { db, user: { id: auth.session.user_id, username: auth.session.username, fullName: auth.session.full_name, role: auth.session.role } }
}

async function students(db, user) {
  let q
  if (user.role === 'admin') q = db.prepare("SELECT u.id,u.full_name,u.username FROM users u WHERE u.role='student' AND u.is_active=1 ORDER BY u.full_name ASC")
  else if (user.role === 'teacher') q = db.prepare("SELECT DISTINCT u.id,u.full_name,u.username FROM users u JOIN teacher_student_links l ON l.student_id=u.id WHERE l.teacher_id=? AND u.role='student' AND u.is_active=1 ORDER BY u.full_name ASC").bind(user.id)
  else return []
  return (await q.all()).results || []
}

async function assertStudents(db, user, ids) {
  const clean = [...new Set((Array.isArray(ids) ? ids : []).map(safe).filter(Boolean))]
  if (!clean.length) return []
  const allowed = await students(db, user)
  const set = new Set(allowed.map(x => x.id))
  return clean.filter(id => set.has(id))
}

function attachment(body) {
  if (!body.attachmentData) return null
  if (body.attachmentType !== 'application/pdf') throw new Error('Sadece PDF dosyası eklenebilir.')
  const size = Number(body.attachmentSize || 0)
  if (!size || size > MAX_PDF_BYTES) throw new Error('PDF boyutu en fazla 2 MB olabilir.')
  if (typeof body.attachmentData !== 'string' || !body.attachmentData.startsWith('data:application/pdf;base64,')) throw new Error('Geçersiz PDF verisi.')
  return { name: safe(body.attachmentName || 'dosya.pdf').slice(0, 180), data: body.attachmentData, size, type: 'application/pdf' }
}

export async function onRequest(context) {
  const { db, user, error } = await getSession(context)
  if (error) return error
  try {
    const url = new URL(context.request.url)
    const action = url.searchParams.get('action') || 'students'
    if (context.request.method === 'GET') {
      if (action === 'students') return json({ ok: true, items: await students(db, user) })
      return json({ ok: false, error: 'İşlem bulunamadı.' }, 404)
    }
    if (!['admin', 'teacher'].includes(user.role)) return json({ ok: false, error: 'Yetkiniz yok.' }, 403)
    const body = await context.request.json().catch(() => ({}))

    if (action === 'create-lesson') {
      const ids = await assertStudents(db, user, body.studentIds)
      if (!ids.length) return json({ ok: false, error: 'En az bir öğrenci seçmelisiniz.' }, 400)
      const teacherId = user.role === 'teacher' ? user.id : safe(body.teacherId)
      if (!teacherId) return json({ ok: false, error: 'Öğretmen seçilmedi.' }, 400)
      if (user.role === 'admin') {
        const t = await db.prepare("SELECT id FROM users WHERE id=? AND role='teacher' AND is_active=1").bind(teacherId).first()
        if (!t) return json({ ok: false, error: 'Öğretmen bulunamadı.' }, 400)
      }
      const date = safe(body.date), start = safe(body.startTime), end = safe(body.endTime)
      if (!date || !start || !end || !safe(body.title)) return json({ ok: false, error: 'Ders adı, tarih ve saat zorunludur.' }, 400)
      const id = randomId()
      await db.prepare('INSERT INTO calendar_events(id,user_id,title,description,start_at,end_at,type,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id, teacherId, safe(body.title), safe(body.description || ''), `${date}T${start}:00`, `${date}T${end}:00`, 'lesson', user.id, now()).run()
      for (const sid of ids) await db.prepare('INSERT OR IGNORE INTO calendar_event_students(event_id,student_id) VALUES(?,?)').bind(id, sid).run()
      return json({ ok: true, id, studentIds: ids }, 201)
    }

    if (action === 'create-evaluation') {
      const ids = await assertStudents(db, user, [body.studentId])
      if (!ids.length) return json({ ok: false, error: 'Geçerli bir öğrenci seçmelisiniz.' }, 400)
      if (!safe(body.title)) return json({ ok: false, error: 'Değerlendirme başlığı zorunludur.' }, 400)
      const id = randomId()
      await db.prepare(`INSERT INTO evaluations(id,student_id,teacher_id,title,score,feedback,category,strengths,improvements,teacher_note,level,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id, ids[0], user.id, safe(body.title), Number(body.score) || 0, safe(body.feedback), safe(body.category), safe(body.strengths), safe(body.improvements), safe(body.teacherNote), safe(body.level), now()).run()
      return json({ ok: true, id }, 201)
    }

    if (action === 'create-assignment' || action === 'create-exam') {
      const ids = await assertStudents(db, user, body.studentIds)
      if (!ids.length) return json({ ok: false, error: 'En az bir öğrenci seçmelisiniz.' }, 400)
      const a = attachment(body)
      const id = randomId()
      if (action === 'create-assignment') {
        await db.prepare(`INSERT INTO assignments(id,title,description,course_id,teacher_id,due_at,created_at,attachment_name,attachment_data,attachment_size,attachment_type) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id, safe(body.title), safe(body.description), body.courseId || null, user.id, body.dueAt || null, now(), a?.name || null, a?.data || null, a?.size || null, a?.type || null).run()
        for (const sid of ids) await db.prepare('INSERT OR IGNORE INTO assignment_students(assignment_id,student_id) VALUES(?,?)').bind(id, sid).run()
      } else {
        await db.prepare(`INSERT INTO exams(id,title,subject,starts_at,duration_minutes,teacher_id,created_at,attachment_name,attachment_data,attachment_size,attachment_type) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id, safe(body.title), safe(body.subject), body.startsAt || null, Number(body.durationMinutes) || 60, user.id, now(), a?.name || null, a?.data || null, a?.size || null, a?.type || null).run()
      }
      return json({ ok: true, id, studentIds: ids }, 201)
    }
    return json({ ok: false, error: 'İşlem bulunamadı.' }, 404)
  } catch (e) {
    console.error('PHASE2_ERROR', e)
    return json({ ok: false, error: e?.message || 'Beklenmeyen hata.' }, 500)
  }
}

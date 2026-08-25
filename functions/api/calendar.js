import { requireSession } from './auth/_require.js'
import { randomId } from './auth/_crypto.js'

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const now = () => new Date().toISOString()
const safe = (v = '') => String(v).trim()
const HOURS = Array.from({ length: 16 }, (_, i) => i + 8)

function overlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function dateStr(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
}

function isPast(dateStr, timeStr) {
  const dt = new Date(dateStr + 'T' + (timeStr || '00:00') + ':00')
  return dt < new Date()
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function canManage(user, teacherId) {
  if (user.role === 'admin') return true
  if (user.role === 'teacher' && teacherId === user.id) return true
  return false
}

function getTeacherId(user, body) {
  if (user.role === 'teacher') return user.id
  if (user.role === 'admin') return body.teacherId || user.id
  return null
}

async function session(context) {
  const db = context.env?.DB
  if (!db) return { error: json({ ok: false, error: 'D1 bağlantısı bulunamadı.' }, 503) }
  const auth = await requireSession(context.request, db)
  if (!auth.ok) return { error: json({ ok: false, error: 'Oturum geçersiz.' }, auth.status) }
  return { db, user: { id: auth.session.user_id, username: auth.session.username, fullName: auth.session.full_name, role: auth.session.role } }
}

async function getEventsForTeacher(db, teacherId, startDate, endDate) {
  const q = db.prepare(`SELECT id, title, description, start_at, end_at, type, user_id FROM calendar_events WHERE user_id=? AND start_at>=? AND start_at<=? ORDER BY start_at ASC`).bind(teacherId, startDate + 'T00:00:00', endDate + 'T23:59:59')
  return (await q.all()).results || []
}

async function getBlocksForTeacher(db, teacherId, startDate, endDate) {
  const q = db.prepare(`SELECT id, date, start_time, end_time, reason FROM calendar_blocks WHERE teacher_id=? AND date>=? AND date<=? ORDER BY date ASC, start_time ASC`).bind(teacherId, startDate, endDate)
  return (await q.all()).results || []
}

async function getStudentEvents(db, studentId, startDate, endDate) {
  const q = db.prepare(`SELECT e.id, e.title, e.description, e.start_at, e.end_at, e.type, e.user_id FROM calendar_events e JOIN teacher_student_links l ON l.teacher_id=e.user_id WHERE l.student_id=? AND e.start_at>=? AND e.start_at<=? ORDER BY e.start_at ASC`).bind(studentId, startDate + 'T00:00:00', endDate + 'T23:59:59')
  return (await q.all()).results || []
}

async function getParentEvents(db, parentId, startDate, endDate) {
  const q = db.prepare(`SELECT e.id, e.title, e.description, e.start_at, e.end_at, e.type, e.user_id FROM calendar_events e JOIN parent_student_links pl ON pl.student_id IN (SELECT student_id FROM teacher_student_links WHERE teacher_id=e.user_id) WHERE pl.parent_id=? AND e.start_at>=? AND e.start_at<=? ORDER BY e.start_at ASC`).bind(parentId, startDate + 'T00:00:00', endDate + 'T23:59:59')
  return (await q.all()).results || []
}

function computeSlotStatus(date, hour, events, blocks, nowDate) {
  const slotStart = timeToMin(hour + ':00')
  const slotEnd = slotStart + 60
  const today = todayStr()
  if (date < today) return 'past'
  if (date === today && slotEnd <= timeToMin(new Date().toTimeString().slice(0, 5))) return 'past'

  for (const e of events) {
    const eDate = (e.start_at || '').slice(0, 10)
    if (eDate !== date) continue
    const eStart = timeToMin((e.start_at || '').slice(11, 16))
    const eEnd = timeToMin((e.end_at || '').slice(11, 16))
    if (overlap(slotStart, slotEnd, eStart, eEnd)) return 'busy'
  }

  for (const b of blocks) {
    if (b.date !== date) continue
    const bStart = timeToMin(b.start_time)
    const bEnd = timeToMin(b.end_time)
    if (overlap(slotStart, slotEnd, bStart, bEnd)) return 'closed'
  }

  return 'open'
}

function daySummary(date, events, blocks) {
  const dayEvents = events.filter(e => (e.start_at || '').slice(0, 10) === date)
  const dayBlocks = blocks.filter(b => b.date === date)
  let busy = 0, closed = 0
  for (const h of HOURS) {
    const status = computeSlotStatus(date, h + ':00', events, blocks)
    if (status === 'busy') busy++
    else if (status === 'closed') closed++
  }
  const open = HOURS.length - busy - closed - (date < todayStr() ? HOURS.length : 0)
  return { lessons: dayEvents.length, busy, closed, open: Math.max(0, open) }
}

export async function onRequest(context) {
  const { db, user, error } = await session(context)
  if (error) return error

  try {
    const url = new URL(context.request.url)
    const action = url.searchParams.get('action') || 'view'
    const method = context.request.method

    if (method === 'GET' && action === 'view') {
      const startDate = url.searchParams.get('start') || new Date().toISOString().slice(0, 10)
      const endDate = url.searchParams.get('end') || startDate
      let teacherId = url.searchParams.get('teacherId')

      if (user.role === 'teacher') teacherId = user.id
      if (user.role === 'student') {
        const links = (await db.prepare('SELECT teacher_id FROM teacher_student_links WHERE student_id=?').bind(user.id).all()).results || []
        const events = await getStudentEvents(db, user.id, startDate, endDate)
        return json({ ok: true, events, role: 'student', hours: HOURS })
      }
      if (user.role === 'parent') {
        const events = await getParentEvents(db, user.id, startDate, endDate)
        return json({ ok: true, events, role: 'parent', hours: HOURS })
      }

      if (!teacherId && user.role === 'admin') {
        const teachers = (await db.prepare("SELECT id, full_name FROM users WHERE role='teacher' AND is_active=1 ORDER BY full_name ASC").all()).results || []
        if (teachers.length) teacherId = teachers[0].id
        return json({ ok: true, teachers, teacherId, events: teacherId ? await getEventsForTeacher(db, teacherId, startDate, endDate) : [], blocks: teacherId ? await getBlocksForTeacher(db, teacherId, startDate, endDate) : [], hours: HOURS, role: 'admin' })
      }

      if (!canManage(user, teacherId)) return json({ ok: false, error: 'Bu takvim için yetkiniz yok.' }, 403)
      const [events, blocks] = await Promise.all([getEventsForTeacher(db, teacherId, startDate, endDate), getBlocksForTeacher(db, teacherId, startDate, endDate)])
      return json({ ok: true, events, blocks, hours: HOURS, role: user.role, teacherId })
    }

    if (method === 'GET' && action === 'teachers') {
      if (user.role !== 'admin') return json({ ok: false, error: 'Yetkisiz.' }, 403)
      const teachers = (await db.prepare("SELECT id, full_name FROM users WHERE role='teacher' AND is_active=1 ORDER BY full_name ASC").all()).results || []
      return json({ ok: true, teachers })
    }

    const body = await context.request.json().catch(() => ({}))

    if (action === 'create-event') {
      const teacherId = getTeacherId(user, body)
      if (!teacherId || !canManage(user, teacherId)) return json({ ok: false, error: 'Bu takvim için yetkiniz yok.' }, 403)
      const date = safe(body.date)
      const startTime = safe(body.startTime)
      const endTime = safe(body.endTime)
      if (!date || !startTime || !endTime) return json({ ok: false, error: 'Tarih ve saat zorunludur.' }, 400)
      if (timeToMin(startTime) >= timeToMin(endTime)) return json({ ok: false, error: 'Başlangıç bitişten önce olmalı.' }, 400)
      if (isPast(date, startTime)) return json({ ok: false, error: 'Geçmiş tarih/saat seçilemez.' }, 400)

      const existing = await getEventsForTeacher(db, teacherId, date, date)
      for (const e of existing) {
        const eStart = timeToMin((e.start_at || '').slice(11, 16))
        const eEnd = timeToMin((e.end_at || '').slice(11, 16))
        if (overlap(timeToMin(startTime), timeToMin(endTime), eStart, eEnd)) return json({ ok: false, error: 'Bu saatte öğretmenin başka dersi var.' }, 409)
      }

      const blocks = await getBlocksForTeacher(db, teacherId, date, date)
      for (const b of blocks) {
        if (overlap(timeToMin(startTime), timeToMin(endTime), timeToMin(b.start_time), timeToMin(b.end_time))) return json({ ok: false, error: 'Bu saat kapalı. Ders eklenemez.' }, 409)
      }

      const id = randomId()
      const startAt = date + 'T' + startTime + ':00'
      const endAt = date + 'T' + endTime + ':00'
      await db.prepare('INSERT INTO calendar_events(id,user_id,title,description,start_at,end_at,type,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id, teacherId, safe(body.title), safe(body.description || ''), startAt, endAt, 'lesson', user.id, now()).run()
      await db.prepare('INSERT INTO audit_logs(id,user_id,action,target_id,metadata,created_at) VALUES(?,?,?,?,?,?)').bind(randomId(), user.id, 'create_calendar_event', id, JSON.stringify(body), now()).run()
      return json({ ok: true, id }, 201)
    }

    if (action === 'delete-event') {
      const eventId = body.id || url.searchParams.get('id')
      if (!eventId) return json({ ok: false, error: 'Etkinlik ID gerekli.' }, 400)
      const evt = await db.prepare('SELECT user_id FROM calendar_events WHERE id=?').bind(eventId).first()
      if (!evt) return json({ ok: false, error: 'Etkinlik bulunamadı.' }, 404)
      if (!canManage(user, evt.user_id)) return json({ ok: false, error: 'Bu ders için yetkiniz yok.' }, 403)
      await db.prepare('DELETE FROM calendar_events WHERE id=?').bind(eventId).run()
      await db.prepare('INSERT INTO audit_logs(id,user_id,action,target_id,created_at) VALUES(?,?,?,?,?)').bind(randomId(), user.id, 'delete_calendar_event', eventId, now()).run()
      return json({ ok: true })
    }

    if (action === 'toggle-slot') {
      const teacherId = getTeacherId(user, body)
      if (!teacherId || !canManage(user, teacherId)) return json({ ok: false, error: 'Bu takvim için yetkiniz yok.' }, 403)
      const date = safe(body.date)
      const hour = safe(body.hour)
      if (!date || !hour) return json({ ok: false, error: 'Tarih ve saat gerekli.' }, 400)
      if (isPast(date, hour)) return json({ ok: false, error: 'Geçmiş saat değiştirilemez.' }, 400)

      const slotStart = timeToMin(hour)
      const slotEnd = slotStart + 60
      const events = await getEventsForTeacher(db, teacherId, date, date)
      for (const e of events) {
        const eStart = timeToMin((e.start_at || '').slice(11, 16))
        const eEnd = timeToMin((e.end_at || '').slice(11, 16))
        if (overlap(slotStart, slotEnd, eStart, eEnd)) return json({ ok: false, error: 'Bu saatte ders var, kapatılamaz.' }, 409)
      }

      const blocks = await getBlocksForTeacher(db, teacherId, date, date)
      const existing = blocks.find(b => b.date === date && overlap(slotStart, slotEnd, timeToMin(b.start_time), timeToMin(b.end_time)))
      if (existing) {
        await db.prepare('DELETE FROM calendar_blocks WHERE id=?').bind(existing.id).run()
        return json({ ok: true, status: 'open' })
      }
      const id = randomId()
      await db.prepare('INSERT INTO calendar_blocks(id,teacher_id,date,start_time,end_time,reason,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id, teacherId, date, hour + ':00', String(Number(hour.split(':')[0]) + 1).padStart(2, '0') + ':00', safe(body.reason || 'Kapatıldı'), user.id, now()).run()
      return json({ ok: true, status: 'closed' })
    }

    if (action === 'toggle-day') {
      const teacherId = getTeacherId(user, body)
      if (!teacherId || !canManage(user, teacherId)) return json({ ok: false, error: 'Bu takvim için yetkiniz yok.' }, 403)
      const date = safe(body.date)
      if (!date) return json({ ok: false, error: 'Tarih gerekli.' }, 400)

      const events = await getEventsForTeacher(db, teacherId, date, date)
      const blocks = await getBlocksForTeacher(db, teacherId, date, date)
      const today = todayStr()
      let closedCount = 0, skipped = 0

      const isDayClosed = blocks.filter(b => b.date === date).length > HOURS.length / 2

      if (isDayClosed) {
        for (const b of blocks) {
          if (b.date === date && !isPast(date, b.start_time)) {
            const hasEvent = events.some(e => {
              const eStart = timeToMin((e.start_at || '').slice(11, 16))
              const eEnd = timeToMin((e.end_at || '').slice(11, 16))
              return overlap(timeToMin(b.start_time), timeToMin(b.end_time), eStart, eEnd)
            })
            if (!hasEvent) { await db.prepare('DELETE FROM calendar_blocks WHERE id=?').bind(b.id).run(); closedCount++ }
            else skipped++
          }
        }
        return json({ ok: true, action: 'opened', closedCount, skipped })
      }

      for (const h of HOURS) {
        const hour = h + ':00'
        if (isPast(date, hour)) continue
        const slotStart = timeToMin(hour)
        const slotEnd = slotStart + 60
        const hasEvent = events.some(e => {
          const eStart = timeToMin((e.start_at || '').slice(11, 16))
          const eEnd = timeToMin((e.end_at || '').slice(11, 16))
          return overlap(slotStart, slotEnd, eStart, eEnd)
        })
        const hasBlock = blocks.some(b => b.date === date && overlap(slotStart, slotEnd, timeToMin(b.start_time), timeToMin(b.end_time)))
        if (hasEvent) { skipped++; continue }
        if (hasBlock) continue
        const id = randomId()
        await db.prepare('INSERT INTO calendar_blocks(id,teacher_id,date,start_time,end_time,reason,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id, teacherId, date, hour, String(h + 1).padStart(2, '0') + ':00', 'Gün kapatıldı', user.id, now()).run()
        closedCount++
      }
      return json({ ok: true, action: 'closed', closedCount, skipped })
    }

    if (action === 'bulk-operation') {
      const teacherId = getTeacherId(user, body)
      if (!teacherId || !canManage(user, teacherId)) return json({ ok: false, error: 'Bu takvim için yetkiniz yok.' }, 403)
      const startDate = safe(body.startDate)
      const endDate = safe(body.endDate)
      const startTime = safe(body.startTime || '08:00')
      const endTime = safe(body.endTime || '23:00')
      const daysOfWeek = Array.isArray(body.daysOfWeek) ? body.daysOfWeek.map(Number) : [0, 1, 2, 3, 4, 5, 6]
      const opAction = body.action === 'open' ? 'open' : 'block'
      if (!startDate || !endDate) return json({ ok: false, error: 'Tarih aralığı gerekli.' }, 400)

      let processed = 0, skipped = 0
      const cur = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T23:59:59')
      while (cur <= end) {
        const ds = cur.toISOString().slice(0, 10)
        const dow = cur.getDay()
        if (daysOfWeek.includes(dow === 0 ? 0 : dow)) {
          const events = await getEventsForTeacher(db, teacherId, ds, ds)
          const blocks = await getBlocksForTeacher(db, teacherId, ds, ds)
          for (const h of HOURS) {
            const hour = h + ':00'
            const slotStart = timeToMin(hour)
            const slotEnd = slotStart + 60
            if (slotStart < timeToMin(startTime) || slotEnd > timeToMin(endTime)) continue
            if (isPast(ds, hour)) continue
            const hasEvent = events.some(e => {
              const eStart = timeToMin((e.start_at || '').slice(11, 16))
              const eEnd = timeToMin((e.end_at || '').slice(11, 16))
              return overlap(slotStart, slotEnd, eStart, eEnd)
            })
            const hasBlock = blocks.some(b => b.date === ds && overlap(slotStart, slotEnd, timeToMin(b.start_time), timeToMin(b.end_time)))
            if (opAction === 'block') {
              if (hasEvent) { skipped++; continue }
              if (hasBlock) continue
              const id = randomId()
              await db.prepare('INSERT INTO calendar_blocks(id,teacher_id,date,start_time,end_time,reason,created_by,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id, teacherId, ds, hour, String(h + 1).padStart(2, '0') + ':00', safe(body.reason || 'Toplu kapatma'), user.id, now()).run()
              processed++
            } else {
              if (hasBlock) {
                if (hasEvent) { skipped++; continue }
                const block = blocks.find(b => b.date === ds && overlap(slotStart, slotEnd, timeToMin(b.start_time), timeToMin(b.end_time)))
                if (block) { await db.prepare('DELETE FROM calendar_blocks WHERE id=?').bind(block.id).run(); processed++ }
              }
            }
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
      await db.prepare('INSERT INTO audit_logs(id,user_id,action,target_id,metadata,created_at) VALUES(?,?,?,?,?,?)').bind(randomId(), user.id, 'bulk_calendar_' + opAction, teacherId, JSON.stringify(body), now()).run()
      return json({ ok: true, action: opAction, processed, skipped })
    }

    return json({ ok: false, error: 'Bilinmeyen işlem.' }, 400)
  } catch (err) {
    console.error('CALENDAR_ERROR', err)
    return json({ ok: false, error: err?.message || 'Sunucu hatası.' }, 500)
  }
}

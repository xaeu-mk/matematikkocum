import { requireAdmin } from '../auth/_require.js'

const json = (body, status = 200) => Response.json(body, { status })

export async function onRequestGet(context) {
  const db = context.env?.DB
  if (!db) return json({ ok: false, error: 'D1 bağlı değil.' }, 503)
  const auth = await requireAdmin(context.request, db)
  if (!auth.ok) return json({ ok: false, error: auth.status === 403 ? 'Yetkisiz.' : 'Oturum gerekli.' }, auth.status)

  try {
    const [users, students, teachers, parents, admins, courses, assignments, exams, messages, unread, activity] = await Promise.all([
      db.prepare('SELECT COUNT(*) AS count FROM users').first(),
      db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'student' AND is_active = 1").first(),
      db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'teacher' AND is_active = 1").first(),
      db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'parent' AND is_active = 1").first(),
      db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1").first(),
      db.prepare('SELECT COUNT(*) AS count FROM courses WHERE is_active = 1').first(),
      db.prepare('SELECT COUNT(*) AS count FROM assignments').first(),
      db.prepare('SELECT COUNT(*) AS count FROM exams').first(),
      db.prepare('SELECT COUNT(*) AS count FROM messages').first(),
      db.prepare('SELECT COUNT(*) AS count FROM messages WHERE read_at IS NULL').first(),
      db.prepare(`SELECT a.id, a.action, a.created_at AS createdAt, u.username, u.full_name AS fullName FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 8`).all(),
    ])

    return json({
      ok: true,
      currentUser: { id: auth.session.user_id, username: auth.session.username, fullName: auth.session.full_name, role: auth.session.role },
      stats: {
        users: Number(users?.count || 0), students: Number(students?.count || 0), teachers: Number(teachers?.count || 0),
        parents: Number(parents?.count || 0), admins: Number(admins?.count || 0), courses: Number(courses?.count || 0),
        assignments: Number(assignments?.count || 0), exams: Number(exams?.count || 0), messages: Number(messages?.count || 0), unreadMessages: Number(unread?.count || 0)
      },
      activity: activity?.results || []
    })
  } catch (error) {
    return json({ ok: false, error: 'Yönetim verileri alınamadı.' }, 500)
  }
}

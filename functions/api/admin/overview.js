import { requireAdmin } from '../auth/_require.js'

const json = (body, status = 200) => Response.json(body, { status })
const count = async (db, sql) => { try { const row = await db.prepare(sql).first(); return Number(row?.count || 0) } catch { return 0 } }
const all = async (db, sql) => { try { const result = await db.prepare(sql).all(); return result?.results || [] } catch { return [] } }

export async function onRequestGet(context) {
  const db = context.env?.DB
  if (!db) return json({ ok: false, error: 'D1 bağlı değil.' }, 503)
  const auth = await requireAdmin(context.request, db)
  if (!auth.ok) return json({ ok: false, error: auth.status === 403 ? 'Yetkisiz.' : 'Oturum gerekli.' }, auth.status)
  const [users, students, teachers, parents, admins, courses, assignments, exams, messages, unread, activity] = await Promise.all([
    count(db, 'SELECT COUNT(*) AS count FROM users'), count(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'student' AND is_active = 1"),
    count(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'teacher' AND is_active = 1"), count(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'parent' AND is_active = 1"),
    count(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND is_active = 1"), count(db, 'SELECT COUNT(*) AS count FROM courses WHERE is_active = 1'),
    count(db, 'SELECT COUNT(*) AS count FROM assignments'), count(db, 'SELECT COUNT(*) AS count FROM exams'), count(db, 'SELECT COUNT(*) AS count FROM messages'),
    count(db, 'SELECT COUNT(*) AS count FROM messages WHERE read_at IS NULL'), all(db, 'SELECT a.id, a.action, a.created_at AS createdAt, u.username, u.full_name AS fullName FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 8')
  ])
  return json({ ok: true, currentUser: { id: auth.session.user_id, username: auth.session.username, fullName: auth.session.full_name, role: auth.session.role }, stats: { users, students, teachers, parents, admins, courses, assignments, exams, messages, unreadMessages: unread }, activity })
}

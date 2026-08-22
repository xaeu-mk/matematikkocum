import { requireSession } from './auth/_require.js'
import { randomId, hashPassword } from './auth/_crypto.js'

const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}})
const now = () => new Date().toISOString()
const safe = (v='') => String(v).trim()

async function ensureSchema(db){
  const statements = [
    `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY,sender_id TEXT NOT NULL,receiver_id TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id,created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id,receiver_id,created_at)`,
    `CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT,start_at TEXT NOT NULL,end_at TEXT,type TEXT DEFAULT 'study',created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id,start_at)`,
    `CREATE TABLE IF NOT EXISTS coaching_plans (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,coach_id TEXT,goal TEXT NOT NULL,status TEXT DEFAULT 'active',notes TEXT,next_review_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(coach_id) REFERENCES users(id) ON DELETE SET NULL)`,
    `CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,teacher_id TEXT,title TEXT NOT NULL,score REAL,feedback TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
    `CREATE TABLE IF NOT EXISTS progress_entries (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,metric TEXT NOT NULL,value REAL NOT NULL,target REAL,period TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS idx_progress_student ON progress_entries(student_id,created_at)`,
    `CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,url TEXT NOT NULL,subject TEXT,teacher_id TEXT,is_active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
    `CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY,theme TEXT DEFAULT 'dark',notifications INTEGER DEFAULT 1,language TEXT DEFAULT 'tr',updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL)`
  ]
  for (const sql of statements) await db.prepare(sql).run()
}

async function session(context){
  const db=context.env?.DB
  if(!db) return {db,error:json({ok:false,error:'D1 bağlantısı bulunamadı.'},503)}
  const auth=await requireSession(context.request,db)
  if(!auth.ok) return {db,error:json({ok:false,error:'Oturum geçersiz veya süresi dolmuş.'},auth.status)}
  return {db,user:{id:auth.session.user_id,username:auth.session.username,fullName:auth.session.full_name,role:auth.session.role}}
}

const userScope = (user,tableAlias='') => {
  const p=tableAlias ? tableAlias+'.' : ''
  return user.role==='admin' ? {sql:'1=1',bind:[]} : {sql:`${p}id = ?`,bind:[user.id]}
}

async function dashboard(db,user){
  const count = async (sql,bind=[]) => (await db.prepare(sql).bind(...bind).first())?.n || 0
  let students=0,teachers=0,parents=0,courses=0,assignments=0,exams=0,messages=0,unread=0
  if(user.role==='admin'){
    students=await count("SELECT COUNT(*) n FROM users WHERE role='student' AND is_active=1")
    teachers=await count("SELECT COUNT(*) n FROM users WHERE role='teacher' AND is_active=1")
    parents=await count("SELECT COUNT(*) n FROM users WHERE role='parent' AND is_active=1")
    courses=await count('SELECT COUNT(*) n FROM courses')
    assignments=await count('SELECT COUNT(*) n FROM assignments')
    exams=await count('SELECT COUNT(*) n FROM exams')
    messages=await count('SELECT COUNT(*) n FROM messages')
    unread=await count('SELECT COUNT(*) n FROM messages WHERE read_at IS NULL')
  } else if(user.role==='teacher'){
    courses=await count('SELECT COUNT(*) n FROM courses WHERE teacher_id=?',[user.id]); assignments=await count('SELECT COUNT(*) n FROM assignments WHERE teacher_id=?',[user.id]); exams=await count('SELECT COUNT(*) n FROM exams WHERE teacher_id=?',[user.id]); messages=await count('SELECT COUNT(*) n FROM messages WHERE receiver_id=?',[user.id]); unread=await count('SELECT COUNT(*) n FROM messages WHERE receiver_id=? AND read_at IS NULL',[user.id]); students=await count('SELECT COUNT(*) n FROM teacher_student_links WHERE teacher_id=?',[user.id])
  } else if(user.role==='student'){
    courses=await count('SELECT COUNT(*) n FROM courses c JOIN teacher_student_links l ON l.teacher_id=c.teacher_id WHERE l.student_id=?',[user.id]); assignments=await count('SELECT COUNT(*) n FROM assignment_students WHERE student_id=? AND status!=\'completed\'',[user.id]); exams=await count('SELECT COUNT(*) n FROM exam_results WHERE student_id=?',[user.id]); messages=await count('SELECT COUNT(*) n FROM messages WHERE receiver_id=?',[user.id]); unread=await count('SELECT COUNT(*) n FROM messages WHERE receiver_id=? AND read_at IS NULL',[user.id])
  } else {
    students=await count('SELECT COUNT(*) n FROM parent_student_links WHERE parent_id=?',[user.id]); messages=await count('SELECT COUNT(*) n FROM messages WHERE receiver_id=?',[user.id]); unread=await count('SELECT COUNT(*) n FROM messages WHERE receiver_id=? AND read_at IS NULL',[user.id])
  }
  const activity=await db.prepare(`SELECT a.action,a.created_at,u.username,u.full_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 8`).all()
  const events=await db.prepare(`SELECT id,title,start_at,end_at,type,description FROM calendar_events WHERE user_id=? ORDER BY start_at ASC LIMIT 8`).bind(user.id).all()
  const goals=await db.prepare(`SELECT * FROM coaching_plans WHERE student_id=? OR coach_id=? ORDER BY updated_at DESC LIMIT 6`).bind(user.id,user.id).all()
  const progress=await db.prepare(`SELECT metric,value,target,period,created_at FROM progress_entries WHERE student_id=? ORDER BY created_at DESC LIMIT 12`).bind(user.id).all()
  return {stats:{students,teachers,parents,courses,assignments,exams,messages,unreadMessages:unread},activity:activity.results||[],events:events.results||[],goals:goals.results||[],progress:progress.results||[]}
}

async function resourceList(db,user,resource){
  if(resource==='courses'){
    const q=user.role==='admin'?db.prepare(`SELECT c.*,u.full_name teacher_name FROM courses c LEFT JOIN users u ON u.id=c.teacher_id ORDER BY c.created_at DESC`):user.role==='teacher'?db.prepare(`SELECT c.*,u.full_name teacher_name FROM courses c LEFT JOIN users u ON u.id=c.teacher_id WHERE c.teacher_id=? ORDER BY c.created_at DESC`).bind(user.id):db.prepare(`SELECT c.*,u.full_name teacher_name FROM courses c LEFT JOIN users u ON u.id=c.teacher_id WHERE c.is_active=1 ORDER BY c.created_at DESC`)
    return (await q.all()).results||[]
  }
  if(resource==='assignments'){
    let q
    if(user.role==='admin') q=db.prepare(`SELECT a.*,c.title course_title,u.full_name teacher_name FROM assignments a LEFT JOIN courses c ON c.id=a.course_id LEFT JOIN users u ON u.id=a.teacher_id ORDER BY a.due_at ASC`)
    else if(user.role==='teacher') q=db.prepare(`SELECT a.*,c.title course_title FROM assignments a LEFT JOIN courses c ON c.id=a.course_id WHERE a.teacher_id=? ORDER BY a.due_at ASC`).bind(user.id)
    else q=db.prepare(`SELECT a.*,c.title course_title,u.full_name teacher_name,s.status,s.submitted_at FROM assignments a JOIN assignment_students s ON s.assignment_id=a.id LEFT JOIN courses c ON c.id=a.course_id LEFT JOIN users u ON u.id=a.teacher_id WHERE s.student_id=? ORDER BY a.due_at ASC`).bind(user.id)
    return (await q.all()).results||[]
  }
  if(resource==='exams'){
    const q=user.role==='admin'?db.prepare(`SELECT e.*,u.full_name teacher_name FROM exams e LEFT JOIN users u ON u.id=e.teacher_id ORDER BY e.starts_at ASC`):user.role==='teacher'?db.prepare(`SELECT e.* FROM exams e WHERE e.teacher_id=? ORDER BY e.starts_at ASC`).bind(user.id):db.prepare(`SELECT e.*,r.score,r.correct_count,r.wrong_count,r.empty_count FROM exams e JOIN exam_results r ON r.exam_id=e.id WHERE r.student_id=? ORDER BY e.starts_at ASC`).bind(user.id)
    return (await q.all()).results||[]
  }
  if(resource==='calendar') return (await db.prepare(`SELECT * FROM calendar_events WHERE user_id=? ORDER BY start_at ASC`).bind(user.id).all()).results||[]
  if(resource==='messages') return (await db.prepare(`SELECT m.*,s.full_name sender_name,r.full_name receiver_name FROM messages m JOIN users s ON s.id=m.sender_id JOIN users r ON r.id=m.receiver_id WHERE m.sender_id=? OR m.receiver_id=? ORDER BY m.created_at DESC LIMIT 100`).bind(user.id,user.id).all()).results||[]
  if(resource==='videos') return (await db.prepare(`SELECT v.*,u.full_name teacher_name FROM videos v LEFT JOIN users u ON u.id=v.teacher_id WHERE v.is_active=1 ORDER BY v.created_at DESC`).all()).results||[]
  if(resource==='coaching') return (await db.prepare(`SELECT p.*,s.full_name student_name,c.full_name coach_name FROM coaching_plans p JOIN users s ON s.id=p.student_id LEFT JOIN users c ON c.id=p.coach_id WHERE p.student_id=? OR p.coach_id=? ORDER BY p.updated_at DESC`).bind(user.id,user.id).all()).results||[]
  if(resource==='evaluations') return (await db.prepare(`SELECT e.*,s.full_name student_name,t.full_name teacher_name FROM evaluations e JOIN users s ON s.id=e.student_id LEFT JOIN users t ON t.id=e.teacher_id WHERE e.student_id=? OR e.teacher_id=? ORDER BY e.created_at DESC`).bind(user.id,user.id).all()).results||[]
  if(resource==='progress') return (await db.prepare(`SELECT * FROM progress_entries WHERE student_id=? ORDER BY created_at DESC`).bind(user.id).all()).results||[]
  if(resource==='announcements') return (await db.prepare(`SELECT a.*,u.full_name author_name FROM announcements a LEFT JOIN users u ON u.id=a.created_by ORDER BY a.created_at DESC LIMIT 30`).all()).results||[]
  if(resource==='students'){
    if(user.role==='teacher') return (await db.prepare(`SELECT u.id,u.username,u.full_name,u.email,sp.grade_level,sp.goal FROM users u JOIN teacher_student_links l ON l.student_id=u.id LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE l.teacher_id=?`).bind(user.id).all()).results||[]
    if(user.role==='parent') return (await db.prepare(`SELECT u.id,u.username,u.full_name,u.email,sp.grade_level,sp.goal FROM users u JOIN parent_student_links l ON l.student_id=u.id LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE l.parent_id=?`).bind(user.id).all()).results||[]
    if(user.role==='admin') return (await db.prepare(`SELECT u.id,u.username,u.full_name,u.email,sp.grade_level,sp.goal FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.role='student'`).all()).results||[]
  }
  return []
}

async function createResource(db,user,resource,body){
  const id=randomId(), created=now()
  if(resource==='courses'){
    if(!['admin','teacher'].includes(user.role)) return null
    await db.prepare(`INSERT INTO courses(id,title,description,subject,teacher_id,is_active,created_at) VALUES(?,?,?,?,?,?,?)`).bind(id,safe(body.title),safe(body.description),safe(body.subject),user.role==='teacher'?user.id:(body.teacherId||null),1,created).run(); return {id}
  }
  if(resource==='assignments'){
    if(!['admin','teacher'].includes(user.role)) return null
    await db.prepare(`INSERT INTO assignments(id,title,description,course_id,teacher_id,due_at,created_at) VALUES(?,?,?,?,?,?,?)`).bind(id,safe(body.title),safe(body.description),body.courseId||null,user.role==='teacher'?user.id:(body.teacherId||null),body.dueAt||null,created).run()
    if(Array.isArray(body.studentIds)) for(const sid of body.studentIds) await db.prepare(`INSERT OR IGNORE INTO assignment_students(assignment_id,student_id) VALUES(?,?)`).bind(id,sid).run()
    return {id}
  }
  if(resource==='calendar'){
    await db.prepare(`INSERT INTO calendar_events(id,user_id,title,description,start_at,end_at,type,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(id,user.id,safe(body.title),safe(body.description),body.startAt,body.endAt||body.startAt,body.type||'study',user.id,created).run(); return {id}
  }
  if(resource==='messages'){
    if(!body.receiverId || !body.body) return null
    await db.prepare(`INSERT INTO messages(id,sender_id,receiver_id,body,created_at) VALUES(?,?,?,?,?)`).bind(id,user.id,body.receiverId,safe(body.body),created).run(); return {id}
  }
  if(resource==='coaching'){
    if(!['admin','teacher'].includes(user.role)) return null
    await db.prepare(`INSERT INTO coaching_plans(id,student_id,coach_id,goal,status,notes,next_review_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(id,body.studentId,user.id,safe(body.goal),'active',safe(body.notes),body.nextReviewAt||null,created,created).run(); return {id}
  }
  if(resource==='evaluations'){
    if(!['admin','teacher'].includes(user.role)) return null
    await db.prepare(`INSERT INTO evaluations(id,student_id,teacher_id,title,score,feedback,created_at) VALUES(?,?,?,?,?,?,?)`).bind(id,body.studentId,user.id,safe(body.title),Number(body.score)||0,safe(body.feedback),created).run(); return {id}
  }
  if(resource==='progress'){
    const studentId=user.role==='student'?user.id:body.studentId
    if(!studentId) return null
    await db.prepare(`INSERT INTO progress_entries(id,student_id,metric,value,target,period,created_at) VALUES(?,?,?,?,?,?,?)`).bind(id,studentId,safe(body.metric),Number(body.value)||0,body.target==null?null:Number(body.target),safe(body.period),created).run(); return {id}
  }
  if(resource==='videos'){
    if(!['admin','teacher'].includes(user.role)) return null
    await db.prepare(`INSERT INTO videos(id,title,description,url,subject,teacher_id,is_active,created_at) VALUES(?,?,?,?,?,?,?,?)`).bind(id,safe(body.title),safe(body.description),safe(body.url),safe(body.subject),user.id,1,created).run(); return {id}
  }
  if(resource==='announcements'){
    if(user.role!=='admin') return null
    await db.prepare(`INSERT INTO announcements(id,title,body,created_by,created_at) VALUES(?,?,?,?,?)`).bind(id,safe(body.title),safe(body.body),user.id,created).run(); return {id}
  }
  return null
}

export async function onRequest(context){
  const {db,user,error}=await session(context); if(error) return error
  try{
    await ensureSchema(db)
    const url=new URL(context.request.url), resource=url.searchParams.get('resource')||'dashboard'
    if(context.request.method==='GET'){
      if(resource==='dashboard') return json({ok:true,user,data:await dashboard(db,user)})
      if(resource==='settings'){
        let settings=await db.prepare('SELECT * FROM user_settings WHERE user_id=?').bind(user.id).first()
        if(!settings){ await db.prepare(`INSERT INTO user_settings(user_id) VALUES(?)`).bind(user.id).run(); settings=await db.prepare('SELECT * FROM user_settings WHERE user_id=?').bind(user.id).first() }
        return json({ok:true,settings})
      }
      return json({ok:true,items:await resourceList(db,user,resource)})
    }
    const body=await context.request.json().catch(()=>({}))
    if(context.request.method==='POST'){
      const result=await createResource(db,user,resource,body)
      if(!result) return json({ok:false,error:'Bu işlem için yetkiniz yok veya eksik bilgi var.'},403)
      await db.prepare('INSERT INTO audit_logs(id,user_id,action,target_id,metadata,created_at) VALUES(?,?,?,?,?,?)').bind(randomId(),user.id,`create_${resource}`,result.id,JSON.stringify(body),now()).run()
      return json({ok:true,...result},201)
    }
    return json({ok:false,error:'Method desteklenmiyor.'},405)
  }catch(error){
    console.error('APP_ERROR',error)
    return json({ok:false,error:error?.message||'Beklenmeyen sunucu hatası.'},500)
  }
}

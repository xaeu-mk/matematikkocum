import { requireSession } from '../auth/_require.js'

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})

const statements=[
`CREATE TABLE IF NOT EXISTS student_profiles (user_id TEXT PRIMARY KEY,grade_level TEXT,school_name TEXT,goal TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS parent_student_links (parent_id TEXT NOT NULL,student_id TEXT NOT NULL,relationship TEXT,PRIMARY KEY(parent_id,student_id),FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS teacher_student_links (teacher_id TEXT NOT NULL,student_id TEXT NOT NULL,PRIMARY KEY(teacher_id,student_id),FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,subject TEXT,teacher_id TEXT,is_active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,course_id TEXT,teacher_id TEXT,due_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE TABLE IF NOT EXISTS assignment_students (assignment_id TEXT NOT NULL,student_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',submitted_at TEXT,PRIMARY KEY(assignment_id,student_id),FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY,title TEXT NOT NULL,subject TEXT,starts_at TEXT,duration_minutes INTEGER,teacher_id TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE TABLE IF NOT EXISTS exam_results (id TEXT PRIMARY KEY,exam_id TEXT NOT NULL,student_id TEXT NOT NULL,score REAL,correct_count INTEGER DEFAULT 0,wrong_count INTEGER DEFAULT 0,empty_count INTEGER DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY,sender_id TEXT NOT NULL,receiver_id TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id,created_at)`,
`CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id,receiver_id,created_at)`,
`CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT,start_at TEXT NOT NULL,end_at TEXT NOT NULL,type TEXT DEFAULT 'study',created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id,start_at)`,
`CREATE TABLE IF NOT EXISTS coaching_plans (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,coach_id TEXT,goal TEXT NOT NULL,status TEXT DEFAULT 'active',notes TEXT,next_review_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(coach_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,teacher_id TEXT,title TEXT NOT NULL,score REAL,feedback TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE TABLE IF NOT EXISTS progress_entries (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,metric TEXT NOT NULL,value REAL NOT NULL,target REAL,period TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE INDEX IF NOT EXISTS idx_progress_student ON progress_entries(student_id,created_at)`,
`CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,url TEXT NOT NULL,subject TEXT,teacher_id TEXT,is_active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
`CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY,theme TEXT DEFAULT 'dark',notifications INTEGER DEFAULT 1,language TEXT DEFAULT 'tr',updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
`CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL)`
]

export async function onRequest(context){
  const db=context.env?.DB
  if(!db) return json({ok:false,error:'D1 bağlantısı bulunamadı.'},503)
  const auth=await requireSession(context.request,db)
  if(!auth.ok || auth.session.role!=='admin') return json({ok:false,error:'Yetkisiz.'},403)
  try{
    for(const sql of statements) await db.prepare(sql).run()
    return json({ok:true,message:'D1 şeması güncellendi.',tables:statements.length})
  }catch(error){
    return json({ok:false,error:error?.message||'Migration başarısız.'},500)
  }
}

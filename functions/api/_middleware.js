const schema = [
  `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY,user_id TEXT,action TEXT NOT NULL,target_id TEXT,metadata TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS student_profiles (user_id TEXT PRIMARY KEY,grade_level TEXT,school_name TEXT,goal TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS parent_student_links (parent_id TEXT NOT NULL,student_id TEXT NOT NULL,relationship TEXT,PRIMARY KEY(parent_id,student_id),FOREIGN KEY(parent_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS teacher_student_links (teacher_id TEXT NOT NULL,student_id TEXT NOT NULL,PRIMARY KEY(teacher_id,student_id),FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,subject TEXT,teacher_id TEXT,is_active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,course_id TEXT,teacher_id TEXT,due_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS assignment_students (assignment_id TEXT NOT NULL,student_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',submitted_at TEXT,PRIMARY KEY(assignment_id,student_id),FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY,title TEXT NOT NULL,subject TEXT,starts_at TEXT,duration_minutes INTEGER,teacher_id TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS exam_results (id TEXT PRIMARY KEY,exam_id TEXT NOT NULL,student_id TEXT NOT NULL,score REAL,correct_count INTEGER DEFAULT 0,wrong_count INTEGER DEFAULT 0,empty_count INTEGER DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY,sender_id TEXT NOT NULL,receiver_id TEXT NOT NULL,body TEXT NOT NULL,read_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT,start_at TEXT NOT NULL,end_at TEXT NOT NULL,type TEXT DEFAULT 'study',created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS coaching_plans (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,coach_id TEXT,goal TEXT NOT NULL,status TEXT DEFAULT 'active',notes TEXT,next_review_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(coach_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,teacher_id TEXT,title TEXT NOT NULL,score REAL,feedback TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS progress_entries (id TEXT PRIMARY KEY,student_id TEXT NOT NULL,metric TEXT NOT NULL,value REAL NOT NULL,target REAL,period TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,url TEXT NOT NULL,subject TEXT,teacher_id TEXT,is_active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS user_settings (user_id TEXT PRIMARY KEY,theme TEXT DEFAULT 'dark',notifications INTEGER DEFAULT 1,language TEXT DEFAULT 'tr',updated_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS announcements (id TEXT PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,created_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS calendar_blocks (id TEXT PRIMARY KEY,teacher_id TEXT NOT NULL,date TEXT NOT NULL,start_time TEXT NOT NULL,end_time TEXT NOT NULL,reason TEXT,created_by TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS class_groups (id TEXT PRIMARY KEY,name TEXT NOT NULL,teacher_id TEXT,description TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE SET NULL)`,
  `CREATE TABLE IF NOT EXISTS student_group_links (student_id TEXT NOT NULL,group_id TEXT NOT NULL,PRIMARY KEY(student_id,group_id),FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,FOREIGN KEY(group_id) REFERENCES class_groups(id) ON DELETE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS idx_calendar_blocks_teacher ON calendar_blocks(teacher_id,date)`,
  `CREATE INDEX IF NOT EXISTS idx_class_groups_teacher ON class_groups(teacher_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id,created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id,receiver_id,created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id,start_at)`,
  `CREATE INDEX IF NOT EXISTS idx_progress_student ON progress_entries(student_id,created_at)`
]

export async function onRequest(context) {
  const db = context.env?.DB
  if (!db) return context.next()
  try {
    for (const sql of schema) await db.prepare(sql).run()
  } catch (error) {
    console.error('D1 schema initialization failed', error)
  }
  return context.next()
}

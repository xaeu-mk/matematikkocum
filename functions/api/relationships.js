import { requireSession } from './auth/_require.js'
import { randomId, hashPassword } from './auth/_crypto.js'

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})
const safe=v=>String(v??'').trim()
const now=()=>new Date().toISOString()

async function auth(context){
 const db=context.env?.DB
 if(!db)return {error:json({ok:false,error:'D1 bağlantısı bulunamadı.'},503)}
 const a=await requireSession(context.request,db)
 if(!a.ok)return {error:json({ok:false,error:'Oturum geçersiz.'},a.status)}
 return {db,user:{id:a.session.user_id,username:a.session.username,fullName:a.session.full_name,role:a.session.role}}
}

async function canManagePerson(db,user,targetId){
 if(user.role==='admin')return true
 if(user.role!=='teacher')return false
 const ownStudent=await db.prepare('SELECT 1 FROM teacher_student_links WHERE teacher_id=? AND student_id=? LIMIT 1').bind(user.id,targetId).first()
 if(ownStudent)return true
 const ownParent=await db.prepare(`SELECT 1 FROM parent_student_links psl JOIN teacher_student_links tsl ON tsl.student_id=psl.student_id WHERE psl.parent_id=? AND tsl.teacher_id=? LIMIT 1`).bind(targetId,user.id).first()
 return !!ownParent
}

async function listPeople(db,user,q=''){
 const like=`%${safe(q)}%`
 let sql=`SELECT u.id,u.username,u.full_name,u.email,sp.grade_level,sp.school_name,sp.goal FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.role='student' AND u.is_active=1 AND (u.full_name LIKE ? OR u.username LIKE ? OR COALESCE(u.email,'') LIKE ?)`
 const binds=[like,like,like]
 if(user.role==='teacher'){sql+=` AND EXISTS(SELECT 1 FROM teacher_student_links l WHERE l.student_id=u.id AND l.teacher_id=?)`;binds.push(user.id)}
 const students=(await db.prepare(sql+' ORDER BY u.full_name').bind(...binds).all()).results||[]
 const ids=students.map(x=>x.id)
 if(!ids.length)return {students,parents:[],teachers:[]}
 const ph=ids.map(()=>'?').join(',')
 const parents=(await db.prepare(`SELECT p.id,p.username,p.full_name,p.email,psl.student_id,psl.relationship FROM users p JOIN parent_student_links psl ON psl.parent_id=p.id WHERE p.role='parent' AND p.is_active=1 AND psl.student_id IN (${ph}) ORDER BY p.full_name`).bind(...ids).all()).results||[]
 let teachers=[]
 if(user.role==='admin')teachers=(await db.prepare(`SELECT id,username,full_name,email FROM users WHERE role='teacher' AND is_active=1 AND (full_name LIKE ? OR username LIKE ? OR COALESCE(email,'') LIKE ?) ORDER BY full_name`).bind(like,like,like).all()).results||[]
 return {students,parents,teachers}
}

export async function onRequest(context){
 const {db,user,error}=await auth(context);if(error)return error
 try{
  const url=new URL(context.request.url),action=url.searchParams.get('action')||'list',q=url.searchParams.get('q')||''
  if(context.request.method==='GET'){
   if(action==='list')return json({ok:true,...await listPeople(db,user,q)})
   if(action==='tree'){
    if(user.role!=='admin')return json({ok:false,error:'Yetkiniz yok.'},403)
    const data=await listPeople(db,user,q)
    const byStudent=new Map(data.students.map(s=>[s.id,{...s,parents:[]}]))
    data.parents.forEach(p=>byStudent.get(p.student_id)?.parents.push(p))
    const links=(await db.prepare(`SELECT tsl.teacher_id,tsl.student_id FROM teacher_student_links tsl JOIN users t ON t.id=tsl.teacher_id WHERE t.role='teacher' AND t.is_active=1`).all()).results||[]
    const teachers=data.teachers.map(t=>({...t,students:[]})),byTeacher=new Map(teachers.map(t=>[t.id,t]))
    links.forEach(l=>{const s=byStudent.get(l.student_id),t=byTeacher.get(l.teacher_id);if(s&&t)t.students.push(s)})
    return json({ok:true,teachers})
   }
   if(action==='profile'){
    const targetId=url.searchParams.get('userId')||user.id
    if(targetId!==user.id&&!(await canManagePerson(db,user,targetId)))return json({ok:false,error:'Bu kullanıcıyı görüntüleme yetkiniz yok.'},403)
    const row=await db.prepare(`SELECT u.id,u.username,u.full_name,u.email,u.role,sp.grade_level,sp.school_name,sp.goal,COALESCE(s.avatar_data,'') avatar_data,COALESCE(s.avatar_upload_allowed,1) avatar_upload_allowed FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id LEFT JOIN user_settings s ON s.user_id=u.id WHERE u.id=?`).bind(targetId).first()
    if(!row)return json({ok:false,error:'Kullanıcı bulunamadı.'},404)
    return json({ok:true,profile:row})
   }
   return json({ok:false,error:'Geçersiz işlem.'},400)
  }
  if(context.request.method!=='POST')return json({ok:false,error:'Method desteklenmiyor.'},405)
  const body=await context.request.json().catch(()=>({}))

  if(action==='create-parent'){
   if(!['admin','teacher'].includes(user.role))return json({ok:false,error:'Yetkiniz yok.'},403)
   const studentId=safe(body.studentId),username=safe(body.username),fullName=safe(body.fullName)
   if(!studentId||!username||!fullName||!body.password)return json({ok:false,error:'Öğrenci, kullanıcı adı, ad soyad ve şifre zorunlu.'},400)
   const student=await db.prepare(`SELECT id FROM users WHERE id=? AND role='student' AND is_active=1`).bind(studentId).first()
   if(!student)return json({ok:false,error:'Öğrenci bulunamadı.'},404)
   if(user.role==='teacher'&&!(await canManagePerson(db,user,studentId)))return json({ok:false,error:'Bu öğrenciye bağlı değilsiniz.'},403)
   if(await db.prepare('SELECT id FROM users WHERE username=?').bind(username).first())return json({ok:false,error:'Bu kullanıcı adı zaten kullanılıyor.'},409)
   const id=randomId(),salt=randomId(),hash=await hashPassword(body.password,salt),created=now()
   await db.prepare(`INSERT INTO users(id,username,password_hash,password_salt,password_iterations,role,full_name,email,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).bind(id,username,hash,salt,100000,'parent',fullName,safe(body.email||''),1,created,created).run()
   await db.prepare(`INSERT INTO parent_student_links(parent_id,student_id,relationship) VALUES(?,?,?)`).bind(id,studentId,safe(body.relationship||'Veli')).run()
   return json({ok:true,id},201)
  }

  if(action==='update-person'){
   const targetId=safe(body.userId)
   if(!targetId||!(await canManagePerson(db,user,targetId)))return json({ok:false,error:'Bu kullanıcıyı düzenleme yetkiniz yok.'},403)
   const target=await db.prepare('SELECT id,role FROM users WHERE id=?').bind(targetId).first()
   if(!target||!['student','parent'].includes(target.role))return json({ok:false,error:'Bu kullanıcı düzenlenemez.'},400)
   await db.prepare(`UPDATE users SET full_name=?,email=?,updated_at=? WHERE id=?`).bind(safe(body.fullName),safe(body.email||''),now(),targetId).run()
   if(target.role==='student')await db.prepare(`INSERT OR REPLACE INTO student_profiles(user_id,grade_level,school_name,goal) VALUES(?,?,?,?)`).bind(targetId,safe(body.gradeLevel||''),safe(body.schoolName||''),safe(body.goal||'')).run()
   return json({ok:true})
  }

  if(action==='set-photo-permission'){
   const targetId=safe(body.userId)
   if(!targetId||!(await canManagePerson(db,user,targetId)))return json({ok:false,error:'Yetkiniz yok.'},403)
   const target=await db.prepare('SELECT role FROM users WHERE id=?').bind(targetId).first()
   if(!target||!['student','parent'].includes(target.role))return json({ok:false,error:'Sadece öğrenci/veli için ayarlanabilir.'},400)
   await db.prepare(`INSERT INTO user_settings(user_id,avatar_upload_allowed) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET avatar_upload_allowed=excluded.avatar_upload_allowed,updated_at=?`).bind(targetId,body.allowed?1:0,now()).run()
   return json({ok:true,allowed:!!body.allowed})
  }

  if(action==='upload-avatar'){
   const targetId=safe(body.userId)||user.id
   if(targetId!==user.id&&!(await canManagePerson(db,user,targetId)))return json({ok:false,error:'Yetkiniz yok.'},403)
   const target=await db.prepare('SELECT role FROM users WHERE id=?').bind(targetId).first()
   if(!target)return json({ok:false,error:'Kullanıcı bulunamadı.'},404)
   const setting=await db.prepare('SELECT avatar_upload_allowed FROM user_settings WHERE user_id=?').bind(targetId).first()
   if(targetId===user.id&&['student','parent'].includes(target.role)&&setting&&Number(setting.avatar_upload_allowed)===0)return json({ok:false,error:'Profil fotoğrafı yüklemeniz engellendi.'},403)
   const data=safe(body.avatarData)
   if(!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data))return json({ok:false,error:'Geçersiz profil fotoğrafı.'},400)
   if(data.length>600000)return json({ok:false,error:'Profil fotoğrafı çok büyük. Daha küçük bir fotoğraf seçin.'},413)
   await db.prepare(`INSERT INTO user_settings(user_id,avatar_data) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET avatar_data=excluded.avatar_data,updated_at=?`).bind(targetId,data,now()).run()
   return json({ok:true,avatarData:data})
  }

  return json({ok:false,error:'Geçersiz işlem.'},400)
 }catch(e){console.error('RELATIONSHIPS_ERROR',e);return json({ok:false,error:e?.message||'Beklenmeyen hata.'},500)}
}

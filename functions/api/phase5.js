import { requireSession } from './auth/_require.js'
import { randomId } from './auth/_crypto.js'

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})
const safe=v=>String(v??'').trim()
const okRole=(r,roles)=>roles.includes(r)

export async function onRequest(context){
  const db=context.env?.DB
  if(!db)return json({ok:false,error:'D1 bağlantısı bulunamadı.'},503)
  const auth=await requireSession(context.request,db)
  if(!auth.ok)return json({ok:false,error:'Oturum geçersiz.'},auth.status)
  const user={id:auth.session.user_id,role:auth.session.role}
  const url=new URL(context.request.url), action=url.searchParams.get('action')||''
  try{
    if(action==='student-center'){
      const studentId=safe(url.searchParams.get('studentId'))
      if(!studentId)return json({ok:false,error:'Öğrenci seçilmedi.'},400)
      const allowed=await db.prepare(`SELECT 1 FROM users s WHERE s.id=? AND s.role='student' AND (?='admin' OR (?='teacher' AND EXISTS(SELECT 1 FROM teacher_student_links l WHERE l.student_id=s.id AND l.teacher_id=?)) OR (?='parent' AND EXISTS(SELECT 1 FROM parent_student_links l WHERE l.student_id=s.id AND l.parent_id=?)) OR (?='student' AND s.id=?))`).bind(studentId,user.role,user.role,user.id,user.role,user.id,user.role,user.id).first()
      if(!allowed)return json({ok:false,error:'Bu öğrenciye erişim yetkiniz yok.'},403)
      const [student,assignments,exams,evaluations,progress]=await Promise.all([
        db.prepare(`SELECT u.id,u.username,u.full_name,u.email,sp.grade_level,sp.goal FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.id=?`).bind(studentId).first(),
        db.prepare(`SELECT a.id,a.title,a.due_at,s.status,s.submitted_at FROM assignments a JOIN assignment_students s ON s.assignment_id=a.id WHERE s.student_id=? ORDER BY a.due_at DESC LIMIT 30`).bind(studentId).all(),
        db.prepare(`SELECT e.id,e.title,e.subject,e.starts_at,r.score,r.correct_count,r.wrong_count,r.empty_count FROM exams e JOIN exam_results r ON r.exam_id=e.id WHERE r.student_id=? ORDER BY e.starts_at DESC LIMIT 30`).bind(studentId).all(),
        db.prepare(`SELECT e.id,e.title,e.score,e.feedback,e.created_at,t.full_name teacher_name FROM evaluations e LEFT JOIN users t ON t.id=e.teacher_id WHERE e.student_id=? ORDER BY e.created_at DESC LIMIT 30`).bind(studentId).all(),
        db.prepare(`SELECT metric,value,target,period,created_at FROM progress_entries WHERE student_id=? ORDER BY created_at DESC LIMIT 30`).bind(studentId).all()
      ])
      return json({ok:true,student,assignments:assignments.results||[],exams:exams.results||[],evaluations:evaluations.results||[],progress:progress.results||[]})
    }
    if(action==='exam-stats'){
      if(!okRole(user.role,['admin','teacher']))return json({ok:false,error:'Yetkiniz yok.'},403)
      const scope=user.role==='teacher'?'WHERE e.teacher_id=?':''
      const q=user.role==='teacher'?db.prepare(`SELECT e.subject,COUNT(r.id) result_count,ROUND(AVG(r.score),1) average_score,MAX(r.score) max_score,MIN(r.score) min_score FROM exams e LEFT JOIN exam_results r ON r.exam_id=e.id ${scope} GROUP BY e.subject ORDER BY average_score DESC`).bind(user.id):db.prepare(`SELECT e.subject,COUNT(r.id) result_count,ROUND(AVG(r.score),1) average_score,MAX(r.score) max_score,MIN(r.score) min_score FROM exams e LEFT JOIN exam_results r ON r.exam_id=e.id GROUP BY e.subject ORDER BY average_score DESC`)
      return json({ok:true,items:(await q.all()).results||[]})
    }
    if(action==='calendar-block'){
      if(!okRole(user.role,['admin','teacher']))return json({ok:false,error:'Yetkiniz yok.'},403)
      const body=await context.request.json(), start=safe(body.startAt), end=safe(body.endAt), title=safe(body.title||'Kapalı Saat')
      if(!start||!end)return json({ok:false,error:'Başlangıç ve bitiş gerekli.'},400)
      const id=randomId()
      await db.prepare(`INSERT INTO calendar_events(id,user_id,title,description,start_at,end_at,type,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).bind(id,user.id,title,'Toplu kapatılan zaman',start,end,'blocked',user.id,new Date().toISOString()).run()
      return json({ok:true,id})
    }
    if(action==='calendar-unblock'){
      if(!okRole(user.role,['admin','teacher']))return json({ok:false,error:'Yetkiniz yok.'},403)
      const body=await context.request.json(), start=safe(body.startAt), end=safe(body.endAt)
      if(!start||!end)return json({ok:false,error:'Aralık gerekli.'},400)
      await db.prepare(`DELETE FROM calendar_events WHERE user_id=? AND type='blocked' AND start_at>=? AND end_at<=?`).bind(user.id,start,end).run()
      return json({ok:true})
    }
    return json({ok:false,error:'Bilinmeyen işlem.'},404)
  }catch(e){return json({ok:false,error:e?.message||'İşlem başarısız.'},500)}
}

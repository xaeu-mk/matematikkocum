CREATE TABLE IF NOT EXISTS calendar_event_students (
  event_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  PRIMARY KEY (event_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_calendar_event_students_student ON calendar_event_students(student_id);

ALTER TABLE assignments ADD COLUMN attachment_name TEXT;
ALTER TABLE assignments ADD COLUMN attachment_data TEXT;
ALTER TABLE assignments ADD COLUMN attachment_size INTEGER;
ALTER TABLE assignments ADD COLUMN attachment_type TEXT;

ALTER TABLE exams ADD COLUMN attachment_name TEXT;
ALTER TABLE exams ADD COLUMN attachment_data TEXT;
ALTER TABLE exams ADD COLUMN attachment_size INTEGER;
ALTER TABLE exams ADD COLUMN attachment_type TEXT;

ALTER TABLE evaluations ADD COLUMN category TEXT;
ALTER TABLE evaluations ADD COLUMN strengths TEXT;
ALTER TABLE evaluations ADD COLUMN improvements TEXT;
ALTER TABLE evaluations ADD COLUMN teacher_note TEXT;
ALTER TABLE evaluations ADD COLUMN level TEXT;

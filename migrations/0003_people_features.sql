ALTER TABLE user_settings ADD COLUMN avatar_data TEXT;
ALTER TABLE user_settings ADD COLUMN avatar_upload_allowed INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_parent_student_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_student_student ON teacher_student_links(student_id);

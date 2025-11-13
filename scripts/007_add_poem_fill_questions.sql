-- 为古诗填空题新增题型与关联字段
ALTER TABLE questions 
MODIFY COLUMN question_type ENUM('matching','choice','poem_fill') NOT NULL DEFAULT 'matching' 
COMMENT '题目类型：matching=连线题, choice=选择题, poem_fill=古诗填空';

ALTER TABLE questions 
ADD COLUMN poem_id INT NULL COMMENT '关联的古诗ID' 
AFTER subject;

ALTER TABLE questions 
ADD CONSTRAINT fk_questions_poem 
FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE SET NULL;

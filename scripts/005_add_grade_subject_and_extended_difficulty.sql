-- 添加年级、科目，并扩展题目难度为包含“易错题”
-- 运行前请确保使用数据库：USE matching_game;

-- 1) 扩展题目难度枚举，新增 error_prone（易错题）
ALTER TABLE questions 
MODIFY COLUMN difficulty_level ENUM('easy','medium','hard','error_prone') 
DEFAULT 'easy' COMMENT '难度等级：easy=简单, medium=中等, hard=困难, error_prone=易错题';

-- 2) 添加年级字段
ALTER TABLE questions 
ADD COLUMN grade ENUM('grade1','grade2','grade3','grade4','grade5','grade6') 
NOT NULL DEFAULT 'grade1' COMMENT '年级：grade1=一年级, grade2=二年级, grade3=三年级, grade4=四年级, grade5=五年级, grade6=六年级' 
AFTER difficulty_level;

-- 3) 添加科目字段
ALTER TABLE questions 
ADD COLUMN subject ENUM('math','chinese','english','science') 
NOT NULL DEFAULT 'math' COMMENT '科目：math=数学, chinese=语文, english=英语, science=科学' 
AFTER grade;

-- 4) 为现有数据设置默认值（如果需要可以在此更新）
UPDATE questions SET grade = COALESCE(grade, 'grade1');
UPDATE questions SET subject = COALESCE(subject, 'math');

-- 5) 索引（如需按照年级/科目查询，可加索引）
ALTER TABLE questions ADD INDEX idx_grade (grade);
ALTER TABLE questions ADD INDEX idx_subject (subject);
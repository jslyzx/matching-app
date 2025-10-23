-- 更新题目表，添加题目类型字段
ALTER TABLE questions 
ADD COLUMN question_type ENUM('matching', 'choice') NOT NULL DEFAULT 'matching' 
COMMENT '题目类型：matching=连线题, choice=选择题';

-- 创建选择题选项表
CREATE TABLE IF NOT EXISTS choice_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL COMMENT '所属题目ID',
    content TEXT NOT NULL COMMENT '选项内容',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否为正确答案',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选择题选项表';

-- 插入示例选择题
INSERT INTO questions (title, description, difficulty_level, question_type) 
VALUES ('计算下面的数学表达式: \\(2x + 3 = 7\\)', '选择正确的答案', 'medium', 'choice');

SET @choice_question_id = LAST_INSERT_ID();

-- 插入选择题选项
INSERT INTO choice_options (question_id, content, is_correct, display_order) VALUES
(@choice_question_id, '\\(x = 2\\)', TRUE, 1),
(@choice_question_id, '\\(x = 3\\)', FALSE, 2),
(@choice_question_id, '\\(x = 4\\)', FALSE, 3),
(@choice_question_id, '\\(x = 5\\)', FALSE, 4);

-- 插入第二个示例选择题
INSERT INTO questions (title, description, difficulty_level, question_type) 
VALUES ('求下列方程的解: \\(x^2 - 4 = 0\\)', '选择所有正确的答案', 'hard', 'choice');

SET @choice_question_id = LAST_INSERT_ID();

-- 插入选择题选项
INSERT INTO choice_options (question_id, content, is_correct, display_order) VALUES
(@choice_question_id, '\\(x = 2\\)', TRUE, 1),
(@choice_question_id, '\\(x = -2\\)', TRUE, 2),
(@choice_question_id, '\\(x = 0\\)', FALSE, 3),
(@choice_question_id, '\\(x = 4\\)', FALSE, 4);
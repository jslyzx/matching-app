-- 创建题目表
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '题目标题',
    description TEXT COMMENT '题目说明',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy' COMMENT '难度等级',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目主表';

-- 创建题目项表（左右两列的内容）
CREATE TABLE IF NOT EXISTS question_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL COMMENT '所属题目ID',
    content VARCHAR(255) NOT NULL COMMENT '显示内容',
    side ENUM('left', 'right') NOT NULL COMMENT '所在列：left=左列, right=右列',
    match_item_id INT COMMENT '正确匹配的项目ID（指向右列的ID）',
    display_order INT DEFAULT 0 COMMENT '显示顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_question_id (question_id),
    INDEX idx_side (side)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='题目项表';

-- 创建用户答题记录表（可选，用于统计）
CREATE TABLE IF NOT EXISTS user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) COMMENT '用户标识（可以是设备ID或用户名）',
    question_id INT NOT NULL COMMENT '题目ID',
    is_correct BOOLEAN NOT NULL COMMENT '是否答对',
    attempt_count INT DEFAULT 1 COMMENT '尝试次数',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='答题记录表';

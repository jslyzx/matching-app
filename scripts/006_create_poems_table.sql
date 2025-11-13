-- 古诗表
CREATE TABLE IF NOT EXISTS poems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '诗题',
    author VARCHAR(100) NOT NULL COMMENT '作者',
    dynasty VARCHAR(50) NOT NULL COMMENT '朝代',
    genre ENUM('五言绝句','七言绝句','五言律诗','七言律诗','其他') DEFAULT '其他' COMMENT '体裁',
    content TEXT NOT NULL COMMENT '诗文全文（整首存储）',
    content_lines JSON COMMENT '按句拆分后的JSON数组，便于前端展示',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_author (author),
    INDEX idx_dynasty (dynasty),
    INDEX idx_genre (genre),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='古诗表';
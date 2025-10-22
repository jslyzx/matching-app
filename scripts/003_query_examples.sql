-- 查询所有启用的题目
SELECT * FROM questions WHERE is_active = TRUE ORDER BY id;

-- 查询某个题目的所有项目（包含匹配关系）
SELECT 
    qi1.id,
    qi1.content as left_content,
    qi1.side,
    qi2.content as match_content,
    qi2.id as match_id
FROM question_items qi1
LEFT JOIN question_items qi2 ON qi1.match_item_id = qi2.id
WHERE qi1.question_id = 1
ORDER BY qi1.side, qi1.display_order;

-- 查询用户答题统计
SELECT 
    q.title,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) as correct_count,
    ROUND(SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as accuracy_rate
FROM user_answers ua
JOIN questions q ON ua.question_id = q.id
WHERE ua.user_id = 'user123'
GROUP BY q.id, q.title;

-- 设置字符集，确保能正确插入 emoji
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 插入示例题目1：动物与食物匹配
INSERT INTO questions (title, description, difficulty_level) 
VALUES ('动物与食物', '把动物和它们喜欢吃的食物连起来', 'easy');

SET @question1_id = LAST_INSERT_ID();

-- 插入左列项目（动物）
INSERT INTO question_items (question_id, content, side, display_order) VALUES
(@question1_id, '🐱 小猫', 'left', 1),
(@question1_id, '🐶 小狗', 'left', 2),
(@question1_id, '🐰 兔子', 'left', 3),
(@question1_id, '🐵 猴子', 'left', 4);

-- 插入右列项目（食物）
INSERT INTO question_items (question_id, content, side, display_order) VALUES
(@question1_id, '🦴 骨头', 'right', 1),
(@question1_id, '🥕 胡萝卜', 'right', 2),
(@question1_id, '🐟 小鱼', 'right', 3),
(@question1_id, '🍌 香蕉', 'right', 4);

-- 使用派生表来避免 MySQL 1093 错误
-- 设置正确匹配关系
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question1_id AND content = '🐟 小鱼' AND side = 'right') AS temp) WHERE question_id = @question1_id AND content = '🐱 小猫';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question1_id AND content = '🦴 骨头' AND side = 'right') AS temp) WHERE question_id = @question1_id AND content = '🐶 小狗';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question1_id AND content = '🥕 胡萝卜' AND side = 'right') AS temp) WHERE question_id = @question1_id AND content = '🐰 兔子';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question1_id AND content = '🍌 香蕉' AND side = 'right') AS temp) WHERE question_id = @question1_id AND content = '🐵 猴子';

-- 插入示例题目2：颜色与水果匹配
INSERT INTO questions (title, description, difficulty_level) 
VALUES ('颜色与水果', '把水果和它们的颜色连起来', 'easy');

SET @question2_id = LAST_INSERT_ID();

-- 插入左列项目（水果）
INSERT INTO question_items (question_id, content, side, display_order) VALUES
(@question2_id, '🍎 苹果', 'left', 1),
(@question2_id, '🍊 橙子', 'left', 2),
(@question2_id, '🍇 葡萄', 'left', 3),
(@question2_id, '🍌 香蕉', 'left', 4);

-- 插入右列项目（颜色）
INSERT INTO question_items (question_id, content, side, display_order) VALUES
(@question2_id, '🟣 紫色', 'right', 1),
(@question2_id, '🔴 红色', 'right', 2),
(@question2_id, '🟡 黄色', 'right', 3),
(@question2_id, '🟠 橙色', 'right', 4);

-- 设置正确匹配关系
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question2_id AND content = '🔴 红色' AND side = 'right') AS temp) WHERE question_id = @question2_id AND content = '🍎 苹果';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question2_id AND content = '🟠 橙色' AND side = 'right') AS temp) WHERE question_id = @question2_id AND content = '🍊 橙子';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question2_id AND content = '🟣 紫色' AND side = 'right') AS temp) WHERE question_id = @question2_id AND content = '🍇 葡萄';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question2_id AND content = '🟡 黄色' AND side = 'right') AS temp) WHERE question_id = @question2_id AND content = '🍌 香蕉';

-- 插入示例题目3：数字与数量匹配
INSERT INTO questions (title, description, difficulty_level) 
VALUES ('数字与数量', '把数字和对应数量的物品连起来', 'medium');

SET @question3_id = LAST_INSERT_ID();

-- 插入左列项目（数字）
INSERT INTO question_items (question_id, content, side, display_order) VALUES
(@question3_id, '1️⃣ 一', 'left', 1),
(@question3_id, '2️⃣ 二', 'left', 2),
(@question3_id, '3️⃣ 三', 'left', 3),
(@question3_id, '5️⃣ 五', 'left', 4);

-- 插入右列项目（数量）
INSERT INTO question_items (question_id, content, side, display_order) VALUES
(@question3_id, '⭐⭐⭐ 三颗星', 'right', 1),
(@question3_id, '🎈 一个气球', 'right', 2),
(@question3_id, '🍎🍎 两个苹果', 'right', 3),
(@question3_id, '🌸🌸🌸🌸🌸 五朵花', 'right', 4);

-- 设置正确匹配关系
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question3_id AND content = '🎈 一个气球' AND side = 'right') AS temp) WHERE question_id = @question3_id AND content = '1️⃣ 一';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question3_id AND content = '🍎🍎 两个苹果' AND side = 'right') AS temp) WHERE question_id = @question3_id AND content = '2️⃣ 二';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question3_id AND content = '⭐⭐⭐ 三颗星' AND side = 'right') AS temp) WHERE question_id = @question3_id AND content = '3️⃣ 三';
UPDATE question_items SET match_item_id = (SELECT id FROM (SELECT id FROM question_items WHERE question_id = @question3_id AND content = '🌸🌸🌸🌸🌸 五朵花' AND side = 'right') AS temp) WHERE question_id = @question3_id AND content = '5️⃣ 五';

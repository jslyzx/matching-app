-- 创建数据库并设置字符集和排序规则
CREATE DATABASE IF NOT EXISTS matching_game 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE matching_game;

-- 显示数据库字符集信息
SELECT 
    DEFAULT_CHARACTER_SET_NAME as '字符集',
    DEFAULT_COLLATION_NAME as '排序规则'
FROM information_schema.SCHEMATA 
WHERE SCHEMA_NAME = 'matching_game';

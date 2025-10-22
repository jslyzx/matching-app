# 儿童连线匹配游戏

一个适合儿童使用的在线连线匹配题应用，支持从 MySQL 数据库读取题目。

## 功能特点

- 适配平板设备的响应式设计
- 直观的点击连线交互
- 实时视觉反馈（正确/错误）
- 支持"再试一次"功能
- 从 MySQL 数据库动态加载题目

## 数据库配置

### 1. 执行 SQL 脚本

按顺序执行 `scripts` 目录下的 SQL 文件：

\`\`\`bash
mysql -h 43.156.92.151 -u root -p < scripts/000_create_database.sql
mysql -h 43.156.92.151 -u root -p matching_game < scripts/001_create_tables.sql
mysql -h 43.156.92.151 -u root -p matching_game < scripts/002_insert_sample_data.sql
\`\`\`

### 2. 数据库连接

数据库连接配置在 `lib/db.ts` 文件中：

- 主机: 43.156.92.151
- 用户名: root
- 数据库: matching_game
- 字符集: utf8mb4

## 本地开发

\`\`\`bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
\`\`\`

## 生产部署

### 方式一：部署到 Vercel（推荐）

1. 点击 "Publish" 按钮直接部署
2. 自动获得公网访问地址

### 方式二：部署到云服务器

\`\`\`bash
# 构建项目
pnpm build

# 上传文件到服务器
# .next/, public/, package.json, next.config.mjs, lib/

# 在服务器上安装依赖并启动
pnpm install --prod
pm2 start npm --name "matching-app" -- start

# 配置 Nginx 反向代理（可选）
\`\`\`

## 添加新题目

在数据库中添加新题目：

\`\`\`sql
-- 1. 添加题目
INSERT INTO questions (title, description, difficulty_level) 
VALUES ('新题目标题', '题目描述', 'easy');

-- 2. 添加左侧选项
INSERT INTO question_items (question_id, content, side, display_order) 
VALUES (题目ID, '左侧内容1', 'left', 1);

-- 3. 添加右侧选项（match_id 指向对应的左侧选项ID）
INSERT INTO question_items (question_id, content, side, match_id, display_order) 
VALUES (题目ID, '右侧内容1', 'right', 左侧选项ID, 1);
\`\`\`

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- MySQL 8
- mysql2

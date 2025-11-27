ALTER TABLE `questions`
MODIFY COLUMN `question_type` ENUM('matching','choice','poem_fill','fill_blank') NOT NULL;
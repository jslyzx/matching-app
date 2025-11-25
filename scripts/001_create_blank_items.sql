CREATE TABLE IF NOT EXISTS `blank_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `question_id` INT NOT NULL,
  `idx` INT NOT NULL,
  `answer_text` TEXT NOT NULL,
  `hint` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_blank_items_question_idx` (`question_id`,`idx`),
  KEY `fk_blank_items_question` (`question_id`),
  CONSTRAINT `fk_blank_items_question`
    FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
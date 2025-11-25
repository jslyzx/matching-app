ALTER TABLE `blank_items`
ADD CONSTRAINT `fk_blank_items_question`
FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
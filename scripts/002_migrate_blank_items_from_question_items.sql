INSERT INTO `blank_items` (`question_id`, `idx`, `answer_text`, `hint`)
SELECT `question_id`, `display_order` AS `idx`, `content` AS `answer_text`, NULL AS `hint`
FROM `question_items`
WHERE `side` = 'blank';

DELETE FROM `question_items` WHERE `side` = 'blank';
-- Обновляем статусы автомобилей
UPDATE cars 
SET status = 'available' 
WHERE status = 'rented';

-- Удаляем старые статусы из таблицы statuses
DELETE FROM statuses 
WHERE status_name = 'rented'; 
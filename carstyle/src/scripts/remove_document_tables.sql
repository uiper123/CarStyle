-- Скрипт для удаления таблиц, связанных с документами
-- Вначале удаляем таблицу с содержимым документов (зависимую)
DROP TABLE IF EXISTS rental_document_contents;

-- Затем удаляем основную таблицу документов
DROP TABLE IF EXISTS rental_documents;

-- Также удаляем индексы, если они есть (для безопасности выполнения скрипта)
DROP INDEX IF EXISTS idx_document_order_id ON rental_documents;
DROP INDEX IF EXISTS idx_document_number ON rental_documents;

-- Подтверждение выполнения
SELECT 'Таблицы документов успешно удалены' AS message; 
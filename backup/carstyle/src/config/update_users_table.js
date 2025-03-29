import pool from '../config/database.js';

/**
 * Обновляет структуру таблицы users, добавляя поле role
 * Этот скрипт нужно запустить однократно для обновления структуры БД
 */
async function updateUsersTable() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Получаем текущую структуру таблицы users
    const [columns] = await connection.query('DESCRIBE users');
    console.log('Текущая структура таблицы users:', columns.map(col => col.Field));
    
    // Проверяем наличие поля role
    const hasRoleField = columns.some(col => col.Field === 'role');
    
    // Добавляем поле role если его нет
    if (!hasRoleField) {
      console.log('Добавляем поле role в таблицу users');
      await connection.query(
        'ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT "client"'
      );
      console.log('Поле role успешно добавлено');
    } else {
      console.log('Поле role уже существует в таблице users');
    }
    
    console.log('Обновление таблицы users завершено!');
    
  } catch (error) {
    console.error('Ошибка при обновлении таблицы users:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Соединение с базой данных закрыто');
    }
  }
}

export default updateUsersTable; 
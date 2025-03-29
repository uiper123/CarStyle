import pool from './database.js';

/**
 * Обновляет структуру таблицы users, добавляя поля created_at и updated_at
 * Этот скрипт нужно запустить однократно для обновления структуры БД
 */
export default async function updateUsersTable() {
  try {
    // Проверяем существование колонок
    const [columns] = await pool.query('SHOW COLUMNS FROM users');
    const columnNames = columns.map(col => col.Field);

    // Добавляем created_at если его нет
    if (!columnNames.includes('created_at')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('Added created_at column to users table');
    }

    // Добавляем updated_at если его нет
    if (!columnNames.includes('updated_at')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('Added updated_at column to users table');
    }

    console.log('Users table update completed successfully');
  } catch (error) {
    console.error('Error updating users table:', error);
    throw error;
  }
} 
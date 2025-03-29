import pool from './database.js';

export default async function initStatuses() {
  try {
    // Проверяем существование таблицы statuses
    const [tables] = await pool.query('SHOW TABLES LIKE "statuses"');
    if (tables.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS statuses (
          status_id INT PRIMARY KEY AUTO_INCREMENT,
          status_name VARCHAR(255)
        )
      `);
      console.log('Created statuses table');
    }

    // Проверяем наличие статусов
    const [existingStatuses] = await pool.query('SELECT COUNT(*) as count FROM statuses');
    if (existingStatuses[0].count === 0) {
      // Добавляем базовые статусы
      const statuses = [
        'available',
        'maintenance',
        'sold'
      ];

      for (const status of statuses) {
        await pool.query(
          'INSERT INTO statuses (status_name) VALUES (?)',
          [status]
        );
      }
      console.log('Added default statuses');
    } else {
      // Удаляем статус "rented", если он существует
      await pool.query("DELETE FROM statuses WHERE status_name = 'rented'");
      
      // Проверяем наличие нужных статусов
      const statusesToCheck = ['available', 'maintenance', 'sold'];
      for (const status of statusesToCheck) {
        const [exists] = await pool.query(
          'SELECT COUNT(*) as count FROM statuses WHERE status_name = ?',
          [status]
        );
        
        if (exists[0].count === 0) {
          await pool.query(
            'INSERT INTO statuses (status_name) VALUES (?)',
            [status]
          );
          console.log(`Added status: ${status}`);
        }
      }
    }

    console.log('Statuses initialization completed');
  } catch (error) {
    console.error('Error initializing statuses:', error);
    throw error;
  }
} 
import pool from './database.js';

export default async function updateDatabaseStructure() {
  console.log('Starting database structure update for encrypted documents...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Update clients table to use VARCHAR for document fields so we can store encrypted strings
    const alterClientsTable = `
      ALTER TABLE clients 
      MODIFY driver_license VARCHAR(255),
      MODIFY passport_series VARCHAR(255),
      MODIFY passport_number VARCHAR(255)
    `;
    
    await connection.query(alterClientsTable);
    console.log('Modified clients table structure for encrypted data');

    // Create a new table for storing encryption metadata (optional)
    const createEncryptionMetadataTable = `
      CREATE TABLE IF NOT EXISTS encryption_metadata (
        id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        table_name VARCHAR(255) NOT NULL,
        field_name VARCHAR(255) NOT NULL,
        encryption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(id)
      )
    `;
    
    await connection.query(createEncryptionMetadataTable);
    console.log('Created encryption metadata table');

    // Add initial metadata records
    const insertMetadata = `
      INSERT INTO encryption_metadata (table_name, field_name)
      VALUES 
        ('clients', 'driver_license'),
        ('clients', 'passport_series'),
        ('clients', 'passport_number')
    `;
    
    await connection.query(insertMetadata);
    console.log('Added initial encryption metadata');

    await connection.commit();
    console.log('Database structure updated successfully for encrypted documents');
    
    return { success: true, message: 'Database structure updated for encrypted documents' };
  } catch (error) {
    await connection.rollback();
    console.error('Error updating database structure:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// Запускаем функцию сразу при импорте файла
updateDatabaseStructure()
  .then(result => {
    if (result.success) {
      console.log('✅ Успешно: ' + result.message);
    } else {
      console.error('❌ Ошибка: ' + result.error);
    }
  })
  .catch(err => {
    console.error('❌ Неожиданная ошибка: ', err);
  }); 
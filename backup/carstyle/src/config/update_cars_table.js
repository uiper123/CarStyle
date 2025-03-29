import pool from '../config/database.js';

/**
 * Обновляет структуру таблицы cars, добавляя необходимые поля
 * Этот скрипт нужно запустить однократно для обновления структуры БД
 */
async function updateCarsTable() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Получаем текущую структуру таблицы cars
    const [columns] = await connection.query('DESCRIBE cars');
    console.log('Текущая структура таблицы cars:', columns.map(col => col.Field));
    
    // Проверяем и добавляем недостающие поля
    const requiredColumns = [
      { name: 'fuel_type_id', query: 'ADD COLUMN fuel_type_id INTEGER' },
      { name: 'transmission_id', query: 'ADD COLUMN transmission_id INTEGER' },
      { name: 'color_id', query: 'ADD COLUMN color_id INTEGER' },
      { name: 'year', query: 'ADD COLUMN year INTEGER' },
      { name: 'price', query: 'ADD COLUMN price DECIMAL(10,2)' },
      { name: 'mileage', query: 'ADD COLUMN mileage INTEGER' },
      { name: 'status', query: 'ADD COLUMN status VARCHAR(20) DEFAULT "available"' },
      { name: 'description', query: 'ADD COLUMN description TEXT' },
      { name: 'created_at', query: 'ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', query: 'ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];
    
    const existingColumns = columns.map(col => col.Field);
    
    // Выполняем ALTER TABLE для каждого отсутствующего поля
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`Добавляем поле ${column.name} в таблицу cars`);
        await connection.query(`ALTER TABLE cars ${column.query}`);
      } else {
        console.log(`Поле ${column.name} уже существует`);
      }
    }
    
    // Добавляем внешние ключи, если они отсутствуют
    console.log('Проверяем внешние ключи...');
    
    try {
      // Проверяем наличие foreign key для brand_id
      await connection.query(`
        ALTER TABLE cars
        ADD CONSTRAINT fk_cars_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id)
      `);
      console.log('Добавлен внешний ключ для brand_id');
    } catch (e) {
      console.log('Внешний ключ для brand_id уже существует или не может быть добавлен');
    }
    
    try {
      // Проверяем наличие foreign key для model_id
      await connection.query(`
        ALTER TABLE cars
        ADD CONSTRAINT fk_cars_model
        FOREIGN KEY (model_id) REFERENCES models(id)
      `);
      console.log('Добавлен внешний ключ для model_id');
    } catch (e) {
      console.log('Внешний ключ для model_id уже существует или не может быть добавлен');
    }
    
    try {
      // Проверяем наличие foreign key для color_id
      await connection.query(`
        ALTER TABLE cars
        ADD CONSTRAINT fk_cars_color
        FOREIGN KEY (color_id) REFERENCES colors(id)
      `);
      console.log('Добавлен внешний ключ для color_id');
    } catch (e) {
      console.log('Внешний ключ для color_id уже существует или не может быть добавлен');
    }
    
    try {
      // Проверяем наличие foreign key для fuel_type_id
      await connection.query(`
        ALTER TABLE cars
        ADD CONSTRAINT fk_cars_fuel_type
        FOREIGN KEY (fuel_type_id) REFERENCES fuel_types(id)
      `);
      console.log('Добавлен внешний ключ для fuel_type_id');
    } catch (e) {
      console.log('Внешний ключ для fuel_type_id уже существует или не может быть добавлен');
    }
    
    try {
      // Проверяем наличие foreign key для transmission_id
      await connection.query(`
        ALTER TABLE cars
        ADD CONSTRAINT fk_cars_transmission
        FOREIGN KEY (transmission_id) REFERENCES transmission_types(id)
      `);
      console.log('Добавлен внешний ключ для transmission_id');
    } catch (e) {
      console.log('Внешний ключ для transmission_id уже существует или не может быть добавлен');
    }
    
    console.log('Обновление таблицы cars завершено!');
    
  } catch (error) {
    console.error('Ошибка при обновлении таблицы cars:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('Соединение с базой данных закрыто');
    }
  }
}

export default updateCarsTable; 
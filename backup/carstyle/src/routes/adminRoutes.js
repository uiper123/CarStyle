import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import pool from '../config/database.js';
import {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  updateCarStatus,
  getCarStatuses,
  getFilterOptions
} from '../controllers/cars.controller.js';

const router = express.Router();

// Get all users
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT user_id as id, email, firstname, lastname, phone, role FROM users'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка пользователей',
      error: error.message 
    });
  }
});

// Get user by ID
router.get('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [users] = await pool.query(
      'SELECT user_id as id, email, firstname, lastname, phone, role FROM users WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении данных пользователя',
      error: error.message 
    });
  }
});

// Update user role
router.put('/users/:id/role', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;
    
    // Validate role
    const validRoles = ['client', 'employee', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль. Допустимые значения: client, employee, admin' });
    }
    
    // Check if user exists
    const [checkUser] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (checkUser.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Update user role
    await pool.query('UPDATE users SET role = ? WHERE user_id = ?', [role, userId]);
    
    res.json({ message: 'Роль пользователя успешно обновлена', success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении роли пользователя',
      error: error.message,
      success: false
    });
  }
});

// Create new user
router.post('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Необходимо заполнить все обязательные поля (имя, email, пароль)',
        success: false 
      });
    }
    
    // Validate role
    const validRoles = ['client', 'employee', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Некорректная роль. Допустимые значения: client, employee, admin',
        success: false 
      });
    }
    
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM `users` WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        message: 'Пользователь с таким email уже существует',
        success: false 
      });
    }
    
    // Split name into firstname and lastname
    const nameParts = name.split(' ');
    const firstname = nameParts[0] || '';
    const lastname = nameParts.slice(1).join(' ') || '';
    
    // Hash the password
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user with provided role (or client by default)
    const [result] = await pool.query(
      'INSERT INTO `users` (email, `password`, `firstname`, `lastname`, `role`) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, firstname, lastname, role || 'client']
    );
    
    const userId = result.insertId;
    
    // If role is client, also create entry in clients table
    if (role === 'client' || !role) {
      await pool.query(
        'INSERT INTO `clients` (client_id, `status`) VALUES (?, true)',
        [userId]
      );
    }
    
    res.status(201).json({
      message: 'Пользователь успешно создан',
      success: true,
      user: {
        id: userId,
        email,
        name,
        firstname,
        lastname,
        role: role || 'client'
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании пользователя',
      error: error.message,
      success: false 
    });
  }
});

// Get car filter options
router.get('/cars/filter-options', authMiddleware, isAdmin, getFilterOptions);

// Get car statuses
router.get('/cars/statuses', authMiddleware, isAdmin, getCarStatuses);

// Get brands data
router.get('/cars/brands', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Получим структуру таблицы, чтобы узнать правильные имена полей
    const [columns] = await pool.query('DESCRIBE brands');
    console.log('Brands table structure:', columns);
    
    const [rows] = await pool.query('SELECT * FROM brands');
    console.log('Brands data:', rows);
    
    // Проверяем имена полей в таблице и адаптируем соответственно
    const idField = columns.find(col => col.Key === 'PRI')?.Field || 'id';
    const nameField = columns.find(col => col.Field.includes('name'))?.Field || 'name';
    
    // Возвращаем бренды с согласованными именами полей
    const brands = rows.map(row => ({
      id: row[idField],
      name: row[nameField]
    }));
    
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка брендов',
      error: error.message 
    });
  }
});

// Create brand
router.post('/cars/brands', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название бренда обязательно' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO brands (name) VALUES (?)',
      [name]
    );
    
    res.status(201).json({
      message: 'Бренд успешно создан',
      id: result.insertId,
      name
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании бренда',
      error: error.message 
    });
  }
});

// Update brand
router.put('/cars/brands/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const brandId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название бренда обязательно' });
    }
    
    // Проверяем, существует ли бренд
    const [checkBrand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [brandId]
    );
    
    if (checkBrand.length === 0) {
      return res.status(404).json({ message: 'Бренд не найден' });
    }
    
    await pool.query(
      'UPDATE brands SET name = ? WHERE id = ?',
      [name, brandId]
    );
    
    res.json({
      message: 'Бренд успешно обновлен',
      id: brandId,
      name
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении бренда',
      error: error.message 
    });
  }
});

// Delete brand
router.delete('/cars/brands/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const brandId = req.params.id;
    
    // Проверяем, существует ли бренд
    const [checkBrand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [brandId]
    );
    
    if (checkBrand.length === 0) {
      return res.status(404).json({ message: 'Бренд не найден' });
    }
    
    // Проверяем, используется ли бренд в моделях
    const [checkModels] = await pool.query(
      'SELECT * FROM models WHERE brand_id = ?',
      [brandId]
    );
    
    if (checkModels.length > 0) {
      return res.status(400).json({ 
        message: 'Невозможно удалить бренд, так как он используется в моделях',
        models: checkModels.length
      });
    }
    
    // Проверяем, используется ли бренд в автомобилях
    const [checkCars] = await pool.query(
      'SELECT * FROM cars WHERE brand_id = ?',
      [brandId]
    );
    
    if (checkCars.length > 0) {
      return res.status(400).json({ 
        message: 'Невозможно удалить бренд, так как он используется в автомобилях',
        cars: checkCars.length
      });
    }
    
    await pool.query('DELETE FROM brands WHERE id = ?', [brandId]);
    
    res.json({ message: 'Бренд успешно удален' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении бренда',
      error: error.message 
    });
  }
});

// Models (Модели)
router.get('/cars/models', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Проверяем, запрошены ли модели для конкретного бренда
    const { brand } = req.query;
    
    // Получим структуру таблиц, чтобы узнать правильные имена полей
    const [modelsColumns] = await pool.query('DESCRIBE models');
    const [brandsColumns] = await pool.query('DESCRIBE brands');
    
    console.log('Models table structure:', modelsColumns);
    console.log('Brands table structure for models:', brandsColumns);
    
    // Определяем имена полей в таблице models
    const modelIdField = modelsColumns.find(col => col.Key === 'PRI')?.Field || 'model_id';
    const modelNameField = modelsColumns.find(col => col.Field.includes('name'))?.Field || 'model_name';
    
    // Определяем имена полей в таблице brands
    const brandIdField = brandsColumns.find(col => col.Key === 'PRI')?.Field || 'brand_id';
    const brandNameField = brandsColumns.find(col => col.Field.includes('name'))?.Field || 'brand_name';
    
    // Находим поле, которое ссылается на brand_id
    const brandRefField = modelsColumns.find(col => 
      col.Field.includes('brand') || (col.Key === 'MUL' && col.Field !== modelIdField)
    )?.Field;
    
    // Если не найдено поле с внешним ключом, получаем только модели
    if (!brandRefField) {
      const [rows] = await pool.query(`SELECT * FROM models`);
      
      const models = rows.map(row => ({
        id: row[modelIdField],
        name: row[modelNameField],
        brand_id: null,
        brand_name: 'Не указан'
      }));
      
      return res.json(models);
    }
    
    let query = `
      SELECT m.*, b.${brandNameField} as brand_name
      FROM models m
      LEFT JOIN brands b ON m.${brandRefField} = b.${brandIdField}
    `;
    
    const params = [];
    
    // Если указан бренд, фильтруем по нему
    if (brand) {
      query += ` WHERE m.${brandRefField} = ?`;
      params.push(brand);
      console.log(`Фильтрация моделей по бренду ID: ${brand}`);
    }
    
    // Выполняем запрос
    const [rows] = await pool.query(query, params);
    
    console.log(`Найдено ${rows.length} моделей ${brand ? 'для бренда ' + brand : ''}`);
    
    // Преобразуем данные для соответствия формату фронтенда
    const models = rows.map(row => ({
      id: row[modelIdField],
      name: row[modelNameField],
      brand_id: row[brandRefField],
      brand_name: row.brand_name || 'Не указан'
    }));
    
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка моделей автомобилей',
      error: error.message 
    });
  }
});

router.post('/cars/models', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name, brand_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название модели обязательно' });
    }
    
    if (!brand_id) {
      return res.status(400).json({ message: 'ID бренда обязателен' });
    }
    
    // Проверяем, существует ли бренд
    const [checkBrand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [brand_id]
    );
    
    if (checkBrand.length === 0) {
      return res.status(404).json({ message: 'Указанный бренд не найден' });
    }
    
    // Получим структуру таблицы models, чтобы узнать доступные поля
    const [modelsColumns] = await pool.query('DESCRIBE models');
    console.log('Models table structure for POST:', modelsColumns);
    
    // Проверим, есть ли в таблице поле для связи с брендом
    const modelIdField = modelsColumns.find(col => col.Key === 'PRI')?.Field || 'model_id';
    const modelNameField = modelsColumns.find(col => col.Field.includes('name'))?.Field || 'model_name';
    const brandRefField = modelsColumns.find(col => 
      col.Field.includes('brand') || (col.Key === 'MUL' && col.Field !== modelIdField)
    )?.Field;
    
    if (brand_id && !brandRefField) {
      console.warn('В таблице models отсутствует поле для связи с брендом');
    }
    
    let sql = `INSERT INTO models (${modelNameField})`;
    let params = [name];
    
    // Если есть поле для связи с брендом и передан brand_id, добавляем его в запрос
    if (brandRefField && brand_id) {
      // Проверяем существование марки
      const [checkBrand] = await pool.query(
        'SELECT * FROM brands WHERE id = ?',
        [brand_id]
      );
      
      if (checkBrand.length === 0) {
        return res.status(404).json({ message: 'Марка автомобиля не найдена' });
      }
      
      sql = `INSERT INTO models (${modelNameField}, ${brandRefField})`;
      params = [name, brand_id];
    }
    
    sql += ' VALUES (' + params.map(() => '?').join(', ') + ')';
    
    const [result] = await pool.query(sql, params);
    
    const responseData = {
      id: result.insertId,
      name,
      message: 'Модель автомобиля успешно добавлена'
    };
    
    // Добавляем информацию о бренде, если она есть
    if (brandRefField && brand_id) {
      // Получаем название бренда
      const [brandData] = await pool.query(
        'SELECT * FROM brands WHERE id = ?',
        [brand_id]
      );
      
      if (brandData.length > 0) {
        const brandNameField = Object.keys(brandData[0]).find(key => key.includes('name'));
        responseData.brand_id = brand_id;
        responseData.brand_name = brandData[0][brandNameField];
      }
    }
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании модели автомобиля',
      error: error.message 
    });
  }
});

router.put('/cars/models/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const modelId = req.params.id;
    const { name, brand_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название модели обязательно' });
    }
    
    // Получим структуру таблицы models, чтобы узнать доступные поля
    const [modelsColumns] = await pool.query('DESCRIBE models');
    console.log('Models table structure for PUT:', modelsColumns);
    
    // Проверим, есть ли в таблице поле для связи с брендом
    const modelIdField = modelsColumns.find(col => col.Key === 'PRI')?.Field || 'model_id';
    const modelNameField = modelsColumns.find(col => col.Field.includes('name'))?.Field || 'model_name';
    const brandRefField = modelsColumns.find(col => 
      col.Field.includes('brand') || (col.Key === 'MUL' && col.Field !== modelIdField)
    )?.Field;
    
    // Проверяем существование модели
    const [checkModel] = await pool.query(
      `SELECT * FROM models WHERE ${modelIdField} = ?`,
      [modelId]
    );
    
    if (checkModel.length === 0) {
      return res.status(404).json({ message: 'Модель автомобиля не найдена' });
    }
    
    let sql = `UPDATE models SET ${modelNameField} = ?`;
    let params = [name];
    
    let brandName = null;
    
    // Если есть поле для связи с брендом и передан brand_id, добавляем его в запрос
    if (brandRefField && brand_id) {
      // Проверяем существование марки
      const [checkBrand] = await pool.query(
        'SELECT * FROM brands WHERE id = ?',
        [brand_id]
      );
      
      if (checkBrand.length === 0) {
        return res.status(404).json({ message: 'Марка автомобиля не найдена' });
      }
      
      const brandNameField = Object.keys(checkBrand[0]).find(key => key.includes('name'));
      brandName = checkBrand[0][brandNameField];
      
      sql += `, ${brandRefField} = ?`;
      params.push(brand_id);
    }
    
    sql += ` WHERE ${modelIdField} = ?`;
    params.push(modelId);
    
    const [result] = await pool.query(sql, params);
    
    const responseData = {
      id: parseInt(modelId),
      name,
      message: 'Модель автомобиля успешно обновлена'
    };
    
    // Добавляем информацию о бренде, если она есть
    if (brandRefField && brand_id) {
      responseData.brand_id = brand_id;
      responseData.brand_name = brandName;
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении модели автомобиля',
      error: error.message 
    });
  }
});

router.delete('/cars/models/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const modelId = req.params.id;
    
    // Получим структуру таблицы models, чтобы узнать имя поля ID
    const [modelsColumns] = await pool.query('DESCRIBE models');
    console.log('Models table structure for DELETE:', modelsColumns);
    
    const modelIdField = modelsColumns.find(col => col.Key === 'PRI')?.Field || 'model_id';
    
    // Проверим существование модели
    const [checkModel] = await pool.query(
      `SELECT * FROM models WHERE ${modelIdField} = ?`,
      [modelId]
    );
    
    if (checkModel.length === 0) {
      return res.status(404).json({ message: 'Модель автомобиля не найдена' });
    }
    
    // Проверяем, используется ли модель в автомобилях
    // Предполагаем, что в таблице cars есть поле model_id, но мы также проверим
    try {
      // Проверим, существует ли таблица cars и есть ли в ней поле для модели
      const [carsColumns] = await pool.query('DESCRIBE cars');
      const modelRefField = carsColumns.find(col => 
        col.Field.includes('model') || col.Field === 'model_id'
      )?.Field;
      
      if (modelRefField) {
        const [checkCars] = await pool.query(
          `SELECT COUNT(*) AS count FROM cars WHERE ${modelRefField} = ?`,
          [modelId]
        );
        
        if (checkCars[0].count > 0) {
          return res.status(400).json({
            message: 'Невозможно удалить модель, так как она используется в автомобилях'
          });
        }
      }
    } catch (error) {
      console.warn('Невозможно проверить использование модели в автомобилях:', error.message);
    }
    
    // Удаляем модель
    const [result] = await pool.query(
      `DELETE FROM models WHERE ${modelIdField} = ?`,
      [modelId]
    );
    
    res.json({ message: 'Модель автомобиля успешно удалена' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении модели автомобиля',
      error: error.message 
    });
  }
});

// Создание связи между моделью и брендом
router.post('/cars/models/:modelId/brand', authMiddleware, isAdmin, async (req, res) => {
  try {
    const modelId = req.params.modelId;
    const { brand_id } = req.body;
    
    if (!brand_id) {
      return res.status(400).json({ message: 'ID марки обязателен' });
    }
    
    // Получим структуру таблицы models, чтобы узнать доступные поля
    const [modelsColumns] = await pool.query('DESCRIBE models');
    console.log('Models table structure for brand link:', modelsColumns);
    
    // Определяем имена полей
    const modelIdField = modelsColumns.find(col => col.Key === 'PRI')?.Field || 'model_id';
    const modelNameField = modelsColumns.find(col => col.Field.includes('name'))?.Field || 'model_name';
    
    // Проверим, есть ли в таблице поле brand_id
    const brandRefField = modelsColumns.find(col => 
      col.Field.includes('brand') || (col.Key === 'MUL' && col.Field !== modelIdField)
    )?.Field;
    
    // Если нет поля для связи с брендом, нужно его добавить
    if (!brandRefField) {
      try {
        // Добавляем колонку brand_id в таблицу models
        await pool.query(`ALTER TABLE models ADD COLUMN brand_id INT`);
        console.log('Добавлена колонка brand_id в таблицу models');
        
        // Добавляем внешний ключ
        try {
          await pool.query(`
            ALTER TABLE models 
            ADD CONSTRAINT fk_models_brands 
            FOREIGN KEY (brand_id) REFERENCES brands(id)
          `);
          console.log('Добавлен внешний ключ для brand_id');
        } catch (fkError) {
          console.warn('Невозможно добавить внешний ключ:', fkError.message);
          // Продолжаем работу даже без внешнего ключа
        }
      } catch (alterError) {
        console.error('Ошибка при изменении структуры таблицы models:', alterError);
        return res.status(500).json({ 
          message: 'Невозможно добавить связь с маркой автомобиля',
          error: alterError.message 
        });
      }
    }
    
    // Проверяем существование модели
    const [checkModel] = await pool.query(
      `SELECT * FROM models WHERE ${modelIdField} = ?`,
      [modelId]
    );
    
    if (checkModel.length === 0) {
      return res.status(404).json({ message: 'Модель автомобиля не найдена' });
    }
    
    // Проверяем существование марки
    const [checkBrand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [brand_id]
    );
    
    if (checkBrand.length === 0) {
      return res.status(404).json({ message: 'Марка автомобиля не найдена' });
    }
    
    // Обновляем запись, используя brandRefField или brand_id (если поле только что создано)
    const useField = brandRefField || 'brand_id';
    
    const [result] = await pool.query(
      `UPDATE models SET ${useField} = ? WHERE ${modelIdField} = ?`,
      [brand_id, modelId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Не удалось обновить связь с маркой' });
    }
    
    // Получаем название бренда для ответа
    const brandNameField = Object.keys(checkBrand[0]).find(key => key.includes('name'));
    const brandName = checkBrand[0][brandNameField];
    
    // Получаем данные модели для ответа
    const [updatedModel] = await pool.query(
      `SELECT * FROM models WHERE ${modelIdField} = ?`,
      [modelId]
    );
    
    const modelName = updatedModel[0][modelNameField];
    
    res.json({
      id: parseInt(modelId),
      name: modelName,
      brand_id: parseInt(brand_id),
      brand_name: brandName,
      message: 'Связь модели с маркой успешно обновлена'
    });
  } catch (error) {
    console.error('Error linking model to brand:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении связи модели с маркой',
      error: error.message 
    });
  }
});

// Fuel Types (Типы топлива)
router.get('/cars/fuel-types', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Проверим существование таблицы fuel_types или альтернативную таблицу fuels
    let tableName = 'fuel_types';
    
    const [fuelTypesExists] = await pool.query("SHOW TABLES LIKE 'fuel_types'");
    const [fuelsExists] = await pool.query("SHOW TABLES LIKE 'fuels'");
    
    if (fuelTypesExists.length === 0 && fuelsExists.length === 0) {
      // Если ни одна из таблиц не существует, создаем таблицу fuels
      await pool.query(`
        CREATE TABLE fuels (
          fuel_id INT PRIMARY KEY AUTO_INCREMENT,
          fuel_name VARCHAR(255) NOT NULL
        )
      `);
      console.log('Created fuels table');
      tableName = 'fuels';
    } else if (fuelTypesExists.length === 0 && fuelsExists.length > 0) {
      // Если существует только таблица fuels
      tableName = 'fuels';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure:`, columns);
    
    // Определяем имена полей
    const idField = columns.find(col => col.Key === 'PRI')?.Field;
    const nameField = columns.find(col => col.Field.includes('name'))?.Field;
    
    if (!idField || !nameField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы топлива',
        error: 'Missing required fields' 
      });
    }
    
    // Получаем данные
    const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
    
    // Преобразуем данные для соответствия формату фронтенда
    const fuelTypes = rows.map(row => ({
      id: row[idField],
      name: row[nameField]
    }));
    
    res.json(fuelTypes);
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка типов топлива',
      error: error.message 
    });
  }
});

router.post('/cars/fuel-types', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название типа топлива обязательно' });
    }
    
    // Проверим существование таблицы fuel_types или альтернативную таблицу fuels
    let tableName = 'fuel_types';
    
    const [fuelTypesExists] = await pool.query("SHOW TABLES LIKE 'fuel_types'");
    const [fuelsExists] = await pool.query("SHOW TABLES LIKE 'fuels'");
    
    if (fuelTypesExists.length === 0 && fuelsExists.length === 0) {
      // Если ни одна из таблиц не существует, создаем таблицу fuels
      await pool.query(`
        CREATE TABLE fuels (
          fuel_id INT PRIMARY KEY AUTO_INCREMENT,
          fuel_name VARCHAR(255) NOT NULL
        )
      `);
      console.log('Created fuels table');
      tableName = 'fuels';
    } else if (fuelTypesExists.length === 0 && fuelsExists.length > 0) {
      // Если существует только таблица fuels
      tableName = 'fuels';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure for POST:`, columns);
    
    // Определяем имена полей
    const nameField = columns.find(col => col.Field.includes('name'))?.Field;
    
    if (!nameField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы топлива',
        error: 'Missing name field' 
      });
    }
    
    // Вставляем данные
    const [result] = await pool.query(
      `INSERT INTO ${tableName} (${nameField}) VALUES (?)`,
      [name]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      message: 'Тип топлива успешно добавлен'
    });
  } catch (error) {
    console.error('Error creating fuel type:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании типа топлива',
      error: error.message 
    });
  }
});

router.put('/cars/fuel-types/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const fuelTypeId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название типа топлива обязательно' });
    }
    
    // Определим, какая таблица используется для типов топлива
    let tableName = 'fuel_types';
    
    const [fuelTypesExists] = await pool.query("SHOW TABLES LIKE 'fuel_types'");
    const [fuelsExists] = await pool.query("SHOW TABLES LIKE 'fuels'");
    
    if (fuelTypesExists.length === 0 && fuelsExists.length > 0) {
      tableName = 'fuels';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure for PUT:`, columns);
    
    // Определяем имена полей
    const idField = columns.find(col => col.Key === 'PRI')?.Field;
    const nameField = columns.find(col => col.Field.includes('name'))?.Field;
    
    if (!idField || !nameField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы топлива',
        error: 'Missing required fields' 
      });
    }
    
    // Обновляем запись
    const [result] = await pool.query(
      `UPDATE ${tableName} SET ${nameField} = ? WHERE ${idField} = ?`,
      [name, fuelTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Тип топлива не найден' });
    }
    
    res.json({
      id: parseInt(fuelTypeId),
      name,
      message: 'Тип топлива успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating fuel type:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении типа топлива',
      error: error.message 
    });
  }
});

router.delete('/cars/fuel-types/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const fuelTypeId = req.params.id;
    
    // Определим, какая таблица используется для типов топлива
    let tableName = 'fuel_types';
    
    const [fuelTypesExists] = await pool.query("SHOW TABLES LIKE 'fuel_types'");
    const [fuelsExists] = await pool.query("SHOW TABLES LIKE 'fuels'");
    
    if (fuelTypesExists.length === 0 && fuelsExists.length > 0) {
      tableName = 'fuels';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure for DELETE:`, columns);
    
    // Определяем имена полей
    const idField = columns.find(col => col.Key === 'PRI')?.Field;
    
    if (!idField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы топлива',
        error: 'Missing ID field' 
      });
    }
    
    // Проверяем использование в таблице cars
    let inUse = false;
    try {
      const [carsColumns] = await pool.query('DESCRIBE cars');
      // Ищем поле, которое может ссылаться на тип топлива
      const fuelRefField = carsColumns.find(col => 
        col.Field.includes('fuel') || col.Field === 'fuel_type_id'
      )?.Field;
      
      if (fuelRefField) {
        const [checkCars] = await pool.query(
          `SELECT COUNT(*) AS count FROM cars WHERE ${fuelRefField} = ?`,
          [fuelTypeId]
        );
        
        if (checkCars[0].count > 0) {
          inUse = true;
        }
      }
    } catch (error) {
      console.warn('Невозможно проверить использование типа топлива в автомобилях:', error.message);
    }
    
    if (inUse) {
      return res.status(400).json({
        message: 'Невозможно удалить тип топлива, так как он используется в автомобилях'
      });
    }
    
    // Удаляем запись
    const [result] = await pool.query(
      `DELETE FROM ${tableName} WHERE ${idField} = ?`,
      [fuelTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Тип топлива не найден' });
    }
    
    res.json({ message: 'Тип топлива успешно удален' });
  } catch (error) {
    console.error('Error deleting fuel type:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении типа топлива',
      error: error.message 
    });
  }
});

// Transmission Types (Типы коробок передач)
router.get('/cars/transmission-types', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Проверим существование таблицы transmission_types или альтернативную таблицу transmissions
    let tableName = 'transmission_types';
    
    const [transmissionTypesExists] = await pool.query("SHOW TABLES LIKE 'transmission_types'");
    const [transmissionsExists] = await pool.query("SHOW TABLES LIKE 'transmissions'");
    
    if (transmissionTypesExists.length === 0 && transmissionsExists.length === 0) {
      // Если ни одна из таблиц не существует, создаем таблицу transmissions
      await pool.query(`
        CREATE TABLE transmissions (
          transmission_id INT PRIMARY KEY AUTO_INCREMENT,
          transmission_name VARCHAR(255) NOT NULL
        )
      `);
      console.log('Created transmissions table');
      tableName = 'transmissions';
    } else if (transmissionTypesExists.length === 0 && transmissionsExists.length > 0) {
      // Если существует только таблица transmissions
      tableName = 'transmissions';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure:`, columns);
    
    // Определяем имена полей
    const idField = columns.find(col => col.Key === 'PRI')?.Field;
    const nameField = columns.find(col => col.Field.includes('name'))?.Field;
    
    if (!idField || !nameField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы трансмиссий',
        error: 'Missing required fields' 
      });
    }
    
    // Получаем данные
    const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
    
    // Преобразуем данные для соответствия формату фронтенда
    const transmissionTypes = rows.map(row => ({
      id: row[idField],
      name: row[nameField]
    }));
    
    res.json(transmissionTypes);
  } catch (error) {
    console.error('Error fetching transmission types:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка типов коробок передач',
      error: error.message 
    });
  }
});

router.post('/cars/transmission-types', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название типа коробки передач обязательно' });
    }
    
    // Проверим существование таблицы transmission_types или альтернативную таблицу transmissions
    let tableName = 'transmission_types';
    
    const [transmissionTypesExists] = await pool.query("SHOW TABLES LIKE 'transmission_types'");
    const [transmissionsExists] = await pool.query("SHOW TABLES LIKE 'transmissions'");
    
    if (transmissionTypesExists.length === 0 && transmissionsExists.length === 0) {
      // Если ни одна из таблиц не существует, создаем таблицу transmissions
      await pool.query(`
        CREATE TABLE transmissions (
          transmission_id INT PRIMARY KEY AUTO_INCREMENT,
          transmission_name VARCHAR(255) NOT NULL
        )
      `);
      console.log('Created transmissions table');
      tableName = 'transmissions';
    } else if (transmissionTypesExists.length === 0 && transmissionsExists.length > 0) {
      // Если существует только таблица transmissions
      tableName = 'transmissions';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure for POST:`, columns);
    
    // Определяем имена полей
    const nameField = columns.find(col => col.Field.includes('name'))?.Field;
    
    if (!nameField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы трансмиссий',
        error: 'Missing name field' 
      });
    }
    
    // Вставляем данные
    const [result] = await pool.query(
      `INSERT INTO ${tableName} (${nameField}) VALUES (?)`,
      [name]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      message: 'Тип коробки передач успешно добавлен'
    });
  } catch (error) {
    console.error('Error creating transmission type:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании типа коробки передач',
      error: error.message 
    });
  }
});

router.put('/cars/transmission-types/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const transmissionTypeId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название типа коробки передач обязательно' });
    }
    
    // Определим, какая таблица используется для трансмиссий
    let tableName = 'transmission_types';
    
    const [transmissionTypesExists] = await pool.query("SHOW TABLES LIKE 'transmission_types'");
    const [transmissionsExists] = await pool.query("SHOW TABLES LIKE 'transmissions'");
    
    if (transmissionTypesExists.length === 0 && transmissionsExists.length > 0) {
      tableName = 'transmissions';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure for PUT:`, columns);
    
    // Определяем имена полей
    const idField = columns.find(col => col.Key === 'PRI')?.Field;
    const nameField = columns.find(col => col.Field.includes('name'))?.Field;
    
    if (!idField || !nameField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы трансмиссий',
        error: 'Missing required fields' 
      });
    }
    
    // Обновляем запись
    const [result] = await pool.query(
      `UPDATE ${tableName} SET ${nameField} = ? WHERE ${idField} = ?`,
      [name, transmissionTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Тип коробки передач не найден' });
    }
    
    res.json({
      id: parseInt(transmissionTypeId),
      name,
      message: 'Тип коробки передач успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating transmission type:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении типа коробки передач',
      error: error.message 
    });
  }
});

router.delete('/cars/transmission-types/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const transmissionTypeId = req.params.id;
    
    // Определим, какая таблица используется для трансмиссий
    let tableName = 'transmission_types';
    
    const [transmissionTypesExists] = await pool.query("SHOW TABLES LIKE 'transmission_types'");
    const [transmissionsExists] = await pool.query("SHOW TABLES LIKE 'transmissions'");
    
    if (transmissionTypesExists.length === 0 && transmissionsExists.length > 0) {
      tableName = 'transmissions';
    }
    
    // Получаем структуру используемой таблицы
    const [columns] = await pool.query(`DESCRIBE ${tableName}`);
    console.log(`${tableName} table structure for DELETE:`, columns);
    
    // Определяем имена полей
    const idField = columns.find(col => col.Key === 'PRI')?.Field;
    
    if (!idField) {
      return res.status(500).json({ 
        message: 'Некорректная структура таблицы трансмиссий',
        error: 'Missing ID field' 
      });
    }
    
    // Проверяем использование в таблице cars
    let inUse = false;
    try {
      const [carsColumns] = await pool.query('DESCRIBE cars');
      // Ищем поле, которое может ссылаться на тип трансмиссии
      const transmissionRefField = carsColumns.find(col => 
        col.Field.includes('transmission') || col.Field === 'transmission_type_id'
      )?.Field;
      
      if (transmissionRefField) {
        const [checkCars] = await pool.query(
          `SELECT COUNT(*) AS count FROM cars WHERE ${transmissionRefField} = ?`,
          [transmissionTypeId]
        );
        
        if (checkCars[0].count > 0) {
          inUse = true;
        }
      }
    } catch (error) {
      console.warn('Невозможно проверить использование трансмиссии в автомобилях:', error.message);
    }
    
    if (inUse) {
      return res.status(400).json({
        message: 'Невозможно удалить тип коробки передач, так как он используется в автомобилях'
      });
    }
    
    // Удаляем запись
    const [result] = await pool.query(
      `DELETE FROM ${tableName} WHERE ${idField} = ?`,
      [transmissionTypeId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Тип коробки передач не найден' });
    }
    
    res.json({ message: 'Тип коробки передач успешно удален' });
  } catch (error) {
    console.error('Error deleting transmission type:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении типа коробки передач',
      error: error.message 
    });
  }
});

// Colors (Цвета)
router.get('/cars/colors', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM colors');
    
    // Получим структуру таблицы, чтобы узнать правильные имена полей
    const [columns] = await pool.query('DESCRIBE colors');
    console.log('Colors table structure:', columns);
    
    const idField = columns.find(col => col.Key === 'PRI')?.Field || 'id';
    const nameField = columns.find(col => col.Field.includes('name'))?.Field || 'name';
    
    // Преобразуем данные для соответствия формату фронтенда
    const colors = rows.map(row => ({
      id: row[idField],
      name: row[nameField]
    }));
    
    res.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка цветов автомобилей',
      error: error.message 
    });
  }
});

router.post('/cars/colors', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название цвета обязательно' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO colors (name) VALUES (?)',
      [name]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      message: 'Цвет автомобиля успешно добавлен'
    });
  } catch (error) {
    console.error('Error creating color:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании цвета автомобиля',
      error: error.message 
    });
  }
});

router.put('/cars/colors/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const colorId = req.params.id;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Название цвета обязательно' });
    }
    
    const [result] = await pool.query(
      'UPDATE colors SET name = ? WHERE id = ?',
      [name, colorId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Цвет автомобиля не найден' });
    }
    
    res.json({
      id: parseInt(colorId),
      name,
      message: 'Цвет автомобиля успешно обновлен'
    });
  } catch (error) {
    console.error('Error updating color:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении цвета автомобиля',
      error: error.message 
    });
  }
});

router.delete('/cars/colors/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const colorId = req.params.id;
    
    // Проверяем, используется ли цвет в автомобилях
    const [checkCars] = await pool.query(
      'SELECT COUNT(*) AS count FROM cars WHERE color_id = ?',
      [colorId]
    );
    
    if (checkCars[0].count > 0) {
      return res.status(400).json({
        message: 'Невозможно удалить цвет, так как он используется в автомобилях'
      });
    }
    
    const [result] = await pool.query(
      'DELETE FROM colors WHERE id = ?',
      [colorId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Цвет автомобиля не найден' });
    }
    
    res.json({ message: 'Цвет автомобиля успешно удален' });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении цвета автомобиля',
      error: error.message 
    });
  }
});

// Get all cars with filters
router.get('/cars', authMiddleware, isAdmin, getAllCars);

// Get car by ID
router.get('/cars/:id', authMiddleware, isAdmin, getCarById);

// Create new car
router.post('/cars', authMiddleware, isAdmin, createCar);

// Update car
router.put('/cars/:id', authMiddleware, isAdmin, updateCar);

// Delete car
router.delete('/cars/:id', authMiddleware, isAdmin, deleteCar);

// Update car status
router.put('/cars/:id/status', authMiddleware, isAdmin, updateCarStatus);

// Get all requests (placeholder)
router.get('/requests', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Implement your request fetching logic here
    res.json([
      { id: 1, user: 'Иван Иванов', car: 'BMW X5', date: '18.03.2025', status: 'Ожидает' },
      { id: 2, user: 'Мария Петрова', car: 'Mercedes E-Class', date: '19.03.2025', status: 'Одобрено' },
    ]);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Ошибка при получении списка заявок' });
  }
});

// Delete user
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const [checkUser] = await pool.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (checkUser.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Delete from clients table if exists
      await connection.query('DELETE FROM clients WHERE client_id = ?', [userId]);
      
      // Delete from users table
      await connection.query('DELETE FROM users WHERE user_id = ?', [userId]);
      
      await connection.commit();
      res.json({ message: 'Пользователь успешно удален', success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении пользователя',
      error: error.message,
      success: false
    });
  }
});

export default router; 
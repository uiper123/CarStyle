import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isAdmin, isAdminOrEmployee } from '../middleware/admin.middleware.js';
import pool from '../config/database.js';
import multer from 'multer';
import path from 'path';
import {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  updateCarStatus,
  getCarStatuses,
  getFilterOptions,
  getCarImages
} from '../controllers/cars.controller.js';

const router = express.Router();

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/cars/'); // Убедитесь, что эта директория существует
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Принимаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Разрешены только изображения!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all users
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.user_id as id, 
        u.email, 
        u.firstname, 
        u.lastname, 
        u.phone, 
        u.role,
        u.created_at,
        u.updated_at
      FROM users u
      ORDER BY u.created_at DESC
    `);
    
    if (!Array.isArray(users)) {
      throw new Error('Некорректный формат данных пользователей');
    }
    
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
router.get('/cars/filter-options', authMiddleware, isAdminOrEmployee, getFilterOptions);

// Get car statuses
router.get('/cars/statuses', authMiddleware, isAdminOrEmployee, getCarStatuses);

// Get brands data
router.get('/cars/brands', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const [brands] = await pool.query('SELECT id, name FROM brands ORDER BY name');
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Ошибка при получении списка брендов' });
  }
});

// Create brand
router.post('/cars/brands', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO brands (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(400).json({ message: 'Ошибка при создании бренда' });
  }
});

// Update brand
router.put('/cars/brands/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE brands SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ id: req.params.id, name });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(400).json({ message: 'Ошибка при обновлении бренда' });
  }
});

// Delete brand
router.delete('/cars/brands/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    await pool.query('DELETE FROM brands WHERE id = ?', [req.params.id]);
    res.json({ message: 'Бренд успешно удален' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ message: 'Ошибка при удалении бренда' });
  }
});

// Get models
router.get('/cars/models', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { brand_id } = req.query;
    let query = `
      SELECT m.id, m.name, m.brand_id, b.name as brand_name 
      FROM models m 
      LEFT JOIN brands b ON m.brand_id = b.id
    `;
    
    const params = [];
    
    if (brand_id) {
      query += ' WHERE m.brand_id = ?';
      params.push(brand_id);
    }
    
    query += ' ORDER BY b.name, m.name';
    
    const [models] = await pool.query(query, params);
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Ошибка при получении списка моделей' });
  }
});

// Create model
router.post('/cars/models', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name, brand_id } = req.body;
    const [result] = await pool.query(
      'INSERT INTO models (name, brand_id) VALUES (?, ?)',
      [name, brand_id]
    );
    res.status(201).json({ id: result.insertId, name, brand_id });
  } catch (error) {
    console.error('Error creating model:', error);
    res.status(400).json({ message: 'Ошибка при создании модели' });
  }
});

// Update model
router.put('/cars/models/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name, brand_id } = req.body;
    await pool.query(
      'UPDATE models SET name = ?, brand_id = ? WHERE id = ?',
      [name, brand_id, req.params.id]
    );
    res.json({ id: req.params.id, name, brand_id });
  } catch (error) {
    console.error('Error updating model:', error);
    res.status(400).json({ message: 'Ошибка при обновлении модели' });
  }
});

// Delete model
router.delete('/cars/models/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    await pool.query('DELETE FROM models WHERE id = ?', [req.params.id]);
    res.json({ message: 'Модель успешно удалена' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ message: 'Ошибка при удалении модели' });
  }
});

// Get fuel types
router.get('/cars/fuel-types', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const [fuelTypes] = await pool.query('SELECT id, name FROM fuel_types ORDER BY name');
    res.json(fuelTypes);
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    res.status(500).json({ message: 'Ошибка при получении списка типов топлива' });
  }
});

// Create fuel type
router.post('/cars/fuel-types', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO fuel_types (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating fuel type:', error);
    res.status(400).json({ message: 'Ошибка при создании типа топлива' });
  }
});

// Update fuel type
router.put('/cars/fuel-types/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE fuel_types SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ id: req.params.id, name });
  } catch (error) {
    console.error('Error updating fuel type:', error);
    res.status(400).json({ message: 'Ошибка при обновлении типа топлива' });
  }
});

// Delete fuel type
router.delete('/cars/fuel-types/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    await pool.query('DELETE FROM fuel_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Тип топлива успешно удален' });
  } catch (error) {
    console.error('Error deleting fuel type:', error);
    res.status(500).json({ message: 'Ошибка при удалении типа топлива' });
  }
});

// Get transmission types
router.get('/cars/transmission-types', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const [transmissionTypes] = await pool.query('SELECT id, name FROM transmission_types ORDER BY name');
    res.json(transmissionTypes);
  } catch (error) {
    console.error('Error fetching transmission types:', error);
    res.status(500).json({ message: 'Ошибка при получении списка типов трансмиссии' });
  }
});

// Create transmission type
router.post('/cars/transmission-types', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO transmission_types (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating transmission type:', error);
    res.status(400).json({ message: 'Ошибка при создании типа трансмиссии' });
  }
});

// Update transmission type
router.put('/cars/transmission-types/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE transmission_types SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ id: req.params.id, name });
  } catch (error) {
    console.error('Error updating transmission type:', error);
    res.status(400).json({ message: 'Ошибка при обновлении типа трансмиссии' });
  }
});

// Delete transmission type
router.delete('/cars/transmission-types/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    await pool.query('DELETE FROM transmission_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Тип трансмиссии успешно удален' });
  } catch (error) {
    console.error('Error deleting transmission type:', error);
    res.status(500).json({ message: 'Ошибка при удалении типа трансмиссии' });
  }
});

// Get colors
router.get('/cars/colors', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const [colors] = await pool.query('SELECT id, name FROM colors ORDER BY name');
    res.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Ошибка при получении списка цветов' });
  }
});

// Create color
router.post('/cars/colors', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO colors (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating color:', error);
    res.status(400).json({ message: 'Ошибка при создании цвета' });
  }
});

// Update color
router.put('/cars/colors/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE colors SET name = ? WHERE id = ?', [name, req.params.id]);
    res.json({ id: req.params.id, name });
  } catch (error) {
    console.error('Error updating color:', error);
    res.status(400).json({ message: 'Ошибка при обновлении цвета' });
  }
});

// Delete color
router.delete('/cars/colors/:id', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    await pool.query('DELETE FROM colors WHERE id = ?', [req.params.id]);
    res.json({ message: 'Цвет успешно удален' });
  } catch (error) {
    console.error('Error deleting color:', error);
    res.status(500).json({ message: 'Ошибка при удалении цвета' });
  }
});

// Get all cars
router.get('/cars', authMiddleware, isAdminOrEmployee, getAllCars);

// Get a single car
router.get('/cars/:id', authMiddleware, isAdminOrEmployee, getCarById);

// Create a new car
router.post('/cars', authMiddleware, isAdminOrEmployee, upload.array('images', 10), createCar);

// Update a car
router.put('/cars/:id', authMiddleware, isAdminOrEmployee, upload.array('images', 10), updateCar);

// Delete a car
router.delete('/cars/:id', authMiddleware, isAdminOrEmployee, deleteCar);

// Update car status
router.put('/cars/:id/status', authMiddleware, isAdminOrEmployee, updateCarStatus);

// Get car images
router.get('/cars/:id/images', authMiddleware, isAdminOrEmployee, getCarImages);

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
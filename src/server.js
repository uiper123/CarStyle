import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { register, login } from './controllers/auth.controller.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { isAdminOrEmployee } from './middleware/admin.middleware.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import ordersRoutes from './routes/orders.routes.js';
import { initDatabase } from './config/initDatabase.js';
import updateCarsTable from './config/update_cars_table.js';
import updateUsersTable from './config/update_users_table.js';
import initStatuses from './config/init_statuses.js';
import upload from './config/multer.js';
import catalogRoutes from './routes/catalogRoutes.js';
import pool from './config/database.js';
import { 
  updateCarStatus, 
  getCarStatuses, 
  getCarImages,
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar 
} from './controllers/cars.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Создаем директории для загрузок
async function createUploadDirs() {
  const dirs = [
    'uploads', 
    'uploads/avatars', 
    'uploads/documents',
    'uploads/cars',    // Добавляем директорию для изображений автомобилей
    'uploads/temp'     // Временная директория
  ];
  
  for (const dir of dirs) {
    const dirPath = path.join(__dirname, '..', dir);
    try {
      await fs.access(dirPath);
      // Если директория существует, ничего не делаем
    } catch (error) {
      // Если директория не существует, создаем ее
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Настройка кодировки для правильной обработки UTF-8
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Установка заголовков для корректной обработки UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Создаем директории при запуске
createUploadDirs();

// Маршруты аутентификации
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// Маршруты пользователя
app.use('/api/user', userRoutes);

// Маршруты администратора
app.use('/api/admin', adminRoutes);

// Маршруты отзывов
app.use('/api/reviews', reviewRoutes);

// Маршруты каталога
app.use('/api/catalog', catalogRoutes);

// Маршруты заказов
app.use('/api/orders', ordersRoutes);

// Маршрут для получения статусов автомобилей без префикса admin
app.get('/api/cars/statuses', authMiddleware, isAdminOrEmployee, getCarStatuses);

// Маршрут для получения брендов автомобилей
app.get('/api/cars/brands', authMiddleware, async (req, res) => {
  try {
    const [brands] = await pool.query('SELECT id, name FROM brands ORDER BY name');
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Ошибка при получении брендов' });
  }
});

// Маршрут для получения типов топлива
app.get('/api/cars/fuel-types', authMiddleware, async (req, res) => {
  try {
    const [fuelTypes] = await pool.query('SELECT id, name FROM fuel_types ORDER BY name');
    res.json(fuelTypes);
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    res.status(500).json({ message: 'Ошибка при получении типов топлива' });
  }
});

// Маршрут для получения типов трансмиссий
app.get('/api/cars/transmission-types', authMiddleware, async (req, res) => {
  try {
    const [transmissionTypes] = await pool.query('SELECT id, name FROM transmission_types ORDER BY name');
    res.json(transmissionTypes);
  } catch (error) {
    console.error('Error fetching transmission types:', error);
    res.status(500).json({ message: 'Ошибка при получении типов трансмиссий' });
  }
});

// Маршрут для получения цветов
app.get('/api/cars/colors', authMiddleware, async (req, res) => {
  try {
    const [colors] = await pool.query('SELECT id, name FROM colors ORDER BY name');
    res.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    res.status(500).json({ message: 'Ошибка при получении цветов' });
  }
});

// Маршрут для получения моделей автомобилей
app.get('/api/cars/models', authMiddleware, async (req, res) => {
  try {
    const brandId = req.query.brand;
    let query = 'SELECT id, brand_id, name FROM models';
    const params = [];
    
    if (brandId) {
      query += ' WHERE brand_id = ?';
      params.push(parseInt(brandId));
    }
    
    query += ' ORDER BY name';
    const [models] = await pool.query(query, params);
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: 'Ошибка при получении моделей' });
  }
});

// Маршрут для получения изображений автомобиля без префикса admin
app.get('/api/cars/:id/images', authMiddleware, isAdminOrEmployee, getCarImages);

// Дополнительный маршрут для обновления статуса автомобиля
app.put('/api/cars/:id/status', authMiddleware, isAdminOrEmployee, updateCarStatus);

// Маршруты CRUD для автомобилей без префикса admin
app.get('/api/cars', authMiddleware, isAdminOrEmployee, getAllCars);
app.get('/api/cars/:id', authMiddleware, isAdminOrEmployee, getCarById);
app.post('/api/cars', authMiddleware, isAdminOrEmployee, upload.array('images', 10), createCar);
app.put('/api/cars/:id', authMiddleware, isAdminOrEmployee, upload.array('images', 10), updateCar);
app.delete('/api/cars/:id', authMiddleware, isAdminOrEmployee, deleteCar);

async function startServer() {
  try {
    // Инициализация базы данных
    await initDatabase();
    
    // Обновление таблицы cars
    await updateCarsTable();
    
    // Обновление таблицы users
    await updateUsersTable();
    
    // Обновление статусов
    await initStatuses();
    
    // Применяем обновление статусов автомобилей
    const updateStatusesSql = await fs.readFile('./src/config/update_car_statuses.sql', 'utf8');
    
    // Разделяем SQL файл на отдельные запросы и выполняем их последовательно
    const sqlStatements = updateStatusesSql.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement && !statement.startsWith('--'));
    
    for (const statement of sqlStatements) {
      if (statement) {
        await pool.query(statement);
      }
    }
    
    console.log('Car statuses updated successfully');
    
    // Создаем директории для загрузки файлов
    await createUploadDirs();
    
    // Запускаем сервер
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 
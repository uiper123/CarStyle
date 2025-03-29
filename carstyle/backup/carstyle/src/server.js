import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { register, login } from './controllers/auth.controller.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import { initDatabase } from './config/initDatabase.js';
import updateCarsTable from './config/update_cars_table.js';
import updateUsersTable from './config/update_users_table.js';
import upload from './config/multer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3002;

// Создаем директории для загрузок
const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/avatars', 'uploads/documents'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  });
};

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

// Инициализация базы данных и запуск сервера
const startServer = async () => {
  try {
    // Инициализируем базу данных
    await initDatabase();
    
    // Выполняем миграцию таблицы cars
    console.log('Выполняем миграцию таблицы cars...');
    await updateCarsTable();
    
    // Выполняем миграцию таблицы users
    console.log('Выполняем миграцию таблицы users...');
    await updateUsersTable();
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer(); 
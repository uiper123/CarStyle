import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/admin.middleware.js';
import pool from '../config/database.js';

const router = Router();

// Настраиваем хранилище для загрузки изображений
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Создаем папку uploads, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Создаем уникальное имя файла, чтобы избежать перезаписи
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'car-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Фильтр для ограничения типов файлов
const fileFilter = (req, file, cb) => {
  // Принимаем только изображения
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Можно загружать только изображения!'), false);
  }
};

// Настраиваем middleware для загрузки
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB лимит размера файла
  }
});

// Гарантируем, что существует директория для загрузки изображений
router.use(async (req, res, next) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    next();
  } catch (error) {
    console.error('Ошибка при инициализации директории загрузок:', error);
    // Пропускаем ошибку, чтобы не блокировать все запросы
    next();
  }
});

// Создание автомобиля с поддержкой множественных изображений
router.post('/cars', authMiddleware, isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { brand, model, year, color, price, mileage, status, description, fuel_type, transmission } = req.body;
    
    console.log('Полученные данные для создания автомобиля:', req.body);
    console.log('Файлы:', req.files ? req.files.length : 0);
    
    // Проверка на обязательные поля
    const missingFields = [];
    if (!brand) missingFields.push('brand');
    if (!model) missingFields.push('model');
    if (!fuel_type) missingFields.push('fuel_type');
    if (!transmission) missingFields.push('transmission');
    if (!color) missingFields.push('color');
    
    if (missingFields.length > 0) {
      console.error('Не заполнены обязательные поля:', missingFields, 'Тело запроса:', req.body);
      // Если загружены файлы, удаляем их
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({ 
        message: 'Необходимо заполнить все обязательные поля', 
        missingFields,
        receivedData: req.body
      });
    }
    
    // Проверяем наличие изображений
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Необходимо загрузить хотя бы одно изображение' });
    }
    
    // Безопасно преобразуем строки в числа
    let brandId, modelId, fuelTypeId, transmissionId, colorId;
    let invalidFields = [];
    
    try {
      brandId = parseInt(brand);
      if (isNaN(brandId) || brandId <= 0) invalidFields.push('brand');
    } catch (e) {
      invalidFields.push('brand');
    }
    
    try {
      modelId = parseInt(model);
      if (isNaN(modelId) || modelId <= 0) invalidFields.push('model');
    } catch (e) {
      invalidFields.push('model');
    }
    
    try {
      fuelTypeId = parseInt(fuel_type);
      if (isNaN(fuelTypeId) || fuelTypeId <= 0) invalidFields.push('fuel_type');
    } catch (e) {
      invalidFields.push('fuel_type');
    }
    
    try {
      transmissionId = parseInt(transmission);
      if (isNaN(transmissionId) || transmissionId <= 0) invalidFields.push('transmission');
    } catch (e) {
      invalidFields.push('transmission');
    }
    
    try {
      colorId = parseInt(color);
      if (isNaN(colorId) || colorId <= 0) invalidFields.push('color');
    } catch (e) {
      invalidFields.push('color');
    }
    
    if (invalidFields.length > 0) {
      console.error('Невалидные поля:', invalidFields, 'Значения:', { 
        brand, model, fuel_type, transmission, color 
      });
      
      // Удаляем загруженные файлы
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      return res.status(400).json({ 
        message: 'Некоторые поля имеют невалидные значения', 
        invalidFields,
        receivedValues: { brand, model, fuel_type, transmission, color }
      });
    }
    
    // Все обязательные данные есть, создаем новый автомобиль
    // Преобразуем числовые поля в числа, если они переданы как строки
    const yearValue = year ? parseInt(year) : new Date().getFullYear();
    const priceValue = price ? parseFloat(price) : 0;
    const mileageValue = mileage ? parseInt(mileage) : 0;
    
    // Создаем новый автомобиль
    const [result] = await pool.query(
      `INSERT INTO cars (brand_id, model_id, year, color_id, price, mileage, status, description, fuel_type_id, transmission_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [brandId, modelId, yearValue, colorId, priceValue, mileageValue, status || 'available', description || '', fuelTypeId, transmissionId]
    );
    
    const carId = result.insertId;
    console.log(`Создан автомобиль с ID: ${carId}`);
    
    // Сохраняем информацию о каждом загруженном изображении в базу данных
    for (const file of req.files) {
      await pool.query(
        `INSERT INTO car_images (car_id, image_url, is_primary) 
         VALUES (?, ?, ?)`,
        [carId, `/uploads/${file.filename}`, req.files.indexOf(file) === 0 ? 1 : 0] // Первое изображение устанавливаем как основное
      );
      console.log(`Добавлено изображение: /uploads/${file.filename}`);
    }
    
    res.status(201).json({ 
      message: 'Автомобиль успешно добавлен',
      carId: carId
    });
  } catch (error) {
    console.error('Error creating car:', error);
    // Если есть загруженные файлы, удаляем их при ошибке
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ 
      message: 'Ошибка при создании автомобиля',
      error: error.message 
    });
  }
});

// Обновление автомобиля с поддержкой добавления новых изображений
router.put('/cars/:id', authMiddleware, isAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const carId = req.params.id;
    const { brand, model, year, color, price, mileage, status, description, fuel_type, transmission } = req.body;
    
    console.log('Полученные данные для обновления:', req.body);
    console.log('ID автомобиля:', carId);
    console.log('Новые файлы:', req.files ? req.files.length : 0);
    
    // Проверка на обязательные поля
    const missingFields = [];
    if (!brand) missingFields.push('brand');
    if (!model) missingFields.push('model');
    if (!fuel_type) missingFields.push('fuel_type');
    if (!transmission) missingFields.push('transmission');
    if (!color) missingFields.push('color');
    
    if (missingFields.length > 0) {
      console.error('Не заполнены обязательные поля при обновлении:', missingFields, 'Тело запроса:', req.body);
      // Если загружены файлы, удаляем их
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(400).json({ 
        message: 'Необходимо заполнить все обязательные поля', 
        missingFields,
        receivedData: req.body
      });
    }
    
    // Безопасно преобразуем строки в числа
    let brandId, modelId, fuelTypeId, transmissionId, colorId;
    let invalidFields = [];
    
    try {
      brandId = parseInt(brand);
      if (isNaN(brandId) || brandId <= 0) invalidFields.push('brand');
    } catch (e) {
      invalidFields.push('brand');
    }
    
    try {
      modelId = parseInt(model);
      if (isNaN(modelId) || modelId <= 0) invalidFields.push('model');
    } catch (e) {
      invalidFields.push('model');
    }
    
    try {
      fuelTypeId = parseInt(fuel_type);
      if (isNaN(fuelTypeId) || fuelTypeId <= 0) invalidFields.push('fuel_type');
    } catch (e) {
      invalidFields.push('fuel_type');
    }
    
    try {
      transmissionId = parseInt(transmission);
      if (isNaN(transmissionId) || transmissionId <= 0) invalidFields.push('transmission');
    } catch (e) {
      invalidFields.push('transmission');
    }
    
    try {
      colorId = parseInt(color);
      if (isNaN(colorId) || colorId <= 0) invalidFields.push('color');
    } catch (e) {
      invalidFields.push('color');
    }
    
    if (invalidFields.length > 0) {
      console.error('Невалидные поля при обновлении:', invalidFields, 'Значения:', { 
        brand, model, fuel_type, transmission, color 
      });
      
      // Удаляем загруженные файлы
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      
      return res.status(400).json({ 
        message: 'Некоторые поля имеют невалидные значения', 
        invalidFields,
        receivedValues: { brand, model, fuel_type, transmission, color }
      });
    }
    
    // Проверяем, существует ли автомобиль
    const [checkCar] = await pool.query(
      'SELECT * FROM cars WHERE car_id = ?',
      [carId]
    );
    
    if (checkCar.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }
    
    // Преобразуем числовые поля в числа, если они переданы как строки
    const yearValue = year ? parseInt(year) : new Date().getFullYear();
    const priceValue = price ? parseFloat(price) : 0;
    const mileageValue = mileage ? parseInt(mileage) : 0;
    
    // Обновляем данные автомобиля
    await pool.query(
      `UPDATE cars SET 
       brand_id = ?, model_id = ?, year = ?, color_id = ?, price = ?, 
       mileage = ?, status = ?, description = ?, fuel_type_id = ?, transmission_id = ?
       WHERE car_id = ?`,
      [brandId, modelId, yearValue, colorId, priceValue, mileageValue, status || 'available', description || '', fuelTypeId, transmissionId, carId]
    );
    
    console.log(`Обновлен автомобиль с ID: ${carId}`);
    
    // Если есть новые изображения, добавляем их
    if (req.files && req.files.length > 0) {
      // Получаем текущие изображения
      const [existingImages] = await pool.query(
        'SELECT * FROM car_images WHERE car_id = ?',
        [carId]
      );
      
      // Если у автомобиля еще нет изображений, первое загруженное изображение будет основным
      const hasPrimaryImage = existingImages.some(img => img.is_primary === 1);
      
      // Сохраняем информацию о каждом загруженном изображении
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO car_images (car_id, image_url, is_primary) 
           VALUES (?, ?, ?)`,
          [carId, `/uploads/${file.filename}`, (!hasPrimaryImage && req.files.indexOf(file) === 0) ? 1 : 0]
        );
        console.log(`Добавлено изображение: /uploads/${file.filename}`);
      }
    }
    
    res.json({ 
      message: 'Автомобиль успешно обновлен',
      carId: carId
    });
  } catch (error) {
    console.error('Error updating car:', error);
    // Если есть загруженные файлы, удаляем их при ошибке
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ 
      message: 'Ошибка при обновлении автомобиля',
      error: error.message 
    });
  }
});

// Маршрут для удаления изображения
router.delete('/cars/:carId/images/:imageId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { carId, imageId } = req.params;
    
    // Проверяем, существует ли изображение
    const [checkImage] = await pool.query(
      'SELECT * FROM car_images WHERE image_id = ? AND car_id = ?',
      [imageId, carId]
    );
    
    if (checkImage.length === 0) {
      return res.status(404).json({ message: 'Изображение не найдено' });
    }
    
    const imageInfo = checkImage[0];
    const wasMainImage = imageInfo.is_primary === 1;
    
    // Удаляем изображение из базы данных
    await pool.query(
      'DELETE FROM car_images WHERE image_id = ?',
      [imageId]
    );
    
    // Удаляем файл с диска
    if (imageInfo.image_url) {
      const filePath = path.join(process.cwd(), imageInfo.image_url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Если это было основное изображение, назначаем новое основное изображение
    if (wasMainImage) {
      const [remainingImages] = await pool.query(
        'SELECT * FROM car_images WHERE car_id = ? LIMIT 1',
        [carId]
      );
      
      if (remainingImages.length > 0) {
        await pool.query(
          'UPDATE car_images SET is_primary = 1 WHERE image_id = ?',
          [remainingImages[0].image_id]
        );
      }
    }
    
    res.json({ message: 'Изображение успешно удалено' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении изображения',
      error: error.message 
    });
  }
});

// Маршрут для установки основного изображения
router.put('/cars/:carId/images/:imageId/primary', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { carId, imageId } = req.params;
    
    // Проверяем, существует ли изображение
    const [checkImage] = await pool.query(
      'SELECT * FROM car_images WHERE image_id = ? AND car_id = ?',
      [imageId, carId]
    );
    
    if (checkImage.length === 0) {
      return res.status(404).json({ message: 'Изображение не найдено' });
    }
    
    // Сначала сбрасываем флаг основного изображения для всех изображений этого автомобиля
    await pool.query(
      'UPDATE car_images SET is_primary = 0 WHERE car_id = ?',
      [carId]
    );
    
    // Затем устанавливаем текущее изображение как основное
    await pool.query(
      'UPDATE car_images SET is_primary = 1 WHERE image_id = ?',
      [imageId]
    );
    
    res.json({ message: 'Основное изображение успешно установлено' });
  } catch (error) {
    console.error('Error setting primary image:', error);
    res.status(500).json({ 
      message: 'Ошибка при установке основного изображения',
      error: error.message 
    });
  }
}); 
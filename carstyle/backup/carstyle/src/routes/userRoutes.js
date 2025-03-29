import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.middleware.js';
import pool from '../config/database.js';

const router = express.Router();

// Создаем директории для загрузок, если их нет
const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/avatars', 'uploads/documents'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Создаем директории при инициализации роутера
createUploadDirs();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.params.type || (file.fieldname === 'avatar' ? 'avatars' : 'documents');
    cb(null, `uploads/${type}`);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Получение профиля пользователя
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Simplified query to reduce potential SQL errors
    const query = `
      SELECT u.*
      FROM users u
      WHERE u.user_id = ?
    `;

    const [users] = await pool.query(query, [userId]);

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove password from response
    const user = users[0];
    delete user.password;
    
    // Преобразуем avatar_url в полный URL, если он существует
    if (user.avatar_url && !user.avatar_url.startsWith('http')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Проверяем формат URL: содержит ли он полный путь или только имя файла
      if (user.avatar_url.includes('/uploads/avatars/')) {
        user.avatar_url = `${baseUrl}${user.avatar_url}`;
      } else {
        user.avatar_url = `${baseUrl}/uploads/avatars/${user.avatar_url}`;
      }
    }
    
    // Try to fetch additional client data separately
    try {
      const clientQuery = `
        SELECT * FROM clients 
        WHERE client_id = ?
      `;
      const [clients] = await pool.query(clientQuery, [userId]);
      
      if (clients && clients.length > 0) {
        const client = clients[0];
        // Add client data to user
        user.driver_license = client.driver_license;
        user.passport_series = client.passport_series;
        user.passport_number = client.passport_number;
        user.status = client.status;
      }
    } catch (clientError) {
      console.error('Error fetching client data:', clientError);
      // Continue with user data only
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      message: 'Server error while fetching profile',
      error: error.message
    });
  }
});

// Новый маршрут для обновления профиля с английскими полями
router.put('/profile/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Received profile update request for userId:', userId);
    console.log('Request body:', req.body);
    
    const { name, surname, patronymic, phone, driverLicense, passportSeries, passportNumber } = req.body;

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Обновляем основную информацию пользователя
      console.log('Updating user basic information');

      // Преобразуем телефон в число, если это возможно
      let phoneValue = null;
      if (phone) {
        try {
          // Удаляем все нецифровые символы и преобразуем в число
          phoneValue = phone.replace(/\D/g, '');
          console.log('Formatted phone number:', phoneValue);
        } catch (err) {
          console.error('Error processing phone number:', err);
          phoneValue = null;
        }
      }

      const updateUserQuery = 'UPDATE users SET firstname = ?, lastname = ?, middlename = ?, phone = ? WHERE user_id = ?';
      const userParams = [name || null, surname || null, patronymic || null, phoneValue, userId];
      console.log('SQL query:', updateUserQuery);
      console.log('Parameters:', userParams);
      
      const [userResult] = await connection.query(updateUserQuery, userParams);
      console.log('User update result:', userResult);
  
      // Проверяем, есть ли данные для обновления Клиента
      if (driverLicense || passportSeries || passportNumber) {
        console.log('Processing client data');
        
        // Проверяем, существует ли запись клиента
        const [existingClient] = await connection.query(
          'SELECT client_id FROM clients WHERE client_id = ?',
          [userId]
        );
        
        if (existingClient.length > 0) {
          console.log('Found existing client record, updating');
          const updateClientQuery = 'UPDATE clients SET driver_license = ?, passport_series = ?, passport_number = ? WHERE client_id = ?';
          const clientParams = [
            driverLicense || null, 
            passportSeries || null, 
            passportNumber || null, 
            userId
          ];
          console.log('SQL query:', updateClientQuery);
          console.log('Parameters:', clientParams);
          
          const [clientResult] = await connection.query(updateClientQuery, clientParams);
          console.log('Client update result:', clientResult);
        } else {
          console.log('Client record not found, creating new one');
          const insertClientQuery = 'INSERT INTO clients (client_id, driver_license, passport_series, passport_number, status) VALUES (?, ?, ?, ?, true)';
          const clientParams = [
            userId, 
            driverLicense || null, 
            passportSeries || null, 
            passportNumber || null
          ];
          console.log('SQL query:', insertClientQuery);
          console.log('Parameters:', clientParams);
          
          const [clientResult] = await connection.query(insertClientQuery, clientParams);
          console.log('Client creation result:', clientResult);
        }
      }
      
      await connection.commit();
      console.log('Transaction successfully committed');
      
      // Получаем обновленные данные пользователя
      console.log('Getting updated user data');
      const [updatedUsers] = await pool.query(`
        SELECT 
          u.*,
          c.driver_license,
          c.passport_series,
          c.passport_number,
          c.status
        FROM users u
        LEFT JOIN clients c ON u.user_id = c.client_id
        WHERE u.user_id = ?
      `, [userId]);
      
      if (updatedUsers && updatedUsers.length > 0) {
        const updatedUser = updatedUsers[0];
        delete updatedUser.password;
        
        // Преобразуем avatar_url в полный URL, если он существует
        if (updatedUser.avatar_url && !updatedUser.avatar_url.startsWith('http')) {
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          
          // Проверяем формат URL: содержит ли он полный путь или только имя файла
          if (updatedUser.avatar_url.includes('/uploads/avatars/')) {
            updatedUser.avatar_url = `${baseUrl}${updatedUser.avatar_url}`;
          } else {
            updatedUser.avatar_url = `${baseUrl}/uploads/avatars/${updatedUser.avatar_url}`;
          }
        }
        
        console.log('Sending updated user data');
        
        res.json({ 
          message: 'Profile successfully updated',
          success: true,
          user: updatedUser
        });
      } else {
        console.log('Failed to get updated user data');
        res.json({ 
          message: 'Profile updated successfully, but failed to get updated data',
          success: true
        });
      }
    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Server error while updating profile',
      error: error.message,
      success: false
    });
  }
});

// Обновление документов пользователя
router.put('/documents/:type', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const documentData = req.body;
    
    // Если есть загруженный файл, добавляем его URL
    if (req.file) {
      documentData.document_url = `/uploads/documents/${req.file.filename}`;
    }

    // Проверяем, есть ли уже документ данного типа
    const [existingDoc] = await pool.query(
      'SELECT id_document FROM user_documents WHERE user_id = ? AND document_type = ?',
      [userId, type]
    );

    if (existingDoc.length > 0) {
      // Обновляем существующий документ
      await pool.query(
        `UPDATE user_documents SET ? WHERE user_id = ? AND document_type = ?`,
        [documentData, userId, type]
      );
    } else {
      // Добавляем новый документ
      documentData.user_id = userId;
      documentData.document_type = type;
      await pool.query('INSERT INTO user_documents SET ?', [documentData]);
    }

    res.json({ 
      message: 'Document successfully updated',
      success: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error updating document',
      error: error.message,
      success: false
    });
  }
});

// Загрузка файла документа
router.post('/documents/:type/file', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;
    const documentUrl = `/uploads/documents/${req.file.filename}`;

    // Проверяем, есть ли уже документ данного типа
    const [existingDoc] = await pool.query(
      'SELECT id_document FROM user_documents WHERE user_id = ? AND document_type = ?',
      [userId, type]
    );

    if (existingDoc.length > 0) {
      // Обновляем существующий документ
      await pool.query(
        'UPDATE user_documents SET document_url = ? WHERE user_id = ? AND document_type = ?',
        [documentUrl, userId, type]
      );
    } else {
      // Добавляем новый документ
      await pool.query(
        'INSERT INTO user_documents (user_id, document_type, document_url) VALUES (?, ?, ?)',
        [userId, type, documentUrl]
      );
    }

    res.json({ documentUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Загрузка аватара пользователя
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const avatarFilename = req.file ? req.file.filename : null;

    if (!avatarFilename) {
      return res.status(400).json({ 
        message: 'Avatar file was not uploaded',
        success: false 
      });
    }

    // Полный URL для аватара
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullAvatarUrl = `${baseUrl}/uploads/avatars/${avatarFilename}`;

    // Update user avatar
    await pool.query(
      'UPDATE users SET avatar_url = ? WHERE user_id = ?',
      [fullAvatarUrl, userId]
    );

    res.json({ 
      message: 'Avatar successfully updated',
      success: true,
      user: {
        avatar_url: fullAvatarUrl
      }
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ 
      message: 'Error uploading avatar',
      error: error.message,
      success: false
    });
  }
});

export default router;
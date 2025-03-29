import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.middleware.js';
import pool from '../config/database.js';
import CryptoJS from 'crypto-js';

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

// Encryption key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secure-encryption-key-change-in-production';

// Helper function to encrypt sensitive data
const encryptData = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text.toString(), ENCRYPTION_KEY).toString();
};

// Helper function to decrypt sensitive data
const decryptData = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

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
        // Add decrypted client data to user response
        user.driver_license = decryptData(client.driver_license) || client.driver_license;
        user.passport_series = decryptData(client.passport_series) || client.passport_series;
        user.passport_number = decryptData(client.passport_number) || client.passport_number;
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

// Обновление профиля пользователя
router.put('/profile', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstname, lastname, middlename, phone, driver_license, passport_series, passport_number } = req.body;
    const avatarUrl = req.file ? req.file.filename : null;

    console.log('Updating profile for user:', userId);
    console.log('Received data:', req.body);
    console.log('Avatar file:', req.file);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user information
      const [updateUserResult] = await connection.query(
        'UPDATE `users` SET `firstname` = ?, `lastname` = ?, `middlename` = ?, `phone` = ? WHERE user_id = ?',
        [firstname, lastname, middlename, phone, userId]
      );
      console.log('User update result:', updateUserResult);

      // Update avatar if uploaded
      if (avatarUrl) {
        const [avatarResult] = await connection.query(
          'UPDATE `users` SET avatar_url = ? WHERE user_id = ?',
          [avatarUrl, userId]
        );
        console.log('Avatar update result:', avatarResult);
      }

      // Шифруем чувствительные данные
      const encryptedDriverLicense = encryptData(driver_license);
      const encryptedPassportSeries = encryptData(passport_series);
      const encryptedPassportNumber = encryptData(passport_number);
      
      console.log('Sensitive data encrypted successfully');

      // Check if client record exists
      const [clientExists] = await connection.query(
        'SELECT client_id FROM `clients` WHERE client_id = ?',
        [userId]
      );

      if (clientExists.length === 0) {
        // Create new client record if it doesn't exist
        await connection.query(
          'INSERT INTO `clients` (client_id, `driver_license`, `passport_series`, `passport_number`) VALUES (?, ?, ?, ?)',
          [userId, encryptedDriverLicense, encryptedPassportSeries, encryptedPassportNumber]
        );
        console.log('New client record created with encrypted data');
      } else {
        // Update existing client record
        await connection.query(
          'UPDATE `clients` SET `driver_license` = ?, `passport_series` = ?, `passport_number` = ? WHERE client_id = ?',
          [encryptedDriverLicense, encryptedPassportSeries, encryptedPassportNumber, userId]
        );
        console.log('Existing client record updated with encrypted data');
      }

      // Get updated data
      const [updatedUser] = await connection.query(
        `SELECT 
          u.*,
          c.\`driver_license\` as encrypted_driver_license,
          c.\`passport_series\` as encrypted_passport_series,
          c.\`passport_number\` as encrypted_passport_number,
          c.\`status\`
        FROM \`users\` u
        LEFT JOIN \`clients\` c ON u.user_id = c.client_id
        WHERE u.user_id = ?`,
        [userId]
      );

      // Commit transaction
      await connection.commit();

      // Расшифровываем данные для ответа
      if (updatedUser[0].encrypted_driver_license) {
        updatedUser[0].driver_license = decryptData(updatedUser[0].encrypted_driver_license);
        delete updatedUser[0].encrypted_driver_license;
      }
      
      if (updatedUser[0].encrypted_passport_series) {
        updatedUser[0].passport_series = decryptData(updatedUser[0].encrypted_passport_series);
        delete updatedUser[0].encrypted_passport_series;
      }
      
      if (updatedUser[0].encrypted_passport_number) {
        updatedUser[0].passport_number = decryptData(updatedUser[0].encrypted_passport_number);
        delete updatedUser[0].encrypted_passport_number;
      }

      // Remove password from response
      delete updatedUser[0].password;

      res.json({ 
        message: 'Profile updated successfully with encrypted sensitive data',
        success: true,
        user: updatedUser[0]
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
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
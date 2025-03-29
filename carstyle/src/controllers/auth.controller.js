import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secure-encryption-key-change-in-production';

// Helper function to encrypt sensitive data
const encryptData = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text.toString(), ENCRYPTION_KEY).toString();
};

// Helper function to decrypt sensitive data
const decryptData = (ciphertext) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const register = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;
        
        // Check if the user already exists
        const [existingUsers] = await pool.query(
            'SELECT * FROM `users` WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                message: 'User with this email already exists',
                success: false 
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with role 'client' by default
        const [result] = await pool.query(
            'INSERT INTO `users` (email, `password`, `firstname`, `phone`, `role`) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, name, phone, 'client']
        );

        const userId = result.insertId;

        // Create entry in clients table
        await pool.query(
            'INSERT INTO `clients` (client_id, `status`) VALUES (?, true)',
            [userId]
        );

        // Create token
        const token = jwt.sign(
            { id: userId, email, role: 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User successfully registered',
            success: true,
            token,
            user: {
                id: userId,
                email,
                name,
                phone,
                role: 'client'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error during registration',
            error: error.message,
            success: false
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Get user
        const [users] = await pool.query(
            'SELECT * FROM `users` WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                message: 'Invalid email or password',
                success: false 
            });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                message: 'Invalid email or password',
                success: false 
            });
        }

        // Get additional client information
        const [clientInfo] = await pool.query(
            'SELECT `status` FROM `clients` WHERE client_id = ?',
            [user.user_id]
        );

        // Create token with role
        const token = jwt.sign(
            { id: user.user_id, email: user.email, role: user.role || 'client' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            success: true,
            token,
            user: {
                id: user.user_id,
                email: user.email,
                name: user.firstname,
                phone: user.phone,
                role: user.role || 'client',
                status: clientInfo[0]?.status || 'Active'
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            error: error.message,
            success: false
        });
    }
}; 
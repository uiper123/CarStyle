import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

async function testConnection() {
    try {
        console.log('Attempting to connect to database...');
        console.log('Host:', process.env.DB_HOST);
        console.log('User:', process.env.DB_USER);
        console.log('Database:', process.env.DB_NAME);
        console.log('Port:', process.env.DB_PORT);

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('Successfully connected to the database!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1');
        console.log('Query test successful:', rows);

        await connection.end();
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

testConnection(); 
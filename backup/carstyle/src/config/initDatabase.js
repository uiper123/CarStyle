import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Set up path to .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
};

export async function initDatabase() {
    let connection;
    try {
        // Create connection to MySQL without specifying a database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL successfully');

        // Create database if it doesn't exist
        await connection.query('CREATE DATABASE IF NOT EXISTS carstyle;');
        console.log('Successfully executed SQL query: CREATE DATABASE IF NOT EXISTS carstyle;');

        // Use the database
        await connection.query('USE carstyle;');
        console.log('Successfully executed SQL query: USE carstyle;');

        // Read and execute SQL script
        const sqlScript = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
        const queries = sqlScript.split(';').filter(query => query.trim());

        for (const query of queries) {
            if (query.trim()) {
                try {
                    await connection.query(query);
                    console.log('Successfully executed SQL query:', query.substring(0, 50) + '...');
                } catch (error) {
                    // Ignore error if index already exists
                    if (error.code === 'ER_DUP_KEYNAME') {
                        console.log('Index already exists:', query.substring(0, 50) + '...');
                    } else {
                        throw error;
                    }
                }
            }
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

export default initDatabase; 
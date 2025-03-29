import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carstyle',
  port: process.env.DB_PORT || 3306
};

async function migrateDatabase() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');

    // Start transaction
    await connection.beginTransaction();
    console.log('Transaction started');

    // Create new tables with English names
    console.log('Creating new tables with English names...');

    // users table (from Пользователь)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        phone VARCHAR(20),
        email VARCHAR(255),
        password VARCHAR(255),
        lastname VARCHAR(255),
        firstname VARCHAR(255),
        middlename VARCHAR(255),
        avatar_url VARCHAR(255),
        PRIMARY KEY(user_id)
      )
    `);
    console.log('Created users table');

    // Copy data from Пользователь to users
    await connection.query(`
      INSERT INTO users (user_id, phone, email, password, lastname, firstname, middlename, avatar_url)
      SELECT user_id, Телефон, email, Пароль, Фамилия, Имя, Отчество, avatar_url 
      FROM \`Пользователь\`
    `);
    console.log('Copied data from Пользователь to users');

    // clients table (from Клиент)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        driver_license INTEGER,
        passport_series INTEGER,
        passport_number INTEGER,
        status BOOLEAN,
        PRIMARY KEY(client_id),
        FOREIGN KEY(client_id) REFERENCES users(user_id)
      )
    `);
    console.log('Created clients table');

    // Copy data from Клиент to clients
    await connection.query(`
      INSERT INTO clients (client_id, driver_license, passport_series, passport_number, status)
      SELECT client_id, ВУ, Серия_Паспорта, Номер_Паспорта, Статус 
      FROM \`Клиент\`
    `);
    console.log('Copied data from Клиент to clients');

    // brands table (from Бренд)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS brands (
        brand_id INTEGER NOT NULL UNIQUE,
        brand_name VARCHAR(255) NOT NULL,
        PRIMARY KEY(brand_id)
      )
    `);
    console.log('Created brands table');

    // Copy data from Бренд to brands
    await connection.query(`
      INSERT INTO brands (brand_id, brand_name)
      SELECT brend_id, brend_name 
      FROM \`Бренд\`
    `);
    console.log('Copied data from Бренд to brands');

    // colors table (from Цвета)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS colors (
        color_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        color_name VARCHAR(255) NOT NULL,
        PRIMARY KEY(color_id)
      )
    `);
    console.log('Created colors table');

    // Copy data from Цвета to colors
    await connection.query(`
      INSERT INTO colors (color_id, color_name)
      SELECT id_color, Color 
      FROM \`Цвета\`
    `);
    console.log('Copied data from Цвета to colors');

    // fuel_types table (from Тип топлива)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fuel_types (
        fuel_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        fuel_name VARCHAR(255) NOT NULL,
        PRIMARY KEY(fuel_id)
      )
    `);
    console.log('Created fuel_types table');

    // Copy data from Тип топлива to fuel_types
    await connection.query(`
      INSERT INTO fuel_types (fuel_id, fuel_name)
      SELECT id_fuel, name_fuel 
      FROM \`Тип топлива\`
    `);
    console.log('Copied data from Тип топлива to fuel_types');

    // transmissions table (from КПП)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transmissions (
        transmission_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        transmission_name VARCHAR(255) NOT NULL,
        PRIMARY KEY(transmission_id)
      )
    `);
    console.log('Created transmissions table');

    // Copy data from КПП to transmissions
    await connection.query(`
      INSERT INTO transmissions (transmission_id, transmission_name)
      SELECT id_Kpp, Name_kpp 
      FROM \`КПП\`
    `);
    console.log('Copied data from КПП to transmissions');

    // models table (from model)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS models (
        model_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        model_name VARCHAR(255),
        PRIMARY KEY(model_id)
      )
    `);
    console.log('Created models table');

    // Copy data from model to models
    await connection.query(`
      INSERT INTO models (model_id, model_name)
      SELECT id_model, name 
      FROM model
    `);
    console.log('Copied data from model to models');

    // positions table (from Должность)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS positions (
        position_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        position_name VARCHAR(255),
        PRIMARY KEY(position_id)
      )
    `);
    console.log('Created positions table');

    // Copy data from Должность to positions
    await connection.query(`
      INSERT INTO positions (position_id, position_name)
      SELECT id_title, Название 
      FROM \`Должность\`
    `);
    console.log('Copied data from Должность to positions');

    // employees table (from Сотрудник)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS employees (
        employee_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        position_id INTEGER,
        user_id INTEGER,
        PRIMARY KEY(employee_id),
        FOREIGN KEY(position_id) REFERENCES positions(position_id),
        FOREIGN KEY(user_id) REFERENCES users(user_id)
      )
    `);
    console.log('Created employees table');

    // Copy data from Сотрудник to employees
    await connection.query(`
      INSERT INTO employees (employee_id, position_id, user_id)
      SELECT id_emp, id_title, id_user 
      FROM \`Сотрудник\`
    `);
    console.log('Copied data from Сотрудник to employees');

    // statuses table (from Статус)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS statuses (
        status_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        status_name VARCHAR(255),
        PRIMARY KEY(status_id)
      )
    `);
    console.log('Created statuses table');

    // Copy data from Статус to statuses
    await connection.query(`
      INSERT INTO statuses (status_id, status_name)
      SELECT status_id, name 
      FROM \`Статус\`
    `);
    console.log('Copied data from Статус to statuses');

    // cars table (from Машина)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cars (
        car_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        brand_id INTEGER,
        fuel_id INTEGER,
        transmission_id INTEGER,
        color_id INTEGER,
        model_id INTEGER,
        production_year DATE,
        price_per_day INTEGER,
        description VARCHAR(255),
        license_plate VARCHAR(10),
        PRIMARY KEY(car_id),
        FOREIGN KEY(brand_id) REFERENCES brands(brand_id),
        FOREIGN KEY(fuel_id) REFERENCES fuel_types(fuel_id),
        FOREIGN KEY(transmission_id) REFERENCES transmissions(transmission_id),
        FOREIGN KEY(color_id) REFERENCES colors(color_id),
        FOREIGN KEY(model_id) REFERENCES models(model_id)
      )
    `);
    console.log('Created cars table');

    // Copy data from Машина to cars
    await connection.query(`
      INSERT INTO cars (car_id, brand_id, fuel_id, transmission_id, color_id, model_id, production_year, price_per_day, description, license_plate)
      SELECT car_id, brend_id, id_fuel, id_Kpp, id_color, Id_model, \`Год выпуска\`, \`Цена за сутки\`, Описание, ГосНомер 
      FROM \`Машина\`
    `);
    console.log('Copied data from Машина to cars');

    // orders table (from Заказы)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        employee_id INTEGER,
        car_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        status_id INTEGER,
        return_date DATE,
        price FLOAT,
        issue_date DATE NOT NULL,
        PRIMARY KEY(order_id),
        FOREIGN KEY(employee_id) REFERENCES employees(employee_id),
        FOREIGN KEY(car_id) REFERENCES cars(car_id),
        FOREIGN KEY(client_id) REFERENCES clients(client_id),
        FOREIGN KEY(status_id) REFERENCES statuses(status_id)
      )
    `);
    console.log('Created orders table');

    // Copy data from Заказы to orders
    await connection.query(`
      INSERT INTO orders (order_id, employee_id, car_id, client_id, status_id, return_date, price, issue_date)
      SELECT id_zakaz, id_emp, car_id, id_client, status_id, ДатаВозврата, Стоимость, ДатаВыдачи 
      FROM \`Заказы\`
    `);
    console.log('Copied data from Заказы to orders');

    // reviews table (from Отзыв)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER NOT NULL AUTO_INCREMENT UNIQUE,
        client_id INTEGER,
        car_id INTEGER,
        review_text TEXT(65535),
        rating TINYINT,
        PRIMARY KEY(review_id),
        FOREIGN KEY(client_id) REFERENCES clients(client_id),
        FOREIGN KEY(car_id) REFERENCES cars(car_id)
      )
    `);
    console.log('Created reviews table');

    // Copy data from Отзыв to reviews
    await connection.query(`
      INSERT INTO reviews (review_id, client_id, car_id, review_text, rating)
      SELECT id_Отзыв, client_id, car_id, Отзыв, Оценка 
      FROM \`Отзыв\`
    `);
    console.log('Copied data from Отзыв to reviews');

    // Create indexes
    await connection.query('CREATE INDEX idx_user_email ON users(email)');
    await connection.query('CREATE INDEX idx_car_brand ON cars(brand_id)');
    await connection.query('CREATE INDEX idx_orders_dates ON orders(issue_date, return_date)');
    await connection.query('CREATE INDEX idx_orders_status ON orders(status_id)');
    await connection.query('CREATE INDEX idx_reviews_car ON reviews(car_id)');
    console.log('Created indexes');

    // Commit transaction
    await connection.commit();
    console.log('Transaction committed successfully');
    console.log('Database migration completed successfully');

  } catch (error) {
    console.error('Error during database migration:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back due to error');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// If this file is executed directly, run the migration
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrateDatabase().catch(console.error);
}

export default migrateDatabase; 
import pool from '../config/database.js';
import path from 'path';
import fs from 'fs/promises';

// Get all cars with filter options
export const getAllCars = async (req, res) => {
  try {
    const { 
      brand, 
      model, 
      status, 
      color,
      year_from, 
      year_to,
      price_from,
      price_to,
      transmission,
      fuel
    } = req.query;

    let query = `
      SELECT 
        c.car_id as id,
        c.brand_id as brand,
        c.model_id as model,
        c.fuel_type_id as fuel_type,
        c.transmission_id as transmission,
        c.color_id as color,
        c.price,
        c.mileage,
        c.description,
        c.year,
        c.status,
        c.vin,
        c.license_plate,
        b.name as brand_name,
        m.name as model_name,
        cl.name as color_name,
        t.name as transmission_name,
        f.name as fuel_name
      FROM cars c
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN models m ON c.model_id = m.id
      LEFT JOIN colors cl ON c.color_id = cl.id
      LEFT JOIN transmission_types t ON c.transmission_id = t.id
      LEFT JOIN fuel_types f ON c.fuel_type_id = f.id
      WHERE 1=1
    `;

    const params = [];

    // Add filters to query
    if (brand) {
      query += ` AND b.name LIKE ?`;
      params.push(`%${brand}%`);
    }

    if (model) {
      query += ` AND m.name LIKE ?`;
      params.push(`%${model}%`);
    }

    if (status) {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (color) {
      query += ` AND cl.name LIKE ?`;
      params.push(`%${color}%`);
    }

    if (year_from) {
      query += ` AND c.year >= ?`;
      params.push(parseInt(year_from));
    }

    if (year_to) {
      query += ` AND c.year <= ?`;
      params.push(parseInt(year_to));
    }

    if (price_from) {
      query += ` AND c.price >= ?`;
      params.push(parseInt(price_from));
    }

    if (price_to) {
      query += ` AND c.price <= ?`;
      params.push(parseInt(price_to));
    }

    if (transmission) {
      query += ` AND t.name = ?`;
      params.push(transmission);
    }

    if (fuel) {
      query += ` AND f.name = ?`;
      params.push(fuel);
    }

    // Execute query
    const [cars] = await pool.query(query, params);

    // Преобразуем данные для фронтенда
    const formattedCars = cars.map(car => ({
      id: car.id,
      brand: car.brand,
      brand_name: car.brand_name,
      model: car.model,
      model_name: car.model_name,
      year: car.year,
      color: car.color,
      color_name: car.color_name,
      price: car.price,
      mileage: car.mileage,
      status: car.status,
      description: car.description,
      fuel_type: car.fuel_type,
      fuel_type_name: car.fuel_name,
      transmission: car.transmission,
      transmission_name: car.transmission_name,
      vin: car.vin,
      license_plate: car.license_plate
    }));

    res.json(formattedCars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка автомобилей',
      error: error.message 
    });
  }
};

// Get car by ID
export const getCarById = async (req, res) => {
  try {
    const carId = req.params.id;
    
    const [cars] = await pool.query(
      `SELECT 
        c.car_id,
        c.brand_id,
        c.model_id,
        c.fuel_type_id,
        c.transmission_id,
        c.color_id,
        c.price,
        c.mileage,
        c.description,
        c.year,
        c.status,
        c.vin,
        c.license_plate,
        b.name as brand_name,
        m.name as model_name,
        cl.name as color_name,
        t.name as transmission_name,
        f.name as fuel_name
       FROM cars c
       LEFT JOIN brands b ON c.brand_id = b.id
       LEFT JOIN models m ON c.model_id = m.id
       LEFT JOIN colors cl ON c.color_id = cl.id
       LEFT JOIN transmission_types t ON c.transmission_id = t.id
       LEFT JOIN fuel_types f ON c.fuel_type_id = f.id
       WHERE c.car_id = ?`,
      [carId]
    );
    
    if (cars.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }
    
    res.json(cars[0]);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении данных автомобиля',
      error: error.message 
    });
  }
};

// Create new car
export const createCar = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      brand,
      model,
      year,
      color,
      price,
      mileage,
      status,
      description,
      fuel_type,
      transmission
    } = req.body;

    // Validate required fields
    const requiredFields = { brand, model, year, color, price, fuel_type, transmission };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value && value !== '0' && value !== 0)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      // Delete uploaded files if validation fails
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const filePath = path.join(process.cwd(), file.path);
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(`Failed to delete file: ${err.message}`);
          }
        }
      }

      await connection.rollback();
      connection.release();
      return res.status(400).json({
        message: `Необходимо заполнить обязательные поля: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Create car
    const [result] = await connection.query(
      'INSERT INTO cars SET ?',
      {
        brand_id: parseInt(brand),
        model_id: parseInt(model),
        year: parseInt(year),
        color_id: parseInt(color),
        price: parseFloat(price),
        mileage: mileage ? parseInt(mileage) : 0,
        status,
        description: description || null,
        fuel_type_id: parseInt(fuel_type),
        transmission_id: parseInt(transmission),
        vin: req.body.vin || null,
        license_plate: req.body.license_plate || null
      }
    );

    const carId = result.insertId;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageInsertPromises = req.files.map((file, index) => {
        // Generate a unique filename to prevent duplicates
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const newFilename = `car-${carId}-${uniqueSuffix}${path.extname(file.originalname)}`;
        const imageUrl = `/uploads/cars/${newFilename}`;
        const isPrimary = index === 0;
        
        // Rename the uploaded file to the new unique name
        const oldPath = file.path;
        const newPath = path.join(process.cwd(), 'uploads', 'cars', newFilename);
        
        return fs.rename(oldPath, newPath)
          .then(() => connection.query(
            'INSERT INTO car_images (car_id, image_url, is_primary) VALUES (?, ?, ?)',
            [carId, imageUrl, isPrimary]
          ));
      });
      
      await Promise.all(imageInsertPromises);
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Автомобиль успешно создан',
      carId,
      success: true
    });
  } catch (error) {
    console.error('Error creating car:', error);
    
    // Delete uploaded files if there's an error
    if (req.files && req.files.length > 0) {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      for (const file of req.files) {
        try {
          const filePath = path.join(process.cwd(), file.path);
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`Failed to delete file: ${err.message}`);
        }
      }
    }

    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({
      message: 'Ошибка при создании автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Update car
export const updateCar = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const carId = req.params.id;
    console.log('Updating car:', { carId, body: req.body, files: req.files?.length });
    
    const {
      brand,
      model,
      year,
      color,
      price,
      mileage,
      status,
      description,
      fuel_type,
      transmission
    } = req.body;

    // Parse imagesToDelete if present
    let imagesToDelete = [];
    if (req.body.imagesToDelete) {
      try {
        console.log('Original imagesToDelete:', req.body.imagesToDelete);
        
        if (typeof req.body.imagesToDelete === 'string') {
          imagesToDelete = JSON.parse(req.body.imagesToDelete);
        } else if (Array.isArray(req.body.imagesToDelete)) {
          imagesToDelete = req.body.imagesToDelete;
        }
        
        console.log('Parsed imagesToDelete:', imagesToDelete);
      } catch (error) {
        console.error('Error parsing imagesToDelete:', error);
      }
    }

    // Delete selected images if any
    if (imagesToDelete && Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
      console.log('Deleting images:', imagesToDelete);
      
      // Get current images count
      const [currentImages] = await connection.query(
        'SELECT COUNT(*) as count FROM car_images WHERE car_id = ?',
        [carId]
      );
      
      console.log('Current images count:', currentImages[0].count);

      // Check if we're not deleting all images when no new ones are uploaded
      if (currentImages[0].count === imagesToDelete.length && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
          message: 'Необходимо оставить хотя бы одно изображение автомобиля',
          success: false
        });
      }

      try {
        // Get image URLs before deletion
        let imagesToRemove;
        if (imagesToDelete.length === 1) {
          // Используем = вместо IN для одного значения
          [imagesToRemove] = await connection.query(
            'SELECT image_url FROM car_images WHERE car_id = ? AND image_id = ?',
            [carId, imagesToDelete[0]]
          );
        } else {
          // Используем IN для нескольких значений
          [imagesToRemove] = await connection.query(
            'SELECT image_url FROM car_images WHERE car_id = ? AND image_id IN (?)',
            [carId, imagesToDelete]
          );
        }
        
        console.log('Images to remove:', imagesToRemove);

        // Delete images from database
        if (imagesToDelete.length === 1) {
          // Используем = вместо IN для одного значения
          await connection.query(
            'DELETE FROM car_images WHERE car_id = ? AND image_id = ?',
            [carId, imagesToDelete[0]]
          );
        } else {
          // Используем IN для нескольких значений
          await connection.query(
            'DELETE FROM car_images WHERE car_id = ? AND image_id IN (?)',
            [carId, imagesToDelete]
          );
        }

        // Delete image files from disk
        const fs = await import('fs/promises');
        const path = await import('path');
        
        for (const image of imagesToRemove) {
          try {
            const filePath = path.join(process.cwd(), image.image_url.replace(/^\//, ''));
            console.log('Deleting file:', filePath);
            await fs.unlink(filePath);
          } catch (err) {
            console.warn(`Failed to delete image file: ${err.message}`);
          }
        }
      } catch (err) {
        console.error('Error during image deletion:', err);
      }
    }

    // Update car data
    const updateData = {
      brand_id: parseInt(brand),
      model_id: parseInt(model),
      year: parseInt(year),
      color_id: parseInt(color),
      price: parseFloat(price),
      mileage: mileage ? parseInt(mileage) : 0,
      status,
      description: description || null,
      fuel_type_id: parseInt(fuel_type),
      transmission_id: parseInt(transmission),
      vin: req.body.vin || null,
      license_plate: req.body.license_plate || null
    };

    await connection.query(
      'UPDATE cars SET ? WHERE car_id = ?',
      [updateData, carId]
    );

    // Add new images if any
    if (req.files && req.files.length > 0) {
      console.log('Adding new images:', req.files.length);

      const [currentImages] = await connection.query(
        'SELECT COUNT(*) as count FROM car_images WHERE car_id = ?',
        [carId]
      );

      // Create promises for each image upload
      const imageInsertPromises = req.files.map((file, index) => {
        // Generate a unique filename to prevent duplicates
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const newFilename = `car-${carId}-${uniqueSuffix}${path.extname(file.originalname)}`;
        const imageUrl = `/uploads/cars/${newFilename}`;
        const isPrimary = currentImages[0].count === 0 && index === 0;
        
        // Rename the uploaded file to the new unique name
        const oldPath = file.path;
        const newPath = path.join(process.cwd(), 'uploads', 'cars', newFilename);
        
        console.log('Renaming file:', { oldPath, newPath });
        
        return fs.rename(oldPath, newPath)
          .then(() => {
            console.log('File renamed, inserting into DB:', imageUrl);
            return connection.query(
              'INSERT INTO car_images (car_id, image_url, is_primary) VALUES (?, ?, ?)',
              [carId, imageUrl, isPrimary]
            );
          });
      });
      
      await Promise.all(imageInsertPromises);
    }

    await connection.commit();
    connection.release();

    res.json({
      message: 'Данные автомобиля успешно обновлены',
      success: true
    });
  } catch (error) {
    console.error('Error updating car:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({
      message: 'Ошибка при обновлении данных автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Delete car
export const deleteCar = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const carId = req.params.id;

    // Get all images for this car BEFORE deleting the car
    const [images] = await connection.query(
      'SELECT image_url FROM car_images WHERE car_id = ?',
      [carId]
    );

    // Delete car (this will also delete related images due to ON DELETE CASCADE)
    await connection.query('DELETE FROM cars WHERE car_id = ?', [carId]);

    // Delete image files from disk
    const fs = await import('fs/promises');
    const path = await import('path');
    
    for (const image of images) {
      try {
        // Remove leading slash from image_url to get correct path
        const filePath = path.join(process.cwd(), image.image_url.replace(/^\//, ''));
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`Failed to delete image file: ${err.message}`);
      }
    }

    await connection.commit();
    connection.release();

    res.json({
      message: 'Автомобиль успешно удален',
      success: true
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({
      message: 'Ошибка при удалении автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Ensure all required car statuses exist
const ensureCarStatuses = async (connection) => {
  const requiredStatuses = ['available', 'rented', 'maintenance'];
  
  for (const status of requiredStatuses) {
    const [existingStatus] = await connection.query(
      'SELECT status_id FROM statuses WHERE status_name = ?',
      [status]
    );
    
    if (existingStatus.length === 0) {
      await connection.query(
        'INSERT INTO statuses (status_name) VALUES (?)',
        [status]
      );
    }
  }
};

// Update car status
export const updateCarStatus = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const carId = req.params.id;
    const { status } = req.body;

    console.log('Updating car status:', { carId, status });
    
    // Validate status
    const validStatuses = ['available', 'maintenance', 'sold'];
    if (!validStatuses.includes(status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ 
        message: 'Некорректный статус. Допустимые значения: available, maintenance, sold',
        success: false 
      });
    }

    // Check if car exists
    const [checkCar] = await connection.query('SELECT car_id FROM cars WHERE car_id = ?', [carId]);
    if (checkCar.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    // Update car status
    await connection.query(
      'UPDATE cars SET status = ? WHERE car_id = ?',
      [status, carId]
    );

    await connection.commit();
    connection.release();

    res.json({
      message: 'Статус автомобиля успешно обновлен',
      success: true
    });
  } catch (error) {
    console.error('Error updating car status:', error);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    res.status(500).json({
      message: 'Ошибка при обновлении статуса автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Get car statuses
export const getCarStatuses = async (req, res) => {
  try {
    const statuses = [
      { value: 'available', label: 'Доступен' },
      { value: 'maintenance', label: 'На обслуживании' },
      { value: 'sold', label: 'Продан' }
    ];
    
    res.json(statuses);
  } catch (error) {
    console.error('Error getting car statuses:', error);
    res.status(500).json({
      message: 'Ошибка при получении статусов автомобиля',
      error: error.message
    });
  }
};

// Get filter options (brands, models, colors, etc.)
export const getFilterOptions = async (req, res) => {
  try {
    // Get all brands, models, colors, etc.
    const [brands] = await pool.query('SELECT id, name FROM brands');
    const [models] = await pool.query('SELECT id, brand_id, name FROM models');
    const [colors] = await pool.query('SELECT id, name FROM colors');
    const [fuels] = await pool.query('SELECT id, name FROM fuel_types');
    const [transmissions] = await pool.query('SELECT id, name FROM transmission_types');
    
    // Get years and prices min/max from existing cars
    const [years] = await pool.query(`
      SELECT MIN(year) as min_year, MAX(year) as max_year FROM cars
    `);
    
    const [prices] = await pool.query(`
      SELECT MIN(price) as min_price, MAX(price) as max_price FROM cars
    `);
    
    res.json({
      brands,
      models,
      colors,
      fuels,
      transmissions,
      years: {
        min: years[0].min_year || new Date().getFullYear() - 10,
        max: years[0].max_year || new Date().getFullYear()
      },
      prices: {
        min: prices[0].min_price || 0,
        max: prices[0].max_price || 5000
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении параметров фильтрации',
      error: error.message 
    });
  }
};

// Get car images
export const getCarImages = async (req, res) => {
  try {
    const carId = req.params.id;
    
    // Check if car exists
    const [checkCar] = await pool.query('SELECT car_id FROM cars WHERE car_id = ?', [carId]);
    if (checkCar.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }
    
    // Get car images
    const [images] = await pool.query(
      'SELECT image_id as id, image_url, is_primary FROM car_images WHERE car_id = ? ORDER BY is_primary DESC',
      [carId]
    );
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching car images:', error);
    res.status(500).json({
      message: 'Ошибка при получении изображений автомобиля',
      error: error.message
    });
  }
}; 
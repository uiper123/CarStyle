import pool from '../config/database.js';

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
      SELECT c.car_id, c.price, c.mileage, c.description, c.year, c.status,
             b.name as brand_name, m.name as model_name, cl.name as color_name, 
             t.name as transmission_name, f.name as fuel_name
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

    res.json(cars);
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
      `SELECT c.car_id, c.price, c.mileage, c.description, c.year, c.status,
              b.name as brand_name, m.name as model_name, cl.name as color_name, 
              t.name as transmission_name, f.name as fuel_name
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
  try {
    const { 
      brand_id, 
      model_id, 
      fuel_id, 
      transmission_id, 
      color_id, 
      production_year,
      price_per_day,
      description,
      license_plate
    } = req.body;
    
    // Validate required fields
    if (!brand_id || !model_id || !production_year || !price_per_day || !license_plate) {
      return res.status(400).json({ 
        message: 'Необходимо заполнить все обязательные поля',
        success: false 
      });
    }
    
    // Create new car
    const [result] = await pool.query(
      `INSERT INTO cars (
        brand_id, model_id, fuel_id, transmission_id, color_id, 
        production_year, price_per_day, description, license_plate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brand_id, model_id, fuel_id, transmission_id, color_id, 
        production_year, price_per_day, description, license_plate
      ]
    );
    
    const carId = result.insertId;
    
    res.status(201).json({
      message: 'Автомобиль успешно создан',
      success: true,
      car: {
        car_id: carId,
        brand_id, 
        model_id, 
        fuel_id, 
        transmission_id, 
        color_id, 
        production_year,
        price_per_day,
        description,
        license_plate
      }
    });
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ 
      message: 'Ошибка при создании автомобиля',
      error: error.message,
      success: false 
    });
  }
};

// Update car
export const updateCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const { 
      brand_id, 
      model_id, 
      fuel_id, 
      transmission_id, 
      color_id, 
      production_year,
      price_per_day,
      description,
      license_plate
    } = req.body;
    
    // Check if car exists
    const [checkCar] = await pool.query('SELECT car_id FROM cars WHERE car_id = ?', [carId]);
    if (checkCar.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }
    
    // Update car data
    await pool.query(
      `UPDATE cars SET 
         brand_id = ?, 
         model_id = ?, 
         fuel_id = ?, 
         transmission_id = ?, 
         color_id = ?, 
         production_year = ?,
         price_per_day = ?,
         description = ?,
         license_plate = ?
       WHERE car_id = ?`,
      [
        brand_id, model_id, fuel_id, transmission_id, color_id, 
        production_year, price_per_day, description, license_plate, carId
      ]
    );
    
    res.json({ 
      message: 'Данные автомобиля успешно обновлены', 
      success: true 
    });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении данных автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Delete car
export const deleteCar = async (req, res) => {
  try {
    const carId = req.params.id;
    
    // Check if car exists
    const [checkCar] = await pool.query('SELECT car_id FROM cars WHERE car_id = ?', [carId]);
    if (checkCar.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }
    
    // Check if car is in active orders
    const [activeOrders] = await pool.query(
      `SELECT order_id FROM orders 
       WHERE car_id = ? 
       AND status_id IN (SELECT status_id FROM statuses WHERE status_name IN ('pending', 'active', 'rented'))
       AND return_date >= CURDATE()`,
      [carId]
    );
    
    if (activeOrders.length > 0) {
      return res.status(400).json({ 
        message: 'Невозможно удалить автомобиль, который используется в активных заказах',
        success: false
      });
    }
    
    // Delete car
    await pool.query('DELETE FROM cars WHERE car_id = ?', [carId]);
    
    res.json({ 
      message: 'Автомобиль успешно удален', 
      success: true 
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ 
      message: 'Ошибка при удалении автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Update car status (maintenance or available)
export const updateCarStatus = async (req, res) => {
  try {
    const carId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    if (status !== 'maintenance' && status !== 'available') {
      return res.status(400).json({ 
        message: 'Некорректный статус. Допустимые значения: maintenance, available', 
        success: false 
      });
    }
    
    // Check if car exists
    const [checkCar] = await pool.query('SELECT car_id FROM cars WHERE car_id = ?', [carId]);
    if (checkCar.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get status ID
      const [statusResult] = await connection.query(
        'SELECT status_id FROM statuses WHERE status_name = ?',
        [status]
      );
      
      if (statusResult.length === 0) {
        // Create new status if not exists
        const [newStatus] = await connection.query(
          'INSERT INTO statuses (status_name) VALUES (?)',
          [status]
        );
        var statusId = newStatus.insertId;
      } else {
        var statusId = statusResult[0].status_id;
      }
      
      // If setting to maintenance, create a maintenance "order"
      if (status === 'maintenance') {
        // Check if there's already a maintenance order
        const [existingMaintenance] = await connection.query(
          `SELECT order_id FROM orders 
           WHERE car_id = ? 
           AND status_id = ? 
           AND return_date >= CURDATE()`,
          [carId, statusId]
        );
        
        if (existingMaintenance.length === 0) {
          // Create a new maintenance record
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          
          await connection.query(
            `INSERT INTO orders (car_id, status_id, issue_date, return_date, price) 
             VALUES (?, ?, CURDATE(), ?, 0)`,
            [carId, statusId, nextMonth.toISOString().split('T')[0]]
          );
        }
      } 
      // If setting to available, end any maintenance orders
      else if (status === 'available') {
        // Get available status ID
        const [availableStatus] = await connection.query(
          'SELECT status_id FROM statuses WHERE status_name = "available"'
        );
        
        if (availableStatus.length > 0) {
          // Update any maintenance orders to be completed
          await connection.query(
            `UPDATE orders 
             SET return_date = CURDATE(), status_id = ? 
             WHERE car_id = ? 
             AND status_id = (SELECT status_id FROM statuses WHERE status_name = 'maintenance')
             AND return_date > CURDATE()`,
            [availableStatus[0].status_id, carId]
          );
        }
      }
      
      await connection.commit();
      res.json({ 
        message: `Статус автомобиля успешно изменен на "${status}"`, 
        success: true 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating car status:', error);
    res.status(500).json({ 
      message: 'Ошибка при обновлении статуса автомобиля',
      error: error.message,
      success: false
    });
  }
};

// Get car status options
export const getCarStatuses = async (req, res) => {
  try {
    const [statuses] = await pool.query('SELECT status_id, status_name FROM statuses');
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching car statuses:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка статусов автомобилей',
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
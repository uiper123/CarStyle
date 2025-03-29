import pool from '../config/database.js';

// Get all available cars for public catalog
export const getPublicCars = async (req, res) => {
  try {
    const { 
      brand, 
      model, 
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
      WHERE c.status = 'available'
    `;

    const params = [];

    // Add filters to query
    if (brand) {
      query += ` AND c.brand_id = ?`;
      params.push(brand);
    }

    if (model) {
      query += ` AND c.model_id = ?`;
      params.push(model);
    }

    if (color) {
      query += ` AND c.color_id = ?`;
      params.push(color);
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

    // Get images for each car
    const carsWithImages = await Promise.all(
      cars.map(async (car) => {
        const [images] = await pool.query(
          'SELECT * FROM car_images WHERE car_id = ?',
          [car.id]
        );
        return {
          ...car,
          images: images
        };
      })
    );

    res.json(carsWithImages);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении списка автомобилей',
      error: error.message 
    });
  }
};

// Get public car details by ID
export const getPublicCarById = async (req, res) => {
  try {
    const carId = req.params.id;
    
    const [cars] = await pool.query(
      `SELECT 
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
       WHERE c.car_id = ? AND c.status = 'available'`,
      [carId]
    );
    
    if (cars.length === 0) {
      return res.status(404).json({ message: 'Автомобиль не найден' });
    }

    // Get car images
    const [images] = await pool.query(
      'SELECT * FROM car_images WHERE car_id = ?',
      [carId]
    );
    
    res.json({
      ...cars[0],
      images: images
    });
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении данных автомобиля',
      error: error.message 
    });
  }
};

// Get public filter options
export const getPublicFilterOptions = async (req, res) => {
  try {
    // Get all brands, models, colors, etc.
    const [brands] = await pool.query('SELECT id, name FROM brands');
    const [models] = await pool.query('SELECT id, brand_id, name FROM models');
    const [colors] = await pool.query('SELECT id, name FROM colors');
    const [fuels] = await pool.query('SELECT id, name FROM fuel_types');
    const [transmissions] = await pool.query('SELECT id, name FROM transmission_types');
    
    // Get years and prices min/max from available cars
    const [years] = await pool.query(`
      SELECT MIN(year) as min_year, MAX(year) as max_year 
      FROM cars 
      WHERE status = 'available'
    `);
    
    const [prices] = await pool.query(`
      SELECT MIN(price) as min_price, MAX(price) as max_price 
      FROM cars 
      WHERE status = 'available'
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
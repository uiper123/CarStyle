import pool from '../config/database.js';

// Проверка доступности автомобиля на выбранные даты
export const checkCarAvailability = async (req, res) => {
  try {
    const { carId } = req.params;
    const { startDate, endDate } = req.body;

    // Преобразуем даты в формат MySQL (YYYY-MM-DD)
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    // Проверяем, нет ли пересекающихся заказов
    const [existingOrders] = await pool.query(
      `SELECT o.order_id, s.status_name, o.issue_date, o.return_date 
       FROM orders o
       JOIN statuses s ON o.status_id = s.status_id
       WHERE o.car_id = ? 
       AND s.status_name IN ('pending', 'active', 'rented')
       AND (
         (o.issue_date <= ? AND o.return_date >= ?) OR
         (o.issue_date <= ? AND o.return_date >= ?) OR
         (o.issue_date >= ? AND o.return_date <= ?)
       )`,
      [carId, formattedEndDate, formattedStartDate, formattedEndDate, formattedEndDate, formattedStartDate, formattedEndDate]
    );

    if (existingOrders.length > 0) {
      const order = existingOrders[0];
      return res.json({
        available: false,
        message: `Автомобиль уже забронирован на эти даты (${order.status_name})`,
        conflictingOrder: {
          id: order.order_id,
          status: order.status_name,
          issueDate: order.issue_date,
          returnDate: order.return_date
        }
      });
    }

    res.json({
      available: true,
      message: 'Автомобиль доступен на выбранные даты'
    });
  } catch (error) {
    console.error('Error checking car availability:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке доступности автомобиля',
      error: error.message
    });
  }
};

// Создание нового заказа
export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      car_id,
      issue_date,
      return_date,
      price,
      additional_services,
      client_info
    } = req.body;

    // Преобразуем даты в формат MySQL (YYYY-MM-DD)
    const formattedIssueDate = new Date(issue_date).toISOString().split('T')[0];
    const formattedReturnDate = new Date(return_date).toISOString().split('T')[0];

    // Получаем ID клиента из токена
    const userId = req.user.id;

    // Проверяем, существует ли клиент
    const [client] = await connection.query(
      'SELECT client_id FROM clients WHERE client_id = ?',
      [userId]
    );

    if (client.length === 0) {
      // Создаем запись клиента, если её нет
      await connection.query(
        `INSERT INTO clients (client_id, driver_license, status) 
         VALUES (?, ?, true)`,
        [userId, client_info.driver_license]
      );
    }

    // Получаем ID статуса "pending"
    const [statusResult] = await connection.query(
      'SELECT status_id FROM statuses WHERE status_name = "pending"'
    );

    if (statusResult.length === 0) {
      // Создаем статус, если его нет
      const [newStatus] = await connection.query(
        'INSERT INTO statuses (status_name) VALUES ("pending")'
      );
      var statusId = newStatus.insertId;
    } else {
      var statusId = statusResult[0].status_id;
    }

    // Создаем заказ
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        car_id, 
        client_id, 
        status_id, 
        issue_date, 
        return_date, 
        price
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        car_id, 
        userId, 
        statusId, 
        formattedIssueDate, 
        formattedReturnDate, 
        price
      ]
    );

    // Сохраняем дополнительные услуги
    if (Object.values(additional_services).some(value => value)) {
      await connection.query(
        `INSERT INTO order_services (
          order_id, 
          insurance, 
          child_seat, 
          gps, 
          additional_driver
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          orderResult.insertId,
          additional_services.insurance,
          additional_services.childSeat,
          additional_services.gps,
          additional_services.additionalDriver
        ]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Заказ успешно создан',
      orderId: orderResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании заказа',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Получение всех заказов (для администратора)
export const getAllOrders = async (req, res) => {
  try {
    // First, check if the responsible columns exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'orders' 
      AND COLUMN_NAME IN ('responsible_id', 'responsible_type')
    `);

    const hasResponsibleColumns = columns.length === 2;

    let query = `
      SELECT 
        o.order_id,
        o.issue_date,
        o.return_date,
        o.price,
        s.status_name,
        c.client_id,
        u.firstname,
        u.lastname,
        u.phone,
        u.email,
        car.car_id,
        car.vin,
        car.license_plate,
        car.mileage,
        car.description,
        car.year,
        car.price as car_price,
        car.status as car_status,
        b.name as brand_name,
        m.name as model_name,
        cl.name as color_name,
        t.name as transmission_name,
        f.name as fuel_name,
        os.insurance,
        os.child_seat,
        os.gps,
        os.additional_driver
    `;

    if (hasResponsibleColumns) {
      query += `,
        COALESCE(e.employee_id, req.id) as responsible_id,
        COALESCE(eu.firstname, req.firstname) as responsible_firstname,
        COALESCE(eu.lastname, req.lastname) as responsible_lastname,
        CASE 
          WHEN e.employee_id IS NOT NULL THEN 'Сотрудник'
          WHEN req.role = 'admin' THEN 'Администратор'
          ELSE 'Сотрудник'
        END as responsible_position,
        COALESCE(eu.phone, req.phone) as responsible_phone,
        COALESCE(eu.email, req.email) as responsible_email,
        CASE 
          WHEN e.employee_id IS NOT NULL THEN 'employee'
          ELSE req.role
        END as responsible_type
      FROM orders o
      LEFT JOIN statuses s ON o.status_id = s.status_id
      LEFT JOIN clients c ON o.client_id = c.client_id
      LEFT JOIN users u ON c.client_id = u.user_id
      LEFT JOIN cars car ON o.car_id = car.car_id
      LEFT JOIN brands b ON car.brand_id = b.id
      LEFT JOIN models m ON car.model_id = m.id
      LEFT JOIN colors cl ON car.color_id = cl.id
      LEFT JOIN transmission_types t ON car.transmission_id = t.id
      LEFT JOIN fuel_types f ON car.fuel_type_id = f.id
      LEFT JOIN order_services os ON o.order_id = os.order_id
      LEFT JOIN employees e ON o.responsible_id = e.employee_id AND o.responsible_type = 'employee'
      LEFT JOIN users eu ON e.employee_id = eu.user_id
      CROSS JOIN (SELECT ? as id, ? as firstname, ? as lastname, ? as role, ? as phone, ? as email) as req`;
    } else {
      query += `,
        req.id as responsible_id,
        req.firstname as responsible_firstname,
        req.lastname as responsible_lastname,
        CASE 
          WHEN req.role = 'admin' THEN 'Администратор'
          ELSE 'Сотрудник'
        END as responsible_position,
        req.phone as responsible_phone,
        req.email as responsible_email,
        req.role as responsible_type
      FROM orders o
      LEFT JOIN statuses s ON o.status_id = s.status_id
      LEFT JOIN clients c ON o.client_id = c.client_id
      LEFT JOIN users u ON c.client_id = u.user_id
      LEFT JOIN cars car ON o.car_id = car.car_id
      LEFT JOIN brands b ON car.brand_id = b.id
      LEFT JOIN models m ON car.model_id = m.id
      LEFT JOIN colors cl ON car.color_id = cl.id
      LEFT JOIN transmission_types t ON car.transmission_id = t.id
      LEFT JOIN fuel_types f ON car.fuel_type_id = f.id
      LEFT JOIN order_services os ON o.order_id = os.order_id
      CROSS JOIN (SELECT ? as id, ? as firstname, ? as lastname, ? as role, ? as phone, ? as email) as req`;
    }

    query += ` ORDER BY o.order_id DESC`;

    const [orders] = await pool.query(query, [
      req.user.id,
      req.user.firstname,
      req.user.lastname,
      req.user.role,
      req.user.phone,
      req.user.email
    ]);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка заказов',
      error: error.message
    });
  }
};

// Обновление статуса заказа
export const updateOrderStatus = async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;
  let lastError = null;
  
  while (retryCount < maxRetries) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Set transaction timeout to 3 seconds
      await connection.query('SET SESSION innodb_lock_wait_timeout = 3');

      const orderId = req.params.orderId;
      const { status } = req.body;

      console.log('Updating order status:', { orderId, status });

      // Validate status
      const validStatuses = ['pending', 'active', 'rented', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Некорректный статус. Допустимые значения: pending, active, rented, completed, cancelled'
        });
      }

      // Check if order exists with a shorter lock time
      const [order] = await connection.query(
        'SELECT * FROM orders WHERE order_id = ? FOR UPDATE SKIP LOCKED',
        [orderId]
      );

      console.log('Found order:', order);

      if (order.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Get status ID
      const [statusResult] = await connection.query(
        'SELECT status_id FROM statuses WHERE status_name = ?',
        [status]
      );

      let statusId;
      if (statusResult.length === 0) {
        // Create status if it doesn't exist
        const [newStatus] = await connection.query(
          'INSERT INTO statuses (status_name) VALUES (?)',
          [status]
        );
        statusId = newStatus.insertId;
      } else {
        statusId = statusResult[0].status_id;
      }

      // Update order status
      await connection.query(
        'UPDATE orders SET status_id = ? WHERE order_id = ?',
        [statusId, orderId]
      );

      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: 'Статус заказа успешно обновлен'
      });
      
      // If we get here, the transaction was successful
      break;
      
    } catch (error) {
      await connection.rollback();
      connection.release();
      
      lastError = error;
      
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} for order ${req.params.orderId}`);
        
        // Exponential backoff: wait longer between each retry
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении статуса заказа',
        error: error.message,
        retries: retryCount
      });
      break;
    }
  }
};

// Удаление заказа
export const deleteOrder = async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Set transaction timeout to 5 seconds
      await connection.query('SET SESSION innodb_lock_wait_timeout = 5');

      const { orderId } = req.params;

      // Проверяем, существует ли заказ
      const [order] = await connection.query(
        `SELECT o.status_id, s.status_name 
         FROM orders o
         JOIN statuses s ON o.status_id = s.status_id
         WHERE o.order_id = ? FOR UPDATE`,
        [orderId]
      );

      if (order.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Заказ не найден'
        });
      }

      // Проверяем, не является ли заказ активным
      if (order[0].status_name === 'active' || order[0].status_name === 'rented') {
        return res.status(400).json({
          success: false,
          message: 'Невозможно удалить активный заказ'
        });
      }

      // Удаляем дополнительные услуги
      await connection.query(
        'DELETE FROM order_services WHERE order_id = ?',
        [orderId]
      );

      // Удаляем заказ
      await connection.query(
        'DELETE FROM orders WHERE order_id = ?',
        [orderId]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Заказ успешно удален'
      });
      
      // If we get here, the transaction was successful
      break;
      
    } catch (error) {
      await connection.rollback();
      
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retry attempt ${retryCount} for deleting order ${req.params.orderId}`);
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      console.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении заказа',
        error: error.message
      });
      break;
    } finally {
      connection.release();
    }
  }
};

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                o.*,
                b.name as brand_name,
                m.name as model_name,
                car.year,
                s.status_name,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM orders o2 
                        JOIN statuses s2 ON o2.status_id = s2.status_id
                        WHERE o2.car_id = car.car_id 
                        AND s2.status_name IN ('active', 'rented')
                        AND o2.order_id != o.order_id
                    ) THEN 'rented'
                    WHEN s.status_name = 'pending' THEN 'pending'
                    ELSE s.status_name
                END as car_status,
                ROW_NUMBER() OVER (ORDER BY o.order_id DESC) as user_order_number
            FROM orders o
            JOIN cars car ON o.car_id = car.car_id
            JOIN brands b ON car.brand_id = b.id
            JOIN models m ON car.model_id = m.id
            JOIN statuses s ON o.status_id = s.status_id
            WHERE o.client_id = ?
            ORDER BY o.order_id DESC
        `;

        const [orders] = await pool.query(query, [userId]);

        res.json({
            success: true,
            orders: orders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении заказов',
            error: error.message
        });
    }
}; 
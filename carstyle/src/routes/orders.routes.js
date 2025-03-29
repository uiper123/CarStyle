import express from 'express';
import { 
  checkCarAvailability, 
  createOrder, 
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getUserOrders
} from '../controllers/orders.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { isAdmin, isAdminOrEmployee } from '../middleware/admin.middleware.js';

const router = express.Router();

// Проверка доступности автомобиля
router.post('/cars/:carId/check-availability', authMiddleware, checkCarAvailability);

// Создание нового заказа
router.post('/', authMiddleware, createOrder);

// Получение всех заказов (для администратора и сотрудника)
router.get('/', authMiddleware, isAdminOrEmployee, getAllOrders);

// Получение заказов пользователя
router.get('/user', authMiddleware, getUserOrders);

// Обновление статуса заказа
router.put('/:orderId/status', authMiddleware, isAdminOrEmployee, updateOrderStatus);

// Удаление заказа
router.delete('/:orderId', authMiddleware, isAdminOrEmployee, deleteOrder);

export default router; 
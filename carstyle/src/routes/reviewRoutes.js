import express from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { isAdminOrEmployee } from '../middleware/admin.middleware.js';
import pool from '../config/database.js';

const router = express.Router();

// Get all reviews (general and car-specific)
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        r.car_id,
        r.user_id,
        u.firstname,
        u.lastname,
        u.avatar_url,
        u.role as user_role,
        c.brand_id,
        c.model_id,
        b.name as car_brand,
        m.name as car_model,
        c.year as car_year,
        COUNT(DISTINCT rl.like_id) as likes_count,
        ${req.user ? `EXISTS(SELECT 1 FROM review_likes WHERE review_id = r.review_id AND user_id = ${req.user.id}) as user_liked` : 'false as user_liked'}
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN cars c ON r.car_id = c.car_id
      LEFT JOIN brands b ON c.brand_id = b.id
      LEFT JOIN models m ON c.model_id = m.id
      LEFT JOIN review_likes rl ON r.review_id = rl.review_id
      GROUP BY r.review_id
      ORDER BY r.created_at DESC
    `);
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении отзывов',
      error: error.message 
    });
  }
});

// Get reviews for a specific car
router.get('/car/:carId', optionalAuthMiddleware, async (req, res) => {
  try {
    const [reviews] = await pool.query(`
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.created_at,
        r.user_id,
        u.firstname,
        u.lastname,
        u.avatar_url,
        u.role as user_role,
        COUNT(DISTINCT rl.like_id) as likes_count,
        ${req.user ? `EXISTS(SELECT 1 FROM review_likes WHERE review_id = r.review_id AND user_id = ${req.user.id}) as user_liked` : 'false as user_liked'}
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN review_likes rl ON r.review_id = rl.review_id
      WHERE r.car_id = ?
      GROUP BY r.review_id
      ORDER BY r.created_at DESC
    `, [req.params.carId]);
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching car reviews:', error);
    res.status(500).json({ 
      message: 'Ошибка при получении отзывов об автомобиле',
      error: error.message 
    });
  }
});

// Create new review (general or car-specific)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Received review request:', req.body);
    console.log('User from auth middleware:', req.user);
    
    // Handle both carId and car_id for backward compatibility
    const { rating, comment, carId, car_id } = req.body;
    const carIdToUse = car_id || carId;
    const userId = req.user.id;

    // Validate input
    if (!rating || rating < 1 || rating > 5 || !comment) {
      console.log('Invalid input:', { rating, comment });
      return res.status(400).json({
        message: 'Необходимо указать рейтинг (от 1 до 5) и комментарий',
        success: false
      });
    }

    // If carId is provided, verify the car exists
    if (carIdToUse) {
      const [car] = await pool.query('SELECT car_id FROM cars WHERE car_id = ?', [carIdToUse]);
      if (car.length === 0) {
        console.log('Car not found:', carIdToUse);
        return res.status(404).json({
          message: 'Автомобиль не найден',
          success: false
        });
      }
    }

    // Insert new review
    console.log('Inserting review:', { userId, carId: carIdToUse, rating, comment });
    const [result] = await pool.query(
      'INSERT INTO reviews (user_id, car_id, rating, comment) VALUES (?, ?, ?, ?)',
      [userId, carIdToUse, rating, comment]
    );

    console.log('Review inserted successfully:', result);
    res.status(201).json({
      message: 'Отзыв успешно добавлен',
      success: true,
      reviewId: result.insertId
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      message: 'Ошибка при создании отзыва',
      error: error.message,
      success: false
    });
  }
});

// Like/unlike a review
router.post('/:reviewId/like', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Check if review exists
    const [review] = await pool.query('SELECT review_id FROM reviews WHERE review_id = ?', [reviewId]);
    if (review.length === 0) {
      return res.status(404).json({
        message: 'Отзыв не найден',
        success: false
      });
    }

    // Check if user already liked the review
    const [existingLike] = await pool.query(
      'SELECT like_id FROM review_likes WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (existingLike.length > 0) {
      // Unlike the review
      await pool.query(
        'DELETE FROM review_likes WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );
      return res.json({
        message: 'Лайк удален',
        success: true,
        liked: false
      });
    } else {
      // Like the review
      await pool.query(
        'INSERT INTO review_likes (review_id, user_id) VALUES (?, ?)',
        [reviewId, userId]
      );
      return res.json({
        message: 'Отзыв понравился',
        success: true,
        liked: true
      });
    }
  } catch (error) {
    console.error('Error handling review like:', error);
    res.status(500).json({
      message: 'Ошибка при обработке лайка',
      error: error.message,
      success: false
    });
  }
});

// Delete a review
router.delete('/:reviewId', authMiddleware, isAdminOrEmployee, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if review exists and get its details
    const [review] = await pool.query(
      'SELECT r.review_id, r.user_id, u.role as author_role FROM reviews r JOIN users u ON r.user_id = u.user_id WHERE r.review_id = ?',
      [reviewId]
    );

    if (review.length === 0) {
      return res.status(404).json({
        message: 'Отзыв не найден',
        success: false
      });
    }

    const reviewData = review[0];

    // Check if user has permission to delete the review
    if (userId !== reviewData.user_id) {
      // Admin can delete any review
      if (userRole === 'admin') {
        // Allow
      }
      // Employee can delete any review except admin's reviews
      else if (userRole === 'employee') {
        if (reviewData.author_role === 'admin') {
          return res.status(403).json({
            message: 'Сотрудники не могут удалять отзывы администраторов',
            success: false
          });
        }
      }
      // Regular users can only delete their own reviews
      else {
        return res.status(403).json({
          message: 'У вас нет прав для удаления этого отзыва',
          success: false
        });
      }
    }

    // Delete the review
    await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

    res.json({
      message: 'Отзыв успешно удален',
      success: true
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      message: 'Ошибка при удалении отзыва',
      error: error.message,
      success: false
    });
  }
});

export default router;
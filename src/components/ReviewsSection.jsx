// src/components/ReviewsSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaTrash, FaHeart, FaRegHeart, FaThumbsUp } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './Reviews.module.css';

const ReviewsSection = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [cars, setCars] = useState([]);
  const [likedReviews, setLikedReviews] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReviewForDelete, setSelectedReviewForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // Временно возвращаем пустой массив вместо запроса к API
        setReviews([]);
        setError(null);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Unable to load reviews at this time');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const fetchCars = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Используем публичный API для получения автомобилей вместо административного
      const response = await axios.get(`${apiUrl}/api/cars`, {
        params: {
          available: true
        }
      });

      let carsData = [];
      if (Array.isArray(response.data)) {
        carsData = response.data;
      } else if (response.data.cars && Array.isArray(response.data.cars)) {
        carsData = response.data.cars;
      }

      // Фильтруем только доступные автомобили
      const availableCars = carsData.filter(car => car.status === 'available');
      setCars(availableCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
      // Не показываем toast для этой ошибки, так как она не критична для работы компонента
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Необходимо войти в систему для добавления отзыва');
      return;
    }

    if (!comment.trim()) {
      toast.error('Пожалуйста, введите комментарий');
      return;
    }

    try {
      setIsSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(
        `${apiUrl}/api/reviews`,
        { 
          rating, 
          comment,
          car_id: selectedCar || null 
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Отзыв успешно добавлен');
      setShowForm(false);
      setComment('');
      setSelectedCar(null);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Не удалось добавить отзыв');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (review) => {
    setSelectedReviewForDelete(review);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedReviewForDelete) return;
    
    try {
      setIsDeleting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.delete(`${apiUrl}/api/reviews/${selectedReviewForDelete.review_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Отзыв успешно удален');
      setShowDeleteModal(false);
      setSelectedReviewForDelete(null);
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Не удалось удалить отзыв');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async (reviewId) => {
    if (!user) {
      toast.error('Необходимо войти в систему для оценки отзывов');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(
        `${apiUrl}/api/reviews/${reviewId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      fetchReviews();
    } catch (error) {
      console.error('Error liking review:', error);
      toast.error('Не удалось оценить отзыв');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        className={styles.star}
        color={index < rating ? "#ffd700" : "#e4e5e9"}
      />
    ));
  };

  // Helper function to check if user can delete a specific review
  const canDeleteReview = (review) => {
    if (!user) return false;
    
    // User can delete their own reviews
    if (user.id === review.user_id) return true;
    
    // Admin can delete any review
    if (user.role === 'admin') return true;
    
    // Staff can delete any review except admin's reviews
    if (user.role === 'staff' && review.user_role !== 'admin') return true;
    
    return false;
  };

  if (loading) {
    return <div className={styles.loading}>Загрузка отзывов...</div>;
  }

  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.testimonialsContainer}>
        <motion.div 
          className={styles.testimonialsHeader}
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2>Отзывы наших клиентов</h2>
          <p>Узнайте, что говорят о наших автомобилях</p>
        </motion.div>

        {user && (
          <button 
            className={styles.addReviewButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Отмена' : 'Оставить отзыв'}
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className={styles.reviewForm}>
            <select
              className={styles.commentInput}
              value={selectedCar || ''}
              onChange={(e) => setSelectedCar(e.target.value || null)}
            >
              <option value="">Общий отзыв о сервисе</option>
              {cars.map(car => (
                <option key={car.car_id} value={car.car_id}>
                  {car.brand_name} {car.model_name} ({car.year})
                </option>
              ))}
            </select>

            <div className={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`${styles.starButton} ${star <= rating ? styles.active : ''}`}
                  onClick={() => setRating(star)}
                >
                  <FaStar />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Напишите ваш отзыв..."
              className={styles.commentInput}
              required
            />

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        )}

        <div className={styles.testimonialsGrid}>
          {reviews.map((review) => (
            <motion.div 
              key={review.review_id} 
              className={styles.testimonialCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  {review.avatar_url ? (
                    <img 
                      src={review.avatar_url} 
                      alt="User avatar" 
                      className={styles.avatar}
                    />
                  ) : (
                    <FaUser className={styles.avatarIcon} />
                  )}
                  <div>
                    <div className={styles.userName}>
                      {`${review.firstname} ${review.lastname}`}
                    </div>
                    <div className={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </div>
                    {review.user_role === 'admin' && (
                      <span className={styles.adminRole}>Администратор</span>
                    )}
                    {review.user_role === 'staff' && (
                      <span className={styles.staffRole}>Сотрудник</span>
                    )}
                  </div>
                </div>
                {canDeleteReview(review) && (
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteClick(review)}
                    title="Удалить отзыв"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              {review.car_id && (
                <div className={styles.reviewCar}>
                  Отзыв о: {review.car_brand} {review.car_model} ({review.car_year})
                </div>
              )}

              <div className={styles.rating}>
                {renderStars(review.rating)}
              </div>

              <p className={styles.comment}>{review.comment}</p>

              <div className={styles.reviewActions}>
                <button
                  className={`${styles.likeButton} ${review.is_liked ? styles.liked : ''}`}
                  onClick={() => handleLike(review.review_id)}
                >
                  <FaThumbsUp />
                  <span>{review.likes_count || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showDeleteModal && (
        <div className={styles.deleteModal}>
          <div className={styles.deleteContent}>
            <h2>Подтверждение удаления</h2>
            <p className={styles.deleteDescription}>
              Вы уверены, что хотите удалить этот отзыв?
            </p>
            <button
              className={styles.confirmDeleteButton}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
            <button
              className={styles.cancelDeleteButton}
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedReviewForDelete(null);
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReviewsSection;
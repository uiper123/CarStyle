import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './Reviews.module.css';

const Reviews = () => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cars, setCars] = useState({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/reviews`);
      
      // Проверяем корректность данных
      if (response.data && Array.isArray(response.data)) {
        setReviews(response.data);
        
        // Получаем информацию об автомобилях для отзывов
        const carIds = [...new Set(response.data.filter(review => review.car_id).map(review => review.car_id))];
        const carsData = {};
        
        for (const carId of carIds) {
          try {
            const carResponse = await axios.get(`${apiUrl}/api/catalog/cars/${carId}`);
            if (carResponse.data) {
              carsData[carId] = carResponse.data;
            }
          } catch (error) {
            console.error(`Error fetching car info for ID ${carId}:`, error);
          }
        }
        
        setCars(carsData);
      } else {
        console.error('Invalid reviews data format:', response.data);
        toast.error('Ошибка формата данных отзывов');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Пожалуйста, введите комментарий');
      return;
    }

    try {
      setIsSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.post(
        `${apiUrl}/api/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success('Отзыв успешно добавлен');
      setShowForm(false);
      setComment('');
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.message || 'Не удалось добавить отзыв');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await axios.delete(`${apiUrl}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Отзыв успешно удален');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Не удалось удалить отзыв');
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
    <div className={styles.reviewsContainer}>
      <h2 className={styles.sectionTitle}>Отзывы наших клиентов</h2>
      
      {user && !reviews.some(review => review.user_id === user.id) && (
        <button 
          className={styles.addReviewButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Отмена' : 'Оставить отзыв'}
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
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

      <div className={styles.reviewsList}>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.review_id || review.id} className={styles.reviewCard}>
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
                      {review.firstname && review.lastname 
                        ? `${review.firstname} ${review.lastname}`
                        : review.name || 'Пользователь'}
                    </div>
                    <div className={styles.reviewDate}>
                      {review.created_at 
                        ? new Date(review.created_at).toLocaleDateString('ru-RU')
                        : review.date || 'Дата не указана'}
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
                    onClick={() => handleDelete(review.review_id)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              {cars[review.car_id] && (
                <div className={styles.carInfo}>
                  Отзыв о: {cars[review.car_id].brand_name} {cars[review.car_id].model_name}
                </div>
              )}
              <div className={styles.rating}>
                {renderStars(review.rating)}
              </div>
              <p className={styles.comment}>{review.comment || review.text}</p>
            </div>
          ))
        ) : (
          <div className={styles.noReviews}>
            Отзывов пока нет. Будьте первым, кто оставит отзыв!
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
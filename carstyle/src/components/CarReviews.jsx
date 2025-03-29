import React, { useState, useEffect } from 'react';
import { FaStar, FaUser, FaThumbsUp } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './Reviews.module.css';

const CarReviews = ({ carId }) => {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carInfo, setCarInfo] = useState(null);

  useEffect(() => {
    fetchCarInfo();
    fetchReviews();
  }, [carId]);

  const fetchCarInfo = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/catalog/cars/${carId}`);
      setCarInfo(response.data);
    } catch (error) {
      console.error('Error fetching car info:', error);
      toast.error('Не удалось загрузить информацию об автомобиле');
    }
  };

  const fetchReviews = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.get(`${apiUrl}/api/reviews/car/${carId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
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
          car_id: carId 
        },
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

  if (loading) {
    return <div className={styles.loading}>Загрузка отзывов...</div>;
  }

  return (
    <section className={styles.testimonialsSection}>
      <div className={styles.testimonialsContainer}>
        <div className={styles.testimonialsHeader}>
          <h2>Отзывы об автомобиле {carInfo?.brand_name} {carInfo?.model_name}</h2>
          <p>Узнайте, что говорят о нем наши клиенты</p>
        </div>
        
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
            <div key={review.review_id} className={styles.testimonialCard}>
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
              </div>
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
            </div>
          ))}
          {reviews.length === 0 && (
            <p className={styles.noReviews}>Пока нет отзывов об этом автомобиле. Будьте первым!</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default CarReviews;
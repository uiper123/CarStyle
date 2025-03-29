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

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/reviews');
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
    if (!comment.trim()) {
      toast.error('Пожалуйста, введите комментарий');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(
        'http://localhost:3002/api/reviews',
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
      await axios.delete(`http://localhost:3002/api/reviews/${reviewId}`, {
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
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className={styles.star} />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className={styles.star} />);
      } else {
        stars.push(<FaRegStar key={i} className={styles.star} />);
      }
    }
    return stars;
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
        {reviews.map((review) => (
          <div key={review.review_id} className={styles.reviewCard}>
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
                  onClick={() => handleDelete(review.review_id)}
                >
                  <FaTrash />
                </button>
              )}
            </div>
            <div className={styles.rating}>
              {renderStars(review.rating)}
            </div>
            <p className={styles.comment}>{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
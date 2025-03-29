// src/components/ReviewsSection.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaTrash, FaHeart, FaRegHeart } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ReviewsSection.css';

const ReviewsSection = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [cars, setCars] = useState([]);
  const [likedReviews, setLikedReviews] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReviewForDelete, setSelectedReviewForDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchCars();
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

  const fetchCars = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/cars');
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast.error('Не удалось загрузить автомобили');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Пожалуйста, войдите в систему, чтобы оставить отзыв');
      return;
    }

    if (!rating) {
      setError('Пожалуйста, выберите оценку');
      return;
    }

    if (!comment.trim()) {
      setError('Пожалуйста, введите текст отзыва');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3002/api/reviews',
        { rating, comment: comment.trim(), carId: selectedCar },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Отзыв успешно добавлен');
      setShowForm(false);
      setComment('');
      setSelectedCar(null);
      setError(null);
      fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response?.status === 400) {
        setError(error.response.data.message);
      } else {
        toast.error('Не удалось добавить отзыв');
      }
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
      await axios.delete(`http://localhost:3002/api/reviews/${selectedReviewForDelete.review_id}`, {
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
      toast.error('Пожалуйста, войдите в систему, чтобы поставить лайк');
      return;
    }

    try {
      await axios.post(
        `http://localhost:3002/api/reviews/${reviewId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikedReviews(prevLikedReviews => {
        const newLikedReviews = new Set(prevLikedReviews);
        newLikedReviews.add(reviewId);
        return newLikedReviews;
      });
      fetchReviews();
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Не удалось обработать лайк');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="star" />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className="star" />);
      } else {
        stars.push(<FaRegStar key={i} className="star" />);
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
    return <div className="loading">Загрузка отзывов...</div>;
  }

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Отзывы клиентов
          </motion.h2>
          <p>Узнайте, что говорят о нас наши клиенты</p>
        </div>

        {user && (
          <button className="add-review-button" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Отмена' : 'Написать отзыв'}
          </button>
        )}

        {showForm && (
          <form className="review-form" onSubmit={handleSubmit}>
            <div className="rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${rating >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <select
              className="comment-input"
              value={selectedCar || ''}
              onChange={(e) => setSelectedCar(e.target.value || null)}
            >
              <option value="">Общий отзыв о сервисе</option>
              {cars.map(car => (
                <option key={car.car_id} value={car.car_id}>
                  {car.brand} {car.model} ({car.year})
                </option>
              ))}
            </select>

            <textarea
              className="comment-input"
              placeholder="Напишите ваш отзыв..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-button">
              Отправить отзыв
            </button>
          </form>
        )}

        <div className="testimonials-grid">
          {reviews.map((review) => (
            <div key={review.review_id} className="testimonial-card">
              <div className="review-header">
                <div className="review-user">
                  {review.avatar_url ? (
                    <img
                      src={review.avatar_url}
                      alt={review.username}
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar-icon">
                      <FaUser />
                    </div>
                  )}
                  <div className="user-info">
                    <h3>{`${review.firstname} ${review.lastname}`}</h3>
                    <p>{new Date(review.created_at).toLocaleDateString('ru-RU')}</p>
                    {review.user_role === 'admin' && (
                      <span className="user-role admin-role">Администратор</span>
                    )}
                    {review.user_role === 'staff' && (
                      <span className="user-role staff-role">Сотрудник</span>
                    )}
                  </div>
                </div>
                {canDeleteReview(review) && (
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(review)}
                    title="Удалить отзыв"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              {review.car_id && (
                <p className="review-car">
                  Отзыв о: {review.car_brand} {review.car_model} ({review.car_year})
                </p>
              )}

              <div className="rating">
                {renderStars(review.rating)}
              </div>

              <p className="review-text">{review.comment}</p>

              <div className="review-actions">
                <button
                  className={`like-button ${likedReviews.has(review.review_id) ? 'liked' : ''}`}
                  onClick={() => handleLike(review.review_id)}
                  title="Поставить лайк"
                >
                  {likedReviews.has(review.review_id) ? <FaHeart /> : <FaRegHeart />}
                  <span>{review.likes_count || 0} {review.likes_count === 1 ? 'Лайк' : 'Лайков'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDeleteModal && (
        <div className="delete-modal">
          <div className="delete-content">
            <h2>Подтверждение удаления</h2>
            <p className="delete-description">
              Вы уверены, что хотите удалить этот отзыв?
            </p>
            <button
              className="confirm-delete-button"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </button>
            <button
              className="cancel-delete-button"
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
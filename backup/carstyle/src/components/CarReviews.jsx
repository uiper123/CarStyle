import React, { useState } from 'react';
import { useReviews } from '../context/ReviewsContext';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import './ReviewsSection.css';

const CarReviews = ({ carId }) => {
  const { reviews, addReview, likeReview } = useReviews();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    userName: '',
    rating: 5,
    text: ''
  });
  const [hover, setHover] = useState(null);

  const carReviews = reviews[carId] || [];

  const handleSubmitReview = (e) => {
    e.preventDefault();
    const review = {
      ...newReview,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      likes: 0
    };
    
    addReview(carId, review);
    setNewReview({ userName: '', rating: 5, text: '' });
    setShowReviewForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderRatingStars = () => {
    return (
      <div className="rating-select">
        <label>Оценка:</label>
        <div className="star-rating">
          {[...Array(5)].map((star, index) => {
            const ratingValue = index + 1;
            return (
              <label key={index}>
                <input
                  type="radio"
                  name="rating"
                  value={ratingValue}
                  onClick={() => setNewReview(prev => ({ ...prev, rating: ratingValue }))}
                />
                <FaStar
                  className="star"
                  color={ratingValue <= (hover || newReview.rating) ? "#ffd700" : "#e4e5e9"}
                  size={25}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(null)}
                />
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="reviews-section">
      <div className="reviews-container">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Отзывы об автомобиле
        </motion.h2>

        <div className="reviews-grid">
          {carReviews.map(review => (
            <motion.div
              key={review.id}
              className="review-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="review-header">
                <div className="review-user">
                  <div className="user-avatar"></div>
                  <div className="user-info">
                    <h3>{review.userName}</h3>
                    <p>{review.date}</p>
                  </div>
                </div>
                <div className="review-rating">
                  {[...Array(5)].map((_, index) => (
                    <span key={index}>
                      {index < review.rating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </div>
              <p className="review-text">{review.text}</p>
              <div className="review-actions">
                <span onClick={() => likeReview(carId, review.id)}>
                  👍 {review.likes}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          className="write-review-button"
          onClick={() => setShowReviewForm(!showReviewForm)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showReviewForm ? 'Отменить' : 'Написать отзыв'}
        </motion.button>

        {showReviewForm && (
          <motion.div
            className="review-form-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <form onSubmit={handleSubmitReview} className="review-form">
              <input
                type="text"
                name="userName"
                value={newReview.userName}
                onChange={handleInputChange}
                placeholder="Ваше имя"
                required
                className="review-input"
              />
              {renderRatingStars()}
              <textarea
                name="text"
                value={newReview.text}
                onChange={handleInputChange}
                placeholder="Ваш отзыв"
                required
                className="review-textarea"
              />
              <motion.button
                type="submit"
                className="submit-review-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Отправить отзыв
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CarReviews; 
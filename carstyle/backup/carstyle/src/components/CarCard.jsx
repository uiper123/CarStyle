// src/components/CarCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar } from 'react-icons/fa';
import './CarCard.css';

const CarCard = ({ car }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleDetailsClick = (e) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    navigate(`/cars/${car.id}`);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={i <= Math.floor(rating) ? 'star-filled' : 'star-empty'}
        />
      );
    }
    return stars;
  };

  // Анимация для карточки
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: {
      scale: 1.03,
      transition: { duration: 0.3 }
    }
  };

  const imageVariants = {
    hover: {
      scale: 1.1,
      transition: { duration: 0.3 }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    hover: { 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    hover: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, delay: 0.1 }
    }
  };

  return (
    <motion.div
      className="car-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="car-image-container">
        <motion.img 
          src={car.images[0]} 
          alt={`${car.brand} ${car.model}`} 
          className="car-image"
          variants={imageVariants}
        />
        <motion.div 
          className="image-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate={isHovered ? "hover" : "hidden"}
        >
          <motion.button 
            className="view-details-button"
            variants={buttonVariants}
            onClick={handleDetailsClick}
          >
            Смотреть подробнее
          </motion.button>
        </motion.div>
        <div className="rating-oval">
          <span>★</span> {car.rating}
        </div>
      </div>
      <div className="car-info">
        <h3 className="car-name">{car.brand} {car.model}</h3>
        <div className="car-specs">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8F8F8F" strokeWidth="2">
              <path d="M12 2v20M2 12h20M4 4l16 16M20 4L4 20" />
            </svg>
            {car.engine}
          </span>
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8F8F8F" strokeWidth="2">
              <path d="M12 2v20M2 12h20M4 4l16 16M20 4L4 20" />
            </svg>
            {car.fuel}
          </span>
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8F8F8F" strokeWidth="2">
              <path d="M12 2v20M2 12h20M4 4l16 16M20 4L4 20" />
            </svg>
            {car.transmission}
          </span>
        </div>
        <div className="car-bottom">
          <p className="car-price">{car.price.toLocaleString()} ₽/день</p>
          <motion.button 
            className="details-button"
            onClick={handleDetailsClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Подробнее
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CarCard;
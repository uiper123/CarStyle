// src/components/CarCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaCar, FaGasPump, FaCogs, FaRoad } from 'react-icons/fa';
import './CarCard.css';

const CarCard = ({ car }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    navigate(`/cars/${car.car_id || car.id}`);
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

  // Получаем URL изображения
  const getImageUrl = () => {
    if (!car.images || !Array.isArray(car.images) || car.images.length === 0) {
      return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    const image = car.images[0];
    
    // Если у изображения есть прямой URL
    if (image.image_url) {
      return image.image_url;
    }

    return 'https://via.placeholder.com/300x200?text=No+Image';
  };

  // Форматирование пробега
  const formatMileage = (mileage) => {
    if (!mileage) return '0 км';
    return `${Number(mileage).toLocaleString()} км`;
  };

  // Форматирование цены
  const formatPrice = (price) => {
    if (!price) return '0 ₽/день';
    return `${Number(price).toLocaleString()} ₽/день`;
  };

  // Добавим вывод данных при рендере
  console.log('Rendering car:', {
    id: car.id,
    brand: car.brand_name,
    model: car.model_name,
    imageUrl: getImageUrl()
  });

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
          src={getImageUrl()}
          alt={`${car.brand_name} ${car.model_name}`} 
          className="car-image"
          variants={imageVariants}
          onError={(e) => {
            const url = e.target.src;
            console.log('Image load error for URL:', url);
            // Пробуем альтернативный путь без /storage/
            if (url.includes('/storage/')) {
              const newUrl = url.replace('/storage/', '/');
              console.log('Trying alternative URL:', newUrl);
              e.target.src = newUrl;
            } else {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }
          }}
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
        {car.rating && (
          <div className="rating-oval">
            <span>★</span> {car.rating}
          </div>
        )}
      </div>
      <div className="car-info">
        <h3 className="car-name">{car.brand_name} {car.model_name}</h3>
        <div className="car-specs">
          <span>
            <FaCar />
            {car.year}
          </span>
          <span>
            <FaRoad />
            {formatMileage(car.mileage)}
          </span>
          <span>
            <FaGasPump />
            {car.fuel_name}
          </span>
          <span>
            <FaCogs />
            {car.transmission_name}
          </span>
        </div>
        <div className="car-bottom">
          <p className="car-price">{formatPrice(car.price)}</p>
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
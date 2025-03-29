// src/components/AdditionalSections.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './AdditionalSections.css';
import { carsData } from '../data/carsData';

const AdditionalSections = () => {
  const navigate = useNavigate();
  // Выбираем только первые 3 автомобиля для рекомендаций
  const recommendedCars = carsData.slice(0, 3);

  const handleCardClick = (carId) => {
    navigate(`/cars/${carId}`);
  };

  return (
    <section className="additional-sections">
      <div className="our-fleet">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Рекомендуемые автомобили
        </motion.h2>
        <motion.p
          className="fleet-description"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Самые популярные модели нашего автопарка
        </motion.p>
        <div className="cars-grid">
          {recommendedCars.map((car, index) => (
            <motion.div
              key={car.id}
              className="car-card"
              onClick={() => handleCardClick(car.id)}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="car-image-container">
                <img src={car.images[0]} alt={`${car.brand} ${car.model}`} className="car-image" />
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
                  <button 
                    className="details-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(car.id);
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdditionalSections;
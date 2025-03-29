import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCar, FaTachometerAlt, FaGasPump, FaCogs } from 'react-icons/fa';
import { carsData } from '../data/carsData';
import './CarDetail.css';
import BookingModal from './BookingModal';
import CarReviews from './CarReviews';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  const car = carsData.find(car => car.id === Number(id));

  useEffect(() => {
    if (!car) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % car.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [car]);

  const handleImageChange = (index) => {
    setCurrentImage(index);
    clearInterval();
  };

  if (!car) {
    return (
      <div className="car-detail">
        <div className="car-detail-container">
          <h2>Автомобиль не найден</h2>
          <button onClick={() => navigate('/catalog')}>Вернуться в каталог</button>
        </div>
      </div>
    );
  }

  return (
    <div className="car-detail">
      <div className="car-detail-container animate-fade-in">
        <div className="car-main-info">
          <div className="car-gallery-section">
            <div className="main-image animate-scale-in">
              <img 
                src={car.images[currentImage]} 
                alt={`${car.brand} ${car.model}`}
                className="fade-transition"
              />
              <div className="image-indicators">
                {car.images.map((_, index) => (
                  <div
                    key={index}
                    className={`indicator ${currentImage === index ? 'active' : ''}`}
                    onClick={() => handleImageChange(index)}
                  />
                ))}
              </div>
            </div>
            <div className="thumbnail-list">
              {car.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${currentImage === index ? 'active' : ''}`}
                  onClick={() => handleImageChange(index)}
                >
                  <img src={image} alt={`${car.brand} ${car.model} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="car-info-section animate-slide-in">
            <div className="car-header">
              <h1 className="car-title">{car.brand} {car.model}</h1>
              <div className="car-rating">
                <span>★</span>
                <span className="car-rating-value">{car.rating}</span>
              </div>
            </div>

            <div className="quick-specs">
              {[
                { icon: <FaCar />, label: "Год выпуска", value: car.year },
                { icon: <FaTachometerAlt />, label: "Мощность", value: car.power },
                { icon: <FaGasPump />, label: "Расход", value: car.consumption },
                { icon: <FaCogs />, label: "Коробка", value: car.transmission },
              ].map((spec, index) => (
                <div key={index} className="quick-spec-item animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                  {spec.icon}
                  <div className="spec-content">
                    <span className="spec-label">{spec.label}</span>
                    <span className="spec-value">{spec.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="detailed-specs animate-slide-up">
              <h2>Характеристики</h2>
              <div className="specs-list">
                {[
                  { icon: <FaCogs />, label: "Двигатель", value: car.engine },
                  { icon: <FaTachometerAlt />, label: "Разгон до 100 км/ч", value: car.acceleration },
                  { icon: <FaGasPump />, label: "Тип топлива", value: car.fuel },
                ].map((spec, index) => (
                  <div key={index} className="spec-row animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <span className="spec-name">
                      {spec.icon} {spec.label}
                    </span>
                    <span className="spec-value">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="features-section animate-slide-up">
              <h2>Комплектация</h2>
              <div className="features-list">
                {car.features.map((feature, index) => (
                  <div key={index} className="feature-item animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <span className="feature-check">✓</span>
                    <span className="feature-text">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        
        <div className="booking-section animate-slide-up">
            <div className="booking-price">
              <span className="price-label">Стоимость аренды</span>
              <span className="price-value">{car.price.toLocaleString()} ₽/день</span>
            </div>
            <button 
              className="details-button"
              onClick={() => setIsBookingModalOpen(true)}
            >
              Забронировать
            </button>
          </div>
          
        <div className="car-details-section">
          <div className="car-description animate-slide-up">
            <h2>Об автомобиле</h2>
            <p className="description-text">{car.description}</p>
          </div>
        </div>

        <CarReviews carId={car.id} />
      </div>
      <BookingModal
        car={car}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />
    </div>
  );
};

export default CarDetail;
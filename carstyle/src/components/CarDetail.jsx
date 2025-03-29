import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCar, FaTachometerAlt, FaGasPump, FaCogs, FaRoad } from 'react-icons/fa';
import axios from 'axios';
import './CarDetail.css';
import BookingModal from './BookingModal';
import CarReviews from './CarReviews';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [car, setCar] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCarDetails = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || '';

        // Получаем детали автомобиля
        const carResponse = await axios.get(`${apiUrl}/api/catalog/cars/${id}`);

        const carData = carResponse.data;
        console.log('Car Data from server:', {
          id: carData.id,
          car_id: carData.car_id,
          brand_name: carData.brand_name,
          model_name: carData.model_name,
          price: carData.price,
          images: carData.images
        });

        setCar(carData);
        setError(null);
      } catch (error) {
        console.error('Error fetching car details:', error);
        setError('Не удалось загрузить информацию об автомобиле');
      } finally {
        setLoading(false);
      }
    };

    fetchCarDetails();
  }, [id]);

  useEffect(() => {
    if (!car || !car.images || car.images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % car.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [car]);

  const handleImageChange = (index) => {
    setCurrentImage(index);
  };

  const handleBookingClick = () => {
    if (!user) {
      toast.error('Для бронирования необходимо войти в систему');
      navigate('/login');
      return;
    }
    setIsBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="car-detail">
        <div className="car-detail-container">
          <div className="loading">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="car-detail">
        <div className="car-detail-container">
          <h2>{error || 'Автомобиль не найден'}</h2>
          <button onClick={() => navigate('/catalog')} className="back-button">
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="car-detail">
      <div className="car-detail-container" style={{ background: '#1a1a1b' }}>
        <div className="car-images">
          <div className="main-image">
            <img 
              src={car.images[currentImage]?.image_url || 'https://via.placeholder.com/800x400?text=No+Image'} 
              alt={`${car.brand_name} ${car.model_name}`} 
            />
          </div>
          <div className="image-thumbnails">
            {car.images.map((image, index) => (
              <div
                key={image.id}
                className={`thumbnail ${currentImage === index ? 'active' : ''}`}
                onClick={() => handleImageChange(index)}
              >
                <img src={image.image_url} alt={`${car.brand_name} ${car.model_name} thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="car-info">
          <div className="car-header">
            <h1>{car.brand_name} {car.model_name}</h1>
            <div className="rating">★ {car.rating || '4.9'}</div>
          </div>
          
          <div className="car-specs">
            <div className="spec-item">
              <div className="spec-icon">
                <FaCar />
              </div>
              <div className="spec-content">
                <div className="spec-label">Год выпуска</div>
                <div className="spec-value">{car.year}</div>
              </div>
            </div>
            <div className="spec-item">
              <div className="spec-icon">
                <FaRoad />
              </div>
              <div className="spec-content">
                <div className="spec-label">Пробег</div>
                <div className="spec-value">{car.mileage} км</div>
              </div>
            </div>
            <div className="spec-item">
              <div className="spec-icon">
                <FaGasPump />
              </div>
              <div className="spec-content">
                <div className="spec-label">Топливо</div>
                <div className="spec-value">{car.fuel_name}</div>
              </div>
            </div>
            <div className="spec-item">
              <div className="spec-icon">
                <FaCogs />
              </div>
              <div className="spec-content">
                <div className="spec-label">Коробка</div>
                <div className="spec-value">{car.transmission_name}</div>
              </div>
            </div>
          </div>

          <div className="booking-container">
            <div className="booking-section">
              <div className="price-block">
                <div className="price-label">Стоимость аренды</div>
                <div className="price-value">{car.price} ₽/день</div>
              </div>
              <button 
                className="booking-button"
                onClick={handleBookingClick}
              >
                Забронировать
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="description-container">
        <div className="description">
          <h2>Описание</h2>
          <p>{car.description || 'Описание автомобиля временно недоступно.'}</p>
        </div>
      </div>
      <CarReviews carId={car.id} />

      {isBookingModalOpen && (
        <BookingModal
          car={{
            car_id: car.id,
            brand_name: car.brand_name,
            model_name: car.model_name,
            price: car.price,
            images: car.images
          }}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CarDetail;
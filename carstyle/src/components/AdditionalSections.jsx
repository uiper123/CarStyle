// src/components/AdditionalSections.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import CarCard from './CarCard';
import './AdditionalSections.css';

const AdditionalSections = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const fetchCars = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching cars from:', `${apiUrl}/api/cars`);
      
      const response = await axios.get(`${apiUrl}/api/cars`);
      console.log('API Response:', response.data);

      // Проверяем структуру ответа
      if (Array.isArray(response.data)) {
        setCars(response.data);
      } else if (response.data.cars && Array.isArray(response.data.cars)) {
        setCars(response.data.cars);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError('Не удалось загрузить автомобили. Пожалуйста, попробуйте позже.');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка автомобилей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchCars} className="retry-button">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!cars || cars.length === 0) {
    return (
      <div className="no-cars-container">
        <p>Нет доступных автомобилей</p>
      </div>
    );
  }

  return (
    <section className="recommended-cars">
      <h2>Рекомендуемые автомобили</h2>
      <div className="cars-grid">
        {cars.map((car, index) => (
          <motion.div
            key={car.car_id || car.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <CarCard car={car} />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default AdditionalSections;
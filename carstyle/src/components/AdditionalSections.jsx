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

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        console.log('Fetching cars from:', `${apiUrl}/api/catalog/cars`);
        
        // Получаем список автомобилей
        const response = await axios.get(`${apiUrl}/api/catalog/cars`, {
          params: {
            limit: 3 // Получаем только 3 автомобиля
          }
        });

        console.log('Cars loaded:', response.data);
        setCars(response.data);
      } catch (error) {
        console.error('Error fetching cars:', error);
        setError('Ошибка при загрузке автомобилей');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [apiUrl]);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!cars.length) {
    return <div className="no-cars">Нет доступных автомобилей</div>;
  }

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
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <CarCard car={car} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdditionalSections;
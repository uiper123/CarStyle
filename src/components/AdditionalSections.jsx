// src/components/AdditionalSections.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CarCard from './CarCard';
import './AdditionalSections.css';

const AdditionalSections = () => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Имитируем загрузку данных
        const timer = setTimeout(() => {
            setLoading(false);
            setCars([]); // Пустой массив вместо данных
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <section className="recommended-cars">
            <div className="container">
                <h2 className="section-title">Recommended Cars</h2>
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading cars...</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <p className="error-message">{error}</p>
                    </div>
                ) : cars.length === 0 ? (
                    <div className="no-cars-container">
                        <p>No cars available at the moment.</p>
                    </div>
                ) : (
                    <div className="cars-grid">
                        {cars.map((car, index) => (
                            <motion.div
                                key={car.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <CarCard car={car} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdditionalSections;
// src/components/CarCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './CarCard.css';

const CarCard = ({ car }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (car && car.id) {
            navigate(`/cars/${car.id}`);
        }
    };

    // Если car не определен, показываем заглушку
    if (!car) {
        return (
            <div className="car-card placeholder">
                <div className="car-image placeholder-image"></div>
                <div className="car-info">
                    <h3>Car not available</h3>
                    <p>Please check back later</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="car-card"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className="car-image">
                <img 
                    src={car.image_url || '/placeholder-car.jpg'} 
                    alt={`${car.brand || 'Car'} ${car.model || ''}`}
                    onError={(e) => {
                        e.target.src = '/placeholder-car.jpg';
                    }}
                />
                {isHovered && (
                    <motion.div
                        className="car-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <span>View Details</span>
                    </motion.div>
                )}
            </div>
            <div className="car-info">
                <h3>{car.brand || 'Unknown Brand'} {car.model || ''}</h3>
                <div className="car-specs">
                    <span>
                        <i className="fas fa-calendar"></i>
                        {car.year || 'N/A'}
                    </span>
                    <span>
                        <i className="fas fa-gas-pump"></i>
                        {car.fuel_type || 'N/A'}
                    </span>
                    <span>
                        <i className="fas fa-tachometer-alt"></i>
                        {car.transmission || 'N/A'}
                    </span>
                </div>
                <div className="car-price">
                    <span className="price">${car.price || '0'}</span>
                    <span className="per-day">/day</span>
                </div>
            </div>
        </motion.div>
    );
};

export default CarCard;
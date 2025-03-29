import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  
  const images = [
    'public/logo/bgcar.png',
    'public/logo/chet.jpg',
    'public/logo/phorsh.jpg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 1000); // Задержка перед сменой изображения (после fade-out)
      
    }, 5000);
    
    return () => clearInterval(interval);
  }, [images.length]);

  const handleRentClick = () => {
    const isAuthenticated = localStorage.getItem('token') !== null;
    if (isAuthenticated) {
      navigate('/catalog'); // Если авторизован, переходим к выбору автомобиля
    } else {
      navigate('/register'); // Если не авторизован, переходим к регистрации
    }
  };

  return (
    <section className="hero">
      <div 
        className={`hero-background ${isTransitioning ? 'fade-out' : 'fade-in'}`}
        style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
      ></div>
      <div className="hero-content">
        <h1>Комфорт и надежность на каждом километре</h1>
        <p>Ощутите для себя коллекцию эксклюзивных автомобилей, отборный сервис и индивидуальный подход к каждому клиенту.</p>
        <div className="rent-button-wrapper">
          <button className="rent-button" onClick={handleRentClick}>
            <span>Арендовать сейчас</span>
            <img src="public/logo/Vector.png" alt="Иконка аренды" className="icon" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
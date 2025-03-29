import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Preloader.css';

const Preloader = ({ isLoading }) => {
  const { user } = useAuth();
  const [loadingText, setLoadingText] = useState('Загрузка CarStyle...');

  useEffect(() => {
    if (isLoading) {
      let currentStep = 0;
      const steps = ['Инициализация CarStyle...', 'Загрузка данных пользователя...'];
      
      // Добавляем шаг загрузки аватара, если он есть
      if (user?.avatar_url) {
        steps.push('Загрузка аватара пользователя...');
      } else {
        steps.push('Загрузка интерфейса...');
      }
      
      steps.push('Завершение загрузки...');
      
      const textInterval = setInterval(() => {
        setLoadingText(steps[currentStep]);
        currentStep++;
        
        if (currentStep >= steps.length) {
          clearInterval(textInterval);
        }
      }, 750); // Меняем текст каждые 750мс

      return () => {
        clearInterval(textInterval);
      };
    }
  }, [isLoading, user]);

  return (
    <div className={`preloader ${!isLoading ? 'fade-out' : ''}`}>
      <div className="car-container">
        <img src="/logo/humbleicons_car.png" alt="Загрузка" className="car-icon" />
        <div className="road"></div>
      </div>
      <p className="loading-text">{loadingText}</p>
    </div>
  );
};

export default Preloader;
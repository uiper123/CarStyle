import React, { createContext, useState, useContext } from 'react';
import { carsData } from '../data/carsData';

const ReviewsContext = createContext();

export const ReviewsProvider = ({ children }) => {
  const [reviews, setReviews] = useState({
    // Начальные тестовые отзывы
    1: [
      {
        id: 1,
        userName: "Александр",
        rating: 5,
        date: "2024-03-15",
        text: "Mercedes-Benz S-Class - потрясающий автомобиль! Комфорт на высшем уровне.",
        likes: 3,
        carId: 1
      }
    ],
    2: [
      {
        id: 2,
        userName: "Мария",
        rating: 5,
        date: "2024-03-14",
        text: "BMW 7 Series превзошел все ожидания. Динамика и управляемость впечатляют.",
        likes: 2,
        carId: 2
      }
    ]
  });

  const addReview = (carId, review) => {
    setReviews(prev => ({
      ...prev,
      [carId]: [...(prev[carId] || []), { ...review, carId }]
    }));
  };

  const likeReview = (carId, reviewId) => {
    setReviews(prev => ({
      ...prev,
      [carId]: prev[carId].map(review =>
        review.id === reviewId
          ? { ...review, likes: (review.likes || 0) + 1 }
          : review
      )
    }));
  };

  const getAllReviews = () => {
    return Object.values(reviews).flat();
  };

  return (
    <ReviewsContext.Provider value={{ reviews, addReview, likeReview, getAllReviews }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => useContext(ReviewsContext); 
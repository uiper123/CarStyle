// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); // Роль пользователя (например, 'admin' или 'manager')

  // Проверка авторизации и роли
  if (!token) {
    alert('Пожалуйста, войдите в систему!');
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    alert('У вас нет прав для доступа к этой странице!');
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
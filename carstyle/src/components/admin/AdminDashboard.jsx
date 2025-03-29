import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserManagement from './UserManagement';
import CarManagement from './CarManagement';
import DictionaryManagement from './DictionaryManagement';
import OrdersManagement from './OrdersManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    // Проверяем наличие пользователя из контекста авторизации
    if (user && user.role) {
      console.log('User from context:', user);
      console.log('User role from context:', user.role);
      setUserRole(user.role);
      localStorage.setItem('userRole', user.role);
    } else {
      // Если нет пользователя в контексте, проверяем localStorage
      const savedRole = localStorage.getItem('userRole');
      console.log('Role from localStorage:', savedRole);
      
      if (savedRole === 'admin' || savedRole === 'employee') {
        setUserRole(savedRole);
      } else {
        // Если нет роли или роль не администратор/сотрудник - перенаправляем на главную
        console.log('No valid role found, redirecting to home');
        navigate('/');
      }
    }
  }, [user, navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement userRole={userRole} />;
      case 'cars':
        return <CarManagement userRole={userRole} />;
      case 'dictionaries':
        return <DictionaryManagement userRole={userRole} />;
      case 'orders':
        return <OrdersManagement userRole={userRole} />;
      default:
        return <OrdersManagement userRole={userRole} />;
    }
  };

  const getDashboardTitle = () => {
    return userRole === 'admin' ? 'Админ панель' : 'Панель сотрудника';
  };

  const getNavItems = () => {
    const items = [];
    
    // Показываем управление пользователями только администраторам
    if (userRole === 'admin') {
      items.push({
        id: 'users',
        label: 'Управление пользователями'
      });
    }
    
    // Управление автомобилями доступно всем
    items.push({
      id: 'cars',
      label: 'Управление автомобилями'
    });
    
    // Заказы доступны всем
    items.push({
      id: 'orders',
      label: 'Заказы'
    });
    
    // Справочники доступны всем
    items.push({
      id: 'dictionaries',
      label: 'Справочники'
    });
    
    // Кнопка возврата на сайт
    items.push({
      id: 'back',
      label: 'Вернуться на сайт',
      isBackButton: true
    });
    
    return items;
  };

  if (!userRole) {
    return <div className="admin-loading">Загрузка...</div>;
  }

  const dashboardClassName = `admin-dashboard ${userRole === 'employee' ? 'employee-dashboard' : ''}`;
  console.log('Current user role:', userRole);
  console.log('Dashboard class name:', dashboardClassName);

  return (
    <div className={dashboardClassName}>
      <div className="admin-sidebar">
        <h2>{getDashboardTitle()}</h2>
        <nav className="admin-nav">
          {getNavItems().map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''} ${item.isBackButton ? 'back-button' : ''}`}
              onClick={() => item.isBackButton ? navigate('/') : setActiveTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard; 
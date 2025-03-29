import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from './UserManagement';
import CarManagement from './CarManagement';
import RequestManagement from './RequestManagement';
import DictionaryManagement from './DictionaryManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'cars':
        return <CarManagement />;
      case 'requests':
        return <RequestManagement />;
      case 'dictionaries':
        return <DictionaryManagement />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <h2>Админ панель</h2>
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Управление пользователями
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveTab('cars')}
          >
            Управление автомобилями
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Заявки на аренду
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'dictionaries' ? 'active' : ''}`}
            onClick={() => setActiveTab('dictionaries')}
          >
            Справочники
          </button>
          <button
            className="admin-nav-item back-button"
            onClick={() => navigate('/')}
          >
            Вернуться на сайт
          </button>
        </nav>
      </div>
      <div className="admin-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard; 
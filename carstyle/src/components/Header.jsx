// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserIcon from './UserIcon';
import styles from './Header.module.css';

const Header = () => {
  const { user, token, logout } = useAuth();
  const isAuthenticated = !!token;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isHidden, setIsHidden] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let role = null;
    
    // Получаем роль из объекта пользователя
    if (user && user.role) {
      role = user.role;
      console.log('Role from user object:', role);
      localStorage.setItem('userRole', role);
    } 
    // Если нет в объекте пользователя, проверяем localStorage
    else if (localStorage.getItem('userRole')) {
      role = localStorage.getItem('userRole');
      console.log('Role from localStorage:', role);
    }
    
    setUserRole(role);
  }, [user]);

  useEffect(() => {
    let lastScrollTop = 0;

    const handleScroll = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScroll > lastScrollTop && currentScroll > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }

      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const canAccessAdminPanel = () => {
    return userRole === 'admin' || userRole === 'employee';
  };

  const headerClasses = `${styles.header} ${isHidden ? styles.hide : ''}`;

  return (
    <header className={headerClasses}>
      <div className={styles.logo}>
        <Link to="/">
          <img src="/logo/logo1.png" alt="CarStyle Logo" />
        </Link>
      </div>
      
      <nav className={styles.navMenu}>
        <Link to="/catalog" className={styles.navLink}>
          <img src="/logo/car.png" alt="Каталог" className={styles.icon} />
          Каталог
        </Link>
        <Link to="/about" className={styles.navLink}>
          <img src="/logo/user.png" alt="О нас" className={styles.icon} />
          О нас
        </Link>
        <Link to="/contacts" className={styles.navLink}>
          <img src="/logo/phone.png" alt="Контакты" className={styles.icon} />
          Контакты
        </Link>
        {isAuthenticated && canAccessAdminPanel() && (
          <Link to="/admin" className={`${styles.navLink} ${styles.adminLink}`}>
            <img src="/logo/admin.png" alt="Админ" className={styles.icon} />
            {userRole === 'admin' ? 'Админ-панель' : 'Панель сотрудника'}
          </Link>
        )}
      </nav>

      <div className={styles.authSection}>
        {isAuthenticated ? (
          <>
            {!isMenuOpen ? (
              <div onClick={() => setIsMenuOpen(true)}>
                <UserIcon userData={user} />
              </div>
            ) : (
              <div className={styles.userMenu}>
                <button 
                  className={styles.userMenuButton}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.name || 'Пользователь'}
                  <span className={styles.arrow}>▼</span>
                </button>
                
                <div className={styles.userDropdown}>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>{user?.firstname || user?.name || 'Пользователь'}</p>
                    <p className={styles.userEmail}>{user?.email}</p>
                    {userRole && (
                      <p className={styles.userRole}>
                        {userRole === 'admin' ? 'Администратор' : 
                         userRole === 'employee' ? 'Сотрудник' : 
                         'Клиент'}
                      </p>
                    )}
                  </div>
                  
                  <div className={styles.userActions}>
                    <Link to="/profile" className={styles.dropdownItem}>
                      Профиль
                    </Link>
                    {canAccessAdminPanel() && (
                      <Link 
                        to="/admin" 
                        className={`${styles.dropdownItem} ${styles.adminPanel}`}
                      >
                        {userRole === 'admin' ? 'Панель администратора' : 'Панель сотрудника'}
                      </Link>
                    )}
                    <button 
                      className={`${styles.dropdownItem} ${styles.logout}`}
                      onClick={handleLogout}
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.authButtons}>
            <Link to="/login" className={`${styles.authButton} ${styles.login}`}>
              Войти
            </Link>
            <Link to="/register" className={`${styles.authButton} ${styles.register}`}>
              Регистрация
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
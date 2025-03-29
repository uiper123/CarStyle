// src/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Импортируем Link для SPA-навигации
import { useAuth } from '../context/AuthContext';
import UserIcon from './UserIcon';
import styles from './Header.module.css';

const Header = () => {
  const { user } = useAuth();
  const [isHidden, setIsHidden] = useState(false);

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

  const headerClasses = `${styles.header} ${isHidden ? styles.hide : ''}`;

  return (
    <header className={headerClasses}>
      <div className={styles.logo}>
        <Link to="/">
          <img src="/logo/logo1.png" alt="CarStyle Logo" />
        </Link>
      </div>
      <nav className={styles.nav}>
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
        {user && user.role === 'admin' && (
          <Link to="/admin" className={`${styles.navLink} ${styles.adminLink}`}>
            <img src="carstyle\carstyle\public\logo\admin.png" alt="Админ" className={styles.icon} />
            Админ-панель
          </Link>
        )}
      </nav>
      <div className={styles.auth}>
        {user ? (
          <UserIcon />
        ) : (
          <Link to="/login" className={styles.loginButton}>
            <img src="/logo/log.png" alt="Войти" className={styles.icon} />
            Войти
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
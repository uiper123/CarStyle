// src/components/Footer.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Логотип и название */}
        <motion.div
          className="footer-section footer-logo"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <a href="/">
            <img src="public/logo/logo1.png" alt="CarStyle Лого" className="footer-logo-img" />
          </a>
          <p className="footer-brand">CarStyle</p>
          <p className="footer-slogan">Комфорт и надежность на каждом километре</p>
        </motion.div>

        {/* Навигация */}
        <motion.div
          className="footer-section footer-nav"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3>Навигация</h3>
          <ul>
            <li><a href="/catalog">Автопарк</a></li>
            <li><a href="/about">О нас</a></li>
            <li><a href="/contacts">Контакты</a></li>
          </ul>
        </motion.div>

        {/* Контакты */}
        <motion.div
          className="footer-section footer-contacts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Контакты</h3>
          <p>Телефон: <a href="tel:+79991234567">+7 (999) 123-45-67</a></p>
          <p>Email: <a href="mailto:info@carstyle.com">info@carstyle.com</a></p>
          <p>Адрес: г. Москва, ул. Примерная, д. 123</p>
        </motion.div>

        {/* Социальные сети */}
        <motion.div
          className="footer-section footer-social"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Следите за нами</h3>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src="public/logo/facebook.png" alt="Facebook" className="social-icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src="public/logo/instagram.png" alt="Instagram" className="social-icon" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <img src="public/logo/twitter.png" alt="Twitter" className="social-icon" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Нижняя часть подвала */}
      <motion.div
        className="footer-bottom"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p>© {new Date().getFullYear()} CarStyle. Все права защищены.</p>
      </motion.div>
    </footer>
  );
};

export default Footer;
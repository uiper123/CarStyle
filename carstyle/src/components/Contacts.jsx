// src/components/Contacts.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './Contacts.css';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'; // Иконки для контактов

const Contacts = () => {
  // Анимации для секций
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="contacts">
      {/* Геройский блок */}
      <motion.div
        className="contacts-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="hero-title">Контакты</h1>
        <p className="hero-subtitle">
          Свяжитесь с нами любым удобным способом!
        </p>
      </motion.div>

      {/* Основной контент */}
      <motion.section
        className="contacts-content"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="contact-info">
          <h2 className="contact-info-title">Наши контакты</h2>
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <p><strong>Телефон:</strong> +7 (495) 123-45-67</p>
          </div>
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <p><strong>Email:</strong> info@premiumrent.ru</p>
          </div>
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <p><strong>Адрес:</strong> г. Москва, ул. Примерная, д. 10</p>
          </div>
          <p className="contact-hours"><strong>График работы:</strong> Пн-Вс, 09:00 - 21:00</p>
        </div>
      </motion.section>

      {/* Секция с картой */}
      <motion.section
        className="map-section"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h2 className="map-title">Где мы находимся</h2>
        <div className="map-container">
          {/* Google Maps iframe с вашими координатами */}
          <iframe
            title="Map Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d991.224581509947!2d87.20165478800503!3d53.779828770178995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x42d0c3ed50563d71%3A0x911dd6fe7591c5b!2z0YPQuy4g0JXQutC40LzQvtCy0LAsIDE4LCDQndC-0LLQvtC60YPQt9C90LXRhtC6LCDQmtC10LzQtdGA0L7QstGB0LrQsNGPINC-0LHQuy4sIDY1NDAzNA!5e0!3m2!1sru!2sru!4v1742295453204!5m2!1sru!2sru"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </motion.section>
    </div>
  );
};

export default Contacts;
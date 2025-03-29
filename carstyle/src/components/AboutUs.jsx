// src/components/AboutUs.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBullseye, FaStar, FaHistory } from 'react-icons/fa'; // Иконки для секций
import './AboutUs.css';

const AboutUs = () => {
  // Состояние для отслеживания наведенной карточки
  const [hoveredCard, setHoveredCard] = useState(null);

  // Данные команды с двумя наборами фотографий и подписей
  const teamData = [
    {
      id: 1,
      defaultImage: '/images/team/vladimir-default.jpg', // Замените на реальный путь
      hoverImage: '/images/team/vladimir-hover.jpg', // Замените на реальный путь
      defaultName: 'Кулиев Владимир Денисович',
      hoverName: 'Владимир Кулиев',
      defaultRole: 'Генеральный директор',
      hoverRole: 'Основатель компании',
    },
    {
      id: 2,
      defaultImage: 'public/logo/kosta.png', // Замените на реальный путь
      hoverImage: 'public/logo/kosta1.png', // Замените на реальный путь
      defaultName: 'Поткин Константин Никитич',
      hoverName: 'Константин Поткин',
      defaultRole: 'Менеджер по работе с клиентами',
      hoverRole: 'Специалист по клиентскому сервису',
    },
  ];

  // Анимации для секций
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Анимация для элементов списка
  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  // Анимация для карточек команды
  const teamCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  // Анимация для смены изображения и текста
  const imageVariants = {
    default: { opacity: 1, transition: { duration: 0.3 } },
    hover: { opacity: 0, transition: { duration: 0.3 } },
  };

  const textVariants = {
    default: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    hover: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  };

  return (
    <div className="about-us">
      {/* Геройский блок */}
      <motion.div
        className="about-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="hero-title">О нас</h1>
        <p className="hero-subtitle">
          Мы создаем незабываемые впечатления от каждой поездки.
        </p>
      </motion.div>

      {/* Основной контент */}
      <motion.section
        className="about-content"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="about-section">
          <div className="section-header">
            <FaBullseye className="section-icon" />
            <h2>Наша миссия</h2>
          </div>
          <p>
            Мы стремимся предоставить вам лучший опыт аренды автомобилей, сочетая
            роскошь, комфорт и высокий уровень сервиса. Наша цель — сделать каждую
            поездку незабываемой, будь то деловая встреча или путешествие.
          </p>
        </div>

        <div className="about-section">
          <div className="section-header">
            <FaStar className="section-icon" />
            <h2>Почему выбирают нас?</h2>
          </div>
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.2 } },
            }}
          >
            <motion.li variants={listItemVariants}>
              Широкий выбор автомобилей премиум-класса.
            </motion.li>
            <motion.li variants={listItemVariants}>
              Гибкие условия аренды и прозрачные цены.
            </motion.li>
            <motion.li variants={listItemVariants}>
              Круглосуточная поддержка клиентов.
            </motion.li>
            <motion.li variants={listItemVariants}>
              Идеальное техническое состояние каждого автомобиля.
            </motion.li>
          </motion.ul>
        </div>

        <div className="about-section">
          <div className="section-header">
            <FaHistory className="section-icon" />
            <h2>Наша история</h2>
          </div>
          <p>
            Компания была основана в 2025 году с целью предложить клиентам
            уникальный опыт проката автомобилей. За годы работы мы заслужили доверие
            тысяч клиентов и продолжаем совершенствовать наши услуги.
          </p>
        </div>
      </motion.section>

      {/* Секция с командой */}
      <motion.section
        className="team-section"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h2>Наша команда</h2>
        <div className="team-grid">
          {teamData.map((member) => (
            <motion.div
              key={member.id}
              className="team-card"
              variants={teamCardVariants}
              onMouseEnter={() => setHoveredCard(member.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="team-image-container">
                <motion.img
                  src={member.defaultImage}
                  alt={member.defaultName}
                  className="team-image"
                  variants={imageVariants}
                  animate={hoveredCard === member.id ? 'hover' : 'default'}
                />
                <motion.img
                  src={member.hoverImage}
                  alt={member.hoverName}
                  className="team-image team-image-hover"
                  variants={imageVariants}
                  animate={hoveredCard === member.id ? 'default' : 'hover'}
                />
              </div>
              <motion.h3
                variants={textVariants}
                animate={hoveredCard === member.id ? 'hover' : 'default'}
              >
                {member.defaultName}
              </motion.h3>
              <motion.h3
                className="hover-text"
                variants={textVariants}
                animate={hoveredCard === member.id ? 'default' : 'hover'}
              >
                {member.hoverName}
              </motion.h3>
              <motion.p
                variants={textVariants}
                animate={hoveredCard === member.id ? 'hover' : 'default'}
              >
                {member.defaultRole}
              </motion.p>
              <motion.p
                className="hover-text"
                variants={textVariants}
                animate={hoveredCard === member.id ? 'default' : 'hover'}
              >
                {member.hoverRole}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default AboutUs;
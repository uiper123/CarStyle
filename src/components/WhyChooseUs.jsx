// src/components/WhyChooseUs.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './WhyChooseUs.css';

// Динамические данные с преимуществами
const advantages = [
  {
    id: 1,
    title: 'Премиальный автопарк',
    description: 'Сотни автомобилей люкс-класса для вашего комфорта.',
    icon: 'public/images/WhyChoose/Premka.png', // Замени на свой путь
  },
  {
    id: 2,
    title: 'Высокий рейтинг',
    description: 'Оценка 4.9/5 от тысяч довольных клиентов.',
    icon: 'public/images/WhyChoose/Starr.png',
  },
  {
    id: 3,
    title: '24/7 поддержка',
    description: 'Круглосуточная помощь на любом этапе аренды.',
    icon: 'public/images/WhyChoose/Clock.png',
  },
  {
    id: 4,
    title: 'Гибкие условия',
    description: 'Индивидуальные предложения и скидки для вас.',
    icon: 'public/images/WhyChoose/Screpka.png',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="why-choose-us">
      <div className="why-choose-us-container">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Почему выбрать нас?
        </motion.h2>
        <div className="advantages-grid">
          {advantages.map((advantage) => (
            <motion.div
              key={advantage.id}
              className="advantage-card"
              initial={{ opacity: 0, y: 50 }} // Появление снизу
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }} // Плавная анимация
              viewport={{ once: true }}
            >
              <div className="advantage-icon">
                <img src={advantage.icon} alt={advantage.title} style={{ width: 40, height: 40 }} />
              </div>
              <h3>{advantage.title}</h3>
              <p>{advantage.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
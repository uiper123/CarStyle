// src/components/RentalConditions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import './RentalConditions.css';

// Заглушка для условий проката
const rentalConditions = [
  {
    id: 1,
    title: 'Возраст и стаж',
    description: 'Водителю должно быть не менее 21 года, стаж вождения — от 2 лет.',
    icon: 'public/images/yslprock/ded.png', // Замени на свой путь
  },
  {
    id: 2,
    title: 'Документы',
    description: 'Паспорт, водительское удостоверение и банковская карта.',
    icon: 'public/images/yslprock/doccc.png',
  },
  {
    id: 3,
    title: 'Депозит',
    description: 'Необходим залог, который возвращается после аренды.',
    icon: 'public/images/yslprock/monye.png',
  },
  {
    id: 4,
    title: 'Страховка',
    description: 'Все автомобили застрахованы по КАСКО и ОСАГО.',
    icon: 'public/images/yslprock/carsh.png',
  },
];

const RentalConditions = () => {
  return (
    <section className="rental-conditions">
      <div className="conditions-container">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Условия проката
        </motion.h2>
        <p className="conditions-subtitle">
          Что нужно, чтобы арендовать автомобиль у нас
        </p>
        <div className="conditions-grid">
          {rentalConditions.map((condition) => (
            <motion.div
              key={condition.id}
              className="condition-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <div className="condition-icon">
                <img src={condition.icon} alt={condition.title} style={{ width: 40, height: 40 }} />
              </div>
              <h3>{condition.title}</h3>
              <p>{condition.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RentalConditions;
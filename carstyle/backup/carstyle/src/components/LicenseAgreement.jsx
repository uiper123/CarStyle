import React from 'react';
import './LicenseAgreement.css';

const LicenseAgreement = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="license-modal-overlay">
      <div className="license-modal">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Лицензионное соглашение</h2>
        <div className="license-content">
          <h3>1. Общие положения</h3>
          <p>1.1. Настоящее Пользовательское соглашение регулирует отношения между компанией CarStyle (далее — «Компания») и пользователем услуг (далее — «Клиент»).</p>
          
          <h3>2. Предмет соглашения</h3>
          <p>2.1. Компания предоставляет Клиенту доступ к сервису аренды автомобилей на условиях, описанных в данном соглашении.</p>
          
          <h3>3. Права и обязанности сторон</h3>
          <p>3.1. Клиент обязуется:</p>
          <ul>
            <li>Предоставлять достоверную информацию при регистрации</li>
            <li>Соблюдать правила аренды автомобилей</li>
            <li>Бережно относиться к арендуемому имуществу</li>
          </ul>
          
          <h3>4. Конфиденциальность</h3>
          <p>4.1. Компания обязуется защищать персональные данные Клиента согласно политике конфиденциальности.</p>
          
          <h3>5. Ответственность сторон</h3>
          <p>5.1. Стороны несут ответственность за нарушение условий настоящего соглашения в соответствии с действующим законодательством.</p>
        </div>
        <div className="license-actions">
          <button className="accept-button" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default LicenseAgreement; 
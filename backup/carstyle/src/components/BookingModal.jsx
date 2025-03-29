import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import ru from 'date-fns/locale/ru';
import "react-datepicker/dist/react-datepicker.css";
import './BookingModal.css';

// Регистрируем русскую локализацию
registerLocale('ru', ru);

const BookingModal = ({ car, isOpen, onClose }) => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [totalPrice, setTotalPrice] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    driverLicense: '',
    additionalServices: {
      insurance: false,
      childSeat: false,
      gps: false,
      additionalDriver: false
    }
  });

  // Расчет количества дней
  const calculateTotalDays = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1; // Минимум 1 день
  };

  // Пересчет общей стоимости при изменении дат или доп. услуг
  useEffect(() => {
    const days = calculateTotalDays();
    let total = car.price * days;

    const additionalCosts = {
      insurance: 1500,
      childSeat: 500,
      gps: 300,
      additionalDriver: 1000
    };

    Object.entries(formData.additionalServices).forEach(([service, isSelected]) => {
      if (isSelected) {
        total += additionalCosts[service] * days;
      }
    });

    setTotalPrice(total);
  }, [startDate, endDate, formData.additionalServices, car.price]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking submitted:', {
      ...formData,
      startDate,
      endDate,
      totalPrice,
      totalDays: calculateTotalDays()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Бронирование {car.brand} {car.model}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Период аренды</h3>
            <div className="date-picker-container">
              <div className="date-picker-wrapper">
                <label>Дата начала</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={new Date()}
                  locale="ru"
                  dateFormat="dd.MM.yyyy"
                  className="custom-datepicker"
                />
              </div>
              <div className="date-picker-wrapper">
                <label>Дата окончания</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  locale="ru"
                  dateFormat="dd.MM.yyyy"
                  className="custom-datepicker"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Персональные данные</h3>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Имя"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Фамилия"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                required
              />
              <input
                type="tel"
                placeholder="Телефон"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Номер водительского удостоверения"
                value={formData.driverLicense}
                onChange={e => setFormData({...formData, driverLicense: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Дополнительные услуги</h3>
            <div className="additional-services">
              <label>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.insurance}
                  onChange={e => setFormData({
                    ...formData,
                    additionalServices: {
                      ...formData.additionalServices,
                      insurance: e.target.checked
                    }
                  })}
                />
                Страховка (1500₽/день)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.childSeat}
                  onChange={e => setFormData({
                    ...formData,
                    additionalServices: {
                      ...formData.additionalServices,
                      childSeat: e.target.checked
                    }
                  })}
                />
                Детское кресло (500₽/день)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.gps}
                  onChange={e => setFormData({
                    ...formData,
                    additionalServices: {
                      ...formData.additionalServices,
                      gps: e.target.checked
                    }
                  })}
                />
                GPS-навигатор (300₽/день)
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.additionalServices.additionalDriver}
                  onChange={e => setFormData({
                    ...formData,
                    additionalServices: {
                      ...formData.additionalServices,
                      additionalDriver: e.target.checked
                    }
                  })}
                />
                Дополнительный водитель (1000₽/день)
              </label>
            </div>
          </div>

          <div className="total-section">
            <div className="total-details">
              <div className="total-row">
                <span>Количество дней:</span>
                <span>{calculateTotalDays()}</span>
              </div>
              <div className="total-row">
                <span>Базовая стоимость:</span>
                <span>{(car.price * calculateTotalDays()).toLocaleString()} ₽</span>
              </div>
              {Object.entries(formData.additionalServices).map(([service, isSelected]) => {
                if (isSelected) {
                  const prices = {
                    insurance: 1500,
                    childSeat: 500,
                    gps: 300,
                    additionalDriver: 1000
                  };
                  const serviceName = {
                    insurance: 'Страховка',
                    childSeat: 'Детское кресло',
                    gps: 'GPS-навигатор',
                    additionalDriver: 'Дополнительный водитель'
                  };
                  return (
                    <div className="total-row" key={service}>
                      <span>{serviceName[service]}:</span>
                      <span>{(prices[service] * calculateTotalDays()).toLocaleString()} ₽</span>
                    </div>
                  );
                }
                return null;
              })}
              <div className="total-row total-sum">
                <span>Итоговая стоимость:</span>
                <span>{totalPrice.toLocaleString()} ₽</span>
              </div>
            </div>
            <button type="submit" className="submit-button">Подтвердить бронирование</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal; 
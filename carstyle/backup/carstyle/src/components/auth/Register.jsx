import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';
import LicenseAgreement from '../LicenseAgreement';

const Register = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    captcha: '',
    termsAccepted: false
  });
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [isCaptchaChecked, setIsCaptchaChecked] = useState(false);

  // Генерация случайной капчи
  const generateCaptcha = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const text = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaptchaText(text);

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Добавляем градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a1b');
    gradient.addColorStop(1, '#2d2d2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Добавляем случайные линии
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.stroke();
    }

    // Добавляем текст с эффектом
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Добавляем тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Сбрасываем тень
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Добавляем шум
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1,
        1
      );
    }

    // Добавляем искажение
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() > 0.95) {
        data[i] = Math.random() * 255;
        data[i + 1] = Math.random() * 255;
        data[i + 2] = Math.random() * 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (showCaptcha) {
      generateCaptcha();
    }
  }, [showCaptcha]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'termsAccepted' && checked) {
      setShowCaptcha(true);
    } else if (name === 'termsAccepted' && !checked) {
      setShowCaptcha(false);
      setIsCaptchaValid(false);
      setIsCaptchaChecked(false);
      setFormData(prev => ({ ...prev, captcha: '' }));
    }

    if (name === 'captcha') {
      const inputValue = value.toUpperCase();
      if (inputValue === captchaText) {
        setIsCaptchaValid(true);
        setError('');
      } else {
        setIsCaptchaValid(false);
      }
    }
  };

  const handleCaptchaCheck = (e) => {
    setIsCaptchaChecked(e.target.checked);
    if (!e.target.checked) {
      setIsCaptchaValid(false);
      setFormData(prev => ({ ...prev, captcha: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.termsAccepted) {
      setError('Необходимо принять условия использования');
      return;
    }

    if (!isCaptchaChecked) {
      setError('Необходимо подтвердить, что вы не робот');
      return;
    }

    if (!isCaptchaValid) {
      setError('Необходимо правильно ввести капчу');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при регистрации');
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 500);
    } catch (err) {
      console.error('Register error:', err);
      setError(err.message);
    }
  };

  const handleLicenseClick = (e) => {
    e.preventDefault();
    setIsModalAnimating(true);
    setIsLicenseOpen(true);
  };

  const handleCloseLicense = () => {
    setIsModalAnimating(false);
    setTimeout(() => {
      setIsLicenseOpen(false);
    }, 300);
  };

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={`${styles.authForm} ${isSuccess ? styles.successAnimation : ''}`}>
        <h2>
          <svg viewBox="0 0 24 24">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
          </svg>
          Регистрация
        </h2>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.formGroup}>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Введите имя"
            required
          />
          <svg viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z"/>
          </svg>
        </div>

        <div className={styles.formGroup}>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Введите email"
            required
          />
          <svg viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Введите пароль"
            required
          />
          <svg viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Подтвердите пароль"
            required
          />
          <svg viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>

        <div className={styles.termsGroup}>
          <input
            type="checkbox"
            id="termsAccepted"
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
            className={styles.termsCheckbox}
            required
          />
          <label htmlFor="termsAccepted" className={styles.termsText}>
            Я согласен с{' '}
            <a 
              href="#" 
              className={styles.termsLink} 
              onClick={handleLicenseClick}
            >
              условиями использования
            </a>
            {' '}и{' '}
            <a 
              href="#" 
              className={styles.termsLink} 
              onClick={handleLicenseClick}
            >
              политикой конфиденциальности
            </a>
          </label>
        </div>

        <div className={`${styles.captchaBlock} ${showCaptcha ? styles.visible : ''}`}>
          <div className={styles.captchaHeader}>
            <input
              type="checkbox"
              id="captchaCheck"
              checked={isCaptchaChecked}
              onChange={handleCaptchaCheck}
              className={styles.captchaCheckbox}
              required
            />
            <h3 className={styles.captchaTitle}>Подтвердите, что вы не робот</h3>
          </div>
          <div className={styles.captchaContent}>
            <input
              type="text"
              id="captcha"
              name="captcha"
              value={formData.captcha}
              onChange={handleChange}
              placeholder="Введите капчу"
              required
              className={styles.captchaInput}
              maxLength={6}
              disabled={!isCaptchaChecked}
            />
            <canvas
              ref={canvasRef}
              width={120}
              height={40}
              className={styles.captchaImage}
              onClick={generateCaptcha}
              title="Нажмите для обновления капчи"
            />
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
          Зарегистрироваться
          <svg viewBox="0 0 24 24">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </button>

        <p className={styles.switchAuth}>
          Уже есть аккаунт?{' '}
          <span onClick={() => navigate('/login')} className={styles.link}>
            Войти
            <svg viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </span>
        </p>
      </form>

      <LicenseAgreement 
        isOpen={isLicenseOpen} 
        onClose={handleCloseLicense}
        className={isModalAnimating ? styles.modalEnter : styles.modalExit}
      />
    </div>
  );
};

export default Register; 
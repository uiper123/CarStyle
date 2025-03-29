import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEdit, FaCar, FaHistory, FaCamera, FaKey, FaIdCard, FaPassport, FaLock, FaShieldAlt } from 'react-icons/fa';
import styles from './Profile.module.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import UserOrders from './UserOrders';

const Profile = () => {
  const { user, login, updateUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [profileData, setProfileData] = useState({
    user_id: '',
    firstname: '',
    lastname: '',
    middlename: '',
    email: '',
    phone: '',
    avatar_url: null,
    driver_license: '',
    passport_series: '',
    passport_number: '',
    status: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      if (response.data.avatar_url) {
        setAvatarPreview(response.data.avatar_url);
      } else {
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Новые пароли не совпадают');
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 3000);
      return;
    }

    try {
      const response = await axios.put('http://localhost:3002/api/users/password', passwordData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setSuccess('Пароль успешно изменен');
        setShowSuccess(true);
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setError('Ошибка при изменении пароля');
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Не используем FormData из-за проблем с кодировкой
      const userData = {
        firstname: profileData.firstname || '',
        lastname: profileData.lastname || '',
        middlename: profileData.middlename || '',
        phone: profileData.phone || '',
        driver_license: profileData.driver_license || '',
        passport_series: profileData.passport_series || '',
        passport_number: profileData.passport_number || ''
      };

      console.log('Отправляемые данные:', userData);

      const response = await axios.put('http://localhost:3002/api/user/profile', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Если есть новый аватар, загружаем его отдельно
      if (avatar) {
        await uploadAvatar();
      }

      if (response.data.user) {
        setProfileData(response.data.user);
      } else {
        // Если сервер не вернул обновленные данные, запросим их
        await fetchProfile();
      }
      
      setIsEditing(false);
      toast.success('Профиль успешно обновлен');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        toast.error('Сессия истекла. Пожалуйста, войдите снова.');
      } else {
        toast.error('Ошибка при обновлении профиля');
      }
    }
  };

  // Функция для загрузки аватара
  const uploadAvatar = async () => {
    try {
      if (!avatar) return;
      
      const formData = new FormData();
      formData.append('avatar', avatar);
      
      const response = await axios.post('http://localhost:3002/api/user/avatar', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.user && response.data.user.avatar_url) {
        setAvatarPreview(response.data.user.avatar_url);
        // Обновляем данные пользователя в контексте авторизации
        updateUser({
          avatar_url: response.data.user.avatar_url
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Не удалось обновить фото профиля');
    }
  };

  if (loading) {
    return <div className={styles.profileContainer}>Загрузка...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.userIcon}>
            {avatarPreview ? (
              <img 
                src={avatarPreview}
                alt="User avatar" 
                className={styles.avatarImage}
              />
            ) : (
              <FaUser className={styles.defaultAvatar} />
            )}
            <div className={styles.avatarUpload}>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <label htmlFor="avatar">
                <FaCamera /> Изменить фото
              </label>
            </div>
          </div>
          <div className={styles.userInfo}>
            <h2>{profileData.firstname ? `${profileData.lastname} ${profileData.firstname} ${profileData.middlename}` : user?.name || 'Пользователь'}</h2>
            <p>{profileData.email || user?.email}</p>
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(!isEditing)}
            >
              <FaEdit /> {isEditing ? 'Отмена' : 'Редактировать'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {showError && (
            <div className={`${styles.error} ${styles.fadeIn}`}>
              {error}
            </div>
          )}
          {showSuccess && (
            <div className={`${styles.success} ${styles.fadeIn}`}>
              {success}
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Фамилия *</label>
            <input
              type="text"
              name="lastname"
              value={profileData.lastname || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Введите вашу фамилию"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Имя *</label>
            <input
              type="text"
              name="firstname"
              value={profileData.firstname || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Введите ваше имя"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Отчество</label>
            <input
              type="text"
              name="middlename"
              value={profileData.middlename || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Введите ваше отчество"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
            />
          </div>

          <div className={styles.formGroup}>
            <label>Телефон *</label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone || ''}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </div>

          <div className={styles.sectionDivider}>
            <h3 className={styles.sectionTitle}>
              <FaIdCard /> Водительское удостоверение
              <span className={styles.encryptedBadge}>
                <FaLock /> Зашифровано
              </span>
            </h3>
            <div className={styles.securityNotice}>
              <FaShieldAlt className={styles.shieldIcon} />
              <p>Эти данные зашифрованы для вашей безопасности</p>
            </div>
            <div className={styles.formGroup}>
              <label>Номер ВУ <FaLock className={styles.smallLock} /></label>
              <input
                type="text"
                name="driver_license"
                value={profileData.driver_license || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Введите номер водительского удостоверения"
                className={styles.secureInput}
              />
            </div>
          </div>

          <div className={styles.sectionDivider}>
            <h3 className={styles.sectionTitle}>
              <FaPassport /> Паспортные данные
              <span className={styles.encryptedBadge}>
                <FaLock /> Зашифровано
              </span>
            </h3>
            <div className={styles.formGroup}>
              <label>Серия паспорта <FaLock className={styles.smallLock} /></label>
              <input
                type="text"
                name="passport_series"
                value={profileData.passport_series || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Введите серию паспорта"
                className={styles.secureInput}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Номер паспорта <FaLock className={styles.smallLock} /></label>
              <input
                type="text"
                name="passport_number"
                value={profileData.passport_number || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Введите номер паспорта"
                className={styles.secureInput}
              />
            </div>
          </div>

          <div className={styles.sectionDivider}>
            <h3 className={styles.sectionTitle}>
              <FaKey /> Смена пароля
            </h3>
            {!isChangingPassword ? (
              <button 
                className={styles.editButton}
                onClick={() => setIsChangingPassword(true)}
              >
                Изменить пароль
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label>Текущий пароль</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Новый пароль</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Подтвердите новый пароль</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className={styles.buttonGroup}>
                  <button type="submit" className={styles.saveButton}>
                    Сохранить пароль
                  </button>
                  <button 
                    type="button" 
                    className={styles.editButton}
                    onClick={() => setIsChangingPassword(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>

          {isEditing && (
            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.saveButton}>
                Сохранить
              </button>
            </div>
          )}
        </form>
      </div>
      
      <UserOrders />
    </div>
  );
};

export default Profile;
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import styles from './UserIcon.module.css';

const UserIcon = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarUrl = user?.avatar_url || null;

  return (
    <div className={styles.userIconContainer} ref={menuRef}>
      <button
        className={styles.iconButton}
        onClick={() => setIsOpen(!isOpen)}
        title={user?.name || 'Профиль'}
      >
        <div className={styles.avatarContainer}>
          {avatarUrl ? (
            <img 
              src={avatarUrl}
              alt="User avatar" 
              className={styles.avatarImage}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
                e.target.parentNode.innerHTML = '<svg><use href="#user-icon"></use></svg>';
              }}
            />
          ) : (
            <FaUser />
          )}
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.userInfo}>
            <div className={styles.dropdownAvatarContainer}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl}
                  alt="User avatar" 
                  className={styles.avatarImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                    e.target.parentNode.innerHTML = '<svg><use href="#user-icon"></use></svg>';
                  }}
                />
              ) : (
                <FaUser className={styles.avatarIcon} />
              )}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>
          <div className={styles.divider} />
          <button
            className={styles.menuItem}
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
          >
            <FaCog /> Настройки профиля
          </button>
          <button className={styles.menuItem} onClick={handleLogout}>
            <FaSignOutAlt /> Выйти
          </button>
        </div>
      )}
      
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <symbol id="user-icon" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </symbol>
      </svg>
    </div>
  );
};

export default UserIcon; 
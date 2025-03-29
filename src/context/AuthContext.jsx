import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (authToken) => {
    try {
      console.log('Fetching current user profile...');
      const response = await axios.get('http://localhost:3002/api/user/profile', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      // Обновляем данные пользователя
      const userData = response.data;
      console.log('User profile fetched:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // В случае неудачи - сбросить данные авторизации
      if (error.response?.status === 401) {
        console.log('Token expired or invalid, logging out...');
        logout();
      }
      return null;
    }
  };

  useEffect(() => {
    // Проверяем наличие сохраненного пользователя при загрузке
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    console.log('Initial auth state:', { savedUser, savedToken });
    
    if (savedToken) {
      setToken(savedToken);
      
      if (savedUser) {
        try {
          // Сразу устанавливаем сохраненного пользователя, чтобы не было мерцания
          const parsedUser = JSON.parse(savedUser);
          console.log('Restored saved user:', parsedUser);
          setUser(parsedUser);
          
          // И после этого запрашиваем актуальные данные
          fetchCurrentUser(savedToken).finally(() => {
            setLoading(false);
          });
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('user');
          setLoading(false);
        }
      } else {
        // Если сохранен только токен, запрашиваем данные пользователя
        fetchCurrentUser(savedToken).finally(() => {
          setLoading(false);
        });
      }
    } else {
      console.log('No saved token found');
      setLoading(false);
    }
  }, []);

  const login = (userData, authToken) => {
    console.log('Logging in user with data:', userData);
    console.log('User role:', userData?.role);
    // Обновляем данные пользователя в состоянии и localStorage
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    
    // Сохраняем роль пользователя в localStorage
    if (userData && userData.role) {
      console.log('Saving user role to localStorage:', userData.role);
      localStorage.setItem('role', userData.role);
    } else {
      console.log('No role found in userData');
    }
  };

  const updateUser = (newData) => {
    console.log('Updating user data:', newData);
    console.log('Current user role:', user?.role);
    // Обновляем только переданные поля
    const updatedUser = { ...user, ...newData };
    console.log('Updated user role:', updatedUser.role);
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    console.log('Logging out user');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  // Check if user has a specific role
  const hasRole = (requiredRole) => {
    const hasRole = user && user.role === requiredRole;
    console.log(`Checking role ${requiredRole}:`, hasRole);
    return hasRole;
  };

  // Check if user is admin
  const isAdmin = () => {
    const isAdmin = hasRole('admin');
    console.log('Checking admin status:', isAdmin);
    return isAdmin;
  };

  // Check if user is employee
  const isEmployee = () => {
    const isEmployee = hasRole('employee');
    console.log('Checking employee status:', isEmployee);
    return isEmployee;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      updateUser, 
      loading, 
      fetchCurrentUser,
      hasRole,
      isAdmin,
      isEmployee
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
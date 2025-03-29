// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import CarCatalog from './components/CarCatalog';
import AboutUs from './components/AboutUs';
import Contacts from './components/Contacts';
import AdditionalSections from './components/AdditionalSections';
import WhyChooseUs from './components/WhyChooseUs';
import ReviewsSection from './components/ReviewsSection';
import RentalConditions from './components/RentalConditions';
import AssistantManager from './components/AssistantManager';
import Footer from './components/Footer';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/Profile';
import Preloader from './components/Preloader';
import CarDetail from './components/CarDetail';
import AdminDashboard from './components/admin/AdminDashboard';
import { ReviewsProvider } from './context/ReviewsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Защищенный маршрут
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

// Основное содержимое приложения
const AppContent = () => {
  const { user, token, fetchCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    const preloadAvatar = async () => {
      if (token) {
        await fetchCurrentUser(token);
      }
      
      const timer1 = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      const timer2 = setTimeout(() => {
        setShowContent(true);
      }, 5000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    };

    preloadAvatar();
  }, [token, fetchCurrentUser]);

  // Функция предварительной загрузки изображения
  const preloadImage = (src) => {
    if (!src || avatarLoaded) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setAvatarLoaded(true);
        resolve(src);
      };
      img.onerror = () => {
        console.error(`Не удалось загрузить изображение: ${src}`);
        reject(new Error(`Не удалось загрузить изображение: ${src}`));
      };
    });
  };

  useEffect(() => {
    if (user?.avatar_url && !avatarLoaded) {
      preloadImage(user.avatar_url)
        .then(() => console.log('Аватар пользователя загружен'))
        .catch(err => console.error(err));
    }
  }, [user?.avatar_url, avatarLoaded]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <ReviewsProvider>
        <div className="app">
          {isLoading ? <Preloader isLoading={isLoading} /> : null}
          <div className={`app-content ${showContent ? 'fade-in' : ''}`}>
            <Header />
            <main>
              <Routes>
                {/* Главная страница (публичная) */}
                <Route
                  path="/"
                  element={
                    <>
                      <Hero />
                      <AdditionalSections />
                      <WhyChooseUs />
                      <ReviewsSection />
                      <RentalConditions />
                    </>
                  }
                />

                {/* Публичные маршруты */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/catalog" element={<CarCatalog />} />
                <Route path="/cars/:id" element={<CarDetail />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/contacts" element={<Contacts />} />

                {/* Защищенные маршруты */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Маршрут администратора */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Маршрут по умолчанию */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
            <AssistantManager />
          </div>
        </div>
      </ReviewsProvider>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
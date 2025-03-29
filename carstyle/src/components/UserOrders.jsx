import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import './UserOrders.css';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${apiUrl}/api/orders/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        setError('Не удалось загрузить заказы');
        toast.error('Ошибка при загрузке заказов');
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setError('Ошибка при загрузке заказов');
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'rented':
        return 'user-order-status rented';
      case 'pending':
        return 'user-order-status pending';
      case 'active':
        return 'user-order-status active';
      case 'completed':
        return 'user-order-status completed';
      case 'cancelled':
        return 'user-order-status cancelled';
      default:
        return 'user-order-status';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'rented':
        return 'В аренде у другого клиента';
      case 'pending':
        return 'На рассмотрении';
      case 'active':
        return 'Активный';
      case 'completed':
        return 'Завершен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  if (loading) return <div className="user-orders-loading">Загрузка...</div>;
  if (error) return <div className="user-orders-error">{error}</div>;

  return (
    <div className="user-orders-section">
      <h2 className="user-orders-title">Мои заказы</h2>
      {orders.length === 0 ? (
        <div className="user-orders-empty">
          У вас пока нет заказов
        </div>
      ) : (
        <div className="user-orders-list">
          {orders.map((order) => (
            <div key={order.order_id} className="user-order-card">
              <div className="user-order-header">
                <div className="user-order-id">Заказ #{order.user_order_number}</div>
                <div className={getStatusBadgeClass(order.car_status)}>
                  {getStatusText(order.car_status)}
                </div>
              </div>
              <div className="user-order-content">
                <div className="user-order-car">
                  <h3>{order.brand_name} {order.model_name}</h3>
                  <p>{order.year} год</p>
                </div>
                <div className="user-order-dates">
                  <div className="user-order-date">
                    <span className="date-label">Выдача:</span>
                    <span className="date-value">{formatDate(order.issue_date)}</span>
                  </div>
                  <div className="user-order-date">
                    <span className="date-label">Возврат:</span>
                    <span className="date-value">{formatDate(order.return_date)}</span>
                  </div>
                </div>
                <div className="user-order-price">
                  <span className="price-label">Сумма заказа:</span>
                  <span className="price-value">{formatPrice(order.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrders;

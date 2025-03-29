import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const RequestManagement = () => {
  const [rentalRequests, setRentalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [carDetails, setCarDetails] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchRentalRequests();
  }, []);

  const fetchRentalRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      console.log("API URL:", apiUrl); // Для отладки
      
      const response = await axios.get(`${apiUrl}/api/admin/rentals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Rental requests response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setRentalRequests(response.data);
      } else {
        console.error("API response is not an array:", response.data);
        setRentalRequests([]);
        toast.error('Данные заявок получены в неверном формате');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      toast.error('Ошибка при загрузке заявок на аренду');
      setRentalRequests([]);
      setLoading(false);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/rentals/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Request details response:", response.data); // Для отладки
      
      if (response.data && response.data.rental) {
        setSelectedRequest(response.data.rental);
        setUserDetails(response.data.user || null);
        setCarDetails(response.data.car || null);
        setDocuments(Array.isArray(response.data.documents) ? response.data.documents : []);
        setShowDetailsModal(true);
      } else {
        console.error("Invalid rental details response:", response.data);
        toast.error('Не удалось получить детали заявки');
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Ошибка при загрузке деталей заявки');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      if (!selectedRequest || !selectedRequest.id) {
        toast.error('Ошибка: Данные заявки недоступны');
        return;
      }
      
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.put(
        `${apiUrl}/api/admin/rentals/${selectedRequest.id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowDetailsModal(false);
      toast.success(`Статус заявки успешно обновлен: ${getStatusLabel(status)}`);
      fetchRentalRequests();
    } catch (error) {
      console.error('Error updating rental status:', error);
      toast.error(error.response?.data?.message || 'Ошибка при обновлении статуса заявки');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'В ожидании';
      case 'approved':
        return 'Одобрена';
      case 'active':
        return 'Активна';
      case 'completed':
        return 'Завершена';
      case 'cancelled':
        return 'Отменена';
      case 'rejected':
        return 'Отклонена';
      default:
        return status || 'Неизвестно';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Заявки на аренду</h2>
        <button className="admin-button" onClick={fetchRentalRequests}>
          Обновить
        </button>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Пользователь</th>
              <th>Автомобиль</th>
              <th>Даты</th>
              <th>Стоимость</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(rentalRequests) || rentalRequests.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  Заявки не найдены
                </td>
              </tr>
            ) : (
              rentalRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.id}</td>
                  <td>{request.username || 'Не указан'}</td>
                  <td>{request.car_name || 'Не указан'}</td>
                  <td>
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </td>
                  <td>{request.total_cost || 0} руб.</td>
                  <td>
                    <span className={`request-status ${getStatusClass(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-button"
                      onClick={() => fetchRequestDetails(request.id)}
                    >
                      Детали
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ width: '600px' }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Детали заявки #{selectedRequest.id}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="request-detail-section">
                <h4>Информация о заявке</h4>
                <div className="request-details">
                  <p>
                    <strong>Дата создания:</strong> {formatDate(selectedRequest.created_at)}
                  </p>
                  <p>
                    <strong>Период аренды:</strong> {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)}
                  </p>
                  <p>
                    <strong>Стоимость:</strong> {selectedRequest.total_cost || 0} руб.
                  </p>
                  <p>
                    <strong>Статус:</strong> 
                    <span className={`request-status ${getStatusClass(selectedRequest.status)}`}>
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </p>
                </div>
              </div>

              {userDetails && (
                <div className="request-detail-section">
                  <h4>Информация о клиенте</h4>
                  <div className="user-details">
                    <p><strong>Имя:</strong> {userDetails.firstname || ''} {userDetails.lastname || ''}</p>
                    <p><strong>Email:</strong> {userDetails.email || 'Не указан'}</p>
                    <p><strong>Телефон:</strong> {userDetails.phone || 'Не указан'}</p>
                    <p><strong>Адрес:</strong> {userDetails.address || 'Не указан'}</p>
                  </div>
                </div>
              )}

              {Array.isArray(documents) && documents.length > 0 && (
                <div className="request-detail-section">
                  <h4>Документы клиента</h4>
                  <div className="documents-list">
                    {documents.map(doc => (
                      <div key={doc.id} className="document-item">
                        <p><strong>{doc.type === 'passport' ? 'Паспорт' : 'Водительское удостоверение'}</strong></p>
                        {doc.type === 'passport' && (
                          <p>Серия и номер: {doc.series_passport || ''} {doc.nomer_passport || ''}</p>
                        )}
                        {doc.type === 'driver_license' && (
                          <p>Категории: {doc.category || 'Не указаны'}</p>
                        )}
                        {doc.document_url && (
                          <a 
                            href={doc.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="admin-button"
                            style={{ marginTop: '10px' }}
                          >
                            Просмотреть документ
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {carDetails && (
                <div className="request-detail-section">
                  <h4>Информация об автомобиле</h4>
                  <div className="car-details">
                    <p>
                      <strong>Автомобиль:</strong> {carDetails.brand || ''} {carDetails.model || ''} ({carDetails.year || ''})
                    </p>
                    <p><strong>Цвет:</strong> {carDetails.color || 'Не указан'}</p>
                    <p><strong>Цена за день:</strong> {carDetails.price || 0} руб.</p>
                    <p><strong>Статус автомобиля:</strong> {getStatusLabel(carDetails.status)}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="request-actions">
                  <button
                    className="admin-button"
                    onClick={() => handleUpdateStatus('approved')}
                    style={{ marginRight: '10px' }}
                  >
                    Одобрить заявку
                  </button>
                  <button
                    className="admin-button secondary"
                    onClick={() => handleUpdateStatus('rejected')}
                  >
                    Отклонить заявку
                  </button>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-button secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Закрыть
              </button>
              {selectedRequest.status === 'approved' && (
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => handleUpdateStatus('active')}
                >
                  Подтвердить выдачу автомобиля
                </button>
              )}
              {selectedRequest.status === 'active' && (
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => handleUpdateStatus('completed')}
                >
                  Завершить аренду
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement; 
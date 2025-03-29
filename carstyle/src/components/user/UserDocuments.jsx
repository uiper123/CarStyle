import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { FaLock, FaKey, FaShieldAlt } from 'react-icons/fa';
import './UserDocuments.css';

const UserDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('token');
            
            console.log('Fetching documents...');
            const response = await axios.get(`${apiUrl}/api/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Documents response:', response.data);
            setDocuments(response.data.documents);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching documents:', error);
            console.error('Error details:', error.response?.data);
            setError('Ошибка при загрузке документов');
            setLoading(false);
        }
    };

    const handleViewDocument = async (orderId) => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '';
            const token = localStorage.getItem('token');
            
            console.log('Fetching document for order:', orderId);
            
            // Используем альтернативный маршрут с префиксом /alt/
            const response = await axios.get(`${apiUrl}/api/documents/alt/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success && response.data.document) {
                console.log('Document received:', response.data.document.document_number);
                setSelectedDocument(response.data.document);
                setShowDocumentModal(true);
            } else {
                console.error('Invalid document response:', response.data);
                toast.error('Не удалось загрузить документ');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
            const errorMessage = error.response?.data?.message || 'Ошибка при загрузке документа';
            toast.error(errorMessage);
        }
    };

    const handleDownloadDocument = (document) => {
        // Создаем текстовый файл с содержимым документа
        const blob = new Blob([document.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.document_number}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru });
    };

    if (loading) return <div className="documents-loading">Загрузка...</div>;
    if (error) return <div className="documents-error">{error}</div>;

    return (
        <div className="documents-section">
            <h2 className="documents-title">Мои документы</h2>
            <div className="encryption-notice">
                <FaShieldAlt className="encryption-icon" />
                <p>Ваши документы защищены шифрованием AES-256</p>
            </div>
            
            {documents.length === 0 ? (
                <p className="documents-empty">У вас пока нет документов</p>
            ) : (
                <div className="documents-list">
                    {documents.map((doc) => (
                        <div key={doc.document_id} className="document-card">
                            <div className="document-info">
                                <div className="document-header">
                                    <h3 className="document-number">{doc.document_number}</h3>
                                    <span className="encrypted-badge">
                                        <FaLock className="lock-icon" /> Зашифровано
                                    </span>
                                </div>
                                <p className="document-car">
                                    {doc.brand_name} {doc.model_name} ({doc.year})
                                </p>
                                <p className="document-dates">
                                    Срок аренды: с {formatDate(doc.issue_date)} по {formatDate(doc.return_date)}
                                </p>
                                <p className="document-status">
                                    Статус: <span className={`status-badge ${doc.status_name.toLowerCase()}`}>
                                        {doc.status_name}
                                    </span>
                                </p>
                            </div>
                            <div className="document-actions">
                                <button
                                    className="document-button view"
                                    onClick={() => handleViewDocument(doc.order_id)}
                                >
                                    <FaKey className="button-icon" /> Просмотр
                                </button>
                                <button
                                    className="document-button download"
                                    onClick={() => handleDownloadDocument(doc)}
                                >
                                    Скачать
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно просмотра документа */}
            {showDocumentModal && selectedDocument && (
                <div className="document-modal-backdrop">
                    <div className="document-modal">
                        <div className="document-modal-header">
                            <h3 className="document-modal-title">
                                Документ №{selectedDocument.document_number}
                                <span className="encrypted-badge modal-badge">
                                    <FaLock className="lock-icon" /> Защищено шифрованием
                                </span>
                            </h3>
                            <button
                                className="document-modal-close"
                                onClick={() => setShowDocumentModal(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="document-modal-content">
                            <div className="security-notice">
                                <FaShieldAlt className="shield-icon" />
                                <p>Документ содержит зашифрованные персональные данные для вашей защиты</p>
                            </div>
                            <pre className="document-content">
                                {selectedDocument.content}
                            </pre>
                        </div>
                        <div className="document-modal-footer">
                            <button
                                className="document-button download"
                                onClick={() => handleDownloadDocument(selectedDocument)}
                            >
                                Скачать
                            </button>
                            <button
                                className="document-button close"
                                onClick={() => setShowDocumentModal(false)}
                            >
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDocuments; 
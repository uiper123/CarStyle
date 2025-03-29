// src/components/AssistantManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateResponse } from '../services/geminiService';
import './AssistantManager.css';
import { useNavigate } from 'react-router-dom';

const AssistantManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: 'Здравствуйте! Я ваш персональный менеджер. Чем могу помочь?', isUser: false },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Проверка доступности API при монтировании компонента
  useEffect(() => {
    checkApiAvailability();
  }, []);

  const checkApiAvailability = async () => {
    try {
      const response = await generateResponse('test');
      setIsOnline(true);
    } catch (error) {
      console.error('API is not available:', error);
      setIsOnline(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: 'Извините, сервис временно недоступен. Пожалуйста, попробуйте позже.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  const clearChat = () => {
    setMessages([
      { id: 1, text: 'Здравствуйте! Я ваш персональный менеджер. Чем могу помочь?', isUser: false }
    ]);
  };

  const formatMessage = (text) => {
    if (typeof text !== 'string') {
      return text;
    }

    // Проверяем наличие ссылки на автомобиль в формате /cars/{id}
    const carLinkRegex = /\/cars\/\d+/g;
    const parts = text.split(carLinkRegex);
    const matches = text.match(carLinkRegex) || [];

    return parts.map((part, index) => {
      if (index < matches.length) {
        const carLink = matches[index];
        return (
          <React.Fragment key={index}>
            {part}
            <a 
              href={carLink}
              onClick={(e) => {
                e.preventDefault();
                navigate(carLink);
              }}
              style={{ color: '#8F8F8F', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Посмотреть автомобиль
            </a>
          </React.Fragment>
        );
      }
      return part;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isOnline) return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Проверяем, является ли запрос о просмотре автомобилей
    const carRequestKeywords = ['показать', 'автомобили', 'машины', 'каталог', 'автопарк', 'доступные', 'есть', 'наличие'];
    const isCarRequest = carRequestKeywords.some(keyword => 
      inputMessage.toLowerCase().includes(keyword)
    );

    if (isCarRequest) {
      const redirectMessage = {
        id: messages.length + 2,
        text: 'Я перенаправлю вас в наш каталог автомобилей, где вы сможете увидеть все доступные модели.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, redirectMessage]);
      setTimeout(() => {
        navigate('/catalog');
      }, 2000);
      setIsTyping(false);
      return;
    }

    try {
      const response = await generateResponse(inputMessage);
      const managerResponse = {
        id: messages.length + 2,
        text: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, managerResponse]);
    } catch (error) {
      console.error('Error getting response:', error);
      setIsOnline(false);
      const errorResponse = {
        id: messages.length + 2,
        text: 'Извините, произошла ошибка при обработке вашего запроса. Сервис временно недоступен.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="assistant-manager">
      {/* Кнопка для открытия/закрытия виджета */}
      <motion.button
        className="assistant-button"
        onClick={toggleAssistant}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {isOpen ? '✖' : '💬'}
      </motion.button>

      {/* Всплывающий виджет */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="assistant-widget"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="assistant-header">
              <div className="manager-status">
                <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
                <h3>Персональный менеджер</h3>
              </div>
              <div className="header-actions">
                <button className="clear-chat-button" onClick={clearChat}>
                  Очистить чат
                </button>
                <p className="status-text">{isOnline ? 'Онлайн' : 'Оффлайн'}</p>
              </div>
            </div>
            <div className="assistant-content">
              <div className="chat-messages">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`chat-message ${message.isUser ? 'user-message' : 'bot-message'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: message.id * 0.1 }}
                  >
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ 
                        __html: message.formatted ? formatMessage(message.text) : message.text 
                      }}
                    />
                    <div className="message-time">{message.timestamp}</div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="chat-input">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isOnline ? "Введите сообщение..." : "Сервис временно недоступен"}
                  disabled={!isOnline}
                />
                <button type="submit" disabled={!isOnline || !inputMessage.trim()}>
                  Отправить
                </button>
              </form>
              <div className="assistant-actions">
                <button className="action-button" onClick={() => window.location.href = '/catalog'}>
                  Посмотреть каталог
                </button>
                <button className="action-button" onClick={() => window.location.href = '/contacts'}>
                  Контакты
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssistantManager;
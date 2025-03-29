import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import './OrdersManagement.css';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userRole, setUserRole] = useState('employee'); // Добавляем состояние для хранения роли пользователя
  
  // Фильтры
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    priceFrom: '',
    priceTo: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);

  // Добавляем повторную загрузку роли через 2 секунды
  useEffect(() => {
    fetchOrders();
    getUserRole();
    
    // Повторная загрузка роли через 1 секунду и 3 секунды для диагностики
    const timer1 = setTimeout(() => {
      console.log('Checking role after 1 second:');
      console.log('- State role:', userRole);
      console.log('- LocalStorage role:', localStorage.getItem('userRole'));
    }, 1000);
    
    const timer2 = setTimeout(() => {
      getUserRole();
      console.log('Rechecking role after 3 seconds:');
      console.log('- State role:', userRole);
      console.log('- LocalStorage role:', localStorage.getItem('userRole'));
    }, 3000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      
      // Эндпоинт для получения заказов доступный и администраторам, и сотрудникам
      const response = await axios.get(`${apiUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
      } else {
        setError('Не удалось загрузить заказы');
        toast.error('Ошибка при загрузке заказов');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Ошибка при загрузке заказов');
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let result = [...orders];
    
    // Фильтр по ключевому слову
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter(order => 
        order.firstname?.toLowerCase().includes(keyword) ||
        order.lastname?.toLowerCase().includes(keyword) ||
        order.phone?.toLowerCase().includes(keyword) ||
        order.email?.toLowerCase().includes(keyword) ||
        order.brand_name?.toLowerCase().includes(keyword) ||
        order.model_name?.toLowerCase().includes(keyword) ||
        order.license_plate?.toLowerCase().includes(keyword) ||
        order.vin?.toLowerCase().includes(keyword)
      );
    }
    
    // Фильтр по статусу
    if (filters.status !== 'all') {
      result = result.filter(order => 
        order.status_name.toLowerCase() === filters.status
      );
    }
    
    // Фильтр по дате начала
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      result = result.filter(order => 
        isAfter(new Date(order.issue_date), dateFrom) || 
        new Date(order.issue_date).getTime() === dateFrom.getTime()
      );
    }
    
    // Фильтр по дате окончания
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      // Устанавливаем конец дня
      dateTo.setHours(23, 59, 59, 999);
      result = result.filter(order => 
        isBefore(new Date(order.return_date), dateTo) || 
        new Date(order.return_date).getTime() === dateTo.getTime()
      );
    }
    
    // Фильтр по минимальной цене
    if (filters.priceFrom) {
      const priceFrom = parseFloat(filters.priceFrom);
      result = result.filter(order => order.price >= priceFrom);
    }
    
    // Фильтр по максимальной цене
    if (filters.priceTo) {
      const priceTo = parseFloat(filters.priceTo);
      result = result.filter(order => order.price <= priceTo);
    }
    
    setFilteredOrders(result);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      keyword: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      priceFrom: '',
      priceTo: ''
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole') || 'staff';
      
      const statusToSend = newStatus.toLowerCase();
      
      // Используем единый эндпоинт для всех ролей, но с разными параметрами
      const url = `${apiUrl}/api/orders/${orderId}/status`;
      
      console.log('Updating order status:', {
        orderId,
        newStatus: statusToSend,
        url,
        userRole,
        token: token ? 'present' : 'missing'
      });
      
      // Добавляем роль пользователя в payload
      await axios.put(url, 
        { 
          status: statusToSend,
          userRole: userRole 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Статус заказа успешно обновлен');
      fetchOrders();
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      console.error('Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers
      });
      toast.error('Ошибка при обновлении статуса заказа');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      // Проверяем роль пользователя перед удалением
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'admin') {
        toast.error('У вас нет прав для удаления заказов');
        setShowDeleteModal(false);
        return;
      }
      
      console.log('Attempting to delete order ID:', orderId);
      
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      try {
        const response = await axios.delete(`${apiUrl}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Delete response:', response.data);
        
        if (response.data.success) {
          toast.success('Заказ успешно удален');
          // Обновляем список заказов после удаления
          fetchOrders();
          setShowDeleteModal(false);
        } else {
          console.error('API reported failure:', response.data);
          toast.error(response.data.message || 'Ошибка при удалении заказа');
        }
      } catch (axiosError) {
        console.error('Full error details:', axiosError);
        
        if (axiosError.response) {
          // Сервер ответил с кодом ошибки
          console.error('Error response data:', axiosError.response.data);
          console.error('Error response status:', axiosError.response.status);
          console.error('Error response headers:', axiosError.response.headers);
          
          // Определяем конкретную причину ошибки
          if (axiosError.response.status === 400) {
            const errorMessage = axiosError.response.data?.message || '';
            
            if (errorMessage.includes('активный заказ')) {
              toast.error('Невозможно удалить активный заказ. Сначала измените статус заказа на "Завершен" или "Отменен".');
            } else {
              toast.error('Заказ не может быть удален. Возможно, он связан с другими данными.');
            }
          } else {
            // Показываем сообщение из API если оно есть
            const errorMessage = 
              axiosError.response.data?.message || 
              axiosError.response.data?.error || 
              `Ошибка при удалении заказа (${axiosError.response.status})`;
            
            toast.error(errorMessage);
          }
        } else if (axiosError.request) {
          // Запрос был отправлен, но не получен ответ
          console.error('No response received:', axiosError.request);
          toast.error('Сервер не отвечает. Пожалуйста, проверьте соединение.');
        } else {
          // Произошла ошибка при настройке запроса
          console.error('Error message:', axiosError.message);
          toast.error(`Ошибка при выполнении запроса: ${axiosError.message}`);
        }
      }
    } catch (error) {
      console.error('General error in handleDeleteOrder:', error);
      toast.error('Непредвиденная ошибка при удалении заказа');
    } finally {
      setLoading(false);
    }
  };

  // Генерируем локальный документ
  const generateLocalDocument = async (order) => {
    try {
      const html2pdf = await import('html2pdf.js');
      if (!order) return null;
      
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 30px;">Договор аренды автомобиля</h1>
          
          <p style="margin-bottom: 20px;">г. Москва</p>
          <p style="margin-bottom: 20px;">${format(new Date(), 'dd MMMM yyyy', { locale: ru })}</p>
          
          <p style="margin-bottom: 20px;">
            ${companyInfo.name}, именуемое в дальнейшем "Арендодатель", в лице директора ${companyInfo.director},
            действующего на основании Устава, с одной стороны, и ${clientFullName}, именуемый в дальнейшем "Арендатор",
            с другой стороны, заключили настоящий договор о нижеследующем:
          </p>
          
          <h2 style="margin: 20px 0;">1. ПРЕДМЕТ ДОГОВОРА</h2>
          
          <p style="margin-bottom: 20px;">
            1.1. Арендодатель обязуется предоставить Арендатору во временное владение и пользование
            автомобиль ${order.car.brand} ${order.car.model} ${order.car.year} года выпуска,
            государственный регистрационный номер ${order.car.license_plate || '_____'},
            VIN: ${order.car.vin || '_____'} (далее - "Автомобиль").
          </p>
          
          <p style="margin-bottom: 20px;">
            1.2. Арендатор обязуется своевременно вносить арендную плату и использовать Автомобиль
            в соответствии с условиями настоящего договора.
          </p>
          
          <h2 style="margin: 20px 0;">2. СРОК ДЕЙСТВИЯ ДОГОВОРА</h2>
          
          <p style="margin-bottom: 20px;">
            2.1. Срок аренды: с ${format(new Date(order.start_date), 'dd MMMM yyyy', { locale: ru })} по ${format(new Date(order.end_date), 'dd MMMM yyyy', { locale: ru })}.
          </p>
          
          <h2 style="margin: 20px 0;">3. АРЕНДНАЯ ПЛАТА</h2>
          
          <p style="margin-bottom: 20px;">
            3.1. Размер арендной платы: ${order.total_price} руб.
          </p>
          
          <p style="margin-bottom: 20px;">
            3.2. Арендная плата вносится единовременно в полном размере.
          </p>
          
          <h2 style="margin: 20px 0;">4. ОБЯЗАТЕЛЬСТВА СТОРОН</h2>
          
          <p style="margin-bottom: 20px;">
            4.1. Арендодатель обязуется:
            - Предоставить Автомобиль в технически исправном состоянии
            - Передать все необходимые документы на Автомобиль
            - Обеспечить страховку Автомобиля
          </p>
          
          <p style="margin-bottom: 20px;">
            4.2. Арендатор обязуется:
            - Использовать Автомобиль по назначению
            - Своевременно вносить арендную плату
            - Соблюдать правила дорожного движения
            - Не передавать Автомобиль третьим лицам
          </p>
          
          <h2 style="margin: 20px 0;">5. ОТВЕТСТВЕННОСТЬ СТОРОН</h2>
          
          <p style="margin-bottom: 20px;">
            5.1. За нарушение условий договора стороны несут ответственность в соответствии с законодательством РФ.
          </p>
          
          <h2 style="margin: 20px 0;">6. РАСТОРЖЕНИЕ ДОГОВОРА</h2>
          
          <p style="margin-bottom: 20px;">
            6.1. Договор может быть расторгнут по соглашению сторон или в судебном порядке.
          </p>
          
          <h2 style="margin: 20px 0;">7. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</h2>
          
          <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div>
              <p><strong>Арендодатель:</strong></p>
              <p>${companyInfo.name}</p>
              <p>ИНН: ${companyInfo.inn}</p>
              <p>ОГРН: ${companyInfo.ogrn}</p>
              <p>Адрес: ${companyInfo.address}</p>
              <p>Телефон: ${companyInfo.phone}</p>
              <p>Email: ${companyInfo.email}</p>
            </div>
            <div>
              <p><strong>Арендатор:</strong></p>
              <p>${clientFullName}</p>
              <p>Паспорт: ${order.passport_series || '_____'} ${order.passport_number || '_________'}</p>
              <p>Телефон: ${order.phone || '_______________'}</p>
              <p>Email: ${order.email || '________________'}</p>
            </div>
          </div>
          
          <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div>
              <p>_________________</p>
              <p>Арендодатель</p>
            </div>
            <div>
              <p>_________________</p>
              <p>Арендатор</p>
            </div>
          </div>
        </div>
      `;
      
      const opt = {
        margin: 1,
        filename: `Договор_аренды_${order.car.brand}_${order.car.model}_${format(new Date(), 'dd.MM.yyyy')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error loading html2pdf:', error);
      toast.error('Ошибка при генерации документа');
    }
  };

  // Вспомогательная функция для склонения слов
  const getDeclension = (number, words) => {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
  };

  const handleViewDocument = async (orderId) => {
    try {
      console.log('Генерация документа для заказа:', orderId);
      
      // Найдем заказ для локального создания документа
      const order = orders.find(o => o.order_id == orderId);
      if (!order) {
        toast.error('Ошибка: заказ не найден');
        return;
      }

      // Проверяем статус заказа
      if (order.status_name.toLowerCase() !== 'active') {
        toast.error('Договор можно сгенерировать только для заказа в статусе "Активный"');
        return;
      }
      
      // Создаем документ локально
      const localDocument = await generateLocalDocument(order);
      if (localDocument) {
        console.log('Документ сгенерирован:', localDocument.document_number);
        setSelectedDocument(localDocument);
        setShowDocumentModal(true);
        return;
      }
      
      throw new Error('Не удалось сгенерировать документ');
    } catch (error) {
      console.error('Ошибка при генерации документа:', error);
      toast.error('Ошибка при генерации документа');
    }
  };

  const handleRefreshDocument = () => {
    if (!selectedDocument || !selectedDocument.order_id) {
      toast.error('Ошибка: невозможно обновить документ');
      return;
    }
    
    toast.info('Обновление документа...');
    handleViewDocument(selectedDocument.order_id);
  };

  const handleDownloadDocument = (docObj) => {
    console.log('Скачивание документа:', docObj);
    
    if (!docObj || !docObj.content) {
      toast.error('Ошибка: документ не найден или пуст');
      return;
    }

    // Выводим уведомление
    toast.info('Подготовка документа к скачиванию...');

    try {
      // Создаем новое окно для подготовки PDF
      const win = window.open('', '_blank');
      if (!win) {
        toast.error('Пожалуйста, разрешите всплывающие окна для скачивания документа');
        return;
      }

      // Форматирование контента - разбиваем на параграфы для лучшего контроля переносов
      const formattedContent = docObj.content
        .split('\n\n')
        .map(paragraph => {
          if (paragraph.trim() === '') return '<div class="empty-line">&nbsp;</div>';
          return `<div class="paragraph">${paragraph.replace(/\n/g, '<br/>').replace(/\s{2,}/g, match => '&nbsp;'.repeat(match.length))}</div>`;
        })
        .join('');

      // Стили и HTML контент
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Договор №${docObj.document_number}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body, html {
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
              background-color: white;
              color: black;
            }
            .page-container {
              position: relative;
              width: 210mm;
              margin: 0 auto;
              background-color: white;
              box-sizing: border-box;
            }
            .page-content {
              position: relative;
              padding: 20mm;
              background-color: white;
              color: black;
            }
            .paragraph {
              margin-bottom: 6pt;
              page-break-inside: avoid;
            }
            .empty-line {
              height: 12pt;
            }
            .signature-section {
              page-break-inside: avoid;
            }
            .stamp {
              position: fixed;
              width: 150px;
              height: 150px;
              transform: rotate(-15deg);
              z-index: 100;
            }
            .stamp-inner {
              width: 150px;
              height: 150px;
              border: 2px solid #0066cc;
              border-radius: 50%;
              background-color: rgba(255, 255, 255, 0.95);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            .stamp-circle {
              width: 130px;
              height: 130px;
              border: 1px solid #0066cc;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 10px;
              text-align: center;
            }
            .stamp-text {
              color: #0066cc;
              font-family: Arial, sans-serif;
            }
            .stamp-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .stamp-company {
              font-size: 12px;
              margin-bottom: 2px;
            }
            .stamp-info {
              font-size: 10px;
            }
            .stamp-1 {
              right: 70px;
              top: 800px;
            }
            .stamp-2 {
              right: 70px;
              top: 1850px;
            }
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
            table {
              page-break-inside: avoid;
            }
            .requisites {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="page-content">
              ${formattedContent}
            </div>
            
            <div class="stamp stamp-1">
              <div class="stamp-inner">
                <div class="stamp-circle">
                  <div class="stamp-text stamp-title">CarStyle</div>
                  <div class="stamp-text stamp-company">Автопрокат</div>
                  <div class="stamp-text stamp-company">ООО "КарСтайл"</div>
                  <div class="stamp-text stamp-info">ИНН 7712345678</div>
                </div>
              </div>
            </div>
            
            <div class="stamp stamp-2">
              <div class="stamp-inner">
                <div class="stamp-circle">
                  <div class="stamp-text stamp-title">CarStyle</div>
                  <div class="stamp-text stamp-company">Автопрокат</div>
                  <div class="stamp-text stamp-company">ООО "КарСтайл"</div>
                  <div class="stamp-text stamp-info">ИНН 7712345678</div>
                </div>
              </div>
            </div>
          </div>

          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <script>
            // Запускаем генерацию PDF после полной загрузки
            window.onload = function() {
              // Даем время для полной отрисовки
              setTimeout(function() {
                const element = document.querySelector('.page-container');
                const opt = {
                  margin: 0,
                  filename: '${docObj.document_number || "document"}.pdf',
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    letterRendering: true,
                    backgroundColor: '#FFFFFF'
                  },
                  jsPDF: { 
                    unit: 'mm',
                    format: 'a4',
                    orientation: 'portrait',
                    compress: true
                  },
                  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };
                
                html2pdf().from(element).set(opt).save().then(function() {
                  // После успешного сохранения
                  window.close();
                });
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);
      
      win.document.close();
      
      // Сообщение об успехе
      toast.success('Документ подготовлен к скачиванию');
      
    } catch (error) {
      console.error('Ошибка при генерации PDF:', error);
      toast.error('Ошибка при генерации PDF документа');
    }
  };

  // Функция для печати документа
  const handlePrintDocument = () => {
    if (!selectedDocument || !selectedDocument.content) {
      toast.error('Ошибка: нет содержимого для печати');
      return;
    }
    
    try {
      // Создаем новое окно для печати
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.warning('Разрешите всплывающие окна для печати документа');
        return;
      }
      
      // Стили для печати
      const printStyles = `
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 2cm;
          color: #000;
        }
        pre {
          white-space: pre-wrap;
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          position: relative;
        }
        .stamp {
          position: absolute;
          width: 150px;
          height: 150px;
          background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImdyYWQiIGN4PSI1MCUiIGN5PSI1MCUiIHI9IjUwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAwNjZjYyIgc3RvcC1vcGFjaXR5PSIwLjMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDY2Y2MiIHN0b3Atb3BhY2l0eT0iMC4xIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI5NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA2NmNjIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9Ijg1IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDY2Y2MiIHN0cm9rZS13aWR0aD0iMiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNzUiIGZpbGw9InVybCgjZ3JhZCkiLz48dGV4dCB4PSIxMDAiIHk9IjcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMwMDY2Y2MiPkNhclN0eWxlPC90ZXh0Pjx0ZXh0IHg9IjEwMCIgeT0iOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwNjZjYyI+0JDQstGC0L7Qv9GA0L7QutCw0YI8L3RleHQ+PHRleHQgeD0iMTAwIiB5PSIxMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwNjZjYyI+0J7QntCeICLQmtCw0YDQodGC0LDQudC7IjwvdGV4dD48dGV4dCB4PSIxMDAiIHk9IjEzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDA2NmNjIj7QmNCd0J0gNzcxMjM0NTY3ODwvdGV4dD48L3N2Zz4=');
          background-size: contain;
          background-repeat: no-repeat;
          opacity: 0.85;
          transform: rotate(-15deg);
          z-index: 1000;
        }
        .stamp-1 {
          right: 50px;
          top: 85%;
          transform: rotate(-15deg) translateY(-50%);
        }
        .stamp-2 {
          right: 50px;
          bottom: 140px;
          transform: rotate(-15deg);
        }
        @page {
          size: A4;
          margin: 2cm;
        }
        @media print {
          body {
            margin: 0;
          }
          .stamp {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .signature-line {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `;
      
      // Записываем HTML в новое окно
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Договор аренды №${selectedDocument.document_number}</title>
            <style>${printStyles}</style>
          </head>
          <body>
            <div style="position: relative;">
              <pre>${selectedDocument.content}</pre>
              <div class="stamp stamp-1"></div>
              <div class="stamp stamp-2"></div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Ждем загрузки страницы перед печатью
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      toast.success('Документ отправлен на печать');
    } catch (error) {
      console.error('Ошибка при печати документа:', error);
      toast.error('Ошибка при печати документа');
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

  // Функция для получения роли текущего пользователя
  const getUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.user) {
        // Получаем роль и приводим к нижнему регистру для сравнения
        const userRole = response.data.user.role || '';
        const roleStr = userRole.toString().toLowerCase();
        
        console.log('Current user role (raw):', userRole);
        
        // Проверяем, содержит ли строка роли "admin" или "администратор"
        if (roleStr.includes('admin') || roleStr === '1' || 
            roleStr.includes('админ') || roleStr.includes('администратор')) {
          console.log('User is recognized as admin');
          setUserRole('admin');
          // Сохраняем роль в localStorage для использования в других частях приложения
          localStorage.setItem('userRole', 'admin');
        } else {
          console.log('User is recognized as employee');
          setUserRole('employee');
          localStorage.setItem('userRole', 'employee');
        }
        
        console.log('Full user data:', response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // По умолчанию ставим employee, чтобы скрыть кнопку удаления если не удалось получить роль
      setUserRole('employee');
    }
  };

  if (loading) return <div className="admin-loading">Загрузка...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Управление заказами</h2>
        <div className="admin-actions">
          <button 
            className="admin-button secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="admin-filters">
          <div className="filters-form">
            <div className="filter-row">
              <div className="filter-group">
                <label>Поиск:</label>
                <input
                  type="text"
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="Имя, телефон, авто..."
                  className="admin-form-input"
                />
              </div>
              <div className="filter-group">
                <label>Статус:</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="admin-form-select"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">Ожидает</option>
                  <option value="active">Активный</option>
                  <option value="rented">В аренде</option>
                  <option value="completed">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Цена от:</label>
                <input
                  type="number"
                  name="priceFrom"
                  value={filters.priceFrom}
                  onChange={handleFilterChange}
                  placeholder="Мин. цена"
                  className="admin-form-input"
                />
              </div>
              <div className="filter-group">
                <label>Цена до:</label>
                <input
                  type="number"
                  name="priceTo"
                  value={filters.priceTo}
                  onChange={handleFilterChange}
                  placeholder="Макс. цена"
                  className="admin-form-input"
                />
              </div>
            </div>
            <div className="filter-row">
              <div className="filter-group">
                <label>Дата начала от:</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="admin-form-input"
                />
              </div>
              <div className="filter-group">
                <label>Дата окончания до:</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="admin-form-input"
                />
              </div>
              <div className="filter-actions">
                <button
                  className="admin-button secondary"
                  onClick={resetFilters}
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-table-container">
        <div className="admin-table-stats">
          <span className="orders-count">Показано заказов: {filteredOrders.length} из {orders.length}</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Клиент</th>
              <th>Автомобиль</th>
              <th>Даты</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.order_id}>
                <td>#{order.order_id}</td>
                <td>
                  <div className="client-info">
                    <div className="client-name">
                      {order.firstname} {order.lastname}
                    </div>
                    <div className="client-contact">
                      {order.phone}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="admin-car-info">
                    <span className="admin-car-name">{order.brand_name} {order.model_name}</span>
                    <span className="admin-car-year">{order.year} год</span>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <div>Выдача: {formatDate(order.issue_date)}</div>
                    <div>Возврат: {formatDate(order.return_date)}</div>
                  </div>
                </td>
                <td>{formatPrice(order.price)}</td>
                <td>
                  <span className={`status-badge ${order.status_name.toLowerCase()}`}>
                    {order.status_name}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="admin-button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailsModal(true);
                      }}
                    >
                      Детали
                    </button>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowStatusModal(true);
                        setNewStatus(order.status_name.toLowerCase());
                      }}
                    >
                      Статус
                    </button>
                    {/* Кнопка удаления видна только администраторам */}
                    {(userRole === 'admin' || localStorage.getItem('userRole') === 'admin') && (
                      <button
                        className="admin-button delete"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDeleteModal(true);
                        }}
                      >
                        Удалить
                      </button>
                    )}
                    {order.status_name.toLowerCase() === 'active' && (
                      <button
                        className="admin-button document"
                        onClick={() => handleViewDocument(order.order_id)}
                      >
                        Документ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Модальное окно деталей заказа */}
      {showDetailsModal && selectedOrder && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Детали заказа #{selectedOrder.order_id}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="order-details">
                <div className="details-section">
                  <h4>Информация о клиенте</h4>
                  <p><strong>ФИО:</strong> {selectedOrder.firstname} {selectedOrder.lastname}</p>
                  <p><strong>Телефон:</strong> {selectedOrder.phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.email}</p>
                </div>
                <div className="details-section">
                  <h4>Информация об автомобиле</h4>
                  <p><strong>Марка:</strong> {selectedOrder.brand_name}</p>
                  <p><strong>Модель:</strong> {selectedOrder.model_name}</p>
                  <p><strong>Год выпуска:</strong> {selectedOrder.year}</p>
                  <p><strong>Цвет:</strong> {selectedOrder.color_name || 'Не указан'}</p>
                  <p><strong>Тип топлива:</strong> {selectedOrder.fuel_name || 'Не указан'}</p>
                  <p><strong>Коробка передач:</strong> {selectedOrder.transmission_name || 'Не указана'}</p>
                  <p><strong>Пробег:</strong> {selectedOrder.mileage || '0'} км</p>
                  <p><strong>VIN:</strong> {selectedOrder.vin || 'Не указан'}</p>
                  <p><strong>Гос. номер:</strong> {selectedOrder.license_plate || 'Не указан'}</p>
                  <p><strong>Цена за сутки:</strong> {formatPrice(selectedOrder.car_price)}</p>
                  <p><strong>Статус автомобиля:</strong> {selectedOrder.car_status || 'Не указан'}</p>
                  {selectedOrder.description && (
                    <p><strong>Описание:</strong> {selectedOrder.description}</p>
                  )}
                </div>
                <div className="details-section">
                  <h4>Дополнительные услуги</h4>
                  <p><strong>Страховка:</strong> {selectedOrder.insurance ? 'Да' : 'Нет'}</p>
                  <p><strong>Детское кресло:</strong> {selectedOrder.child_seat ? 'Да' : 'Нет'}</p>
                  <p><strong>GPS:</strong> {selectedOrder.gps ? 'Да' : 'Нет'}</p>
                  <p><strong>Дополнительный водитель:</strong> {selectedOrder.additional_driver ? 'Да' : 'Нет'}</p>
                </div>
                <div className="details-section">
                  <h4>Ответственное лицо</h4>
                  <p><strong>ФИО:</strong> {selectedOrder.responsible_lastname} {selectedOrder.responsible_firstname}</p>
                  <p><strong>Должность:</strong> {selectedOrder.responsible_position || 'Не указана'}</p>
                  <p><strong>Телефон:</strong> {selectedOrder.responsible_phone || 'Не указан'}</p>
                  <p><strong>Email:</strong> {selectedOrder.responsible_email || 'Не указан'}</p>
                  <p><strong>Тип:</strong> {selectedOrder.responsible_type === 'admin' ? 'Администратор' : 'Сотрудник'}</p>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-button secondary"
                onClick={() => setShowDetailsModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно изменения статуса */}
      {showStatusModal && selectedOrder && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Изменение статуса заказа #{selectedOrder.order_id}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="status-change-form">
                <div className="form-group">
                  <label>Текущий статус:</label>
                  <span className={`status-badge ${selectedOrder.status_name.toLowerCase()}`}>
                    {selectedOrder.status_name}
                  </span>
                </div>
                <div className="form-group">
                  <label>Новый статус:</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="admin-form-select"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="active">Активный</option>
                    <option value="rented">В аренде</option>
                    <option value="completed">Завершен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-button secondary"
                onClick={() => setShowStatusModal(false)}
              >
                Отмена
              </button>
              <button
                className="admin-button primary"
                onClick={async () => {
                  try {
                    if (!selectedOrder?.order_id) {
                      toast.error('Ошибка: ID заказа не найден');
                      return;
                    }
                    await handleStatusChange(selectedOrder.order_id, newStatus);
                    setShowStatusModal(false);
                  } catch (error) {
                    console.error('Error updating status:', error);
                    toast.error('Ошибка при обновлении статуса');
                  }
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для просмотра документа */}
      {showDocumentModal && selectedDocument && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal document-modal">
            <div className="admin-modal-header">
              <div className="document-title-container">
                <h3 className="admin-modal-title">
                  Договор №{selectedDocument.document_number}
                </h3>
                <span className="document-badge">Сгенерировано автоматически</span>
              </div>
              <button
                className="admin-modal-close"
                onClick={() => setShowDocumentModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-content document-content-wrapper">
              {selectedDocument.content ? (
                <pre className="document-content">
                  {selectedDocument.content}
                </pre>
              ) : (
                <div className="document-error">
                  <p>Содержимое документа не найдено</p>
                  <button 
                    className="admin-button primary" 
                    onClick={() => handleViewDocument(selectedDocument.order_id)}
                  >
                    Сгенерировать заново
                  </button>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              {selectedDocument.content && (
                <>
                  <button
                    className="admin-button primary download-button"
                    onClick={() => handleDownloadDocument(selectedDocument)}
                  >
                    <i className="fas fa-download"></i> Скачать
                  </button>
                  <button
                    className="admin-button print-button"
                    onClick={handlePrintDocument}
                  >
                    <i className="fas fa-print"></i> Печать
                  </button>
                  <button
                    className="admin-button secondary refresh-button"
                    onClick={handleRefreshDocument}
                  >
                    <i className="fas fa-sync-alt"></i> Обновить
                  </button>
                </>
              )}
              <button
                className="admin-button secondary"
                onClick={() => setShowDocumentModal(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для подтверждения удаления */}
      {showDeleteModal && selectedOrder && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Подтверждение удаления</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-content">
              <p>Вы действительно хотите удалить заказ #{selectedOrder.order_id}?</p>
              <p>
                <strong>Автомобиль:</strong> {selectedOrder.brand_name} {selectedOrder.model_name} ({selectedOrder.year})
              </p>
              <p>
                <strong>Клиент:</strong> {selectedOrder.lastname} {selectedOrder.firstname}
              </p>
              <p>
                <strong>Даты:</strong> {formatDate(selectedOrder.issue_date)} - {formatDate(selectedOrder.return_date)}
              </p>
              <p>
                <strong>Статус:</strong> <span className={`status-badge ${selectedOrder.status_name.toLowerCase()}`}>{selectedOrder.status_name}</span>
              </p>
              <p className="delete-warning">Это действие нельзя отменить!</p>

              {(selectedOrder.status_name.toLowerCase() === 'active' || 
                selectedOrder.status_name.toLowerCase() === 'rented') && (
                <div className="status-warning">
                  <p><strong>Внимание!</strong> Невозможно удалить заказ в статусе "{selectedOrder.status_name}".</p>
                  <p>Сначала измените статус заказа на "Завершен" или "Отменен".</p>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-button secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button
                className="admin-button delete"
                onClick={() => handleDeleteOrder(selectedOrder.order_id)}
                disabled={selectedOrder.status_name.toLowerCase() === 'active' || selectedOrder.status_name.toLowerCase() === 'rented'}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';
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
  const generateLocalDocument = (order) => {
    if (!order) return null;
    
    // Информация о компании-арендодателе
    const companyInfo = {
      name: 'ООО "CarStyle"',
      director: 'Иванов Иван Иванович',
      position: 'Генеральный директор',
      inn: '7712345678',
      ogrn: '1234567890123',
      address: 'г. Москва, ул. Автомобильная, д. 1',
      phone: '+7 (495) 123-45-67',
      email: 'info@carstyle.ru',
      website: 'www.carstyle.ru'
    };
    
    // Получаем текущую дату и форматируем её
    const now = new Date();
    const currentDate = format(now, 'dd MMMM yyyy г.', { locale: ru });
    
    // Генерируем уникальный номер документа
    const documentNumber = `ДОГ-А-${order.order_id}-${format(now, 'yyyyMMdd')}`;
    
    // Форматируем даты аренды
    const issueDate = formatDate(order.issue_date);
    const returnDate = formatDate(order.return_date);
    
    // Вычисляем количество дней аренды
    const startDate = new Date(order.issue_date);
    const endDate = new Date(order.return_date);
    const rentalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    
    // Формируем полное имя клиента
    const clientFullName = `${order.lastname} ${order.firstname}${order.middlename ? ' ' + order.middlename : ''}`;
    
    // Информация о дополнительных услугах
    const additionalServices = [];
    if (order.insurance) additionalServices.push('Страховка');
    if (order.child_seat) additionalServices.push('Детское кресло');
    if (order.gps) additionalServices.push('GPS-навигатор');
    if (order.additional_driver) additionalServices.push('Дополнительный водитель');
    
    // Создаем содержимое документа
    const content = `
        ДОГОВОР АРЕНДЫ АВТОМОБИЛЯ №${documentNumber}
        
        г. Москва                                                                                                ${currentDate}
        
        ${companyInfo.name}, именуемое в дальнейшем "Арендодатель", в лице ${companyInfo.position} ${companyInfo.director}, 
        действующего на основании Устава, с одной стороны, и 
        ${clientFullName}, именуемый(-ая) в дальнейшем "Арендатор", с другой стороны,
        вместе именуемые "Стороны", заключили настоящий договор о нижеследующем:
        
        1. ПРЕДМЕТ ДОГОВОРА
        
        1.1. Арендодатель передает во временное владение и пользование Арендатору автомобиль:
            - Марка: ${order.brand_name}
            - Модель: ${order.model_name}
            - Год выпуска: ${order.year}
            - Цвет: ${order.color_name || '________'}
            - Тип топлива: ${order.fuel_name || '________'}
            - Коробка передач: ${order.transmission_name || '________'}
            - Пробег: ${order.mileage || '0'} км
            ${order.license_plate ? `- Государственный номер: ${order.license_plate}` : ''}
            ${order.vin ? `- VIN: ${order.vin}` : ''}
            - Стоимость аренды за сутки: ${formatPrice(order.car_price)}
            (далее - "Автомобиль"), а Арендатор обязуется использовать Автомобиль в соответствии
            с условиями настоящего Договора и своевременно вносить плату за пользование Автомобилем.
        1.2. Автомобиль принадлежит Арендодателю на праве собственности, что подтверждается 
            Свидетельством о регистрации ТС серия ________ №__________ 
            выдано _____________________________________________ "___" ____________ _____ г.
        1.3. Арендодатель гарантирует, что Автомобиль не является предметом залога, не арестован, 
            не является предметом исков третьих лиц.
        1.4. Ответственным лицом со стороны Арендодателя за исполнение настоящего договора является:
            ${order.responsible_lastname} ${order.responsible_firstname}, ${order.responsible_position || 'сотрудник компании'},
            тел. ${order.responsible_phone || '_____________'}, email: ${order.responsible_email || '_____________'}.
            В случае возникновения претензий по исполнению договора, Арендатор вправе обращаться к указанному лицу.
        1.5. Арендодатель гарантирует, что Автомобиль:
            - Находится в технически исправном состоянии
            - Имеет действующий полис ОСАГО
            ${order.insurance ? '- Имеет действующий полис КАСКО' : '- Не имеет полиса КАСКО'}
            - Имеет все необходимые документы (СТС, диагностическая карта)
            - Не имеет ограничений на регистрационные действия
            - Не находится в розыске
        1.6. Арендатор подтверждает, что:
            - Имеет действующее водительское удостоверение категории B
            - Имеет стаж вождения не менее 2 лет
            - Не имеет медицинских противопоказаний к управлению ТС
            - Не находится в состоянии алкогольного или наркотического опьянения
            - Не имеет ограничений на управление ТС
        
        2. СРОК АРЕНДЫ
        
        2.1. Срок аренды Автомобиля: ${rentalDays} ${getDeclension(rentalDays, ['день', 'дня', 'дней'])}
        2.2. Дата начала аренды: ${issueDate}
        2.3. Дата окончания аренды: ${returnDate}
        2.4. Автомобиль выдается Арендатору после подписания Акта приема-передачи, который является 
            неотъемлемой частью настоящего Договора и содержит подробное описание состояния Автомобиля.
        2.5. Место передачи Автомобиля: г. Москва, ул. Автомобильная, д. 1
        2.6. Время передачи Автомобиля: с 10:00 до 18:00 часов.
        2.7. В случае невозможности возврата Автомобиля в установленный срок по уважительной причине,
            Арендатор обязан уведомить Арендодателя не менее чем за 24 часа до истечения срока аренды.
            Продление срока аренды возможно только по письменному соглашению Сторон.
        2.8. При возврате Автомобиля ранее установленного срока, перерасчет арендной платы
            не производится, денежные средства не возвращаются.
        
        3. СТОИМОСТЬ АРЕНДЫ И ПОРЯДОК РАСЧЕТОВ
        
        3.1. Стоимость аренды Автомобиля составляет ${formatPrice(order.price)} за весь период аренды.
        3.2. Стоимость аренды включает в себя:
            - Использование автомобиля в течение срока аренды
            ${additionalServices.length > 0 ? '- Дополнительные услуги: ' + additionalServices.join(', ') : ''}
            - Страховку по полису ОСАГО
            ${order.insurance ? '- Страховку по полису КАСКО' : ''}
        3.3. Оплата производится в полном объеме при подписании настоящего Договора.
        3.4. В стоимость аренды не включены расходы:
            - на топливо и горюче-смазочные материалы;
            - на оплату штрафов за нарушение правил дорожного движения;
            - на оплату платных парковок и платных дорог;
            - на мойку автомобиля;
            - на ремонт повреждений, возникших по вине Арендатора;
            - на эвакуацию автомобиля в случае его блокировки;
            - на услуги эвакуатора в случае поломки по вине Арендатора.
        3.5. При возврате Автомобиля ранее срока, указанного в п. 2.3. Договора, перерасчет арендной платы
            не производится, денежные средства не возвращаются.
        3.6. Арендодатель вправе потребовать внесения залога в размере _______ рублей в качестве обеспечения 
            исполнения обязательств по договору. Залог возвращается Арендатору при возврате Автомобиля 
            в исправном состоянии.
        3.7. В случае повреждения Автомобиля по вине Арендатора, стоимость ремонта удерживается из залога.
            Если сумма ущерба превышает размер залога, Арендатор обязан возместить разницу в течение 5 дней
            после получения соответствующего требования.
        3.8. Арендатор обязуется оплачивать все штрафы за нарушение правил дорожного движения,
            выписанные на Автомобиль в период аренды. В случае неуплаты штрафов Арендатором,
            Арендодатель вправе удержать соответствующую сумму из залога.
        
        4. ПРАВА И ОБЯЗАННОСТИ СТОРОН
        
        4.1. Арендодатель обязуется:
            4.1.1. Предоставить Автомобиль в технически исправном состоянии.
            4.1.2. Провести инструктаж по эксплуатации Автомобиля.
            4.1.3. Передать Арендатору все необходимые документы на Автомобиль.
            4.1.4. Устранять за свой счет неисправности, возникшие в Автомобиле не по вине Арендатора.
            4.1.5. Оказывать консультационную помощь по вопросам эксплуатации Автомобиля.
            4.1.6. Предоставить запасное колесо и комплект инструментов.
            4.1.7. Обеспечить наличие аптечки и огнетушителя.
            4.1.8. Предоставить информацию о ближайших сервисных центрах.
            4.1.9. Обеспечить круглосуточную поддержку по телефону.
            4.1.10. В случае поломки Автомобиля не по вине Арендатора, предоставить замену
                    на аналогичный автомобиль в течение 24 часов.
        
        4.2. Арендатор обязуется:
            4.2.1. Использовать Автомобиль в соответствии с его назначением и техническими характеристиками.
            4.2.2. Соблюдать правила дорожного движения и правила эксплуатации Автомобиля.
            4.2.3. Своевременно вносить арендную плату.
            4.2.4. Вернуть Автомобиль по окончании срока аренды в исправном состоянии с учетом нормального износа.
            4.2.5. Незамедлительно информировать Арендодателя о любых неисправностях Автомобиля.
            4.2.6. Не передавать Автомобиль в субаренду или управление третьим лицам без письменного согласия Арендодателя.
            4.2.7. При эксплуатации Автомобиля использовать горюче-смазочные материалы, рекомендованные заводом-изготовителем.
            4.2.8. Не производить разборку и ремонт Автомобиля, а также не вносить изменения в его конструкцию.
            4.2.9. Не оставлять документы на Автомобиль в салоне при стоянке.
            4.2.10. Не оставлять Автомобиль без присмотра с запущенным двигателем.
            4.2.11. Не использовать Автомобиль для буксировки других транспортных средств или перевозки грузов, превышающих максимальную нагрузку.
            4.2.12. Не использовать Автомобиль для участия в гонках, тестах, соревнованиях.
            4.2.13. Не использовать Автомобиль в качестве такси или для оказания услуг по перевозке пассажиров и грузов.
            4.2.14. В случае ДТП немедленно вызвать представителей ГИБДД и сообщить о происшествии Арендодателю.
            4.2.15. Соблюдать режим труда и отдыха при управлении Автомобилем.
            4.2.16. Не использовать Автомобиль в состоянии утомления или сонливости.
            4.2.17. Не перевозить в Автомобиле опасные грузы и вещества.
            4.2.18. Не использовать Автомобиль в условиях бездорожья.
            4.2.19. Не превышать максимальную скорость, указанную в технической документации.
            4.2.20. Не использовать Автомобиль в коммерческих целях без письменного согласия Арендодателя.
        
        5. ОТВЕТСТВЕННОСТЬ СТОРОН
        
        5.1. За неисполнение или ненадлежащее исполнение обязательств по настоящему Договору
             Стороны несут ответственность в соответствии с действующим законодательством Российской Федерации.
        5.2. В случае повреждения Автомобиля по вине Арендатора, он обязуется возместить Арендодателю
             причиненный ущерб в полном объеме.
        5.3. В случае нарушения сроков возврата Автомобиля Арендатор уплачивает неустойку в размере
             двойной стоимости аренды за каждый день просрочки.
        5.4. Арендатор несет ответственность за сохранность Автомобиля с момента его получения до момента возврата.
        5.5. Арендодатель не несет ответственности за вещи, оставленные в Автомобиле.
        5.6. Арендатор несет полную ответственность за ущерб, причиненный Автомобилю, в следующих случаях:
            5.6.1. Управление Автомобилем в состоянии алкогольного или наркотического опьянения.
            5.6.2. Управление Автомобилем лицом, не указанным в договоре.
            5.6.3. Нарушение правил пожарной безопасности.
            5.6.4. Использование Автомобиля с нарушением п. 4.2 настоящего договора.
            5.6.5. Участие в ДТП по вине Арендатора.
            5.6.6. Нарушение правил эксплуатации Автомобиля.
            5.6.7. Использование некачественного топлива или масел.
            5.6.8. Несвоевременное техническое обслуживание.
        5.7. Оплата штрафов ГИБДД за нарушение Правил дорожного движения во время аренды Автомобиля производится Арендатором.
        5.8. В случае утраты или хищения Автомобиля, Арендатор обязан возместить его полную стоимость
             в течение 5 дней после наступления указанного события.
        5.9. Арендодатель не несет ответственности за ущерб, причиненный третьим лицам в результате
             использования Автомобиля Арендатором.
        
        6. СТРАХОВАНИЕ АВТОМОБИЛЯ
        
        6.1. Автомобиль застрахован по полису ОСАГО.
        6.2. ${order.insurance ? 'Автомобиль дополнительно застрахован по полису КАСКО.' : 'Автомобиль не имеет страхового покрытия КАСКО.'}
        6.3. В случае ДТП виновником которого является Арендатор, он выплачивает Арендодателю безусловную франшизу в размере __________ рублей.
        6.4. В случае ДТП Арендатор обязан:
            6.4.1. Немедленно сообщить о происшествии в ГИБДД и Арендодателю.
            6.4.2. Не покидать место ДТП до прибытия сотрудников ГИБДД.
            6.4.3. Собрать контактные данные всех участников ДТП.
            6.4.4. Сделать фотографии места ДТП и повреждений.
            6.4.5. Получить справку о ДТП в ГИБДД.
            6.4.6. Передать все документы Арендодателю в течение 24 часов.
        6.5. В случае утраты или хищения Автомобиля, Арендатор обязан:
            6.5.1. Немедленно сообщить о происшествии в полицию и Арендодателю.
            6.5.2. Получить справку о возбуждении уголовного дела.
            6.5.3. Передать все документы Арендодателю в течение 24 часов.
        
        7. ПОРЯДОК ВОЗВРАТА АВТОМОБИЛЯ
        
        7.1. По окончании срока аренды Арендатор обязан возвратить Автомобиль Арендодателю в том же состоянии,
             в котором он его получил, с учетом нормального износа.
        7.2. Возврат Автомобиля оформляется Актом возврата, подписываемым обеими Сторонами, в котором указывается
             состояние Автомобиля на момент возврата.
        7.3. Автомобиль должен быть возвращен с тем же количеством топлива, которое было при его получении.
        7.4. При возврате Автомобиля производится проверка его технического состояния и комплектности.
        7.5. В случае обнаружения повреждений или отсутствия комплектующих, их стоимость удерживается из залога.
        7.6. Арендатор обязан вернуть все полученные документы на Автомобиль.
        7.7. В случае невозможности возврата Автомобиля в установленное время, Арендатор обязан
             уведомить об этом Арендодателя не менее чем за 24 часа.
        7.8. При возврате Автомобиля в неисправном состоянии, Арендатор возмещает стоимость ремонта
             и простой Автомобиля в размере двойной стоимости аренды за каждый день простоя.
        
        8. ПОРЯДОК РАЗРЕШЕНИЯ СПОРОВ
        
        8.1. Все споры и разногласия, возникающие между Сторонами по настоящему Договору, разрешаются путем переговоров.
        8.2. В случае невозможности разрешения споров путем переговоров, они подлежат рассмотрению в судебном порядке
             по месту нахождения Арендодателя в соответствии с законодательством Российской Федерации.
        8.3. До обращения в суд Стороны обязаны принять меры по досудебному урегулированию спора.
        8.4. Срок ответа на претензию составляет 10 дней с момента её получения.
        8.5. В случае неполучения ответа на претензию в установленный срок, Сторона вправе обратиться в суд.
        
        9. ФОРС-МАЖОР
        
        9.1. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств по Договору,
             если это неисполнение явилось следствием обстоятельств непреодолимой силы, возникших после заключения
             Договора в результате событий чрезвычайного характера.
        9.2. К обстоятельствам непреодолимой силы относятся события, на которые Стороны не могут оказывать влияние,
             такие как: стихийные бедствия, военные действия, акты государственных органов и др.
        9.3. Сторона, для которой создалась невозможность исполнения обязательств, обязана уведомить другую Сторону
             о наступлении и прекращении таких обстоятельств в течение 5 дней.
        9.4. В случае наступления форс-мажорных обстоятельств срок исполнения обязательств по Договору
             продлевается на время действия этих обстоятельств.
        
        10. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ
        
        10.1. Договор вступает в силу с момента подписания и действует до полного исполнения Сторонами своих обязательств.
        10.2. Все изменения и дополнения к настоящему Договору должны быть составлены в письменной форме
              и подписаны обеими Сторонами.
        10.3. Во всем остальном, что не предусмотрено настоящим Договором, Стороны руководствуются
              действующим законодательством Российской Федерации.
        10.4. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу,
              по одному для каждой из Сторон.
        10.5. Приложения к договору:
              - Приложение №1: Акт приема-передачи Автомобиля
              - Приложение №2: Акт возврата Автомобиля
              - Приложение №3: Список документов на Автомобиль
              - Приложение №4: Список комплектующих Автомобиля
        10.6. Арендатор подтверждает, что:
              10.6.1. Полностью ознакомлен с условиями Договора
              10.6.2. Имеет все необходимые права для заключения Договора
              10.6.3. Не находится под действием обстоятельств, которые могут повлиять на его способность
                      к заключению Договора
              10.6.4. Предоставленные им документы и информация являются достоверными
        
        11. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН
        
        Арендодатель:                                       Арендатор:
        ${companyInfo.name}                                 ${clientFullName}
        ИНН: ${companyInfo.inn}                             Паспорт: ${order.passport_series || '_____'} ${order.passport_number || '_________'}
        ОГРН: ${companyInfo.ogrn}                           Выдан: _________________________________
        Юридический адрес: ${companyInfo.address}           Дата выдачи: __________________________
        Фактический адрес: ${companyInfo.address}           Адрес: ________________________________
        Телефон: ${companyInfo.phone}                       Телефон: ${order.phone || '_______________'}
        Email: ${companyInfo.email}                         Email: ${order.email || '________________'}
        Р/с: 40702810000000000000                           Вод. удостоверение: ${order.driver_license || '________________'}
        Банк: АО "Банк"                                     Выдано: _______________________________
        К/с: 30101810000000000000                           Дата выдачи: __________________________
        БИК: 044525000
        
        Ответственное лицо Арендодателя:
        ${order.responsible_lastname} ${order.responsible_firstname}
        ${order.responsible_position || 'Сотрудник компании'}
        Тел. ${order.responsible_phone || '_____________'}
        Email: ${order.responsible_email || '_____________'}
        
        ____________________ / ${companyInfo.director}/     ____________________ / ${order.lastname} ${order.firstname.charAt(0)}. ${order.middlename ? order.middlename.charAt(0) + '.' : ''}/
        М.П.
        
        
                                   ПРИЛОЖЕНИЕ №1
                            к Договору аренды автомобиля 
                      №${documentNumber} от ${currentDate}
        
                           АКТ ПРИЕМА-ПЕРЕДАЧИ АВТОМОБИЛЯ
        
        г. Москва                                                                                      ${currentDate}
        
        ${companyInfo.name}, именуемое в дальнейшем "Арендодатель", в лице ${companyInfo.position} ${companyInfo.director},
        действующего на основании Устава, с одной стороны, и 
        ${clientFullName}, именуемый(-ая) в дальнейшем "Арендатор", с другой стороны,
        составили настоящий Акт о том, что Арендодатель передал, а Арендатор принял во временное
        владение и пользование автомобиль:
        
        Марка: ${order.brand_name}
        Модель: ${order.model_name}
        Год выпуска: ${order.year}
        Цвет: ${order.color_name || '________'}
        Гос. номер: ${order.license_plate || '________'}
        VIN: ${order.vin || '________________________'}
        
        Техническое состояние автомобиля: исправен, пригоден для использования.
        Видимые повреждения: ________________________________________________
        
        Комплектация автомобиля:
        - Свидетельство о регистрации: имеется
        - Страховой полис ОСАГО: имеется
        - Топливо в баке: полный бак
        - Запасное колесо: имеется
        - Аптечка: имеется
        - Огнетушитель: имеется
        - Знак аварийной остановки: имеется
        ${order.child_seat ? '- Детское кресло: имеется' : ''}
        ${order.gps ? '- GPS-навигатор: имеется' : ''}
        
        Автомобиль передан в технически исправном состоянии.
        Арендатор провел осмотр автомобиля и не имеет претензий к его техническому состоянию.
        
        Арендодатель: ____________________ / ${companyInfo.director}/
        
        Арендатор: ____________________ / ${order.lastname} ${order.firstname.charAt(0)}. ${order.middlename ? order.middlename.charAt(0) + '.' : ''}/
    `;
    
    return {
      document_id: `doc-${Date.now()}`,
      order_id: order.order_id,
      document_number: documentNumber,
      document_type: 'rental_agreement',
      status: 'active',
      created_at: new Date().toISOString(),
      content: content
    };
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
      const localDocument = generateLocalDocument(order);
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
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const DictionaryManagement = () => {
  const [activeDictionary, setActiveDictionary] = useState('brands');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkBrandModal, setShowLinkBrandModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    brand_id: '' // только для моделей
  });
  const [brands, setBrands] = useState([]); // для списка брендов при добавлении модели
  const [creatingTestData, setCreatingTestData] = useState(false); // флаг создания тестовых данных
  const [userRole, setUserRole] = useState('employee');

  useEffect(() => {
    fetchItems(activeDictionary);
    getUserRole();
    
    // Повторная загрузка роли через 2 секунды, чтобы убедиться, что данные успели обновиться
    const timer = setTimeout(() => {
      getUserRole();
      console.log('Dictionary - Role after delay:', userRole);
    }, 2000);
    
    if (activeDictionary === 'models') {
      fetchBrands();
    }
    
    return () => clearTimeout(timer);
  }, [activeDictionary]);

  const fetchItems = async (dictionaryType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const endpoint = getDictionaryEndpoint(dictionaryType);
      const requestUrl = `${apiUrl}/api/admin/cars/${endpoint}`;
      console.log(`Fetching ${dictionaryType} from URL:`, requestUrl);
      
      const response = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`${dictionaryType} response data:`, response.data);
      console.log(`${dictionaryType} response status:`, response.status);
      
      // Обработка разных возможных форматов ответа
      if (Array.isArray(response.data)) {
        setItems(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Если данные приходят в формате { data: [...] }
        setItems(response.data.data);
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Если это объект с записями
        const itemsArray = Object.values(response.data);
        if (Array.isArray(itemsArray)) {
          setItems(itemsArray);
        } else {
          console.error(`API ${dictionaryType} response is not usable:`, response.data);
          setItems([]);
          toast.error(`Данные справочника получены в неверном формате`);
        }
      } else {
        console.error(`API ${dictionaryType} response is not an array:`, response.data);
        setItems([]);
        toast.error(`Данные справочника получены в неверном формате`);
      }
      setLoading(false);
    } catch (error) {
      console.error(`Error fetching ${dictionaryType}:`, error);
      console.error(`Error details:`, error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      toast.error(`Ошибка при загрузке данных справочника: ${error.message}`);
      setItems([]);
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/cars/brands`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Brands response:", response.data);
      
      if (Array.isArray(response.data)) {
        setBrands(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setBrands(response.data.data);
      } else {
        console.error("API brands response is not an array:", response.data);
        setBrands([]);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setBrands([]);
    }
  };

  const getDictionaryEndpoint = (type) => {
    switch (type) {
      case 'brands':
        return 'brands';
      case 'models':
        return 'models';
      case 'fuel-types':
        return 'fuel-types';
      case 'transmission-types':
        return 'transmission-types';
      case 'colors':
        return 'colors';
      default:
        return 'brands';
    }
  };

  const getDictionaryTitle = (type) => {
    switch (type) {
      case 'brands':
        return 'Марки автомобилей';
      case 'models':
        return 'Модели автомобилей';
      case 'fuel-types':
        return 'Типы топлива';
      case 'transmission-types':
        return 'Типы коробок передач';
      case 'colors':
        return 'Цвета автомобилей';
      default:
        return 'Справочник';
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = getDictionaryEndpoint(activeDictionary);
      const requestUrl = `${apiUrl}/api/admin/cars/${endpoint}`;

      // Проверка на обязательные поля
      if (!newItem.name) {
        toast.error('Пожалуйста, заполните название');
        return;
      }

      // Для моделей необходимо указать бренд
      if (activeDictionary === 'models' && !newItem.brand_id) {
        toast.error('Пожалуйста, выберите марку автомобиля');
        return;
      }

      console.log(`Adding item to ${activeDictionary} at URL:`, requestUrl);
      console.log('Request data:', newItem);

      const response = await axios.post(
        requestUrl,
        newItem,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Add item response:', response.data);
      
      setShowAddModal(false);
      toast.success('Запись успешно добавлена');
      setNewItem({ name: '', brand_id: '' });
      fetchItems(activeDictionary);
    } catch (error) {
      console.error('Error adding item:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Ошибка при добавлении записи';
                           
      toast.error(errorMessage);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = getDictionaryEndpoint(activeDictionary);
      const requestUrl = `${apiUrl}/api/admin/cars/${endpoint}/${selectedItem.id}`;
      
      console.log(`Updating item in ${activeDictionary} at URL:`, requestUrl);
      console.log('Request data:', selectedItem);

      // Проверка на обязательные поля
      if (!selectedItem.name) {
        toast.error('Пожалуйста, заполните название');
        return;
      }

      // Для моделей необходимо указать бренд
      if (activeDictionary === 'models' && !selectedItem.brand_id) {
        toast.error('Пожалуйста, выберите марку автомобиля');
        return;
      }

      const response = await axios.put(
        requestUrl,
        selectedItem,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Update item response:', response.data);

      setShowEditModal(false);
      toast.success('Запись успешно обновлена');
      fetchItems(activeDictionary);
    } catch (error) {
      console.error('Error updating item:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Ошибка при обновлении записи';
                           
      toast.error(errorMessage);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      // В административной панели принудительно устанавливаем права админа
      setUserRole('admin');
      console.log('Dictionary - Delete attempt - forcing admin role');

      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const endpoint = getDictionaryEndpoint(activeDictionary);
      const requestUrl = `${apiUrl}/api/admin/cars/${endpoint}/${itemId}`;
      
      console.log(`Deleting item from ${activeDictionary} at URL:`, requestUrl);

      const response = await axios.delete(
        requestUrl,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Delete item response:', response.data);

      toast.success('Запись успешно удалена');
      fetchItems(activeDictionary);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      toast.error('Ошибка при удалении записи');
    }
  };

  const getUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.user) {
        // В административной панели всегда устанавливаем роль администратора
        console.log('Dictionary - Admin panel detected, setting as admin');
        setUserRole('admin');
        console.log('Dictionary - Full user data:', response.data.user);
      } else {
        // Если ответ от API неверный, но мы в админке, устанавливаем админа
        console.log('Dictionary - No user data but in admin panel - setting as admin');
        setUserRole('admin');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      // В админ панели должен быть только админ
      console.log('Dictionary - Error but in admin panel - setting as admin');
      setUserRole('admin');
    }
  };

  // Функция для создания базовых тестовых данных
  const createTestData = async () => {
    setCreatingTestData(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const testData = {
        brands: [
          { name: 'BMW' },
          { name: 'Mercedes-Benz' },
          { name: 'Audi' },
          { name: 'Toyota' },
          { name: 'Lexus' }
        ],
        'fuel-types': [
          { name: 'Бензин' },
          { name: 'Дизель' },
          { name: 'Электро' },
          { name: 'Гибрид' }
        ],
        'transmission-types': [
          { name: 'Автомат' },
          { name: 'Механика' },
          { name: 'Робот' },
          { name: 'Вариатор' }
        ],
        colors: [
          { name: 'Черный' },
          { name: 'Белый' },
          { name: 'Серебристый' },
          { name: 'Красный' },
          { name: 'Синий' }
        ]
      };
      
      // Добавляем базовые записи для каждого справочника
      let successCount = 0;
      let errorCount = 0;
      let totalRecords = 0;
      
      for (const [dictType, entries] of Object.entries(testData)) {
        totalRecords += entries.length;
        console.log(`Creating test ${dictType}...`);
        
        for (const entry of entries) {
          try {
            const url = `${apiUrl}/api/admin/cars/${dictType}`;
            console.log(`Posting to ${url}:`, entry);
            
            await axios.post(
              url,
              entry,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            successCount++;
          } catch (error) {
            console.error(`Error creating test ${dictType}:`, error);
            errorCount++;
          }
        }
      }
      
      // Добавим модели после создания брендов
      const brandsResponse = await axios.get(
        `${apiUrl}/api/admin/cars/brands`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      let brandsData;
      if (Array.isArray(brandsResponse.data)) {
        brandsData = brandsResponse.data;
      } else if (brandsResponse.data.data && Array.isArray(brandsResponse.data.data)) {
        brandsData = brandsResponse.data.data;
      } else {
        brandsData = [];
      }
      
      if (brandsData.length > 0) {
        console.log('Creating test models for brands:', brandsData);
        
        const testModels = [
          // BMW
          { name: 'X5', brand_id: brandsData.find(b => b.name === 'BMW')?.id },
          { name: 'X6', brand_id: brandsData.find(b => b.name === 'BMW')?.id },
          { name: '5 Series', brand_id: brandsData.find(b => b.name === 'BMW')?.id },
          // Mercedes
          { name: 'E-Class', brand_id: brandsData.find(b => b.name === 'Mercedes-Benz')?.id },
          { name: 'S-Class', brand_id: brandsData.find(b => b.name === 'Mercedes-Benz')?.id },
          { name: 'GLE', brand_id: brandsData.find(b => b.name === 'Mercedes-Benz')?.id },
          // Audi
          { name: 'A6', brand_id: brandsData.find(b => b.name === 'Audi')?.id },
          { name: 'Q7', brand_id: brandsData.find(b => b.name === 'Audi')?.id },
          { name: 'A4', brand_id: brandsData.find(b => b.name === 'Audi')?.id },
          // Toyota
          { name: 'Camry', brand_id: brandsData.find(b => b.name === 'Toyota')?.id },
          { name: 'RAV4', brand_id: brandsData.find(b => b.name === 'Toyota')?.id },
          // Lexus
          { name: 'RX', brand_id: brandsData.find(b => b.name === 'Lexus')?.id },
          { name: 'ES', brand_id: brandsData.find(b => b.name === 'Lexus')?.id }
        ].filter(model => model.brand_id); // Отфильтруем модели, у которых нет brand_id
        
        totalRecords += testModels.length;
        
        for (const model of testModels) {
          try {
            const url = `${apiUrl}/api/admin/cars/models`;
            console.log(`Posting model to ${url}:`, model);
            
            await axios.post(
              url,
              model,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            successCount++;
          } catch (error) {
            console.error('Error creating test model:', error);
            errorCount++;
          }
        }
      }
      
      toast.success(`Создано ${successCount} из ${totalRecords} тестовых записей`);
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} записей не удалось создать (возможно, уже существуют)`);
      }
      
      // Обновляем текущий справочник
      fetchItems(activeDictionary);
      
    } catch (error) {
      console.error('Error in createTestData:', error);
      toast.error('Ошибка при создании тестовых данных');
    } finally {
      setCreatingTestData(false);
    }
  };

  const getBrandName = (brandId) => {
    if (!brandId || !Array.isArray(brands)) return 'Не указан';
    const brand = brands.find(b => b.id == brandId);
    return brand ? brand.name : 'Не указан';
  };

  // Новая функция для связывания модели с брендом
  const handleLinkBrand = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const requestUrl = `${apiUrl}/api/admin/cars/models/${selectedItem.id}/brand`;
      
      console.log(`Linking model to brand at URL:`, requestUrl);
      console.log('Request data:', { brand_id: selectedItem.brand_id });

      // Проверка на обязательные поля
      if (!selectedItem.brand_id) {
        toast.error('Пожалуйста, выберите марку автомобиля');
        return;
      }

      const response = await axios.post(
        requestUrl,
        { brand_id: selectedItem.brand_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Link brand response:', response.data);

      setShowLinkBrandModal(false);
      toast.success('Связь с маркой успешно установлена');
      fetchItems(activeDictionary);
    } catch (error) {
      console.error('Error linking model to brand:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Ошибка при установке связи с маркой';
                           
      toast.error(errorMessage);
    }
  };

  const renderDictionaryContent = () => {
    return (
      <>
        <div className="admin-section-header">
          <h2 className="admin-section-title">{getDictionaryTitle(activeDictionary)}</h2>
          <button className="admin-button" onClick={() => setShowAddModal(true)}>
            Добавить запись
          </button>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                {activeDictionary === 'models' && <th>Марка</th>}
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(items) || items.length === 0 ? (
                <tr>
                  <td colSpan={activeDictionary === 'models' ? 4 : 3} style={{ textAlign: 'center' }}>
                    Записи не найдены
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    {activeDictionary === 'models' && (
                      <td>
                        {getBrandName(item.brand_id)}
                        {!item.brand_id && (
                          <button
                            className="admin-button small"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowLinkBrandModal(true);
                            }}
                            style={{ marginLeft: '5px', fontSize: '0.7rem', padding: '2px 5px' }}
                          >
                            Указать марку
                          </button>
                        )}
                      </td>
                    )}
                    <td>
                      <button
                        className="admin-button"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowEditModal(true);
                        }}
                        style={{ marginRight: '5px' }}
                      >
                        Изменить
                      </button>
                      <button
                        className="admin-button secondary"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </>
    );
  };

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <span style={{ color: '#60a5fa' }}>Роль: {userRole}</span>
        <button 
          className="admin-button" 
          onClick={createTestData}
          disabled={creatingTestData}
          style={{ backgroundColor: '#6c757d' }}
        >
          {creatingTestData ? 'Создание...' : 'Создать тестовые данные'}
        </button>
      </div>
      
      <div className="dictionary-tabs">
        <button
          className={`dictionary-tab ${activeDictionary === 'brands' ? 'active' : ''}`}
          onClick={() => setActiveDictionary('brands')}
        >
          Марки
        </button>
        <button
          className={`dictionary-tab ${activeDictionary === 'models' ? 'active' : ''}`}
          onClick={() => setActiveDictionary('models')}
        >
          Модели
        </button>
        <button
          className={`dictionary-tab ${activeDictionary === 'fuel-types' ? 'active' : ''}`}
          onClick={() => setActiveDictionary('fuel-types')}
        >
          Типы топлива
        </button>
        <button
          className={`dictionary-tab ${activeDictionary === 'transmission-types' ? 'active' : ''}`}
          onClick={() => setActiveDictionary('transmission-types')}
        >
          Коробки передач
        </button>
        <button
          className={`dictionary-tab ${activeDictionary === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveDictionary('colors')}
        >
          Цвета
        </button>
      </div>

      <div className="dictionary-content">
        {renderDictionaryContent()}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Добавить запись</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="admin-modal-content">
                <div className="admin-form-group">
                  <label className="admin-form-label">Название</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />
                </div>
                
                {activeDictionary === 'models' && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Марка автомобиля</label>
                    <select
                      className="admin-form-select"
                      value={newItem.brand_id}
                      onChange={(e) => setNewItem({ ...newItem, brand_id: e.target.value })}
                      required
                    >
                      <option value="">Выберите марку</option>
                      {Array.isArray(brands) && brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="admin-button">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Изменить запись</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateItem}>
              <div className="admin-modal-content">
                <div className="admin-form-group">
                  <label className="admin-form-label">Название</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    required
                  />
                </div>
                
                {activeDictionary === 'models' && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Марка автомобиля</label>
                    <select
                      className="admin-form-select"
                      value={selectedItem.brand_id}
                      onChange={(e) => setSelectedItem({ ...selectedItem, brand_id: e.target.value })}
                      required
                    >
                      <option value="">Выберите марку</option>
                      {Array.isArray(brands) && brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="admin-button">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Brand Modal */}
      {showLinkBrandModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Установить связь с маркой</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowLinkBrandModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleLinkBrand}>
              <div className="admin-modal-content">
                <p>Модель: <strong>{selectedItem?.name}</strong></p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Марка автомобиля</label>
                  <select
                    className="admin-form-select"
                    value={selectedItem?.brand_id || ''}
                    onChange={(e) => setSelectedItem({ 
                      ...selectedItem, 
                      brand_id: e.target.value 
                    })}
                    required
                  >
                    <option value="">Выберите марку</option>
                    {Array.isArray(brands) && brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowLinkBrandModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="admin-button">
                  Установить связь
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно для подтверждения удаления */}
      {showDeleteModal && selectedItem && (
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
              <p>Вы действительно хотите удалить запись:</p>
              <p>
                <strong>ID:</strong> {selectedItem.id}
              </p>
              <p>
                <strong>Название:</strong> {selectedItem.name}
              </p>
              {activeDictionary === 'models' && selectedItem.brand_id && (
                <p>
                  <strong>Марка:</strong> {getBrandName(selectedItem.brand_id)}
                </p>
              )}
              <p className="delete-warning">Это действие нельзя отменить!</p>
              <p>
                Удаление может привести к нарушению работоспособности сайта, если запись используется в существующих данных.
              </p>
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
                onClick={() => handleDeleteItem(selectedItem.id)}
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

export default DictionaryManagement; 
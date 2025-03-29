import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CarManagement = () => {
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [carStatuses, setCarStatuses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissionTypes, setTransmissionTypes] = useState([]);
  const [colors, setColors] = useState([]);
  const [newCar, setNewCar] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    price: '',
    mileage: '',
    status: 'available',
    description: '',
    fuel_type: '',
    transmission: '',
    images: []
  });

  // Получение справочных данных при загрузке компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        // Получаем все справочные данные для выпадающих списков
        const [brandsRes, fuelTypesRes, transmissionTypesRes, colorsRes] = await Promise.all([
          axios.get(`${apiUrl}/api/admin/cars/brands`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/admin/cars/fuel-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/admin/cars/transmission-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/admin/cars/colors`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        console.log('Загруженные справочники:', {
          brands: brandsRes.data,
          fuelTypes: fuelTypesRes.data,
          transmissionTypes: transmissionTypesRes.data,
          colors: colorsRes.data
        });
        
        // Устанавливаем полученные данные в state
        setBrands(brandsRes.data);
        setFuelTypes(fuelTypesRes.data);
        setTransmissionTypes(transmissionTypesRes.data);
        setColors(colorsRes.data);
        
        // Если есть марки, загружаем модели для первой марки по умолчанию
        if (brandsRes.data.length > 0) {
          const defaultBrandId = brandsRes.data[0].id;
          await fetchModelsByBrand(defaultBrandId);
        }
        
        // Загружаем список автомобилей
        await fetchCars();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading reference data:', error);
        toast.error('Ошибка при загрузке справочных данных');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Функция загрузки моделей по выбранной марке
  const fetchModelsByBrand = async (brandId) => {
    if (!brandId) {
      console.warn('No brand ID provided for fetching models');
      setModels([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      console.log(`Загружаем модели для марки с ID: ${brandId}`);
      const response = await axios.get(
        `${apiUrl}/api/admin/cars/models?brand=${brandId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log(`Загруженные модели для марки ${brandId}:`, response.data);
      
      if (Array.isArray(response.data)) {
        setModels(response.data);
      } else {
        console.error('API вернул некорректный формат данных для моделей:', response.data);
        toast.error('Ошибка загрузки моделей: неверный формат данных');
        setModels([]);
      }
      
      // Сбрасываем выбранную модель после изменения бренда
      setNewCar(prev => ({ ...prev, model: '' }));
      if (selectedCar && selectedCar.id) {
        setSelectedCar(prev => ({ ...prev, model: '' }));
      }
    } catch (error) {
      console.error(`Error loading models for brand ${brandId}:`, error);
      toast.error('Ошибка при загрузке моделей');
      setModels([]);
    }
  };

  // Обработчик изменения марки в форме добавления
  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    console.log('Selected brand ID:', brandId);
    
    setNewCar(prev => ({ ...prev, brand: brandId }));
    fetchModelsByBrand(brandId);
  };
  
  // Обработчик изменения марки в форме редактирования
  const handleEditBrandChange = (e) => {
    const brandId = e.target.value;
    console.log('Selected brand ID for edit:', brandId);
    
    setSelectedCar(prev => ({ ...prev, brand: brandId }));
    fetchModelsByBrand(brandId);
  };

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      console.log("API URL:", apiUrl); // Для отладки
      
      const response = await axios.get(`${apiUrl}/api/admin/cars`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Cars response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setCars(response.data);
      } else {
        console.error("API response is not an array:", response.data);
        setCars([]);
        toast.error('Данные автомобилей получены в неверном формате');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast.error('Ошибка при загрузке автомобилей');
      setCars([]);
      setIsLoading(false);
    }
  };

  const fetchCarStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/cars/statuses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Car statuses response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setCarStatuses(response.data);
      } else {
        console.error("API statuses response is not an array:", response.data);
        setCarStatuses([
          { value: 'available', label: 'Доступен' },
          { value: 'rented', label: 'Арендован' },
          { value: 'maintenance', label: 'В ремонте' }
        ]); // Дефолтные значения
      }
    } catch (error) {
      console.error('Error fetching car statuses:', error);
      // Устанавливаем дефолтные значения в случае ошибки
      setCarStatuses([
        { value: 'available', label: 'Доступен' },
        { value: 'rented', label: 'Арендован' },
        { value: 'maintenance', label: 'В ремонте' }
      ]);
    }
  };

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/cars/models`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Models response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setModels(response.data);
      } else {
        console.error("API models response is not an array:", response.data);
        // Устанавливаем дефолтные значения
        setModels([
          { id: 1, brand_id: 1, name: 'X5' },
          { id: 2, brand_id: 1, name: 'X6' },
          { id: 3, brand_id: 2, name: 'E-Class' },
          { id: 4, brand_id: 2, name: 'S-Class' },
          { id: 5, brand_id: 3, name: 'A6' },
          { id: 6, brand_id: 3, name: 'Q7' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      // Устанавливаем дефолтные значения в случае ошибки
      setModels([
        { id: 1, brand_id: 1, name: 'X5' },
        { id: 2, brand_id: 1, name: 'X6' },
        { id: 3, brand_id: 2, name: 'E-Class' },
        { id: 4, brand_id: 2, name: 'S-Class' },
        { id: 5, brand_id: 3, name: 'A6' },
        { id: 6, brand_id: 3, name: 'Q7' }
      ]);
    }
  };

  const fetchFuelTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/cars/fuel-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Fuel types response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setFuelTypes(response.data);
      } else {
        console.error("API fuel types response is not an array:", response.data);
        // Устанавливаем дефолтные значения
        setFuelTypes([
          { id: 1, name: 'Бензин' },
          { id: 2, name: 'Дизель' },
          { id: 3, name: 'Электро' },
          { id: 4, name: 'Гибрид' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error);
      // Устанавливаем дефолтные значения в случае ошибки
      setFuelTypes([
        { id: 1, name: 'Бензин' },
        { id: 2, name: 'Дизель' },
        { id: 3, name: 'Электро' },
        { id: 4, name: 'Гибрид' }
      ]);
    }
  };

  const fetchTransmissionTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/cars/transmission-types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Transmission types response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setTransmissionTypes(response.data);
      } else {
        console.error("API transmission types response is not an array:", response.data);
        // Устанавливаем дефолтные значения
        setTransmissionTypes([
          { id: 1, name: 'Автомат' },
          { id: 2, name: 'Механика' },
          { id: 3, name: 'Робот' },
          { id: 4, name: 'Вариатор' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching transmission types:', error);
      // Устанавливаем дефолтные значения в случае ошибки
      setTransmissionTypes([
        { id: 1, name: 'Автомат' },
        { id: 2, name: 'Механика' },
        { id: 3, name: 'Робот' },
        { id: 4, name: 'Вариатор' }
      ]);
    }
  };

  const fetchColors = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/admin/cars/colors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Colors response:", response.data); // Для отладки
      
      if (Array.isArray(response.data)) {
        setColors(response.data);
      } else {
        console.error("API colors response is not an array:", response.data);
        // Устанавливаем дефолтные значения
        setColors([
          { id: 1, name: 'Черный' },
          { id: 2, name: 'Белый' },
          { id: 3, name: 'Серебристый' },
          { id: 4, name: 'Красный' },
          { id: 5, name: 'Синий' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching colors:', error);
      // Устанавливаем дефолтные значения в случае ошибки
      setColors([
        { id: 1, name: 'Черный' },
        { id: 2, name: 'Белый' },
        { id: 3, name: 'Серебристый' },
        { id: 4, name: 'Красный' },
        { id: 5, name: 'Синий' }
      ]);
    }
  };

  // Фильтрация моделей по выбранному бренду
  const getFilteredModels = (brandId) => {
    if (!brandId) return [];
    
    console.log('Фильтрация моделей для брэнда:', brandId);
    console.log('Доступные модели:', models);
    
    const filtered = Array.isArray(models) 
      ? models.filter(model => {
          console.log(`Модель: ${model.name}, brand_id: ${model.brand_id}, сравниваем с ${brandId}`);
          return model.brand_id == brandId;
        })
      : [];
    
    console.log('Отфильтрованные модели:', filtered);
    return filtered;
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewCar({ ...newCar, images: filesArray });
    }
  };

  const handleEditFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedCar({ ...selectedCar, newImages: filesArray });
    }
  };

  const renderImagePreviews = (images) => {
    if (!images || images.length === 0) return <p>Нет выбранных изображений</p>;
    
    return (
      <div className="image-preview-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
        {images.map((image, index) => (
          <div key={index} className="image-preview" style={{ position: 'relative' }}>
            <img 
              src={URL.createObjectURL(image)} 
              alt={`Preview ${index}`} 
              style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <span 
              onClick={() => handleRemoveImage(index)} 
              style={{ 
                position: 'absolute', 
                top: '-8px', 
                right: '-8px', 
                background: '#ff4d4f', 
                color: 'white', 
                borderRadius: '50%', 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>
    );
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...newCar.images];
    updatedImages.splice(index, 1);
    setNewCar({ ...newCar, images: updatedImages });
  };

  const handleRemoveNewImage = (index) => {
    if (selectedCar && selectedCar.newImages) {
      const updatedImages = [...selectedCar.newImages];
      updatedImages.splice(index, 1);
      setSelectedCar({ ...selectedCar, newImages: updatedImages });
    }
  };

  const handleRemoveExistingImage = async (imageId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.delete(
        `${apiUrl}/api/admin/cars/${selectedCar.id}/images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedImages = selectedCar.images.filter(img => img.id !== imageId);
      setSelectedCar({ ...selectedCar, images: updatedImages });
      
      toast.success('Изображение удалено');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Ошибка при удалении изображения');
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    
    // Детальное логирование формы перед обработкой
    console.log('Форма перед обработкой:', JSON.stringify(newCar, null, 2));
    
    // Детальное логирование загруженных списков
    console.log('Доступные марки:', brands);
    console.log('Доступные модели:', models);
    console.log('Доступные типы топлива:', fuelTypes);
    console.log('Доступные типы трансмиссий:', transmissionTypes);
    console.log('Доступные цвета:', colors);
    
    // Проверка выбранных значений
    if (!newCar.brand) {
      toast.error('Выберите марку автомобиля');
      return;
    }
    
    if (!newCar.model) {
      toast.error('Выберите модель автомобиля');
      return;
    }
    
    if (!newCar.fuel_type) {
      toast.error('Выберите тип топлива');
      return;
    }
    
    if (!newCar.transmission) {
      toast.error('Выберите тип трансмиссии');
      return;
    }
    
    if (!newCar.color) {
      toast.error('Выберите цвет автомобиля');
      return;
    }
    
    if (!newCar.images || newCar.images.length === 0) {
      toast.error('Добавьте хотя бы одно изображение');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const formData = new FormData();
      
      // Проверяем содержимое всех полей перед отправкой
      console.log('Значения выбора в форме:');
      console.log('Brand ID:', newCar.brand);
      console.log('Model ID:', newCar.model);
      console.log('Fuel Type ID:', newCar.fuel_type);
      console.log('Transmission ID:', newCar.transmission);
      console.log('Color ID:', newCar.color);
      
      // Добавляем данные в форму согласно ожидаемых сервером полей
      formData.append('brand', newCar.brand.toString());
      formData.append('model', newCar.model.toString());
      formData.append('year', newCar.year ? newCar.year.toString() : new Date().getFullYear().toString());
      formData.append('color', newCar.color.toString());
      formData.append('fuel_type', newCar.fuel_type.toString());
      formData.append('transmission', newCar.transmission.toString());
      formData.append('price', newCar.price ? newCar.price.toString() : '0');
      formData.append('mileage', newCar.mileage ? newCar.mileage.toString() : '0');
      formData.append('status', newCar.status || 'available');
      formData.append('description', newCar.description || '');
      
      // Добавляем файлы изображений
      if (newCar.images && newCar.images.length > 0) {
        newCar.images.forEach(image => {
          formData.append('images', image);
        });
      }
      
      // Логирование отправляемых данных после обработки
      console.log('Отправляемые данные после обработки:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'images') {
          console.log(`${key}: "${value}" (${typeof value})`);
        } else {
          console.log(`${key}: [Файл]`);
        }
      }

      const response = await axios.post(
        `${apiUrl}/api/admin/cars`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      console.log('Ответ сервера:', response.data);
      
      setShowAddCarModal(false);
      setNewCar({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        price: '',
        mileage: '',
        status: 'available',
        description: '',
        fuel_type: '',
        transmission: '',
        images: []
      });
      
      toast.success('Автомобиль успешно добавлен');
      fetchCars();
    } catch (error) {
      console.error('Error adding car:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      // Дополнительное логирование для отладки
      if (error.response && error.response.data) {
        console.error('Response data details:');
        console.error('Message:', error.response.data.message);
        console.error('Missing Fields:', error.response.data.missingFields);
        console.error('Invalid Fields:', error.response.data.invalidFields);
        console.error('Received Data:', error.response.data.receivedData);
        console.error('Received Values:', error.response.data.receivedValues);
        console.error('Complete Response:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Расширенная обработка ошибок
      let errorMessage = 'Ошибка при добавлении автомобиля';
      
      if (error.response) {
        console.log('Error response full data:', JSON.stringify(error.response.data));
        
        // Проверяем все возможные форматы ошибки
        if (error.response.data) {
          if (error.response.data.message && typeof error.response.data.message === 'string') {
            errorMessage = error.response.data.message;
          }
          
          // Проверяем missingFields
          if (error.response.data.missingFields) {
            const mFields = error.response.data.missingFields;
            if (Array.isArray(mFields) && mFields.length > 0) {
              errorMessage += `. Отсутствуют поля: ${mFields.join(', ')}`;
            }
          }
          
          // Проверяем invalidFields
          if (error.response.data.invalidFields) {
            const iFields = error.response.data.invalidFields;
            if (Array.isArray(iFields) && iFields.length > 0) {
              errorMessage += `. Некорректные поля: ${iFields.join(', ')}`;
            }
          }
          
          // Если есть errors как массив или объект
          if (error.response.data.errors) {
            console.log('Server validation errors:', error.response.data.errors);
            if (Array.isArray(error.response.data.errors)) {
              const errMsgs = error.response.data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join('; ');
              errorMessage += `. Ошибки валидации: ${errMsgs}`;
            } else if (typeof error.response.data.errors === 'object') {
              const errMsgs = Object.entries(error.response.data.errors).map(([k, v]) => `${k}: ${v}`).join('; ');
              errorMessage += `. Ошибки валидации: ${errMsgs}`;
            }
          }
        }
      }
      
      console.log('Final error message:', errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    
    // Детальное логирование формы перед обработкой
    console.log('Форма обновления перед обработкой:', {
      brand: selectedCar.brand,
      model: selectedCar.model,
      year: selectedCar.year,
      color: selectedCar.color,
      fuel_type: selectedCar.fuel_type,
      transmission: selectedCar.transmission,
      images: selectedCar.images?.length || 0,
      newImages: selectedCar.newImages?.length || 0
    });
    
    // Принудительная проверка и преобразование значений из селектов
    const brandId = parseInt(selectedCar.brand || "0");
    const modelId = parseInt(selectedCar.model || "0");
    const fuelTypeId = parseInt(selectedCar.fuel_type || "0");
    const transmissionId = parseInt(selectedCar.transmission || "0");
    const colorId = parseInt(selectedCar.color || "0");
    
    console.log('Преобразованные идентификаторы для обновления:', {
      brandId, modelId, fuelTypeId, transmissionId, colorId
    });
    
    // Проверяем, что значения валидны
    const invalidFields = [];
    if (isNaN(brandId) || brandId <= 0) invalidFields.push('brand');
    if (isNaN(modelId) || modelId <= 0) invalidFields.push('model');
    if (isNaN(fuelTypeId) || fuelTypeId <= 0) invalidFields.push('fuel_type');
    if (isNaN(transmissionId) || transmissionId <= 0) invalidFields.push('transmission');
    if (isNaN(colorId) || colorId <= 0) invalidFields.push('color');
    
    if (invalidFields.length > 0) {
      console.error('Invalid fields detected when updating:', invalidFields);
      toast.error(`Необходимо выбрать корректные значения для: ${invalidFields.join(', ')}`);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const formData = new FormData();
      
      // Проверяем содержимое всех полей перед отправкой
      console.log('Оригинальные значения выбора в форме обновления:');
      console.log('Brand ID:', selectedCar.brand, 'Brand Object:', brands.find(b => b.id == selectedCar.brand));
      console.log('Model ID:', selectedCar.model, 'Model Object:', models.find(m => m.id == selectedCar.model));
      console.log('Color ID:', selectedCar.color, 'Color Object:', colors.find(c => c.id == selectedCar.color));
      console.log('Fuel Type ID:', selectedCar.fuel_type, 'Fuel Type Object:', fuelTypes.find(f => f.id == selectedCar.fuel_type));
      console.log('Transmission ID:', selectedCar.transmission, 'Transmission Object:', transmissionTypes.find(t => t.id == selectedCar.transmission));
      
      // Добавляем данные в форму согласно ожидаемых сервером полей
      formData.append('brand', String(brandId));
      formData.append('model', String(modelId));
      formData.append('year', String(selectedCar.year || new Date().getFullYear()));
      formData.append('color', String(colorId));
      formData.append('fuel_type', String(fuelTypeId));
      formData.append('transmission', String(transmissionId));
      formData.append('price', String(selectedCar.price || 0));
      formData.append('mileage', String(selectedCar.mileage || 0));
      formData.append('status', String(selectedCar.status || 'available'));
      formData.append('description', String(selectedCar.description || ''));
      
      // Добавляем новые изображения, если они есть
      if (selectedCar.newImages && selectedCar.newImages.length > 0) {
        selectedCar.newImages.forEach(image => {
          formData.append('images', image);
        });
      }
      
      // Логирование отправляемых данных после обработки
      console.log('Отправляемые данные для обновления после обработки:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'images') {
          console.log(`${key}: "${value}" (${typeof value})`);
        } else {
          console.log(`${key}: [Файл]`);
        }
      }

      const response = await axios.put(
        `${apiUrl}/api/admin/cars/${selectedCar.id}`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      console.log('Ответ сервера при обновлении:', response.data);
      
      setShowEditCarModal(false);
      toast.success('Автомобиль успешно обновлен');
      fetchCars();
    } catch (error) {
      console.error('Error updating car:', error);
      console.error('Error details:', error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response details');
      
      // Расширенная обработка ошибок
      let errorMessage = 'Ошибка при обновлении автомобиля';
      
      if (error.response) {
        console.log('Error response full data:', JSON.stringify(error.response.data));
        
        // Проверяем все возможные форматы ошибки
        if (error.response.data) {
          if (error.response.data.message && typeof error.response.data.message === 'string') {
            errorMessage = error.response.data.message;
          }
          
          // Проверяем missingFields
          if (error.response.data.missingFields) {
            const mFields = error.response.data.missingFields;
            if (Array.isArray(mFields) && mFields.length > 0) {
              errorMessage += `. Отсутствуют поля: ${mFields.join(', ')}`;
            }
          }
          
          // Проверяем invalidFields
          if (error.response.data.invalidFields) {
            const iFields = error.response.data.invalidFields;
            if (Array.isArray(iFields) && iFields.length > 0) {
              errorMessage += `. Некорректные поля: ${iFields.join(', ')}`;
            }
          }
          
          // Если есть errors как массив или объект
          if (error.response.data.errors) {
            console.log('Server validation errors:', error.response.data.errors);
            if (Array.isArray(error.response.data.errors)) {
              const errMsgs = error.response.data.errors.map(e => e.msg || e.message || JSON.stringify(e)).join('; ');
              errorMessage += `. Ошибки валидации: ${errMsgs}`;
            } else if (typeof error.response.data.errors === 'object') {
              const errMsgs = Object.entries(error.response.data.errors).map(([k, v]) => `${k}: ${v}`).join('; ');
              errorMessage += `. Ошибки валидации: ${errMsgs}`;
            }
          }
        }
      }
      
      console.log('Final error message:', errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.put(
        `${apiUrl}/api/admin/cars/${selectedCar.id}/status`,
        { status: selectedCar.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowStatusModal(false);
      toast.success('Статус автомобиля успешно обновлен');
      fetchCars();
    } catch (error) {
      console.error('Error updating car status:', error);
      toast.error(error.response?.data?.message || 'Ошибка при обновлении статуса');
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот автомобиль?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.delete(
        `${apiUrl}/api/admin/cars/${carId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Автомобиль успешно удален');
      fetchCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error(error.response?.data?.message || 'Ошибка при удалении автомобиля');
    }
  };

  // Добавим вспомогательные функции для получения названий из ID
  const getBrandName = (brandId) => {
    if (!brandId || !Array.isArray(brands)) return 'Не указан';
    const brand = brands.find(b => b.id == brandId);
    return brand ? brand.name : 'Не указан';
  };

  const getModelName = (modelId) => {
    if (!modelId || !Array.isArray(models)) return 'Не указан';
    const model = models.find(m => m.id == modelId);
    return model ? model.name : 'Не указан';
  };

  const getFuelTypeName = (fuelTypeId) => {
    if (!fuelTypeId || !Array.isArray(fuelTypes)) return 'Не указан';
    const fuelType = fuelTypes.find(ft => ft.id == fuelTypeId);
    return fuelType ? fuelType.name : 'Не указан';
  };

  const getTransmissionName = (transmissionId) => {
    if (!transmissionId || !Array.isArray(transmissionTypes)) return 'Не указан';
    const transmission = transmissionTypes.find(t => t.id == transmissionId);
    return transmission ? transmission.name : 'Не указан';
  };

  const getColorName = (colorId) => {
    if (!colorId || !Array.isArray(colors)) return 'Не указан';
    const color = colors.find(c => c.id == colorId);
    return color ? color.name : 'Не указан';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Доступен';
      case 'rented':
        return 'Арендован';
      case 'maintenance':
        return 'В ремонте';
      default:
        return status;
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Управление автомобилями</h2>
        <button className="admin-button" onClick={() => setShowAddCarModal(true)}>
          Добавить автомобиль
        </button>
      </div>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Бренд</th>
              <th>Модель</th>
              <th>Год</th>
              <th>Тип топлива</th>
              <th>КПП</th>
              <th>Цена</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(cars) || cars.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>
                  Автомобили не найдены
                </td>
              </tr>
            ) : (
              cars.map((car) => (
                <tr key={car.id}>
                  <td>{car.id}</td>
                  <td>{getBrandName(car.brand)}</td>
                  <td>{getModelName(car.model)}</td>
                  <td>{car.year}</td>
                  <td>{getFuelTypeName(car.fuel_type)}</td>
                  <td>{getTransmissionName(car.transmission)}</td>
                  <td>{car.price} руб./день</td>
                  <td>
                    <span className={`car-status ${car.status}`}>
                      {getStatusLabel(car.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setSelectedCar(car);
                        setShowStatusModal(true);
                      }}
                      style={{ marginRight: '5px' }}
                    >
                      Статус
                    </button>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setSelectedCar(car);
                        setShowEditCarModal(true);
                      }}
                      style={{ marginRight: '5px' }}
                    >
                      Изменить
                    </button>
                    <button
                      className="admin-button secondary"
                      onClick={() => handleDeleteCar(car.id)}
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

      {/* Add Car Modal */}
      {showAddCarModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Добавить автомобиль</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowAddCarModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddCar}>
              <div className="admin-modal-content">
                <div className="admin-form-group">
                  <label className="admin-form-label">Бренд</label>
                  <select
                    className="admin-form-select"
                    value={newCar.brand}
                    onChange={handleBrandChange}
                    required
                  >
                    <option value="">Выберите бренд</option>
                    {Array.isArray(brands) && brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Модель</label>
                  <select
                    className="admin-form-select"
                    value={newCar.model}
                    onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                    required
                    disabled={!newCar.brand} // Блокируем выбор модели, если не выбран бренд
                  >
                    <option value="">Выберите модель</option>
                    {getFilteredModels(parseInt(newCar.brand)).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Год выпуска</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={newCar.year}
                    onChange={(e) => setNewCar({ ...newCar, year: e.target.value })}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Цвет</label>
                  <select
                    className="admin-form-select"
                    value={newCar.color}
                    onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                    required
                  >
                    <option value="">Выберите цвет</option>
                    {Array.isArray(colors) && colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Тип топлива</label>
                  <select
                    className="admin-form-select"
                    value={newCar.fuel_type}
                    onChange={(e) => setNewCar({ ...newCar, fuel_type: e.target.value })}
                    required
                  >
                    <option value="">Выберите тип топлива</option>
                    {Array.isArray(fuelTypes) && fuelTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Коробка передач</label>
                  <select
                    className="admin-form-select"
                    value={newCar.transmission}
                    onChange={(e) => setNewCar({ ...newCar, transmission: e.target.value })}
                    required
                  >
                    <option value="">Выберите КПП</option>
                    {Array.isArray(transmissionTypes) && transmissionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Цена (руб./день)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={newCar.price}
                    onChange={(e) => setNewCar({ ...newCar, price: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Пробег (км)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={newCar.mileage}
                    onChange={(e) => setNewCar({ ...newCar, mileage: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Статус</label>
                  <select
                    className="admin-form-select"
                    value={newCar.status}
                    onChange={(e) => setNewCar({ ...newCar, status: e.target.value })}
                  >
                    {Array.isArray(carStatuses) && carStatuses.length > 0 ? (
                      carStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="available">Доступен</option>
                        <option value="rented">Арендован</option>
                        <option value="maintenance">В ремонте</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Описание</label>
                  <textarea
                    className="admin-form-textarea"
                    value={newCar.description}
                    onChange={(e) => setNewCar({ ...newCar, description: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Изображения</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    multiple
                    required
                  />
                  <small>Выберите одно или несколько изображений для автомобиля</small>
                  {newCar.images.length > 0 && renderImagePreviews(newCar.images)}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowAddCarModal(false)}
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

      {/* Edit Car Modal */}
      {showEditCarModal && selectedCar && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Редактировать автомобиль</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowEditCarModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateCar}>
              <div className="admin-modal-content">
                <div className="admin-form-group">
                  <label className="admin-form-label">Бренд</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.brand}
                    onChange={handleEditBrandChange}
                    required
                  >
                    <option value="">Выберите бренд</option>
                    {Array.isArray(brands) && brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Модель</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.model}
                    onChange={(e) => setSelectedCar({ ...selectedCar, model: e.target.value })}
                    required
                    disabled={!selectedCar.brand}
                  >
                    <option value="">Выберите модель</option>
                    {getFilteredModels(parseInt(selectedCar.brand)).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Год выпуска</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={selectedCar.year}
                    onChange={(e) => setSelectedCar({ ...selectedCar, year: e.target.value })}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Цвет</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.color}
                    onChange={(e) => setSelectedCar({ ...selectedCar, color: e.target.value })}
                    required
                  >
                    <option value="">Выберите цвет</option>
                    {Array.isArray(colors) && colors.map((color) => (
                      <option key={color.id} value={color.id}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Тип топлива</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.fuel_type}
                    onChange={(e) => setSelectedCar({ ...selectedCar, fuel_type: e.target.value })}
                    required
                  >
                    <option value="">Выберите тип топлива</option>
                    {Array.isArray(fuelTypes) && fuelTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Коробка передач</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.transmission}
                    onChange={(e) => setSelectedCar({ ...selectedCar, transmission: e.target.value })}
                    required
                  >
                    <option value="">Выберите КПП</option>
                    {Array.isArray(transmissionTypes) && transmissionTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Цена (руб./день)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={selectedCar.price}
                    onChange={(e) => setSelectedCar({ ...selectedCar, price: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Пробег (км)</label>
                  <input
                    type="number"
                    className="admin-form-input"
                    value={selectedCar.mileage}
                    onChange={(e) => setSelectedCar({ ...selectedCar, mileage: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Статус</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.status}
                    onChange={(e) => setSelectedCar({ ...selectedCar, status: e.target.value })}
                  >
                    {Array.isArray(carStatuses) && carStatuses.length > 0 ? (
                      carStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="available">Доступен</option>
                        <option value="rented">Арендован</option>
                        <option value="maintenance">В ремонте</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Описание</label>
                  <textarea
                    className="admin-form-textarea"
                    value={selectedCar.description}
                    onChange={(e) => setSelectedCar({ ...selectedCar, description: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Текущие изображения</label>
                  <div className="current-images" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                    {selectedCar.images && selectedCar.images.length > 0 ? (
                      selectedCar.images.map(img => (
                        <div key={img.id} style={{ position: 'relative' }}>
                          <img 
                            src={img.image_url} 
                            alt={`${selectedCar.brand} ${selectedCar.model}`}
                            style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <span 
                            onClick={() => handleRemoveExistingImage(img.id)} 
                            style={{ 
                              position: 'absolute', 
                              top: '-8px', 
                              right: '-8px', 
                              background: '#ff4d4f', 
                              color: 'white', 
                              borderRadius: '50%', 
                              width: '20px', 
                              height: '20px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            ×
                          </span>
                        </div>
                      ))
                    ) : (
                      <p>Нет доступных изображений</p>
                    )}
                  </div>
                  
                  <label className="admin-form-label">Добавить новые изображения</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    multiple
                  />
                  <small>Загрузите новые изображения, чтобы добавить их к автомобилю</small>
                  
                  {selectedCar.newImages && selectedCar.newImages.length > 0 && (
                    <div>
                      <p>Новые изображения:</p>
                      <div className="new-images-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {selectedCar.newImages.map((image, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img 
                              src={URL.createObjectURL(image)} 
                              alt={`New preview ${index}`} 
                              style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <span 
                              onClick={() => handleRemoveNewImage(index)} 
                              style={{ 
                                position: 'absolute', 
                                top: '-8px', 
                                right: '-8px', 
                                background: '#ff4d4f', 
                                color: 'white', 
                                borderRadius: '50%', 
                                width: '20px', 
                                height: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              ×
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowEditCarModal(false)}
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

      {/* Update Status Modal */}
      {showStatusModal && selectedCar && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Изменить статус автомобиля</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="admin-modal-content">
                <p>
                  Автомобиль: {selectedCar.brand} {selectedCar.model} ({selectedCar.year})
                </p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Статус</label>
                  <select
                    className="admin-form-select"
                    value={selectedCar.status}
                    onChange={(e) => setSelectedCar({ ...selectedCar, status: e.target.value })}
                  >
                    {Array.isArray(carStatuses) && carStatuses.length > 0 ? (
                      carStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="available">Доступен</option>
                        <option value="rented">Арендован</option>
                        <option value="maintenance">В ремонте</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowStatusModal(false)}
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
    </div>
  );
};

export default CarManagement; 
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CarManagement = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    vin: '',
    license_plate: '',
    images: []
  });
  const [userRole, setUserRole] = useState('employee');

  // Add new state for filters
  const [filters, setFilters] = useState({
    search: '',
    brand: '',
    model: '',
    status: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    transmission: '',
    fuelType: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Получение справочных данных при загрузке компонента
  useEffect(() => {
    // Загружаем роль из localStorage при монтировании компонента
    const savedRole = localStorage.getItem('userRole');
    if (savedRole === 'admin') {
      setUserRole('admin');
      console.log('Setting user role from localStorage:', savedRole);
    } else {
      // Если в localStorage нет роли, пытаемся получить её от сервера
      getUserRole();
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        // Получаем все справочные данные для выпадающих списков
        const [brandsRes, fuelTypesRes, transmissionTypesRes, colorsRes, statusesRes] = await Promise.all([
          axios.get(`${apiUrl}/api/admin/cars/brands`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/admin/cars/fuel-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/admin/cars/transmission-types`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/admin/cars/colors`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${apiUrl}/api/cars/statuses`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        console.log('Загруженные справочники:', {
          brands: brandsRes.data,
          fuelTypes: fuelTypesRes.data,
          transmissionTypes: transmissionTypesRes.data,
          colors: colorsRes.data,
          statuses: statusesRes.data
        });
        
        // Устанавливаем полученные данные в state
        setBrands(brandsRes.data);
        setFuelTypes(fuelTypesRes.data);
        setTransmissionTypes(transmissionTypesRes.data);
        setColors(colorsRes.data);
        
        // Обрабатываем статусы в зависимости от формата ответа
        if (Array.isArray(statusesRes.data)) {
          if (statusesRes.data.length > 0) {
            if ('value' in statusesRes.data[0]) {
              // Формат уже правильный: { value, label }
              setCarStatuses(statusesRes.data);
            } else if ('status_name' in statusesRes.data[0]) {
              // Формат старый: { status_name, ... }
              setCarStatuses(statusesRes.data.map(status => ({
                value: status.status_name,
                label: getStatusLabel(status.status_name)
              })));
            } else {
              // Неизвестный формат, используем дефолтные значения
              setCarStatuses([
                { value: 'available', label: 'Доступен' },
                { value: 'maintenance', label: 'На обслуживании' },
                { value: 'sold', label: 'Продан' }
              ]);
            }
          } else {
            // Пустой массив, используем дефолтные значения
            setCarStatuses([
              { value: 'available', label: 'Доступен' },
              { value: 'maintenance', label: 'На обслуживании' },
              { value: 'sold', label: 'Продан' }
            ]);
          }
        } else {
          // Ответ не массив, используем дефолтные значения
          setCarStatuses([
            { value: 'available', label: 'Доступен' },
            { value: 'maintenance', label: 'На обслуживании' },
            { value: 'sold', label: 'Продан' }
          ]);
        }
        
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
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data
        });
        toast.error('Ошибка при загрузке справочных данных');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Функция загрузки моделей по выбранной марке
  const fetchModelsByBrand = async (brandId) => {
    if (!brandId) {
      setModels([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(
        `${apiUrl}/api/admin/cars/models?brand=${brandId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
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
      console.error(`Ошибка загрузки моделей для бренда ${brandId}:`, error);
      toast.error('Ошибка при загрузке моделей');
      setModels([]);
    }
  };

  // Обработчик изменения марки в форме добавления
  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setNewCar(prev => ({ ...prev, brand: brandId }));
    fetchModelsByBrand(brandId);
  };
  
  // Обновляем обработчик изменения бренда в форме редактирования
  const handleEditBrandChange = async (e) => {
    const brandId = parseInt(e.target.value);
    setSelectedCar(prev => ({ ...prev, brand: brandId, model: '' })); // Сбрасываем модель при смене бренда
    await fetchModelsByBrand(brandId);
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
      
      // Сначала попробуем прямой URL для статусов
      try {
        const response = await axios.get(`${apiUrl}/api/cars/statuses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Car statuses direct response:", response.data);
        
        if (Array.isArray(response.data)) {
          setCarStatuses(response.data);
          return;
        }
      } catch (directError) {
        console.log("Error fetching from direct URL, trying admin URL...");
      }
      
      // Если прямой URL не сработал, попробуем через admin
      const response = await axios.get(`${apiUrl}/api/admin/cars/statuses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Car statuses admin response:", response.data);
      
      if (Array.isArray(response.data)) {
        setCarStatuses(response.data);
      } else {
        console.error("API statuses response is not an array:", response.data);
        setCarStatuses([
          { value: 'available', label: 'Доступен' },
          { value: 'maintenance', label: 'На обслуживании' },
          { value: 'sold', label: 'Продан' }
        ]); // Дефолтные значения
      }
    } catch (error) {
      console.error('Error fetching car statuses:', error);
      // Устанавливаем дефолтные значения в случае ошибки
      setCarStatuses([
        { value: 'available', label: 'Доступен' },
        { value: 'maintenance', label: 'На обслуживании' },
        { value: 'sold', label: 'Продан' }
      ]);
    }
  };

  const fetchModels = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(`${apiUrl}/api/cars/models`, {
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
      
      const response = await axios.get(`${apiUrl}/api/cars/fuel-types`, {
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
      
      const response = await axios.get(`${apiUrl}/api/cars/transmission-types`, {
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
      
      const response = await axios.get(`${apiUrl}/api/cars/colors`, {
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

  // Обновляем функцию фильтрации моделей
  const getFilteredModels = (brandId) => {
    if (!brandId) return [];
    
    const filtered = Array.isArray(models) 
      ? models.filter(model => model.brand_id === parseInt(brandId))
      : [];
    
    if (filtered.length === 0 && models.length > 0) {
      console.warn(`Не найдены модели для бренда ${brandId}`);
    }
    
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
        `${apiUrl}/api/cars/${selectedCar.id}/images/${imageId}`,
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
    
    // Проверяем наличие всех обязательных полей
    const requiredFields = {
      brand: 'марку',
      model: 'модель',
      year: 'год выпуска',
      color: 'цвет',
      price: 'цену',
      fuel_type: 'тип топлива',
      transmission: 'коробку передач'
    };

    const missingFields = [];
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!newCar[field]) {
        missingFields.push(label);
      }
    });

    if (missingFields.length > 0) {
      toast.error(`Пожалуйста, заполните следующие поля: ${missingFields.join(', ')}`);
      return;
    }

    if (!newCar.images || newCar.images.length === 0) {
      toast.error('Добавьте хотя бы одно изображение');
      return;
    }

    // Проверяем корректность числовых полей
    const numericFields = {
      year: 'год выпуска',
      price: 'цену',
      mileage: 'пробег'
    };

    const invalidFields = [];
    Object.entries(numericFields).forEach(([field, label]) => {
      if (newCar[field] && isNaN(Number(newCar[field]))) {
        invalidFields.push(label);
      }
    });

    if (invalidFields.length > 0) {
      toast.error(`Следующие поля должны быть числами: ${invalidFields.join(', ')}`);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const formData = new FormData();

      // Логируем данные перед отправкой
      console.log('Отправляемые данные:', {
        brand: newCar.brand,
        model: newCar.model,
        year: newCar.year,
        color: newCar.color,
        price: newCar.price,
        mileage: newCar.mileage,
        fuel_type: newCar.fuel_type,
        transmission: newCar.transmission,
        status: newCar.status,
        description: newCar.description,
        images: newCar.images.length
      });
      
      // Добавляем данные в FormData с преобразованием в строки
      formData.append('brand', String(newCar.brand));
      formData.append('model', String(newCar.model));
      formData.append('year', String(newCar.year));
      formData.append('color', String(newCar.color));
      formData.append('price', String(newCar.price));
      formData.append('mileage', String(newCar.mileage || '0'));
      formData.append('fuel_type', String(newCar.fuel_type));
      formData.append('transmission', String(newCar.transmission));
      formData.append('status', newCar.status || 'available');
      formData.append('description', newCar.description || '');
      formData.append('vin', String(newCar.vin || ''));
      formData.append('license_plate', String(newCar.license_plate || ''));
      
      // Добавляем изображения
      newCar.images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      // Логируем содержимое FormData
      console.log('FormData содержимое:');
      for (let [key, value] of formData.entries()) {
        if (key !== 'images') {
          console.log(`${key}: ${value}`);
        } else {
          console.log(`${key}: [File]`);
        }
      }

      const response = await axios.post(
        `${apiUrl}/api/cars`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );
      
      console.log('Ответ сервера:', response.data);
      
      if (response.data.success) {
        toast.success('Автомобиль успешно добавлен');
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
          vin: '',
          license_plate: '',
          images: []
        });
        fetchCars();
      } else {
        toast.error(response.data.message || 'Ошибка при добавлении автомобиля');
      }
    } catch (error) {
      console.error('Ошибка при добавлении автомобиля:', error);
      console.error('Детали ошибки:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.data) {
        if (error.response.data.missingFields) {
          toast.error(`Необходимо заполнить поля: ${error.response.data.missingFields.join(', ')}`);
        } else if (error.response.data.notFoundFields) {
          toast.error(`Не найдены данные для полей: ${error.response.data.notFoundFields.join(', ')}`);
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Произошла ошибка при добавлении автомобиля');
        }
      } else {
        toast.error('Произошла ошибка при добавлении автомобиля');
      }
    }
  };

  const handleUpdateCar = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Create FormData object
      const formData = new FormData();
      
      // Add car data
      formData.append('brand', selectedCar.brand);
      formData.append('model', selectedCar.model);
      formData.append('year', selectedCar.year);
      formData.append('color', selectedCar.color);
      formData.append('price', selectedCar.price);
      formData.append('mileage', selectedCar.mileage || '0');
      formData.append('fuel_type', selectedCar.fuel_type);
      formData.append('transmission', selectedCar.transmission);
      formData.append('status', selectedCar.status);
      formData.append('description', selectedCar.description || '');
      formData.append('vin', String(selectedCar.vin || ''));
      formData.append('license_plate', String(selectedCar.license_plate || ''));

      // Add images to delete if any
      if (selectedCar.imagesToDelete && selectedCar.imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(selectedCar.imagesToDelete));
      }

      // Add new images if any
      if (selectedCar.newImages && selectedCar.newImages.length > 0) {
        selectedCar.newImages.forEach(image => {
          formData.append('images', image);
        });
      }

      const response = await axios.put(
        `${apiUrl}/api/cars/${selectedCar.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setShowEditCarModal(false);
        setSelectedCar(null);
        fetchCars();
        toast.success('Автомобиль успешно обновлен');
      }
    } catch (error) {
      console.error('Error updating car:', error);
      toast.error('Ошибка при обновлении автомобиля');
    }
  };

  // Добавляем функцию для обработки удаления изображений
  const handleImageDelete = (imageId) => {
    setSelectedCar(prev => ({
      ...prev,
      imagesToDelete: [...(prev.imagesToDelete || []), imageId],
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  // Добавляем функцию загрузки изображений при открытии формы редактирования
  const loadCarImages = async (carId) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      const response = await axios.get(
        `${apiUrl}/api/cars/${carId}/images`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data && Array.isArray(response.data)) {
        setSelectedCar(prev => ({
          ...prev,
          images: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading car images:', error);
      toast.error('Ошибка при загрузке изображений');
    }
  };

  // Обновляем обработчик открытия модального окна редактирования
  const handleEditClick = async (car) => {
    console.log('Исходные данные автомобиля:', car);
    
    // Создаем объект с данными автомобиля для редактирования
    const carForEdit = {
      id: car.id,
      brand: car.brand_id || car.brand,
      model: car.model_id || car.model,
      year: car.year,
      color: car.color_id || car.color,
      price: car.price,
      mileage: car.mileage || 0,
      description: car.description || '',
      fuel_type: car.fuel_type_id || car.fuel_type,
      transmission: car.transmission_id || car.transmission,
      status: car.status || 'available',
      newImages: [],
      images: car.images || [],
      imagesToDelete: [],
      vin: car.vin || '',
      license_plate: car.license_plate || ''
    };

    console.log('Подготовленные данные для редактирования:', carForEdit);

    // Если есть brand_id, загружаем модели для этого бренда
    if (carForEdit.brand) {
      await fetchModelsByBrand(carForEdit.brand);
    }

    // Проверяем и конвертируем все ID в числа
    const numericFields = ['brand', 'model', 'color', 'fuel_type', 'transmission'];
    numericFields.forEach(field => {
      if (carForEdit[field]) {
        carForEdit[field] = parseInt(carForEdit[field]);
      }
    });

    // Проверяем числовые значения
    carForEdit.year = parseInt(carForEdit.year);
    carForEdit.price = parseFloat(carForEdit.price);
    carForEdit.mileage = parseInt(carForEdit.mileage || 0);

    console.log('Финальные данные для редактирования:', carForEdit);

    setSelectedCar(carForEdit);
    await loadCarImages(car.id);
    setShowEditCarModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      // Убедимся, что статус имеет правильный формат
      const status = selectedCar.status;
      console.log('Updating car status:', { carId: selectedCar.id, status: status });
      
      if (!status) {
        toast.error('Статус не может быть пустым');
        return;
      }
      
      // Проверим, что статус находится в списке валидных статусов
      const validStatuses = ['available', 'maintenance', 'sold'];
      if (!validStatuses.includes(status)) {
        toast.error(`Некорректный статус: "${status}". Допустимые значения: available, maintenance, sold`);
        return;
      }
      
      const response = await axios.put(
        `${apiUrl}/api/cars/${selectedCar.id}/status`,
        { status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Status update response:', response.data);
      
      setShowStatusModal(false);
      toast.success('Статус автомобиля успешно обновлен');
      fetchCars();
    } catch (error) {
      console.error('Error updating car status:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Более подробное сообщение об ошибке
      if (error.response?.data?.message) {
        toast.error(`Ошибка: ${error.response.data.message}`);
      } else {
        toast.error('Ошибка при обновлении статуса автомобиля');
      }
    }
  };

  const handleDeleteCar = async (car) => {
    setSelectedCar(car);
    setShowDeleteModal(true);
  };

  const confirmDeleteCar = async () => {
    try {
      // Проверяем роль пользователя перед удалением
      const storedRole = localStorage.getItem('userRole');
      if (userRole !== 'admin' && storedRole !== 'admin') {
        toast.error('У вас нет прав для удаления автомобилей');
        setShowDeleteModal(false);
        setSelectedCar(null);
        return;
      }

      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.delete(
        `${apiUrl}/api/cars/${selectedCar.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Автомобиль успешно удален');
      setShowDeleteModal(false);
      setSelectedCar(null);
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
      case 'maintenance':
        return 'На обслуживании';
      case 'sold':
        return 'Продан';
      default:
        return status;
    }
  };

  // Add new function for filtering cars
  const filterCars = (carsToFilter) => {
    return carsToFilter.filter(car => {
      const matchesSearch = 
        getBrandName(car.brand).toLowerCase().includes(filters.search.toLowerCase()) ||
        getModelName(car.model).toLowerCase().includes(filters.search.toLowerCase()) ||
        car.year.toString().includes(filters.search) ||
        car.price.toString().includes(filters.search);

      const matchesBrand = !filters.brand || car.brand === parseInt(filters.brand);
      const matchesModel = !filters.model || car.model === parseInt(filters.model);
      const matchesStatus = !filters.status || car.status === filters.status;
      const matchesYear = 
        (!filters.yearFrom || car.year >= parseInt(filters.yearFrom)) &&
        (!filters.yearTo || car.year <= parseInt(filters.yearTo));
      const matchesPrice = 
        (!filters.priceFrom || car.price >= parseInt(filters.priceFrom)) &&
        (!filters.priceTo || car.price <= parseInt(filters.priceTo));
      const matchesTransmission = !filters.transmission || car.transmission === parseInt(filters.transmission);
      const matchesFuelType = !filters.fuelType || car.fuel_type === parseInt(filters.fuelType);

      return matchesSearch && matchesBrand && matchesModel && matchesStatus && 
             matchesYear && matchesPrice && matchesTransmission && matchesFuelType;
    });
  };

  // Add new function for sorting cars
  const sortCars = (carsToSort) => {
    if (!sortConfig.key) return carsToSort;

    return [...carsToSort].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Add new function for handling sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Add new function for handling filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update useEffect to apply filters and sorting
  useEffect(() => {
    const filtered = filterCars(cars);
    const sorted = sortCars(filtered);
    setFilteredCars(sorted);
    
    // Для отладки - выводим текущую роль
    console.log('Current role state:', userRole);
    console.log('Role from localStorage:', localStorage.getItem('userRole'));
  }, [cars, filters, sortConfig, userRole]);

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
          // Также сохраняем роль в localStorage для использования в других компонентах
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
      localStorage.setItem('userRole', 'employee');
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Управление автомобилями</h2>
        <button className="add-car-button" onClick={() => setShowAddCarModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Добавить автомобиль
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              placeholder="Поиск по бренду, модели, году или цене..."
              value={filters.search}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <select
              name="brand"
              value={filters.brand}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Все бренды</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Все модели</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">Все статусы</option>
              {carStatuses.map(status => (
                <option key={status.value || status.status_name} value={status.value || status.status_name}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="range-inputs">
            <div className="filter-group">
              <label>Год от</label>
              <input
                type="number"
                name="yearFrom"
                value={filters.yearFrom}
                onChange={handleFilterChange}
                className="filter-input"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="filter-group">
              <label>Год до</label>
              <input
                type="number"
                name="yearTo"
                value={filters.yearTo}
                onChange={handleFilterChange}
                className="filter-input"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Update table headers to include sorting */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('brand')} className="sortable">
                Бренд {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('model')} className="sortable">
                Модель {sortConfig.key === 'model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('year')} className="sortable">
                Год {sortConfig.key === 'year' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('price')} className="sortable">
                Цена {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} className="sortable">
                Статус {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredCars.map(car => (
              <tr key={car.id}>
                <td>{car.brand_name || getBrandName(car.brand)}</td>
                <td>{car.model_name || getModelName(car.model)}</td>
                <td>{car.year}</td>
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
                    onClick={() => handleEditClick(car)}
                    style={{ marginRight: '5px' }}
                  >
                    Изменить
                  </button>
                  {/* Кнопка удаления доступна только администраторам */}
                  {(userRole === 'admin' || localStorage.getItem('userRole') === 'admin') && (
                    <button
                      className="admin-button secondary"
                      onClick={() => handleDeleteCar(car)}
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
                  <label className="admin-form-label">VIN</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={newCar.vin}
                    onChange={(e) => setNewCar({ ...newCar, vin: e.target.value })}
                    maxLength="17"
                    placeholder="Введите VIN автомобиля"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Гос. номер</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={newCar.license_plate}
                    onChange={(e) => setNewCar({ ...newCar, license_plate: e.target.value })}
                    maxLength="20"
                    placeholder="Введите государственный номер"
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
                        <option key={status.value || status.status_name} value={status.value || status.status_name}>
                          {status.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="available">Доступен</option>
                        <option value="maintenance">На обслуживании</option>
                        <option value="sold">Продан</option>
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
                  <label className="admin-form-label">VIN</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={selectedCar.vin}
                    onChange={(e) => setSelectedCar({ ...selectedCar, vin: e.target.value })}
                    maxLength="17"
                    placeholder="Введите VIN автомобиля"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Гос. номер</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={selectedCar.license_plate}
                    onChange={(e) => setSelectedCar({ ...selectedCar, license_plate: e.target.value })}
                    maxLength="20"
                    placeholder="Введите государственный номер"
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
                        <option key={status.value || status.status_name} value={status.value || status.status_name}>
                          {status.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="available">Доступен</option>
                        <option value="maintenance">На обслуживании</option>
                        <option value="sold">Продан</option>
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
                            onClick={() => handleImageDelete(img.id)} 
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
                        <option key={status.value || status.status_name} value={status.value || status.status_name}>
                          {status.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="available">Доступен</option>
                        <option value="maintenance">На обслуживании</option>
                        <option value="sold">Продан</option>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCar && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal delete-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Подтверждение удаления</h3>
              <button
                className="admin-modal-close"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCar(null);
                }}
              >
                &times;
              </button>
            </div>
            <div className="admin-modal-content">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <p>Вы действительно хотите удалить автомобиль:</p>
                <div className="car-details">
                  <p><strong>Бренд:</strong> {getBrandName(selectedCar.brand)}</p>
                  <p><strong>Модель:</strong> {getModelName(selectedCar.model)}</p>
                  <p><strong>Год:</strong> {selectedCar.year}</p>
                  <p><strong>Цена:</strong> {selectedCar.price} руб./день</p>
                </div>
                <p className="warning-text">Это действие нельзя отменить!</p>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-button secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCar(null);
                }}
              >
                Отмена
              </button>
              <button
                type="button"
                className="admin-button delete"
                onClick={confirmDeleteCar}
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

export default CarManagement; 
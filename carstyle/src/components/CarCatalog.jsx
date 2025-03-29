// src/components/CarCatalog.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import CarCard from './CarCard';
import './CarCatalog.css';

const CarCatalog = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [carsPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissionTypes, setTransmissionTypes] = useState([]);
  const [filters, setFilters] = useState({
    brand: '',
    model: '',
    year: '',
    priceMin: '',
    priceMax: '',
    transmission: '',
    fuelType: '',
    searchQuery: '',
    sortBy: 'newest'
  });

  // Загрузка справочных данных
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        console.log('Fetching reference data...');
        
        const [brandsRes, fuelTypesRes, transmissionTypesRes] = await Promise.all([
          axios.get(`${apiUrl}/api/catalog/filter-options`),
          axios.get(`${apiUrl}/api/catalog/filter-options`),
          axios.get(`${apiUrl}/api/catalog/filter-options`)
        ]);
        
        console.log('Reference data loaded:', {
          brands: brandsRes.data.brands,
          fuelTypes: brandsRes.data.fuels,
          transmissionTypes: brandsRes.data.transmissions
        });
        
        setBrands(brandsRes.data.brands);
        setFuelTypes(brandsRes.data.fuels);
        setTransmissionTypes(brandsRes.data.transmissions);
        
      } catch (error) {
        console.error('Error loading reference data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
      }
    };
    
    fetchReferenceData();
  }, []);

  // Загрузка моделей при выборе бренда
  useEffect(() => {
    const fetchModels = async () => {
      if (!filters.brand) {
        setModels([]);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        const response = await axios.get(
          `${apiUrl}/api/catalog/filter-options`
        );
        
        const brandModels = response.data.models.filter(
          model => model.brand_id === parseInt(filters.brand)
        );
        
        setModels(brandModels);
      } catch (error) {
        console.error('Error loading models:', error);
        setModels([]);
      }
    };

    fetchModels();
  }, [filters.brand]);

  // Загрузка автомобилей
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || '';
        
        // Получаем список автомобилей
        const response = await axios.get(`${apiUrl}/api/catalog/cars`, {
          params: {
            brand: filters.brand,
            model: filters.model,
            year_from: filters.year,
            year_to: filters.year,
            price_from: filters.priceMin,
            price_to: filters.priceMax,
            transmission: filters.transmission,
            fuel: filters.fuelType
          }
        });

        console.log('Cars loaded:', response.data);
        setCars(response.data);
        setFilteredCars(response.data);
      } catch (error) {
        console.error('Error loading cars:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [filters]);

  // Фильтрация автомобилей
  useEffect(() => {
    let filtered = [...cars];

    // Поиск по тексту
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(car => 
        car.brand_name?.toLowerCase().includes(query) ||
        car.model_name?.toLowerCase().includes(query) ||
        car.year?.toString().includes(query)
      );
    }

    // Фильтры
    if (filters.brand) filtered = filtered.filter(car => car.brand === parseInt(filters.brand));
    if (filters.model) filtered = filtered.filter(car => car.model === parseInt(filters.model));
    if (filters.year) filtered = filtered.filter(car => car.year === parseInt(filters.year));
    if (filters.transmission) filtered = filtered.filter(car => car.transmission === parseInt(filters.transmission));
    if (filters.fuelType) filtered = filtered.filter(car => car.fuel_type === parseInt(filters.fuelType));
    
    // Фильтр по цене
    if (filters.priceMin) filtered = filtered.filter(car => car.price >= parseInt(filters.priceMin));
    if (filters.priceMax) filtered = filtered.filter(car => car.price <= parseInt(filters.priceMax));

    // Сортировка
    switch (filters.sortBy) {
      case 'priceAsc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'yearDesc':
        filtered.sort((a, b) => b.year - a.year);
        break;
      case 'yearAsc':
        filtered.sort((a, b) => a.year - b.year);
        break;
      default:
        filtered.sort((a, b) => b.year - a.year);
    }

    setFilteredCars(filtered);
    setCurrentPage(1);
  }, [filters, cars]);

  // Обработчики изменения фильтров
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Обработчик изменения бренда
  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    setFilters(prev => ({
      ...prev,
      brand: brandId,
      model: '' // Сбрасываем модель при смене бренда
    }));
  };

  // Обработчик изменения модели
  const handleModelChange = (e) => {
    setFilters(prev => ({
      ...prev,
      model: e.target.value
    }));
  };

  // Получение уникальных значений для селектов
  const getUniqueValues = (key) => {
    return [...new Set(cars.map(car => car[key]))].sort();
  };

  // Пагинация
  const indexOfLastCar = currentPage * carsPerPage;
  const indexOfFirstCar = indexOfLastCar - carsPerPage;
  const currentCars = filteredCars.slice(indexOfFirstCar, indexOfLastCar);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  // Анимации
  const headerVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const filterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
  };

  const cardListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="car-catalog">
      <motion.div
        className="catalog-header"
        initial="hidden"
        animate="visible"
        variants={headerVariants}
      >
        <h1 className="catalog-title">Каталог автомобилей</h1>
        <p className="catalog-subtitle">Найдите свой идеальный автомобиль</p>
      </motion.div>
      <motion.div
        className="filters"
        initial="hidden"
        animate="visible"
        variants={filterVariants}
      >
        <input
          type="text"
          name="searchQuery"
          placeholder="Поиск по названию или году..."
          className="search-input"
          value={filters.searchQuery}
          onChange={handleFilterChange}
        />
        <select
          name="brand"
          value={filters.brand}
          onChange={handleBrandChange}
        >
          <option value="">Все марки</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <select
          name="model"
          value={filters.model}
          onChange={handleModelChange}
          disabled={!filters.brand}
        >
          <option value="">Все модели</option>
          {models.map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
        <select
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
        >
          <option value="">Все годы</option>
          {getUniqueValues('year').map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select
          name="transmission"
          value={filters.transmission}
          onChange={handleFilterChange}
        >
          <option value="">Все коробки передач</option>
          {transmissionTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <select
          name="fuelType"
          value={filters.fuelType}
          onChange={handleFilterChange}
        >
          <option value="">Все типы топлива</option>
          {fuelTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
          <option value="priceAsc">По цене (возр.)</option>
          <option value="priceDesc">По цене (убыв.)</option>
        </select>
        <div className="price-filters">
          <div className="price-inputs">
            <input
              type="number"
              name="priceMin"
              placeholder="Мин. цена"
              value={filters.priceMin}
              onChange={handleFilterChange}
              className="price-input"
            />
            <input
              type="number"
              name="priceMax"
              placeholder="Макс. цена"
              value={filters.priceMax}
              onChange={handleFilterChange}
              className="price-input"
            />
          </div>
          <input
            type="range"
            min="0"
            max="1000000"
            value={filters.priceMax || 1000000}
            onChange={(e) => handleFilterChange({ target: { name: 'priceMax', value: e.target.value } })}
            className="price-slider"
          />
          <div className="price-range">
            <span>Цена: {filters.priceMin || 0} ₽</span>
            <span>до {filters.priceMax || 1000000} ₽</span>
          </div>
        </div>
      </motion.div>
      <motion.div
        className="car-list"
        key={currentPage}
        initial="hidden"
        animate="visible"
        variants={cardListVariants}
      >
        {currentCars.length > 0 ? (
          currentCars.map((car) => <CarCard key={car.id} car={car} />)
        ) : (
          <p className="no-results">Автомобили не найдены</p>
        )}
      </motion.div>
      <motion.div
        className="pagination"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {Array.from({ length: Math.ceil(filteredCars.length / carsPerPage) }).map((_, index) => (
          <button
            key={index}
            className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => paginate(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export default CarCatalog;
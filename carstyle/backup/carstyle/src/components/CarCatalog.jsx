// src/components/CarCatalog.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CarCard from './CarCard';
import { carsData } from '../data/carsData';
import './CarCatalog.css';

const CarCatalog = () => {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [carsPerPage] = useState(6);
  const [loading, setLoading] = useState(true);
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

  // Инициализация данных
  useEffect(() => {
    // Имитируем загрузку данных
    setTimeout(() => {
      setCars(carsData);
      setFilteredCars(carsData);
      setLoading(false);
    }, 500);
  }, []);

  // Фильтрация автомобилей
  useEffect(() => {
    let filtered = [...cars];

    // Поиск по тексту
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.year.toString().includes(query)
      );
    }

    // Фильтры
    if (filters.brand) filtered = filtered.filter(car => car.brand === filters.brand);
    if (filters.model) filtered = filtered.filter(car => car.model === filters.model);
    if (filters.year) filtered = filtered.filter(car => car.year === parseInt(filters.year));
    if (filters.transmission) filtered = filtered.filter(car => car.transmission === filters.transmission);
    if (filters.fuelType) filtered = filtered.filter(car => car.fuelType === filters.fuelType);
    
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
          onChange={handleFilterChange}
        >
          <option value="">Все марки</option>
          {getUniqueValues('brand').map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <select
          name="model"
          value={filters.model}
          onChange={handleFilterChange}
        >
          <option value="">Все модели</option>
          {getUniqueValues('model').map(model => (
            <option key={model} value={model}>{model}</option>
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
          {getUniqueValues('transmission').map(transmission => (
            <option key={transmission} value={transmission}>{transmission}</option>
          ))}
        </select>
        <select
          name="fuelType"
          value={filters.fuelType}
          onChange={handleFilterChange}
        >
          <option value="">Все типы топлива</option>
          {getUniqueValues('fuelType').map(fuelType => (
            <option key={fuelType} value={fuelType}>{fuelType}</option>
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
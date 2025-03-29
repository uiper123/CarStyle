# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Удаление таблиц документов

Документы теперь генерируются локально и не требуют хранения в базе данных. Необходимо выполнить следующие шаги для полного удаления таблиц документов:

1. Перейдите в клиент MySQL/MariaDB или phpMyAdmin
2. Выберите вашу базу данных
3. Выполните SQL-скрипт из файла `src/scripts/remove_document_tables.sql`:
   ```sql
   -- Вначале удаляем таблицу с содержимым документов (зависимую)
   DROP TABLE IF EXISTS rental_document_contents;
   
   -- Затем удаляем основную таблицу документов
   DROP TABLE IF EXISTS rental_documents;
   
   -- Также удаляем индексы, если они есть
   DROP INDEX IF EXISTS idx_document_order_id ON rental_documents;
   DROP INDEX IF EXISTS idx_document_number ON rental_documents;
   ```

Это освободит место в базе данных и удалит ненужные таблицы.

# CarStyle

## Описание проекта
CarStyle — это современная платформа для аренды автомобилей, соединяющая пользователей и автомобильные прокатные компании.

## Функции приложения
- Просмотр каталога автомобилей
- Бронирование автомобилей на определенные даты
- Система отзывов для оценки автомобилей
- Личный кабинет пользователя с историей заказов
- Административная панель для управления автопарком
- Защита персональных данных шифрованием

## Обработка и защита личных данных
В приложении реализована система защиты персональных данных пользователей:

### Шифрование персональных данных
- Данные водительского удостоверения и паспорта шифруются с использованием алгоритма AES-256
- Шифрование выполняется перед сохранением данных в базу данных
- Дешифрование происходит только при предоставлении зашифрованных данных пользователю

### Настройка шифрования
1. Необходимо задать переменную окружения `ENCRYPTION_KEY` в файле `.env`
2. В производственной среде рекомендуется использовать сложный ключ шифрования
3. Для запуска миграции по изменению структуры БД для шифрования:
   ```
   node src/run_encryption_migration.js
   ```

## Технологии
- Frontend: React.js, CSS Modules
- Backend: Node.js, Express
- База данных: MySQL
- Аутентификация: JWT
- Шифрование данных: CryptoJS AES-256

## Установка и запуск

### Предварительные требования
- Node.js (v14.x или выше)
- MySQL (5.7 или выше)

### Установка
1. Клонировать репозиторий
   ```
   git clone https://github.com/your-username/carstyle.git
   cd carstyle
   ```

2. Установить зависимости
   ```
   npm install
   ```

3. Настроить переменные окружения
   ```
   cp .env.example .env
   ```
   Отредактировать файл `.env` с вашими настройками

4. Инициализировать базу данных
   ```
   node src/run_migration.js
   ```

5. Запустить приложение в режиме разработки
   ```
   npm run dev
   ```

## Авторы
- Команда CarStyle

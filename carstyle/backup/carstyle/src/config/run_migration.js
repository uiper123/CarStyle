import updateCarsTable from './update_cars_table.js';

console.log('Запуск миграции таблицы cars...');
updateCarsTable()
  .then(() => {
    console.log('Миграция завершена успешно!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Ошибка при миграции:', err);
    process.exit(1);
  }); 
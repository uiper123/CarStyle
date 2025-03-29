import bcrypt from 'bcryptjs';

const password = 'admin123';

// Генерируем соль и хэшируем пароль
bcrypt.genSalt(10, (err, salt) => {
  if (err) {
    console.error('Ошибка при генерации соли:', err);
    return;
  }
  
  bcrypt.hash(password, salt, (err, hash) => {
    if (err) {
      console.error('Ошибка при хэшировании пароля:', err);
      return;
    }
    
    console.log('Пароль:', password);
    console.log('Хэш:', hash);
    
    // Проверяем хэш
    bcrypt.compare(password, hash, (err, isMatch) => {
      if (err) {
        console.error('Ошибка при проверке пароля:', err);
        return;
      }
      
      console.log('Проверка соответствия:', isMatch ? 'Успешно' : 'Не удалось');
    });
  });
}); 
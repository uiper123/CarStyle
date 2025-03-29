const fs = require('fs');
const path = require('path');

// Создаем необходимые директории для загрузки файлов
const createUploadDirectories = () => {
  const dirs = [
    'uploads',
    'uploads/avatars',
    'uploads/documents'
  ];

  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  });
};

module.exports = createUploadDirectories; 
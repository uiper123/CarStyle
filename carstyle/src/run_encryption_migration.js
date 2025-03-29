import updateDatabaseStructure from './config/update_database_structure.js';

console.log('Starting encryption migration process...');

updateDatabaseStructure()
  .then(result => {
    if (result.success) {
      console.log('Encryption migration completed successfully');
      console.log(result.message);
      process.exit(0);
    } else {
      console.error('Encryption migration failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Encryption migration process error:', error);
    process.exit(1);
  }); 
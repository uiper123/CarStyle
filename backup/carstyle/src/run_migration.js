import migrateDatabase from './config/migrate_database.js';

console.log('Starting database migration process...');

migrateDatabase()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 
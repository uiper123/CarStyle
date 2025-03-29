import pool from '../config/database.js';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secure-encryption-key-change-in-production';

// Helper function to encrypt data
const encryptData = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text.toString(), ENCRYPTION_KEY).toString();
};

async function encryptExistingData() {
  console.log('Starting encryption of existing personal data...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get all client records
    const [clients] = await connection.query('SELECT * FROM clients');
    console.log(`Found ${clients.length} client records to process`);

    let encryptedCount = 0;
    let skippedCount = 0;

    // Process each client record
    for (const client of clients) {
      const clientId = client.client_id;
      const driverLicense = client.driver_license;
      const passportSeries = client.passport_series;
      const passportNumber = client.passport_number;

      // Skip if all fields are already null or don't need encryption
      if (!driverLicense && !passportSeries && !passportNumber) {
        skippedCount++;
        continue;
      }

      // Check if data is already encrypted by trying to decrypt
      // If we cannot decrypt, it's likely not encrypted with our key
      let needsEncryption = false;

      try {
        // Simple check - try to match encrypted data format
        if (driverLicense && !driverLicense.toString().includes('U2FsdGVk')) {
          needsEncryption = true;
        }
      } catch (e) {
        // If any error, assume data needs encryption
        needsEncryption = true;
      }

      if (needsEncryption) {
        // Encrypt the data
        const encryptedDriverLicense = encryptData(driverLicense);
        const encryptedPassportSeries = encryptData(passportSeries);
        const encryptedPassportNumber = encryptData(passportNumber);

        // Update client record with encrypted data
        await connection.query(
          'UPDATE clients SET driver_license = ?, passport_series = ?, passport_number = ? WHERE client_id = ?',
          [encryptedDriverLicense, encryptedPassportSeries, encryptedPassportNumber, clientId]
        );

        encryptedCount++;
        console.log(`Encrypted data for client ID ${clientId}`);
      } else {
        skippedCount++;
        console.log(`Skipped client ID ${clientId} - data already encrypted or empty`);
      }
    }

    // Add a log entry for this encryption operation
    await connection.query(
      'INSERT INTO encryption_metadata (table_name, field_name) VALUES (?, ?)',
      ['clients_batch', `encrypted_${encryptedCount}_records`]
    );

    await connection.commit();
    console.log(`Encryption completed: ${encryptedCount} records encrypted, ${skippedCount} records skipped`);
    
    return { 
      success: true, 
      message: `Encryption of existing data completed successfully. ${encryptedCount} records encrypted, ${skippedCount} records skipped.` 
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error during encryption process:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

// Run the encryption function
encryptExistingData()
  .then(result => {
    if (result.success) {
      console.log(result.message);
      process.exit(0);
    } else {
      console.error('Encryption process failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during encryption process:', error);
    process.exit(1);
  }); 
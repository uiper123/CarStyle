import pool from '../config/database.js';

export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Getting profile for user:', userId);
        
        const query = `
            SELECT 
                u.*,
                c.\`driver_license\`,
                c.\`passport_series\`,
                c.\`passport_number\`,
                c.\`status\`
            FROM \`users\` u
            LEFT JOIN \`clients\` c ON u.user_id = c.client_id
            WHERE u.user_id = ?
        `;

        const [rows] = await pool.query(query, [userId]);
        console.log('Query result:', rows);

        if (!rows || rows.length === 0) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const user = rows[0];
        console.log('User data:', user);

        // Remove password from response
        delete user.password;

        res.json(user);
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ 
            message: 'Server error while getting profile',
            error: error.message 
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstname, lastname, middlename, phone, driver_license, passport_series, passport_number } = req.body;
        const avatarUrl = req.file ? req.file.filename : null;

        console.log('Updating profile for user:', userId);
        console.log('Received data:', req.body);
        console.log('Avatar file:', req.file);

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update user information
            const [updateUserResult] = await connection.query(
                'UPDATE \`users\` SET \`firstname\` = ?, \`lastname\` = ?, \`middlename\` = ?, \`phone\` = ? WHERE user_id = ?',
                [firstname, lastname, middlename, phone, userId]
            );
            console.log('User update result:', updateUserResult);

            // Update avatar if uploaded
            if (avatarUrl) {
                const [avatarResult] = await connection.query(
                    'UPDATE \`users\` SET avatar_url = ? WHERE user_id = ?',
                    [avatarUrl, userId]
                );
                console.log('Avatar update result:', avatarResult);
            }

            // Check if client record exists
            const [clientExists] = await connection.query(
                'SELECT client_id FROM \`clients\` WHERE client_id = ?',
                [userId]
            );

            if (clientExists.length === 0) {
                // Create new client record if it doesn't exist
                await connection.query(
                    'INSERT INTO \`clients\` (client_id, \`driver_license\`, \`passport_series\`, \`passport_number\`) VALUES (?, ?, ?, ?)',
                    [userId, driver_license, passport_series, passport_number]
                );
            } else {
                // Update existing client record
                await connection.query(
                    'UPDATE \`clients\` SET \`driver_license\` = ?, \`passport_series\` = ?, \`passport_number\` = ? WHERE client_id = ?',
                    [driver_license, passport_series, passport_number, userId]
                );
            }

            // Get updated data
            const [updatedUser] = await connection.query(
                `SELECT 
                    u.*,
                    c.\`driver_license\`,
                    c.\`passport_series\`,
                    c.\`passport_number\`,
                    c.\`status\`
                FROM \`users\` u
                LEFT JOIN \`clients\` c ON u.user_id = c.client_id
                WHERE u.user_id = ?`,
                [userId]
            );

            // Commit transaction
            await connection.commit();

            // Remove password from response
            delete updatedUser[0].password;

            res.json({ 
                message: 'Profile updated successfully',
                success: true,
                user: updatedUser[0]
            });
        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            // Release connection
            connection.release();
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ 
            message: 'Server error while updating profile',
            error: error.message,
            success: false
        });
    }
}; 
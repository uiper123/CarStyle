// ... existing code ...
import reviewRoutes from './routes/reviewRoutes.js';

// ... existing code ...

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// ... existing code ...
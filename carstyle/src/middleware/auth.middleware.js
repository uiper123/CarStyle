import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token not provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Set user info including role from token
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'client' // Default to client if no role in token
    };
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional auth middleware - doesn't require authentication but extracts user data if available
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Just continue without user data
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Set user info including role from token
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || 'client' // Default to client if no role in token
      };
    } catch (tokenError) {
      // Invalid token, but we'll continue anyway without user data
      console.error('Invalid token in optional auth:', tokenError);
    }
    
    next();
  } catch (error) {
    console.error('Error in optional auth middleware:', error);
    next(); // Continue anyway
  }
}; 
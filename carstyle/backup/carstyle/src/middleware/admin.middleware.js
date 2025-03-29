/**
 * Middleware для проверки прав администратора
 * Используется для защиты маршрутов, доступных только администраторам
 */
export const isAdmin = (req, res, next) => {
  // Проверяем наличие пользователя и его роли
  if (req.user && req.user.role === 'admin') {
    console.log('Admin access granted for user:', req.user.id, req.user.email);
    next();
  } else {
    console.log('Admin access denied for user:', req.user?.id, req.user?.email, req.user?.role);
    res.status(403).json({ 
      message: 'Доступ запрещен. Требуются права администратора.', 
      success: false 
    });
  }
}; 
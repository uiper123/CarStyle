import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client'
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Проверяем, что URL правильный и содержит переменную окружения
      const apiUrl = import.meta.env.VITE_API_URL || '';
      console.log("API URL:", apiUrl); // Для отладки
      
      const response = await axios.get(`${apiUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Users response:", response.data); // Для отладки
      
      // Проверяем, что response.data является массивом
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error("API response is not an array:", response.data);
        setUsers([]); // Устанавливаем пустой массив
        toast.error('Данные пользователей получены в неверном формате');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Ошибка при загрузке пользователей');
      setUsers([]); // Устанавливаем пустой массив в случае ошибки
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.post(
        `${apiUrl}/api/admin/users`,
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'client' });
      toast.success('Пользователь успешно создан');
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error(error.response?.data?.message || 'Ошибка при создании пользователя');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.put(
        `${apiUrl}/api/admin/users/${selectedUser.id}/role`,
        { role: selectedUser.role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditRoleModal(false);
      toast.success('Роль пользователя успешно обновлена');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.response?.data?.message || 'Ошибка при обновлении роли пользователя');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || '';
      
      await axios.delete(
        `${apiUrl}/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Пользователь успешно удален');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Ошибка при удалении пользователя');
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Управление пользователями</h2>
        <button className="admin-button" onClick={() => setShowAddUserModal(true)}>
          Добавить пользователя
        </button>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {/* Проверяем, что users существует и является массивом */}
            {!Array.isArray(users) || users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.firstname} {user.lastname}</td>
                  <td>{user.role}</td>
                  <td>
                    <button
                      className="admin-button"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowEditRoleModal(true);
                      }}
                      style={{ marginRight: '10px' }}
                    >
                      Изменить роль
                    </button>
                    <button
                      className="admin-button secondary"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Добавить пользователя</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowAddUserModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="admin-modal-content">
                <div className="admin-form-group">
                  <label className="admin-form-label">Имя</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email</label>
                  <input
                    type="email"
                    className="admin-form-input"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Пароль</label>
                  <input
                    type="password"
                    className="admin-form-input"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Роль</label>
                  <select
                    className="admin-form-select"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="client">Клиент</option>
                    <option value="employee">Сотрудник</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowAddUserModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="admin-button">
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRoleModal && selectedUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Изменить роль пользователя</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowEditRoleModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateRole}>
              <div className="admin-modal-content">
                <p>
                  Пользователь: {selectedUser.firstname} {selectedUser.lastname} ({selectedUser.email})
                </p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Роль</label>
                  <select
                    className="admin-form-select"
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                  >
                    <option value="client">Клиент</option>
                    <option value="employee">Сотрудник</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-button secondary"
                  onClick={() => setShowEditRoleModal(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="admin-button">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Edit, Trash2, LogOut, X, Shield, Users, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import styles from './AdminPanel.module.css';

interface UserFormData {
  username: string;
  password: string;
  name: string;
  role: string;
}

const emptyForm: UserFormData = { username: '', password: '', name: '', role: 'operator' };

const AdminPanel: React.FC = () => {
  const {
    currentUser, users, logout, fetchAllUsers,
    adminCreateUser, adminUpdateUser, adminDeleteUser,
    theme, toggleTheme,
  } = useAppContext();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditId(user.id);
    setForm({ username: user.username, password: '', name: user.name, role: user.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editId) {
        const updateData: any = { name: form.name, role: form.role };
        if (form.password.trim()) updateData.password = form.password;
        await adminUpdateUser(editId, updateData);
      } else {
        if (!form.username || !form.password || !form.name) {
          setError('Vui lòng điền đầy đủ thông tin');
          setLoading(false);
          return;
        }
        await adminCreateUser(form);
      }
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteUser(id);
      setConfirmDelete(null);
    } catch (err: any) {
      alert(err.message || 'Không thể xoá tài khoản');
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoIcon}><Shield size={28} /></div>
          <div>
            <h1>Quản Trị Hệ Thống</h1>
            <p>Đăng nhập: <strong>{currentUser.name}</strong></p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.themeBtn} onClick={toggleTheme} title="Đổi giao diện">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </header>

      {/* STATS */}
      <div className={styles.stats}>
        <div className={`glass-panel ${styles.statCard}`}>
          <Users size={24} />
          <div>
            <span className={styles.statNumber}>{users.length}</span>
            <span className={styles.statLabel}>Tổng tài khoản</span>
          </div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <Shield size={24} />
          <div>
            <span className={styles.statNumber}>{users.filter(u => u.role === 'admin').length}</span>
            <span className={styles.statLabel}>Admin</span>
          </div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <Box size={24} />
          <div>
            <span className={styles.statNumber}>{users.filter(u => u.role === 'operator').length}</span>
            <span className={styles.statLabel}>Operator</span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2><Users size={22} /> Danh sách tài khoản</h2>
          <button className={styles.addBtn} onClick={openAdd}>
            <Plus size={18} /> Thêm tài khoản
          </button>
        </div>
        <div className={`glass-panel ${styles.tableWrap}`}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên hiển thị</th>
                <th>Username</th>
                <th>Vai trò</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td><strong>{user.name}</strong></td>
                  <td><code>{user.username}</code></td>
                  <td>
                    <span className={`${styles.roleTag} ${styles[user.role]}`}>{user.role}</span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => openEdit(user)} title="Sửa">
                        <Edit size={16} />
                      </button>
                      {user.username !== 'admin' && (
                        confirmDelete === user.id ? (
                          <div className={styles.confirmRow}>
                            <button className={styles.confirmYes} onClick={() => handleDelete(user.id)}>Xoá</button>
                            <button className={styles.confirmNo} onClick={() => setConfirmDelete(null)}>Huỷ</button>
                          </div>
                        ) : (
                          <button className={styles.deleteBtn} onClick={() => setConfirmDelete(user.id)} title="Xoá">
                            <Trash2 size={16} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có tài khoản nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editId ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            {error && <div className={styles.modalError}>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.field}>
                <label>Tên hiển thị</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              {!editId && (
                <div className={styles.field}>
                  <label>Username</label>
                  <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                </div>
              )}
              <div className={styles.field}>
                <label>{editId ? 'Mật khẩu mới (bỏ trống = không đổi)' : 'Mật khẩu'}</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editId} />
              </div>
              <div className={styles.field}>
                <label>Vai trò</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Đang xử lý...' : editId ? 'Cập nhật' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, BellRing, LogOut, Box, Sun, Moon, History } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const { currentUser, logout, alerts, theme, toggleTheme } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.iconWrap}>
          <Box size={24} />
        </div>
        <h2>SmartWarehouse</h2>
      </div>

      <nav className={styles.nav}>
        <NavLink to="/dashboard" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <PackageSearch size={20} />
          <span>Kho Hàng</span>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <History size={20} />
          <span>Lịch Sử</span>
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
          <BellRing size={20} />
          <span>Cảnh Báo</span>
          {unackAlerts > 0 && (
            <span style={{ background: 'var(--status-danger)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginLeft: 'auto' }}>
              {unackAlerts}
            </span>
          )}
        </NavLink>
      </nav>

      {/* Theme Toggle */}
      <div className={styles.themeToggleWrap}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          id="theme-toggle-btn"
        >
          <span className={`${styles.themeIconWrap} ${theme === 'light' ? styles.rotateIn : ''}`}>
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </span>
          <span>{theme === 'dark' ? 'Giao diện tối' : 'Giao diện sáng'}</span>
        </button>
      </div>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {currentUser?.name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{currentUser?.name}</div>
          <div className={styles.userRole}>{currentUser?.role}</div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

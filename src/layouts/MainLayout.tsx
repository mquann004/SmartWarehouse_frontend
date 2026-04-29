import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import GlobalAlert from '../components/GlobalAlert';
import AIChatWidget from '../components/AIChatWidget';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Tổng quan hệ thống';
      case '/inventory': return 'Quản lý kho hàng';
      case '/alerts': return 'Cảnh báo & Ngưỡng';
      case '/users': return 'Quản lý người dùng';
      default: return 'Smart Warehouse';
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        <GlobalAlert />
        
        <header className={styles.header}>
          <div className={styles.title}>
            <h1>{getPageTitle()}</h1>
            <p>Trạng thái hệ thống: Đang hoạt động</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.timeDisplay}>
              {currentTime.toLocaleString('vi-VN')}
            </div>
          </div>
        </header>

        <div className={styles.pageContent}>
          <Outlet />
        </div>
        <AIChatWidget />
      </main>
    </div>
  );
};

export default MainLayout;

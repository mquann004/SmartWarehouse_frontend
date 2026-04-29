import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import styles from './GlobalAlert.module.css';

const GlobalAlert: React.FC = () => {
  const { alerts, acknowledgeAlert } = useAppContext();
  
  const unackAlerts = alerts.filter(a => !a.acknowledged);

  if (unackAlerts.length === 0) return null;

  return (
    <div className={styles.bannerContainer}>
      {unackAlerts.map(alert => (
        <div key={alert.id} className={`${styles.banner} ${alert.severity === 'danger' ? styles.danger : styles.warning}`}>
          <AlertTriangle className={styles.icon} />
          <div className={styles.content}>
            <strong>CẢNH BÁO HỆ THỐNG: </strong>
            {alert.message}
            <span className={styles.time}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
          </div>
          <button className={styles.closeBtn} onClick={() => acknowledgeAlert(alert.id)}>
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default GlobalAlert;

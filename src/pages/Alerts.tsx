import React, { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import styles from './Alerts.module.css';

interface DualRangeSliderProps {
  min: number;
  max: number;
  valMin: number;
  valMax: number;
  onChange: (min: number, max: number) => void;
  disabled?: boolean;
  activeColor?: string;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, valMin, valMax, onChange, disabled, activeColor = '#3b82f6' }) => {
  const minPos = ((valMin - min) / (max - min)) * 100;
  const maxPos = ((valMax - min) / (max - min)) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), valMax - 1);
    onChange(value, valMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), valMin + 1);
    onChange(valMin, value);
  };

  return (
    <div className={styles.rangeWrapper}>
      <div 
        className={styles.rangeActiveTrack} 
        style={{ 
          left: `${minPos}%`, 
          right: `${100 - maxPos}%`,
          backgroundColor: activeColor
        }}
      ></div>
      <input
        type="range"
        min={min}
        max={max}
        value={valMin}
        onChange={handleMinChange}
        className={`${styles.rangeInput} ${styles.rangeInputMin}`}
        disabled={disabled}
        style={{ '--thumb-color': activeColor } as any}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={valMax}
        onChange={handleMaxChange}
        className={`${styles.rangeInput} ${styles.rangeInputMax}`}
        disabled={disabled}
        style={{ '--thumb-color': activeColor } as any}
      />
    </div>
  );
};

const Alerts: React.FC = () => {
  const { thresholds, updateThresholds, alerts, acknowledgeAlert, clearAlerts, currentUser } = useAppContext();
  
  const [tempRange, setTempRange] = useState({ min: thresholds.tempMin, max: thresholds.tempMax });
  const [humRange, setHumRange] = useState({ min: thresholds.humMin, max: thresholds.humMax });
  const [gasRange, setGasRange] = useState({ min: thresholds.gasMin, max: thresholds.gasMax });

  // Sync with thresholds when they are loaded from backend
  React.useEffect(() => {
    setTempRange({ min: thresholds.tempMin, max: thresholds.tempMax });
    setHumRange({ min: thresholds.humMin, max: thresholds.humMax });
    setGasRange({ min: thresholds.gasMin, max: thresholds.gasMax });
  }, [thresholds]);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateThresholds({ 
      tempMin: tempRange.min, tempMax: tempRange.max,
      humMin: humRange.min, humMax: humRange.max,
      gasMin: gasRange.min, gasMax: gasRange.max
    });
    alert('Đã cập nhật ngưỡng cảnh báo thành công!');
  };

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'operator';

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <h2>Cài đặt ngưỡng cảnh báo</h2>
        <form onSubmit={handleSaveThresholds}>
          <div className={styles.rangeGroup}>
            <div className={styles.rangeHeader}>
              <label>Nhiệt độ An toàn (°C)</label>
              <span className={styles.rangeValue}>{tempRange.min}° - {tempRange.max}°</span>
            </div>
            <DualRangeSlider 
              min={0} max={100} 
              valMin={tempRange.min} valMax={tempRange.max} 
              onChange={(min, max) => setTempRange({ min, max })}
              disabled={!canEdit}
              activeColor="#f43f5e"
            />
          </div>

          <div className={styles.rangeGroup}>
            <div className={styles.rangeHeader}>
              <label>Độ ẩm An toàn (%)</label>
              <span className={styles.rangeValue}>{humRange.min}% - {humRange.max}%</span>
            </div>
            <DualRangeSlider 
              min={0} max={100} 
              valMin={humRange.min} valMax={humRange.max} 
              onChange={(min, max) => setHumRange({ min, max })}
              disabled={!canEdit}
              activeColor="#3b82f6"
            />
          </div>

          <div className={styles.rangeGroup}>
            <div className={styles.rangeHeader}>
              <label>Khí Gas An toàn</label>
              <span className={styles.rangeValue}>{gasRange.min} - {gasRange.max}</span>
            </div>
            <DualRangeSlider 
              min={0} max={10000} 
              valMin={gasRange.min} valMax={gasRange.max} 
              onChange={(min, max) => setGasRange({ min, max })}
              disabled={!canEdit}
              activeColor="#10b981"
            />
          </div>

          {canEdit && (
            <button type="submit" className={styles.saveBtn}>Lưu Cài Đặt</button>
          )}
        </form>
      </div>

      <div className={`glass-panel ${styles.card}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Lịch sử cảnh báo</h2>
          {canEdit && (
            <button 
              onClick={clearAlerts} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}
              title="Xoá tất cả lịch sử"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        
        <div className={styles.alertList}>
          {alerts.length > 0 ? alerts.map(alert => (
            <div key={alert.id} className={`${styles.alertItem} ${!alert.acknowledged ? styles.unacknowledged : ''}`}>
              <div className={`${styles.alertIcon} ${alert.severity === 'danger' ? styles.danger : styles.warning}`}>
                <AlertTriangle size={20} />
              </div>
              <div className={styles.alertContent}>
                <div className={styles.alertMessage}>{alert.message}</div>
                <div className={styles.alertTime}>{new Date(alert.timestamp).toLocaleString('vi-VN')}</div>
              </div>
              {!alert.acknowledged && canEdit && (
                <button className={styles.ackBtn} onClick={() => acknowledgeAlert(alert.id)}>
                  Xác nhận <CheckCircle size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
              Không có cảnh báo nào trong lịch sử.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;

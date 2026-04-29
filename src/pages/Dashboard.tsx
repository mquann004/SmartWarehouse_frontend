import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Thermometer, Droplets, Wind, Package, X, Clock, History } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { apiFetch } from '../config/api';
import type { InventoryItem } from '../types';
import styles from './Dashboard.module.css';
import Warehouse3D from '../components/Warehouse3D';
import { Box, Map as MapIcon } from 'lucide-react';

interface SensorHistoryRow {
  id: number;
  temperature: number;
  humidity: number;
  gasLevel: number;
  gasAlert: number;
  timestamp: string;
}

type SensorModalType = 'temperature' | 'humidity' | 'gas' | null;
type HistoryRange = '1h' | '6h' | '24h' | '7d' | '30d';

const RANGE_LABELS: Record<HistoryRange, string> = {
  '1h': '1 Giờ',
  '6h': '6 Giờ',
  '24h': '24 Giờ',
  '7d': '7 Ngày',
  '30d': '30 Ngày',
};

const SENSOR_CONFIG = {
  temperature: { title: 'Lịch Sử Nhiệt Độ', unit: '°C', color: '#f43f5e', gradient: 'linear-gradient(135deg, #f43f5e, #be123c)' },
  humidity: { title: 'Lịch Sử Độ Ẩm', unit: '%', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
  gas: { title: 'Lịch Sử Khí Gas', unit: '%', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #047857)' },
};

const Dashboard: React.FC = () => {
  const { currentSensors, historicalSensors, inventory } = useAppContext();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [selectedSlot, setSelectedSlot] = useState<{ id: string, item?: InventoryItem } | null>(null);

  // Sensor history modal state
  const [sensorModal, setSensorModal] = useState<SensorModalType>(null);
  const [historyRange, setHistoryRange] = useState<HistoryRange>('1h');
  const [historyData, setHistoryData] = useState<SensorHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Inventory modal state
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);

  // Fetch sensor history when modal opens or range changes
  const fetchSensorHistory = useCallback(async (range: HistoryRange) => {
    setHistoryLoading(true);
    try {
      const data = await apiFetch<SensorHistoryRow[]>(`/sensors/history-table?range=${range}&limit=20`);
      setHistoryData(data);
    } catch (e) {
      console.error('Lỗi tải lịch sử sensor:', e);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sensorModal) {
      fetchSensorHistory(historyRange);
    }
  }, [sensorModal, historyRange, fetchSensorHistory]);

  const openSensorModal = (type: SensorModalType) => {
    setSensorModal(type);
    setHistoryRange('1h');
  };

  const closeSensorModal = () => {
    setSensorModal(null);
    setHistoryData([]);
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  // Generate warehouse shelves logic (A, B, and C)
  const shelves = ['A', 'B', 'C'];
  const rows = [1, 2];
  const cols = [1, 2];

  const getSlotId = (shelf: string, row: number, col: number) => `${shelf}-0${row * 2 - 2 + col}`;

  const handleSlotClick = (slotId: string) => {
    const item = inventory.find(i => i.shelfLocation === slotId);
    setSelectedSlot({ id: slotId, item });
  };

  const chartData = historicalSensors.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temp: parseFloat(d.temperature.toFixed(1)),
    hum: parseFloat(d.humidity.toFixed(1)),
    gas: parseFloat(d.gasLevel.toFixed(1))
  }));

  return (
    <div className={styles.dashboard}>
      <div className={styles.overviewCards}>
        <div className={`glass-panel ${styles.card} ${styles.cardClickable}`} onClick={() => openSensorModal('temperature')}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}>
            <Thermometer size={28} />
          </div>
          <div className={styles.cardInfo}>
            <h3>Nhiệt độ</h3>
            <div className={styles.value}>{currentSensors.temperature.toFixed(1)}°C</div>
          </div>
          <div className={styles.cardHint}><History size={14} /> Xem lịch sử</div>
        </div>
        <div className={`glass-panel ${styles.card} ${styles.cardClickable}`} onClick={() => openSensorModal('humidity')}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <Droplets size={28} />
          </div>
          <div className={styles.cardInfo}>
            <h3>Độ ẩm</h3>
            <div className={styles.value}>{currentSensors.humidity.toFixed(1)}%</div>
          </div>
          <div className={styles.cardHint}><History size={14} /> Xem lịch sử</div>
        </div>
        <div className={`glass-panel ${styles.card} ${styles.cardClickable}`} onClick={() => openSensorModal('gas')}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
            <Wind size={28} />
          </div>
          <div className={styles.cardInfo}>
            <h3>Khí Gas</h3>
            <div className={styles.value}>{currentSensors.gasLevel.toFixed(1)}%</div>
          </div>
          <div className={styles.cardHint}><History size={14} /> Xem lịch sử</div>
        </div>
        <div className={`glass-panel ${styles.card} ${styles.cardClickable}`} onClick={() => setShowInventoryModal(true)}>
          <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
            <Package size={28} />
          </div>
          <div className={styles.cardInfo}>
            <h3>Tổng Hàng Hoá</h3>
            <div className={styles.value}>{totalItems}</div>
          </div>
          <div className={styles.cardHint}><Package size={14} /> Xem chi tiết</div>
        </div>
      </div>

      <div className={`glass-panel ${styles.chartSection}`}>
        <div className={styles.chartHeader}>
          <h2>Dữ liệu cảm biến lịch sử</h2>
          <div className={styles.chartFilters}>
            <button className={`${styles.filterBtn} ${timeRange === '1h' ? styles.active : ''}`} onClick={() => setTimeRange('1h')}>1 Giờ</button>
            <button className={`${styles.filterBtn} ${timeRange === '24h' ? styles.active : ''}`} onClick={() => setTimeRange('24h')}>24 Giờ</button>
            <button className={`${styles.filterBtn} ${timeRange === '7d' ? styles.active : ''}`} onClick={() => setTimeRange('7d')}>7 Ngày</button>
          </div>
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="temp" name="Nhiệt độ (°C)" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="left" type="monotone" dataKey="hum" name="Độ ẩm (%)" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="gas" name="Khí Gas (%)" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`glass-panel ${styles.warehouseSection}`}>
        <div className={styles.warehouseHeader}>
          <div>
            <h2>Sơ đồ kho hàng trực quan</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Theo dõi vị trí hàng hoá theo thời gian thực.</p>
          </div>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === '2d' ? styles.active : ''}`}
              onClick={() => setViewMode('2d')}
            >
              <MapIcon size={16} /> 2D
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === '3d' ? styles.active : ''}`}
              onClick={() => setViewMode('3d')}
            >
              <Box size={16} /> 3D (Mới)
            </button>
          </div>
        </div>
        
        {viewMode === '3d' ? (
          <Warehouse3D inventory={inventory} onSlotClick={handleSlotClick} />
        ) : (
          <div className={styles.shelvesContainer}>
            {shelves.map(shelf => {
              const shelfSlots = rows.flatMap(row => cols.map(col => getSlotId(shelf, row, col)));
              const isShelfFull = shelfSlots.every(slotId => inventory.some(i => i.shelfLocation === slotId));
              
              return (
                <div key={shelf} className={`${styles.shelf} ${isShelfFull ? styles.shelfFull : ''}`}>
                  <div className={styles.shelfTitle}>
                    KỆ {shelf}
                    {isShelfFull && <span className={styles.shelfFullBadge}>KỆ ĐẦY</span>}
                  </div>
                  <div className={styles.shelfGrid}>
                    {rows.map(row => 
                      cols.map(col => {
                        const slotId = getSlotId(shelf, row, col);
                        const isOccupied = inventory.some(i => i.shelfLocation === slotId);
                        return (
                          <div 
                            key={slotId} 
                            className={`${styles.slot} ${isOccupied ? styles.occupied : ''} ${inventory.find(i => i.shelfLocation === slotId)?.scheduledExportTime ? styles.scheduledExport : ''}`}
                            onClick={() => handleSlotClick(slotId)}
                          >
                            {inventory.find(i => i.shelfLocation === slotId)?.scheduledExportTime && (
                              <div className={styles.slotStatusLabel}>Xuất kho</div>
                            )}
                            <span className={styles.slotText}>{slotId}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shelf detail modal */}
      {selectedSlot && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSlot(null)}>
          <div className={`glass-panel ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedSlot(null)}><X size={24} /></button>
            <h2>Thông tin vị trí: {selectedSlot.id}</h2>
            
            {selectedSlot.item ? (
              <div className={styles.itemDetail}>
                <div className={styles.itemRow}><span>Tên hàng:</span> <strong>{selectedSlot.item.name}</strong></div>
                <div className={styles.itemRow}><span>Mã hàng:</span> <span>{selectedSlot.item.code}</span></div>
                <div className={styles.itemRow}><span>Số lượng:</span> <span>{selectedSlot.item.quantity}</span></div>
                <div className={styles.itemRow}><span>Ngày nhập:</span> <span>{new Date(selectedSlot.item.importTime).toLocaleDateString('vi-VN')}</span></div>
                <div className={styles.itemRow}><span>Chủ sở hữu:</span> <strong>{selectedSlot.item.owner || '—'}</strong></div>
                <div className={styles.itemRow}>
                  <span>Trạng thái:</span> 
                  <span className={`${styles.statusBadge} ${selectedSlot.item.scheduledExportTime ? styles.statusDanger : styles.statusSuccess}`}>
                    {selectedSlot.item.scheduledExportTime ? 'Sắp xuất kho' : 'Tồn kho'}
                  </span>
                </div>
                {selectedSlot.item.scheduledExportTime && (
                  <div className={styles.itemRow}>
                    <span>Dự kiến xuất:</span> 
                    <strong style={{ fontSize: '0.85rem' }}>{new Date(selectedSlot.item.scheduledExportTime).toLocaleString('vi-VN')}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Vị trí này hiện đang trống</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sensor history modal */}
      {sensorModal && (
        <div className={styles.modalOverlay} onClick={closeSensorModal}>
          <div className={`glass-panel ${styles.historyModal}`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={closeSensorModal}><X size={24} /></button>

            <div className={styles.historyModalHeader}>
              <div className={styles.historyTitleRow}>
                <div className={styles.historyIconWrap} style={{ background: SENSOR_CONFIG[sensorModal].gradient }}>
                  {sensorModal === 'temperature' && <Thermometer size={22} />}
                  {sensorModal === 'humidity' && <Droplets size={22} />}
                  {sensorModal === 'gas' && <Wind size={22} />}
                </div>
                <div>
                  <h2>{SENSOR_CONFIG[sensorModal].title}</h2>
                  <p className={styles.historySubtitle}>
                    <Clock size={14} /> Cập nhật mới nhất — tối đa 20 bản ghi
                  </p>
                </div>
              </div>

              <div className={styles.historyRangeBar}>
                {(Object.entries(RANGE_LABELS) as [HistoryRange, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    className={`${styles.rangeBtn} ${historyRange === key ? styles.rangeBtnActive : ''}`}
                    onClick={() => setHistoryRange(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.historyTableWrap}>
              {historyLoading ? (
                <div className={styles.historyLoading}>
                  <div className={styles.spinner}></div>
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : historyData.length === 0 ? (
                <div className={styles.historyEmpty}>
                  <History size={48} style={{ opacity: 0.3 }} />
                  <p>Không có dữ liệu trong khoảng thời gian này</p>
                </div>
              ) : (
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Thời gian</th>
                      <th>Nhiệt độ (°C)</th>
                      <th>Độ ẩm (%)</th>
                      <th>Khí Gas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((row, idx) => (
                      <tr key={row.id} className={idx === 0 ? styles.latestRow : ''}>
                        <td className={styles.rowIndex}>{idx + 1}</td>
                        <td className={styles.rowTimestamp}>{formatTimestamp(row.timestamp)}</td>
                        <td>
                          <span
                            className={styles.sensorBadge}
                            style={{
                              background: sensorModal === 'temperature' ? `${SENSOR_CONFIG.temperature.color}22` : 'transparent',
                              color: sensorModal === 'temperature' ? SENSOR_CONFIG.temperature.color : 'var(--text-primary)',
                              fontWeight: sensorModal === 'temperature' ? 700 : 400,
                            }}
                          >
                            {row.temperature.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={styles.sensorBadge}
                            style={{
                              background: sensorModal === 'humidity' ? `${SENSOR_CONFIG.humidity.color}22` : 'transparent',
                              color: sensorModal === 'humidity' ? SENSOR_CONFIG.humidity.color : 'var(--text-primary)',
                              fontWeight: sensorModal === 'humidity' ? 700 : 400,
                            }}
                          >
                            {row.humidity.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={styles.sensorBadge}
                            style={{
                              background: sensorModal === 'gas' ? `${SENSOR_CONFIG.gas.color}22` : 'transparent',
                              color: sensorModal === 'gas' ? SENSOR_CONFIG.gas.color : 'var(--text-primary)',
                              fontWeight: sensorModal === 'gas' ? 700 : 400,
                            }}
                          >
                            {row.gasLevel.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.historyFooter}>
              <span>Hiển thị {historyData.length} / 20 bản ghi</span>
              <span style={{ color: SENSOR_CONFIG[sensorModal].color }}>
                ● {SENSOR_CONFIG[sensorModal].title}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inventory modal */}
      {showInventoryModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInventoryModal(false)}>
          <div className={`glass-panel ${styles.inventoryModal}`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowInventoryModal(false)}><X size={24} /></button>

            <div className={styles.historyModalHeader}>
              <div className={styles.historyTitleRow}>
                <div className={styles.historyIconWrap} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                  <Package size={22} />
                </div>
                <div>
                  <h2>Tất Cả Hàng Hoá Trong Kho</h2>
                  <p className={styles.historySubtitle}>
                    <Package size={14} /> Tổng: {inventory.length} mặt hàng — {totalItems} sản phẩm
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.historyTableWrap}>
              {inventory.length === 0 ? (
                <div className={styles.historyEmpty}>
                  <Package size={48} style={{ opacity: 0.3 }} />
                  <p>Kho hàng hiện đang trống</p>
                </div>
              ) : (
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên hàng</th>
                      <th>Mã hàng</th>
                      <th>Vị trí</th>
                      <th>Số lượng</th>
                      <th>Ngày nhập</th>
                      <th>Chủ sở hữu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item, idx) => (
                      <tr key={item.id}>
                        <td className={styles.rowIndex}>{idx + 1}</td>
                        <td><strong>{item.name}</strong></td>
                        <td><code className={styles.codeTag}>{item.code}</code></td>
                        <td>
                          <span className={styles.locationBadge}>{item.shelfLocation}</span>
                        </td>
                        <td>
                          <span className={styles.qtyBadge}>{item.quantity}</span>
                        </td>
                        <td className={styles.rowTimestamp}>
                          {new Date(item.importTime).toLocaleDateString('vi-VN')}
                        </td>
                        <td className={styles.rowTimestamp}>
                          {item.owner || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.historyFooter}>
              <span>{inventory.length} mặt hàng</span>
              <span style={{ color: '#8b5cf6' }}>● Tổng: {totalItems} sản phẩm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

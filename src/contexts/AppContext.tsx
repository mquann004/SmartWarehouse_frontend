import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, InventoryItem, Transaction, Alert, Thresholds, SensorData } from '../types';
import { apiFetch } from '../config/api';

type Theme = 'dark' | 'light';

interface AppState {
  currentUser: User | null;
  users: User[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  alerts: Alert[];
  thresholds: Thresholds;
  currentSensors: SensorData;
  historicalSensors: SensorData[];
  theme: Theme;
  isConnected: boolean;
  rfidScanning: boolean;
  rfidMode: 'import' | 'export' | null;
  lastRfidUid: string | null;
}

interface AppContextType extends AppState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (username: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addInventory: (item: Omit<InventoryItem, 'id'> & { rfidUid?: string }) => Promise<void>;
  updateInventory: (id: string, item: Partial<InventoryItem>) => Promise<void>;
  deleteInventory: (id: string) => Promise<void>;
  exportItem: (id: string, qty: number, rfidUid?: string, scheduledTime?: string) => Promise<void>;
  confirmReturn: (id: string) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  updateThresholds: (t: Thresholds) => Promise<void>;
  clearAlerts: () => Promise<void>;
  toggleTheme: () => void;
  startRfidScan: (mode: 'import' | 'export') => Promise<void>;
  stopRfidScan: () => Promise<void>;
  clearLastRfid: () => void;
  refreshInventory: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  refreshThresholds: () => Promise<void>;
  // Admin functions
  fetchAllUsers: () => Promise<void>;
  adminCreateUser: (data: { username: string; password: string; name: string; role: string }) => Promise<void>;
  adminUpdateUser: (id: string, data: { name?: string; role?: string; password?: string }) => Promise<void>;
  adminDeleteUser: (id: string) => Promise<void>;
}

const defaultSensors: SensorData = {
  temperature: 0,
  humidity: 0,
  gasLevel: 0,
  timestamp: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Restore user from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('sw-user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [users, setUsers] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<Thresholds>({ 
    tempMin: 18, tempMax: 35, 
    humMin: 30, humMax: 80, 
    gasMin: 0, gasMax: 1000 
  });
  const [historicalSensors, setHistoricalSensors] = useState<SensorData[]>([]);
  const [currentSensors, setCurrentSensors] = useState<SensorData>(defaultSensors);
  const [isConnected, setIsConnected] = useState(false);

  // RFID state
  const [rfidScanning, setRfidScanning] = useState(false);
  const [rfidMode, setRfidMode] = useState<'import' | 'export' | null>(null);
  const [lastRfidUid, setLastRfidUid] = useState<string | null>(null);
  const rfidPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('sw-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sw-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Persist currentUser
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sw-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sw-user');
    }
  }, [currentUser]);

  // --- AUTH ---
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const user = await apiFetch<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setCurrentUser(user);
      return { success: true, user };
    } catch (e: any) {
      return { success: false, error: e.message || 'Đăng nhập thất bại' };
    }
  };

  const register = async (username: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, name }),
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setInventory([]);
    setTransactions([]);
    setAlerts([]);
    localStorage.removeItem('sw-user');
  };

  // --- FETCH DATA (per user) ---
  const refreshInventory = useCallback(async () => {
    if (!currentUser || currentUser.role === 'admin') return;
    try {
      const data = await apiFetch<InventoryItem[]>(`/inventory?user_id=${currentUser.id}`);
      setInventory(data);
    } catch {
      console.warn('⚠️ Không thể tải dữ liệu kho hàng');
    }
  }, [currentUser]);

  const refreshTransactions = useCallback(async () => {
    if (!currentUser || currentUser.role === 'admin') return;
    try {
      const data = await apiFetch<Transaction[]>(`/transactions?user_id=${currentUser.id}`);
      setTransactions(data);
    } catch {
      console.warn('⚠️ Không thể tải lịch sử giao dịch');
    }
  }, [currentUser]);

  const refreshThresholds = useCallback(async () => {
    if (!currentUser || currentUser.role === 'admin') return;
    try {
      const data = await apiFetch<Thresholds>(`/thresholds?user_id=${currentUser.id}`);
      setThresholds(data);
    } catch {
      console.warn('⚠️ Không thể tải cài đặt ngưỡng');
    }
  }, [currentUser]);

  const refreshAlerts = useCallback(async () => {
    if (!currentUser || currentUser.role === 'admin') return;
    try {
      const data = await apiFetch<Alert[]>(`/alerts?user_id=${currentUser.id}`);
      setAlerts(data);
    } catch {
      console.warn('⚠️ Không thể tải lịch sử cảnh báo');
    }
  }, [currentUser]);

  // --- FETCH DATA WHEN USER CHANGES ---
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      refreshInventory();
      refreshTransactions();
      refreshThresholds();
      refreshAlerts();
    }
  }, [currentUser, refreshInventory, refreshTransactions, refreshThresholds, refreshAlerts]);

  // --- SENSOR POLLING (5 giây) ---
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const fetchSensors = async () => {
      try {
        const data = await apiFetch<SensorData>('/sensors/current');
        setCurrentSensors(data);
        setIsConnected(true);

        // --- Logic Cảnh báo Nhiệt độ ---
        if (data.temperature > thresholds.tempMax) {
          triggerAlert('temperature', `Nhiệt độ quá cao: ${data.temperature.toFixed(1)}°C (Ngưỡng: ${thresholds.tempMax}°C)`, 'danger');
        } else if (data.temperature < thresholds.tempMin) {
          triggerAlert('temperature', `Nhiệt độ quá thấp: ${data.temperature.toFixed(1)}°C (Ngưỡng: ${thresholds.tempMin}°C)`, 'warning');
        }

        // --- Logic Cảnh báo Độ ẩm ---
        if (data.humidity > thresholds.humMax) {
          triggerAlert('humidity', `Độ ẩm quá cao: ${data.humidity.toFixed(1)}% (Ngưỡng: ${thresholds.humMax}%)`, 'warning');
        } else if (data.humidity < thresholds.humMin) {
          triggerAlert('humidity', `Độ ẩm quá thấp: ${data.humidity.toFixed(1)}% (Ngưỡng: ${thresholds.humMin}%)`, 'warning');
        }

        // --- Logic Cảnh báo Khí Gas (Theo yêu cầu người dùng) ---
        // Vùng an toàn là [gasMin, gasMax]. Ngoài vùng này sẽ cảnh báo.
        // Đặc biệt dưới gasMin là "Phát hiện rò rỉ khí gas"
        if (data.gasLevel > thresholds.gasMax) {
          triggerAlert('gas', `Nồng độ khí gas vượt mức an toàn: ${data.gasLevel.toFixed(0)}`, 'danger');
        } else if (data.gasLevel < thresholds.gasMin) {
          triggerAlert('gas', `⚠️ Phát hiện rò rỉ khí gas! (Mức độ: ${data.gasLevel.toFixed(0)})`, 'danger');
        }

      } catch {
        setIsConnected(false);
      }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 5000);
    return () => clearInterval(interval);
  }, [currentUser, thresholds]);

  // --- RFID POLL FREQUENCY ---
  const RFID_POLL_INTERVAL = 500;

  // --- FETCH HISTORICAL SENSORS ---
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;
    apiFetch<SensorData[]>('/sensors/history?range=24h')
      .then(setHistoricalSensors)
      .catch(() => console.warn('⚠️ Không thể tải lịch sử sensor'));
  }, [currentUser]);

  // --- ALERT LOGIC ---
  const triggerAlert = async (type: Alert['type'], message: string, severity: Alert['severity']) => {
    if (!currentUser) return;
    
    // Kiểm tra trùng lặp cục bộ để tránh bắn quá nhiều cảnh báo giống nhau liên tục
    if (alerts.some(a => a.type === type && !a.acknowledged && a.message === message)) return;
    
    try {
      await apiFetch(`/alerts?user_id=${currentUser.id}`, {
        method: 'POST',
        body: JSON.stringify({ type, message, severity })
      });
      await refreshAlerts();
    } catch (e) {
      console.error('Lỗi lưu cảnh báo:', e);
    }
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      await apiFetch(`/alerts/acknowledge/${id}`, { method: 'POST' });
      await refreshAlerts();
    } catch (e) {
      console.error('Lỗi xác nhận cảnh báo:', e);
    }
  };

  const clearAlerts = async () => {
    if (!currentUser) return;
    try {
      await apiFetch(`/alerts?user_id=${currentUser.id}`, { method: 'DELETE' });
      await refreshAlerts();
    } catch (e) {
      console.error('Lỗi xoá cảnh báo:', e);
    }
  };

  const updateThresholds = async (t: Thresholds) => {
    if (!currentUser) return;
    try {
      await apiFetch(`/thresholds?user_id=${currentUser.id}`, {
        method: 'POST',
        body: JSON.stringify({
          temp_min: t.tempMin,
          temp_max: t.tempMax,
          hum_min: t.humMin,
          hum_max: t.humMax,
          gas_min: t.gasMin,
          gas_max: t.gasMax
        })
      });
      setThresholds(t);
    } catch (e) {
      alert('Lỗi cập nhật cài đặt ngưỡng');
    }
  };

  // --- RFID SCAN CONTROL ---
  const startRfidScan = useCallback(async (mode: 'import' | 'export') => {
    try {
      await apiFetch(`/rfid/start-scan?mode=${mode}`, { method: 'POST' });
      setRfidScanning(true);
      setRfidMode(mode);
      setLastRfidUid(null);

      if (rfidPollRef.current) clearInterval(rfidPollRef.current);
      rfidPollRef.current = setInterval(async () => {
        try {
          const result = await apiFetch<{ found: boolean; uid?: string }>('/rfid/last-scan');
          if (result.found && result.uid) {
            setLastRfidUid(result.uid);
          }
        } catch { /* ignore */ }
      }, RFID_POLL_INTERVAL);
    } catch (e) {
      console.error('Lỗi bật scan RFID:', e);
    }
  }, []);

  const stopRfidScan = useCallback(async () => {
    try { await apiFetch('/rfid/stop-scan', { method: 'POST' }); } catch { /* ignore */ }
    setRfidScanning(false);
    setRfidMode(null);
    setLastRfidUid(null);
    if (rfidPollRef.current) {
      clearInterval(rfidPollRef.current);
      rfidPollRef.current = null;
    }
  }, []);

  const clearLastRfid = () => setLastRfidUid(null);

  useEffect(() => {
    return () => { if (rfidPollRef.current) clearInterval(rfidPollRef.current); };
  }, []);

  // --- CRUD OPERATIONS ---
  const addInventory = async (item: Omit<InventoryItem, 'id'> & { rfidUid?: string }) => {
    if (!currentUser) return;
    try {
      await apiFetch(`/inventory?user_id=${currentUser.id}`, {
        method: 'POST',
        body: JSON.stringify({
          name: item.name, code: item.code,
          shelf_location: item.shelfLocation,
          quantity: item.quantity,
          owner: item.owner || null,
          rfid_uid: item.rfidUid || null,
        }),
      });
      await refreshInventory();
      await refreshTransactions();
    } catch (e: any) {
      alert(e.message || 'Lỗi nhập kho');
      throw e;
    }
  };

  const updateInventory = async (id: string, data: Partial<InventoryItem>) => {
    try {
      await apiFetch(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name, shelf_location: data.shelfLocation,
          quantity: data.quantity,
          owner: data.owner,
        }),
      });
      await refreshInventory();
    } catch (e: any) {
      alert(e.message || 'Lỗi cập nhật');
      throw e;
    }
  };

  const deleteInventory = async (id: string) => {
    try {
      await apiFetch(`/inventory/${id}`, { method: 'DELETE' });
      await refreshInventory();
    } catch (e: any) {
      alert(e.message || 'Lỗi xoá hàng');
      throw e;
    }
  };

  const exportItem = async (id: string, qty: number, rfidUid?: string, scheduledTime?: string) => {
    if (!currentUser) return;
    try {
      await apiFetch(`/transactions/export?user_id=${currentUser.id}`, {
        method: 'POST',
        body: JSON.stringify({
          item_id: parseInt(id), quantity: qty,
          rfid_uid: rfidUid || null,
          scheduled_time: scheduledTime || null,
          user_name: currentUser?.name || 'System',
        }),
      });
      await refreshInventory();
      await refreshTransactions();
    } catch (e: any) {
      alert(e.message || 'Lỗi xuất kho');
      throw e;
    }
  };

  const confirmReturn = async (id: string) => {
    try {
      await apiFetch(`/inventory/confirm-return/${id}`, { method: 'POST' });
      await refreshInventory();
    } catch (e: any) {
      alert(e.message || 'Lỗi xác nhận trả hàng');
      throw e;
    }
  };

  // --- ADMIN USER MANAGEMENT ---
  const fetchAllUsers = useCallback(async () => {
    try {
      const data = await apiFetch<User[]>('/admin/users');
      setUsers(data);
    } catch {
      console.warn('⚠️ Không thể tải danh sách người dùng');
    }
  }, []);

  const adminCreateUser = async (data: { username: string; password: string; name: string; role: string }) => {
    await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify(data) });
    await fetchAllUsers();
  };

  const adminUpdateUser = async (id: string, data: { name?: string; role?: string; password?: string }) => {
    await apiFetch(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await fetchAllUsers();
  };

  const adminDeleteUser = async (id: string) => {
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    await fetchAllUsers();
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, inventory, transactions, alerts, thresholds,
      currentSensors, historicalSensors, theme, isConnected,
      rfidScanning, rfidMode, lastRfidUid,
      login, register, logout, addInventory, updateInventory, deleteInventory, exportItem, confirmReturn,
      acknowledgeAlert, updateThresholds, clearAlerts, toggleTheme,
      startRfidScan, stopRfidScan, clearLastRfid,
      refreshInventory, refreshTransactions, refreshAlerts, refreshThresholds,
      fetchAllUsers, adminCreateUser, adminUpdateUser, adminDeleteUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

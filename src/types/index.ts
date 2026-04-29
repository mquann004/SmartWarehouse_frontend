export type Role = 'admin' | 'operator' | 'viewer';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  shelfLocation: string;
  quantity: number;
  importTime: string;
  owner?: string;
  scheduledExportTime?: string;
  rfidUid?: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'import' | 'export';
  quantity: number;
  timestamp: string;
  user: string;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  gasLevel: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: 'temperature' | 'humidity' | 'gas' | 'inventory_full' | 'expiry';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  severity: 'warning' | 'danger';
}

export interface Thresholds {
  tempMin: number;
  tempMax: number;
  humMin: number;
  humMax: number;
  gasMin: number;
  gasMax: number;
}

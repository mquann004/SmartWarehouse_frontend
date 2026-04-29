// API Configuration cho hệ thống giám sát kho thông minh
// Tự động detect hostname để máy khác trong mạng LAN cũng truy cập được

export const API_BASE = `http://${window.location.hostname}:8000/api`;

// Helper function cho API calls
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Lỗi kết nối server' }));
    throw new Error(error.detail || `HTTP Error: ${response.status}`);
  }

  return response.json();
}

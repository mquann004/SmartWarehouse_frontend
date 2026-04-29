# 🌐 Smart Warehouse Frontend (React 3D Dashboard)

<div align="center">
  <img src="https://img.shields.io/badge/Library-React_18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Build_Tool-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</div>

## 📖 Introduction
Đây là mã nguồn Frontend (Web Dashboard) của hệ thống kho thông minh, được xây dựng bằng **React** và **TypeScript**. 
Frontend cung cấp một trải nghiệm người dùng (UX) hiện đại và chuyên nghiệp để theo dõi toàn bộ trạng thái kho hàng. Các tính năng nổi bật bao gồm:
- **Biểu đồ thời gian thực:** Cập nhật ngay lập tức các chỉ số môi trường (Nhiệt độ, Độ ẩm, Khí Gas).
- **Mô phỏng 3D:** Khả năng dựng hình sơ đồ kho dưới dạng không gian 3D, với màu sắc cảnh báo linh hoạt.
- **AI Chat Widget:** Một cửa sổ trợ lý ảo thu nhỏ, luôn sẵn sàng giải đáp các truy vấn kho bãi bằng tiếng Việt.
- **Hệ thống cảnh báo:** Hiển thị tức thời (Pop-up) khi có rủi ro về nhiệt độ cao hay rò rỉ khí Gas.

## 📂 Folder Structure

Dự án sử dụng cấu trúc thư mục tiêu chuẩn của React Vite, chú trọng vào việc chia nhỏ component (Component-Driven):

```text
frontend/src/
├── assets/               # Hình ảnh, font chữ tĩnh
├── components/           # Các UI Components dùng chung (Sidebar, AI Chat Widget, 3D Map, Alert...)
├── config/               # Cấu hình hệ thống (Ví dụ: file api.ts kết nối với Backend)
├── contexts/             # Global State Management sử dụng React Context (AppContext)
├── layouts/              # Cấu trúc khung giao diện trang (MainLayout)
├── pages/                # Nội dung các trang chính (Dashboard, Inventory, History, Admin Panel, Login)
├── types/                # Định nghĩa các Interface & Types cho TypeScript
├── App.tsx               # Root Component quản lý toàn bộ hệ thống Routing (React Router)
└── index.css             # File style CSS chung toàn hệ thống
```

## 🚀 Setup & Run Instructions

Dự án này sử dụng Node.js và Vite để khởi chạy nhanh chóng.

### Bước 1: Chuẩn bị môi trường
- Cài đặt **Node.js** (Phiên bản v18 hoặc mới hơn).
- Mở Terminal (Cmd/Powershell) trỏ tới thư mục `frontend`.

### Bước 2: Cài đặt Dependencies
Cài đặt tất cả các gói thư viện cần thiết đã được khai báo trong `package.json` bằng lệnh:
```bash
npm install
```

### Bước 3: Cấu hình API kết nối
Theo mặc định, Frontend sẽ tự động lấy địa chỉ IP của máy tính để kết nối với Backend (cổng `8000`). Nếu Backend của bạn chạy ở một máy tính khác, hãy sửa đổi biến `API_BASE` bên trong file `src/config/api.ts`:
```typescript
export const API_BASE = `http://192.168.1.X:8000/api`;
```

### Bước 4: Khởi chạy môi trường Phát triển (Development)
Sử dụng lệnh sau để khởi động máy chủ ảo Vite:
```bash
npm run dev
```

Sau khi chạy xong, trình duyệt sẽ cung cấp một đường link (thường là `http://localhost:5173`). Bạn chỉ cần click vào để trải nghiệm Hệ thống quản lý kho thông minh.

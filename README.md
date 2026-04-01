# Smart AI Project (SkyOffice)

## 1. Giới thiệu

Smart AI (SkyOffice) là nền tảng không gian làm việc ảo tích hợp trò chơi, chat realtime và quản lý người dùng. Dự án gồm 2 phần chính:

- `SkyOffice`: ứng dụng client/server cho môi trường 2D/3D (Phaser + React + Socket.io)
- `smart-ai`: backend API / frontend UI / cấu hình deploy đa nền tảng

## 2. Cấu trúc thư mục

- `SkyOffice/`
  - `client/`: React + Vite + Phaser game client
  - `server/`: Node.js + TypeScript + Socket.IO backend
  - `types/`: định nghĩa TypeScript dùng chung
- `smart-ai/`
  - `backend/`: API Node.js (Express, MongoDB, auth, routes)
  - `frontend/`: UI phía người dùng
  - `deploy/`: Docker Compose, Render, Vercel config
  - Khác: `generate_report.py`, `flow_summary.txt`, `SKYOFFICE_BUG_REPORT.md`

## 3. Công nghệ chính

- Frontend: React, Vite, TypeScript
- Game engine: Phaser
- Backend: Node.js, Express, Socket.IO, MongoDB
- Deploy: Docker, docker-compose, Render, Vercel

## 4. Cài đặt và chạy local

### SkyOffice

1. `cd SkyOffice/client && npm install`
2. `cd SkyOffice/server && npm install`
3. `cd SkyOffice/server && npm run dev`
4. `cd SkyOffice/client && npm run dev`
5. Mở `http://localhost:5173` (hoặc cổng Vite hiển thị)

### smart-ai/backend

1. `cd smart-ai/backend && npm install`
2. Tạo file `.env` với giá trị tối thiểu:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `PORT`
3. `npm run dev`

### smart-ai/frontend

1. `cd smart-ai/frontend && npm install`
2. `npm run dev`

## 5. Chạy Docker Compose

- Từ `smart-ai/`: `docker-compose up --build`
- (Nếu có) Từ `SkyOffice/` dùng file Docker riêng tương ứng

## 6. Deploy

- `smart-ai/deploy/render.yaml`
- `smart-ai/deploy/vercel.json`
- Ghi chú: kiểm tra biến môi trường, CORS, Mongo URI, socket URL

## 7. Tính năng

- Phòng ảo tạo/tham gia
- Di chuyển avatar, animation vật phẩm
- Chat realtime
- Quản lý người dùng, bạn bè, note, báo cáo
- Lọc từ ngữ bẩn, admin log

## 8. Chia sẻ & đóng góp

1. Fork -> branch mới -> PR
2. Bảo đảm chuẩn kiến trúc, style code
3. Chạy thử và test trước khi merge

## 9. Vấn đề thường gặp

- Lỗi 500 do thiếu `.env`
- CORS socket lỗi do sai origin/URL
- Phải chạy backend trước client

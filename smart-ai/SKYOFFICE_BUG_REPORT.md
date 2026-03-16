# SkyOffice — Báo Cáo Lỗi & Cách Xử Lý

> Báo cáo này tổng hợp tất cả lỗi phát hiện được khi 2 người dùng truy cập dịch vụ SkyOffice Client, cùng nguyên nhân và cách khắc phục.

---

## Tổng Quan

| # | Lỗi | Mức Độ | Trạng Thái |
|---|------|--------|------------|
| 1 | Matchmaking HTTP 405 (Method Not Allowed) | 🔴 Critical | ✅ Đã sửa |
| 2 | WebSocket 1006 — Room connection failed | 🔴 Critical | ✅ Đã sửa |
| 3 | Static assets 404 — Blank page | 🔴 Critical | ✅ Đã sửa |
| 4 | `VITE_SERVER_URL` không được truyền vào build | 🟡 Medium | ✅ Đã sửa |

---

## Lỗi #1: Matchmaking HTTP 405 (Method Not Allowed)

### Triệu chứng
- Khi nhấn **"CONNECT TO PUBLIC LOBBY"** hoặc **"CREATE/FIND CUSTOM ROOMS"**, hiện toast đỏ: *"Trying to connect to server, please try again!"*
- Console log: `POST http://localhost:3000/matchmake/joinOrCreate/lobby` → **405**
- Trang hiển thị **"Connecting to server..."** liên tục

### Nguyên nhân
SkyOffice Client (Phaser + React) gửi HTTP POST request đến `/matchmake/joinOrCreate/lobby` để join phòng qua Colyseus. Tuy nhiên, Nginx chỉ phục vụ static files và không proxy request này đến Colyseus server (port 2567).

### Cách xử lý
Thêm reverse proxy trong Nginx config (`Dockerfile.client`) để chuyển tiếp các request `/matchmake/` đến Colyseus server:

```nginx
location /matchmake/ {
    proxy_pass http://colyseus;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### File thay đổi
- `SkyOffice/Dockerfile.client` — Thêm Nginx reverse proxy config

---

## Lỗi #2: WebSocket 1006 — Room Connection Failed

### Triệu chứng
- Matchmaking POST trả về **200 OK** (thành công), nhưng ngay sau đó WebSocket connection bị đóng
- Console log: 
  ```
  WebSocket connection to 'ws://localhost:3000/xguzA804k/o7ik37V14?sessionId=uSpI_eDkB' failed
  Room connection was closed unexpectedly (1006)
  colyseus.js - onError => (1006)
  ```

### Nguyên nhân
Sau khi matchmaking thành công, Colyseus client cần mở WebSocket đến path `/processId/roomId` (ví dụ: `/xguzA804k/o7ik37V14`). Nginx regex ban đầu chỉ match path 1 segment (`^/[a-zA-Z0-9_-]+$`), không match được path 2 segment (`processId/roomId`).

### Cách xử lý
Sửa regex thành `^/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+` để match các path đa segment, đồng thời thêm WebSocket headers và timeout dài:

```nginx
location ~ ^/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+ {
    proxy_pass http://colyseus;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
}
```

### File thay đổi
- `SkyOffice/Dockerfile.client` — Sửa Nginx regex và thêm WebSocket proxy headers

---

## Lỗi #3: Static Assets 404 — Blank Page

### Triệu chứng
- Trang trắng hoàn toàn khi truy cập `http://localhost:3000`
- Console log:
  ```
  GET http://localhost:3000/assets/index.c656a248.js → 404 Not Found (x-powered-by: Express)
  ```
- CSS file trả về `text/html` thay vì `text/css`

### Nguyên nhân
Regex WebSocket proxy `^/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+` quá rộng, bắt luôn cả request `/assets/index.xxx.js` và chuyển đến Colyseus (Express server) thay vì phục vụ static file từ Nginx.

### Cách xử lý
Thêm block `^~ /assets/` với priority cao hơn regex để đảm bảo static files được Nginx phục vụ trực tiếp:

```nginx
# ^~ prefix match beats regex match
location ^~ /assets/ {
    try_files $uri =404;
}
```

### File thay đổi
- `SkyOffice/Dockerfile.client` — Thêm priority location block cho `/assets/`

---

## Lỗi #4: `VITE_SERVER_URL` Không Được Truyền Vào Build

### Triệu chứng
- Client không biết địa chỉ Colyseus server, sử dụng URL mặc định (same origin) nhưng không có proxy
- `Network.ts` kiểm tra `process.env.NODE_ENV === 'production'` để lấy `import.meta.env.VITE_SERVER_URL`, nhưng giá trị này empty

### Nguyên nhân
`docker-compose.yml` truyền `VITE_SERVER_URL` như một build ARG, nhưng `Dockerfile.client` chưa chuyển ARG thành ENV. Vite chỉ embed biến môi trường `VITE_*` nếu chúng tồn tại trong ENV lúc build.

### Cách xử lý
Thêm `ARG` và `ENV` instruction trong `Dockerfile.client` stage 1:

```dockerfile
ARG VITE_SERVER_URL=ws://localhost:2567
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
```

Và cập nhật `docker-compose.yml` để sử dụng URL same-origin (vì đã có Nginx proxy):

```yaml
args:
  - VITE_SERVER_URL=ws://localhost:3000
```

### File thay đổi
- `SkyOffice/Dockerfile.client` — Thêm ARG→ENV cho Vite
- `smart-ai/docker-compose.yml` — Đổi `VITE_SERVER_URL` thành `ws://localhost:3000`

---

## Kết Quả Sau Khi Sửa

### User 1 (TestUser1)
✅ Truy cập `http://localhost:3000` → Load thành công  
✅ Nhấn "CONNECT TO PUBLIC LOBBY" → Kết nối thành công  
✅ Nhập tên "User1" → Vào game world  
✅ Chat box hiển thị "User1 joined the lobby"  

### User 2 (TestUser2)
✅ Truy cập `http://localhost:3000` → Load thành công  
✅ Nhấn "CONNECT TO PUBLIC LOBBY" → Kết nối thành công  
✅ Nhập tên "User2" → Vào game world  
✅ Thấy User1 trong phòng, chat hiển thị cả 2 users  

---

## Danh Sách File Đã Thay Đổi

| File | Thay Đổi |
|------|----------|
| `SkyOffice/Dockerfile.client` | Thêm ARG→ENV, Nginx upstream + reverse proxy + assets priority |
| `smart-ai/docker-compose.yml` | Đổi `VITE_SERVER_URL` thành `ws://localhost:3000` |
| `SkyOffice/.dockerignore` | Thêm `**/node_modules` để tăng tốc Docker build |
| `SkyOffice/Dockerfile.client.dockerignore` | Tạo mới để giảm Docker context size |
| `SkyOffice/Dockerfile.server.dockerignore` | Tạo mới để giảm Docker context size |
| `smart-ai/backend/.dockerignore` | Tạo mới để giảm Docker context size |
| `smart-ai/frontend/.dockerignore` | Tạo mới để giảm Docker context size |

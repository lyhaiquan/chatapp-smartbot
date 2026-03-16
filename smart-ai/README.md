# Smart AI Project

## Cấu trúc thư mục mới phục vụ deploy

- backend/ # Source code backend (Node.js)
- frontend/ # Source code frontend (React)
- codesandbox-countries/ # Demo hoặc mã nguồn phụ
- deploy/
  - docker-compose.yml
  - render.yaml
  - vercel.json

## Hướng dẫn deploy

- Toàn bộ file cấu hình deploy đã được chuyển vào thư mục `deploy/`.
- Mỗi service có Dockerfile riêng trong thư mục của mình.
- Chạy deploy từ thư mục `deploy/` hoặc chỉ định đường dẫn tương ứng.

## Các file khác

- generate_report.py: Script tổng hợp báo cáo

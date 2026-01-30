# Center Management System - Trường Thành Edu

Chào mừng bạn đến với dự án **Center Management System (CMS)** dành cho Trung tâm Giáo dục Trường Thành. Đây là một giải pháp quản lý toàn diện bao gồm Backend API, Web Dashboard và Ứng dụng Di động.

## 🚀 Tổng quan kiến trúc

Dự án được tổ chức theo cấu trúc monorepo bao gồm 3 phần chính:

*   **`BE/`**: Backend API được xây dựng với **NestJS**, sử dụng **MongoDB** để lưu trữ dữ liệu.
*   **`fe/`**: Giao diện web dành cho admin và nhân viên, phát triển bằng **Next.js**.
*   **`mobile/`**: Ứng dụng di động dành cho học sinh/phụ huynh, phát triển bằng **Expo (React Native)**.

---

## 🛠️ Công nghệ sử dụng

### Backend (BE)
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) với [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT & Passport
- **Real-time**: Socket.io
- **Documentation**: Swagger UI
- **Khác**: ExcelJS (xuất báo cáo), Multer (xử lý file)

### Web Frontend (fe)
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [GSAP](https://gsap.com/)
- **API Client**: Axios

### Mobile App (mobile)
- **Framework**: [Expo](https://expo.dev/) / [React Native](https://reactnative.dev/)
- **Navigation**: Expo Router
- **State Management**: Zustand
- **Storage**: AsyncStorage & SecureStore

---

## ✨ Các tính năng chính

Dự án hỗ trợ đầy đủ các quy trình nghiệp vụ của một trung tâm giáo dục:

- 👥 **Quản lý người dùng**: Phân quyền Admin, Giáo viên, Nhân viên, Học sinh.
- 🏫 **Quản lý lớp học**: Sắp xếp lịch học, quản lý danh sách học sinh theo lớp.
- 📝 **Điểm danh (Attendance)**: Theo dõi sự hiện diện của học sinh hàng ngày.
- 💰 **Quản lý tài chính & Học phí**: Theo dõi công nợ học phí, phiếu thu, phiếu chi.
- 📚 **Bài tập & Tài liệu**: Giao bài tập, nộp bài trực tuyến và quản lý kho tư liệu.
- 💬 **Trao đổi & Phản hồi**: Hệ thống chat và gửi feedback giữa phụ huynh và trung tâm.
- 🔔 **Thông báo**: Hệ thống thông báo thời gian thực qua Web và Mobile.
- 📊 **Báo cáo & Thống kê**: Xuất dữ liệu ra Excel, biểu đồ tóm tắt tình hình hoạt động.

---

## 📦 Hướng dẫn cài đặt

### Yêu cầu hệ thống
- **Node.js**: Phiên bản 18 trở lên.
- **MongoDB**: Đang chạy cục bộ hoặc qua Cloud (Atlas).

### Các bước thực hiện

1.  **Clone dự án:**
    ```bash
    git clone [repository-url]
    cd Center-Management-Truong_Thanh
    ```

2.  **Thiết lập Backend (BE):**
    ```bash
    cd BE
    npm install
    # Tạo file .env dựa trên .env.example và cấu hình MONGODB_URI
    npm run start:dev
    ```

3.  **Thiết lập Web Frontend (fe):**
    ```bash
    cd ../fe
    npm install
    npm run dev
    ```

4.  **Thiết lập Mobile App (mobile):**
    ```bash
    cd ../mobile
    npm install
    npx expo start
    ```

---

## 📂 Cấu trúc thư mục tiêu biểu

```text
.
├── BE/                 # NestJS Source code
│   ├── src/            # Các modules: auth, users, classes, attendance...
│   └── test/           # Unit & E2E tests
├── fe/                 # Next.js Source code
│   ├── app/            # Pages & Routing
│   ├── components/     # UI Components
│   └── lib/            # Stores & Utils
└── mobile/             # Expo Source code
    ├── app/            # Mobile screens & Navigation
    └── components/     # Mobile components
```

---

## 🤝 Liên hệ
Nếu có bất kỳ câu hỏi nào về dự án, vui lòng liên hệ với đội ngũ phát triển.

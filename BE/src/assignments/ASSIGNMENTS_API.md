# ASSIGNMENTS API - GIAO BÀI TẬP/KIỂM TRA

## 📋 Tổng quan

Module này cho phép **Giáo viên** và **Admin** giao bài tập hoặc bài kiểm tra cho lớp học.

---

## 🔐 Authentication

Tất cả endpoints yêu cầu:
- **Bearer Token** trong header
- **Role**: `teacher` hoặc `admin` (trừ GET endpoints)

---

## 📡 API Endpoints

### 1. POST `/assignments` - Giao bài mới

**Description**: Tạo bài tập hoặc bài kiểm tra cho lớp

**Roles**: `teacher`, `admin`

**Request Body**:
```json
{
  "title": "Bài tập tuần 3 - Phương trình bậc 2",
  "description": "Giải các bài tập từ 1-10 trong sách giáo khoa trang 45",
  "classId": "6789abcd1234567890123456",
  "subjectId": "1234567890abcdef12345678",
  "type": "assignment",
  "dueDate": "2026-02-01T23:59:59Z",
  "maxScore": 10,
  "attachments": [
    "https://storage.example.com/files/assignment-3.pdf",
    "https://storage.example.com/files/instructions.docx"
  ]
}
```

**Validation Rules**:
- `title`: Required, string
- `description`: Optional, string
- `classId`: Required, valid MongoDB ObjectId
- `subjectId`: Optional, valid MongoDB ObjectId
- `type`: Required, enum: `"assignment"` | `"test"`
- `dueDate`: Required, ISO 8601 date string
- `maxScore`: Required, number >= 0
- `attachments`: Optional, array of strings (URLs)

**Response 201 Created**:
```json
{
  "_id": "67890def12345678901234ab",
  "title": "Bài tập tuần 3 - Phương trình bậc 2",
  "description": "Giải các bài tập từ 1-10 trong sách giáo khoa trang 45",
  "classId": {
    "_id": "6789abcd1234567890123456",
    "name": "Lớp Toán 12A1"
  },
  "subjectId": {
    "_id": "1234567890abcdef12345678",
    "name": "Toán học"
  },
  "type": "assignment",
  "dueDate": "2026-02-01T23:59:59.000Z",
  "maxScore": 10,
  "attachments": [
    "https://storage.example.com/files/assignment-3.pdf",
    "https://storage.example.com/files/instructions.docx"
  ],
  "createdBy": {
    "_id": "abc123def456789012345678",
    "name": "Nguyễn Văn Giáo viên",
    "email": "teacher@example.com"
  },
  "createdAt": "2026-01-24T12:00:00.000Z",
  "updatedAt": "2026-01-24T12:00:00.000Z"
}
```

---

### 2. GET `/assignments/class/:classId` - Lấy bài theo lớp

**Description**: Lấy tất cả bài tập/kiểm tra của một lớp

**Roles**: All authenticated users

**URL Parameters**:
- `classId`: MongoDB ObjectId của lớp

**Example Request**:
```
GET /assignments/class/6789abcd1234567890123456
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
[
  {
    "_id": "67890def12345678901234ab",
    "title": "Bài tập tuần 3 - Phương trình bậc 2",
    "description": "Giải các bài tập từ 1-10 trong sách giáo khoa trang 45",
    "classId": {
      "_id": "6789abcd1234567890123456",
      "name": "Lớp Toán 12A1"
    },
    "subjectId": {
      "_id": "1234567890abcdef12345678",
      "name": "Toán học"
    },
    "type": "assignment",
    "dueDate": "2026-02-01T23:59:59.000Z",
    "maxScore": 10,
    "attachments": [
      "https://storage.example.com/files/assignment-3.pdf"
    ],
    "createdBy": {
      "_id": "abc123def456789012345678",
      "name": "Nguyễn Văn Giáo viên",
      "email": "teacher@example.com"
    },
    "createdAt": "2026-01-24T12:00:00.000Z",
    "updatedAt": "2026-01-24T12:00:00.000Z"
  },
  {
    "_id": "fedcba09876543210abcdef1",
    "title": "Kiểm tra giữa kỳ",
    "description": "Kiểm tra 90 phút, không được sử dụng tài liệu",
    "classId": {
      "_id": "6789abcd1234567890123456",
      "name": "Lớp Toán 12A1"
    },
    "subjectId": {
      "_id": "1234567890abcdef12345678",
      "name": "Toán học"
    },
    "type": "test",
    "dueDate": "2026-01-28T08:00:00.000Z",
    "maxScore": 100,
    "attachments": [],
    "createdBy": {
      "_id": "abc123def456789012345678",
      "name": "Nguyễn Văn Giáo viên",
      "email": "teacher@example.com"
    },
    "createdAt": "2026-01-20T12:00:00.000Z",
    "updatedAt": "2026-01-20T12:00:00.000Z"
  }
]
```

**Note**: Kết quả được sắp xếp theo `dueDate` giảm dần (mới nhất trước)

---

### 3. GET `/assignments/:id` - Lấy chi tiết bài

**Description**: Lấy thông tin chi tiết của một bài tập/kiểm tra

**Roles**: All authenticated users

**URL Parameters**:
- `id`: MongoDB ObjectId của assignment

**Example Request**:
```
GET /assignments/67890def12345678901234ab
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
{
  "_id": "67890def12345678901234ab",
  "title": "Bài tập tuần 3 - Phương trình bậc 2",
  "description": "Giải các bài tập từ 1-10 trong sách giáo khoa trang 45",
  "classId": {
    "_id": "6789abcd1234567890123456",
    "name": "Lớp Toán 12A1"
  },
  "subjectId": {
    "_id": "1234567890abcdef12345678",
    "name": "Toán học"
  },
  "type": "assignment",
  "dueDate": "2026-02-01T23:59:59.000Z",
  "maxScore": 10,
  "attachments": [
    "https://storage.example.com/files/assignment-3.pdf",
    "https://storage.example.com/files/instructions.docx"
  ],
  "createdBy": {
    "_id": "abc123def456789012345678",
    "name": "Nguyễn Văn Giáo viên",
    "email": "teacher@example.com"
  },
  "createdAt": "2026-01-24T12:00:00.000Z",
  "updatedAt": "2026-01-24T12:00:00.000Z"
}
```

**Response 404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Assignment not found",
  "error": "Not Found"
}
```

---

### 4. PATCH `/assignments/:id` - Cập nhật bài

**Description**: Sửa thông tin bài tập/kiểm tra

**Roles**: `teacher`, `admin`

**URL Parameters**:
- `id`: MongoDB ObjectId của assignment

**Request Body** (tất cả fields đều optional):
```json
{
  "title": "Bài tập tuần 3 - Phương trình bậc 2 (Cập nhật)",
  "dueDate": "2026-02-05T23:59:59Z",
  "maxScore": 15,
  "attachments": [
    "https://storage.example.com/files/assignment-3-v2.pdf"
  ]
}
```

**Response 200 OK**:
```json
{
  "_id": "67890def12345678901234ab",
  "title": "Bài tập tuần 3 - Phương trình bậc 2 (Cập nhật)",
  "description": "Giải các bài tập từ 1-10 trong sách giáo khoa trang 45",
  "classId": {
    "_id": "6789abcd1234567890123456",
    "name": "Lớp Toán 12A1"
  },
  "subjectId": {
    "_id": "1234567890abcdef12345678",
    "name": "Toán học"
  },
  "type": "assignment",
  "dueDate": "2026-02-05T23:59:59.000Z",
  "maxScore": 15,
  "attachments": [
    "https://storage.example.com/files/assignment-3-v2.pdf"
  ],
  "createdBy": {
    "_id": "abc123def456789012345678",
    "name": "Nguyễn Văn Giáo viên",
    "email": "teacher@example.com"
  },
  "createdAt": "2026-01-24T12:00:00.000Z",
  "updatedAt": "2026-01-24T12:30:00.000Z"
}
```

---

### 5. DELETE `/assignments/:id` - Xóa bài

**Description**: Xóa bài tập/kiểm tra

**Roles**: `teacher`, `admin`

**URL Parameters**:
- `id`: MongoDB ObjectId của assignment

**Example Request**:
```
DELETE /assignments/67890def12345678901234ab
Authorization: Bearer <token>
```

**Response 200 OK**:
```json
{
  "message": "Assignment deleted successfully",
  "id": "67890def12345678901234ab"
}
```

**Response 404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Assignment not found",
  "error": "Not Found"
}
```

---

## 🧪 Test với cURL/Postman

### Tạo bài tập mới:
```bash
curl -X POST http://localhost:3000/assignments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bài tập tuần 3",
    "description": "Giải bài tập 1-10",
    "classId": "6789abcd1234567890123456",
    "type": "assignment",
    "dueDate": "2026-02-01T23:59:59Z",
    "maxScore": 10
  }'
```

### Lấy danh sách bài của lớp:
```bash
curl -X GET http://localhost:3000/assignments/class/6789abcd1234567890123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Schema

**Collection**: `assignments`

**Indexes** (đề xuất):
- `{ classId: 1, dueDate: -1 }` - Tối ưu query theo lớp + sắp xếp theo deadline
- `{ createdBy: 1 }` - Tối ưu query bài tập của giáo viên
- `{ type: 1 }` - Filter theo loại (assignment/test)

---

## 🔄 Luồng sử dụng

### Luồng Giáo viên giao bài:
1. Giáo viên đăng nhập → Nhận JWT token
2. POST `/assignments` với thông tin bài tập
3. Hệ thống lưu vào DB với `createdBy = teacherId`
4. Trả về bài tập đã tạo với thông tin đầy đủ (populated)

### Luồng Học sinh xem bài:
1. Học sinh/Phụ huynh đăng nhập
2. GET `/assignments/class/:classId` để xem bài tập của lớp
3. Có thể GET `/assignments/:id` để xem chi tiết từng bài

---

## ⚠️ Lưu ý

### Không bao gồm trong module này:
- ❌ Nộp bài (submission) - Sẽ có module riêng
- ❌ Chấm điểm (grading) - Dùng module `assessments`
- ❌ Thông báo cho học sinh - Tích hợp với module `notifications`

### Để tích hợp đầy đủ hệ thống:
1. Sau khi tạo assignment → Gửi notification cho học sinh
2. Học sinh nộp bài → Tạo record trong collection `submissions`
3. Giáo viên chấm điểm → Tạo record trong `assessments` với link đến `assignmentId`

---

## 🎯 Next Steps

1. **Test API**: Dùng Postman/cURL test các endpoints
2. **Tạo submissions module**: Cho phép học sinh nộp bài
3. **Tích hợp notifications**: Thông báo khi có bài mới
4. **Frontend integration**: Kết nối mobile/web app với API
5. **Add filters**: Lọc theo type, date range, teacher

---

## 📝 Example Use Cases

### Case 1: Giáo viên giao bài tập về nhà
```json
{
  "title": "Bài tập về nhà - Tuần 5",
  "description": "Làm bài tập 1-20 trang 67",
  "classId": "...",
  "type": "assignment",
  "dueDate": "2026-02-10T23:59:59Z",
  "maxScore": 10
}
```

### Case 2: Giáo viên tạo bài kiểm tra 15 phút
```json
{
  "title": "Kiểm tra 15 phút - Chương 3",
  "description": "Trắc nghiệm 10 câu",
  "classId": "...",
  "type": "test",
  "dueDate": "2026-01-30T08:15:00Z",
  "maxScore": 10
}
```

### Case 3: Bài kiểm tra giữa kỳ có file đề
```json
{
  "title": "Kiểm tra giữa kỳ I - Toán 12",
  "description": "Thời gian: 90 phút. Không sử dụng tài liệu.",
  "classId": "...",
  "subjectId": "...",
  "type": "test",
  "dueDate": "2026-02-15T10:30:00Z",
  "maxScore": 100,
  "attachments": [
    "https://storage.example.com/exam-papers/math-12-midterm.pdf"
  ]
}
```

# File Upload & Management API - Hướng dẫn sử dụng

## 📋 Tổng quan

API này cho phép upload, quản lý và truy xuất files (PDF, DOCX, DOC) với tích hợp Cloudinary. Các file được phân loại theo Subject và Folder, hỗ trợ phân trang và xử lý bất đồng bộ (summary, quiz generation).

---

## 🔧 Cấu hình

### 1. Cài đặt dependencies (đã có sẵn trong package.json)
```bash
npm install cloudinary multer @types/multer
```

### 2. Cấu hình Cloudinary trong .env
Cập nhật file `.env` với thông tin Cloudinary của bạn:

```env
CLOUDINARY_CLOUD_NAME='your_actual_cloud_name'
CLOUDINARY_API_KEY='your_actual_api_key'
CLOUDINARY_API_SECRET='your_actual_api_secret'
```

**Lấy thông tin Cloudinary:**
1. Đăng nhập vào [Cloudinary Dashboard](https://cloudinary.com/console)
2. Copy Cloud Name, API Key, và API Secret
3. Paste vào file .env

---

## 📁 Cấu trúc Files đã tạo

```
src/
├── config/
│   └── cloudinary.ts          # Cấu hình Cloudinary
├── controllers/
│   └── file.controller.ts     # Controller xử lý HTTP requests
├── dto/
│   └── request/
│       └── file.dto.ts        # Data Transfer Objects
├── models/
│   └── file.model.ts          # File model (đã update)
├── routes/
│   ├── file.route.ts          # File routes
│   └── index.ts               # Main router (đã update)
├── services/
│   └── file.service.ts        # Business logic layer
└── utils/
    └── cloudinaryUtil.ts      # Utilities cho Cloudinary
```

---

## 🚀 API Endpoints

### 1. **GET /subjects/:subjectId/files**
Lấy danh sách files theo subject với phân trang

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `folder` (optional): Lọc theo folder name
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số items/trang (default: 20)

**Example Request:**
```bash
GET http://localhost:8017/hackathon/subjects/507f1f77bcf86cd799439011/files?folder=Calculus&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Lấy danh sách files thành công",
  "result": {
    "files": [
      {
        "id": "file123",
        "name": "Limits and Continuity.pdf",
        "subject": "Mathematics",
        "folder": "Calculus",
        "uploadDate": "2025-01-10",
        "size": "2.4 MB",
        "sizeBytes": 2516582,
        "mimeType": "application/pdf",
        "summaryCount": 2,
        "quizCount": 2,
        "url": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/hackathon-files/file.pdf",
        "metadata": {
          "language": "en"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

---

### 2. **POST /files**
Upload file mới với optional processing

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required): File binary (PDF/DOCX/DOC, max 50MB)
- `subject` (required): Subject ID
- `folder` (optional): Folder name (default: "General")
- `createSummary` (optional): true/false (default: false)
- `generateQuiz` (optional): true/false (default: false)
- `quizQuestions` (optional): Number (default: 10)
- `quizDifficulty` (optional): "Easy"/"Medium"/"Hard" (default: "Medium")

**Example Request (using cURL):**
```bash
curl -X POST http://localhost:8017/hackathon/files \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/your/document.pdf" \
  -F "subject=507f1f77bcf86cd799439011" \
  -F "folder=Calculus" \
  -F "createSummary=true" \
  -F "generateQuiz=true" \
  -F "quizQuestions=15" \
  -F "quizDifficulty=Medium"
```

**Example Request (using JavaScript Fetch):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('subject', '507f1f77bcf86cd799439011');
formData.append('folder', 'Calculus');
formData.append('createSummary', 'true');
formData.append('generateQuiz', 'true');
formData.append('quizQuestions', '15');
formData.append('quizDifficulty', 'Medium');

const response = await fetch('http://localhost:8017/hackathon/files', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken
  },
  body: formData
});

const data = await response.json();
```

**Response (201 Created):**
```json
{
  "code": 201,
  "message": "File uploaded successfully",
  "result": {
    "file": {
      "id": "file123",
      "name": "New Chapter.pdf",
      "subject": "Mathematics",
      "folder": "Calculus",
      "uploadDate": "2025-01-15",
      "size": "3.2 MB",
      "sizeBytes": 3355443,
      "mimeType": "application/pdf",
      "summaryCount": 0,
      "quizCount": 0,
      "url": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/hackathon-files/file.pdf",
      "metadata": {
        "language": "en"
      }
    },
    "processing": {
      "summary": {
        "status": "queued",
        "jobId": "job_sum_file123"
      },
      "quiz": {
        "status": "queued",
        "jobId": "job_quiz_file123",
        "questions": 15,
        "difficulty": "Medium"
      }
    }
  }
}
```

---

### 3. **GET /files/:fileId**
Lấy thông tin chi tiết của một file

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Request:**
```bash
GET http://localhost:8017/hackathon/files/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "Lấy thông tin file thành công",
  "result": {
    "id": "file123",
    "name": "Limits and Continuity.pdf",
    "subject": "Mathematics",
    "folder": "Calculus",
    "uploadDate": "2025-01-10",
    "size": "2.4 MB",
    "sizeBytes": 2516582,
    "mimeType": "application/pdf",
    "summaryCount": 2,
    "quizCount": 2,
    "url": "https://res.cloudinary.com/your-cloud/raw/upload/v1234567890/hackathon-files/file.pdf",
    "metadata": {
      "language": "en"
    }
  }
}
```

---

### 4. **DELETE /files/:fileId**
Xóa file (soft delete) và tất cả summaries/quizzes liên quan

**Headers:**
```
Authorization: Bearer <access_token>
```

**Example Request:**
```bash
DELETE http://localhost:8017/hackathon/files/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "code": 200,
  "message": "File deleted successfully",
  "result": null
}
```

---

## 🔐 Authentication

Tất cả endpoints đều yêu cầu JWT token trong header:
```
Authorization: Bearer <your_access_token>
```

Token được lấy từ endpoint `/hackathon/auth/login` (Google OAuth2).

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Loại file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, DOC"
}
```

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Bạn cần đăng nhập để truy cập"
}
```

### 403 Forbidden
```json
{
  "code": 403,
  "message": "Bạn không có quyền truy cập file này"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "File không tồn tại"
}
```

---

## 📊 Database Schema

### File Model
```typescript
{
  name: string              // Tên file gốc
  type: '.pdf' | '.docx' | 'doc'
  size: number              // Bytes
  cloudinaryUrl: string     // URL public
  cloudinaryPublicId: string // ID để xóa
  folder: string            // Folder phân loại
  mimeType: string          // MIME type
  subjectId: ObjectId       // Reference to Subject
  summary_content: string   // Nội dung summary (optional)
  summaryCount: number      // Số summaries
  quizCount: number         // Số quizzes
  uploadDate: Date          // Ngày upload
  status: 'ACTIVE' | 'DELETED'
  createdAt: Date
  updatedAt: Date
}
```

---

## 🧪 Testing với Postman/Thunder Client

### 1. **Test Upload File:**
```
POST http://localhost:8017/hackathon/files
Headers:
  Authorization: Bearer <your_token>
Body (form-data):
  file: [Select your PDF/DOCX file]
  subject: 507f1f77bcf86cd799439011
  folder: Test Folder
  createSummary: true
```

### 2. **Test Get Files:**
```
GET http://localhost:8017/hackathon/subjects/507f1f77bcf86cd799439011/files
Headers:
  Authorization: Bearer <your_token>
```

### 3. **Test Delete File:**
```
DELETE http://localhost:8017/hackathon/files/507f1f77bcf86cd799439011
Headers:
  Authorization: Bearer <your_token>
```

---

## 🔄 TODO: Xử lý Background Jobs

Hiện tại các flags `createSummary` và `generateQuiz` chỉ return status "queued". Bạn cần implement:

1. **RabbitMQ Integration**: Push jobs vào queue khi createSummary/generateQuiz = true
2. **Worker Service**: Service xử lý jobs từ queue để generate summary và quiz
3. **Update Counts**: Sau khi xử lý xong, update summaryCount và quizCount trong File model

---

## 📝 Notes

- File tối đa: **50MB**
- Supported formats: **PDF, DOCX, DOC**
- Files được lưu trên Cloudinary trong folder: `hackathon-files/`
- Soft delete: File không bị xóa vật lý, chỉ đánh dấu `status = 'DELETED'`
- Khi xóa file, tất cả quizzes liên quan cũng bị xóa

---

## 🐛 Troubleshooting

### Lỗi: "Loại file không được hỗ trợ"
- Kiểm tra extension file phải là `.pdf`, `.docx`, hoặc `.doc`

### Lỗi: "Subject không tồn tại"
- Đảm bảo Subject ID hợp lệ và thuộc về user hiện tại

### Lỗi Upload Cloudinary failed
- Kiểm tra cấu hình CLOUDINARY_* trong .env
- Đảm bảo có kết nối internet
- Kiểm tra quota Cloudinary account

---

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Server logs trong terminal
2. MongoDB connection
3. Cloudinary credentials
4. JWT token hợp lệ

Good luck! 🚀

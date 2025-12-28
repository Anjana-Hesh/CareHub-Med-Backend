# 🏥 CareHub Med - Backend API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Token-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**RESTful API for Healthcare Appointment Management System**

[Frontend Repository](https://github.com/Anjana-Hesh/CareHub-Med-Backend.git) • [API Documentation](#-api-endpoints) • [Report Bug](https://github.com/Anjana-Hesh/CareHub-Med-Backend/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Email Service](#-email-service)
- [File Upload](#-file-upload)
- [License](#-license)

---

## 🌟 Overview

The **CareHub Med Backend** is a robust RESTful API built with Node.js and Express.js that powers the CareHub Med healthcare appointment management platform. It handles authentication, appointment scheduling, email notifications, and file uploads with secure JWT token-based authentication.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT token-based authentication
- Refresh token mechanism
- Password encryption with bcrypt
- Role-based access control (Patient, Doctor, Admin)
- Protected routes with middleware

### 📧 Email Notifications
- SMTP email service integration
- Automated emails for:
  - Appointment confirmations
  - Appointment cancellations
  - Appointment completions
  - Password reset links
- Custom email templates

### 📁 File Management
- Cloudinary integration for image uploads
- Doctor profile image upload
- Patient profile image upload
- Secure file handling

### 📅 Appointment System
- Create, read, update, delete appointments
- Time slot management
- Appointment status tracking (pending, completed, cancelled)
- Real-time availability checking

### 👥 User Management
- User registration and login
- Profile management
- Password reset functionality
- Doctor and patient management

---

## 🚀 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing |
| **Nodemailer** | Email service (SMTP) |
| **Cloudinary** | Cloud image storage |
| **dotenv** | Environment variables |
| **cors** | Cross-origin resource sharing |
| **express-validator** | Input validation |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- SMTP email service (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Anjana-Hesh/CareHub-Med-Backend.git
cd CareHub-Med-Backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables))

4. **Start the server**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/carehub
# or MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/carehub

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=CareHub Med <noreply@carehubmed.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Admin Configuration
ADMIN_EMAIL=admin@carehubmed.com
ADMIN_PASSWORD=securepassword123
```

### 📧 Gmail SMTP Setup

1. Enable 2-Factor Authentication in your Google Account
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Use the generated password in `SMTP_PASSWORD`

---

## 📡 API Endpoints

### 🔐 Authentication Routes

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             User login
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/logout            User logout
POST   /api/auth/forgot-password   Request password reset
POST   /api/auth/reset-password    Reset password with token
```

### 👤 User Routes

```
GET    /api/users/profile          Get user profile (Protected)
PUT    /api/users/profile          Update user profile (Protected)
POST   /api/users/upload-image     Upload profile image (Protected)
```

### 👨‍⚕️ Doctor Routes

```
GET    /api/doctors                Get all doctors
GET    /api/doctors/:id            Get doctor by ID
POST   /api/doctors                Add new doctor (Admin only)
PUT    /api/doctors/:id            Update doctor (Admin/Doctor)
DELETE /api/doctors/:id            Delete doctor (Admin only)
GET    /api/doctors/speciality/:speciality   Get doctors by speciality
```

### 📅 Appointment Routes

```
POST   /api/appointments           Book appointment (User)
GET    /api/appointments           Get all appointments (Admin)
GET    /api/appointments/user      Get user appointments (User)
GET    /api/appointments/doctor    Get doctor appointments (Doctor)
PUT    /api/appointments/:id       Update appointment status
DELETE /api/appointments/:id       Cancel appointment
GET    /api/appointments/:id       Get appointment by ID
```

### 🔧 Admin Routes

```
GET    /api/admin/dashboard        Get admin dashboard stats
GET    /api/admin/appointments     Get all appointments
GET    /api/admin/doctors          Get all doctors
POST   /api/admin/doctors          Add new doctor
DELETE /api/admin/appointments/:id Cancel appointment
```

---

## 🏗️ Project Structure

```
CareHub-Med-Backend/
├── 📁 config/
│   ├── mongodb.ts                    # MongoDB connection
│   ├── cloudinary.ts            # Cloudinary configuration
│   └── emailConfig.ts                 # Email configuration
│
├── 📁 controllers/
│   ├── authController.ts        # Authentication logic
│   ├── userController.ts        # User operations
│   ├── doctorController.ts      # Doctor operations
│   └── adminController.ts       # Admin operations
│
├── 📁 middleware/
│   ├── authUser.ts                  # JWT verification
│   ├── authAdmin.ts             
│   ├── authDoctor.ts          
│   └── multer.ts                
│
├── 📁 models/
│   ├── UserModel.ts                  # User schema
│   ├── DoctorModel.ts                # Doctor schema
│   └── AppointmentModel.ts           # Appointment schema
│
├── 📁 routes/
│   ├── userRoutes.js            # User endpoints
│   ├── doctorRoutes.js          # Doctor endpoints
│   └── adminRoutes.js           # Admin endpoints
│
├── 📁 utils/
│   ├── token.ts
|
├──|-- index.ts
│
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── server.js                    # Entry point
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 🔐 Authentication

### JWT Token Flow

1. **Login** - User receives access token (15min) and refresh token (7days)
2. **Access Protected Routes** - Send access token in Authorization header
3. **Token Expires** - Frontend automatically refreshes using refresh token
4. **Refresh Token** - Get new access token without re-login
5. **Logout** - Invalidate refresh token

## 📧 Email Service

### SMTP Configuration

The email service uses **Nodemailer** with SMTP for sending automated emails.

### Email Templates

- **Appointment Confirmation** - Sent when appointment is booked
- **Appointment Cancellation** - Sent when appointment is cancelled
- **Appointment Completion** - Sent when appointment is marked complete
- **Password Reset** - Sent when user requests password reset

---

## 📁 File Upload (Cloudinary)

### Image Upload Flow

1. User selects image file
2. Backend receives multipart/form-data
3. File uploaded to Cloudinary
4. Cloudinary URL saved to database
5. Old image deleted from Cloudinary (if exists)

---

## 🛠️ Available Scripts

```bash
# Development with auto-reload
npm run dev

# Production
npm start

# Run tests (if configured)
npm test

# Seed database (if available)
npm run seed
```

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Refresh token rotation
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ Protected routes with middleware
- ✅ Role-based access control
- ✅ Environment variable security
- ✅ MongoDB injection prevention

---

## 👨‍💻 Author

**Anjana Heshan**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Anjana-Hesh)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anjana-heshan-79334b260/?originalSubdomain=lk)

---

## 🙏 Acknowledgments

- **Node.js** community
- **Express.js** framework
- **MongoDB** team
- **Cloudinary** for image hosting
- All open-source contributors

---

<div align="center">

**Made with ❤️ for CareHub Med**

[⬆ Back to Top](#-carehub-med---backend-api)

</div>
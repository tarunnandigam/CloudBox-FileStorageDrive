# CloudBox - Full Stack File Storage Application

A modern file storage application with Next.js frontend and Spring Boot backend.

## 🏗️ Architecture

```
CloudBox/
├── frontend/          # Next.js + React + TypeScript
│   ├── app/          # Next.js 14 App Router
│   ├── components/   # UI Components (shadcn/ui)
│   ├── lib/         # Utilities & API calls
│   └── public/      # Static assets
└── backend/          # Spring Boot + Maven + Java
    ├── src/         # Java source code
    └── pom.xml      # Maven configuration
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (for frontend)
- **Java 17+** (for backend)
- **Maven 3.6+** (for backend)

### 1. Start Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
Backend runs on: `http://localhost:8080`

### 2. Start Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

## 🔐 Authentication
- **Appwrite** - Handles user authentication with OTP
- **Login form** - Email + OTP verification
- **Sessions** - Managed by Appwrite

## 📁 File Management
- **Spring Boot** - Handles all file operations
- **Upload** - Drag & drop or click to upload
- **Download** - Direct file download
- **Delete** - Remove files with confirmation
- **Storage** - Files stored locally with metadata in H2 database

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Appwrite** - Authentication only

### Backend
- **Spring Boot 3** - Java framework
- **Maven** - Dependency management
- **H2 Database** - In-memory database
- **JPA/Hibernate** - ORM

## 📱 Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Drag & drop file upload
- ✅ Grid and list view modes
- ✅ File download and delete
- ✅ Real-time file operations
- ✅ OTP-based authentication
- ✅ Dark theme UI

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev     # Start development server
npm run build   # Build for production
npm run lint    # Run ESLint
```

### Backend Development
```bash
cd backend
mvn spring-boot:run    # Start development server
mvn clean install     # Build project
mvn test              # Run tests
```

## 📊 Database
- **H2 Console**: `http://localhost:8080/h2-console`
- **JDBC URL**: `jdbc:h2:mem:cloudbox`
- **Username**: `sa`
- **Password**: (empty)

## 🌐 API Endpoints
- `POST /api/files/upload` - Upload files
- `GET /api/files/list` - List user files
- `GET /api/files/download/{id}` - Download file
- `DELETE /api/files/{id}` - Delete file

## 📦 Deployment
- **Frontend**: Deploy to Vercel, Netlify, or any static host
- **Backend**: Deploy to Heroku, AWS, or any Java hosting service

---

**CloudBox** - Your files, anywhere, anytime! 🚀
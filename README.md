# CloudBox - S3-Based File Storage Application

A modern cloud file storage application with Next.js frontend and Spring Boot backend using AWS S3.

## 🏗️ Architecture

```
CloudBox/
├── frontend/          # Vite + React + JavaScript
│   ├── src/          # Source Code
│   ├── components/   # UI Components
│   └── public/      # Static assets
└── backend/          # Spring Boot + Maven + Java
    ├── config/      # AWS S3 configuration
    ├── controller/  # REST API endpoints
    ├── service/     # Business logic & S3 operations
    └── pom.xml      # Maven configuration
```

Commonds used

### 1. Start Backend (Spring Boot)
```bash
cd backend
mvn clean install
mvn clean package  # Create JAR file (or)
mvn clean package -DskipTests  # Create JAR file
java -jar target/cloudbox-backend-1.0.0.jar **to run the project through jar file** 
mvn clean spring-boot:run  # Start development server
```
Backend runs on: `http://localhost:8080`

### 2. Start Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev  # Start development server
```
Frontend runs on: `http://localhost:5173`

## 🔐 Authentication
- **Appwrite** - User authentication with OTP
- **Email + OTP** - Secure login verification
- **Session Management** - Persistent user sessions

## 📁 File Management
- **AWS S3 Storage** - All files stored in cloud
- **Folder Support** - Create and navigate folders
- **1GB Storage Limit** - Per user storage quota
- **Real-time Usage** - Live storage tracking
- **Drag & Drop Upload** - Intuitive file upload
- **Direct Download** - Fast file retrieval from S3

## 🛠️ Tech Stack

### Frontend
- **Vite** - Next Generation Frontend Tooling
- **React.js** - UI Library
- **JavaScript** - Core language
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Appwrite** - Authentication service

### Backend
- **Spring Boot 3** - Java web framework
- **Maven** - Dependency management
- **AWS S3 SDK** - Cloud storage integration
- **No Database** - S3-only storage approach

## 📱 Features
- ✅ **Cloud Storage** - Files stored in AWS S3
- ✅ **Folder Management** - Create, navigate, delete folders
- ✅ **Storage Quota** - 1GB limit per user
- ✅ **Real-time Tracking** - Live storage usage display
- ✅ **Responsive Design** - Mobile, tablet, desktop support
- ✅ **Drag & Drop** - Easy file upload interface
- ✅ **Grid/List Views** - Multiple file display modes
- ✅ **OTP Authentication** - Secure email-based login
- ✅ **Dark Theme** - Modern UI design


## 🌐 API Endpoints
- `POST /api/files/upload` - Upload files to S3
- `GET /api/files/list` - List user files and folders
- `GET /api/files/download` - Download file from S3
- `DELETE /api/files/file` - Delete file from S3
- `POST /api/files/folder` - Create new folder
- `DELETE /api/files/folder` - Delete folder and contents
- `GET /api/files/storage-usage` - Get user storage statistics
- `DELETE /api/files/clear-all` - Clear all user files

## ☁️ AWS S3 Setup

### 1. Create S3 Bucket
- Created a new S3 bucket in AWS Console
- Enable public read access if needed
- Noted the bucket name and region

### 2. Create IAM User
- Created IAM user with programmatic access
- Attach S3 permissions policy
- Save Access Key ID and Secret Access Key

### 3. Required IAM Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR_BUCKET_NAME",
                "arn:aws:s3:::YOUR_BUCKET_NAME/*"
            ]
        }
    ]
}

```
## 🔒 Security Features
- **OTP Authentication** - Email-based verification
- **AWS IAM** - Secure S3 access control
- **User Isolation** - Files separated by user ID
- **Storage Limits** - Prevent abuse with 1GB quota
- **CORS Protection** - Frontend-backend security

## 📊 Storage Management
- **1GB Limit** - Maximum storage per user
- **Real-time Tracking** - Live usage calculation
- **Upload Prevention** - Blocks files exceeding limit
- **Storage Bar** - Visual usage indicator
- **File Size Display** - Shows individual file sizes

---

**CloudBox** - Secure cloud storage with AWS S3! ☁️🚀
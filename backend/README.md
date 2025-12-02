# CloudBox Backend - Spring Boot

## Setup Instructions

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Running the Application

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
mvn clean install
```

3. Run the application:
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### API Endpoints

- `POST /api/files/upload` - Upload files
- `GET /api/files/list?userId={userId}` - List user files  
- `GET /api/files/download/{fileId}?userId={userId}` - Download file
- `DELETE /api/files/{fileId}?userId={userId}` - Delete file

### Database
- Uses H2 in-memory database for development
- Access H2 console: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:cloudbox`
- Username: `sa`
- Password: (empty)

### File Storage
- Files are stored in `uploads/` directory
- Metadata stored in H2 database
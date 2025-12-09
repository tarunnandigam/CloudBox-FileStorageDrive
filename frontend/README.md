# CloudBox Frontend

Next.js frontend for CloudBox file storage application.

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure
```
frontend/
├── app/                 # Next.js 14 App Router
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   ├── global/        # App-specific components
│   └── ui/            # shadcn/ui components
├── lib/               # Utilities
│   ├── api/          # API calls to Spring Boot
│   ├── auth/         # Appwrite authentication
│   └── utils.ts      # Helper functions
└── public/           # Static assets
```

## 🔧 Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 UI Components
Built with **shadcn/ui** and **Tailwind CSS**:
- Responsive design
- Dark theme
- Accessible components
- Custom file upload interface

## 🔐 Authentication
- **Appwrite** integration
- OTP-based login
- Session management
- User context provider
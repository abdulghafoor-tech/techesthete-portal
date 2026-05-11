# Techesthete Portal

A full-stack real-time team collaboration platform — similar to Slack — built with React, Node.js, TypeScript, PostgreSQL, and Socket.IO.

## Features

- **Real-time messaging** — Channel and direct messages powered by Socket.IO
- **Workspaces** — Create and manage workspaces with multiple channels
- **Direct Messages** — One-on-one conversations between workspace members
- **Threads** — Reply to messages in threaded conversations
- **File Attachments** — Upload and share files in messages
- **Reactions** — Emoji reactions on messages
- **Meetings** — Schedule meetings with calendar view and email/DM invitations
- **Gmail Integration** — Connect Gmail account to send/receive emails within the app
- **Email Verification** — Secure signup with email verification flow
- **Password Reset** — Forgot password with email reset link
- **User Profiles** — Profile pictures and user info
- **Online Presence** — Real-time online/offline status indicators
- **Notifications** — Browser and in-app notifications
- **Mention System** — @mention users in messages

## Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** + **Sequelize ORM**
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Nodemailer** for email sending
- **Google APIs** for Gmail OAuth integration
- **Multer** for file uploads

### Frontend
- **React 19** + **Vite**
- **Redux Toolkit** + **Redux Persist** for state management
- **React Router v7**
- **Socket.IO Client**
- **Tailwind CSS**
- **Lucide React** for icons
- **Axios** for HTTP requests

## Project Structure

```
├── te-portal-backend/       # Express + TypeScript API server
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth & authorization middleware
│   ├── migrations/          # Sequelize database migrations
│   ├── models/              # Sequelize models
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   ├── socket/          # Socket.IO event handlers
│   │   └── utils/           # Utilities (mailer, etc.)
│   └── uploads/             # User uploaded files
│
└── te-portal-frontend/      # React + Vite client app
    └── src/
        ├── api/             # API client functions
        ├── components/      # Reusable UI components
        ├── hooks/           # Custom React hooks
        ├── pages/           # Page components
        ├── redux/           # Redux store, slices
        ├── services/        # Socket & notification services
        └── utils/           # Constants and helpers
```

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/techesthete-portal.git
cd techesthete-portal
```

### 2. Set up the Backend

```bash
cd te-portal-backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Update `config/config.json` with your PostgreSQL credentials:

```json
{
  "development": {
    "username": "postgres",
    "password": "your_password",
    "database": "techesthete-portal",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

Create the database and run migrations:

```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

Start the backend:

```bash
npm run dev
```

The API will be running at `http://localhost:4000`

### 3. Set up the Frontend

```bash
cd te-portal-frontend
npm install
```

Copy the example env file:

```bash
cp .env.example .env
```

Start the frontend:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`

## Environment Variables

### Backend (`te-portal-backend/.env`)

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for JWT token signing |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |
| `PORT` | Server port (default: 4000) |
| `FRONTEND_URL` | Frontend URL for email links |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |
| `GMAIL_CLIENT_ID` | Google OAuth Client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth Client Secret |
| `GMAIL_REDIRECT_URI` | OAuth redirect URI |

### Frontend (`te-portal-frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Backend Socket.IO URL |

## Database Migrations

Run all migrations:
```bash
cd te-portal-backend
npx sequelize-cli db:migrate
```

Undo last migration:
```bash
npx sequelize-cli db:migrate:undo
```

## License

MIT

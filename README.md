# Baat-Chit - Language Exchange App

A real-time language learning platform connecting native and learning language speakers.

## Features
- 🔐 Passwordless Authentication (Google Login & Email OTP)
- 💬 Real-time messaging via Stream Chat
- 🔔 Live notifications for friend requests
- 👥 Friend management system
- 🌍 Language-based user matching
- 📊 Unread message indicators
- 📞 Video calling support
- 👥 Group chat functionality

## Tech Stack

### Frontend
- React + Vite
- TanStack Query
- Stream Chat React
- Tailwind CSS + DaisyUI
- Firebase Auth

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Stream Chat API
- Nodemailer (Email OTP)
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Stream Chat account
- Firebase project (for Google Auth)
- Gmail account (for Email OTP)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/Baat-Chit.git
cd Baat-Chit
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories for required environment variables.

#### Backend (.env)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET_KEY` - Secret for JWT tokens
- `STREAM_API_KEY` & `STREAM_API_SECRET` - Stream Chat credentials
- `FIREBASE_API_KEY` & `FIREBASE_PROJECT_ID` - Firebase config
- `EMAIL_USER` & `EMAIL_PASSWORD` - Gmail SMTP credentials

#### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_STREAM_API_KEY` - Stream Chat public key

## Deployment

See [deployment_guide.md](./deployment_guide.md) for detailed deployment instructions.

**Recommended stack (100% FREE)**:
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Project Structure

```
Baat-Chit/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── lib/            # Utilities
│   │   └── index.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # API & utilities
│   │   └── App.jsx         # Main app
│   └── package.json
└── README.md
```

## Features in Detail

### Authentication
- **Google Login**: One-click sign in with Google
- **Email OTP**: Passwordless login via email verification
- **JWT Sessions**: Secure token-based authentication

### Real-time Messaging
- Powered by Stream Chat
- Instant message delivery
- Typing indicators
- Read receipts
- Media sharing support

### Notifications
- Friend request notifications
- Friend acceptance notifications  
- Toast popups for instant feedback
- Badge counters on notification bell
- 10-second polling for real-time updates

### User Matching
- Match users by native/learning language
- Friend recommendations
- Profile management
- Block/unblock users

## Development

```bash
# Backend
cd backend
npm run dev  # Runs on port 5001

# Frontend
cd frontend
npm run dev  # Runs on port 5173
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

Your Name - your.email@example.com

Project Link: [https://github.com/yourusername/Baat-Chit](https://github.com/yourusername/Baat-Chit)

## Acknowledgments

- [Stream Chat](https://getstream.io/) - Real-time messaging
- [Firebase](https://firebase.google.com/) - Authentication
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Database
- [DaisyUI](https://daisyui.com/) - Tailwind components
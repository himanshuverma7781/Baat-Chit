import express from 'express';
import "dotenv/config";
import cookieParser from 'cookie-parser';
import cors from 'cors';
//import path from 'path';


import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import chatRoutes from './routes/chat.route.js';
import groupRoutes from './routes/group.route.js';
import blockRoutes from './routes/block.route.js';

import { connectDB } from './lib/db.js';



const app = express();
const PORT = process.env.PORT;

//const __dirname = path.resolve();



app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

console.log("About to register group routes:", typeof groupRoutes);
app.use("/api/groups", groupRoutes);
console.log("Group routes registered");

app.use("/api/block", blockRoutes);

console.log("All routes registered successfully");

app.get('/', (req, res) => {
  res.send({
    activeStatus: true,
    error: false,
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/dist')));

//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// } 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
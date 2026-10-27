import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import skillRoutes from './routes/skillRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Database connection logic for both Local and Cloud
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
};

// Har request aane par DB connection ensure karein
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Test route
app.get('/', (req, res) => {
  res.send('Digital Labour Marketplace API is Running Live!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/worker', workerRoutes);
app.use('/worker', workerRoutes);

app.use('/api/skills', skillRoutes);
app.use('/skills', skillRoutes);

app.use('/api/evidence', evidenceRoutes);
app.use('/evidence', evidenceRoutes);

// Agar laptop par chal raha ho to port listen karein, Vercel par auto-handle hoga
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server active on http://localhost:${PORT}`);
  });
}

export default app;
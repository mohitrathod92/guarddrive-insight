import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { driversRouter } from './routes/drivers.js';
import { incidentsRouter } from './routes/incidents.js';
import { fleetRouter } from './routes/fleet.js';
import { analyticsRouter } from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:8080' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/drivers', driversRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/fleet', fleetRouter);
app.use('/api/analytics', analyticsRouter);

// Start
app.listen(PORT, () => {
  console.log(`🚀 GuardDrive API running at http://localhost:${PORT}`);
});

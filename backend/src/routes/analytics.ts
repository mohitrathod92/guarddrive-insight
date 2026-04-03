import { Router } from 'express';
import prisma from '../lib/prisma.js';

export const analyticsRouter = Router();

// GET global analytics
analyticsRouter.get('/', async (_req, res) => {
  try {
    const totalDrivers = await prisma.driver.count();
    const activeIncidents = await prisma.incident.count({
      where: {
        timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }
    });
    
    const drivers = await prisma.driver.findMany({ select: { fatigueScore: true } });
    const avgFatigue = drivers.length > 0 
      ? drivers.reduce((acc, d) => acc + d.fatigueScore, 0) / drivers.length 
      : 100;

    res.json({
      totalDrivers,
      activeIncidents,
      averageFatigueScore: Math.round(avgFatigue),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

import { Router } from 'express';
import prisma from '../lib/prisma.js';

export const driversRouter = Router();

// GET all drivers
driversRouter.get('/', async (_req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: { incidents: { take: 5, orderBy: { timestamp: 'desc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET single driver
driversRouter.get('/:id', async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        incidents: { orderBy: { timestamp: 'desc' }, take: 20 },
        speedLogs: { orderBy: { timestamp: 'desc' }, take: 100 },
      },
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// PATCH update driver status/speed/location
driversRouter.patch('/:id', async (req, res) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(driver);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

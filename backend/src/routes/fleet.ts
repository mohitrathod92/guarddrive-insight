import { Router } from 'express';
import prisma from '../lib/prisma.js';

export const fleetRouter = Router();

// GET all fleet vehicles
fleetRouter.get('/', async (_req, res) => {
  try {
    const vehicles = await prisma.fleetVehicle.findMany({
      orderBy: { routeName: 'asc' },
    });
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fleet vehicles' });
  }
});

// POST register new vehicle
fleetRouter.post('/', async (req, res) => {
  try {
    const newVehicle = await prisma.fleetVehicle.create({
      data: req.body,
    });
    res.status(201).json(newVehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register fleet vehicle' });
  }
});

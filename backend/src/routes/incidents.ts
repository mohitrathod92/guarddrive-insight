import { Router } from 'express';
import prisma from '../lib/prisma.js';

export const incidentsRouter = Router();

// GET all incidents
incidentsRouter.get('/', async (_req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      include: { driver: { select: { name: true, routeNum: true } } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    res.json(incidents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// POST new incident
incidentsRouter.post('/', async (req, res) => {
  try {
    const newIncident = await prisma.incident.create({
      data: req.body,
    });
    
    // Update driver fatigue score
    if (req.body.driverId) {
       const driver = await prisma.driver.findUnique({ where: { id: req.body.driverId }});
       if (driver) {
           const penalty = req.body.severity === 'High' ? 10 : req.body.severity === 'Medium' ? 5 : 2;
           await prisma.driver.update({
               where: { id: driver.id },
               data: { fatigueScore: Math.max(0, driver.fatigueScore - penalty) }
           });
       }
    }

    res.status(201).json(newIncident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

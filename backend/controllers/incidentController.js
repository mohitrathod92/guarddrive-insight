const prisma = require('../config/db');

exports.addIncident = async (req, res) => {
  try {
    const { sessionId, type, severity, time } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.driverId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const incident = await prisma.incident.create({
      data: {
        sessionId,
        type,
        severity: severity || 'High',
        time: time ? new Date(time) : new Date()
      }
    });

    res.json(incident);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSessionIncidents = async (req, res) => {
  try {
    // First verify session ownership
    const session = await prisma.session.findUnique({
      where: { id: req.params.id }
    });

    if (session && session.driverId !== req.user.id) {
       return res.status(401).json({ msg: 'Not authorized' });
    }

    const incidents = await prisma.incident.findMany({
      where: { sessionId: req.params.id },
      orderBy: { time: 'asc' }
    });
    
    res.json(incidents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

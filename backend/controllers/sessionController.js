const prisma = require('../config/db');

exports.startSession = async (req, res) => {
  try {
    const session = await prisma.session.create({
      data: {
        driverId: req.user.id,
      }
    });
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    let session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.driverId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    session = await prisma.session.update({
      where: { id: sessionId },
      data: { endTime: new Date() }
    });
    // Add duration into response if needed based on Date logic
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { driverId: req.user.id },
      orderBy: { startTime: 'desc' }
    });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

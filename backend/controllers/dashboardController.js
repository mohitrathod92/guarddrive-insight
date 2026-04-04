const prisma = require('../config/db');

exports.getSummary = async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { driverId: req.user.id },
      include: {
        incidents: true
      }
    });

    let totalBlinks = 0;
    let totalDrowsiness = 0;
    
    sessions.forEach(session => {
        session.incidents.forEach(inc => {
            if (inc.type === 'Blink') totalBlinks++;
            if (inc.type === 'Drowsiness') totalDrowsiness++;
        });
    });

    res.json({
      totalSessions: sessions.length,
      totalBlinks,
      totalDrowsiness,
      averageEAR: "0.00" // We decoupled EAR in schema for simplicity 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

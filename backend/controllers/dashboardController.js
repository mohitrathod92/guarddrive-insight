const Incident = require('../models/Incident');
const Session = require('../models/Session');

exports.getSummary = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id });
    const sessionIds = sessions.map(session => session._id);

    const incidents = await Incident.find({ sessionId: { $in: sessionIds } });

    const totalBlinks = incidents.filter(inc => inc.type === 'Blink').length;
    const totalDrowsiness = incidents.filter(inc => inc.type === 'Drowsiness').length;
    
    // Calculate average EAR for all incidents (optional context metric)
    const averageEAR = incidents.length > 0 
      ? incidents.reduce((acc, curr) => acc + curr.ear, 0) / incidents.length 
      : 0;

    res.json({
      totalSessions: sessions.length,
      totalBlinks,
      totalDrowsiness,
      averageEAR: averageEAR.toFixed(3)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

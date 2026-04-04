const Incident = require('../models/Incident');
const Session = require('../models/Session');

exports.addIncident = async (req, res) => {
  try {
    const { sessionId, type, ear, frames, timestamp } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const incident = new Incident({
      userId: req.user.id,
      sessionId,
      type,
      ear,
      frames,
      timestamp: timestamp || Date.now()
    });

    await incident.save();
    res.json(incident);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getSessionIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ sessionId: req.params.id }).sort({ timestamp: 1 });
    
    // Check if incidents exist
    if (incidents.length > 0 && incidents[0].userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(incidents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

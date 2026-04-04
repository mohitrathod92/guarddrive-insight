const Session = require('../models/Session');

exports.startSession = async (req, res) => {
  try {
    const session = new Session({
      userId: req.user.id,
      startTime: Date.now(),
    });

    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    let session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    session.endTime = Date.now();
    session.duration = Math.floor((session.endTime - session.startTime) / 1000); // in seconds

    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

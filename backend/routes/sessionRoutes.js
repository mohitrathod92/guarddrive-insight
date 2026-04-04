const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const auth = require('../middlewares/authMiddleware');

router.post('/start', auth, sessionController.startSession);
router.post('/end', auth, sessionController.endSession);
router.get('/user-sessions', auth, sessionController.getUserSessions);

module.exports = router;

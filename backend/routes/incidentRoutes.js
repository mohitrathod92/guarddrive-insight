const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const auth = require('../middlewares/authMiddleware');

router.post('/add', auth, incidentController.addIncident);
router.get('/session/:id', auth, incidentController.getSessionIncidents);

module.exports = router;

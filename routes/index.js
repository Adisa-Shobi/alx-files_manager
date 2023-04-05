const express = require('express');
const AppController = require('../controllers/AppController');

const router = express.Router();

router.use((req, res, next) => {
  next();
});

router.get('/status', (req, res) => {
  AppController.getStatus(req, res);
});

router.get('/stats', (req, res) => {
  AppController.getStats(req, res);
});

module.exports = router;

const router = require('express').Router();
const apiRoutes = require('./api');
const config = require('config');
const { apiBaseUrl } = config.get('app');

router.use(apiBaseUrl, apiRoutes);
router.use(apiBaseUrl, (_req, res) => res.status(404).json('No API route found'));

module.exports = router;

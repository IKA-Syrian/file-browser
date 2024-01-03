const routes = require('express').Router();
const files = require('./files');
const auth = require('./auth');
routes.use('/files', files);
routes.use('/auth', auth);

module.exports = routes;
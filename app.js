const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const env = require('./config/env');

const app = express();

// Basic body parsing only
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', routes);
app.get('/health', (req, res) => res.json({ success: true, message: 'সার্ভার চালু আছে' }));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

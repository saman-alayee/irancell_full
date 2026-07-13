const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const config = require('./config');

const app = express();

app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

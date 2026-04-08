const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const routes = require('./routes');
const { apiLimiter } = require('./middlewares/rateLimiters');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');
const env = require('./config/env');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [env.CLIENT_BASE_URL, env.ADMIN_BASE_URL].filter((url) => url && url !== '*');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(compression());
app.use(hpp());
app.use(cookieParser());
app.use(mongoSanitize());
if (env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', apiLimiter, routes);
app.get('/health', (req, res) => res.json({ success: true, message: 'সার্ভার চালু আছে' }));
app.use(notFound);
app.use(errorHandler);

module.exports = app;

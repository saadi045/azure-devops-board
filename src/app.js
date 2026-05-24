/**
 * Express app factory.
 *
 * This file creates and configures the Express app but does NOT start
 * listening on a port. server.js handles the listen() call.
 *
 * Splitting it this way lets tests import the app directly without
 * binding to a port.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const requestId = require('./middleware/requestId');
const healthRoutes = require('./routes/health');
const tasksRoutes = require('./routes/tasks');
const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/auth');

function createApp() {
  const app = express();
  const NODE_ENV = process.env.NODE_ENV || 'development';

  app.set('trust proxy', true);

  const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID']
  };
  app.use(cors(corsOptions));

  app.use(express.json({ limit: '100kb' }));
  app.use(requestId);

  // Request logging — silenced during tests to keep test output clean
  if (NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'info',
          requestId: req.id,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: duration,
          userAgent: req.headers['user-agent']
        }));
      });
      next();
    });
  }

  app.use('/health', healthRoutes);
  app.use('/api/v1/tasks', requireAuth, tasksRoutes);
  app.use('/api/v1/auth', authRoutes);

  app.get('/', (req, res) => {
    res.json({
      name: 'Task Management API',
      version: '0.2.0',
      docs: 'https://github.com/saadi045/task-api',
      requestId: req.id
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} does not exist`,
      requestId: req.id
    });
  });

  // Error handler — Express requires 4 parameters to recognize this as
  // an error handler. The underscore on _next tells ESLint we know it's unused.
  app.use((err, req, res, _next) => {
    if (NODE_ENV !== 'test') {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        requestId: req.id,
        error: err.message,
        stack: NODE_ENV === 'production' ? undefined : err.stack
      }));
    }
    res.status(500).json({
      error: 'Internal Server Error',
      message: NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      requestId: req.id
    });
  });

  return app;
}

module.exports = createApp;
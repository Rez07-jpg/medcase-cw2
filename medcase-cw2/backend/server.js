// ============================================================
// MedCase – Azure App Service Backend
// COM682 Cloud Native Development | MD Rezaul Hoque | 10406063
// ============================================================

// Application Insights must be set up FIRST before other imports
const appInsights = require('applicationinsights');
if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
  appInsights
    .setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .start();
  console.log('[AppInsights] Telemetry active');
}

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const casesRouter = require('./routes/cases');
const mediaRouter = require('./routes/media');
const internalRouter = require('./routes/internal');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: '*' }));          // tighten in production
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedCase API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/api/cases',    casesRouter);
app.use('/api/media',    mediaRouter);
app.use('/api/internal', internalRouter);   // Logic Apps webhook target

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[MedCase API] Listening on port ${PORT}`);
  console.log(`[MedCase API] Health: http://localhost:${PORT}/health`);
});

module.exports = app;

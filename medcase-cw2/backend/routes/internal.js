// routes/internal.js – Internal endpoints called by Logic Apps
// POST /api/internal/thumbnail – Called by Logic App on blob creation

const express = require('express');
const router = express.Router();

// ── POST /api/internal/thumbnail ──────────────────────────────
// Called by Azure Logic App when a blob is created in medical-media
router.post('/thumbnail', async (req, res) => {
  const { blobName, blobUrl } = req.body;

  console.log(`[Logic Apps Trigger] New blob received: ${blobName}`);
  console.log(`[Logic Apps Trigger] URL: ${blobUrl}`);

  // In production: generate a thumbnail using Azure Cognitive Services
  // or an Azure Function. Here we log and acknowledge the trigger.
  // This endpoint proves Logic Apps → App Service integration is working.

  res.json({
    message:   'Thumbnail job received',
    blobName,
    blobUrl,
    status:    'queued',
    timestamp: new Date().toISOString()
  });
});

// ── GET /api/internal/status – Logic Apps can poll this ───────
router.get('/status', (req, res) => {
  res.json({
    service:   'MedCase Internal API',
    status:    'running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

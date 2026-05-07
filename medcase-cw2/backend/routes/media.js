// routes/media.js – Media upload and retrieval
// POST /api/media/upload   – Upload file to Blob Storage
// GET  /api/media/:caseId  – Get media URLs for a case

const express = require('express');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
const { getContainerClient } = require('../config/storage');
const { getContainer }       = require('../config/cosmos');

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB limit

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/dicom', 'application/octet-stream'];
const MEDIA_CONTAINER = 'medical-media';

// ── POST /api/media/upload ─────────────────────────────────────
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Use form-data with key "file"' });
    }

    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ error: 'caseId is required in request body' });
    }

    const ext      = req.file.originalname.split('.').pop();
    const blobName = `${caseId}/${uuidv4()}.${ext}`;

    const containerClient = await getContainerClient(MEDIA_CONTAINER);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(req.file.buffer, req.file.size, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    const blobUrl = blockBlobClient.url;

    // Update the case in Cosmos DB with the new media URL
    const cosmosContainer = await getContainer();
    const querySpec = {
      query:      'SELECT * FROM c WHERE c.id = @id AND c._type = "case"',
      parameters: [{ name: '@id', value: caseId }]
    };
    const { resources } = await cosmosContainer.items
      .query(querySpec, { enableCrossPartitionQuery: true })
      .fetchAll();

    if (resources.length) {
      const caseDoc = resources[0];
      caseDoc.mediaUrls = [...(caseDoc.mediaUrls || []), blobUrl];
      await cosmosContainer.items.upsert(caseDoc);
    }

    res.status(201).json({
      message:   'File uploaded successfully',
      blobName,
      blobUrl,
      mediaType: req.file.mimetype,
      size:      req.file.size
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/media/:caseId – Get all media for a case ──────────
router.get('/:caseId', async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const containerClient = await getContainerClient(MEDIA_CONTAINER);

    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat({ prefix: `${caseId}/` })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      blobs.push({
        name:         blob.name,
        url:          blobClient.url,
        contentType:  blob.properties.contentType,
        size:         blob.properties.contentLength,
        lastModified: blob.properties.lastModified
      });
    }

    res.json({ caseId, count: blobs.length, media: blobs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

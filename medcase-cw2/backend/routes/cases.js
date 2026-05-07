// routes/cases.js – Full CRUD for medical cases
// POST   /api/cases            – Create case
// GET    /api/cases            – List cases (with optional specialty filter)
// GET    /api/cases/:caseId    – Get single case
// PUT    /api/cases/:caseId    – Update case
// DELETE /api/cases/:caseId    – Delete case

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getContainer } = require('../config/cosmos');

const router = express.Router();

// ── POST /api/cases – Create a new medical case ───────────────
router.post('/', async (req, res, next) => {
  try {
    const { title, description, specialty, diagnosis, uploaderId, tags } = req.body;

    if (!title || !specialty || !uploaderId) {
      return res.status(400).json({ error: 'title, specialty, and uploaderId are required' });
    }

    const newCase = {
      id:           uuidv4(),
      title,
      description:  description || '',
      specialty,                         // partition key
      diagnosis:    diagnosis || '',
      uploaderId,
      uploadDate:   new Date().toISOString(),
      tags:         tags || [],
      mediaUrls:    [],
      isAnonymised: true,
      _type:        'case'
    };

    const container = await getContainer();
    const { resource } = await container.items.create(newCase);

    res.status(201).json({ message: 'Case created', case: resource });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/cases – List all cases (optional ?specialty=) ─────
router.get('/', async (req, res, next) => {
  try {
    const { specialty, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let querySpec;
    if (specialty) {
      querySpec = {
        query:      'SELECT * FROM c WHERE c.specialty = @specialty AND c._type = "case" OFFSET @offset LIMIT @limit',
        parameters: [
          { name: '@specialty', value: specialty },
          { name: '@offset',    value: offset },
          { name: '@limit',     value: parseInt(limit) }
        ]
      };
    } else {
      querySpec = {
        query:      'SELECT * FROM c WHERE c._type = "case" OFFSET @offset LIMIT @limit',
        parameters: [
          { name: '@offset', value: offset },
          { name: '@limit',  value: parseInt(limit) }
        ]
      };
    }

    const container = await getContainer();
    const { resources } = await container.items.query(querySpec).fetchAll();

    res.json({ count: resources.length, page: parseInt(page), cases: resources });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/cases/:caseId – Get a single case ─────────────────
router.get('/:caseId', async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const container = await getContainer();

    // Query without partition key (cross-partition) for simplicity
    const querySpec = {
      query:      'SELECT * FROM c WHERE c.id = @id AND c._type = "case"',
      parameters: [{ name: '@id', value: caseId }]
    };
    const { resources } = await container.items.query(querySpec, { enableCrossPartitionQuery: true }).fetchAll();

    if (!resources.length) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ case: resources[0] });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/cases/:caseId – Update a case ─────────────────────
router.put('/:caseId', async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const updates    = req.body;
    const container  = await getContainer();

    // Fetch existing
    const querySpec = {
      query:      'SELECT * FROM c WHERE c.id = @id AND c._type = "case"',
      parameters: [{ name: '@id', value: caseId }]
    };
    const { resources } = await container.items.query(querySpec, { enableCrossPartitionQuery: true }).fetchAll();

    if (!resources.length) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const existing = resources[0];

    // Merge updates (disallow changing id, _type, specialty partition key)
    const { id, _type, specialty, ...allowedUpdates } = updates;
    const updated = { ...existing, ...allowedUpdates, updatedAt: new Date().toISOString() };

    const { resource } = await container.items.upsert(updated);
    res.json({ message: 'Case updated', case: resource });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/cases/:caseId – Delete a case ──────────────────
router.delete('/:caseId', async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const container  = await getContainer();

    // Need partition key to delete – fetch first
    const querySpec = {
      query:      'SELECT * FROM c WHERE c.id = @id AND c._type = "case"',
      parameters: [{ name: '@id', value: caseId }]
    };
    const { resources } = await container.items.query(querySpec, { enableCrossPartitionQuery: true }).fetchAll();

    if (!resources.length) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const existing  = resources[0];
    const itemToDelete = container.item(caseId, existing.specialty);
    await itemToDelete.delete();

    res.json({ message: 'Case deleted', caseId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

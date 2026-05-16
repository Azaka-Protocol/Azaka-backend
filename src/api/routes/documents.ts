import { Router, type Router as ExpressRouter } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import prisma from '../../db/client';
import { uploadDocument, getDocumentUrl } from '../../ipfs';
import { requireApiKey } from '../middleware/auth';
import { ApiResponse, DocumentUploadResponse } from '../../types';
import { logger } from '../../utils/logger';

const router: ExpressRouter = Router();

// Configure multer for file uploads (20MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'));
    }
  },
});

// POST /documents/upload - Upload document to IPFS
router.post('/upload', requireApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    const { tradeId, docType } = req.body;

    if (!tradeId || !docType) {
      res.status(400).json({
        success: false,
        error: 'Missing tradeId or docType',
      });
      return;
    }

    // Compute SHA-256 hash
    const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    // Upload to IPFS via Pinata
    const cid = await uploadDocument(req.file.buffer, req.file.originalname, {
      name: `${tradeId}-${docType}`,
      keyvalues: {
        tradeId,
        docType,
        hash,
      },
    });

    const url = getDocumentUrl(cid);

    logger.info({ tradeId, docType, cid, hash }, 'Document uploaded');

    const response: ApiResponse<DocumentUploadResponse> = {
      success: true,
      data: {
        cid,
        hash,
        url,
      },
    };

    res.json(response);
  } catch (error) {
    logger.error({ error }, 'Failed to upload document');
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
    });
  }
});

// GET /documents/:tradeId - Get all documents for a trade
router.get('/:tradeId', async (req, res) => {
  try {
    const { tradeId } = req.params;

    const documents = await prisma.document.findMany({
      where: { tradeId },
      orderBy: { submittedAt: 'desc' },
    });

    // Add IPFS URLs
    const documentsWithUrls = documents.map((doc) => ({
      ...doc,
      url: doc.ipfsCid ? getDocumentUrl(doc.ipfsCid) : null,
    }));

    const response: ApiResponse = {
      success: true,
      data: documentsWithUrls,
    };

    res.json(response);
  } catch (error) {
    logger.error({ error, tradeId: req.params.tradeId }, 'Failed to fetch documents');
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents',
    });
  }
});

export default router;

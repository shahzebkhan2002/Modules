import express from 'express';
import multer from 'multer';
import {
  uploadEvidence,
  getEvidenceBySkill,
  getWorkerEvidence,
  deleteEvidence,
  getAllEvidenceForAdmin,
  reviewEvidence,
  getEvidenceFile,
} from '../controllers/evidenceController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure memory storage for multer file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Worker routes
router.post('/upload/:skillId', protect, authorizeRoles('worker'), upload.single('file'), uploadEvidence);
router.get('/skill/:skillId', protect, authorizeRoles('worker', 'admin'), getEvidenceBySkill);
router.get('/worker', protect, authorizeRoles('worker'), getWorkerEvidence);
router.delete('/:id', protect, authorizeRoles('worker'), deleteEvidence);

// Admin routes
router.get('/admin/all', protect, authorizeRoles('admin'), getAllEvidenceForAdmin);
router.put('/admin/review/:id', protect, authorizeRoles('admin'), reviewEvidence);

// Authenticated file viewing/downloading
router.get('/file/:id', protect, getEvidenceFile);

export default router;

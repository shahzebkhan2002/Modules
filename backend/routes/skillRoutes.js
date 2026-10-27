import express from 'express';
import {
  getWorkerSkills,
  addWorkerSkill,
  updateWorkerSkill,
  deleteWorkerSkill,
  extractSkills,
  batchConfirmSkills,
  getCatalog,
} from '../controllers/skillController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / Authenticated catalog route
router.get('/catalog', protect, getCatalog);

// AI Skill Extraction (Worker or Admin)
router.post('/extract-ai', protect, extractSkills);

// Worker structured skill management
router.get('/', protect, authorizeRoles('worker'), getWorkerSkills);
router.post('/', protect, authorizeRoles('worker'), addWorkerSkill);
router.put('/:id', protect, authorizeRoles('worker'), updateWorkerSkill);
router.delete('/:id', protect, authorizeRoles('worker'), deleteWorkerSkill);
router.post('/batch-confirm', protect, authorizeRoles('worker'), batchConfirmSkills);

export default router;

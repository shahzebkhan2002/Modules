import mongoose from 'mongoose';
import SkillEvidence from '../models/SkillEvidence.js';
import WorkerSkill from '../models/WorkerSkill.js';
import WorkerProfile from '../models/WorkerProfile.js';

// Helper: Ensure WorkerProfile exists
const getOrCreateWorkerProfile = async (user) => {
  let profile = await WorkerProfile.findOne({ user: user._id });
  if (!profile) {
    profile = await WorkerProfile.create({
      user: user._id,
      occupation: 'General Technician',
      category: 'Home Maintenance',
      skills: [],
      experienceYears: 1,
      city: 'Islamabad',
      availability: 'Available',
      verificationStatus: 'Pending',
      profileCompletion: 25,
    });
  }
  return profile;
};

// 1. POST /api/evidence/upload/:skillId (Worker uploads evidence for a skill)
export const uploadEvidence = async (req, res) => {
  try {
    const { skillId } = req.params;
    const {
      evidenceType,
      title,
      issuer,
      certificateNumber,
      description,
      fileBase64,
      fileName,
      fileMimeType,
      fileSize,
    } = req.body;

    if (!evidenceType) {
      return res.status(400).json({ message: 'Evidence type is required.' });
    }

    const profile = await getOrCreateWorkerProfile(req.user);

    const skill = await WorkerSkill.findOne({ _id: skillId, workerProfileId: profile._id });
    if (!skill) {
      return res.status(404).json({ message: 'Associated skill record not found.' });
    }

    // Determine file reference and content
    let finalFileName = fileName || 'evidence_document';
    let finalMimeType = fileMimeType || 'application/pdf';
    let finalSize = Number(fileSize) || 0;
    let finalBase64 = fileBase64 || null;

    // Check if multer uploaded a file to memory / disk
    if (req.file) {
      finalFileName = req.file.originalname;
      finalMimeType = req.file.mimetype;
      finalSize = req.file.size;
      finalBase64 = req.file.buffer ? req.file.buffer.toString('base64') : null;
    }

    // File validation: Size limit 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (finalSize > maxSizeBytes) {
      return res.status(400).json({ message: 'File size exceeds maximum allowed limit (10MB).' });
    }

    // Allowed mime types: images and pdf
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (finalMimeType && !allowedMime.includes(finalMimeType.toLowerCase())) {
      return res.status(400).json({
        message: 'Invalid file format. Please upload a PDF document or image (JPG, PNG, WEBP).',
      });
    }

    const fileRef = `EVID-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const evidence = await SkillEvidence.create({
      workerProfileId: profile._id,
      workerSkillId: skill._id,
      evidenceType,
      title: title || `${skill.skillName} Proof`,
      fileReference: fileRef,
      fileName: finalFileName,
      fileMimeType: finalMimeType,
      fileSize: finalSize,
      fileBase64: finalBase64,
      issuer: issuer ? issuer.trim() : '',
      certificateNumber: certificateNumber ? certificateNumber.trim() : '',
      description: description ? description.trim() : '',
      status: 'Pending',
    });

    // Update skill status to Pending if it's currently Unverified
    if (skill.verificationStatus === 'Unverified') {
      skill.verificationStatus = 'Pending';
      await skill.save();
    }

    res.status(201).json({
      message: 'Evidence submitted successfully! It is now in queue for admin review.',
      evidence,
      skillStatus: skill.verificationStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. GET /api/evidence/skill/:skillId (Get evidence for a skill)
export const getEvidenceBySkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const evidenceList = await SkillEvidence.find({ workerSkillId: skillId })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(evidenceList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. GET /api/evidence/worker (Worker views all their submitted evidence)
export const getWorkerEvidence = async (req, res) => {
  try {
    const profile = await getOrCreateWorkerProfile(req.user);

    const evidenceList = await SkillEvidence.find({ workerProfileId: profile._id })
      .populate('workerSkillId', 'skillName category verificationStatus')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(evidenceList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. DELETE /api/evidence/:id (Worker deletes pending evidence)
export const deleteEvidence = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    const evidence = await SkillEvidence.findOne({
      _id: req.params.id,
      workerProfileId: profile._id,
    });

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence record not found.' });
    }

    const skillId = evidence.workerSkillId;
    await evidence.deleteOne();

    // Re-evaluate skill verification status
    const remainingApproved = await SkillEvidence.countDocuments({
      workerSkillId: skillId,
      status: 'Approved',
    });
    const remainingPending = await SkillEvidence.countDocuments({
      workerSkillId: skillId,
      status: 'Pending',
    });

    const skill = await WorkerSkill.findById(skillId);
    if (skill) {
      if (remainingApproved > 0) {
        skill.verificationStatus = 'Verified';
      } else if (remainingPending > 0) {
        skill.verificationStatus = 'Pending';
      } else {
        skill.verificationStatus = 'Unverified';
      }
      await skill.save();
    }

    res.json({ message: 'Evidence record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. GET /api/evidence/admin/all (Admin gets all evidence submissions across workers)
export const getAllEvidenceForAdmin = async (req, res) => {
  try {
    const { status, skillId } = req.query;
    const filter = {};
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (skillId) {
      filter.workerSkillId = skillId;
    }

    const evidenceList = await SkillEvidence.find(filter)
      .populate({
        path: 'workerProfileId',
        select: 'workerIdCode occupation city cnicNumber user',
        populate: {
          path: 'user',
          select: 'name email phone',
        },
      })
      .populate('workerSkillId', 'skillName category claimedExperienceYears verificationStatus')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(evidenceList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. PUT /api/evidence/admin/review/:id (Admin approves/rejects evidence)
export const reviewEvidence = async (req, res) => {
  try {
    const { status, reviewNotes, verificationMethod } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be either 'Approved' or 'Rejected'." });
    }

    if (status === 'Rejected' && (!reviewNotes || !reviewNotes.trim())) {
      return res.status(400).json({ message: 'Please provide review notes explaining why this evidence was rejected.' });
    }

    const evidence = await SkillEvidence.findById(req.params.id)
      .populate('workerProfileId')
      .populate('workerSkillId');

    if (!evidence) {
      return res.status(404).json({ message: 'Evidence record not found.' });
    }

    evidence.status = status;
    evidence.reviewedBy = req.user._id;
    evidence.reviewedAt = new Date();
    evidence.reviewNotes = (reviewNotes || '').trim();
    if (verificationMethod) {
      evidence.verificationMethod = verificationMethod;
    }
    await evidence.save();

    // Update the corresponding individual skill
    const skill = await WorkerSkill.findById(evidence.workerSkillId._id || evidence.workerSkillId);
    if (skill) {
      if (status === 'Approved') {
        skill.verificationStatus = 'Verified';
        skill.lastVerifiedAt = new Date();
        await skill.save();
      } else {
        // If rejected, check if there are other approved evidences for THIS skill
        const approvedRemaining = await SkillEvidence.countDocuments({
          workerSkillId: skill._id,
          _id: { $ne: evidence._id },
          status: 'Approved',
        });
        const pendingRemaining = await SkillEvidence.countDocuments({
          workerSkillId: skill._id,
          _id: { $ne: evidence._id },
          status: 'Pending',
        });

        if (approvedRemaining > 0) {
          skill.verificationStatus = 'Verified';
        } else if (pendingRemaining > 0) {
          skill.verificationStatus = 'Pending';
        } else {
          skill.verificationStatus = 'Unverified';
        }
        await skill.save();
      }
    }

    res.json({
      message: `Evidence has been ${status.toLowerCase()} successfully.`,
      evidence,
      updatedSkillStatus: skill ? skill.verificationStatus : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. GET /api/evidence/file/:id (Secure view/download of evidence document)
export const getEvidenceFile = async (req, res) => {
  try {
    const evidence = await SkillEvidence.findById(req.params.id).populate('workerProfileId');
    if (!evidence) {
      return res.status(404).json({ message: 'Evidence file not found.' });
    }

    // Authorization: User must be Admin OR the worker owner of this file
    const isOwner =
      req.user &&
      evidence.workerProfileId &&
      evidence.workerProfileId.user &&
      evidence.workerProfileId.user.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You are not authorized to view this document.' });
    }

    if (!evidence.fileBase64) {
      return res.status(404).json({ message: 'File contents not found.' });
    }

    const fileBuffer = Buffer.from(evidence.fileBase64, 'base64');
    res.setHeader('Content-Type', evidence.fileMimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${evidence.fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

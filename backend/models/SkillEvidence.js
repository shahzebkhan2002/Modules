import mongoose from 'mongoose';

const skillEvidenceSchema = new mongoose.Schema(
  {
    workerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: true,
      index: true,
    },
    workerSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerSkill',
      required: true,
      index: true,
    },
    evidenceType: {
      type: String,
      enum: ['Certificate', 'Work Photograph', 'Work Sample', 'Reference Letter', 'Other'],
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    fileReference: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: 'document',
    },
    fileMimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    // Optional inline storage fallback if GridFS is not configured or in lightweight environments
    fileBase64: {
      type: String,
      default: null,
    },
    issuer: {
      type: String,
      default: '',
      trim: true,
    },
    certificateNumber: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: '',
      trim: true,
    },
    verificationMethod: {
      type: String,
      enum: [
        'Document Inspection',
        'Institute Verification',
        'Portfolio Assessment',
        'Direct Reference Check',
        'Other',
      ],
      default: 'Document Inspection',
    },
  },
  { timestamps: true }
);

export default mongoose.model('SkillEvidence', skillEvidenceSchema);

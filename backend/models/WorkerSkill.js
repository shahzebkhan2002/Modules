import mongoose from 'mongoose';

const workerSkillSchema = new mongoose.Schema(
  {
    workerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: true,
      index: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    claimedExperienceYears: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 60,
    },
    source: {
      type: String,
      enum: ['manual', 'ai_suggested'],
      default: 'manual',
    },
    verificationStatus: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified'],
      default: 'Unverified',
      index: true,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of skill per worker
workerSkillSchema.index({ workerProfileId: 1, skillName: 1 }, { unique: true });

export default mongoose.model('WorkerSkill', workerSkillSchema);

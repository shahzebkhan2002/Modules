import mongoose from 'mongoose';

const workHistorySchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    clientOrEmployer: { type: String, default: '' },
    duration: { type: String, default: '' }, // e.g. "6 Months" ya "2023 - 2025"
    description: { type: String, default: '' },
  },
  { _id: true }
);

const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    workerIdCode: {
      type: String,
      unique: true,
    },
    occupation: {
      type: String,
      required: true,
      default: 'General Technician',
    },
    category: {
      type: String,
      required: true,
      default: 'Home Maintenance',
    },
    skills: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      required: true,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    dailyRate: {
      type: Number,
      default: 0,
    },
    city: {
      type: String,
      required: true,
      default: 'Islamabad',
    },
    address: {
      type: String,
      default: '',
    },
    whatsappNumber: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    cnicNumber: {
      type: String,
      default: '',
    },
    languages: {
      type: [String],
      default: ['Urdu'],
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Offline'],
      default: 'Available',
    },
    verificationStatus: {
      type: String,
      enum: ['Unverified', 'Pending', 'Verified'],
      default: 'Pending',
    },
    bio: {
      type: String,
      default: '',
    },
    workHistory: {
      type: [workHistorySchema],
      default: [],
    },
    profileCompletion: {
      type: Number,
      default: 20,
    },
  },
  { timestamps: true }
);

// Worker ID Code auto-generate karna (e.g., DLM-2026-4821)
workerProfileSchema.pre('save', function () {
  if (!this.workerIdCode) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.workerIdCode = `DLM-2026-${randomDigits}`;
  }
});

export default mongoose.model('WorkerProfile', workerProfileSchema);

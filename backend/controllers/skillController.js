import WorkerProfile from '../models/WorkerProfile.js';
import WorkerSkill from '../models/WorkerSkill.js';
import SkillEvidence from '../models/SkillEvidence.js';
import { SKILL_CATALOG, ALL_CATEGORIES } from '../config/skillCatalog.js';
import { extractSkillsFromExperience } from '../services/aiSkillService.js';

// Helper: Synchronize WorkerProfile.skills string array with WorkerSkill collection
const syncWorkerProfileSkills = async (workerProfileId) => {
  const allSkills = await WorkerSkill.find({ workerProfileId });
  const skillNames = allSkills.map((s) => s.skillName);
  await WorkerProfile.findByIdAndUpdate(workerProfileId, {
    skills: skillNames,
  });
};

// 1. GET /api/worker/skills
export const getWorkerSkills = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Worker profile not found. Please complete Module 1 profile setup first.' });
    }

    // Migration Check: If WorkerProfile has legacy skills array but WorkerSkill has 0 records, migrate!
    const existingCount = await WorkerSkill.countDocuments({ workerProfileId: profile._id });
    if (existingCount === 0 && Array.isArray(profile.skills) && profile.skills.length > 0) {
      for (const legacySkill of profile.skills) {
        if (typeof legacySkill === 'string' && legacySkill.trim()) {
          const trimmed = legacySkill.trim();
          await WorkerSkill.create({
            workerProfileId: profile._id,
            skillName: trimmed,
            category: profile.category || 'Home Maintenance',
            claimedExperienceYears: profile.experienceYears || 1,
            source: 'manual',
            verificationStatus: 'Unverified',
          });
        }
      }
    }

    const skills = await WorkerSkill.find({ workerProfileId: profile._id }).sort({ createdAt: -1 });

    // Attach evidence counts and statuses for each skill
    const skillsWithEvidence = await Promise.all(
      skills.map(async (skill) => {
        const evidenceCount = await SkillEvidence.countDocuments({ workerSkillId: skill._id });
        const pendingCount = await SkillEvidence.countDocuments({
          workerSkillId: skill._id,
          status: 'Pending',
        });
        const approvedCount = await SkillEvidence.countDocuments({
          workerSkillId: skill._id,
          status: 'Approved',
        });
        return {
          ...skill.toObject(),
          evidenceStats: {
            total: evidenceCount,
            pending: pendingCount,
            approved: approvedCount,
          },
        };
      })
    );

    res.json({
      workerProfileId: profile._id,
      skills: skillsWithEvidence,
      catalog: SKILL_CATALOG,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. POST /api/worker/skills (Manual Add)
export const addWorkerSkill = async (req, res) => {
  try {
    const { skillName, category, claimedExperienceYears } = req.body;
    if (!skillName || !category) {
      return res.status(400).json({ message: 'Skill name and trade category are required.' });
    }

    const profile = await WorkerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Worker profile not found. Please complete Module 1 profile setup first.' });
    }

    // Check duplicate
    const normalizedName = skillName.trim();
    const existing = await WorkerSkill.findOne({
      workerProfileId: profile._id,
      skillName: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({ message: 'This skill is already in your profile.' });
    }

    const newSkill = await WorkerSkill.create({
      workerProfileId: profile._id,
      skillName: normalizedName,
      category: category.trim(),
      claimedExperienceYears: Number(claimedExperienceYears) || 0,
      source: 'manual',
      verificationStatus: 'Unverified',
    });

    await syncWorkerProfileSkills(profile._id);

    res.status(201).json({
      message: 'Skill added successfully.',
      skill: newSkill,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. PUT /api/worker/skills/:id (Edit Skill)
export const updateWorkerSkill = async (req, res) => {
  try {
    const { skillName, category, claimedExperienceYears } = req.body;
    const profile = await WorkerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    const skill = await WorkerSkill.findOne({ _id: req.params.id, workerProfileId: profile._id });
    if (!skill) {
      return res.status(404).json({ message: 'Skill record not found.' });
    }

    if (skillName) skill.skillName = skillName.trim();
    if (category) skill.category = category.trim();
    if (claimedExperienceYears !== undefined) {
      skill.claimedExperienceYears = Number(claimedExperienceYears) || 0;
    }

    await skill.save();
    await syncWorkerProfileSkills(profile._id);

    res.json({ message: 'Skill updated successfully.', skill });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. DELETE /api/worker/skills/:id
export const deleteWorkerSkill = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    const skill = await WorkerSkill.findOneAndDelete({
      _id: req.params.id,
      workerProfileId: profile._id,
    });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found or already deleted.' });
    }

    // Also delete any associated evidence
    await SkillEvidence.deleteMany({ workerSkillId: skill._id });
    await syncWorkerProfileSkills(profile._id);

    res.json({ message: 'Skill and associated evidence removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. POST /api/worker/skills/extract-ai
export const extractSkills = async (req, res) => {
  try {
    const { experienceText } = req.body;
    if (!experienceText || typeof experienceText !== 'string' || !experienceText.trim()) {
      return res.status(400).json({ message: 'Experience description text is required.' });
    }

    const result = await extractSkillsFromExperience(experienceText);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. POST /api/worker/skills/batch-confirm
export const batchConfirmSkills = async (req, res) => {
  try {
    const { acceptedSkills } = req.body; // Array of { name, category, claimedExperienceYears }
    if (!Array.isArray(acceptedSkills) || acceptedSkills.length === 0) {
      return res.status(400).json({ message: 'No skills provided for confirmation.' });
    }

    const profile = await getOrCreateWorkerProfile(req.user);

    const savedSkills = [];
    for (const item of acceptedSkills) {
      if (!item.name || !item.category) continue;
      const normalizedName = item.name.trim();

      // Check if already in profile
      let skill = await WorkerSkill.findOne({
        workerProfileId: profile._id,
        skillName: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      });

      if (!skill) {
        skill = await WorkerSkill.create({
          workerProfileId: profile._id,
          skillName: normalizedName,
          category: item.category.trim(),
          claimedExperienceYears: Number(item.claimedExperienceYears) || profile.experienceYears || 1,
          source: 'ai_suggested',
          verificationStatus: 'Unverified', // AI must not auto-verify
        });
      }
      savedSkills.push(skill);
    }

    await syncWorkerProfileSkills(profile._id);

    res.status(201).json({
      message: `${savedSkills.length} AI-suggested skill(s) confirmed and added to your profile!`,
      skills: savedSkills,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. GET /api/worker/skills/catalog
export const getCatalog = async (req, res) => {
  res.json({ catalog: SKILL_CATALOG, categories: ALL_CATEGORIES });
};

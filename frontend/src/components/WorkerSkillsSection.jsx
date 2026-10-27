import { useState, useEffect } from 'react';
import API from '../api';

const PRESET_TEST_CASES = [
  {
    label: 'Electrician (5 Yrs)',
    text: 'I have worked as an electrician for five years, installing house wiring, repairing electrical faults, and installing solar panels and inverter systems.',
  },
  {
    label: 'Plumber (4 Yrs)',
    text: 'I have 4 years experience in plumbing, installing PPR water pipes, fixing wall leakages, repairing water motors, and clearing drainage blockages.',
  },
  {
    label: 'Carpenter (6 Yrs)',
    text: 'I am a carpenter with 6 years experience in furniture assembly and repair, wooden door installation, kitchen cabinetry, and wood polishing.',
  },
  {
    label: 'Painter (3 Yrs)',
    text: 'I have worked as a painter for 3 years doing interior wall painting, exterior weather-sheet application, wall putty surface preparation, and water seepage proofing.',
  },
  {
    label: 'Construction Worker (5 Yrs)',
    text: 'I have 5 years experience in civil construction, bricklaying, wall plastering, and floor tile laying for residential plazas.',
  },
  {
    label: 'Vague Test Case',
    text: 'I have worked for three years.',
  },
];

export default function WorkerSkillsSection({ onSkillChange }) {
  const [skills, setSkills] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Manual Add Form State
  const [manualSkill, setManualSkill] = useState({
    skillName: '',
    category: 'Electrical Services',
    claimedExperienceYears: 2,
  });
  const [addingManual, setAddingManual] = useState(false);

  // AI Extraction State
  const [experienceText, setExperienceText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [acceptedSkills, setAcceptedSkills] = useState({});

  // Evidence Modal State
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillEvidenceList, setSkillEvidenceList] = useState([]);
  const [evidenceForm, setEvidenceForm] = useState({
    evidenceType: 'Certificate',
    title: '',
    issuer: '',
    certificateNumber: '',
    description: '',
    fileName: '',
    fileMimeType: '',
    fileSize: 0,
    fileBase64: '',
  });
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Load Skills & Catalog
  const loadSkills = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/skills');
      setSkills(data.skills || []);
      if (data.catalog) setCatalog(data.catalog);
      if (onSkillChange) onSkillChange(data.skills);
    } catch (err) {
      console.error('Failed to load worker skills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  // 1. Manual Skill Submission
  const handleAddManualSkill = async (e) => {
    e.preventDefault();
    if (!manualSkill.skillName.trim()) return;
    setAddingManual(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await API.post('/skills', manualSkill);
      setStatusMsg({ type: 'success', text: `Skill "${manualSkill.skillName}" added successfully!` });
      setManualSkill({
        skillName: '',
        category: manualSkill.category || 'Electrical Services',
        claimedExperienceYears: 2,
      });
      loadSkills();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to add skill' });
    } finally {
      setAddingManual(false);
    }
  };

  // 2. Delete Skill
  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to remove this skill and its associated evidence?')) return;
    try {
      await API.delete(`/skills/${skillId}`);
      setStatusMsg({ type: 'success', text: 'Skill removed.' });
      loadSkills();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete skill' });
    }
  };

  // 3. AI Skill Extraction
  const handleExtractWithAI = async () => {
    if (!experienceText.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter a description of your work experience.' });
      return;
    }
    setAiLoading(true);
    setStatusMsg({ type: '', text: '' });
    setAiResponse(null);
    setAcceptedSkills({});
    try {
      const { data } = await API.post('/skills/extract-ai', { experienceText });
      setAiResponse(data);

      if (data.isVague) {
        setStatusMsg({
          type: 'warning',
          text: data.message || 'Description is too vague to identify specific trade skills reliably.',
        });
      } else {
        // Pre-check all detected skills by default for easy review
        const initialMap = {};
        (data.detectedSkills || []).forEach((s, idx) => {
          initialMap[`det-${idx}`] = { ...s, claimedExperienceYears: 2, accepted: true };
        });
        (data.additionalSuggestions || []).forEach((s, idx) => {
          initialMap[`sug-${idx}`] = { ...s, claimedExperienceYears: 1, accepted: false };
        });
        setAcceptedSkills(initialMap);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to extract skills via AI.' });
    } finally {
      setAiLoading(false);
    }
  };

  // Toggle selection for AI skill
  const toggleAiSkill = (key) => {
    setAcceptedSkills((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        accepted: !prev[key]?.accepted,
      },
    }));
  };

  // 4. Batch Confirm AI Skills
  const handleConfirmAiSkills = async () => {
    const toSave = Object.values(acceptedSkills)
      .filter((s) => s.accepted)
      .map((s) => ({
        name: s.name,
        category: s.category,
        claimedExperienceYears: s.claimedExperienceYears || 2,
      }));

    if (toSave.length === 0) {
      setStatusMsg({ type: 'warning', text: 'Please select at least one skill to confirm and add.' });
      return;
    }

    try {
      const { data } = await API.post('/skills/batch-confirm', { acceptedSkills: toSave });
      setStatusMsg({ type: 'success', text: data.message });
      setAiResponse(null);
      setExperienceText('');
      setAcceptedSkills({});
      loadSkills();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save confirmed skills.' });
    }
  };

  // 5. Open Evidence Modal for a Skill
  const handleOpenEvidenceModal = async (skill) => {
    setSelectedSkill(skill);
    setEvidenceModalOpen(true);
    setEvidenceForm({
      evidenceType: 'Certificate',
      title: `${skill.skillName} Proof`,
      issuer: '',
      certificateNumber: '',
      description: '',
      fileName: '',
      fileMimeType: '',
      fileSize: 0,
      fileBase64: '',
    });
    // Fetch previous evidence
    try {
      const { data } = await API.get(`/evidence/skill/${skill._id}`);
      setSkillEvidenceList(data || []);
    } catch (err) {
      console.error('Failed to load skill evidence', err);
    }
  };

  // 6. Handle File Select (Convert to Base64)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result.split(',')[1];
      setEvidenceForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileMimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileBase64: base64Content,
      }));
    };
    reader.readAsDataURL(file);
  };

  // 7. Submit Evidence Upload
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedSkill) return;
    if (!evidenceForm.fileBase64) {
      alert('Please select a certificate document, photograph, or work sample file to upload.');
      return;
    }

    setUploadingEvidence(true);
    try {
      const { data } = await API.post(`/evidence/upload/${selectedSkill._id}`, evidenceForm);
      setStatusMsg({ type: 'success', text: data.message });
      // Refresh modal list
      const updatedList = await API.get(`/evidence/skill/${selectedSkill._id}`);
      setSkillEvidenceList(updatedList.data || []);
      // Reset form file
      setEvidenceForm((prev) => ({
        ...prev,
        issuer: '',
        certificateNumber: '',
        description: '',
        fileName: '',
        fileBase64: '',
      }));
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit evidence.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  // 8. Delete Evidence
  const handleDeleteEvidence = async (evidenceId) => {
    if (!window.confirm('Delete this evidence record?')) return;
    try {
      await API.delete(`/evidence/${evidenceId}`);
      const updatedList = await API.get(`/evidence/skill/${selectedSkill._id}`);
      setSkillEvidenceList(updatedList.data || []);
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete evidence.');
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {statusMsg.text && (
        <div
          className={`alert-message ${
            statusMsg.type === 'success' ? 'success' : statusMsg.type === 'warning' ? 'warning' : 'error'
          }`}
          style={{
            background:
              statusMsg.type === 'success' ? '#dcfce7' : statusMsg.type === 'warning' ? '#fef3c7' : '#fee2e2',
            color: statusMsg.type === 'success' ? '#15803d' : statusMsg.type === 'warning' ? '#b45309' : '#dc2626',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontWeight: '600',
            fontSize: '0.88rem',
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Grid: Left = AI Profiler & Manual Add | Right = Structured Skills & Evidence List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
        {/* SECTION 1: AI EXPERIENCE & SKILL PROFILER */}
        <div
          style={{
            background: 'white',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                Module 2: AI Experience & Skill Profiler
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Describe your hands-on trade experience in natural language. Our AI engine identifies technical
                skills and categorizes them automatically.
              </p>
            </div>
          </div>

          {/* Quick Pre-filled Test Cases for Demonstration */}
          <div style={{ marginTop: '14px', marginBottom: '14px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              ⚡ QUICK TEST CASE PRESETS (CLICK TO TRY):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_TEST_CASES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setExperienceText(preset.text)}
                  style={{
                    fontSize: '0.76rem',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows="4"
            className="input-control"
            placeholder="e.g. I have worked as an electrician for five years, installing house wiring, repairing electrical faults, and installing solar panels and inverter backup systems..."
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: '12px' }}
          />

          <button
            type="button"
            className="btn-action-primary"
            onClick={handleExtractWithAI}
            disabled={aiLoading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {aiLoading ? 'Analyzing Experience with AI...' : '✨ Extract & Suggest Skills with AI'}
          </button>

          {/* AI Result Container */}
          {aiResponse && !aiResponse.isVague && (
            <div
              style={{
                marginTop: '20px',
                padding: '18px',
                background: '#f8fafc',
                borderRadius: '14px',
                border: '1px solid #cbd5e1',
              }}
            >
              <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                AI Analysis Results (Review & Confirm Before Saving):
              </h4>

              {/* Directly Detected Skills */}
              <div style={{ marginBottom: '16px' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    color: '#15803d',
                    background: '#dcfce7',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px',
                  }}
                >
                  ✓ DIRECTLY DETECTED SKILLS (FROM YOUR EXPERIENCE)
                </span>
                <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                  {(aiResponse.detectedSkills || []).map((s, idx) => {
                    const key = `det-${idx}`;
                    const item = acceptedSkills[key] || s;
                    return (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'white',
                          borderRadius: '10px',
                          border: item.accepted ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            checked={Boolean(item.accepted)}
                            onChange={() => toggleAiSkill(key)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.92rem' }}>{item.name}</strong>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              Category: {item.category}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#475569' }}>Claimed Exp:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={item.claimedExperienceYears || 2}
                            onChange={(e) =>
                              setAcceptedSkills((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], claimedExperienceYears: Number(e.target.value) },
                              }))
                            }
                            style={{ width: '55px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Yrs</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Suggestions */}
              {aiResponse.additionalSuggestions && aiResponse.additionalSuggestions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      color: '#4338ca',
                      background: '#e0e7ff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    💡 COMPLEMENTARY SKILL SUGGESTIONS (OPTIONAL)
                  </span>
                  <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
                    {aiResponse.additionalSuggestions.map((s, idx) => {
                      const key = `sug-${idx}`;
                      const item = acceptedSkills[key] || s;
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'white',
                            borderRadius: '10px',
                            border: item.accepted ? '2px solid #6366f1' : '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(item.accepted)}
                              onChange={() => toggleAiSkill(key)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.92rem' }}>{item.name}</strong>
                              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                                Category: {item.category}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>Claimed Exp:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={item.claimedExperienceYears || 1}
                              onChange={(e) =>
                                setAcceptedSkills((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], claimedExperienceYears: Number(e.target.value) },
                                }))
                              }
                              style={{ width: '55px', padding: '4px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Yrs</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmAiSkills}
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                ✓ Confirm & Save Selected Skills to MongoDB
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: MANUAL SKILL ENTRY */}
        <div
          style={{
            background: 'white',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '1.3rem' }}>🛠️</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                Add Skill Manually
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Can't find a skill through AI? Enter any trade skill and claimed experience manually.
              </p>
            </div>
          </div>

          <form onSubmit={handleAddManualSkill}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 0.8fr auto', gap: '12px' }}>
              <div>
                <label className="input-label">Skill Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Solar Panel Installation"
                  className="input-control"
                  required
                  value={manualSkill.skillName}
                  onChange={(e) => setManualSkill({ ...manualSkill, skillName: e.target.value })}
                />
              </div>

              <div>
                <label className="input-label">Trade Category *</label>
                <select
                  className="input-control"
                  value={manualSkill.category}
                  onChange={(e) => setManualSkill({ ...manualSkill, category: e.target.value })}
                >
                  {catalog.map((cat, idx) => (
                    <option key={idx} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                  {catalog.length === 0 && (
                    <>
                      <option value="Electrical Services">Electrical Services</option>
                      <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                      <option value="Carpentry & Woodwork">Carpentry & Woodwork</option>
                      <option value="Painting & Renovation">Painting & Renovation</option>
                      <option value="Construction & Masonry">Construction & Masonry</option>
                      <option value="AC & Refrigeration">AC & Refrigeration</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="input-label">Claimed Exp (Yrs)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="input-control"
                  value={manualSkill.claimedExperienceYears}
                  onChange={(e) => setManualSkill({ ...manualSkill, claimedExperienceYears: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={addingManual}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 20px',
                    height: '42px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {addingManual ? 'Adding...' : '+ Add Skill'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* SECTION 3: MY STRUCTURED SKILLS & EVIDENCE MANAGER (MODULE 3) */}
        <div
          style={{
            background: 'white',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                Module 3: Structured Skills & Evidence Verification
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Each skill is individually stored in MongoDB and verified separately. Upload certificates, work samples, or photos.
              </p>
            </div>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: '700',
                background: '#f1f5f9',
                padding: '6px 14px',
                borderRadius: '12px',
                color: '#334155',
              }}
            >
              Total Skills: {skills.length}
            </span>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading structured skills...</p>
          ) : skills.length === 0 ? (
            <div
              style={{
                background: '#f8fafc',
                padding: '30px',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px dashed #cbd5e1',
              }}
            >
              <h4>No Structured Skills Added Yet</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                Use the AI Profiler above or enter skills manually to populate your profile.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '14px' }}>
              {skills.map((skill) => {
                const isVerified = skill.verificationStatus === 'Verified';
                const isPending = skill.verificationStatus === 'Pending';
                return (
                  <div
                    key={skill._id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: '#f8fafc',
                      border: isVerified
                        ? '1px solid #86efac'
                        : isPending
                        ? '1px solid #fde047'
                        : '1px solid #e2e8f0',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                          {skill.skillName}
                        </h4>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: isVerified ? '#dcfce7' : isPending ? '#fef3c7' : '#e2e8f0',
                            color: isVerified ? '#15803d' : isPending ? '#b45309' : '#475569',
                          }}
                        >
                          {isVerified ? '✓ Verified Skill' : isPending ? '⏳ Verification Pending' : 'Unverified Claim'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: skill.source === 'ai_suggested' ? '#ede9fe' : '#f1f5f9',
                            color: skill.source === 'ai_suggested' ? '#6d28d9' : '#64748b',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                          }}
                        >
                          {skill.source === 'ai_suggested' ? 'AI Suggested' : 'Manual Entry'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                        Category: <strong>{skill.category}</strong> • Claimed Experience: <strong>{skill.claimedExperienceYears} Years</strong>
                        {skill.evidenceStats?.total > 0 && (
                          <span style={{ marginLeft: '10px', color: '#2563eb', fontWeight: '600' }}>
                            📁 {skill.evidenceStats.total} Evidence file(s) ({skill.evidenceStats.approved} Approved)
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEvidenceModal(skill)}
                        style={{
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        📄 Manage / Upload Evidence
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill._id)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* EVIDENCE UPLOAD & INSPECTION MODAL (MODULE 3) */}
      {evidenceModalOpen && selectedSkill && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Skill Evidence & Verification: {selectedSkill.skillName}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Upload certificates, photographs of past work, or work samples to verify this specific skill.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
              >
                ✕
              </button>
            </div>

            {/* Previously Uploaded Evidence for this skill */}
            <div style={{ marginBottom: '22px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                Submitted Evidence for this Skill:
              </h4>
              {skillEvidenceList.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  No evidence submitted yet for this skill. Upload a certificate or photo below.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {skillEvidenceList.map((ev) => (
                    <div
                      key={ev._id}
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{ev.evidenceType}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background:
                                ev.status === 'Approved'
                                  ? '#dcfce7'
                                  : ev.status === 'Pending'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                ev.status === 'Approved'
                                  ? '#15803d'
                                  : ev.status === 'Pending'
                                  ? '#b45309'
                                  : '#dc2626',
                            }}
                          >
                            {ev.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          File: {ev.fileName} • {ev.issuer ? `Issuer: ${ev.issuer}` : ''}{' '}
                          {ev.certificateNumber ? `(Cert: ${ev.certificateNumber})` : ''}
                        </div>
                        {ev.reviewNotes && (
                          <div style={{ fontSize: '0.76rem', color: '#b45309', marginTop: '4px' }}>
                            <strong>Admin Feedback:</strong> {ev.reviewNotes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {ev.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvidence(ev._id)}
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence Upload Form */}
            <form
              onSubmit={handleUploadEvidence}
              style={{
                background: '#f8fafc',
                padding: '18px',
                borderRadius: '14px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <h4 style={{ fontSize: '0.94rem', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                Upload New Evidence File
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">Evidence Type *</label>
                  <select
                    className="input-control"
                    value={evidenceForm.evidenceType}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, evidenceType: e.target.value })}
                  >
                    <option value="Certificate">Official Institute Certificate</option>
                    <option value="Work Photograph">Photograph of Completed Work</option>
                    <option value="Work Sample">Work Sample / Portfolio</option>
                    <option value="Reference Letter">Reference Letter / Employer Proof</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Issuing Institute / Authority</label>
                  <input
                    type="text"
                    placeholder="e.g. NAVTTC, TEVTA, Polytechnic"
                    className="input-control"
                    value={evidenceForm.issuer}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, issuer: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label className="input-label">Certificate / Roll / License #</label>
                  <input
                    type="text"
                    placeholder="e.g. NAVTTC-2024-8821"
                    className="input-control"
                    value={evidenceForm.certificateNumber}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, certificateNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Select File (PDF, JPG, PNG) *</label>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    className="input-control"
                    onChange={handleFileChange}
                    style={{ padding: '6px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="input-label">Short Description / Project Context</label>
                <textarea
                  rows="2"
                  className="input-control"
                  placeholder="e.g. 6-month certified electrician diploma completed with distinction, covers 3-phase wiring and safety."
                  value={evidenceForm.description}
                  onChange={(e) => setEvidenceForm({ ...evidenceForm, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={uploadingEvidence}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {uploadingEvidence ? 'Submitting Evidence...' : 'Submit Evidence for Verification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

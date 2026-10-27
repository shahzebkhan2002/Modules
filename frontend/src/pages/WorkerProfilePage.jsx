import { useState, useEffect } from 'react';
import API from '../api';
import WorkerSkillsSection from '../components/WorkerSkillsSection';

export default function WorkerProfilePage() {
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [profile, setProfile] = useState({
    name: storedUser.name || '',
    phone: storedUser.phone || '',
    workerIdCode: 'DLM-2026-NEW',
    occupation: '',
    category: 'Home Maintenance',
    skillsInput: '',
    skills: [],
    experienceYears: 0,
    hourlyRate: 0,
    dailyRate: 0,
    city: 'Rawalpindi / Islamabad',
    address: '',
    whatsappNumber: '',
    emergencyContact: '',
    cnicNumber: '',
    languagesInput: 'Urdu, Punjabi',
    availability: 'Available',
    verificationStatus: 'Pending',
    bio: '',
    workHistory: [],
    profileCompletion: 25,
  });

  const [newJob, setNewJob] = useState({
    jobTitle: '',
    clientOrEmployer: '',
    duration: '',
    description: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('skills'); // 'skills' (Module 2 & 3) or 'profile' (Module 1)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get('/worker/profile');
        if (data) {
          setProfile({
            ...data,
            name: data.user?.name || storedUser.name || '',
            phone: data.user?.phone || storedUser.phone || '',
            skillsInput: (data.skills || []).join(', '),
            languagesInput: (data.languages || ['Urdu']).join(', '),
            workHistory: data.workHistory || [],
          });
        }
      } catch (err) {
        console.log('New worker profile initialization');
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAddWorkHistory = () => {
    if (!newJob.jobTitle.trim()) return;
    setProfile({
      ...profile,
      workHistory: [...profile.workHistory, { ...newJob }],
    });
    setNewJob({ jobTitle: '', clientOrEmployer: '', duration: '', description: '' });
  };

  const handleRemoveWorkHistory = (index) => {
    const updated = profile.workHistory.filter((_, idx) => idx !== index);
    setProfile({ ...profile, workHistory: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...profile,
        skills: profile.skillsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: profile.languagesInput
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean),
      };

      const { data } = await API.post('/worker/profile', payload);
      const saved = data.profile;

      // Update localStorage user name & phone
      const updatedUser = {
        ...storedUser,
        name: saved.user?.name || profile.name,
        phone: saved.user?.phone || profile.phone,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setProfile({
        ...saved,
        name: saved.user?.name || profile.name,
        phone: saved.user?.phone || profile.phone,
        skillsInput: (saved.skills || []).join(', '),
        languagesInput: (saved.languages || []).join(', '),
        workHistory: saved.workHistory || [],
      });

      setMessage(data.message || 'Profile successfully saved!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const skillTags = profile.skillsInput
    ? profile.skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="profile-dashboard">
      <div style={{ marginBottom: '20px' }}>
        <h1 className="profile-header-title">Worker Dashboard & Digital Identity</h1>
        <p className="profile-header-subtitle">
          Modules 1, 2 & 3: Manage your verified digital identity, AI skill extraction, structured trade profiles, and evidence verification.
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          background: '#f1f5f9',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '24px',
          width: 'fit-content',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'skills' ? '#2563eb' : 'transparent',
            color: activeTab === 'skills' ? 'white' : '#475569',
            boxShadow: activeTab === 'skills' ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          ⚡ Skills & Evidence Profiler (Modules 2 & 3)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'profile' ? '#2563eb' : 'transparent',
            color: activeTab === 'profile' ? 'white' : '#475569',
            boxShadow: activeTab === 'profile' ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          👤 Digital Identity & Basic Profile (Module 1)
        </button>
      </div>

      {message && <div className="alert-message success">{message}</div>}
      {error && <div className="alert-message error">{error}</div>}

      {activeTab === 'skills' ? (
        <WorkerSkillsSection onSkillChange={() => {}} />
      ) : (

      <div className="profile-grid">
        {/* Left: Smart Digital Identity Card */}
        <div className="digital-id-card">
          <div className="card-top-bar">
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '1px' }}>
              ID: {profile.workerIdCode || 'DLM-2026-NEW'}
            </span>
            <span
              style={{
                background:
                  profile.availability === 'Available'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                color: profile.availability === 'Available' ? '#34d399' : '#fbbf24',
                padding: '3px 10px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: '700',
              }}
            >
              ● {profile.availability.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div className="chip-box"></div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: '8px',
                background:
                  profile.verificationStatus === 'Verified'
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(148, 163, 184, 0.15)',
                color: profile.verificationStatus === 'Verified' ? '#38bdf8' : '#cbd5e1',
                fontWeight: '700',
              }}
            >
              {profile.verificationStatus === 'Verified' ? '✓ VERIFIED ID' : '⏳ PENDING VERIFICATION'}
            </span>
          </div>

          <div className="id-user-info">
            <div className="id-avatar">{profile.name ? profile.name[0].toUpperCase() : 'W'}</div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{profile.name || 'Worker Name'}</h3>
              <p style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>
                {profile.occupation || 'Trade Not Added'}
              </p>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{profile.category}</p>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#cbd5e1' }}>
              <span>Profile Completion</span>
              <strong>{profile.profileCompletion || 25}%</strong>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#334155', borderRadius: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${profile.profileCompletion || 25}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #38bdf8, #2563eb)',
                }}
              />
            </div>
          </div>

          <div className="stat-pills-row">
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>EXPERIENCE</span>
              <span style={{ fontSize: '1rem', fontWeight: '700' }}>{profile.experienceYears || 0} Years</span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>HOURLY / DAILY</span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8' }}>
                Rs.{profile.hourlyRate || 0}/hr • Rs.{profile.dailyRate || 0}/day
              </span>
            </div>
          </div>

          {/* Skill Badges on Card */}
          {skillTags.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                SKILLS & SPECIALTIES
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skillTags.map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      color: '#f8fafc',
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6', borderTop: '1px solid #334155', paddingTop: '12px' }}>
            <div><strong>Phone:</strong> {profile.phone || 'N/A'}</div>
            <div><strong>WhatsApp:</strong> {profile.whatsappNumber || profile.phone || 'N/A'}</div>
            <div><strong>Location:</strong> {profile.address ? `${profile.address}, ` : ''}{profile.city}</div>
            <div><strong>Languages:</strong> {profile.languagesInput || 'Urdu'}</div>
          </div>
        </div>

        {/* Right: Structured Profile Form */}
        <div className="form-panel">
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: '#0f172a' }}>
              1. Personal & Contact Information
            </h3>
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="input-control"
                  value={profile.name}
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Primary Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="input-control"
                  value={profile.phone}
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">WhatsApp Number</label>
                <input
                  type="text"
                  name="whatsappNumber"
                  placeholder="e.g. 0300 1234567"
                  className="input-control"
                  value={profile.whatsappNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Emergency Contact Number</label>
                <input
                  type="text"
                  name="emergencyContact"
                  placeholder="Family / Guardian Phone"
                  className="input-control"
                  value={profile.emergencyContact}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">CNIC Number (For Identity Verification)</label>
                <input
                  type="text"
                  name="cnicNumber"
                  placeholder="e.g. 37405-1234567-1"
                  className="input-control"
                  value={profile.cnicNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Languages Spoken (Comma separated)</label>
                <input
                  type="text"
                  name="languagesInput"
                  placeholder="Urdu, Punjabi, English"
                  className="input-control"
                  value={profile.languagesInput}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">City</label>
                <input
                  type="text"
                  name="city"
                  className="input-control"
                  value={profile.city}
                  required
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Area / Sector / Mohalla</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Satellite Town / Sector G-10"
                  className="input-control"
                  value={profile.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <hr style={{ margin: '22px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', color: '#0f172a' }}>
              2. Occupation, Service Category & Wage Rates
            </h3>
            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Primary Occupation / Trade</label>
                <input
                  type="text"
                  name="occupation"
                  placeholder="e.g. Master Electrician, Plumber"
                  className="input-control"
                  value={profile.occupation}
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Service Category</label>
                <select name="category" className="input-control" value={profile.category} onChange={handleChange}>
                  <option value="Home Maintenance">Home Maintenance</option>
                  <option value="Electrical & Solar">Electrical & Solar</option>
                  <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                  <option value="Construction & Masonry">Construction & Masonry</option>
                  <option value="Carpentry & Woodwork">Carpentry & Woodwork</option>
                  <option value="Painting & Renovation">Painting & Renovation</option>
                  <option value="AC & Appliance Repair">AC & Appliance Repair</option>
                  <option value="Cleaning & Shifting">Cleaning & Shifting</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Specific Sub-Skills (Comma separated)</label>
              <input
                type="text"
                name="skillsInput"
                placeholder="e.g. House Wiring, UPS Repair, Solar Panel Fitting, Breaker Fix"
                className="input-control"
                value={profile.skillsInput}
                onChange={handleChange}
              />
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Years of Experience</label>
                <input
                  type="number"
                  name="experienceYears"
                  className="input-control"
                  value={profile.experienceYears}
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Work Availability Status</label>
                <select name="availability" className="input-control" value={profile.availability} onChange={handleChange}>
                  <option value="Available">Available for Work</option>
                  <option value="Busy">Currently Busy on a Job</option>
                  <option value="Offline">Offline / On Leave</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="input-group">
                <label className="input-label">Hourly Rate (PKR / Hour)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  placeholder="e.g. 800"
                  className="input-control"
                  value={profile.hourlyRate}
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Daily Wage Rate (PKR / Day)</label>
                <input
                  type="number"
                  name="dailyRate"
                  placeholder="e.g. 3500"
                  className="input-control"
                  value={profile.dailyRate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Professional Summary / Bio</label>
              <textarea
                name="bio"
                rows="3"
                className="input-control"
                placeholder="Apne kaam aur tajurbay ke baare mein mukhtasir likhein..."
                value={profile.bio}
                onChange={handleChange}
              />
            </div>

            <hr style={{ margin: '22px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>
              3. Past Work Experience Records
            </h3>

            {profile.workHistory.length > 0 && (
              <div style={{ marginBottom: '16px', display: 'grid', gap: '10px' }}>
                {profile.workHistory.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>
                        {item.jobTitle}{' '}
                        {item.clientOrEmployer && (
                          <span style={{ color: '#475569', fontWeight: '500' }}>at {item.clientOrEmployer}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {item.duration && <span>Duration: {item.duration} • </span>}
                        {item.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkHistory(index)}
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '18px' }}>
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Project / Job Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Complete House Wiring"
                    className="input-control"
                    value={newJob.jobTitle}
                    onChange={(e) => setNewJob({ ...newJob, jobTitle: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Client / Contractor / Plaza Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bahria Town Phase 4 Client"
                    className="input-control"
                    value={newJob.clientOrEmployer}
                    onChange={(e) => setNewJob({ ...newJob, clientOrEmployer: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="input-group">
                  <label className="input-label">Duration / Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024 (3 Months)"
                    className="input-control"
                    value={newJob.duration}
                    onChange={(e) => setNewJob({ ...newJob, duration: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Work Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Installed 10kW Solar & DB Boards"
                    className="input-control"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddWorkHistory}
                style={{
                  background: '#e0e7ff',
                  color: '#1d4ed8',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                + Add Experience Record to List
              </button>
            </div>

            <button type="submit" className="btn-action-primary" disabled={loading}>
              {loading ? 'Saving Digital Identity...' : 'Save & Update Digital Worker Profile'}
            </button>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import API from '../api';

export default function CustomerDashboard() {
  const [workers, setWorkers] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/worker/all', {
        params: { category, search },
      });
      setWorkers(data);
    } catch (err) {
      console.error('Failed to fetch workers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [category]);

  return (
    <div className="profile-dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="profile-header-title">Customer Portal — Verified Worker Directory</h1>
        <p className="profile-header-subtitle">
          Browse structured digital worker identities, verified skills, past work experience, and transparent wage rates.
        </p>
      </div>

      {/* Search & Category Filter Bar */}
      <div
        style={{
          background: 'white',
          padding: '18px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 240px auto',
          gap: '12px',
        }}
      >
        <input
          type="text"
          placeholder="Search by occupation or skill (e.g. Electrician, Solar, Plumber)..."
          className="input-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input-control" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          <option value="Home Maintenance">Home Maintenance</option>
          <option value="Electrical & Solar">Electrical & Solar</option>
          <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
          <option value="Construction & Masonry">Construction & Masonry</option>
          <option value="Carpentry & Woodwork">Carpentry & Woodwork</option>
          <option value="Painting & Renovation">Painting & Renovation</option>
          <option value="AC & Appliance Repair">AC & Appliance Repair</option>
          <option value="Cleaning & Shifting">Cleaning & Shifting</option>
        </select>
        <button
          onClick={fetchWorkers}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0 22px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading Worker Digital Identities...</p>
      ) : workers.length === 0 ? (
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h3>No Worker Profiles Found</h3>
          <p style={{ color: '#64748b', marginTop: '6px' }}>Try clearing the search filter or register a worker account first.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
          {workers.map((w) => (
            <div
              key={w._id}
              style={{
                background: 'white',
                borderRadius: '18px',
                padding: '22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748b' }}>
                  {w.workerIdCode || 'DLM-WORKER'}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: w.verificationStatus === 'Verified' ? '#dcfce7' : '#f1f5f9',
                    color: w.verificationStatus === 'Verified' ? '#15803d' : '#475569',
                  }}
                >
                  {w.verificationStatus === 'Verified' ? '✓ Verified Worker' : 'Pending Verification'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div className="id-avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                  {w.user?.name ? w.user.name[0].toUpperCase() : 'W'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{w.user?.name || 'Worker'}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: '600' }}>{w.occupation}</p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {w.category} • {w.city}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                  fontSize: '0.82rem',
                }}
              >
                <span><strong>Exp:</strong> {w.experienceYears} Yrs</span>
                <span><strong>Hourly:</strong> Rs.{w.hourlyRate}</span>
                <span><strong>Daily:</strong> Rs.{w.dailyRate || 0}</span>
              </div>

              {/* Structured Skills Display (Distinguishing Verified vs Claimed) */}
              {w.structuredSkills && w.structuredSkills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {w.structuredSkills.map((s, idx) => {
                    const isVer = s.verificationStatus === 'Verified';
                    const isPend = s.verificationStatus === 'Pending';
                    return (
                      <span
                        key={idx}
                        style={{
                          background: isVer ? '#dcfce7' : isPend ? '#fef3c7' : '#f1f5f9',
                          color: isVer ? '#15803d' : isPend ? '#b45309' : '#334155',
                          border: isVer ? '1px solid #86efac' : isPend ? '1px solid #fde047' : '1px solid #e2e8f0',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isVer && <span>✓</span>}
                        {s.skillName}
                        <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>
                          ({isVer ? 'Verified' : isPend ? 'Pending' : 'Claimed'})
                        </span>
                      </span>
                    );
                  })}
                </div>
              ) : w.skills && w.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {w.skills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.73rem',
                        fontWeight: '600',
                      }}
                    >
                      {s} (Claimed)
                    </span>
                  ))}
                </div>
              ) : null}

              {w.bio && (
                <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '12px' }}>{w.bio}</p>
              )}

              <div style={{ fontSize: '0.8rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div><strong>Contact:</strong> {w.user?.phone || w.whatsappNumber || 'N/A'}</div>
                <div><strong>Status:</strong> {w.availability}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import API from '../api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' (Module 3) or 'identity' (Module 1)
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceFilter, setEvidenceFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: 'Approved',
    verificationMethod: 'Document Inspection',
    reviewNotes: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [workersRes, usersRes, evidenceRes] = await Promise.all([
        API.get('/worker/all'),
        API.get('/worker/admin/users'),
        API.get('/evidence/admin/all'),
      ]);
      setWorkers(workersRes.data || []);
      setUsers(usersRes.data || []);
      setEvidenceList(evidenceRes.data || []);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Module 1: Toggle Worker Identity Verification
  const handleVerifyToggle = async (workerId, currentStatus) => {
    const nextStatus = currentStatus === 'Verified' ? 'Pending' : 'Verified';
    try {
      await API.put(`/worker/verify/${workerId}`, { status: nextStatus });
      loadAdminData();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  // Module 3: Open Review Modal for an Evidence Record
  const handleOpenReview = (ev) => {
    setActiveEvidence(ev);
    setReviewForm({
      status: 'Approved',
      verificationMethod: ev.verificationMethod || 'Document Inspection',
      reviewNotes: ev.reviewNotes || '',
    });
    setReviewModalOpen(true);
  };

  // Module 3: Submit Admin Review Decision
  const handleSubmitReview = async (decision) => {
    if (!activeEvidence) return;
    if (decision === 'Rejected' && !reviewForm.reviewNotes.trim()) {
      alert('Please provide a reason / review notes explaining why this evidence is being rejected.');
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        status: decision,
        verificationMethod: reviewForm.verificationMethod,
        reviewNotes: reviewForm.reviewNotes.trim() || `Verified via ${reviewForm.verificationMethod}`,
      };

      await API.put(`/evidence/admin/review/${activeEvidence._id}`, payload);
      alert(`Evidence submission has been marked as ${decision}. The individual skill status has been updated!`);
      setReviewModalOpen(false);
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review decision.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filter evidence list
  const filteredEvidence =
    evidenceFilter === 'All'
      ? evidenceList
      : evidenceList.filter((e) => e.status === evidenceFilter);

  const pendingEvidenceCount = evidenceList.filter((e) => e.status === 'Pending').length;
  const approvedEvidenceCount = evidenceList.filter((e) => e.status === 'Approved').length;

  return (
    <div className="profile-dashboard">
      <div style={{ marginBottom: '22px' }}>
        <h1 className="profile-header-title">Administrator Governance Panel</h1>
        <p className="profile-header-subtitle">
          Modules 1 & 3: Manage overall worker identity verification and review individual skill evidence submissions.
        </p>
      </div>

      {/* Main Tab Navigation */}
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
          onClick={() => setActiveTab('evidence')}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'evidence' ? '#2563eb' : 'transparent',
            color: activeTab === 'evidence' ? 'white' : '#475569',
            boxShadow: activeTab === 'evidence' ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📋 Skill Evidence Review (Module 3)</span>
          {pendingEvidenceCount > 0 && (
            <span
              style={{
                background: activeTab === 'evidence' ? '#ef4444' : '#fee2e2',
                color: activeTab === 'evidence' ? 'white' : '#dc2626',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.74rem',
              }}
            >
              {pendingEvidenceCount} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          style={{
            padding: '10px 22px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: activeTab === 'identity' ? '#2563eb' : 'transparent',
            color: activeTab === 'identity' ? 'white' : '#475569',
            boxShadow: activeTab === 'identity' ? '0 2px 4px rgba(37,99,235,0.2)' : 'none',
          }}
        >
          🪪 Worker Identity Verification (Module 1)
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>TOTAL USERS</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>{users.length}</h2>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>WORKER PROFILES</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#2563eb' }}>
            {workers.length}
          </h2>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>PENDING EVIDENCE</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#d97706' }}>
            {pendingEvidenceCount}
          </h2>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>APPROVED EVIDENCE</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#16a34a' }}>
            {approvedEvidenceCount}
          </h2>
        </div>
      </div>

      {/* TAB 1: SKILL EVIDENCE REVIEW (MODULE 3) */}
      {activeTab === 'evidence' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                Individual Skill Evidence Review Queue (Module 3)
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                Inspect uploaded certificates, work photographs, and samples. Approving evidence marks the specific skill as Verified.
              </p>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setEvidenceFilter(status)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: evidenceFilter === status ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: evidenceFilter === status ? '#eff6ff' : 'white',
                    color: evidenceFilter === status ? '#1d4ed8' : '#475569',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Loading evidence submissions...</p>
          ) : filteredEvidence.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', background: '#f8fafc', borderRadius: '12px' }}>
              <h4>No Evidence Submissions Found</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                There are currently no evidence records matching the filter.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 8px' }}>Worker</th>
                    <th style={{ padding: '12px 8px' }}>Target Skill</th>
                    <th style={{ padding: '12px 8px' }}>Evidence Type</th>
                    <th style={{ padding: '12px 8px' }}>Issuer / ID</th>
                    <th style={{ padding: '12px 8px' }}>File Info</th>
                    <th style={{ padding: '12px 8px' }}>Review Status</th>
                    <th style={{ padding: '12px 8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvidence.map((ev) => {
                    const workerUser = ev.workerProfileId?.user;
                    const skill = ev.workerSkillId;
                    return (
                      <tr key={ev._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: '700' }}>{workerUser?.name || 'Worker'}</div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {ev.workerProfileId?.workerIdCode || 'DLM'} • {ev.workerProfileId?.city}
                          </div>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{skill?.skillName || 'N/A'}</div>
                          <div style={{ fontSize: '0.76rem', color: '#2563eb' }}>{skill?.category}</div>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <span
                            style={{
                              background: '#f1f5f9',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                            }}
                          >
                            {ev.evidenceType}
                          </span>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: '600' }}>{ev.issuer || 'Self-Provided'}</div>
                          {ev.certificateNumber && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>#{ev.certificateNumber}</div>
                          )}
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontSize: '0.8rem', color: '#334155' }}>{ev.fileName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {Math.round((ev.fileSize || 0) / 1024)} KB
                          </div>
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
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
                        </td>

                        <td style={{ padding: '12px 8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(ev)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '700',
                              fontSize: '0.78rem',
                              background: '#2563eb',
                              color: 'white',
                            }}
                          >
                            🔍 Inspect & Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORKER IDENTITY VERIFICATION (MODULE 1) */}
      {activeTab === 'identity' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '16px' }}>
            Worker Digital Identity Verification Queue (Module 1)
          </h3>

          {loading ? (
            <p>Loading records...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 8px' }}>Worker ID</th>
                    <th style={{ padding: '12px 8px' }}>Name & Phone</th>
                    <th style={{ padding: '12px 8px' }}>Trade & Category</th>
                    <th style={{ padding: '12px 8px' }}>CNIC</th>
                    <th style={{ padding: '12px 8px' }}>Completion</th>
                    <th style={{ padding: '12px 8px' }}>Identity Status</th>
                    <th style={{ padding: '12px 8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{w.workerIdCode}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div><strong>{w.user?.name}</strong></div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{w.user?.phone}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div>{w.occupation}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{w.category}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{w.cnicNumber || 'Not Provided'}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '700' }}>{w.profileCompletion || 25}%</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: w.verificationStatus === 'Verified' ? '#dcfce7' : '#fef3c7',
                            color: w.verificationStatus === 'Verified' ? '#15803d' : '#b45309',
                          }}
                        >
                          {w.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <button
                          onClick={() => handleVerifyToggle(w._id, w.verificationStatus)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.78rem',
                            background: w.verificationStatus === 'Verified' ? '#fee2e2' : '#2563eb',
                            color: w.verificationStatus === 'Verified' ? '#dc2626' : 'white',
                          }}
                        >
                          {w.verificationStatus === 'Verified' ? 'Revoke Verify' : 'Approve & Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EVIDENCE REVIEW & INSPECTION MODAL (MODULE 3) */}
      {reviewModalOpen && activeEvidence && (
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
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '26px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Skill Evidence Adjudication
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                  Verify submitted credentials and record your administrative decision.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
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

            {/* Submission Details Card */}
            <div
              style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '18px',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>WORKER NAME</span>
                  <strong>{activeEvidence.workerProfileId?.user?.name || 'Worker'}</strong> (
                  {activeEvidence.workerProfileId?.workerIdCode})
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>TARGET SKILL</span>
                  <strong style={{ color: '#2563eb' }}>{activeEvidence.workerSkillId?.skillName}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>EVIDENCE TYPE</span>
                  <strong>{activeEvidence.evidenceType}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>ISSUER / AUTHORITY</span>
                  <strong>{activeEvidence.issuer || 'Not Specified'}</strong>
                </div>
              </div>

              {activeEvidence.certificateNumber && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>CERTIFICATE / LICENSE #</span>
                  <strong>{activeEvidence.certificateNumber}</strong>
                </div>
              )}

              {activeEvidence.description && (
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>WORKER DESCRIPTION</span>
                  <p style={{ margin: '4px 0 0 0', color: '#334155', fontSize: '0.82rem' }}>
                    {activeEvidence.description}
                  </p>
                </div>
              )}
            </div>

            {/* File Access / Inspection */}
            <div style={{ marginBottom: '18px' }}>
              <label className="input-label" style={{ fontWeight: '700' }}>
                Uploaded Evidence Document
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{activeEvidence.fileName}</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    {activeEvidence.fileMimeType} • {Math.round((activeEvidence.fileSize || 0) / 1024)} KB
                  </div>
                </div>

                {activeEvidence.fileBase64 && (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open();
                      win.document.write(
                        `<iframe src="data:${activeEvidence.fileMimeType};base64,${activeEvidence.fileBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                      );
                    }}
                    style={{
                      background: '#0f172a',
                      color: 'white',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    🔍 View Document
                  </button>
                )}
              </div>
            </div>

            {/* Verification Method Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label" style={{ fontWeight: '700' }}>
                Verification Procedure / Audit Method *
              </label>
              <select
                className="input-control"
                value={reviewForm.verificationMethod}
                onChange={(e) => setReviewForm({ ...reviewForm, verificationMethod: e.target.value })}
              >
                <option value="Document Inspection">Visual Document Inspection (Official Seal & Signatures)</option>
                <option value="Institute Verification">Institute Record Verification (NAVTTC / TEVTA / Board Check)</option>
                <option value="Portfolio Assessment">Practical Portfolio / Workmanship Assessment</option>
                <option value="Direct Reference Check">Direct Reference / Employer Contact Check</option>
                <option value="Other">Other Documented Method</option>
              </select>
            </div>

            {/* Admin Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label" style={{ fontWeight: '700' }}>
                Administrator Review Notes / Feedback *
              </label>
              <textarea
                rows="3"
                className="input-control"
                placeholder="Explain the review decision (e.g., Certificate authenticated against NAVTTC database, or explain why rejected)..."
                value={reviewForm.reviewNotes}
                onChange={(e) => setReviewForm({ ...reviewForm, reviewNotes: e.target.value })}
              />
            </div>

            {/* Action Decision Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleSubmitReview('Approved')}
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {submittingReview ? 'Processing...' : '✓ Approve & Verify Skill'}
              </button>

              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleSubmitReview('Rejected')}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {submittingReview ? 'Processing...' : '✕ Reject Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

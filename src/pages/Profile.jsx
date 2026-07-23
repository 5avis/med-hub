import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Profile({ onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    contact: '',
    bloodGroup: '',
    height: '',
    weight: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: '',
    primaryPhysician: '',
    medicalHistory: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getProfile();
      setProfile(data);
      setFormData({
        name: data?.name || '',
        age: data?.age && data.age !== 0 ? data.age : '',
        gender: data?.gender || '',
        contact: data?.contact || '',
        bloodGroup: data?.bloodGroup || data?.blood_group || '',
        height: data?.height || '',
        weight: data?.weight || '',
        allergies: data?.allergies || '',
        chronicConditions: data?.chronicConditions || '',
        emergencyContact: data?.emergencyContact || '',
        primaryPhysician: data?.primaryPhysician || '',
        medicalHistory: data?.medicalHistory || data?.medical_history || '',
      });
    } catch (err) {
      setError(err.message || 'Could not retrieve user clinical profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await api.updateProfile(formData);
      const updatedUser = result.user || formData;
      setProfile(prev => ({ ...prev, ...updatedUser }));
      setSuccessMsg('Health details saved successfully to MedHub!');
      setIsEditing(false);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    const h = parseFloat(profile?.height || formData?.height);
    const w = parseFloat(profile?.weight || formData?.weight);
    if (!h || !w || h === 0) return null;
    const hMeters = h / 100;
    return (w / (hMeters * hMeters)).toFixed(1);
  };

  const bmi = calculateBMI();

  const getBMICategory = (val) => {
    const num = parseFloat(val);
    if (num < 18.5) return { label: 'Underweight', color: '#eab308' };
    if (num < 25) return { label: 'Optimal Range', color: '#10b981' };
    if (num < 30) return { label: 'Overweight', color: '#f97316' };
    return { label: 'High Risk', color: '#ef4444' };
  };

  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  if (loading) {
    return (
      <div className="profile-loading glass-panel fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading confidential patient health record...</p>
      </div>
    );
  }

  return (
    <div className="profile-view fade-in">
      <header className="dashboard-header">
        <div>
          <h2>Patient Profile &amp; Medical Record</h2>
          <p className="subtitle">View and update your personal health biometrics, contact info, and medical history</p>
        </div>
        <button
          type="button"
          className="primary-btn refresh-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Editing' : '✏️ Edit Health Details'}
        </button>
      </header>

      {error && <div className="alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}
      {successMsg && <div className="alert-success" style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#dcfce7', color: '#15803d', borderRadius: '8px', fontWeight: '600' }}>{successMsg}</div>}

      <div className="profile-layout-grid">
        
        {/* Left Side: Summary Card */}
        <section className="profile-main-card glass-panel" style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '2rem 1.5rem' }}>
          <div className="profile-avatar-large">
            {profile?.name ? profile.name.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2) : 'MH'}
          </div>
          <h3 style={{ color: '#0f172a', fontWeight: '700', fontSize: '1.25rem' }}>{profile?.name || 'Patient User'}</h3>
          <span className="medhub-id-badge" style={{ margin: '0.5rem 0', background: '#f1f5f9', color: '#1f5c4e', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem' }}>
            {profile?.medhubId || profile?.medHubId || 'MED-XXXXXX'}
          </span>
          <span className="profile-role-badge" style={{ fontSize: '0.75rem', color: '#475569' }}>
            {profile?.role === 'readonly' ? 'Read-only Observer' : 'Full Access Patient Account'}
          </span>
          
          <div className="divider-line" style={{ height: '1px', background: '#e5e5e5', width: '100%', margin: '1.25rem 0' }}></div>
          
          <div className="profile-quick-stats" style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
            <div className="quick-stat-box" style={{ textAlign: 'center' }}>
              <span className="stat-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Blood Group</span>
              <span className="stat-val" style={{ display: 'block', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>{profile?.bloodGroup || profile?.blood_group || '--'}</span>
            </div>
            <div className="quick-stat-box" style={{ textAlign: 'center' }}>
              <span className="stat-label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Age</span>
              <span className="stat-val" style={{ display: 'block', fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>{profile?.age ? `${profile.age} yrs` : '--'}</span>
            </div>
          </div>
        </section>

        {/* Right Side: Display vs Inline Edit Form */}
        <div className="profile-detail-columns">
          
          {isEditing ? (
            /* Editable Health Details Form */
            <section className="profile-details-section glass-panel" style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.75rem' }}>
                ✏️ Edit Health &amp; Biometric Details
              </h3>
              
              <form onSubmit={handleFormSubmit} className="onboarding-form">
                <div className="onboarding-grid">
                  
                  <div className="form-group">
                    <label className="form-label uppercase-label" htmlFor="prof-name">FULL NAME</label>
                    <input
                      id="prof-name"
                      name="name"
                      type="text"
                      className="form-input dark-styled-input"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-age">AGE (YEARS)</label>
                      <input
                        id="prof-age"
                        name="age"
                        type="number"
                        min="1"
                        max="120"
                        placeholder="e.g. 28"
                        className="form-input dark-styled-input"
                        value={formData.age}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-gender">GENDER</label>
                      <select
                        id="prof-gender"
                        name="gender"
                        className="form-select dark-styled-input"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Gender...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-3col">
                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-blood">BLOOD GROUP</label>
                      <select
                        id="prof-blood"
                        name="bloodGroup"
                        className="form-select dark-styled-input"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Blood Group...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-height">HEIGHT (CM)</label>
                      <input
                        id="prof-height"
                        name="height"
                        type="text"
                        placeholder="e.g. 175"
                        className="form-input dark-styled-input"
                        value={formData.height}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-weight">WEIGHT (KG)</label>
                      <input
                        id="prof-weight"
                        name="weight"
                        type="text"
                        placeholder="e.g. 70"
                        className="form-input dark-styled-input"
                        value={formData.weight}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label uppercase-label" htmlFor="prof-allergies">KNOWN ALLERGIES</label>
                    <input
                      id="prof-allergies"
                      name="allergies"
                      type="text"
                      placeholder="e.g. Penicillin, Latex, Peanuts"
                      className="form-input dark-styled-input"
                      value={formData.allergies}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label uppercase-label" htmlFor="prof-chronic">CHRONIC CONDITIONS &amp; MEDICAL HISTORY</label>
                    <input
                      id="prof-chronic"
                      name="chronicConditions"
                      type="text"
                      placeholder="e.g. Hypertension, Diabetes, Asthma"
                      className="form-input dark-styled-input"
                      value={formData.chronicConditions}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-row-2col">
                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-contact">PATIENT PHONE NUMBER</label>
                      <input
                        id="prof-contact"
                        name="contact"
                        type="text"
                        placeholder="e.g. +1 555 234 5678"
                        className="form-input dark-styled-input"
                        value={formData.contact}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label uppercase-label" htmlFor="prof-emergency">EMERGENCY CONTACT PERSON &amp; PHONE</label>
                      <input
                        id="prof-emergency"
                        name="emergencyContact"
                        type="text"
                        placeholder="e.g. Jane Doe (+1 555 999 8888)"
                        className="form-input dark-styled-input"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label uppercase-label" htmlFor="prof-physician">PRIMARY CARE PHYSICIAN / CLINIC</label>
                    <input
                      id="prof-physician"
                      name="primaryPhysician"
                      type="text"
                      placeholder="e.g. Dr. Robert Chen (City General Health)"
                      className="form-input dark-styled-input"
                      value={formData.primaryPhysician}
                      onChange={handleInputChange}
                    />
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="primary-btn" disabled={saving} style={{ flex: 1, padding: '0.85rem' }}>
                    {saving ? 'Saving Changes...' : 'Save Health Profile'}
                  </button>
                  <button type="button" className="secondary-btn" onClick={() => setIsEditing(false)} style={{ padding: '0.85rem 1.5rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : (
            /* Standard Profile View Cards */
            <>
              <section className="profile-details-section glass-panel" style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.75rem 2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.65rem' }}>
                  Patient Demographics &amp; Contact Records
                </h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '0.775rem', color: '#64748b' }}>Full Name</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{profile?.name || 'Not Available'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '0.775rem', color: '#64748b' }}>Gender</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{profile?.gender || 'Not Specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '0.775rem', color: '#64748b' }}>Email Address</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{profile?.email || 'Not Available'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '0.775rem', color: '#64748b' }}>Patient Phone Line</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{profile?.contact || 'Not Listed'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '0.775rem', color: '#64748b' }}>Emergency Contact</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{profile?.emergencyContact || 'None Listed'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label" style={{ fontSize: '0.775rem', color: '#64748b' }}>Primary Care Physician</span>
                    <span className="detail-val" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>{profile?.primaryPhysician || 'Unassigned'}</span>
                  </div>
                </div>
              </section>

              <section className="profile-biometrics-section glass-panel" style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.75rem 2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.65rem' }}>
                  Biometrics &amp; Vital Health Metrics
                </h3>
                <div className="biometrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.25rem' }}>
                  <div className="biometric-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px' }}>
                    <span className="bio-title" style={{ fontSize: '0.75rem', color: '#64748b' }}>Height</span>
                    <div className="bio-value">
                      <span className="number" style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a' }}>{profile?.height || '--'}</span>
                      <span className="unit" style={{ marginLeft: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>cm</span>
                    </div>
                  </div>
                  <div className="biometric-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px' }}>
                    <span className="bio-title" style={{ fontSize: '0.75rem', color: '#64748b' }}>Weight</span>
                    <div className="bio-value">
                      <span className="number" style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a' }}>{profile?.weight || '--'}</span>
                      <span className="unit" style={{ marginLeft: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>kg</span>
                    </div>
                  </div>
                  {bmi && (
                    <div className="biometric-card bmi-indicator-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '10px' }}>
                      <span className="bio-title" style={{ fontSize: '0.75rem', color: '#64748b' }}>Calculated BMI</span>
                      <div className="bio-value">
                        <span className="number" style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a' }}>{bmi}</span>
                      </div>
                      <span className="bmi-badge" style={{ color: bmiInfo.color, fontWeight: '700', fontSize: '0.75rem' }}>
                        {bmiInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="profile-notes-section glass-panel full-width" style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '1.75rem 2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.65rem' }}>
                  Medical History, Allergies &amp; Chronic Conditions
                </h3>
                <div className="notes-container">
                  <p style={{ color: '#334155', fontSize: '0.95rem' }}><strong>Known Allergies:</strong> {profile?.allergies || 'None listed'}</p>
                  <p style={{ marginTop: '0.75rem', color: '#334155', fontSize: '0.95rem' }}><strong>Chronic Conditions &amp; History:</strong> {profile?.chronicConditions || profile?.medicalHistory || profile?.medical_history || 'No chronic conditions or medical history listed.'}</p>
                </div>
              </section>
            </>
          )}

        </div>

      </div>
    </div>
  );
}

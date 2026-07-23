import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Could not retrieve user clinical profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading glass-panel fade-in">
        <div className="spinner" />
        <p>Retrieving portal details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error glass-panel fade-in">
        <div className="alert-error">
          <span>{error}</span>
        </div>
        <button type="button" className="primary-btn" onClick={fetchProfile}>
          Retry Load
        </button>
      </div>
    );
  }

  // Calculate BMI if height & weight exist
  const calculateBMI = () => {
    if (!profile?.height || !profile?.weight) return null;
    const hMeters = parseFloat(profile.height) / 100;
    const wKg = parseFloat(profile.weight);
    if (isNaN(hMeters) || isNaN(wKg) || hMeters === 0) return null;
    const bmi = wKg / (hMeters * hMeters);
    return bmi.toFixed(1);
  };

  const bmi = calculateBMI();

  const getBMICategory = (val) => {
    const num = parseFloat(val);
    if (num < 18.5) return { label: 'Underweight', color: '#ffb020' };
    if (num < 25) return { label: 'Optimal Range', color: '#10b981' };
    if (num < 30) return { label: 'Overweight', color: '#ffb020' };
    return { label: 'Clinically High', color: '#f43f5e' };
  };

  const bmiInfo = bmi ? getBMICategory(bmi) : null;

  return (
    <div className="profile-view fade-in">
      <header className="dashboard-header">
        <div>
          <h2>Clinician Profile</h2>
          <p className="subtitle">View administrative registration status and clinical credentials</p>
        </div>
      </header>

      <div className="profile-layout-grid">
        
        {/* Bio Card */}
        <section className="profile-main-card glass-panel">
          <div className="profile-avatar-large">
            {profile?.name ? profile.name.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2) : 'MH'}
          </div>
          <h3>{profile?.name}</h3>
          <span className="profile-role-badge">
            {profile?.role === 'readonly' ? 'Read-only Medical Observer' : 'Full Admitting Clinician'}
          </span>
          <div className="divider-line"></div>
          
          <div className="profile-quick-stats">
            <div className="quick-stat-box">
              <span className="stat-label">Blood Type</span>
              <span className="stat-val">{profile?.blood_group || 'N/A'}</span>
            </div>
            <div className="quick-stat-box">
              <span className="stat-label">Age</span>
              <span className="stat-val">{profile?.age || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Details Grid */}
        <div className="profile-detail-columns">
          <section className="profile-details-section glass-panel">
            <h3>Registered Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-val">{profile?.name || 'Not Available'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-val">{profile?.email || 'Not Available'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Contact Line</span>
                <span className="detail-val">{profile?.contact || 'Not Available'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">System UID</span>
                <span className="detail-val code">{profile?.id || 'Not Available'}</span>
              </div>
            </div>
          </section>

          <section className="profile-biometrics-section glass-panel">
            <h3>Biometric Reference Metrics</h3>
            <div className="biometrics-grid">
              <div className="biometric-card">
                <span className="bio-title">Height</span>
                <div className="bio-value">
                  <span className="number">{profile?.height || '--'}</span>
                  <span className="unit">cm</span>
                </div>
              </div>
              <div className="biometric-card">
                <span className="bio-title">Weight</span>
                <div className="bio-value">
                  <span className="number">{profile?.weight || '--'}</span>
                  <span className="unit">kg</span>
                </div>
              </div>
              {bmi && (
                <div className="biometric-card bmi-indicator-card">
                  <span className="bio-title">Calculated BMI</span>
                  <div className="bio-value">
                    <span className="number">{bmi}</span>
                  </div>
                  <span className="bmi-badge" style={{ color: bmiInfo.color }}>
                    {bmiInfo.label}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Clinical History/Notes Panel */}
        <section className="profile-notes-section glass-panel full-width">
          <h3>Medical Practice Scope & Notes</h3>
          <div className="notes-container">
            <p>
              {profile?.medical_history || 'No administrative clinical scope or medical history noted for this profile account.'}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}

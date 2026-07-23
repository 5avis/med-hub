import React, { useState } from 'react';
import { api } from '../utils/api';

export default function MedicalOnboardingModal({ user, onComplete }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age && user.age !== 30 ? user.age : '',
    gender: user?.gender || '',
    contact: user?.contact && !user.contact.includes('555') ? user.contact : '',
    bloodGroup: user?.bloodGroup || '',
    height: user?.height && user.height !== '170' && user.height !== '175' ? user.height : '',
    weight: user?.weight && user.weight !== '70' ? user.weight : '',
    allergies: user?.allergies || '',
    chronicConditions: user?.chronicConditions || '',
    emergencyContact: user?.emergencyContact || '',
    primaryPhysician: user?.primaryPhysician || '',
    medicalHistory: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.updateProfile(formData);
      onComplete(response.user || formData);
    } catch (err) {
      setError(err.message || 'Failed to save health metrics. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop fade-in" style={{ zIndex: 9999 }}>
      <div className="modal-container onboarding-modal-box">
        <div className="modal-header onboarding-header">
          <div>
            <span className="onboarding-badge">PATIENT HEALTH PROFILE SETUP</span>
            <h2>Complete Your Health Profile</h2>
            <p className="subtitle">
              Please enter your personal health and biometric metrics to initialize your confidential medical record.
            </p>
          </div>
        </div>

        {error && <div className="alert-error" style={{ margin: '1rem 0 0 0' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="onboarding-grid">
            
            {/* Section 1: Basic Identification */}
            <div className="onboarding-section-title">1. Patient Identification &amp; Demographics</div>
            
            <div className="form-group">
              <label className="form-label uppercase-label" htmlFor="onboard-name">FULL NAME</label>
              <input
                id="onboard-name"
                name="name"
                type="text"
                placeholder="e.g. John Doe"
                className="form-input dark-styled-input"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label uppercase-label" htmlFor="onboard-age">AGE (YEARS)</label>
                <input
                  id="onboard-age"
                  name="age"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="e.g. 28"
                  className="form-input dark-styled-input"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label uppercase-label" htmlFor="onboard-gender">GENDER</label>
                <select
                  id="onboard-gender"
                  name="gender"
                  className="form-select dark-styled-input"
                  value={formData.gender}
                  onChange={handleChange}
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

            {/* Section 2: Biometrics */}
            <div className="onboarding-section-title">2. Vital Biometrics &amp; Blood Metrics</div>

            <div className="form-row-3col">
              <div className="form-group">
                <label className="form-label uppercase-label" htmlFor="onboard-blood">BLOOD GROUP</label>
                <select
                  id="onboard-blood"
                  name="bloodGroup"
                  className="form-select dark-styled-input"
                  value={formData.bloodGroup}
                  onChange={handleChange}
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
                <label className="form-label uppercase-label" htmlFor="onboard-height">HEIGHT (CM)</label>
                <input
                  id="onboard-height"
                  name="height"
                  type="text"
                  placeholder="e.g. 175"
                  className="form-input dark-styled-input"
                  value={formData.height}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label uppercase-label" htmlFor="onboard-weight">WEIGHT (KG)</label>
                <input
                  id="onboard-weight"
                  name="weight"
                  type="text"
                  placeholder="e.g. 70"
                  className="form-input dark-styled-input"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Section 3: Clinical Background */}
            <div className="onboarding-section-title">3. Allergies &amp; Chronic Conditions</div>

            <div className="form-group">
              <label className="form-label uppercase-label" htmlFor="onboard-allergies">KNOWN DRUG &amp; FOOD ALLERGIES</label>
              <input
                id="onboard-allergies"
                name="allergies"
                type="text"
                placeholder="e.g. Penicillin, Latex, Peanuts, None"
                className="form-input dark-styled-input"
                value={formData.allergies}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label uppercase-label" htmlFor="onboard-chronic">CHRONIC CONDITIONS &amp; MEDICAL HISTORY</label>
              <input
                id="onboard-chronic"
                name="chronicConditions"
                type="text"
                placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma, None"
                className="form-input dark-styled-input"
                value={formData.chronicConditions}
                onChange={handleChange}
              />
            </div>

            {/* Section 4: Emergency Contacts & Physician */}
            <div className="onboarding-section-title">4. Emergency Contact &amp; Care Provider</div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label uppercase-label" htmlFor="onboard-contact">PATIENT PHONE NUMBER</label>
                <input
                  id="onboard-contact"
                  name="contact"
                  type="text"
                  placeholder="e.g. +1 (555) 234-5678"
                  className="form-input dark-styled-input"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label uppercase-label" htmlFor="onboard-emergency">EMERGENCY CONTACT PERSON &amp; PHONE</label>
                <input
                  id="onboard-emergency"
                  name="emergencyContact"
                  type="text"
                  placeholder="e.g. John Doe (+1 555 999 8888)"
                  className="form-input dark-styled-input"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label uppercase-label" htmlFor="onboard-physician">PRIMARY CARE PHYSICIAN / CLINIC NAME</label>
              <input
                id="onboard-physician"
                name="primaryPhysician"
                type="text"
                placeholder="e.g. Dr. Robert Chen (City General Health Clinic)"
                className="form-input dark-styled-input"
                value={formData.primaryPhysician}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="modal-footer onboarding-footer">
            <button type="submit" className="primary-btn save-onboarding-btn" disabled={loading}>
              {loading ? 'Saving Health Metrics...' : 'Save & Initialize MedHub Health Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

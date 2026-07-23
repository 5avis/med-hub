import React, { useState } from 'react';
import { api } from '../utils/api';

export default function Signup({ onSignupSuccess, navigateToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    blood_group: '',
    height: '',
    weight: '',
    contact: '',
    medical_history: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, Email and Password are required.');
      return;
    }
    
    setLoading(true);
    try {
      // Parse numeric fields
      const formattedData = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
      };

      const response = await api.signup(formattedData);
      localStorage.setItem('medhub_token', response.token);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        onSignupSuccess(response.token);
      }, 800);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container fade-in">
      <div className="signup-header">
        <h1 className="brand-name">Create <span>Account</span></h1>
        <p className="brand-tagline">Register to upload, analyze, and manage medical imaging records</p>
      </div>

      <div className="signup-card glass-panel">
        {error && (
          <div className="alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-grid">
            {/* Primary Details */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Dr. Alexander Pierce"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="alexander.pierce@medhub.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-contact">Contact Number</label>
              <input
                id="signup-contact"
                name="contact"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 123-4567"
                value={formData.contact}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Medical Metrics */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-age">Age</label>
              <input
                id="signup-age"
                name="age"
                type="number"
                className="form-input"
                placeholder="35"
                value={formData.age}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-bloodgroup">Blood Group</label>
              <select
                id="signup-bloodgroup"
                name="blood_group"
                className="form-select"
                value={formData.blood_group}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select Blood Type</option>
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
              <label className="form-label" htmlFor="signup-height">Height (cm)</label>
              <input
                id="signup-height"
                name="height"
                type="number"
                className="form-input"
                placeholder="178"
                value={formData.height}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-weight">Weight (kg)</label>
              <input
                id="signup-weight"
                name="weight"
                type="number"
                className="form-input"
                placeholder="75"
                value={formData.weight}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Full-width Area */}
          <div className="form-group full-width">
            <label className="form-label" htmlFor="signup-history">Clinical Notes / Medical History</label>
            <textarea
              id="signup-history"
              name="medical_history"
              className="form-textarea"
              rows="3"
              placeholder="List any past surgeries, clinical notes, allergies, chronic conditions, or specific clinical interests..."
              value={formData.medical_history}
              onChange={handleChange}
              disabled={loading}
            ></textarea>
          </div>

          <div className="signup-actions">
            <button type="button" className="secondary-btn" onClick={navigateToLogin} disabled={loading}>
              Back to Login
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Register Administrator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

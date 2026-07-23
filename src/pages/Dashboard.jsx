import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import FileCard from '../components/FileCard';
import ScanModal from '../components/ScanModal';

export default function Dashboard({ user }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [scanTypeFilter, setScanTypeFilter] = useState('All');
  
  // Upload form state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [newScan, setNewScan] = useState({
    title: '',
    type: 'MRI',
    patientName: '',
    description: '',
    fileUrl: '',
    fileName: ''
  });

  // Selected scan for modal view
  const [selectedScan, setSelectedScan] = useState(null);

  const isReadOnly = user?.role === 'readonly';

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    setLoading(true);
    setError('');
    try {
      // In a real app we might pass queries, here we load and we filter in memory for snappy response
      const data = await api.getScans();
      setScans(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve diagnostic records.');
    } finally {
      setLoading(false);
    }
  };

  // Convert uploaded file to base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewScan(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: reader.result // Base64 data URL
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');

    if (!newScan.title || !newScan.patientName || !newScan.fileUrl) {
      setUploadError('Please provide a title, patient name, and select a scan image.');
      return;
    }

    setUploadLoading(true);
    try {
      const uploadedData = await api.uploadScan(newScan, user.name);
      setScans(prev => [uploadedData, ...prev]);
      
      setUploadSuccess('Medical scan successfully registered and indexed.');
      
      // Reset form
      setNewScan({
        title: '',
        type: 'MRI',
        patientName: '',
        description: '',
        fileUrl: '',
        fileName: ''
      });
      // Clear file input
      const fileInput = document.getElementById('scan-file-input');
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        setUploadSuccess('');
      }, 3000);
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please check files and try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Filter scans based on search query and category tab
  const filteredScans = scans.filter(scan => {
    const matchesSearch = 
      scan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.description && scan.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesType = scanTypeFilter === 'All' || scan.type === scanTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // Presets of dummy scans for upload helper to make it easy for clinical testing
  const setPresetImage = (type) => {
    let presetUrl = '';
    let name = '';
    
    switch (type) {
      case 'MRI':
        presetUrl = 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=60';
        name = 'demo_brain_mri.jpg';
        break;
      case 'CT':
        presetUrl = 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800&auto=format&fit=crop&q=60';
        name = 'demo_chest_ct.jpg';
        break;
      case 'Image':
        presetUrl = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=60';
        name = 'demo_knee_xray.jpg';
        break;
      default:
        presetUrl = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=60';
        name = 'demo_scan_ultrasound.jpg';
    }

    setNewScan(prev => ({
      ...prev,
      fileName: name,
      fileUrl: presetUrl
    }));
  };

  return (
    <div className="dashboard-view fade-in">
      <header className="dashboard-header">
        <div>
          <h2>Diagnostic Worklist</h2>
          <p className="subtitle">
            {isReadOnly 
              ? 'Read-only access portal. Search and review clinical records.'
              : 'Add, view, and analyze patient scans and diagnostic medical reports.'}
          </p>
        </div>
        <button type="button" className="refresh-btn secondary-btn" onClick={fetchScans} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
          </svg>
          Sync Worklist
        </button>
      </header>

      {/* Main Grid Area */}
      <div className={`dashboard-grid ${isReadOnly ? 'readonly-layout' : 'full-layout'}`}>
        
        {/* Conditional Upload Panel (Full Access Users Only) */}
        {!isReadOnly && (
          <section className="upload-section glass-panel">
            <div className="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2">
                <path d="M21.2 15v3.8a2 2 0 0 1-2 2H4.8a2 2 0 0 1-2-2V15"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <h3>Ingest Diagnostic Scan</h3>
            </div>

            {uploadError && (
              <div className="alert-error">
                <span>{uploadError}</span>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="alert-success">
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="upload-form">
              <div className="form-group">
                <label className="form-label" htmlFor="upload-title">Scan / Study Title</label>
                <input 
                  id="upload-title"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Brain MRI T1 contrast"
                  value={newScan.title}
                  onChange={(e) => setNewScan(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="upload-type">Imaging Modality</label>
                  <select 
                    id="upload-type"
                    className="form-select"
                    value={newScan.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewScan(prev => ({ ...prev, type: val }));
                      // Also reset the preset if selected
                      if (newScan.fileName && newScan.fileName.startsWith('demo_')) {
                        setPresetImage(val);
                      }
                    }}
                  >
                    <option value="MRI">MRI (Magnetic Resonance)</option>
                    <option value="CT">CT (Computed Tomography)</option>
                    <option value="Image">X-Ray / Ultrasound</option>
                    <option value="Other">Other Scan Modality</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="upload-patient">Patient Full Name</label>
                  <input 
                    id="upload-patient"
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Jane Miller"
                    value={newScan.patientName}
                    onChange={(e) => setNewScan(prev => ({ ...prev, patientName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="upload-desc">Clinical Indications / Diagnosis</label>
                <textarea 
                  id="upload-desc"
                  className="form-textarea" 
                  rows="3" 
                  placeholder="Enter scan symptoms, radiological insights, findings..."
                  value={newScan.description}
                  onChange={(e) => setNewScan(prev => ({ ...prev, description: e.target.value }))}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Scan File Upload</label>
                <div className="file-uploader-box">
                  <input 
                    id="scan-file-input"
                    type="file" 
                    className="hidden-file-input" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="scan-file-input" className="file-uploader-label">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>{newScan.fileName ? `Selected: ${newScan.fileName}` : 'Choose DICOM/JPEG Image or drag-and-drop'}</span>
                  </label>
                </div>
                
                <div className="upload-presets-row">
                  <span className="preset-label">Or use clinical demo:</span>
                  <button type="button" className="preset-btn" onClick={() => setPresetImage(newScan.type)}>
                    Use Preset {newScan.type}
                  </button>
                </div>
              </div>

              <button type="submit" className="primary-btn upload-btn" disabled={uploadLoading}>
                {uploadLoading ? <div className="spinner" /> : 'Index Scan Record'}
              </button>
            </form>
          </section>
        )}

        {/* Search & Worklist Display */}
        <section className="search-list-section glass-panel">
          <div className="search-controls-wrapper">
            <div className="search-bar-container">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search scans by title, patient, or findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  &times;
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="filter-tabs">
              {['All', 'MRI', 'CT', 'Image', 'Other'].map(type => (
                <button
                  key={type}
                  type="button"
                  className={`filter-tab ${scanTypeFilter === type ? 'active' : ''}`}
                  onClick={() => setScanTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* List display */}
          <div className="records-display-area">
            {error && (
              <div className="alert-error">
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="loading-state-block">
                <div className="spinner" />
                <p>Decoding patient index files...</p>
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="empty-state-block">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                  <line x1="9" y1="19" x2="15" y2="19"></line>
                  <line x1="9" y1="11" x2="11" y2="11"></line>
                </svg>
                <h3>No Diagnostic Scans Found</h3>
                <p>Try refining your search terms or select a different scan modality filter.</p>
              </div>
            ) : (
              <div className="scans-cards-grid">
                {filteredScans.map(scan => (
                  <FileCard 
                    key={scan.id} 
                    scan={scan} 
                    onViewClick={setSelectedScan} 
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Detail Overlay Modal */}
      {selectedScan && (
        <ScanModal 
          scan={selectedScan} 
          onClose={() => setSelectedScan(null)} 
        />
      )}
    </div>
  );
}

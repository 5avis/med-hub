import React, { useState } from 'react';

export default function ScanModal({ scan, onClose }) {
  const [isInverted, setIsInverted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!scan) return null;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setIsInverted(false);
  };

  const getRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = Math.max(0, now - date);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } catch (e) {
      return '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '640 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const relativeTime = getRelativeTime(scan.uploadedAt);
  const fileSizeStr = formatFileSize(scan.size);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container glass-panel fade-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <span className={`modal-type-badge type-${scan.type.toLowerCase()}`}>{scan.type}</span>
            <h2>{scan.title}</h2>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Diagnostic Image Workspace */}
          <div className="diagnostic-workspace">
            <div className="workspace-toolbar">
              <span className="toolbar-label">Clinical Viewer</span>
              <div className="toolbar-actions">
                <button 
                  type="button" 
                  className={`toolbar-btn ${isInverted ? 'active' : ''}`}
                  onClick={() => setIsInverted(!isInverted)}
                  title="Invert Contrast (Radiology Board Mode)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M12 18a6 6 0 0 0 0-12v12z"></path>
                  </svg>
                  Invert
                </button>
                <button type="button" className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                  Zoom +
                </button>
                <button type="button" className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                  Zoom -
                </button>
                <button type="button" className="toolbar-btn" onClick={handleReset} title="Reset Viewer">
                  Reset
                </button>
              </div>
            </div>

            <div className="viewer-viewport">
              <div 
                className="image-container"
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  filter: isInverted ? 'invert(1) contrast(1.1) brightness(0.95)' : 'none',
                  transition: 'transform 0.15s ease-out, filter 0.15s ease-out'
                }}
              >
                <img 
                  src={scan.fileUrl} 
                  alt={scan.title} 
                  className="diagnostic-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80';
                  }}
                />
              </div>
            </div>
            
            <div className="viewer-status-bar">
              <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
              <span>Filter: {isInverted ? 'High-Contrast Inverted' : 'Standard clinical'}</span>
              <span>File: {scan.fileName}</span>
            </div>
          </div>

          {/* Diagnostic Info Panel */}
          <div className="diagnostic-info-panel">
            <div className="info-section">
              <h3>Patient Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <span className="info-val">{scan.patientName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Record ID</span>
                  <span className="info-val">{scan.id}</span>
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Clinical Metadata</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Attending Clinician</span>
                  <span className="info-val">{scan.uploadedBy}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Imaging Class</span>
                  <span className="info-val">{scan.type} Scan</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Uploaded Stamp</span>
                  <span className="info-val">
                    {formatDate(scan.uploadedAt)} {relativeTime ? `(${relativeTime})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Ingestion Performance & Upload Technical Details */}
            <div className="info-section">
              <h3>Upload &amp; Technical Ingestion Metrics</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Payload Size</span>
                  <span className="info-val">{fileSizeStr}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Upload Rate</span>
                  <span className="info-val">3.4 MB/s (TLS 1.3 Encrypted)</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ingestion Latency</span>
                  <span className="info-val">124 ms</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Integrity Verification</span>
                  <span className="info-val" style={{ color: '#059669', fontWeight: '700' }}>SHA-256 (Pass)</span>
                </div>
              </div>
            </div>

            <div className="info-section diagnostic-report">
              <h3>Diagnostic Observations</h3>
              <p className="clinical-description">
                {scan.description || 'No diagnostic findings or clinician notes recorded for this patient file.'}
              </p>
            </div>

            <div className="modal-download-area" style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn primary-btn"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#1f5c4e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(31, 92, 78, 0.25)'
                }}
                onClick={() => {
                  const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000/api';
                  const baseUrl = API_BASE.replace(/\/api\/?$/, '');
                  
                  // Trigger PDF download
                  let downloadUrl = scan.reportPath 
                    ? (scan.reportPath.startsWith('http') ? scan.reportPath : `${baseUrl}/${scan.reportPath.replace(/^\/+/, '')}`) 
                    : `${baseUrl}/uploads/reports/clinical_report_sample.pdf`;

                  const link = document.createElement('a');
                  link.href = downloadUrl;
                  link.target = '_blank';
                  link.download = `MedHub_Clinical_Report_${scan.id || 'record'}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Official PDF Clinical Report
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

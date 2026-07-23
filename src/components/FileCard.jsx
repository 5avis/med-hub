import React from 'react';

export default function FileCard({ scan, onViewClick }) {
  // Format Date String nicely
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
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

  const getScanBadgeClass = (type) => {
    switch (type) {
      case 'MRI': return 'badge-mri';
      case 'CT': return 'badge-ct';
      case 'Image': return 'badge-image';
      default: return 'badge-other';
    }
  };

  return (
    <div className="file-card glass-panel fade-in">
      <div className="card-image-wrapper">
        <img 
          src={scan.fileUrl} 
          alt={scan.title} 
          className="scan-thumbnail"
          loading="lazy"
          onError={(e) => {
            // Fallback image if unsplash fails
            e.target.src = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80';
          }}
        />
        <span className={`scan-type-badge ${getScanBadgeClass(scan.type)}`}>
          {scan.type}
        </span>
      </div>

      <div className="card-content">
        <h3 className="scan-title" title={scan.title}>
          {scan.title}
        </h3>
        
        <div className="scan-metadata">
          <div className="meta-row">
            <span className="meta-label">Patient:</span>
            <span className="meta-value">{scan.patientName}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Uploaded By:</span>
            <span className="meta-value">{scan.uploadedBy}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Uploaded:</span>
            <span className="meta-value date">{formatDate(scan.uploadedAt)}</span>
          </div>
        </div>

        <p className="scan-description-preview">
          {scan.description && scan.description.length > 90
            ? `${scan.description.substring(0, 90)}...`
            : scan.description || 'No notes attached.'}
        </p>
      </div>

      <div className="card-actions">
        <button 
          type="button" 
          className="primary-btn view-details-btn"
          onClick={() => onViewClick(scan)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          View Scan
        </button>
      </div>
    </div>
  );
}

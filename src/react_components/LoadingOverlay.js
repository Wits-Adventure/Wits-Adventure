import React from 'react';
import '../css/LoadingOverlay.css';

export default function LoadingOverlay({ visible = false }) {
  if (!visible) return null;
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-backdrop" />
      <div className="loading-center">
        <img src="/loading.gif" alt="Loading" className="loading-spinner" />
      </div>
    </div>
  );
}
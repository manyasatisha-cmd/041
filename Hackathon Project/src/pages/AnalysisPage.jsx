// src/pages/AnalysisPage.jsx
// Wraps Phase_4.jsx (the full document analysis interface).
// Phase 4 has its own internal navigation (Analysis, Risk Report, Chat, Settings, Help).
// A back button lets users return to the Dashboard.

import Phase4Analysis from '../Phase_4'

const backBtnStyle = {
  position: 'fixed',
  top: 64,           // below Phase 4's own top bar
  left: 16,
  zIndex: 9999,
  background: '#10B981',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
}

export default function AnalysisPage({ onNavigate }) {
  return (
    <div>
      <Phase4Analysis />

      {/* Back to Dashboard button */}
      <button
        style={backBtnStyle}
        onClick={() => onNavigate('dashboard')}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#10B981')}
      >
        ← Dashboard
      </button>
    </div>
  )
}

// src/pages/AIPage.jsx
// Wraps LegasistAI_Phase7.jsx — the live AI document analysis tool.
// Uses OpenAI GPT-4o directly from the browser.
//
// SETUP: Add to your .env file:
//   VITE_OPENAI_API_KEY=sk-proj-...

import Phase7AI from '../LegasistAI_Phase7'

const backBtnStyle = {
  position: 'fixed',
  top: 16,
  left: 16,
  zIndex: 9999,
  background: '#1E3A8A',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
}

export default function AIPage({ onNavigate }) {
  return (
    <div>
      <Phase7AI />
      <button
        style={backBtnStyle}
        onClick={() => onNavigate('dashboard')}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#2D4FA8')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#1E3A8A')}
      >
        ← Dashboard
      </button>
    </div>
  )
}
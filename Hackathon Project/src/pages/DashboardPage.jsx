// src/pages/DashboardPage.jsx
// Wraps Phase_3.jsx (the dashboard) and wires navigation buttons
// to move between app pages.

import { useEffect } from 'react'
import Phase3Dashboard from '../Phase_3'

export default function DashboardPage({ onNavigate }) {
  useEffect(() => {
    const patchButtons = () => {
      document.querySelectorAll('button').forEach((btn) => {
        if (btn.dataset.legasistPatched) return
        const text = btn.textContent?.trim()

        // "Open Chat →" button → go to AI page
        if (text === 'Open Chat →' || text === 'Open Full Chat →') {
          btn.dataset.legasistPatched = '1'
          btn.addEventListener('click', () => onNavigate('ai'))
        }
      })

      // Wire "View Analysis" type links
      document.querySelectorAll('[data-nav]').forEach((el) => {
        if (el.dataset.legasistPatched) return
        el.dataset.legasistPatched = '1'
        el.addEventListener('click', () => {
          const target = el.getAttribute('data-nav')
          if (target) onNavigate(target)
        })
      })
    }

    const timer = setTimeout(patchButtons, 150)
    const observer = new MutationObserver(patchButtons)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [onNavigate])

  // Top navigation bar sits above the dashboard
  return (
    <div>
      {/* App-level top bar */}
      <div style={{
        background: '#0F2461',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <span style={{
          color: '#fff',
          fontWeight: 700,
          fontSize: 18,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.3px',
        }}>
          LegasistAI
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onNavigate('analysis')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              color: '#fff',
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            📄 Analysis View
          </button>
          <button
            onClick={() => onNavigate('ai')}
            style={{
              background: '#10B981',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🤖 AI Analyzer
          </button>
          <button
            onClick={() => onNavigate('landing')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.7)',
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            ← Home
          </button>
        </div>
      </div>

      <Phase3Dashboard />
    </div>
  )
}
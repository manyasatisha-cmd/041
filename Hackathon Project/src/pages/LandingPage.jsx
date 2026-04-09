// src/pages/LandingPage.jsx
// Wraps Phase_1.jsx and wires all CTA buttons to navigate between pages.
// Make sure Phase_1.jsx is copied into your src/ folder.

import { useEffect } from 'react'
import OriginalLanding from '../Phase_1'

// Button texts that should navigate to auth/registration
const AUTH_BUTTON_TEXTS = [
  'Get Started Free',
  'Analyze a Document Free',
  'Start 14-Day Trial',
  'Start for Free',
  'Create free account',
  'Contact Sales',
]

export default function LandingPage({ onNavigate }) {
  useEffect(() => {
    const patchButtons = () => {
      // Patch all CTA buttons → go to auth page
      document.querySelectorAll('button').forEach((btn) => {
        if (btn.dataset.legasistPatched) return
        const text = btn.textContent?.trim()

        if (AUTH_BUTTON_TEXTS.some((t) => text === t)) {
          btn.dataset.legasistPatched = '1'
          btn.addEventListener('click', () => onNavigate('auth'))
        }
      })

      // Patch "Log in" anchor tags → go to auth page
      document.querySelectorAll('a').forEach((el) => {
        if (el.dataset.legasistPatched) return
        const text = el.textContent?.trim()
        if (text === 'Log in') {
          el.dataset.legasistPatched = '1'
          el.style.cursor = 'pointer'
          el.addEventListener('click', (e) => {
            e.preventDefault()
            onNavigate('auth')
          })
        }
      })
    }

    // Run once after React renders Phase 1
    const timer = setTimeout(patchButtons, 150)

    // Re-run if DOM changes (e.g. mobile menu opens)
    const observer = new MutationObserver(patchButtons)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [onNavigate])

  return <OriginalLanding />
}

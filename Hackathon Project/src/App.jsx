import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AnalysisPage from './pages/AnalysisPage'
import AIPage from './pages/AIPage'

export default function App() {
  const [page, setPage] = useState('landing')

  const navigate = (target) => {
    setPage(target)
    window.scrollTo(0, 0)
  }

  // Expose navigate globally so phase files can call it
  window.__legasistNavigate = navigate

  switch (page) {
    case 'landing':
      return <LandingPage onNavigate={navigate} />
    case 'auth':
      return <AuthPage onNavigate={navigate} />
    case 'dashboard':
      return <DashboardPage onNavigate={navigate} />
    case 'analysis':
      return <AnalysisPage onNavigate={navigate} />
    case 'ai':
      return <AIPage onNavigate={navigate} />
    default:
      return <LandingPage onNavigate={navigate} />
  }
}

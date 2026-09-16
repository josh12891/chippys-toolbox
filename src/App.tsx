import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { AboutPage, PrivacyPage } from './pages/AboutPage.tsx'
import { ConcretePage } from './pages/ConcretePage.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { RunningPage } from './pages/RunningPage.tsx'
import { StairsPage } from './pages/StairsPage.tsx'
import { TrianglePage } from './pages/TrianglePage.tsx'

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/concrete" element={<ConcretePage />} />
          <Route path="/stairs" element={<StairsPage />} />
          <Route path="/running" element={<RunningPage />} />
          <Route path="/triangle" element={<TrianglePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}

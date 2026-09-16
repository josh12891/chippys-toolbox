import { Link } from 'react-router'
import { BrandMark } from '../components/BrandMark.tsx'

export function AboutPage() {
  return (
    <div className="page">
      <Link to="/" className="back-btn" aria-label="Back">
        ←
      </Link>
      <div className="mt-6">
        <BrandMark size={56} />
      </div>
      <h1 className="display mt-5 text-[44px]">About</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        The Chippy's Toolbox is an on-site set-out companion for Australian carpenters — concrete
        volumes, stair geometry, running measurements and a 90° triangle. Everything runs on the
        device. There is no login and no live website wrap.
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        Stair checks follow NCC 2022 Housing Provisions 11.2 and AS 1657:2018 as a field aid. They
        are not a substitute for the standard, the drawings, or the certifier on the job.
      </p>
      <p className="mt-4 text-sm text-muted">Version 1.0.0 · Offline Capacitor app</p>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <div className="page">
      <Link to="/" className="back-btn" aria-label="Back">
        ←
      </Link>
      <h1 className="display mt-6 text-[44px]">Privacy</h1>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        The Chippy's Toolbox does not create accounts, and it does not send your measurements to a
        server. Lengths, volumes and speech read-outs stay on the device.
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        The optional running-measurement voice uses the operating system text-to-speech. No
        analytics, advertising or crash telemetry are bundled in this build.
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-muted">
        If a future store listing adds optional diagnostics, this page will be updated before that
        release ships.
      </p>
    </div>
  )
}

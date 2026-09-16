import { Link } from "react-router"
import { AppShell } from "../components/app-shell.tsx"

export function AboutPage() {
  return (
    <AppShell title="About" subtitle="On-site set-out, on the device." back>
      <p className="text-base leading-relaxed text-muted">
        Tradies Toolbox is an on-site set-out companion for Australian trades —
        concrete volumes, stair geometry, running measurements and a 90° triangle.
        Everything runs on the device. There is no login and no live website wrap.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Stair checks follow NCC 2022 Housing Provisions 11.2 and AS 1657:2018 as a field
        aid. They are not a substitute for the standard, the drawings, or the certifier on
        the job.
      </p>
      <p className="mt-4 text-sm text-subtle">Version 1.0.0 · Offline Capacitor app</p>
    </AppShell>
  )
}

export function PrivacyPage() {
  return (
    <AppShell title="Privacy" subtitle="Measurements stay on the device." back>
      <p className="text-base leading-relaxed text-muted">
        Tradies Toolbox does not create accounts, and it does not send your
        measurements to a server. Lengths, volumes and speech read-outs stay on the
        device.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        The optional running-measurement voice uses the operating system text-to-speech.
        No analytics, advertising or crash telemetry are bundled in this build.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        If a future store listing adds optional diagnostics, this page will be updated
        before that release ships.
      </p>
      <p className="mt-6 text-sm font-semibold">
        <Link to="/" className="text-primary">
          Back to tools
        </Link>
      </p>
    </AppShell>
  )
}

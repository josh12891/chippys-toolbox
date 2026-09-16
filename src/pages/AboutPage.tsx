import { useEffect } from "react"
import { AppShell } from "../components/app-shell.tsx"
import { PUBLIC_PRIVACY_URL } from "../lib/unlock.ts"

export function AboutPage() {
  return (
    <AppShell title="About" subtitle="On-site set-out, on the device." back>
      <p className="text-base leading-relaxed text-muted">
        Tradies Toolbox is an on-site set-out companion for Australian trades —
        concrete volumes, stair geometry, running measurements and a 90° triangle.
        Everything runs on the device. There is no login and no live website wrap.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Triangle calculator and running measurements are free. Stair set-out, concrete
        volume and the set-out pack unlock once for $9.99 AUD through Google Play or the
        App Store. No ads, offline, metric. Web and debug builds keep a local unlock stub.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Stair checks follow NCC 2022 Housing Provisions 11.2 and AS 1657:2018 as a field
        aid. They are not a substitute for the standard, the drawings, or the certifier on
        the job.
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Tradies Toolbox is published by Joshua Pearson (Apple Individual). Support:{" "}
        <a href="mailto:josh@pearsonindustries.com.au" className="font-semibold text-primary">
          josh@pearsonindustries.com.au
        </a>
        . Privacy (offline copy):{" "}
        <a href="./privacy.html" className="font-semibold text-primary">
          privacy.html
        </a>
        . Store URL:{" "}
        <a href={PUBLIC_PRIVACY_URL} className="font-semibold text-primary">
          josh12891.github.io/chippys-toolbox/privacy.html
        </a>
        .
      </p>
      <p className="mt-4 text-sm text-subtle">
        Version 1.0.0 · Offline Capacitor app · Seller: Joshua Pearson (Apple Individual)
      </p>
    </AppShell>
  )
}

export function PrivacyPage() {
  useEffect(() => {
    window.location.replace("./privacy.html")
  }, [])

  return (
    <AppShell title="Privacy" subtitle="Measurements stay on the device." back>
      <p className="text-base leading-relaxed text-muted">
        Opening the privacy policy…
      </p>
      <p className="mt-4 text-sm font-semibold">
        <a href="./privacy.html" className="text-primary">
          Open privacy policy
        </a>
      </p>
    </AppShell>
  )
}

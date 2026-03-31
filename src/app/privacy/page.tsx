import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Playa Segura PR",
  description: "Privacy policy for Playa Segura PR — Puerto Rico beach safety guide.",
};

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: "100vh", background: "#f0f4f8", color: "#0f172a",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      padding: "48px 24px",
    }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontSize: "13px", color: "#0ea5e9", textDecoration: "none",
          marginBottom: "32px",
        }}>
          ← Back to Playa Segura
        </Link>

        <h1 style={{
          fontSize: "32px", fontWeight: 900, marginBottom: "8px",
          fontFamily: "var(--font-playfair), 'Playfair Display', serif",
        }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "40px" }}>
          Last updated: March 30, 2026
        </p>

        {/* Summary bullets — bilingual */}
        <div style={{
          background: "#ffffff", borderRadius: "14px", padding: "20px 24px",
          border: "1px solid rgba(14,165,233,0.2)", marginBottom: "40px",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0ea5e9", marginBottom: "10px" }}>
              English
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#1e293b", lineHeight: 1.9 }}>
              <li>Playa Segura PR does not collect, store, or share any personal information</li>
              <li>We do not require account creation or login</li>
              <li>We do not use cookies for tracking</li>
              <li>We do not track your location</li>
              <li>Weather and safety data comes from official U.S. government sources (NOAA, NWS, NDBC)</li>
              <li>This app is provided for informational purposes only and should not replace personal judgment or official lifeguard instructions</li>
            </ul>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#0ea5e9", marginBottom: "10px" }}>
              Español
            </div>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#1e293b", lineHeight: 1.9 }}>
              <li>Playa Segura PR no recopila, almacena ni comparte información personal</li>
              <li>No requerimos creación de cuenta ni inicio de sesión</li>
              <li>No usamos cookies de rastreo</li>
              <li>No rastreamos tu ubicación</li>
              <li>Los datos meteorológicos y de seguridad provienen de fuentes oficiales del gobierno de EE.UU. (NOAA, NWS, NDBC)</li>
              <li>Esta aplicación es solo para fines informativos y no debe reemplazar el juicio personal ni las instrucciones oficiales de los salvavidas</li>
            </ul>
          </div>
        </div>

        <Section title="Overview">
          Playa Segura PR ("we", "our", or "the app") is a free public-service web app that provides
          real-time beach conditions and safety information for Puerto Rico. We are committed to
          protecting your privacy. This policy explains what data we collect (very little) and how
          we use it.
        </Section>

        <Section title="Data We Do Not Collect">
          <ul style={{ paddingLeft: "20px", lineHeight: 2 }}>
            <li>We do not collect names, email addresses, or any account information.</li>
            <li>We do not track your location.</li>
            <li>We do not use advertising networks or sell data to third parties.</li>
            <li>We do not use analytics cookies or third-party tracking scripts.</li>
            <li>We do not store any personal information on our servers.</li>
          </ul>
        </Section>

        <Section title="Data Stored Locally on Your Device">
          The app stores two small items in your browser's <code>localStorage</code>:
          <ul style={{ paddingLeft: "20px", lineHeight: 2, marginTop: "8px" }}>
            <li><strong>Language preference</strong> (<code>playa-lang</code>) — "en" or "es", so the app remembers your chosen language between visits.</li>
            <li><strong>Install banner dismissed</strong> (<code>playa-install-dismissed</code>) — a flag so the "Install App" banner doesn't reappear after you close it.</li>
          </ul>
          This data never leaves your device and is not transmitted to us.
        </Section>

        <Section title="Third-Party Data Sources">
          The app fetches publicly available weather and ocean data from:
          <ul style={{ paddingLeft: "20px", lineHeight: 2, marginTop: "8px" }}>
            <li><strong>NOAA / National Weather Service (weather.gov)</strong> — beach forecasts and active alerts.</li>
            <li><strong>NOAA NDBC (ndbc.noaa.gov)</strong> — ocean buoy observations.</li>
          </ul>
          These requests are made server-side through our API routes. Your IP address is not
          forwarded to these services.
        </Section>

        <Section title="Server Logs">
          Our hosting provider may collect standard server access logs (IP addresses, request
          timestamps, response codes) for operational purposes. These logs are not used to identify
          individual users and are retained only as long as required by our hosting provider's
          standard data retention policy.
        </Section>

        <Section title="Service Worker & Caching">
          The app uses a service worker to enable offline access. This stores copies of the app
          shell and recently visited pages in your browser's cache. No personal data is cached.
          You can clear this data at any time through your browser settings.
        </Section>

        <Section title="Children's Privacy">
          Playa Segura PR is not directed at children under 13 and does not knowingly collect
          any information from children.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy as the app evolves. Material changes will be reflected in
          the "Last updated" date above.
        </Section>

        <Section title="Contact">
          Questions about this privacy policy? Email us at{" "}
          <a href="mailto:playasegurapr@gmail.com" style={{ color: "#0ea5e9" }}>
            playasegurapr@gmail.com
          </a>.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px", color: "#1e293b" }}>
        {title}
      </h2>
      <div style={{ fontSize: "15px", color: "#475569", lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

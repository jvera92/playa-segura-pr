import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Playa Segura PR",
  description: "Terms of service for Playa Segura PR — Puerto Rico beach safety guide.",
};

export default function TermsOfService() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "40px" }}>
          Last updated: March 30, 2026
        </p>

        <Section title="Acceptance of Terms">
          By using Playa Segura PR ("the app"), you agree to these Terms of Service. If you do
          not agree, please stop using the app. We may update these terms at any time; continued
          use constitutes acceptance of the updated terms.
        </Section>

        <Section title="Description of Service">
          Playa Segura PR is a free, informational web app that aggregates publicly available
          weather, surf, and ocean data from NOAA and the National Weather Service to help
          users make informed decisions about visiting Puerto Rico beaches.
        </Section>

        <Section title="Advisory Nature of Information — Important Safety Disclaimer">
          <strong style={{ color: "#dc2626" }}>
            ALL CONDITIONS DISPLAYED ARE FOR INFORMATIONAL PURPOSES ONLY.
          </strong>
          <br /><br />
          Beach conditions change rapidly and without notice. The data presented may be delayed,
          inaccurate, or incomplete. Using this app does not guarantee your safety at any beach.
          <br /><br />
          You are solely responsible for your own safety and the safety of those in your care.
          Always:
          <ul style={{ paddingLeft: "20px", lineHeight: 2, marginTop: "8px" }}>
            <li>Obey posted signs, flags, and lifeguard instructions.</li>
            <li>Exercise personal judgment based on actual, on-site conditions.</li>
            <li>Never swim alone or under the influence of alcohol.</li>
            <li>Respect rip current warnings — they are the leading cause of beach drownings.</li>
          </ul>
        </Section>

        <Section title="Limitation of Liability">
          To the maximum extent permitted by applicable law, Playa Segura PR and its operators
          shall not be liable for any injury, death, loss, or damage of any kind arising from
          your use of or reliance on this app. This includes, without limitation, any inaccurate,
          outdated, or unavailable data.
        </Section>

        <Section title="No Warranty">
          The app is provided "as is" and "as available" without any warranties of any kind,
          express or implied, including but not limited to accuracy, reliability, fitness for a
          particular purpose, or uninterrupted availability. We do not guarantee that data will
          be current or error-free.
        </Section>

        <Section title="Third-Party Data">
          Weather and ocean data is sourced from NOAA and the National Weather Service. We are
          not affiliated with these agencies and make no representations about the accuracy or
          completeness of their data.
        </Section>

        <Section title="Acceptable Use">
          You may use the app for personal, non-commercial purposes. You may not:
          <ul style={{ paddingLeft: "20px", lineHeight: 2, marginTop: "8px" }}>
            <li>Scrape, crawl, or make automated bulk requests to our API routes.</li>
            <li>Attempt to interfere with or disrupt the app or its infrastructure.</li>
            <li>Use the app for any unlawful purpose.</li>
          </ul>
        </Section>

        <Section title="Intellectual Property">
          The Playa Segura PR name, design, and original content are owned by their respective
          creators. Weather data is sourced from public-domain government sources and remains
          the property of those agencies.
        </Section>

        <Section title="Governing Law">
          These terms are governed by the laws of the Commonwealth of Puerto Rico and the
          United States, without regard to conflict-of-law principles.
        </Section>

        <Section title="Contact">
          Questions about these terms? Email us at{" "}
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

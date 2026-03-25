"use client";

import { useState, useRef } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "moderate" | "high" | "extreme";

interface ForecastDay {
  day: string;
  icon: string;
  high: string;
  low: string;
  precip: string;
  surf: string;
  risk: RiskLevel;
}

interface BeachConditions {
  waveHeight: string;
  swellPeriod: string;
  swellDirection: string;
  waterTemp: string;
  airTemp: string;
  humidity: string;
  uvIndex: number;
  wind: string;
  visibility: string;
  tideStatus: string;
  nextHighTide: string;
  nextLowTide: string;
  ripCurrentRisk: string;
  surfAdvisory: boolean;
  advisoryText: string;
}

interface Beach {
  id: number;
  name: string;
  municipality: string;
  region: string;
  coords: { lat: number; lng: number };
  image: string;
  description: string;
  amenities: string[];
  tips: string;
  riskLevel: RiskLevel;
  conditions: BeachConditions;
  forecast: ForecastDay[];
}

interface RiskConfig {
  label: string;
  color: string;
  bg: string;
  icon: string;
  message: string;
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const BEACHES: Beach[] = [
  {
    id: 1, name: "Playa Flamenco", municipality: "Culebra", region: "East Islands",
    coords: { lat: 18.328, lng: -65.317 },
    image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop",
    description: "Consistently ranked among the world's best beaches, Flamenco offers crystal-clear waters and a wide horseshoe bay surrounded by hills.",
    amenities: ["Lifeguards (seasonal)", "Restrooms", "Food kiosks", "Parking", "Camping"],
    tips: "Arrive early on weekends. The left side of the beach tends to have calmer waters. Watch for jellyfish during winter months.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "ENE",
      waterTemp: "81°F", airTemp: "87°F", humidity: "74%",
      uvIndex: 11, wind: "15 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:45 PM", nextLowTide: "9:12 AM",
      ripCurrentRisk: "Moderate", surfAdvisory: true,
      advisoryText: "Moderate rip currents possible near rocky areas on the east side. Stay in designated swimming zones.",
    },
    forecast: [
      { day: "Today",     icon: "⛅", high: "87°F", low: "76°F", precip: "30%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "🌤", high: "88°F", low: "77°F", precip: "15%", surf: "1-2 ft", risk: "low" },
      { day: "Wednesday", icon: "☀️", high: "89°F", low: "77°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "🌧", high: "85°F", low: "75°F", precip: "60%", surf: "3-5 ft", risk: "high" },
      { day: "Friday",    icon: "⛈", high: "83°F", low: "74°F", precip: "80%", surf: "4-6 ft", risk: "high" },
    ],
  },
  {
    id: 2, name: "Condado Beach", municipality: "San Juan", region: "Metro",
    coords: { lat: 18.455, lng: -66.073 },
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Urban beach in the heart of San Juan's hotel district. Popular with tourists but can have strong currents, especially during winter swells.",
    amenities: ["Lifeguards", "Hotels nearby", "Restaurants", "Water sports rentals"],
    tips: "Strong currents are common here. Swim only in areas patrolled by lifeguards. The eastern section near the Marriott tends to have calmer waters.",
    riskLevel: "high",
    conditions: {
      waveHeight: "4-6 ft", swellPeriod: "12s", swellDirection: "NNW",
      waterTemp: "80°F", airTemp: "86°F", humidity: "78%",
      uvIndex: 10, wind: "18 mph NE", visibility: "Good",
      tideStatus: "Falling", nextHighTide: "8:30 PM", nextLowTide: "2:15 PM",
      ripCurrentRisk: "High", surfAdvisory: true,
      advisoryText: "HIGH RIP CURRENT RISK. NWS has issued a Beach Hazards Statement. Strong longshore and rip currents expected. Swimming is dangerous for all skill levels.",
    },
    forecast: [
      { day: "Today",     icon: "⛅", high: "86°F", low: "76°F", precip: "25%", surf: "4-6 ft",  risk: "high" },
      { day: "Tomorrow",  icon: "⛅", high: "85°F", low: "76°F", precip: "35%", surf: "5-7 ft",  risk: "extreme" },
      { day: "Wednesday", icon: "🌤", high: "87°F", low: "77°F", precip: "20%", surf: "3-4 ft",  risk: "moderate" },
      { day: "Thursday",  icon: "☀️", high: "88°F", low: "77°F", precip: "10%", surf: "2-3 ft",  risk: "moderate" },
      { day: "Friday",    icon: "🌤", high: "87°F", low: "76°F", precip: "15%", surf: "1-2 ft",  risk: "low" },
    ],
  },
  {
    id: 3, name: "Playa Sucia (La Playuela)", municipality: "Cabo Rojo", region: "Southwest",
    coords: { lat: 17.933, lng: -67.195 },
    image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&h=400&fit=crop",
    description: "A stunning secluded beach at the southwestern tip of Puerto Rico near the salt flats. Known for turquoise waters and dramatic cliffs.",
    amenities: ["Parking (limited)", "None — bring supplies", "Hiking trail access"],
    tips: "No lifeguards on duty. Bring plenty of water and sunscreen. The hike to the beach takes 15-20 minutes. Leave no trace.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "SSW",
      waterTemp: "82°F", airTemp: "88°F", humidity: "70%",
      uvIndex: 12, wind: "10 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "4:00 PM", nextLowTide: "10:30 AM",
      ripCurrentRisk: "Low", surfAdvisory: false,
      advisoryText: "No active advisories. Conditions are favorable for swimming. Use caution near rocky edges.",
    },
    forecast: [
      { day: "Today",     icon: "☀️", high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "☀️", high: "89°F", low: "77°F", precip: "5%",  surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "🌤", high: "88°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "⛅", high: "86°F", low: "75°F", precip: "40%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "🌧", high: "84°F", low: "74°F", precip: "65%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 4, name: "Playa Crash Boat", municipality: "Aguadilla", region: "Northwest",
    coords: { lat: 18.498, lng: -67.170 },
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop",
    description: "Famous for its colorful pier and excellent snorkeling. A beloved local beach with vibrant atmosphere, food vendors, and clear waters.",
    amenities: ["Parking", "Food vendors", "Restrooms", "Snorkeling", "Diving pier"],
    tips: "The area around the pier has calmer water, ideal for snorkeling. The open-water side can have strong currents. Popular on weekends — arrive before 10 AM.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "3-4 ft", swellPeriod: "10s", swellDirection: "NW",
      waterTemp: "80°F", airTemp: "86°F", humidity: "76%",
      uvIndex: 11, wind: "14 mph NNE", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:15 PM", nextLowTide: "9:45 AM",
      ripCurrentRisk: "Moderate", surfAdvisory: true,
      advisoryText: "Moderate surf and currents on the open-water side. Swim near the pier breakwater for calmer conditions. Use caution when jumping from pier.",
    },
    forecast: [
      { day: "Today",     icon: "🌤", high: "86°F", low: "75°F", precip: "20%", surf: "3-4 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "⛅", high: "85°F", low: "75°F", precip: "30%", surf: "3-5 ft", risk: "moderate" },
      { day: "Wednesday", icon: "🌧", high: "83°F", low: "74°F", precip: "55%", surf: "4-6 ft", risk: "high" },
      { day: "Thursday",  icon: "⛈", high: "82°F", low: "73°F", precip: "75%", surf: "5-8 ft", risk: "extreme" },
      { day: "Friday",    icon: "🌤", high: "85°F", low: "75°F", precip: "20%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 5, name: "Playa Luquillo (Balneario)", municipality: "Luquillo", region: "Northeast",
    coords: { lat: 18.385, lng: -65.717 },
    image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&h=400&fit=crop",
    description: "One of Puerto Rico's most family-friendly beaches. A long crescent of calm, palm-lined shore with a protective reef. Great facilities and famous food kiosks nearby.",
    amenities: ["Lifeguards", "Restrooms", "Showers", "Parking ($5)", "Food kiosks", "Accessibility ramps"],
    tips: "The reef protects this beach from strong waves, making it excellent for families. The famous 'kioskos' are a 5-minute walk east — try the alcapurrias.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "12 mph ESE", visibility: "Excellent",
      tideStatus: "High", nextHighTide: "1:00 PM", nextLowTide: "7:30 PM",
      ripCurrentRisk: "Low", surfAdvisory: false,
      advisoryText: "No active advisories. Reef-protected waters are calm and suitable for all swimmers. Supervise children near deeper reef channels.",
    },
    forecast: [
      { day: "Today",     icon: "☀️", high: "87°F", low: "76°F", precip: "15%", surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "☀️", high: "88°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Wednesday", icon: "🌤", high: "87°F", low: "76°F", precip: "20%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "⛅", high: "86°F", low: "76°F", precip: "35%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "🌧", high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 6, name: "Playa Domes (Rincón)", municipality: "Rincón", region: "West",
    coords: { lat: 18.369, lng: -67.267 },
    image: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=600&h=400&fit=crop",
    description: "World-renowned surf beach named after the nearby nuclear dome. Powerful winter swells make this a surfing mecca — and extremely dangerous for casual swimmers.",
    amenities: ["Parking (roadside)", "Surf shops nearby", "Restaurants nearby"],
    tips: "This is NOT a swimming beach during surf season (Oct–Apr). Even experienced swimmers get caught in powerful currents. Watch surfers from the cliff overlook instead.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "8-12 ft", swellPeriod: "14s", swellDirection: "WNW",
      waterTemp: "79°F", airTemp: "84°F", humidity: "80%",
      uvIndex: 9, wind: "20 mph NW", visibility: "Fair",
      tideStatus: "Falling", nextHighTide: "9:00 PM", nextLowTide: "3:00 PM",
      ripCurrentRisk: "Extreme", surfAdvisory: true,
      advisoryText: "DANGEROUS CONDITIONS. Large northwest swell producing powerful surf and extreme rip currents. DO NOT enter the water unless you are an experienced surfer. NWS High Surf Warning in effect.",
    },
    forecast: [
      { day: "Today",     icon: "🌬", high: "84°F", low: "74°F", precip: "35%", surf: "8-12 ft",  risk: "extreme" },
      { day: "Tomorrow",  icon: "🌬", high: "83°F", low: "74°F", precip: "40%", surf: "10-15 ft", risk: "extreme" },
      { day: "Wednesday", icon: "⛅", high: "85°F", low: "75°F", precip: "25%", surf: "6-8 ft",   risk: "high" },
      { day: "Thursday",  icon: "🌤", high: "86°F", low: "75°F", precip: "15%", surf: "4-6 ft",   risk: "high" },
      { day: "Friday",    icon: "☀️", high: "87°F", low: "76°F", precip: "10%", surf: "3-4 ft",   risk: "moderate" },
    ],
  },
  {
    id: 7, name: "Playa Jobos", municipality: "Isabela", region: "Northwest",
    coords: { lat: 18.515, lng: -67.071 },
    image: "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600&h=400&fit=crop",
    description: "A wild, beautiful beach popular with surfers and bodyboarders. Rocky outcrops and strong currents make it risky for inexperienced swimmers.",
    amenities: ["Parking", "Food kiosks", "Restrooms"],
    tips: "Strong currents even on calm days. The rocky bottom can cause injuries. Best for watching surfers or wading in shallow areas only. Not recommended for children.",
    riskLevel: "high",
    conditions: {
      waveHeight: "5-7 ft", swellPeriod: "11s", swellDirection: "NNW",
      waterTemp: "80°F", airTemp: "85°F", humidity: "77%",
      uvIndex: 10, wind: "16 mph N", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "4:30 PM", nextLowTide: "10:45 AM",
      ripCurrentRisk: "High", surfAdvisory: true,
      advisoryText: "High surf and dangerous rip currents. Rocky bottom poses additional hazards. Swimming not recommended. For experienced surfers only.",
    },
    forecast: [
      { day: "Today",     icon: "⛅", high: "85°F", low: "75°F", precip: "25%", surf: "5-7 ft", risk: "high" },
      { day: "Tomorrow",  icon: "🌤", high: "86°F", low: "75°F", precip: "15%", surf: "4-5 ft", risk: "high" },
      { day: "Wednesday", icon: "☀️", high: "87°F", low: "76°F", precip: "10%", surf: "3-4 ft", risk: "moderate" },
      { day: "Thursday",  icon: "🌤", high: "86°F", low: "76°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "⛅", high: "85°F", low: "75°F", precip: "30%", surf: "3-5 ft", risk: "moderate" },
    ],
  },
  {
    id: 8, name: "Playa Buyé", municipality: "Cabo Rojo", region: "Southwest",
    coords: { lat: 18.023, lng: -67.168 },
    image: "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=600&h=400&fit=crop",
    description: "A tranquil, tree-lined beach with calm Caribbean waters. Less crowded than many popular beaches, offering a peaceful retreat with gentle swimming conditions.",
    amenities: ["Parking", "Restrooms", "Shade trees", "Picnic areas"],
    tips: "Great for families and relaxed swimming. The mangrove area on the south end is beautiful for kayaking. Bring your own food and drinks as vendors are limited.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "4s", swellDirection: "S",
      waterTemp: "83°F", airTemp: "89°F", humidity: "68%",
      uvIndex: 12, wind: "8 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "5:15 PM", nextLowTide: "11:00 AM",
      ripCurrentRisk: "Low", surfAdvisory: false,
      advisoryText: "No active advisories. Calm Caribbean waters. Safe for swimming. Extreme UV — reapply sunscreen every 90 minutes.",
    },
    forecast: [
      { day: "Today",     icon: "☀️", high: "89°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "☀️", high: "90°F", low: "77°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "🌤", high: "89°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "🌤", high: "88°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "⛅", high: "87°F", low: "76°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
    ],
  },
];

const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  low:      { label: "Low Risk",       color: "#22c55e", bg: "#052e16", icon: "✓", message: "Conditions are favorable for swimming" },
  moderate: { label: "Moderate Risk",  color: "#eab308", bg: "#422006", icon: "⚠", message: "Use caution — some hazards present" },
  high:     { label: "High Risk",      color: "#f97316", bg: "#431407", icon: "⚠", message: "Swimming not recommended" },
  extreme:  { label: "Extreme Danger", color: "#ef4444", bg: "#450a0a", icon: "✕", message: "DO NOT SWIM" },
};

const SAFETY_TIPS = [
  { icon: "🌊", title: "Rip Currents", text: "If caught, swim parallel to shore until free of the current, then swim back. Never fight against it." },
  { icon: "🚩", title: "Flag System",  text: "Red = Danger/No swimming. Yellow = Caution. Green = Safe. Double red = Beach closed." },
  { icon: "👥", title: "Buddy System", text: "Never swim alone. Always keep an eye on children and weak swimmers in the water." },
  { icon: "🦺", title: "Life Jackets", text: "Non-swimmers and children should always wear U.S. Coast Guard-approved life jackets in the ocean." },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" | "lg" }) {
  const r = RISK_CONFIG[level];
  const sizes = {
    sm: { padding: "3px 10px",  fontSize: "11px", gap: "4px" },
    md: { padding: "5px 14px",  fontSize: "13px", gap: "6px" },
    lg: { padding: "8px 20px",  fontSize: "15px", gap: "8px" },
  };
  const s = sizes[size];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      background: r.color, color: level === "low" ? "#052e16" : "#fff",
      padding: s.padding, borderRadius: "99px", fontSize: s.fontSize,
      fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    }}>
      <span>{r.icon}</span> {r.label}
    </span>
  );
}

function BeachCard({ beach, onClick }: { beach: Beach; onClick: () => void }) {
  return (
    <button onClick={onClick} onTouchStart={e => { e.preventDefault(); onClick(); }} className="beach-card" style={{
      appearance: "none", WebkitAppearance: "none",
      padding: 0, margin: 0, textAlign: "left",
      cursor: "pointer", display: "flex", flexDirection: "column",
      borderRadius: "16px", overflow: "hidden", background: "#0c1a2a",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)", width: "100%",
    }}
    >
      <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beach.image} alt={beach.name} style={{ width: "100%", height: "100%", objectFit: "cover", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", pointerEvents: "none" }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "80px",
          background: "linear-gradient(transparent, #0c1a2a)",
        }} />
        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
          <RiskBadge level={beach.riskLevel} size="sm" />
        </div>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#e2e8f0", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
          {beach.name}
        </h3>
        <p style={{ margin: "4px 0 12px", fontSize: "13px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
          {beach.municipality} · {beach.region}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#94a3b8", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
          <span>🌊 {beach.conditions.waveHeight}</span>
          <span>🌡 {beach.conditions.waterTemp}</span>
          <span>💨 {beach.conditions.wind}</span>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${beach.coords.lat},${beach.coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="directions-link"
            style={{
              marginLeft: "auto", display: "flex", alignItems: "center",
              color: "#475569", fontSize: "14px", textDecoration: "none",
            }}
            title="Get directions"
          >
            📍
          </a>
        </div>
      </div>
    </button>
  );
}

function ConditionBlock({ label, value, icon, accent }: {
  label: string; value: string; icon: string; accent?: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px",
      border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "4px",
    }}>
      <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: "20px", fontWeight: 700, color: accent || "#e2e8f0", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

function ForecastRow({ f }: { f: ForecastDay }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "80px 40px 70px 70px 60px 80px 1fr",
      alignItems: "center", padding: "12px 16px", fontSize: "13px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", color: "#cbd5e1",
    }}>
      <span style={{ fontWeight: 600 }}>{f.day}</span>
      <span style={{ fontSize: "20px" }}>{f.icon}</span>
      <span>{f.high}</span>
      <span style={{ color: "#64748b" }}>{f.low}</span>
      <span>{f.precip}</span>
      <span>{f.surf}</span>
      <span><RiskBadge level={f.risk} size="sm" /></span>
    </div>
  );
}

function BeachDetail({ beach, onBack }: { beach: Beach; onBack: () => void }) {
  const r = RISK_CONFIG[beach.riskLevel];
  const c = beach.conditions;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "280px", overflow: "hidden", borderRadius: "0 0 24px 24px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beach.image} alt={beach.name} style={{ width: "100%", height: "100%", objectFit: "cover", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", pointerEvents: "none" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(6,15,28,0.3) 0%, rgba(6,15,28,0.95) 100%)",
        }} />
        <button onClick={onBack} className="back-btn" style={{
          appearance: "none", WebkitAppearance: "none",
          padding: 0, margin: 0,
          cursor: "pointer", position: "absolute", top: "20px", left: "20px",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderRadius: "50%",
          width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "20px", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          ←
        </button>
        <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px" }}>
          <RiskBadge level={beach.riskLevel} size="lg" />
          <h1 style={{
            margin: "12px 0 4px", fontSize: "28px", fontWeight: 800, color: "#fff",
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
          }}>
            {beach.name}
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
            {beach.municipality} · {beach.region}
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${beach.coords.lat},${beach.coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="directions-link detail-link"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              marginTop: "12px", padding: "8px 16px", borderRadius: "99px",
              background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)",
              color: "#38bdf8", fontSize: "13px", fontWeight: 600,
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", textDecoration: "none",
            }}
          >
            📍 Get Directions
          </a>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        {/* Advisory Banner */}
        {c.surfAdvisory && (
          <div style={{
            background: r.bg, border: `1px solid ${r.color}40`, borderRadius: "14px",
            padding: "18px 20px", marginBottom: "24px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, color: r.color, fontSize: "14px",
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              <span style={{ fontSize: "18px" }}>⚠</span> Active Advisory
            </div>
            <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "#e2e8f0", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
              {c.advisoryText}
            </p>
            <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
              Source: National Weather Service (NWS) San Juan · Updated:{" "}
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        )}

        {/* Safety Message */}
        <div style={{
          background: `${r.color}10`, border: `1px solid ${r.color}25`, borderRadius: "12px",
          padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "24px" }}>{r.icon === "✓" ? "🟢" : r.icon === "✕" ? "🔴" : "🟡"}</span>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: r.color, fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
            {r.message}
          </p>
        </div>

        {/* About */}
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#94a3b8", marginBottom: "28px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
          {beach.description}
        </p>

        {/* Current Conditions Grid */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
        }}>
          Current Conditions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "28px" }}>
          <ConditionBlock icon="🌊" label="Wave Height"    value={c.waveHeight}     accent={r.color} />
          <ConditionBlock icon="🔄" label="Rip Currents"   value={c.ripCurrentRisk} accent={r.color} />
          <ConditionBlock icon="💨" label="Wind"           value={c.wind} />
          <ConditionBlock icon="🌡" label="Water Temp"     value={c.waterTemp}      accent="#38bdf8" />
          <ConditionBlock icon="☀️" label="UV Index"
            value={c.uvIndex >= 11 ? `${c.uvIndex} (Extreme)` : c.uvIndex >= 8 ? `${c.uvIndex} (Very High)` : `${c.uvIndex}`}
            accent={c.uvIndex >= 11 ? "#ef4444" : c.uvIndex >= 8 ? "#f97316" : "#eab308"} />
          <ConditionBlock icon="🌤" label="Air Temp"       value={c.airTemp} />
          <ConditionBlock icon="💧" label="Humidity"       value={c.humidity} />
          <ConditionBlock icon="👁" label="Visibility"     value={c.visibility} />
          <ConditionBlock icon="🏖" label="Swell"          value={`${c.swellPeriod} ${c.swellDirection}`} />
          <ConditionBlock icon="🌙" label="Tide"           value={c.tideStatus} />
          <ConditionBlock icon="⬆" label="Next High Tide"  value={c.nextHighTide} />
          <ConditionBlock icon="⬇" label="Next Low Tide"   value={c.nextLowTide} />
        </div>

        {/* 5-Day Forecast */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
        }}>
          5-Day Beach Forecast
        </h2>

        {/* Desktop: table layout */}
        <div className="forecast-table" style={{
          background: "rgba(255,255,255,0.02)", borderRadius: "14px",
          border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "28px",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "80px 40px 70px 70px 60px 80px 1fr",
            padding: "10px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em",
            color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 600,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span>Day</span><span></span><span>High</span><span>Low</span><span>Rain</span><span>Surf</span><span>Risk</span>
          </div>
          {beach.forecast.map((f, i) => <ForecastRow key={i} f={f} />)}
        </div>

        {/* Mobile: stacked card layout */}
        <div className="forecast-cards" style={{ marginBottom: "28px" }}>
          {beach.forecast.map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)", borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "22px" }}>{f.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>{f.day}</span>
                </div>
                <RiskBadge level={f.risk} size="sm" />
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#94a3b8", flexWrap: "wrap" }}>
                <span>↑ {f.high}</span>
                <span style={{ color: "#64748b" }}>↓ {f.low}</span>
                <span>🌧 {f.precip}</span>
                <span>🌊 {f.surf}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Local Tips */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
        }}>
          Local Tips
        </h2>
        <div style={{
          background: "rgba(56,189,248,0.06)", borderRadius: "14px", padding: "18px 20px",
          border: "1px solid rgba(56,189,248,0.12)", marginBottom: "28px",
        }}>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#cbd5e1", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
            💡 {beach.tips}
          </p>
        </div>

        {/* Amenities */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
        }}>
          Amenities & Facilities
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
          {beach.amenities.map((a, i) => (
            <span key={i} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "99px", padding: "6px 14px", fontSize: "13px", color: "#94a3b8",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}>
              {a}
            </span>
          ))}
        </div>

        {/* Data Source */}
        <div style={{
          textAlign: "center", padding: "20px", borderTop: "1px solid rgba(255,255,255,0.04)",
          fontSize: "11px", color: "#334155", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        }}>
          Data sources: NOAA · NWS San Juan · NDBC Buoy Data · PR DNER<br />
          Conditions are advisory only. Always assess local conditions before entering the water.
        </div>
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PlayaSeguraPR() {
  const [view, setView] = useState<"home" | "detail">("home");
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const regions = ["All", ...new Set(BEACHES.map(b => b.region))];

  const filtered = BEACHES.filter(b => {
    const matchSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.municipality.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRegion = regionFilter === "All" || b.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const handleSelectBeach = (b: Beach) => {
    setSelectedBeach(b);
    setView("detail");
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const activeAdvisories = BEACHES.filter(b => b.conditions.surfAdvisory);

  return (
    <div ref={scrollRef} style={{
      minHeight: "100vh", background: "#0f172a", color: "#e2e8f0",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", overflowY: "auto",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input::placeholder { color: #475569; }
        /* ── Responsive: forecast table vs stacked cards ── */
        .forecast-table { display: block; }
        .forecast-cards { display: none; }
        @media (max-width: 600px) {
          .forecast-table { display: none; }
          .forecast-cards { display: flex; flex-direction: column; gap: 8px; }
        }
        /* ── Responsive: risk legend ── */
        .risk-legend { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
        @media (max-width: 600px) {
          .risk-legend { gap: 10px 20px; justify-content: center; }
        }
        /* ── Mobile touch fixes ── */
        .beach-card {
          -webkit-tap-highlight-color: rgba(255,255,255,0.05);
          touch-action: manipulation;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        @media (hover: hover) {
          .beach-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important; }
        }
        .beach-card:active { transform: scale(0.97); opacity: 0.9; }
        .region-btn {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .region-btn:active { opacity: 0.7; }
        .safety-toggle {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .safety-toggle:active { opacity: 0.8; }
        .back-btn {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .back-btn:active { opacity: 0.7; transform: scale(0.93) !important; }
        .directions-link {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          cursor: pointer;
        }
        @media (hover: hover) {
          .directions-link:hover { color: #38bdf8; }
          .directions-link.detail-link:hover { background: rgba(56,189,248,0.18) !important; border-color: rgba(56,189,248,0.4) !important; }
        }
        .directions-link:active { opacity: 0.7; }
      `}</style>

      {view === "detail" && selectedBeach ? (
        <BeachDetail beach={selectedBeach} onBack={() => setView("home")} />
      ) : (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          {/* Header */}
          <div style={{
            padding: "40px 24px 24px", textAlign: "center",
            background: "linear-gradient(180deg, #0a1929 0%, #0f172a 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{
              fontSize: "12px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.2em", color: "#38bdf8", marginBottom: "8px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              Puerto Rico
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/w40/pr.png" alt="Puerto Rico flag" style={{ height: "14px", width: "auto", borderRadius: "2px", opacity: 0.9 }} />
            </div>
            <h1 style={{
              margin: "0 0 6px", fontSize: "36px", fontWeight: 900,
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              background: "linear-gradient(135deg, #e2e8f0 0%, #38bdf8 50%, #06b6d4 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Playa Segura
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>
              Beach conditions & safety · Know before you go
            </p>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: "480px", margin: "0 auto 16px" }}>
              <input
                type="text"
                placeholder="Search beaches, towns..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "14px 20px 14px 44px", borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
                  color: "#e2e8f0", fontSize: "15px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  outline: "none", transition: "border 0.2s",
                  appearance: "none", WebkitAppearance: "none",
                  touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(56,189,248,0.4)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <span style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                fontSize: "18px", color: "#475569",
              }}>
                🔍
              </span>
            </div>

            {/* Region Filters */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              {regions.map(r => (
                <button key={r} onClick={() => setRegionFilter(r)} className="region-btn" style={{
                  appearance: "none", WebkitAppearance: "none",
                  margin: 0,
                  cursor: "pointer", padding: "6px 16px", borderRadius: "99px",
                  fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  border: `1px solid ${regionFilter === r ? "#38bdf8" : "rgba(255,255,255,0.08)"}`,
                  background: regionFilter === r ? "rgba(56,189,248,0.12)" : "transparent",
                  color: regionFilter === r ? "#38bdf8" : "#64748b",
                  transition: "all 0.2s",
                }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern background starts here — below the header */}
          <div style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='40'%3E%3Cpath d='M0 20 C20 5 60 35 80 20' fill='none' stroke='%231e293b' stroke-width='1.5'/%3E%3Cpath d='M0 40 C20 25 60 55 80 40' fill='none' stroke='%231e293b' stroke-width='1.5'/%3E%3Cpath d='M0 0 C20 -15 60 15 80 0' fill='none' stroke='%231e293b' stroke-width='1.5'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}>

          {/* Active Advisories Ticker */}
          {activeAdvisories.length > 0 && (
            <div style={{
              background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)",
            }}>
              <div style={{
                maxWidth: "900px", margin: "0 auto", padding: "10px 24px",
                display: "flex", alignItems: "center", gap: "10px",
              }}>
                <span style={{
                  fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase",
                  letterSpacing: "0.06em", whiteSpace: "nowrap", animation: "pulse 2s infinite",
                }}>
                  ⚠ {activeAdvisories.length} Active {activeAdvisories.length === 1 ? "Advisory" : "Advisories"}
                </span>
                <div style={{
                  fontSize: "12px", color: "#f87171", overflow: "hidden",
                  whiteSpace: "nowrap", textOverflow: "ellipsis",
                }}>
                  {activeAdvisories.map(b => b.name).join(" · ")}
                </div>
              </div>
            </div>
          )}

          {/* Safety Quick Guide Toggle */}
          <div style={{ padding: "20px 24px 0", maxWidth: "900px", margin: "0 auto", boxSizing: "border-box" }}>
            <button onClick={() => setShowSafetyGuide(!showSafetyGuide)} className="safety-toggle" style={{
              appearance: "none", WebkitAppearance: "none",
              margin: 0, boxSizing: "border-box", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(56,189,248,0.06)", borderRadius: "14px",
              padding: "14px 20px", border: "1px solid rgba(56,189,248,0.12)",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
                🛟 Ocean Safety Quick Guide
              </span>
              <span style={{
                color: "#38bdf8", fontSize: "18px", flexShrink: 0,
                transform: showSafetyGuide ? "rotate(180deg)" : "none",
                transition: "transform 0.3s",
              }}>
                ▾
              </span>
            </button>

            {showSafetyGuide && (
              <div style={{
                marginTop: "12px",
                display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px",
                animation: "fadeUp 0.3s ease",
              }}>
                {SAFETY_TIPS.map((tip, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: "12px",
                    padding: "16px", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{tip.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#e2e8f0", marginBottom: "6px" }}>{tip.title}</div>
                    <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>{tip.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Legend */}
          <div style={{ padding: "20px 24px", maxWidth: "800px", margin: "0 auto" }}>
            <div className="risk-legend">
              {Object.entries(RISK_CONFIG).map(([key, val]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#94a3b8" }}>
                  <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: val.color, flexShrink: 0 }} />
                  {val.label}
                </div>
              ))}
            </div>
          </div>

          {/* Beach Grid */}
          <div style={{
            padding: "0 24px 40px", maxWidth: "900px", margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px",
          }}>
            {filtered.map(b => (
              <BeachCard key={b.id} beach={b} onClick={() => handleSelectBeach(b)} />
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏖</div>
                <p style={{ fontSize: "16px", fontWeight: 600 }}>No beaches found</p>
                <p style={{ fontSize: "13px" }}>Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", padding: "32px 24px",
            borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: "11px", color: "#94a3b8",
          }}>
            <div style={{ marginBottom: "8px", color: "#cbd5e1", fontWeight: 600 }}>
              Playa Segura PR · Beach Safety & Conditions
            </div>
            <div>
              Data sourced from NOAA, NWS San Juan, NDBC, and PR DNER.<br />
              All conditions are advisory. Always exercise personal judgment and obey posted signs and lifeguard instructions.
            </div>
            <div style={{ marginTop: "12px", color: "#94a3b8" }}>
              Coming soon: More beaches · Interactive map · Push alerts · Spanish language
            </div>
          </div>

          </div>{/* end pattern wrapper */}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sun, SunMedium, Cloud, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, CloudFog, Wind,
  Waves, Thermometer, Eye, Droplets, AlertTriangle, Search, MapPin, ArrowLeft, ChevronDown,
  LifeBuoy, CheckCircle, XCircle, Lightbulb, Flag, Users, Anchor, ArrowUp, ArrowDown,
  type LucideIcon,
} from "lucide-react";
import {
  mapNWSForecast, extractLiveWeather, extractBeachAlerts,
  forecastIcon, conditionLabel, computeBeachRisk,
  type LiveForecastDay, type LiveWeather, type BeachAlert, type WeatherIconKey,
  type RiskLevel, type RiskAssessment, type SurfZoneRisk,
} from "@/lib/weather-utils";
import type { BuoyObservation } from "@/lib/buoy-api";

// ─── TYPES ───────────────────────────────────────────────────────────────────

// RiskLevel and RiskAssessment are exported from weather-utils — no local redefinition needed.

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
  /** Nearest NDBC buoy station ID (5 digits) */
  buoyStation: string;
  /** NWS Surf Zone Forecast zone ID (e.g. "prz001") */
  surfZone: string;
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
  message: string;
}

interface LiveBeachData {
  weather: LiveWeather | null;
  forecast: LiveForecastDay[];
  loading: boolean;
  error: boolean;
  buoy: BuoyObservation | null;
  buoyError: boolean;
  surfForecast: SurfZoneRisk | null;
  surfForecastError: boolean;
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const BEACHES: Beach[] = [
  {
    id: 1, name: "Playa Flamenco", municipality: "Culebra", region: "East Islands",
    coords: { lat: 18.328, lng: -65.317 }, buoyStation: "41056", surfZone: "prz012", // Culebra
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
      { day: "Today",     icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "30%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "mostly-sunny", high: "88°F", low: "77°F", precip: "15%", surf: "1-2 ft", risk: "low" },
      { day: "Wednesday", icon: "sun", high: "89°F", low: "77°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "rain", high: "85°F", low: "75°F", precip: "60%", surf: "3-5 ft", risk: "high" },
      { day: "Friday",    icon: "thunderstorm", high: "83°F", low: "74°F", precip: "80%", surf: "4-6 ft", risk: "high" },
    ],
  },
  {
    id: 2, name: "Condado Beach", municipality: "San Juan", region: "Metro",
    coords: { lat: 18.455, lng: -66.073 }, buoyStation: "41053", surfZone: "prz001", // San Juan
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
      { day: "Today",     icon: "partly-cloudy", high: "86°F", low: "76°F", precip: "25%", surf: "4-6 ft",  risk: "high" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "85°F", low: "76°F", precip: "35%", surf: "5-7 ft",  risk: "extreme" },
      { day: "Wednesday", icon: "mostly-sunny", high: "87°F", low: "77°F", precip: "20%", surf: "3-4 ft",  risk: "moderate" },
      { day: "Thursday",  icon: "sun", high: "88°F", low: "77°F", precip: "10%", surf: "2-3 ft",  risk: "moderate" },
      { day: "Friday",    icon: "mostly-sunny", high: "87°F", low: "76°F", precip: "15%", surf: "1-2 ft",  risk: "low" },
    ],
  },
  {
    id: 3, name: "Playa Sucia (La Playuela)", municipality: "Cabo Rojo", region: "Southwest",
    coords: { lat: 17.933, lng: -67.195 }, buoyStation: "41117", surfZone: "prz011", // Southwest
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
      { day: "Today",     icon: "sun", high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun", high: "89°F", low: "77°F", precip: "5%",  surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny", high: "88°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "40%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "rain", high: "84°F", low: "74°F", precip: "65%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 4, name: "Playa Crash Boat", municipality: "Aguadilla", region: "Northwest",
    coords: { lat: 18.498, lng: -67.170 }, buoyStation: "41121", surfZone: "prz008", // Northwest
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
      { day: "Today",     icon: "mostly-sunny", high: "86°F", low: "75°F", precip: "20%", surf: "3-4 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "30%", surf: "3-5 ft", risk: "moderate" },
      { day: "Wednesday", icon: "rain", high: "83°F", low: "74°F", precip: "55%", surf: "4-6 ft", risk: "high" },
      { day: "Thursday",  icon: "thunderstorm", high: "82°F", low: "73°F", precip: "75%", surf: "5-8 ft", risk: "extreme" },
      { day: "Friday",    icon: "mostly-sunny", high: "85°F", low: "75°F", precip: "20%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 5, name: "Playa Luquillo (Balneario)", municipality: "Luquillo", region: "Northeast",
    coords: { lat: 18.385, lng: -65.717 }, buoyStation: "41053", surfZone: "prz002", // Northeast
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
      { day: "Today",     icon: "sun", high: "87°F", low: "76°F", precip: "15%", surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun", high: "88°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny", high: "87°F", low: "76°F", precip: "20%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "76°F", precip: "35%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain", high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 6, name: "Playa Domes (Rincón)", municipality: "Rincón", region: "West",
    coords: { lat: 18.369, lng: -67.267 }, buoyStation: "41115", surfZone: "prz010", // West
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
      { day: "Today",     icon: "wind", high: "84°F", low: "74°F", precip: "35%", surf: "8-12 ft",  risk: "extreme" },
      { day: "Tomorrow",  icon: "wind", high: "83°F", low: "74°F", precip: "40%", surf: "10-15 ft", risk: "extreme" },
      { day: "Wednesday", icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "25%", surf: "6-8 ft",   risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny", high: "86°F", low: "75°F", precip: "15%", surf: "4-6 ft",   risk: "high" },
      { day: "Friday",    icon: "sun", high: "87°F", low: "76°F", precip: "10%", surf: "3-4 ft",   risk: "moderate" },
    ],
  },
  {
    id: 7, name: "Playa Jobos", municipality: "Isabela", region: "Northwest",
    coords: { lat: 18.515, lng: -67.071 }, buoyStation: "41121", surfZone: "prz008", // Northwest
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
      { day: "Today",     icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "25%", surf: "5-7 ft", risk: "high" },
      { day: "Tomorrow",  icon: "mostly-sunny", high: "86°F", low: "75°F", precip: "15%", surf: "4-5 ft", risk: "high" },
      { day: "Wednesday", icon: "sun", high: "87°F", low: "76°F", precip: "10%", surf: "3-4 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny", high: "86°F", low: "76°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "30%", surf: "3-5 ft", risk: "moderate" },
    ],
  },
  {
    id: 8, name: "Playa Buyé", municipality: "Cabo Rojo", region: "Southwest",
    coords: { lat: 18.023, lng: -67.168 }, buoyStation: "41117", surfZone: "prz011", // Southwest
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
      { day: "Today",     icon: "sun", high: "89°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun", high: "90°F", low: "77°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny", high: "89°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny", high: "88°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
    ],
  },
];

const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  low:      { label: "Low Risk",       color: "#22c55e", bg: "#052e16", message: "Conditions are favorable for swimming" },
  moderate: { label: "Moderate Risk",  color: "#eab308", bg: "#422006", message: "Use caution — some hazards present" },
  high:     { label: "High Risk",      color: "#f97316", bg: "#431407", message: "Swimming not recommended" },
  extreme:  { label: "Extreme Danger", color: "#ef4444", bg: "#450a0a", message: "DO NOT SWIM" },
};

const SAFETY_TIPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Waves,    title: "Rip Currents", text: "If caught, swim parallel to shore until free of the current, then swim back. Never fight against it." },
  { icon: Flag,     title: "Flag System",  text: "Red = Danger/No swimming. Yellow = Caution. Green = Safe. Double red = Beach closed." },
  { icon: Users,    title: "Buddy System", text: "Never swim alone. Always keep an eye on children and weak swimmers in the water." },
  { icon: LifeBuoy, title: "Life Jackets", text: "Non-swimmers and children should always wear U.S. Coast Guard-approved life jackets in the ocean." },
];

// ─── LIVE DATA CACHE ─────────────────────────────────────────────────────────
// Module-level — survives view state changes (home ↔ detail) without re-fetching.

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

const weatherCache = new Map<number, {
  weather: LiveWeather;
  forecast: LiveForecastDay[];
  fetchedAt: number;
}>()

// Keyed by NDBC station ID — multiple beaches can share one buoy
const buoyCache = new Map<string, {
  data: BuoyObservation;
  fetchedAt: number;
}>()

// Keyed by NWS surf zone ID — multiple beaches can share one zone
const surfForecastCache = new Map<string, {
  data: SurfZoneRisk;
  fetchedAt: number;
}>()

let alertsCache: { alerts: BeachAlert[]; fetchedAt: number } | null = null

function mergeForecast(
  staticForecast: ForecastDay[],
  liveForecast: LiveForecastDay[],
): ForecastDay[] {
  return liveForecast.map((live, i) => ({
    day: live.day,
    icon: live.icon,
    high: live.high,
    low: live.low,
    precip: live.precip,
    surf: staticForecast[i]?.surf ?? '—',
    risk: staticForecast[i]?.risk ?? 'low',
  }))
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const WEATHER_ICONS: Record<WeatherIconKey, LucideIcon> = {
  'sun':           Sun,
  'mostly-sunny':  SunMedium,
  'partly-cloudy': Cloud,
  'cloudy':        Cloud,
  'rain':          CloudRain,
  'drizzle':       CloudDrizzle,
  'thunderstorm':  CloudLightning,
  'snow':          CloudSnow,
  'fog':           CloudFog,
  'wind':          Wind,
  'hurricane':     AlertTriangle,
}

function WeatherIcon({ iconKey, size = 16, color }: { iconKey: string; size?: number; color?: string }) {
  const Icon = WEATHER_ICONS[iconKey as WeatherIconKey] ?? Sun;
  return <Icon size={size} color={color} />;
}

function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" | "lg" }) {
  const r = RISK_CONFIG[level];
  const sizes = {
    sm: { padding: "3px 10px",  fontSize: "11px", iconSize: 11 },
    md: { padding: "5px 14px",  fontSize: "13px", iconSize: 13 },
    lg: { padding: "8px 20px",  fontSize: "15px", iconSize: 15 },
  };
  const s = sizes[size];
  const BadgeIcon = level === "low" ? CheckCircle : level === "extreme" ? XCircle : AlertTriangle;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: r.color, color: level === "low" ? "#052e16" : "#fff",
      padding: s.padding, borderRadius: "99px", fontSize: s.fontSize,
      fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
    }}>
      <BadgeIcon size={s.iconSize} /> {r.label}
    </span>
  );
}

function BeachCard({ beach, onClick, liveData, riskAssessment }: {
  beach: Beach;
  onClick: () => void;
  liveData?: LiveBeachData;
  riskAssessment?: RiskAssessment;
}) {
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
        {/* Risk badge — bottom-left of image */}
        {riskAssessment && !riskAssessment.unavailable && (
          <div style={{ position: "absolute", bottom: "12px", left: "12px" }}>
            <RiskBadge level={riskAssessment.level} size="sm" />
          </div>
        )}
        {riskAssessment?.unavailable && (
          <div style={{ position: "absolute", bottom: "12px", left: "12px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
              borderRadius: "99px", padding: "3px 10px",
              fontSize: "11px", fontWeight: 600, color: "#94a3b8",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              Risk unknown
            </span>
          </div>
        )}
        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
          {liveData?.weather ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
              borderRadius: "99px", padding: "4px 10px",
              fontSize: "12px", fontWeight: 600, color: "#e2e8f0",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              border: "1px solid rgba(255,255,255,0.12)",
            }}>
              <WeatherIcon iconKey={forecastIcon(liveData.weather.shortForecast)} size={13} />
              {conditionLabel(liveData.weather.shortForecast)}
            </span>
          ) : liveData?.error ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              background: "rgba(239,68,68,0.15)", backdropFilter: "blur(8px)",
              borderRadius: "99px", padding: "4px 10px",
              fontSize: "11px", fontWeight: 600, color: "#f87171",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              border: "1px solid rgba(239,68,68,0.3)",
            }}>
              <AlertTriangle size={11} /> Data unavailable
            </span>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center",
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
              borderRadius: "99px", padding: "4px 12px",
              fontSize: "13px", color: "#334155",
              border: "1px solid rgba(255,255,255,0.06)",
              letterSpacing: "0.1em",
            }}>
              · · ·
            </span>
          )}
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
          {liveData?.error ? (
            <a
              href="https://www.weather.gov/sju/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: "11px", color: "#f87171", textDecoration: "none", fontWeight: 600 }}
            >
              Data unavailable · Check NWS ↗
            </a>
          ) : (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Thermometer size={12} /> {liveData?.weather?.airTemp ?? "—"}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><Wind size={12} /> {liveData?.weather?.wind ?? "—"}</span>
            </>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${beach.coords.lat},${beach.coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="directions-link"
            style={{
              marginLeft: "auto", display: "flex", alignItems: "center",
              color: "#475569", textDecoration: "none",
            }}
            title="Get directions"
          >
            <MapPin size={16} />
          </a>
        </div>
      </div>
    </button>
  );
}

function ConditionBlock({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px",
      border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "4px",
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
      <span style={{ display: "flex", alignItems: "center" }}><WeatherIcon iconKey={f.icon} size={20} /></span>
      <span>{f.high}</span>
      <span style={{ color: "#64748b" }}>{f.low}</span>
      <span>{f.precip}</span>
      <span>{f.surf}</span>
      <span><RiskBadge level={f.risk} size="sm" /></span>
    </div>
  );
}

function BeachDetail({ beach, onBack, liveData, prAlerts, riskAssessment }: {
  beach: Beach;
  onBack: () => void;
  liveData?: LiveBeachData;
  prAlerts?: BeachAlert[];
  riskAssessment?: RiskAssessment;
}) {
  const effectiveRisk = riskAssessment?.unavailable ? beach.riskLevel : (riskAssessment?.level ?? beach.riskLevel);
  const r = RISK_CONFIG[effectiveRisk];
  const c = beach.conditions;
  const displayForecast = (liveData?.forecast?.length ?? 0) > 0
    ? mergeForecast(beach.forecast, liveData!.forecast)
    : beach.forecast;

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
          color: "#fff", border: "1px solid rgba(255,255,255,0.1)",
        }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {riskAssessment?.unavailable ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                borderRadius: "99px", padding: "8px 20px",
                fontSize: "13px", fontWeight: 700, color: "#94a3b8",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
                <AlertTriangle size={14} /> Risk Unknown
              </span>
            ) : (
              <RiskBadge level={effectiveRisk} size="lg" />
            )}
            {riskAssessment && !riskAssessment.unavailable && (
              <span style={{
                fontSize: "10px", fontWeight: 700,
                color: riskAssessment.source === 'buoy' ? "#38bdf8" : "#22c55e",
                border: `1px solid ${riskAssessment.source === 'buoy' ? "#38bdf8" : "#22c55e"}`,
                borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em",
                background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
              }}>
                {riskAssessment.source === 'nws-alert' ? 'NWS LIVE'
                  : riskAssessment.source === 'surf-forecast' ? 'NWS SURF ZONE'
                  : 'BUOY DATA'}
              </span>
            )}
          </div>
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
            <MapPin size={14} /> Get Directions
          </a>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        {/* NWS Live Alerts */}
        {prAlerts && prAlerts.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            {prAlerts.map((alert, i) => {
              const isCritical = alert.severity === "Extreme" || alert.severity === "Severe";
              const alertColor = isCritical ? "#ef4444" : "#eab308";
              const alertBg = isCritical ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)";
              const alertBorder = isCritical ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)";
              return (
                <div key={i} style={{
                  background: alertBg,
                  border: `1px solid ${alertBorder}`,
                  borderRadius: "14px", padding: "18px 20px", marginBottom: "12px",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px",
                    fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                    fontWeight: 700, color: alertColor, fontSize: "13px",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    <AlertTriangle size={14} />
                    <span style={{ flex: 1 }}>{alert.event}</span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, color: "#22c55e",
                      border: "1px solid #22c55e", borderRadius: "4px", padding: "2px 6px",
                      letterSpacing: "0.08em",
                    }}>NWS LIVE</span>
                  </div>
                  {alert.headline && (
                    <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#e2e8f0", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                      {alert.headline}
                    </p>
                  )}
                  <p style={{ margin: "0 0 8px", fontSize: "13px", lineHeight: 1.6, color: "#cbd5e1", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                    {alert.description.length > 300 ? alert.description.slice(0, 300) + "…" : alert.description}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                    Source: NWS San Juan · Expires: {new Date(alert.expires).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

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
              <AlertTriangle size={18} /> Active Advisory
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
        {riskAssessment?.unavailable ? (
          <div style={{
            background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)",
            borderRadius: "12px", padding: "14px 18px", marginBottom: "24px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <AlertTriangle size={24} color="#94a3b8" />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#94a3b8", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
              Risk data unavailable —{" "}
              <a
                href="https://www.weather.gov/sju/beach"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#38bdf8", textDecoration: "underline" }}
              >
                check NWS directly ↗
              </a>
            </p>
          </div>
        ) : (
          <div style={{
            background: `${r.color}10`, border: `1px solid ${r.color}25`, borderRadius: "12px",
            padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px",
          }}>
            {effectiveRisk === "low" ? <CheckCircle size={24} color={r.color} /> :
             effectiveRisk === "extreme" ? <XCircle size={24} color={r.color} /> :
             <AlertTriangle size={24} color={r.color} />}
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: r.color, fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
              {riskAssessment?.message ?? r.message}
            </p>
          </div>
        )}

        {/* About */}
        <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#94a3b8", marginBottom: "28px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
          {beach.description}
        </p>

        {/* Current Conditions Grid */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          Current Conditions
          {liveData?.weather && (
            <>
              <span style={{
                fontSize: "10px", fontWeight: 700, color: "#22c55e",
                border: "1px solid #22c55e", borderRadius: "4px",
                padding: "2px 6px", letterSpacing: "0.08em", textTransform: "uppercase",
              }}>LIVE</span>
              <a
                href="https://www.weather.gov/sju/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "10px", color: "#475569", textDecoration: "none",
                  fontWeight: 600, letterSpacing: "0.04em", textTransform: "none",
                }}
              >
                NWS San Juan ↗
              </a>
            </>
          )}
          {liveData?.loading && (
            <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, letterSpacing: "0.04em" }}>
              Updating…
            </span>
          )}
          {liveData?.error && (
            <a
              href="https://www.weather.gov/sju/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontSize: "11px", color: "#f87171", fontWeight: 600,
                textDecoration: "none", letterSpacing: "0.04em", textTransform: "none",
              }}
            >
              <AlertTriangle size={11} /> Data unavailable · Check NWS ↗
            </a>
          )}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px", marginBottom: "28px" }}>
          <ConditionBlock
            icon={<Waves size={12} />} label="Surf Height" accent={r.color}
            value={liveData?.surfForecast?.surfHeightText != null
              ? liveData.surfForecast.surfHeightText
              : liveData?.buoy?.waveHeightFt != null
                ? `${liveData.buoy.waveHeightFt} ft`
                : c.waveHeight}
          />
          <ConditionBlock icon={<AlertTriangle size={12} />} label="Rip Currents"
            value={riskAssessment && !riskAssessment.unavailable
              ? RISK_CONFIG[riskAssessment.level].label.replace(' Risk','').replace(' Danger','')
              : c.ripCurrentRisk}
            accent={r.color}
          />
          <ConditionBlock icon={<Wind size={12} />} label="Wind"
            value={liveData?.error ? "Unavailable" : liveData?.weather?.wind ?? c.wind}
          />
          <ConditionBlock icon={<Thermometer size={12} />} label="Water Temp" accent="#38bdf8"
            value={liveData?.buoy?.waterTempF != null
              ? `${liveData.buoy.waterTempF}°F`
              : c.waterTemp}
          />
          <ConditionBlock icon={<Sun size={12} />} label="UV Index"
            value={c.uvIndex >= 11 ? `${c.uvIndex} (Extreme)` : c.uvIndex >= 8 ? `${c.uvIndex} (Very High)` : `${c.uvIndex}`}
            accent={c.uvIndex >= 11 ? "#ef4444" : c.uvIndex >= 8 ? "#f97316" : "#eab308"}
          />
          <ConditionBlock icon={<Thermometer size={12} />} label="Air Temp"
            value={liveData?.error ? "Unavailable" : liveData?.weather?.airTemp ?? c.airTemp}
          />
          <ConditionBlock icon={<Droplets size={12} />} label="Humidity" value={c.humidity} />
          <ConditionBlock icon={<Eye size={12} />} label="Visibility" value={c.visibility} />
          <ConditionBlock icon={<Waves size={12} />} label="Swell"
            value={liveData?.buoy
              ? `${liveData.buoy.dominantPeriodS != null ? liveData.buoy.dominantPeriodS + 's' : c.swellPeriod} ${liveData.buoy.swellDirectionCompass ?? c.swellDirection}`
              : `${c.swellPeriod} ${c.swellDirection}`}
          />
          <ConditionBlock icon={<Anchor size={12} />} label="Tide" value={c.tideStatus} />
          <ConditionBlock icon={<ArrowUp size={12} />} label="Next High Tide" value={c.nextHighTide} />
          <ConditionBlock icon={<ArrowDown size={12} />} label="Next Low Tide" value={c.nextLowTide} />
        </div>
        {/* Data attribution */}
        {(liveData?.surfForecast || liveData?.buoy) && (
          <p style={{ fontSize: "11px", color: "#334155", marginTop: "-20px", marginBottom: "28px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
            {liveData?.surfForecast && (
              <>
                Surf forecast:{" "}
                <a href={`https://tgftp.nws.noaa.gov/data/forecasts/marine/surf_zone/pr/${beach.surfZone}.txt`} target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "underline" }}>
                  NWS Surf Zone {beach.surfZone.toUpperCase()}
                </a>
              </>
            )}
            {liveData?.surfForecast && liveData?.buoy && <> · </>}
            {liveData?.buoy && (
              <>
                Buoy:{" "}
                <a href={`https://www.ndbc.noaa.gov/station_page.php?station=${beach.buoyStation}`} target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "underline" }}>
                  NDBC {beach.buoyStation}
                </a>
                {liveData.buoy.observedAt && (
                  <> · {new Date(liveData.buoy.observedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" })}</>
                )}
              </>
            )}
          </p>
        )}

        {/* 5-Day Forecast */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          5-Day Beach Forecast
          {(liveData?.forecast?.length ?? 0) > 0 && (
            <span style={{
              fontSize: "10px", fontWeight: 700, color: "#22c55e",
              border: "1px solid #22c55e", borderRadius: "4px",
              padding: "2px 6px", letterSpacing: "0.08em", textTransform: "uppercase",
            }}>LIVE</span>
          )}
        </h2>

        {liveData?.error ? (
          <div style={{
            background: "rgba(239,68,68,0.06)", borderRadius: "14px",
            border: "1px solid rgba(239,68,68,0.2)", padding: "20px 24px",
            marginBottom: "28px", textAlign: "center",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 600, color: "#f87171" }}>
              Forecast data unavailable
            </p>
            <a
              href="https://www.weather.gov/sju/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "13px", color: "#64748b", textDecoration: "underline" }}
            >
              Check the NWS San Juan forecast directly ↗
            </a>
          </div>
        ) : (
          <>
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
          {displayForecast.map((f, i) => <ForecastRow key={i} f={f} />)}
        </div>

        {/* Mobile: stacked card layout */}
        <div className="forecast-cards" style={{ marginBottom: "28px" }}>
          {displayForecast.map((f, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)", borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <WeatherIcon iconKey={f.icon} size={22} />
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#e2e8f0" }}>{f.day}</span>
                </div>
                <RiskBadge level={f.risk} size="sm" />
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#94a3b8", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><ArrowUp size={12} /> {f.high}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#64748b" }}><ArrowDown size={12} /> {f.low}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><CloudRain size={12} /> {f.precip}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><Waves size={12} /> {f.surf}</span>
              </div>
            </div>
          ))}
        </div>
          </>
        )}

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
          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#cbd5e1", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", display: "flex", gap: "8px" }}>
            <Lightbulb size={16} style={{ flexShrink: 0, marginTop: "2px" }} color="#38bdf8" />{beach.tips}
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
          Data sources:{" "}
          <a href="https://www.noaa.gov/" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "underline" }}>NOAA</a>
          {" · "}
          <a href="https://www.weather.gov/sju/" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "underline" }}>NWS San Juan</a>
          {" · "}
          <a href={`https://www.ndbc.noaa.gov/station_page.php?station=${beach.buoyStation}`} target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "underline" }}>NDBC Buoy {beach.buoyStation}</a>
          {" · PR DNER"}<br />
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

  // ── Live weather state ──────────────────────────────────────────────────────
  const [liveBeachData, setLiveBeachData] = useState<Map<number, LiveBeachData>>(
    () => new Map(BEACHES.map(b => [b.id, { weather: null, forecast: [], loading: true, error: false, buoy: null, buoyError: false, surfForecast: null, surfForecastError: false }]))
  );
  // null = not yet fetched; [] = fetched, no beach alerts
  const [prAlerts, setPrAlerts] = useState<BeachAlert[] | null>(null);

  useEffect(() => {
    // Fetch PR-wide beach alerts (shared across all beaches)
    const fetchAlerts = async () => {
      if (alertsCache && Date.now() - alertsCache.fetchedAt < CACHE_TTL_MS) {
        setPrAlerts(alertsCache.alerts);
        return;
      }
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        const alerts = extractBeachAlerts(data.features ?? []);
        console.log(`[fetchAlerts] extracted ${alerts.length} beach alerts:`, alerts.map(a => a.event));
        alertsCache = { alerts, fetchedAt: Date.now() };
        setPrAlerts(alerts);
      } catch {
        setPrAlerts([]);
      }
    };

    // Fetch live weather for a single beach
    const fetchBeach = async (beach: typeof BEACHES[0]) => {
      const cached = weatherCache.get(beach.id);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), weather: cached.weather, forecast: cached.forecast, loading: false, error: false });
        });
        return;
      }
      try {
        const res = await fetch(`/api/weather?lat=${beach.coords.lat}&lng=${beach.coords.lng}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const periods = data.forecast.periods ?? [];
        if (periods.length === 0) throw new Error('No forecast periods');
        const weather = extractLiveWeather(periods);
        const forecast = mapNWSForecast(periods);
        weatherCache.set(beach.id, { weather, forecast, fetchedAt: Date.now() });
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), weather, forecast, loading: false, error: false });
        });
      } catch {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), weather: null, forecast: [], loading: false, error: true });
        });
      }
    };

    // Fetch buoy data for a single beach (deduped via buoyCache by station ID)
    const fetchBuoy = async (beach: typeof BEACHES[0]) => {
      const stationId = beach.buoyStation;
      const cached = buoyCache.get(stationId);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), buoy: cached.data, buoyError: false });
        });
        return;
      }
      try {
        const res = await fetch(`/api/buoy?station=${stationId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const obs = data as BuoyObservation;
        buoyCache.set(stationId, { data: obs, fetchedAt: Date.now() });
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), buoy: obs, buoyError: false });
        });
      } catch {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), buoy: null, buoyError: true });
        });
      }
    };

    // Fetch NWS Surf Zone Forecast for a beach (deduped via surfForecastCache by zone ID)
    const fetchSurfForecast = async (beach: typeof BEACHES[0]) => {
      const zone = beach.surfZone;
      const cached = surfForecastCache.get(zone);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), surfForecast: cached.data, surfForecastError: false });
        });
        return;
      }
      try {
        const res = await fetch(`/api/surf-forecast?zone=${zone}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        // Store only the first (today's) period — that's all the risk algorithm needs
        const first = data.periods?.[0] ?? null;
        const surf: SurfZoneRisk | null = first
          ? { ripCurrentRisk: first.ripCurrentRisk, surfHeightFt: first.surfHeightFt, surfHeightText: first.surfHeightText }
          : null;
        surfForecastCache.set(zone, { data: surf ?? { ripCurrentRisk: null, surfHeightFt: null, surfHeightText: null }, fetchedAt: Date.now() });
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), surfForecast: surf, surfForecastError: false });
        });
      } catch {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), surfForecast: null, surfForecastError: true });
        });
      }
    };

    // Kick off all fetches in parallel — NWS handles concurrent requests fine
    fetchAlerts();
    BEACHES.forEach(b => { fetchBeach(b); fetchBuoy(b); fetchSurfForecast(b); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Use live NWS alerts once loaded; fall back to static advisory list while loading
  const activeAdvisories = BEACHES.filter(b => b.conditions.surfAdvisory);
  const nwsBeachAlerts = prAlerts ?? [];

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
        <BeachDetail
          beach={selectedBeach}
          onBack={() => setView("home")}
          liveData={liveBeachData.get(selectedBeach.id)}
          prAlerts={prAlerts ?? undefined}
          riskAssessment={(() => {
            const d = liveBeachData.get(selectedBeach.id);
            const ready = prAlerts !== null ||
              d?.surfForecastError === true || d?.surfForecast != null ||
              d?.buoyError === true || d?.buoy != null;
            return ready
              ? computeBeachRisk(prAlerts, d?.surfForecast ?? null, d?.buoy?.waveHeightFt ?? null, selectedBeach.name)
              : undefined;
          })()}
        />
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
                color: "#475569", display: "flex",
              }}>
                <Search size={18} />
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

          {/* Active Advisories Ticker — NWS live alerts when loaded, static fallback while loading */}
          {nwsBeachAlerts.length > 0 ? (
            <div style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
              <div style={{ maxWidth: "900px", margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", animation: "pulse 2s infinite" }}>
                  <AlertTriangle size={12} /> {nwsBeachAlerts.length} NWS Alert{nwsBeachAlerts.length > 1 ? "s" : ""}
                </span>
                <div style={{ fontSize: "12px", color: "#f87171", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {nwsBeachAlerts.map(a => a.event).join(" · ")}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e", border: "1px solid #22c55e", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em", whiteSpace: "nowrap", marginLeft: "auto" }}>
                  LIVE
                </span>
              </div>
            </div>
          ) : prAlerts === null && activeAdvisories.length > 0 ? (
            <div style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
              <div style={{ maxWidth: "900px", margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", animation: "pulse 2s infinite" }}>
                  <AlertTriangle size={12} /> {activeAdvisories.length} Active {activeAdvisories.length === 1 ? "Advisory" : "Advisories"}
                </span>
                <div style={{ fontSize: "12px", color: "#f87171", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {activeAdvisories.map(b => b.name).join(" · ")}
                </div>
              </div>
            </div>
          ) : null}

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
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
                <LifeBuoy size={16} /> Ocean Safety Quick Guide
              </span>
              <span style={{
                color: "#38bdf8", flexShrink: 0, display: "flex",
                transform: showSafetyGuide ? "rotate(180deg)" : "none",
                transition: "transform 0.3s",
              }}>
                <ChevronDown size={18} />
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
                    <div style={{ marginBottom: "8px", color: "#38bdf8" }}><tip.icon size={24} /></div>
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
            {filtered.map(b => {
              const bData = liveBeachData.get(b.id);
              const riskReady = prAlerts !== null ||
                bData?.surfForecastError === true || bData?.surfForecast != null ||
                bData?.buoyError === true || bData?.buoy != null;
              return (
                <BeachCard
                  key={b.id}
                  beach={b}
                  onClick={() => handleSelectBeach(b)}
                  liveData={bData}
                  riskAssessment={riskReady ? computeBeachRisk(prAlerts, bData?.surfForecast ?? null, bData?.buoy?.waveHeightFt ?? null, b.name) : undefined}
                />
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}><Waves size={48} /></div>
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
              Data sourced from{" "}
              <a href="https://www.noaa.gov/" target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "underline" }}>NOAA</a>
              {", "}
              <a href="https://www.weather.gov/sju/" target="_blank" rel="noopener noreferrer" style={{ color: "#64748b", textDecoration: "underline" }}>NWS San Juan</a>
              {", NDBC, and PR DNER."}<br />
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

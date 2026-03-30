"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sun, SunMedium, Cloud, CloudDrizzle, CloudRain, CloudLightning, CloudSnow, CloudFog, Wind,
  Waves, Thermometer, Eye, Droplets, AlertTriangle, Search, MapPin, ArrowLeft, ChevronDown,
  LifeBuoy, CheckCircle, XCircle, Lightbulb, Flag, Users, Anchor, ArrowUp, ArrowDown,
  Phone, Shield,
  type LucideIcon,
} from "lucide-react";
import {
  mapNWSForecast, extractLiveWeather, extractBeachAlerts, filterAlertsForZone,
  forecastIcon, conditionLabel, computeBeachRisk,
  type LiveForecastDay, type LiveWeather, type BeachAlert, type WeatherIconKey,
  type RiskLevel, type RiskAssessment, type SurfZoneRisk,
} from "@/lib/weather-utils";
import type { BuoyObservation } from "@/lib/buoy-api";
import type { SurfZonePeriod } from "@/lib/surf-forecast-api";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type Lang = 'en' | 'es'

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
  descriptionEs?: string;
  amenities: string[];
  tips: string;
  tipsEs?: string;
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
  /** All parsed SRF periods — used for multi-day risk in the forecast table */
  surfForecastPeriods: SurfZonePeriod[];
  surfForecastError: boolean;
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const BEACHES: Beach[] = [
  {
    id: 1, name: "Playa Flamenco", municipality: "Culebra", region: "East Islands",
    coords: { lat: 18.32921, lng: -65.3152 }, buoyStation: "41056", surfZone: "prz012", // Culebra
    image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop",
    description: "Consistently ranked among the world's best beaches. Crystal-clear waters and a wide horseshoe bay surrounded by green hills. Famous for the abandoned military tank on the sand.",
    descriptionEs: "Reconocida entre las mejores playas del mundo. Aguas cristalinas y una amplia bahía en herradura rodeada de colinas verdes. Famosa por el tanque militar abandonado en la arena.",
    amenities: ["Restrooms", "Food kiosks", "Parking", "Camping"],
    tips: "Arrive early on weekends. The left side tends to have calmer waters. Watch for jellyfish during winter months. 15-20 min hike from parking.",
    tipsEs: "Llega temprano los fines de semana. El lado izquierdo tiende a tener aguas más tranquilas. Cuidado con las medusas en los meses de invierno. Caminata de 15-20 min desde el estacionamiento.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "ENE",
      waterTemp: "81°F", airTemp: "87°F", humidity: "74%",
      uvIndex: 11, wind: "15 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:45 PM", nextLowTide: "9:12 AM",
      ripCurrentRisk: "Moderate",
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
    coords: { lat: 18.45734, lng: -66.07199 }, buoyStation: "41053", surfZone: "prz001", // San Juan
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Urban beach in the heart of San Juan's hotel district. Popular with tourists but can have strong currents, especially during winter swells.",
    descriptionEs: "Playa urbana en el corazón del distrito hotelero de San Juan. Popular entre turistas, pero puede tener corrientes fuertes, especialmente durante las marejadas de invierno.",
    amenities: ["Hotels nearby", "Restaurants", "Water sports rentals"],
    tips: "Strong currents are common. Swim only in lifeguard-patrolled areas. Eastern section near the Marriott tends to have calmer waters.",
    tipsEs: "Las corrientes fuertes son comunes. Nada solo en áreas vigiladas por guardavidas. La sección este, cerca del Marriott, tiende a tener aguas más tranquilas.",
    riskLevel: "high",
    conditions: {
      waveHeight: "4-6 ft", swellPeriod: "12s", swellDirection: "NNW",
      waterTemp: "80°F", airTemp: "86°F", humidity: "78%",
      uvIndex: 10, wind: "18 mph NE", visibility: "Good",
      tideStatus: "Falling", nextHighTide: "8:30 PM", nextLowTide: "2:15 PM",
      ripCurrentRisk: "High",
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
    coords: { lat: 17.93606, lng: -67.18904 }, buoyStation: "42085", surfZone: "prz011", // Southwest (CarICOOS Ponce)
    image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&h=400&fit=crop",
    description: "Stunning secluded beach at the southwestern tip of PR near the salt flats and Los Morrillos Lighthouse. Turquoise waters and dramatic cliffs.",
    descriptionEs: "Impresionante playa apartada en el extremo suroeste de Puerto Rico, cerca de las salinas y el Faro de Los Morrillos. Aguas turquesas y acantilados espectaculares.",
    amenities: ["Parking (limited)", "None — bring supplies", "Hiking trail access"],
    tips: "No lifeguards. Bring plenty of water and sunscreen. 15-20 min hike from parking. Dirt road can be muddy when it rains. Leave no trace.",
    tipsEs: "Sin guardavidas. Lleva suficiente agua y protector solar. Caminata de 15-20 min desde el estacionamiento. El camino de tierra puede estar lodoso cuando llueve. No dejes rastro.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "SSW",
      waterTemp: "82°F", airTemp: "88°F", humidity: "70%",
      uvIndex: 12, wind: "10 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "4:00 PM", nextLowTide: "10:30 AM",
      ripCurrentRisk: "Low",
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
    coords: { lat: 18.45896, lng: -67.16394 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop",
    description: "Famous for its colorful pier and excellent snorkeling. Beloved local beach with vibrant atmosphere and clear waters.",
    descriptionEs: "Famosa por su colorido muelle y su excelente snorkel. Playa muy querida por los locales con ambiente vibrante y aguas claras.",
    amenities: ["Parking", "Food vendors", "Restrooms", "Snorkeling", "Diving pier"],
    tips: "The area around the pier has calmer water ideal for snorkeling. The open-water side can have strong currents. Arrive before 10 AM on weekends.",
    tipsEs: "El área alrededor del muelle tiene aguas más tranquilas, ideal para snorkel. El lado de mar abierto puede tener corrientes fuertes. Llega antes de las 10 AM los fines de semana.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "3-4 ft", swellPeriod: "10s", swellDirection: "NW",
      waterTemp: "80°F", airTemp: "86°F", humidity: "76%",
      uvIndex: 11, wind: "14 mph NNE", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:15 PM", nextLowTide: "9:45 AM",
      ripCurrentRisk: "Moderate",
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
    coords: { lat: 18.38487, lng: -65.72941 }, buoyStation: "41053", surfZone: "prz002", // Northeast
    image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&h=400&fit=crop",
    description: "One of PR's most family-friendly beaches. Long crescent of calm palm-lined shore with a protective reef. Famous food kiosks nearby.",
    descriptionEs: "Una de las playas más familiares de Puerto Rico. Larga franja de arena con palmeras y aguas tranquilas protegidas por un arrecife. Famosos quioscos de comida en las cercanías.",
    amenities: ["Restrooms", "Showers", "Parking ($5)", "Food kiosks", "Accessibility ramps"],
    tips: "The reef protects from strong waves, excellent for families. The famous 'kioskos' are a 5-min walk east — try the alcapurrias.",
    tipsEs: "El arrecife protege de las olas fuertes, excelente para familias. Los famosos quioscos están a 5 min a pie al este — prueba las alcapurrias.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "12 mph ESE", visibility: "Excellent",
      tideStatus: "High", nextHighTide: "1:00 PM", nextLowTide: "7:30 PM",
      ripCurrentRisk: "Low",
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
    coords: { lat: 18.36478, lng: -67.26994 }, buoyStation: "41115", surfZone: "prz010", // West
    image: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=600&h=400&fit=crop",
    description: "World-renowned surf beach named after the nearby nuclear dome. Powerful winter swells make this a surfing mecca — extremely dangerous for casual swimmers.",
    descriptionEs: "Playa de surf de fama mundial, nombrada por el domo nuclear cercano. Las potentes olas de invierno la convierten en una meca del surf — extremadamente peligrosa para nadadores ocasionales.",
    amenities: ["Parking (roadside)", "Surf shops nearby", "Restaurants nearby"],
    tips: "NOT a swimming beach during surf season (Oct-Apr). Even experienced swimmers get caught in powerful currents. Watch surfers from the cliff overlook instead.",
    tipsEs: "NO es una playa para nadar durante la temporada de surf (oct-abr). Incluso nadadores expertos quedan atrapados en corrientes poderosas. Observa a los surfistas desde el mirador del acantilado.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "8-12 ft", swellPeriod: "14s", swellDirection: "WNW",
      waterTemp: "79°F", airTemp: "84°F", humidity: "80%",
      uvIndex: 9, wind: "20 mph NW", visibility: "Fair",
      tideStatus: "Falling", nextHighTide: "9:00 PM", nextLowTide: "3:00 PM",
      ripCurrentRisk: "Extreme",
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
    coords: { lat: 18.51546, lng: -67.07488 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=600&h=400&fit=crop",
    description: "Wild, beautiful beach popular with surfers and bodyboarders. Rocky outcrops and strong currents make it risky for inexperienced swimmers.",
    descriptionEs: "Playa salvaje y hermosa, popular entre surfistas y bodyboarders. Los afloramientos rocosos y las fuertes corrientes la hacen peligrosa para nadadores sin experiencia.",
    amenities: ["Parking", "Food kiosks", "Restrooms"],
    tips: "Strong currents even on calm days. Rocky bottom can cause injuries. Best for watching surfers or wading in shallow areas only. Not recommended for children.",
    tipsEs: "Corrientes fuertes incluso en días tranquilos. El fondo rocoso puede causar lesiones. Ideal para ver surfistas o caminar en aguas poco profundas únicamente. No recomendada para niños.",
    riskLevel: "high",
    conditions: {
      waveHeight: "5-7 ft", swellPeriod: "11s", swellDirection: "NNW",
      waterTemp: "80°F", airTemp: "85°F", humidity: "77%",
      uvIndex: 10, wind: "16 mph N", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "4:30 PM", nextLowTide: "10:45 AM",
      ripCurrentRisk: "High",
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
    coords: { lat: 18.04122, lng: -67.2062 }, buoyStation: "42085", surfZone: "prz011", // Southwest (CarICOOS Ponce)
    image: "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=600&h=400&fit=crop",
    description: "Tranquil tree-lined beach with calm Caribbean waters. Less crowded than many popular beaches, offering a peaceful retreat with gentle swimming conditions.",
    descriptionEs: "Playa tranquila bordeada de árboles con aguas caribeñas en calma. Menos concurrida que muchas playas populares, ofrece un retiro pacífico con condiciones de natación suaves.",
    amenities: ["Parking", "Restrooms", "Shade trees", "Picnic areas", "Restaurant/Bar"],
    tips: "Great for families and relaxed swimming. The mangrove area on the south end is beautiful for kayaking. Bring your own food and drinks as vendors are limited.",
    tipsEs: "Ideal para familias y nadar relajadamente. El área de manglares en el extremo sur es hermosa para kayak. Lleva tu propia comida y bebidas, ya que los vendedores son limitados.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "4s", swellDirection: "S",
      waterTemp: "83°F", airTemp: "89°F", humidity: "68%",
      uvIndex: 12, wind: "8 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "5:15 PM", nextLowTide: "11:00 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun", high: "89°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun", high: "90°F", low: "77°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny", high: "89°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny", high: "88°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
    ],
  },
  {
    id: 9, name: "Balneario El Escambrón", municipality: "San Juan", region: "Metro",
    coords: { lat: 18.46711, lng: -66.08997 }, buoyStation: "41053", surfZone: "prz001", // Metro (San Juan)
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "San Juan's best beach for snorkeling. A reef barrier creates calm, clear waters perfect for swimming. Located between Puerta de Tierra and Condado with ruins of an 18th-century artillery battery nearby.",
    descriptionEs: "La mejor playa de San Juan para hacer snorkel. Un arrecife crea aguas tranquilas y claras, perfectas para nadar. Ubicada entre Puerta de Tierra y Condado, con ruinas de una batería de artillería del siglo XVIII.",
    amenities: ["Restrooms", "Showers", "Parking", "Snorkeling gear rental"],
    tips: "Reef-protected waters are calm and ideal for snorkeling. Scuba Dogs offers gear rentals. Arrive early for parking. Blue Flag certified beach.",
    tipsEs: "Las aguas protegidas por el arrecife son tranquilas e ideales para snorkel. Scuba Dogs ofrece alquiler de equipo. Llega temprano para estacionar. Playa certificada Bandera Azul.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "NE",
      waterTemp: "81°F", airTemp: "87°F", humidity: "74%",
      uvIndex: 10, wind: "12 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:00 PM", nextLowTide: "8:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "low" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 10, name: "Playa Seven Seas", municipality: "Fajardo", region: "Northeast",
    coords: { lat: 18.36979, lng: -65.63585 }, buoyStation: "41053", surfZone: "prz002", // Northeast
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Dreamy crescent beach with calm, clear waters. One of the best-maintained public beaches (balneario) in PR. Starting point for hiking to Playa Escondida.",
    descriptionEs: "Soñada playa en media luna con aguas tranquilas y claras. Uno de los balnearios mejor mantenidos de Puerto Rico. Punto de partida para la caminata a Playa Escondida.",
    amenities: ["Restrooms", "Showers", "Parking", "Camping", "Picnic areas"],
    tips: "Calm waters ideal for families and snorkeling. Gets busy on weekends. Camping available with permit. Starting point for trail to the more secluded Playa Escondida.",
    tipsEs: "Aguas tranquilas ideales para familias y snorkel. Se llena los fines de semana. Camping disponible con permiso. Punto de partida para el sendero hacia la más apartada Playa Escondida.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "11 mph ESE", visibility: "Excellent",
      tideStatus: "High", nextHighTide: "1:30 PM", nextLowTide: "7:45 PM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "88°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "20%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "76°F", precip: "35%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 11, name: "Balneario de Boquerón", municipality: "Cabo Rojo", region: "Southwest",
    coords: { lat: 18.01981, lng: -67.17198 }, buoyStation: "42085", surfZone: "prz011", // Southwest (CarICOOS Ponce)
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "One of the most popular public beaches on the southwest coast. Long stretch of calm Caribbean water with white sand. Lively atmosphere with vendors and restaurants.",
    descriptionEs: "Una de las playas públicas más populares de la costa suroeste. Larga franja de arena blanca con aguas caribeñas en calma. Ambiente animado con vendedores y restaurantes.",
    amenities: ["Restrooms", "Showers", "Parking", "Food vendors", "Chair rentals"],
    tips: "Calm waters perfect for families. Gets very crowded on weekends and holidays. The town of Boquerón has excellent seafood restaurants. Blue Flag certified.",
    tipsEs: "Aguas tranquilas perfectas para familias. Se llena mucho los fines de semana y feriados. El pueblo de Boquerón tiene excelentes restaurantes de mariscos. Certificada Bandera Azul.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "4s", swellDirection: "SW",
      waterTemp: "83°F", airTemp: "89°F", humidity: "69%",
      uvIndex: 12, wind: "8 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "5:00 PM", nextLowTide: "11:15 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "89°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "90°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "89°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
    ],
  },
  {
    id: 12, name: "Ocean Park Beach", municipality: "San Juan", region: "Metro",
    coords: { lat: 18.45507, lng: -66.05458 }, buoyStation: "41053", surfZone: "prz001", // Metro
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A favorite among locals, this wide sandy beach between Condado and Isla Verde has a more laid-back vibe than the hotel-district beaches. Popular for kitesurfing and volleyball.",
    descriptionEs: "Favorita entre los locales, esta amplia playa arenosa entre Condado e Isla Verde tiene un ambiente más relajado que las playas del distrito hotelero. Popular para el kitesurf y el voleibol.",
    amenities: ["Limited — residential area", "some food trucks"],
    tips: "Less tourist-oriented than Condado. Good for kitesurfing on windy days. Limited amenities — bring your own supplies. Strong currents possible.",
    tipsEs: "Menos turística que Condado. Buena para kitesurf en días de viento. Facilidades limitadas — lleva tus propios suministros. Posibles corrientes fuertes.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "NE",
      waterTemp: "80°F", airTemp: "86°F", humidity: "76%",
      uvIndex: 10, wind: "16 mph NE", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "2:30 PM", nextLowTide: "9:00 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "30%", surf: "2-4 ft", risk: "moderate" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "sun",           high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Friday",    icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "low" },
    ],
  },
  {
    id: 13, name: "Playa Isla Verde", municipality: "Carolina", region: "Metro",
    coords: { lat: 18.44517, lng: -66.01406 }, buoyStation: "41053", surfZone: "prz001", // Metro
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Long stretch of golden sand lined with high-rise hotels and resorts. One of the most accessible beaches from the airport. Active water sports scene.",
    descriptionEs: "Larga franja de arena dorada bordeada de hoteles y resorts. Una de las playas más accesibles desde el aeropuerto. Activa escena de deportes acuáticos.",
    amenities: ["Hotels", "Restaurants", "Water sports", "Chair/umbrella rentals"],
    tips: "Western end near the hotels has calmer waters. Eastern end can have stronger currents. Plenty of amenities and food options within walking distance.",
    tipsEs: "El extremo oeste, cerca de los hoteles, tiene aguas más tranquilas. El extremo este puede tener corrientes más fuertes. Muchas facilidades y opciones de comida a pie.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "NE",
      waterTemp: "80°F", airTemp: "86°F", humidity: "75%",
      uvIndex: 10, wind: "14 mph NE", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "2:00 PM", nextLowTide: "8:30 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "30%", surf: "2-4 ft", risk: "moderate" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "sun",           high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Friday",    icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "low" },
    ],
  },
  {
    id: 14, name: "Sun Bay (Balneario)", municipality: "Vieques", region: "East Islands",
    coords: { lat: 18.09625, lng: -65.45429 }, buoyStation: "41056", surfZone: "prz013", // Vieques
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "The most accessible beach in Vieques. Wide crescent of soft sand with turquoise waters and palm trees. Part of a government-managed balneario.",
    descriptionEs: "La playa más accesible de Vieques. Amplia media luna de arena suave con aguas turquesas y palmeras. Parte de un balneario administrado por el gobierno.",
    amenities: ["Restrooms", "Showers", "Parking", "Picnic areas"],
    tips: "Calm waters great for swimming. Can get busy on weekends with locals. Bring supplies as vendors are limited. Gate closes at certain hours.",
    tipsEs: "Aguas tranquilas ideales para nadar. Puede concurrirse los fines de semana con locales. Lleva suministros ya que los vendedores son limitados. La verja cierra a ciertas horas.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "SE",
      waterTemp: "83°F", airTemp: "88°F", humidity: "70%",
      uvIndex: 11, wind: "9 mph ESE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "4:30 PM", nextLowTide: "10:45 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "88°F", low: "76°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "89°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "25%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "85°F", low: "75°F", precip: "50%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 15, name: "La Chiva (Blue Beach)", municipality: "Vieques", region: "East Islands",
    coords: { lat: 18.11338, lng: -65.38743 }, buoyStation: "41056", surfZone: "prz013", // Vieques
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Inside the Vieques National Wildlife Refuge. White sand that sparkles like diamond dust with waters shifting from turquoise to deep blue. One of the Caribbean's most beautiful beaches.",
    descriptionEs: "Dentro del Refugio Nacional de Vida Silvestre de Vieques. Arena blanca que brilla como polvo de diamante con aguas que van del turquesa al azul profundo. Una de las playas más bellas del Caribe.",
    amenities: ["None — bring everything"],
    tips: "Dirt road access requires patience. No facilities — bring water, food, shade, sunscreen. Multiple numbered beach areas along the road. Snorkeling at rocky spots.",
    tipsEs: "El acceso por camino de tierra requiere paciencia. Sin facilidades — lleva agua, comida, sombra y protector solar. Múltiples áreas numeradas a lo largo del camino. Snorkel en las zonas rocosas.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "SE",
      waterTemp: "83°F", airTemp: "88°F", humidity: "71%",
      uvIndex: 12, wind: "10 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "3:00 PM", nextLowTide: "9:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "88°F", low: "76°F", precip: "5%",  surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "89°F", low: "77°F", precip: "5%",  surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "25%", surf: "1-2 ft", risk: "moderate" },
      { day: "Friday",    icon: "rain",          high: "85°F", low: "75°F", precip: "50%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 16, name: "Carlos Rosario Beach", municipality: "Culebra", region: "East Islands",
    coords: { lat: 18.32459, lng: -65.32977 }, buoyStation: "41056", surfZone: "prz012", // Culebra
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "One of Puerto Rico's premier snorkeling beaches. Accessible only by a 20-minute trail from Flamenco Beach. Pristine reef with abundant marine life.",
    descriptionEs: "Una de las mejores playas para snorkel de Puerto Rico. Accesible únicamente por un sendero de 20 minutos desde Playa Flamenco. Arrecife prístino con abundante vida marina.",
    amenities: ["None — bring everything"],
    tips: "Must hike from Flamenco Beach — no road access. Bring snorkeling gear, water, and snacks. No shade or facilities. The reef starts very close to shore.",
    tipsEs: "Debes caminar desde Playa Flamenco — sin acceso por carretera. Lleva equipo de snorkel, agua y meriendas. Sin sombra ni facilidades. El arrecife comienza muy cerca de la orilla.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "7s", swellDirection: "ENE",
      waterTemp: "81°F", airTemp: "87°F", humidity: "73%",
      uvIndex: 11, wind: "12 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:45 PM", nextLowTide: "9:00 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "88°F", low: "77°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 17, name: "Playa Mar Chiquita", municipality: "Manatí", region: "North Central",
    coords: { lat: 18.47285, lng: -66.48545 }, buoyStation: "41053", surfZone: "prz005", // North Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A unique natural pool formed by a horseshoe-shaped rock formation. Turquoise water enters through two channels creating an almost perfect semi-circle. One of PR's most photographed beaches.",
    descriptionEs: "Una piscina natural única formada por una formación rocosa en herradura. El agua turquesa entra por dos canales creando un semicírculo casi perfecto. Una de las playas más fotografiadas de Puerto Rico.",
    amenities: ["Limited parking", "Small food kiosk"],
    tips: "In winter, large waves crash over the rocks creating dramatic splashes. The pool is calmer but can still have strong water movement. Rocks can be slippery. Not ideal for small children during high surf.",
    tipsEs: "En invierno, grandes olas chocan contra las rocas creando salpicaduras espectaculares. La piscina es más tranquila pero puede tener movimiento fuerte. Las rocas pueden ser resbaladizas. No es ideal para niños pequeños con oleaje alto.",
    riskLevel: "high",
    conditions: {
      waveHeight: "3-5 ft", swellPeriod: "10s", swellDirection: "N",
      waterTemp: "80°F", airTemp: "85°F", humidity: "76%",
      uvIndex: 10, wind: "15 mph N", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:00 PM", nextLowTide: "9:30 AM",
      ripCurrentRisk: "High",
    },
    forecast: [
      { day: "Today",     icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "25%", surf: "3-5 ft", risk: "high" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-4 ft", risk: "high" },
      { day: "Wednesday", icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "30%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 18, name: "Poza de las Mujeres", municipality: "Manatí", region: "North Central",
    coords: { lat: 18.47699, lng: -66.50667 }, buoyStation: "41053", surfZone: "prz005", // North Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A hidden series of natural tidal pools along Manatí's coastline. Crystal-clear shallow pools formed by the rocky coast. Popular with locals for a calm swimming experience.",
    descriptionEs: "Una serie escondida de piscinas naturales de marea a lo largo de la costa de Manatí. Piscinas poco profundas de agua cristalina formadas por la costa rocosa. Popular entre los locales para nadar tranquilamente.",
    amenities: ["Free roadside parking"],
    tips: "The pools are shallow and generally calm but ocean conditions affect them. Visit at low tide for best experience. Rocks are sharp — wear water shoes.",
    tipsEs: "Las piscinas son poco profundas y generalmente tranquilas, pero las condiciones del océano las afectan. Visítalas en marea baja para mejor experiencia. Las rocas son filosas — usa zapatos de agua.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "N",
      waterTemp: "80°F", airTemp: "85°F", humidity: "75%",
      uvIndex: 10, wind: "13 mph NNE", visibility: "Good",
      tideStatus: "Low", nextHighTide: "3:30 PM", nextLowTide: "9:00 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "30%", surf: "2-4 ft", risk: "moderate" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "sun",           high: "87°F", low: "75°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Friday",    icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "1-2 ft", risk: "low" },
    ],
  },
  {
    id: 19, name: "Playa Cerro Gordo (Balneario)", municipality: "Vega Alta", region: "North Central",
    coords: { lat: 18.48157, lng: -66.33975 }, buoyStation: "41053", surfZone: "prz005", // North Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Government-managed beach with calm waters protected by a natural cove. Popular with families. Surrounded by lush vegetation and coconut palms.",
    descriptionEs: "Playa administrada por el gobierno con aguas tranquilas protegidas por una cala natural. Popular entre familias. Rodeada de vegetación exuberante y palmas de coco.",
    amenities: ["Restrooms", "Showers", "Parking", "Picnic areas", "Camping"],
    tips: "Calm waters in the main cove. Left side has better snorkeling. Gets very busy on holidays. Camping available with reservation.",
    tipsEs: "Aguas tranquilas en la cala principal. El lado izquierdo tiene mejor snorkel. Se llena mucho en días festivos. Camping disponible con reservación.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "NE",
      waterTemp: "81°F", airTemp: "86°F", humidity: "74%",
      uvIndex: 10, wind: "11 mph NE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:00 PM", nextLowTide: "8:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "86°F", low: "75°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "low" },
      { day: "Friday",    icon: "rain",          high: "83°F", low: "74°F", precip: "55%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 20, name: "Playa Survival", municipality: "Aguadilla", region: "Northwest",
    coords: { lat: 18.50803, lng: -67.13617 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A hidden gem accessible only by trail. Dramatic cliffs frame this secluded beach. Not great for swimming but spectacular for scenery and photography.",
    descriptionEs: "Una joya escondida accesible solo por sendero. Imponentes acantilados enmarcan esta playa apartada. No es ideal para nadar, pero es espectacular para el paisaje y la fotografía.",
    amenities: ["None — bring everything"],
    tips: "Requires a hike through vegetation. NOT safe for swimming — strong currents and rocky bottom. Best for photographs and exploring. Bring water and sturdy shoes.",
    tipsEs: "Requiere una caminata por la vegetación. NO es segura para nadar — corrientes fuertes y fondo rocoso. Ideal para fotografías y exploración. Lleva agua y zapatos resistentes.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "5-8 ft", swellPeriod: "12s", swellDirection: "NW",
      waterTemp: "79°F", airTemp: "85°F", humidity: "78%",
      uvIndex: 10, wind: "18 mph NNW", visibility: "Fair",
      tideStatus: "Falling", nextHighTide: "8:00 PM", nextLowTide: "2:30 PM",
      ripCurrentRisk: "Extreme",
    },
    forecast: [
      { day: "Today",     icon: "wind",          high: "85°F", low: "74°F", precip: "35%", surf: "5-8 ft",  risk: "extreme" },
      { day: "Tomorrow",  icon: "wind",          high: "84°F", low: "74°F", precip: "40%", surf: "5-8 ft",  risk: "extreme" },
      { day: "Wednesday", icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "25%", surf: "4-6 ft",  risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-5 ft",  risk: "high" },
      { day: "Friday",    icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-4 ft",  risk: "high" },
    ],
  },
  {
    id: 21, name: "Playa El Combate", municipality: "Cabo Rojo", region: "Southwest",
    coords: { lat: 17.97676, lng: -67.21276 }, buoyStation: "42085", surfZone: "prz011", // Southwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A long stretch of beach on PR's southwest coast near the salt flats. Shallow, warm Caribbean waters. Starting point for the Cabo Rojo bike trail.",
    descriptionEs: "Una larga franja de playa en la costa suroeste de Puerto Rico, cerca de las salinas. Aguas caribeñas cálidas y poco profundas. Punto de partida para la ruta ciclista de Cabo Rojo.",
    amenities: ["Parking", "Restaurants", "Some kiosks"],
    tips: "Shallow waters ideal for wading. Can be hot with limited shade. Great sunset views. Several restaurants along the beach road.",
    tipsEs: "Aguas poco profundas ideales para caminar. Puede hacer mucho calor con sombra limitada. Excelentes vistas al atardecer. Varios restaurantes a lo largo del camino de la playa.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "4s", swellDirection: "SW",
      waterTemp: "83°F", airTemp: "90°F", humidity: "67%",
      uvIndex: 12, wind: "9 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "5:00 PM", nextLowTide: "11:00 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "90°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "91°F", low: "78°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "90°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "89°F", low: "77°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "partly-cloudy", high: "88°F", low: "76°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
    ],
  },
  {
    id: 22, name: "Playa Steps (Tres Palmas)", municipality: "Rincón", region: "West",
    coords: { lat: 18.3497, lng: -67.26423 }, buoyStation: "41115", surfZone: "prz010", // West
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Part of the Tres Palmas Marine Reserve, protecting PR's most treasured elkhorn coral. Excellent snorkeling spot and popular surf break.",
    descriptionEs: "Parte de la Reserva Marina Tres Palmas, que protege el coral cuerno de alce más preciado de Puerto Rico. Excelente punto de snorkel y popular rompiente de surf.",
    amenities: ["None — bring supplies"],
    tips: "Named for the concrete steps leading to the water. In summer calm waters are great for snorkeling the reef. In winter, surfing only — dangerous for swimmers. Marine reserve — don't touch coral.",
    tipsEs: "Nombrada por los escalones de concreto que llevan al agua. En verano las aguas tranquilas son ideales para snorkel en el arrecife. En invierno, solo surf — peligrosa para nadadores. Reserva marina — no toques el coral.",
    riskLevel: "high",
    conditions: {
      waveHeight: "6-8 ft", swellPeriod: "12s", swellDirection: "WNW",
      waterTemp: "79°F", airTemp: "84°F", humidity: "79%",
      uvIndex: 9, wind: "17 mph NW", visibility: "Fair",
      tideStatus: "Falling", nextHighTide: "9:00 PM", nextLowTide: "3:15 PM",
      ripCurrentRisk: "High",
    },
    forecast: [
      { day: "Today",     icon: "wind",          high: "84°F", low: "74°F", precip: "30%", surf: "6-8 ft",  risk: "high" },
      { day: "Tomorrow",  icon: "wind",          high: "83°F", low: "74°F", precip: "35%", surf: "7-10 ft", risk: "extreme" },
      { day: "Wednesday", icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "25%", surf: "5-7 ft",  risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-5 ft",  risk: "high" },
      { day: "Friday",    icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "2-3 ft",  risk: "moderate" },
    ],
  },
  {
    id: 23, name: "Balneario de Rincón", municipality: "Rincón", region: "West",
    coords: { lat: 18.34042, lng: -67.25497 }, buoyStation: "41115", surfZone: "prz010", // West
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "The most family-friendly beach in Rincón with calm waters and good facilities. A balneario (government-managed beach) with amenities most Rincón beaches lack.",
    amenities: ["Restrooms", "Showers", "Parking", "Playground"],
    tips: "Calmer than other Rincón beaches. Good for families. The playground makes it good for kids. Visit in summer for calmest conditions.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "7s", swellDirection: "W",
      waterTemp: "80°F", airTemp: "85°F", humidity: "76%",
      uvIndex: 10, wind: "12 mph NW", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:00 PM", nextLowTide: "9:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "85°F", low: "75°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "30%", surf: "2-3 ft", risk: "moderate" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "1-2 ft", risk: "low" },
      { day: "Friday",    icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
    ],
  },
  {
    id: 24, name: "Playa María's", municipality: "Rincón", region: "West",
    coords: { lat: 18.35811, lng: -67.26946 }, buoyStation: "41115", surfZone: "prz010", // West
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "One of Rincón's iconic surf breaks, famous worldwide. Named after a nearby restaurant. Draws surfers from around the globe during winter swell season.",
    amenities: ["None — surf shops nearby"],
    tips: "FOR EXPERIENCED SURFERS ONLY during winter. In summer, calmer conditions allow casual swimming. Watch from the beach bars above if you're not surfing.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "8-12 ft", swellPeriod: "14s", swellDirection: "WNW",
      waterTemp: "79°F", airTemp: "84°F", humidity: "80%",
      uvIndex: 9, wind: "20 mph NW", visibility: "Fair",
      tideStatus: "Falling", nextHighTide: "9:00 PM", nextLowTide: "3:15 PM",
      ripCurrentRisk: "Extreme",
    },
    forecast: [
      { day: "Today",     icon: "wind",          high: "84°F", low: "74°F", precip: "35%", surf: "8-12 ft",  risk: "extreme" },
      { day: "Tomorrow",  icon: "wind",          high: "83°F", low: "73°F", precip: "40%", surf: "10-14 ft", risk: "extreme" },
      { day: "Wednesday", icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "25%", surf: "6-8 ft",   risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "4-6 ft",   risk: "high" },
      { day: "Friday",    icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "3-4 ft",   risk: "moderate" },
    ],
  },
  {
    id: 25, name: "Playa Caña Gorda (Balneario)", municipality: "Guánica", region: "Southwest",
    coords: { lat: 17.95298, lng: -66.88402 }, buoyStation: "42085", surfZone: "prz011", // Southwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "One of the most visited beaches in southern PR. Calm Caribbean waters with a beautiful backdrop of the Guánica Dry Forest. Great for snorkeling and families.",
    amenities: ["Restrooms", "Showers", "Parking", "Picnic areas", "Playground"],
    tips: "Calm waters ideal for children. Good snorkeling along the edges. Near the Guánica Dry Forest (UNESCO Biosphere Reserve) for hiking. Bring reef-safe sunscreen.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "4s", swellDirection: "S",
      waterTemp: "84°F", airTemp: "90°F", humidity: "67%",
      uvIndex: 12, wind: "8 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "5:30 PM", nextLowTide: "11:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "90°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "91°F", low: "78°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "90°F", low: "77°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "89°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "partly-cloudy", high: "88°F", low: "76°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
    ],
  },
  {
    id: 26, name: "Playa Santa", municipality: "Guánica", region: "Southwest",
    coords: { lat: 17.93703, lng: -66.95485 }, buoyStation: "42085", surfZone: "prz011", // Southwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Small, calm Caribbean beach in Guánica. Clear shallow waters with a laid-back local vibe. Less crowded than neighboring Caña Gorda.",
    amenities: ["Limited parking", "Small restaurant"],
    tips: "Very calm, shallow waters. Good for wading and relaxing. Limited facilities — bring supplies. Less crowded alternative to Caña Gorda.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5 ft", swellPeriod: "4s", swellDirection: "S",
      waterTemp: "84°F", airTemp: "90°F", humidity: "66%",
      uvIndex: 12, wind: "7 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "5:30 PM", nextLowTide: "11:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "90°F", low: "77°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "91°F", low: "78°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "90°F", low: "77°F", precip: "10%", surf: "0.5-1 ft", risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "89°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Friday",    icon: "partly-cloudy", high: "88°F", low: "76°F", precip: "30%", surf: "1 ft",     risk: "low" },
    ],
  },
  {
    id: 27, name: "Playa Punta Santiago", municipality: "Humacao", region: "Southeast",
    coords: { lat: 18.1538, lng: -65.76299 }, buoyStation: "41056", surfZone: "prz003", // East coast
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A wide beach on the southeast coast near the Palmas del Mar resort area. Known for its calm waters and views of Monkey Island (Cayo Santiago).",
    amenities: ["Restrooms", "Parking", "Picnic areas"],
    tips: "You can see Cayo Santiago (Monkey Island) from here — home to a research colony of rhesus monkeys. Calm waters for swimming. Good jumping-off point for kayak tours.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "10 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:00 PM", nextLowTide: "8:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "88°F", low: "77°F", precip: "10%", surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "76°F", precip: "35%", surf: "2-3 ft", risk: "low" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 28, name: "Playa Punta Tuna", municipality: "Maunabo", region: "Southeast",
    coords: { lat: 17.99049, lng: -65.88394 }, buoyStation: "41056", surfZone: "prz003", // East/Southeast
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A secluded nature reserve beach on the southeast coast with a historic lighthouse (Faro Punta Tuna). Leaning palm trees and unspoiled coastline.",
    amenities: ["Free limited parking"],
    tips: "Protected nature reserve — no buildings along the shore. Great for long walks and photography. The lighthouse is picturesque. Check conditions before swimming — currents possible.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "SE",
      waterTemp: "82°F", airTemp: "87°F", humidity: "73%",
      uvIndex: 11, wind: "12 mph ESE", visibility: "Good",
      tideStatus: "Falling", nextHighTide: "8:00 PM", nextLowTide: "2:00 PM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "86°F", low: "76°F", precip: "25%", surf: "2-3 ft", risk: "moderate" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "sun",           high: "88°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Friday",    icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "low" },
    ],
  },
  {
    id: 29, name: "Playa Pelicano (Caja de Muertos)", municipality: "Ponce", region: "South Central",
    coords: { lat: 17.88549, lng: -66.52809 }, buoyStation: "42085", surfZone: "prz007", // South Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "On the uninhabited Caja de Muertos (Coffin Island) off Ponce's coast. Pristine white sand and incredibly clear turquoise water. Accessible only by boat.",
    amenities: ["Basic restrooms", "Pavilions"],
    tips: "Book a boat tour from Ponce (La Guancha). Bring everything you need — limited facilities. Snorkeling is excellent. Island also has a historic lighthouse to explore.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "5s", swellDirection: "S",
      waterTemp: "83°F", airTemp: "89°F", humidity: "68%",
      uvIndex: 12, wind: "9 mph SE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "4:30 PM", nextLowTide: "10:45 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "89°F", low: "77°F", precip: "5%",  surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "90°F", low: "77°F", precip: "5%",  surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "89°F", low: "77°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "15%", surf: "1-2 ft", risk: "moderate" },
      { day: "Friday",    icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "30%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 30, name: "Playa Peña Blanca", municipality: "Aguadilla", region: "Northwest",
    coords: { lat: 18.47229, lng: -67.16892 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A quieter alternative to nearby Crash Boat. Small rocky cove with clear waters, popular for snorkeling. Less crowded and more intimate.",
    amenities: ["Limited parking"],
    tips: "Calmer than Crash Boat but still check conditions. Good snorkeling near the rocks. Limited parking and facilities. Bring your own supplies.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "9s", swellDirection: "NW",
      waterTemp: "80°F", airTemp: "85°F", humidity: "76%",
      uvIndex: 10, wind: "13 mph NNW", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:00 PM", nextLowTide: "9:30 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "30%", surf: "3-4 ft", risk: "moderate" },
      { day: "Wednesday", icon: "rain",          high: "83°F", low: "73°F", precip: "55%", surf: "4-5 ft", risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "3-4 ft", risk: "moderate" },
      { day: "Friday",    icon: "mostly-sunny",  high: "85°F", low: "75°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 31, name: "Playa Guajataca", municipality: "Quebradillas", region: "Northwest",
    coords: { lat: 18.48921, lng: -66.95935 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A dramatic beach framed by limestone cliffs and a railroad tunnel. Part of the Guajataca State Forest area. Known for powerful waves and dramatic scenery.",
    amenities: ["Parking", "Food kiosks"],
    tips: "NOT recommended for swimming — powerful waves and dangerous currents. Best for photography and wave watching. The nearby Guajataca Tunnel is a landmark.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "6-10 ft", swellPeriod: "13s", swellDirection: "NW",
      waterTemp: "79°F", airTemp: "84°F", humidity: "79%",
      uvIndex: 9, wind: "19 mph NNW", visibility: "Fair",
      tideStatus: "Falling", nextHighTide: "8:30 PM", nextLowTide: "2:45 PM",
      ripCurrentRisk: "Extreme",
    },
    forecast: [
      { day: "Today",     icon: "wind",          high: "84°F", low: "73°F", precip: "35%", surf: "6-10 ft", risk: "extreme" },
      { day: "Tomorrow",  icon: "wind",          high: "83°F", low: "73°F", precip: "40%", surf: "7-11 ft", risk: "extreme" },
      { day: "Wednesday", icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "25%", surf: "5-7 ft",  risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "85°F", low: "75°F", precip: "15%", surf: "4-6 ft",  risk: "high" },
      { day: "Friday",    icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-5 ft",  risk: "high" },
    ],
  },
  {
    id: 32, name: "Playa Montones", municipality: "Isabela", region: "Northwest",
    coords: { lat: 18.51479, lng: -67.06479 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Home to one of PR's most Instagram-famous natural pools — a semi-circle formation similar to Mar Chiquita. Also known as 'Blue Hole' or 'La Poza' area.",
    amenities: ["Limited — natural pools area nearby"],
    tips: "Natural pools are best at low tide. Rocks are slippery — wear water shoes. Not suitable for swimming in the open ocean area. Check tide tables before visiting.",
    riskLevel: "high",
    conditions: {
      waveHeight: "4-6 ft", swellPeriod: "11s", swellDirection: "NNW",
      waterTemp: "80°F", airTemp: "85°F", humidity: "77%",
      uvIndex: 10, wind: "16 mph N", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "4:00 PM", nextLowTide: "10:15 AM",
      ripCurrentRisk: "High",
    },
    forecast: [
      { day: "Today",     icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "25%", surf: "4-6 ft", risk: "high" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "4-5 ft", risk: "high" },
      { day: "Wednesday", icon: "sun",           high: "87°F", low: "75°F", precip: "10%", surf: "3-4 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "30%", surf: "3-5 ft", risk: "moderate" },
    ],
  },
  {
    id: 33, name: "Playa Dorado (Balneario)", municipality: "Dorado", region: "North Central",
    coords: { lat: 18.47304, lng: -66.28172 }, buoyStation: "41053", surfZone: "prz005", // North Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Government-managed beach in the resort town of Dorado. Long stretch of sand with facilities and relatively calm conditions for the north coast.",
    amenities: ["Restrooms", "Showers", "Parking", "Picnic areas"],
    tips: "Good for families. Near the Dorado resort area. Can have moderate surf — check conditions. Less crowded on weekdays.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "7s", swellDirection: "NE",
      waterTemp: "81°F", airTemp: "86°F", humidity: "74%",
      uvIndex: 10, wind: "11 mph NE", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "2:30 PM", nextLowTide: "9:00 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "86°F", low: "75°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "35%", surf: "2-4 ft", risk: "moderate" },
      { day: "Friday",    icon: "rain",          high: "83°F", low: "74°F", precip: "55%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 34, name: "Playa Navio", municipality: "Vieques", region: "East Islands",
    coords: { lat: 18.09243, lng: -65.44485 }, buoyStation: "41056", surfZone: "prz013", // Vieques
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A beautiful secluded beach on Vieques' south coast within the Wildlife Refuge. White sand and turquoise water that's remarkably calm and clear. One of the least visited beaches despite being one of the most stunning.",
    amenities: ["None — uninhabited island"],
    tips: "Inside the Wildlife Refuge — check gate hours. Very secluded, often nearly empty. Calm, clear waters great for swimming. Dirt road access. Arrive early for the best experience with minimal crowds.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "ENE",
      waterTemp: "82°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "10 mph E", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "3:00 PM", nextLowTide: "9:15 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "88°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "50%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 35, name: "Playa Caracas (Red Beach)", municipality: "Vieques", region: "East Islands",
    coords: { lat: 18.10953, lng: -65.41273 }, buoyStation: "41056", surfZone: "prz013", // Vieques
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "One of the most popular beaches in the Vieques Wildlife Refuge. Named for its reddish sand, this beach offers calm waters and easy access compared to other refuge beaches. A great first stop on a Vieques beach tour.",
    amenities: ["Gazebos", "Restrooms (basic)"],
    tips: "Inside the Wildlife Refuge — gate hours apply. Easier access than La Chiva. Bring supplies as facilities are basic. Good snorkeling near rocky areas.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "SE",
      waterTemp: "83°F", airTemp: "88°F", humidity: "70%",
      uvIndex: 11, wind: "9 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "3:30 PM", nextLowTide: "9:45 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "88°F", low: "76°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "89°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "10%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "25%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "85°F", low: "75°F", precip: "50%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 36, name: "Zoni Beach", municipality: "Culebra", region: "East Islands",
    coords: { lat: 18.32014, lng: -65.2551 }, buoyStation: "41056", surfZone: "prz012", // Culebra
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A less crowded alternative to Flamenco Beach with equally stunning diamond-dust sand and crystal-clear waters. Sea turtles nest here between April and June. Natural caves and sea grape vines add to its wild beauty.",
    amenities: ["None — bring everything"],
    tips: "Quieter than Flamenco. Watch for turtle nesting sites Apr-Jun. No facilities — bring all supplies including shade. Great spot to set up a hammock between trees.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "7s", swellDirection: "E",
      waterTemp: "81°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "12 mph ESE", visibility: "Excellent",
      tideStatus: "Rising", nextHighTide: "2:45 PM", nextLowTide: "9:00 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "88°F", low: "77°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 37, name: "Sandy Beach", municipality: "Rincón", region: "West",
    coords: { lat: 18.37065, lng: -67.2587 }, buoyStation: "41115", surfZone: "prz010", // West
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A popular surf beach in Rincón with a wide sandy shoreline. More beginner-friendly than Domes or María's during moderate conditions. The laid-back beach town vibe makes it a favorite for both locals and visitors.",
    amenities: ["Parking", "Restaurants nearby"],
    tips: "Better for beginner surfers than other Rincón breaks. In summer conditions are calmer for swimming. Nearby restaurants and accommodation make it convenient for extended stays.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "3-5 ft", swellPeriod: "10s", swellDirection: "W",
      waterTemp: "80°F", airTemp: "85°F", humidity: "77%",
      uvIndex: 10, wind: "14 mph NW", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:30 PM", nextLowTide: "9:45 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "3-5 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "30%", surf: "4-6 ft", risk: "high" },
      { day: "Wednesday", icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "25%", surf: "3-4 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "sun",           high: "87°F", low: "75°F", precip: "10%", surf: "1-2 ft", risk: "low" },
    ],
  },
  {
    id: 38, name: "Cayo Icacos", municipality: "Fajardo", region: "Northeast",
    coords: { lat: 18.38432, lng: -65.59169 }, buoyStation: "41053", surfZone: "prz002", // Northeast
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A small uninhabited island off Fajardo's coast with some of the clearest water on Puerto Rico's east coast. Long strips of reef alongside an abandoned pier host abundant marine life. Accessible by water taxi or catamaran tour.",
    amenities: ["None — uninhabited cay"],
    tips: "Book a boat tour from Fajardo. The water clarity here is exceptional for snorkeling. Bring everything — no facilities. Popular with catamaran tours from Fajardo.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "72%",
      uvIndex: 11, wind: "10 mph ESE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "2:30 PM", nextLowTide: "8:45 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "87°F", low: "76°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "88°F", low: "77°F", precip: "5%",  surf: "0.5-1 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "30%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 39, name: "Esperanza Beach", municipality: "Vieques", region: "East Islands",
    coords: { lat: 18.09467, lng: -65.47127 }, buoyStation: "41056", surfZone: "prz013", // Vieques
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A town beach along Vieques' Esperanza malecón (boardwalk). Calm Caribbean waters with a lively waterfront lined with restaurants and bars. The most accessible beach in Vieques — no car needed if staying in Esperanza.",
    amenities: ["Restaurants nearby", "Malecón boardwalk"],
    tips: "Walk-to beach from Esperanza town. Calm waters for swimming. Great sunset spot. The malecón has restaurants and bars — try the local seafood. Good starting point for bioluminescent bay tours.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5 ft", swellPeriod: "4s", swellDirection: "SE",
      waterTemp: "83°F", airTemp: "88°F", humidity: "70%",
      uvIndex: 11, wind: "8 mph ESE", visibility: "Excellent",
      tideStatus: "Low", nextHighTide: "4:00 PM", nextLowTide: "10:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "88°F", low: "76°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "89°F", low: "77°F", precip: "5%",  surf: "0.5 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "10%", surf: "0.5-1 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "25%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "85°F", low: "75°F", precip: "50%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 40, name: "Poza del Obispo", municipality: "Arecibo", region: "North Central",
    coords: { lat: 18.48193, lng: -66.69678 }, buoyStation: "41053", surfZone: "prz005", // North Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A unique natural beach pool where ocean waves crash over coral reefs into a calm, sheltered pool. The golden sand and dramatic wave action make it one of the most unique beach experiences in Puerto Rico.",
    amenities: ["Limited parking"],
    tips: "Best visited when waves are moderate — too calm and the pool doesn't fill, too rough and it's dangerous. Wear water shoes on the reef. Great for photography. Not suitable for traditional swimming.",
    riskLevel: "high",
    conditions: {
      waveHeight: "4-6 ft", swellPeriod: "11s", swellDirection: "N",
      waterTemp: "80°F", airTemp: "85°F", humidity: "76%",
      uvIndex: 10, wind: "15 mph N", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:00 PM", nextLowTide: "9:30 AM",
      ripCurrentRisk: "High",
    },
    forecast: [
      { day: "Today",     icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "25%", surf: "4-6 ft", risk: "high" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-5 ft", risk: "high" },
      { day: "Wednesday", icon: "sun",           high: "87°F", low: "75°F", precip: "10%", surf: "2-4 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "30%", surf: "3-5 ft", risk: "moderate" },
    ],
  },
  {
    id: 41, name: "Playa Escondida", municipality: "Fajardo", region: "Northeast",
    coords: { lat: 18.37687, lng: -65.6453 }, buoyStation: "41053", surfZone: "prz002", // Northeast
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A secluded beach accessible by hiking trail from Seven Seas Beach. Protected by a coral wall creating a shallow, calm area. Surrounded by lush rainforest scenery from nearby El Yunque.",
    amenities: ["None — hike-in only"],
    tips: "Must hike from Seven Seas Beach. The trail also connects to Playa Colorá. Waters may appear calm but dangerous currents exist — people have drowned here. Stay in the coral-protected shallow area only.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "74%",
      uvIndex: 11, wind: "11 mph ESE", visibility: "Good",
      tideStatus: "Falling", nextHighTide: "8:30 PM", nextLowTide: "2:45 PM",
      ripCurrentRisk: "Extreme",
    },
    forecast: [
      { day: "Today",     icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "25%", surf: "2-3 ft", risk: "extreme" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "88°F", low: "77°F", precip: "15%", surf: "1-2 ft", risk: "high" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "20%", surf: "1-2 ft", risk: "high" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "extreme" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "3-4 ft", risk: "extreme" },
    ],
  },
  {
    id: 42, name: "Playa Puerto Hermina", municipality: "Quebradillas", region: "Northwest",
    coords: { lat: 18.48371, lng: -66.90212 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A charming small beach tucked between dramatic limestone cliffs in Quebradillas. The sheltered cove provides calmer conditions than nearby open-coast beaches. A local favorite that rarely appears in tourist guides.",
    amenities: ["Limited parking"],
    tips: "Sheltered cove is calmer than open north coast. Limited parking — arrive early. The cliffs provide some afternoon shade. A quieter alternative to busier northwest beaches.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "NW",
      waterTemp: "80°F", airTemp: "85°F", humidity: "76%",
      uvIndex: 10, wind: "13 mph N", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "3:00 PM", nextLowTide: "9:30 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "30%", surf: "3-4 ft", risk: "moderate" },
      { day: "Wednesday", icon: "rain",          high: "83°F", low: "73°F", precip: "55%", surf: "4-5 ft", risk: "high" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "mostly-sunny",  high: "85°F", low: "75°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
    ],
  },
  {
    id: 43, name: "Balneario Puerto Nuevo", municipality: "Vega Baja", region: "North Central",
    coords: { lat: 18.49156, lng: -66.39875 }, buoyStation: "41053", surfZone: "prz005", // North Central
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Distinguished with the Blue Flag designation, Puerto Nuevo is famous for its dramatic natural rock formations. Massive outcrops protect the swimming area from strong waves, creating calm waters ideal for families. Soft golden sand and postcard-worthy views.",
    amenities: ["Restrooms", "Showers", "Parking", "Picnic areas"],
    tips: "The rock formations create a natural barrier making this one of the calmest north coast beaches. Blue Flag certified — high water quality and safety standards. Great for photography at golden hour. Gets busy on weekends.",
    riskLevel: "low",
    conditions: {
      waveHeight: "1-2 ft", swellPeriod: "6s", swellDirection: "NE",
      waterTemp: "81°F", airTemp: "86°F", humidity: "74%",
      uvIndex: 10, wind: "11 mph NE", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "2:30 PM", nextLowTide: "9:00 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "86°F", low: "75°F", precip: "10%", surf: "1-2 ft", risk: "low" },
      { day: "Tomorrow",  icon: "sun",           high: "87°F", low: "76°F", precip: "10%", surf: "1 ft",   risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "1-2 ft", risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "low" },
      { day: "Friday",    icon: "rain",          high: "83°F", low: "74°F", precip: "55%", surf: "2-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 44, name: "Playita del Condado", municipality: "San Juan", region: "Metro",
    coords: { lat: 18.46107, lng: -66.08232 }, buoyStation: "41053", surfZone: "prz001", // Metro
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "One of the smallest and most charming beaches in San Juan. Calm, shallow waters tucked between the Condado lagoon bridge and the hotel strip. A hidden family-friendly gem popular with locals.",
    amenities: ["None — walk from Condado hotels"],
    tips: "No parking — walk from Condado district toward Puente Dos Hermanos. Calm, shallow water perfect for small children. Less crowded than main Condado Beach. Protected from strong ocean currents.",
    riskLevel: "low",
    conditions: {
      waveHeight: "0.5-1 ft", swellPeriod: "5s", swellDirection: "NE",
      waterTemp: "80°F", airTemp: "86°F", humidity: "75%",
      uvIndex: 10, wind: "10 mph E", visibility: "Good",
      tideStatus: "Rising", nextHighTide: "2:00 PM", nextLowTide: "8:30 AM",
      ripCurrentRisk: "Low",
    },
    forecast: [
      { day: "Today",     icon: "sun",           high: "86°F", low: "75°F", precip: "10%", surf: "0.5-1 ft", risk: "low" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "0.5-1 ft", risk: "low" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "15%", surf: "1 ft",     risk: "low" },
      { day: "Thursday",  icon: "partly-cloudy", high: "85°F", low: "75°F", precip: "35%", surf: "1-2 ft",   risk: "low" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "2-3 ft",   risk: "moderate" },
    ],
  },
  {
    id: 45, name: "Playa Negra (Black Sand Beach)", municipality: "Vieques", region: "East Islands",
    coords: { lat: 18.09576, lng: -65.49233 }, buoyStation: "41056", surfZone: "prz013", // Vieques
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A dramatic black sand beach on Vieques accessible by a short hike through lush forest. The volcanic sand contrasts beautifully with bright blue water, creating an otherworldly setting. Rarely crowded — a true hidden gem.",
    amenities: ["None — bring everything"],
    tips: "Requires short hike through forest. Rarely crowded — expect solitude. The black sand gets extremely hot in direct sun. Bring water shoes and plenty of water. Not ideal for swimming in rough conditions.",
    riskLevel: "high",
    conditions: {
      waveHeight: "3-4 ft", swellPeriod: "9s", swellDirection: "SE",
      waterTemp: "82°F", airTemp: "88°F", humidity: "72%",
      uvIndex: 12, wind: "13 mph ESE", visibility: "Good",
      tideStatus: "Falling", nextHighTide: "7:00 PM", nextLowTide: "1:00 PM",
      ripCurrentRisk: "High",
    },
    forecast: [
      { day: "Today",     icon: "partly-cloudy", high: "88°F", low: "76°F", precip: "25%", surf: "3-4 ft", risk: "high" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "88°F", low: "77°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "88°F", low: "76°F", precip: "15%", surf: "2-3 ft", risk: "moderate" },
      { day: "Thursday",  icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "30%", surf: "3-4 ft", risk: "high" },
      { day: "Friday",    icon: "rain",          high: "85°F", low: "75°F", precip: "55%", surf: "3-5 ft", risk: "high" },
    ],
  },
  {
    id: 46, name: "Pozo Teodoro", municipality: "Isabela", region: "Northwest",
    coords: { lat: 18.5139, lng: -67.03619 }, buoyStation: "41121", surfZone: "prz008", // Northwest
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "A natural tidal pool near Jobos Beach where waves break over rock formations creating shallow, calm waters — similar to Mar Chiquita. A local family favorite offering a safe wading experience for children.",
    amenities: ["Free parking"],
    tips: "Just minutes from Jobos Beach. Waves break over rocks creating a calm shallow pool. Best at low to moderate tide. Wear water shoes on the rocks. A much safer alternative to swimming at Jobos.",
    riskLevel: "moderate",
    conditions: {
      waveHeight: "3-5 ft", swellPeriod: "10s", swellDirection: "NNW",
      waterTemp: "80°F", airTemp: "85°F", humidity: "77%",
      uvIndex: 10, wind: "14 mph N", visibility: "Good",
      tideStatus: "Low", nextHighTide: "3:30 PM", nextLowTide: "9:45 AM",
      ripCurrentRisk: "Moderate",
    },
    forecast: [
      { day: "Today",     icon: "mostly-sunny",  high: "85°F", low: "74°F", precip: "20%", surf: "3-5 ft", risk: "moderate" },
      { day: "Tomorrow",  icon: "partly-cloudy", high: "84°F", low: "74°F", precip: "30%", surf: "4-5 ft", risk: "high" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "15%", surf: "3-4 ft", risk: "moderate" },
      { day: "Thursday",  icon: "mostly-sunny",  high: "86°F", low: "75°F", precip: "20%", surf: "2-3 ft", risk: "moderate" },
      { day: "Friday",    icon: "partly-cloudy", high: "85°F", low: "74°F", precip: "30%", surf: "3-4 ft", risk: "moderate" },
    ],
  },
  {
    id: 47, name: "Playa Colorá", municipality: "Fajardo", region: "Northeast",
    coords: { lat: 18.37717, lng: -65.64114 }, buoyStation: "41053", surfZone: "prz002", // Northeast
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    description: "Named for its distinctive reddish-colored sand, this secluded beach is reached by hiking from Seven Seas Beach. Turquoise waters contrast dramatically with the rust-toned sand. A true hidden gem for adventurous visitors.",
    amenities: ["None — hike-in only"],
    tips: "Access via the same trail system as Playa Escondida from Seven Seas Beach. Bring all supplies. The reddish sand is unique on the island. Currents can be dangerous — exercise extreme caution in the water.",
    riskLevel: "extreme",
    conditions: {
      waveHeight: "2-3 ft", swellPeriod: "8s", swellDirection: "E",
      waterTemp: "82°F", airTemp: "87°F", humidity: "74%",
      uvIndex: 11, wind: "11 mph ESE", visibility: "Good",
      tideStatus: "Falling", nextHighTide: "8:00 PM", nextLowTide: "2:30 PM",
      ripCurrentRisk: "Extreme",
    },
    forecast: [
      { day: "Today",     icon: "partly-cloudy", high: "87°F", low: "76°F", precip: "25%", surf: "2-3 ft", risk: "extreme" },
      { day: "Tomorrow",  icon: "mostly-sunny",  high: "88°F", low: "77°F", precip: "15%", surf: "1-2 ft", risk: "high" },
      { day: "Wednesday", icon: "mostly-sunny",  high: "87°F", low: "76°F", precip: "20%", surf: "1-2 ft", risk: "high" },
      { day: "Thursday",  icon: "partly-cloudy", high: "86°F", low: "75°F", precip: "35%", surf: "2-3 ft", risk: "extreme" },
      { day: "Friday",    icon: "rain",          high: "84°F", low: "75°F", precip: "55%", surf: "3-4 ft", risk: "extreme" },
    ],
  },
];

const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  low:      { label: "Low Risk",       color: "#22c55e", bg: "#052e16", message: "Conditions are favorable for swimming" },
  moderate: { label: "Moderate Risk",  color: "#eab308", bg: "#422006", message: "Use caution — some hazards present" },
  high:     { label: "High Risk",      color: "#f97316", bg: "#431407", message: "Swimming not recommended" },
  extreme:  { label: "Extreme Danger", color: "#ef4444", bg: "#450a0a", message: "DO NOT SWIM" },
};

const SAFETY_TIPS: { icon: LucideIcon; en: { title: string; text: string }; es: { title: string; text: string } }[] = [
  { icon: Waves,
    en: { title: "Rip Currents",  text: "If caught, swim parallel to shore until free of the current, then swim back. Never fight against it." },
    es: { title: "Corrientes", text: "Si te atrapa una corriente, nada paralelo a la orilla hasta salir, luego regresa a nado. Nunca luches contra ella." } },
  { icon: Flag,
    en: { title: "Flag System",   text: "Red = Danger/No swimming. Yellow = Caution. Green = Safe. Double red = Beach closed." },
    es: { title: "Sistema de Banderas", text: "Roja = Peligro/No nadar. Amarilla = Precaución. Verde = Seguro. Doble roja = Playa cerrada." } },
  { icon: Users,
    en: { title: "Buddy System",  text: "Never swim alone. Always keep an eye on children and weak swimmers in the water." },
    es: { title: "Sistema de Compañero", text: "Nunca nades solo. Siempre vigila a los niños y nadadores débiles en el agua." } },
  { icon: LifeBuoy,
    en: { title: "Life Jackets",  text: "Non-swimmers and children should always wear U.S. Coast Guard-approved life jackets in the ocean." },
    es: { title: "Chalecos Salvavidas", text: "Los no-nadadores y niños siempre deben usar chalecos aprobados por la Guardia Costera en el océano." } },
];

// ─── EMERGENCY CONTACTS ───────────────────────────────────────────────────────

const EMERGENCY_CONTACTS = {
  primary: [
    { name: "Emergency Services",              tel: "911",         display: "911",              note: "Police · Fire · Medical · Coast Guard" },
    { name: "US Coast Guard Sector San Juan",  tel: "7872892041",  display: "(787) 289-2041",   note: "Maritime search & rescue · VHF Ch. 16" },
    { name: "FURA — Maritime Police Unit",     tel: "7877923333",  display: "(787) 792-3333",   note: "PRPD maritime & rapid response division" },
    { name: "NMEAD — Emergency Management",    tel: "7877240124",  display: "(787) 724-0124",   note: "Puerto Rico Emergency Mgmt Agency" },
  ],
  municipal: [
    { municipality: "San Juan",   tel: "7877267020", display: "(787) 726-7020" },
    { municipality: "Aguadilla",  tel: "7878822020", display: "(787) 882-2020" },
    { municipality: "Luquillo",   tel: "7878892020", display: "(787) 889-2020" },
    { municipality: "Cabo Rojo",  tel: "7878512020", display: "(787) 851-2020" },
    { municipality: "Culebra",    tel: "7877423501", display: "(787) 742-3501" },
    { municipality: "Rincón",     tel: "7878232020", display: "(787) 823-2020" },
    { municipality: "Isabela",    tel: "7878722020", display: "(787) 872-2020" },
    { municipality: "Guánica",    tel: "7878212020", display: "(787) 821-2020" },
    { municipality: "Humacao",    tel: "7878522020", display: "(787) 852-2020" },
    { municipality: "Dorado",     tel: "7877962020", display: "(787) 796-2020" },
    { municipality: "Arecibo",    tel: "7878782020", display: "(787) 878-2020" },
    { municipality: "Ponce",      tel: "7872844040", display: "(787) 284-4040" },
    { municipality: "Mayagüez",   tel: "7878328383", display: "(787) 832-8383" },
    { municipality: "Fajardo",    tel: "7878632020", display: "(787) 863-2020" },
    { municipality: "Vieques",    tel: "7877412020", display: "(787) 741-2020" },
  ],
};

// ─── UI TRANSLATIONS ─────────────────────────────────────────────────────────

const AMENITY_ES: Record<string, string> = {
  "Restrooms": "Baños",
  "Basic restrooms": "Baños básicos",
  "Food kiosks": "Quioscos de comida",
  "Small food kiosk": "Pequeño quiosco de comida",
  "Some kiosks": "Algunos quioscos",
  "Food vendors": "Vendedores de comida",
  "Parking": "Estacionamiento",
  "Parking (limited)": "Estacionamiento (limitado)",
  "Parking (roadside)": "Estacionamiento al borde de la carretera",
  "Parking ($5)": "Estacionamiento ($5)",
  "Limited parking": "Estacionamiento limitado",
  "Free roadside parking": "Estacionamiento gratuito",
  "Showers": "Duchas",
  "Camping": "Camping",
  "Hotels": "Hoteles",
  "Hotels nearby": "Hoteles cercanos",
  "Restaurants": "Restaurantes",
  "Restaurants nearby": "Restaurantes cercanos",
  "Restaurant/Bar": "Restaurante/Bar",
  "Water sports rentals": "Alquiler de deportes acuáticos",
  "Water sports": "Deportes acuáticos",
  "Chair rentals": "Alquiler de sillas",
  "Chair/umbrella rentals": "Alquiler de sillas/sombrillas",
  "Snorkeling": "Snorkel",
  "Snorkeling gear rental": "Alquiler de equipo de snorkel",
  "Diving pier": "Muelle de buceo",
  "Hiking trail access": "Acceso a senderos",
  "Picnic areas": "Áreas de picnic",
  "Shade trees": "Árboles de sombra",
  "Playground": "Área de juegos",
  "Accessibility ramps": "Rampas de accesibilidad",
  "Pavilions": "Pabellones",
  "Surf shops nearby": "Tiendas de surf cercanas",
  "None — bring supplies": "Ninguna — lleva lo necesario",
  "None — bring everything": "Ninguna — lleva todo lo necesario",
  "None — surf shops nearby": "Ninguna — tiendas de surf cercanas",
  "Limited — residential area": "Limitada — zona residencial",
  "some food trucks": "Algunos food trucks",
  "Limited — natural pools area nearby": "Limitada — piscinas naturales cercanas",
};

const REGION_ES: Record<string, string> = {
  "East Islands": "Islas del Este",
  "Metro": "Metro",
  "Southwest": "Suroeste",
  "Northwest": "Noroeste",
  "Northeast": "Noreste",
  "West": "Oeste",
  "North Central": "Norte Central",
  "Southeast": "Sureste",
  "South Central": "Sur Central",
};

const TIDE_ES: Record<string, string> = {
  Rising: "Subiendo", Falling: "Bajando", High: "Alta", Low: "Baja",
};

const VIS_ES: Record<string, string> = {
  Excellent: "Excelente", Good: "Buena", Fair: "Regular",
};


const UI = {
  en: {
    disclaimer: {
      title: "Before You Head to the Beach",
      body: "All conditions are advisory only, sourced from the NWS. Always exercise personal judgment and obey posted signs and lifeguard instructions.",
      officialForecasts: "Official forecasts:",
      button: "I Understand — Show me the beaches",
    },
    header: {
      tagline: "Puerto Rico's beach guide — real-time conditions & safety",
      loading: "Loading data…",
      updated: (ago: string) => `Updated ${ago}`,
      searchPlaceholder: "Search beaches, towns...",
      allRegions: "All Regions",
    },
    ticker: {
      label: (n: number) => `${n} NWS Alert${n > 1 ? 's' : ''}`,
      live: "LIVE",
    },
    safetyGuide: { title: "Ocean Safety Quick Guide" },
    emergency: {
      title: "Emergency Contacts",
      verify: "Always dial 911 for immediate emergencies. Verify local precinct numbers at",
      municipalPolice: "Local Police — Coastal Municipalities",
    },
    risk: {
      low: "Low Risk", moderate: "Moderate Risk", high: "High Risk", extreme: "Extreme Danger",
      unknown: "Risk Unknown",
      short: { low: "Low", moderate: "Moderate", high: "High", extreme: "Extreme" },
      msg: {
        low: "Conditions are favorable for swimming",
        moderate: "Use caution — some hazards present",
        high: "Swimming not recommended",
        extreme: "DO NOT SWIM",
        unavailable: "Risk data unavailable —",
        checkNws: "check NWS directly ↗",
      },
    },
    sources: { nwsLive: "NWS LIVE", nwsSurf: "NWS SURF ZONE", buoyData: "BUOY DATA" },
    detail: {
      getDirections: "Get Directions",
      liveConditions: "Live Conditions",
      todayForecast: "Today's Forecast",
      fiveDayForecast: "5-Day Outlook",
      nwsAlertsHeader: "NWS Live Alerts",
      nwsLiveBadge: "NWS LIVE",
      alertExpires: (d: string) => `Source: NWS San Juan · Expires: ${d}`,
      amenities: "Amenities & Facilities",
      tips: "Tips & Local Knowledge",
      dataSources: "Data sources:",
      conditionsAdvisory: "Conditions are advisory only. Always assess local conditions before entering the water.",
    },
    cond: {
      surfHeight: "Surf Height", ripCurrents: "Rip Currents", wind: "Wind",
      waterTemp: "Water Temp", uvIndex: "UV Index", airTemp: "Air Temp",
      humidity: "Humidity", visibility: "Visibility", swell: "Swell",
      tide: "Tide", nextHigh: "Next High Tide", nextLow: "Next Low Tide",
      unavailable: "Unavailable",
    },
    forecast: { day: "Day", high: "High", low: "Low", rain: "Rain", surf: "Surf", risk: "Risk" },
    home: {
      noBeachesTitle: "No beaches found",
      noBeachesSub: "Try adjusting your search or filters",
      dataUnavailable: "Data unavailable · Check NWS ↗",
    },
    footer: {
      beaches: "47 beaches across Puerto Rico · Real-time conditions powered by",
      advisory: "All conditions are advisory only. Always exercise personal judgment and obey posted signs and lifeguard instructions.",
      comingSoon: "Coming soon: Interactive map · Push alerts",
    },
  },
  es: {
    disclaimer: {
      title: "Antes de Ir a la Playa",
      body: "Las condiciones son de referencia únicamente, basadas en el NWS. Siempre usa tu juicio personal y obedece los letreros y las instrucciones de los guardavidas.",
      officialForecasts: "Pronósticos oficiales:",
      button: "Entendido — Llevarme a las Playas",
    },
    header: {
      tagline: "Guía de playas de Puerto Rico — condiciones en tiempo real y seguridad",
      loading: "Cargando datos…",
      updated: (ago: string) => `Actualizado hace ${ago}`,
      searchPlaceholder: "Buscar playas, pueblos...",
      allRegions: "Todas las Regiones",
    },
    ticker: {
      label: (n: number) => `${n} Alerta${n > 1 ? 's' : ''} NWS`,
      live: "EN VIVO",
    },
    safetyGuide: { title: "Guía Rápida de Seguridad en el Mar" },
    emergency: {
      title: "Contactos de Emergencia",
      verify: "Siempre llama al 911 en emergencias. Verifica los números de precinctos en",
      municipalPolice: "Policía Local — Municipios Costeros",
    },
    risk: {
      low: "Riesgo Bajo", moderate: "Riesgo Moderado", high: "Riesgo Alto", extreme: "Peligro Extremo",
      unknown: "Riesgo Desconocido",
      short: { low: "Bajo", moderate: "Moderado", high: "Alto", extreme: "Extremo" },
      msg: {
        low: "Condiciones favorables para nadar",
        moderate: "Precaución — algunos peligros presentes",
        high: "No se recomienda nadar",
        extreme: "NO NADES",
        unavailable: "Datos de riesgo no disponibles —",
        checkNws: "consulta el NWS directamente ↗",
      },
    },
    sources: { nwsLive: "NWS EN VIVO", nwsSurf: "ZONA SURF NWS", buoyData: "DATOS DE BOYA" },
    detail: {
      getDirections: "Cómo Llegar",
      liveConditions: "Condiciones en Vivo",
      todayForecast: "Pronóstico de Hoy",
      fiveDayForecast: "Pronóstico de 5 Días",
      nwsAlertsHeader: "Alertas en Vivo del NWS",
      nwsLiveBadge: "NWS EN VIVO",
      alertExpires: (d: string) => `Fuente: NWS San Juan · Vence: ${d}`,
      amenities: "Facilidades y Servicios",
      tips: "Consejos y Conocimiento Local",
      dataSources: "Fuentes de datos:",
      conditionsAdvisory: "Las condiciones son de referencia únicamente. Evalúa siempre las condiciones locales antes de entrar al agua.",
    },
    cond: {
      surfHeight: "Altura de Olas", ripCurrents: "Corrientes", wind: "Viento",
      waterTemp: "Temp. del Agua", uvIndex: "Índice UV", airTemp: "Temp. del Aire",
      humidity: "Humedad", visibility: "Visibilidad", swell: "Swell",
      tide: "Marea", nextHigh: "Próx. Marea Alta", nextLow: "Próx. Marea Baja",
      unavailable: "No Disponible",
    },
    forecast: { day: "Día", high: "Máx", low: "Mín", rain: "Lluvia", surf: "Surf", risk: "Riesgo" },
    home: {
      noBeachesTitle: "No se encontraron playas",
      noBeachesSub: "Intenta ajustar tu búsqueda o filtros",
      dataUnavailable: "Datos no disponibles · Ver NWS ↗",
    },
    footer: {
      beaches: "47 playas en Puerto Rico · Condiciones en tiempo real por",
      advisory: "Las condiciones son de referencia únicamente. Siempre usa tu propio juicio y obedece los letreros y las instrucciones de los guardavidas.",
      comingSoon: "Próximamente: Mapa interactivo · Alertas push",
    },
  },
};

// ─── LIVE DATA CACHE ─────────────────────────────────────────────────────────
// Module-level — survives view state changes (home ↔ detail) without re-fetching.

const ALERTS_TTL_MS       =  5 * 60 * 1000 //  5 minutes — time-critical advisories
const BUOY_TTL_MS         = 10 * 60 * 1000 // 10 minutes — buoys update every 30-60 min
const WEATHER_TTL_MS      = 15 * 60 * 1000 // 15 minutes — NWS hourly forecast
const SURF_FORECAST_TTL_MS = 15 * 60 * 1000 // 15 minutes — NWS surf zones update twice daily

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
  periods: SurfZonePeriod[];
  fetchedAt: number;
}>()

let alertsCache: { alerts: BeachAlert[]; fetchedAt: number } | null = null

/** Derive a RiskLevel from surf height when no explicit rip current rating is available (SRF days 3–5). */
function surfHeightToRisk(heightFt: number | null): RiskLevel {
  if (heightFt == null) return 'low'
  if (heightFt >= 10) return 'extreme'
  if (heightFt >= 7)  return 'high'
  if (heightFt >= 4)  return 'moderate'
  return 'low'
}

function mergeForecast(
  staticForecast: ForecastDay[],
  liveForecast: LiveForecastDay[],
  surfPeriods: SurfZonePeriod[],
): ForecastDay[] {
  // SRF emits a TONIGHT period that weather forecast groups into Today — skip it so indices align.
  const dayPeriods = surfPeriods.filter(p => !/^tonight$/i.test(p.label))
  return liveForecast.map((live, i) => {
    const period = dayPeriods[i] ?? null
    let surf = staticForecast[i]?.surf ?? '—'
    let risk: RiskLevel = staticForecast[i]?.risk ?? 'low'
    if (period) {
      if (period.surfHeightText) surf = period.surfHeightText
      if (period.ripCurrentRisk) {
        risk = period.ripCurrentRisk.toLowerCase() as RiskLevel
      } else if (period.surfHeightFt != null) {
        risk = surfHeightToRisk(period.surfHeightFt)
      }
    }
    return { day: live.day, icon: live.icon, high: live.high, low: live.low, precip: live.precip, surf, risk }
  })
}

// ─── TRANSLATION HELPERS ─────────────────────────────────────────────────────

function translateDay(day: string, lang: Lang): string {
  if (lang !== 'es') return day
  const map: Record<string, string> = {
    'Today': 'Hoy', 'Tonight': 'Esta Noche', 'Tomorrow': 'Mañana',
    'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue',
    'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom',
  }
  return map[day] ?? day
}

function translateSurfHeight(text: string, lang: Lang): string {
  if (lang !== 'es' || !text || text === '—') return text
  return text
    .replace(/\baround\b/gi, 'Aprox.')
    .replace(/\bfeet\b/gi, 'pies')
    .replace(/\bfoot\b/gi, 'pie')
    .replace(/\bto\b/gi, 'a')
    .replace(/\bft\b/gi, 'pies')
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

function RiskBadge({ level, size = "md", lang = "en" }: { level: RiskLevel; size?: "sm" | "md" | "lg"; lang?: Lang }) {
  const r = RISK_CONFIG[level];
  const label = UI[lang].risk[level];
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
      <BadgeIcon size={s.iconSize} /> {label}
    </span>
  );
}

function BeachCard({ beach, onClick, liveData, riskAssessment, lang = "en" }: {
  beach: Beach;
  onClick: () => void;
  liveData?: LiveBeachData;
  riskAssessment?: RiskAssessment;
  lang?: Lang;
}) {
  return (
    <button onClick={onClick} className="beach-card" style={{
      appearance: "none", WebkitAppearance: "none",
      padding: 0, margin: 0, textAlign: "left",
      cursor: "pointer", display: "flex", flexDirection: "column",
      borderRadius: "18px", overflow: "hidden", background: "#d8e2ec",
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "0 2px 16px rgba(0,0,0,0.08)", width: "100%",
    }}>
      {/* Image with full text overlay */}
      <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beach.image} alt={beach.name} style={{ width: "100%", height: "100%", objectFit: "cover", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", pointerEvents: "none" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(4,11,22,0.97) 100%)",
        }} />
        {/* Directions — top right */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${beach.coords.lat},${beach.coords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="directions-link"
          style={{
            position: "absolute", top: "12px", right: "12px",
            width: "34px", height: "34px", borderRadius: "50%",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", textDecoration: "none", flexShrink: 0,
          }}
          title="Get directions"
        >
          <MapPin size={14} />
        </a>
        {/* Name + location + risk badge overlay — bottom */}
        <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "56px" }}>
          {riskAssessment && !riskAssessment.unavailable && (
            <div style={{ marginBottom: "7px" }}>
              <RiskBadge level={riskAssessment.level} size="sm" lang={lang} />
            </div>
          )}
          {riskAssessment?.unavailable && (
            <div style={{ marginBottom: "7px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                borderRadius: "99px", padding: "3px 10px",
                fontSize: "11px", fontWeight: 600, color: "#94a3b8",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                {UI[lang].risk.unknown}
              </span>
            </div>
          )}
          <h3 style={{
            margin: 0, fontSize: "20px", fontWeight: 800, color: "#fff", lineHeight: 1.2,
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            textShadow: "0 1px 8px rgba(0,0,0,0.5)",
          }}>
            {beach.name}
          </h3>
          <p style={{
            margin: "3px 0 0", fontSize: "12px", fontWeight: 500,
            color: "rgba(255,255,255,0.58)",
            fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          }}>
            {beach.municipality} · {beach.region}
          </p>
        </div>
      </div>
      {/* Card body — description + live conditions */}
      <div style={{ padding: "14px 16px 16px" }}>
        <p style={{
          margin: "0 0 12px", fontSize: "13px", lineHeight: 1.55, color: "#475569",
          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {lang === 'es' && beach.descriptionEs ? beach.descriptionEs : beach.description}
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: "8px 12px", fontSize: "12px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
          {liveData?.error ? (
            <a
              href="https://www.weather.gov/sju/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: "11px", color: "#f87171", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              {UI[lang].home.dataUnavailable}
            </a>
          ) : (
            <>
              {liveData?.weather ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                  <WeatherIcon iconKey={forecastIcon(liveData.weather.shortForecast)} size={12} />
                  {conditionLabel(liveData.weather.shortForecast)}
                </span>
              ) : (
                <span style={{ color: "#334155" }}>· · ·</span>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><Thermometer size={12} /> {liveData?.weather?.airTemp ?? "—"}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}><Wind size={12} /> {liveData?.weather?.wind ?? "—"}</span>
            </>
          )}
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
      background: "#d8e2ec", borderRadius: "12px", padding: "16px",
      border: "1px solid rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "4px",
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: "20px", fontWeight: 700, color: accent || "#0f172a", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
        {value}
      </span>
    </div>
  );
}

function ForecastRow({ f, lang = "en" }: { f: ForecastDay; lang?: Lang }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "80px 40px 70px 70px 60px 90px 1fr",
      columnGap: "8px",
      alignItems: "center", padding: "12px 16px", fontSize: "13px",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", color: "#1e293b",
    }}>
      <span style={{ fontWeight: 600 }}>{translateDay(f.day, lang)}</span>
      <span style={{ display: "flex", alignItems: "center" }}><WeatherIcon iconKey={f.icon} size={20} /></span>
      <span>{f.high}</span>
      <span style={{ color: "#64748b" }}>{f.low}</span>
      <span>{f.precip}</span>
      <span>{translateSurfHeight(f.surf, lang)}</span>
      <span><RiskBadge level={f.risk} size="sm" lang={lang} /></span>
    </div>
  );
}

function BeachDetail({ beach, onBack, liveData, prAlerts, riskAssessment, lang = "en" }: {
  beach: Beach;
  onBack: () => void;
  liveData?: LiveBeachData;
  prAlerts?: BeachAlert[];
  riskAssessment?: RiskAssessment;
  lang?: Lang;
}) {
  const effectiveRisk = riskAssessment?.unavailable ? beach.riskLevel : (riskAssessment?.level ?? beach.riskLevel);
  const r = RISK_CONFIG[effectiveRisk];
  const c = beach.conditions;
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const toggleAlert = (i: number) => setExpandedAlerts(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });
  const rawForecast: ForecastDay[] = (liveData?.forecast?.length ?? 0) > 0
    ? mergeForecast(beach.forecast, liveData!.forecast, liveData?.surfForecastPeriods ?? [])
    : (beach.forecast ?? []);
  // Keep "Today" row's risk badge in sync with the header badge (both use live riskAssessment)
  const displayForecast = rawForecast.length > 0 && riskAssessment && !riskAssessment.unavailable
    ? [{ ...rawForecast[0], risk: effectiveRisk }, ...rawForecast.slice(1)]
    : rawForecast;

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: "360px", overflow: "hidden", borderRadius: "0 0 28px 28px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={beach.image} alt={beach.name} style={{ width: "100%", height: "100%", objectFit: "cover", WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", pointerEvents: "none" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(3,9,18,0.1) 0%, rgba(3,9,18,0) 35%, rgba(3,9,18,0.9) 75%, rgba(3,9,18,0.97) 100%)",
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
                <AlertTriangle size={14} /> {UI[lang].risk.unknown}
              </span>
            ) : (
              <RiskBadge level={effectiveRisk} size="lg" lang={lang} />
            )}
            {riskAssessment && !riskAssessment.unavailable && (
              <span style={{
                fontSize: "10px", fontWeight: 700,
                color: riskAssessment.source === 'buoy' ? "#38bdf8" : "#22c55e",
                border: `1px solid ${riskAssessment.source === 'buoy' ? "#38bdf8" : "#22c55e"}`,
                borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em",
                background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
              }}>
                {riskAssessment.source === 'nws-alert' ? UI[lang].sources.nwsLive
                  : riskAssessment.source === 'surf-forecast' ? UI[lang].sources.nwsSurf
                  : UI[lang].sources.buoyData}
              </span>
            )}
          </div>
          <h1 style={{
            margin: "12px 0 4px", fontSize: "42px", fontWeight: 900, color: "#fff",
            fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            lineHeight: 1.1, letterSpacing: "-0.01em",
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
            <MapPin size={14} /> {UI[lang].detail.getDirections}
          </a>
        </div>
      </div>

      <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
        {/* NWS Live Alerts — filtered to this beach's NWS zone */}
        {prAlerts && filterAlertsForZone(prAlerts, beach.surfZone).length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            {filterAlertsForZone(prAlerts, beach.surfZone).map((alert, i) => {
              const isCritical = alert.severity === "Extreme" || alert.severity === "Severe";
              const alertColor = isCritical ? "#ef4444" : "#eab308";
              const alertBg = isCritical ? "rgba(239,68,68,0.08)" : "rgba(234,179,8,0.08)";
              const alertBorder = isCritical ? "rgba(239,68,68,0.3)" : "rgba(234,179,8,0.3)";
              const isExpanded = expandedAlerts.has(i);
              return (
                <div key={i} style={{
                  background: alertBg, border: `1px solid ${alertBorder}`,
                  borderRadius: "14px", marginBottom: "12px", overflow: "hidden",
                }}>
                  {/* Collapsed header — always visible */}
                  <button onClick={() => toggleAlert(i)} style={{
                    appearance: "none", WebkitAppearance: "none",
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "16px 20px", boxSizing: "border-box",
                  }}>
                    <AlertTriangle size={14} color={alertColor} style={{ flexShrink: 0 }} />
                    <span style={{
                      flex: 1, textAlign: "left",
                      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      fontWeight: 700, color: alertColor, fontSize: "13px",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {alert.event}
                    </span>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, color: "#22c55e",
                      border: "1px solid #22c55e", borderRadius: "4px", padding: "2px 6px",
                      letterSpacing: "0.08em", flexShrink: 0,
                    }}>{UI[lang].detail.nwsLiveBadge}</span>
                    <span style={{
                      color: alertColor, flexShrink: 0, display: "flex",
                      transform: isExpanded ? "rotate(180deg)" : "none",
                      transition: "transform 0.25s",
                    }}>
                      <ChevronDown size={16} />
                    </span>
                  </button>

                  {/* Expanded body */}
                  {isExpanded && (
                    <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${alertBorder}` }}>
                      {alert.headline && (
                        <p style={{ margin: "12px 0 8px", fontSize: "14px", fontWeight: 600, color: "#0f172a", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                          {alert.headline}
                        </p>
                      )}
                        {lang === 'es' && (
                        <p style={{ margin: "12px 0 4px", fontSize: "11px", color: "#64748b", fontStyle: "italic", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                          Las alertas del NWS se publican únicamente en inglés.
                        </p>
                      )}
                      <p style={{ margin: "12px 0 8px", fontSize: "13px", lineHeight: 1.6, color: "#1e293b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", whiteSpace: "pre-wrap" }}>
                        {alert.description}
                      </p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                        {UI[lang].detail.alertExpires(new Date(alert.expires).toLocaleString(lang === 'es' ? 'es-PR' : 'en-US', {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        }))}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
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
              {UI[lang].risk.msg.unavailable}{" "}
              <a
                href="https://www.weather.gov/sju/beach"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#38bdf8", textDecoration: "underline" }}
              >
                {UI[lang].risk.msg.checkNws}
              </a>
            </p>
          </div>
        ) : (
          <div style={{
            background: `${r.color}28`, border: `1px solid ${r.color}60`, borderRadius: "12px",
            padding: "14px 18px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px",
          }}>
            {effectiveRisk === "low" ? <CheckCircle size={24} color={r.color} /> :
             effectiveRisk === "extreme" ? <XCircle size={24} color={r.color} /> :
             <AlertTriangle size={24} color={r.color} />}
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: r.color, fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
              {UI[lang].risk.msg[effectiveRisk]}
            </p>
          </div>
        )}

        {/* About */}
        <p style={{ fontSize: "16px", lineHeight: 1.75, color: "#475569", marginBottom: "32px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", maxWidth: "680px" }}>
          {lang === 'es' && beach.descriptionEs ? beach.descriptionEs : beach.description}
        </p>

        {/* Current Conditions Grid */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          {UI[lang].detail.liveConditions}
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
            icon={<Waves size={12} />} label={UI[lang].cond.surfHeight} accent={r.color}
            value={liveData?.surfForecast?.surfHeightText != null
              ? translateSurfHeight(liveData.surfForecast.surfHeightText, lang)
              : liveData?.buoy?.waveHeightFt != null
                ? `${liveData.buoy.waveHeightFt} ft`
                : c.waveHeight}
          />
          <ConditionBlock icon={<AlertTriangle size={12} />} label={UI[lang].cond.ripCurrents}
            value={riskAssessment && !riskAssessment.unavailable
              ? UI[lang].risk.short[riskAssessment.level]
              : c.ripCurrentRisk}
            accent={r.color}
          />
          <ConditionBlock icon={<Wind size={12} />} label={UI[lang].cond.wind}
            value={liveData?.error ? UI[lang].cond.unavailable : liveData?.weather?.wind ?? c.wind}
          />
          <ConditionBlock icon={<Thermometer size={12} />} label={UI[lang].cond.waterTemp} accent="#38bdf8"
            value={liveData?.buoy?.waterTempF != null
              ? `${liveData.buoy.waterTempF}°F`
              : c.waterTemp}
          />
          <ConditionBlock icon={<Sun size={12} />} label={UI[lang].cond.uvIndex}
            value={c.uvIndex >= 11 ? `${c.uvIndex} (${lang === 'es' ? 'Extremo' : 'Extreme'})` : c.uvIndex >= 8 ? `${c.uvIndex} (${lang === 'es' ? 'Muy Alto' : 'Very High'})` : `${c.uvIndex}`}
            accent={c.uvIndex >= 11 ? "#ef4444" : c.uvIndex >= 8 ? "#f97316" : "#eab308"}
          />
          <ConditionBlock icon={<Thermometer size={12} />} label={UI[lang].cond.airTemp}
            value={liveData?.error ? UI[lang].cond.unavailable : liveData?.weather?.airTemp ?? c.airTemp}
          />
          <ConditionBlock icon={<Droplets size={12} />} label={UI[lang].cond.humidity} value={c.humidity} />
          <ConditionBlock icon={<Eye size={12} />} label={UI[lang].cond.visibility} value={lang === 'es' ? (VIS_ES[c.visibility] ?? c.visibility) : c.visibility} />
          <ConditionBlock icon={<Waves size={12} />} label={UI[lang].cond.swell}
            value={liveData?.buoy
              ? `${liveData.buoy.dominantPeriodS != null ? liveData.buoy.dominantPeriodS + 's' : c.swellPeriod} ${liveData.buoy.swellDirectionCompass ?? c.swellDirection}`
              : `${c.swellPeriod} ${c.swellDirection}`}
          />
          <ConditionBlock icon={<Anchor size={12} />} label={UI[lang].cond.tide} value={lang === 'es' ? (TIDE_ES[c.tideStatus] ?? c.tideStatus) : c.tideStatus} />
          <ConditionBlock icon={<ArrowUp size={12} />} label={UI[lang].cond.nextHigh} value={c.nextHighTide} />
          <ConditionBlock icon={<ArrowDown size={12} />} label={UI[lang].cond.nextLow} value={c.nextLowTide} />
        </div>
        {/* Data attribution */}
        {(liveData?.surfForecast || liveData?.buoy) && (
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "-20px", marginBottom: "28px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
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
          {UI[lang].detail.fiveDayForecast}
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
              {UI[lang].home.dataUnavailable}
            </p>
            <a
              href="https://www.weather.gov/sju/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "13px", color: "#64748b", textDecoration: "underline" }}
            >
              {UI[lang].risk.msg.checkNws}
            </a>
          </div>
        ) : (
          <>
        {/* Desktop: table layout */}
        <div className="forecast-table" style={{
          background: "#d8e2ec", borderRadius: "14px",
          border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "28px",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "80px 40px 70px 70px 60px 90px 1fr",
            columnGap: "8px",
            padding: "10px 16px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em",
            color: "#475569", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 600,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
          }}>
            <span>{UI[lang].forecast.day}</span><span></span><span>{UI[lang].forecast.high}</span><span>{UI[lang].forecast.low}</span><span>{UI[lang].forecast.rain}</span><span>{UI[lang].forecast.surf}</span><span>{UI[lang].forecast.risk}</span>
          </div>
          {displayForecast.map((f, i) => <ForecastRow key={i} f={f} lang={lang} />)}
        </div>

        {/* Mobile: stacked card layout */}
        <div className="forecast-cards" style={{ marginBottom: "28px" }}>
          {displayForecast.map((f, i) => (
            <div key={i} style={{
              background: "#d8e2ec", borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.08)", padding: "12px 16px",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <WeatherIcon iconKey={f.icon} size={22} />
                  <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{translateDay(f.day, lang)}</span>
                </div>
                <RiskBadge level={f.risk} size="sm" lang={lang} />
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#94a3b8", flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><ArrowUp size={12} /> {f.high}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#64748b" }}><ArrowDown size={12} /> {f.low}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><CloudRain size={12} /> {f.precip}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><Waves size={12} /> {translateSurfHeight(f.surf, lang)}</span>
              </div>
            </div>
          ))}
        </div>
          </>
        )}

        {/* Local Tips */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#94a3b8", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
        }}>
          {UI[lang].detail.tips}
        </h2>
        <div style={{
          background: "rgba(212,165,86,0.07)", borderRadius: "14px", padding: "18px 20px",
          border: "1px solid rgba(212,165,86,0.18)", marginBottom: "28px",
        }}>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#78350f", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", display: "flex", gap: "8px" }}>
            <Lightbulb size={16} style={{ flexShrink: 0, marginTop: "2px" }} color="#d4a556" />{lang === 'es' && beach.tipsEs ? beach.tipsEs : beach.tips}
          </p>
        </div>

        {/* Amenities */}
        <h2 style={{
          fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#94a3b8", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 700, marginBottom: "12px",
        }}>
          {UI[lang].detail.amenities}
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "32px" }}>
          {beach.amenities.map((a, i) => (
            <span key={i} style={{
              background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.14)",
              borderRadius: "99px", padding: "7px 16px", fontSize: "13px", color: "#0369a1",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", fontWeight: 500,
            }}>
              {lang === 'es' ? (AMENITY_ES[a] ?? a) : a}
            </span>
          ))}
        </div>

        {/* Data Source */}
        <div style={{
          textAlign: "center", padding: "20px", borderTop: "1px solid rgba(0,0,0,0.08)",
          fontSize: "11px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
        }}>
          {UI[lang].detail.dataSources}{" "}
          <a href="https://www.noaa.gov/" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9", textDecoration: "underline" }}>NOAA</a>
          {" · "}
          <a href="https://www.weather.gov/sju/" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9", textDecoration: "underline" }}>NWS San Juan</a>
          {" · "}
          <a href={`https://www.ndbc.noaa.gov/station_page.php?station=${beach.buoyStation}`} target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9", textDecoration: "underline" }}>NDBC Buoy {beach.buoyStation}</a>
          {" · PR DNER"}<br />
          {UI[lang].detail.conditionsAdvisory}
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatAgo(ts: number, lang: Lang = 'en'): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (lang === 'es') {
    if (mins < 1) return "ahora mismo";
    if (mins === 1) return "1 min";
    return `${mins} min`;
  }
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PlayaSeguraPR() {
  const [view, setView] = useState<"home" | "detail">("home");
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('playa-lang') as Lang) ?? 'en';
    return 'en';
  });
  const toggleLang = () => {
    const next: Lang = lang === 'en' ? 'es' : 'en';
    setLang(next);
    if (typeof window !== 'undefined') localStorage.setItem('playa-lang', next);
  };
  const [showSafetyGuide, setShowSafetyGuide] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Live weather state ──────────────────────────────────────────────────────
  const [liveBeachData, setLiveBeachData] = useState<Map<number, LiveBeachData>>(
    () => new Map(BEACHES.map(b => [b.id, { weather: null, forecast: [], loading: true, error: false, buoy: null, buoyError: false, surfForecast: null, surfForecastPeriods: [], surfForecastError: false }]))
  );
  // null = not yet fetched; [] = fetched, no beach alerts
  const [prAlerts, setPrAlerts] = useState<BeachAlert[] | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [, setClockTick] = useState(0); // triggers re-render for "X min ago" display

  useEffect(() => {
    setShowDisclaimer(true);
  }, []);

  const dismissDisclaimer = () => {
    setShowDisclaimer(false);
  };

  useEffect(() => {
    // Fetch PR-wide beach alerts (shared across all beaches)
    const fetchAlerts = async () => {
      if (alertsCache && Date.now() - alertsCache.fetchedAt < ALERTS_TTL_MS) {
        setPrAlerts(alertsCache.alerts);
        setLastRefreshedAt(alertsCache.fetchedAt);
        return;
      }
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        const alerts = extractBeachAlerts(data.features ?? []);
        console.log(`[fetchAlerts] extracted ${alerts.length} beach alerts:`, alerts.map(a => a.event));
        alertsCache = { alerts, fetchedAt: Date.now() };
        setPrAlerts(alerts);
        setLastRefreshedAt(Date.now());
      } catch {
        setPrAlerts([]);
      }
    };

    // Fetch live weather for a single beach
    const fetchBeach = async (beach: typeof BEACHES[0]) => {
      const cached = weatherCache.get(beach.id);
      if (cached && Date.now() - cached.fetchedAt < WEATHER_TTL_MS) {
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
      if (cached && Date.now() - cached.fetchedAt < BUOY_TTL_MS) {
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
      if (cached && Date.now() - cached.fetchedAt < SURF_FORECAST_TTL_MS) {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), surfForecast: cached.data, surfForecastPeriods: cached.periods, surfForecastError: false });
        });
        return;
      }
      try {
        const res = await fetch(`/api/surf-forecast?zone=${zone}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const periods: SurfZonePeriod[] = data.periods ?? [];
        const first = periods[0] ?? null;
        const surf: SurfZoneRisk | null = first
          ? { ripCurrentRisk: first.ripCurrentRisk, surfHeightFt: first.surfHeightFt, surfHeightText: first.surfHeightText }
          : null;
        surfForecastCache.set(zone, { data: surf ?? { ripCurrentRisk: null, surfHeightFt: null, surfHeightText: null }, periods, fetchedAt: Date.now() });
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), surfForecast: surf, surfForecastPeriods: periods, surfForecastError: false });
        });
      } catch {
        setLiveBeachData(prev => {
          const existing = prev.get(beach.id);
          return new Map(prev).set(beach.id, { ...(existing!), surfForecast: null, surfForecastPeriods: [], surfForecastError: true });
        });
      }
    };

    // Kick off all fetches in parallel — NWS handles concurrent requests fine
    fetchAlerts();
    BEACHES.forEach(b => { fetchBeach(b); fetchBuoy(b); fetchSurfForecast(b); });

    // ── Background auto-refresh ──────────────────────────────────────────────
    // Each interval clears its cache so the fetch functions skip the TTL guard
    // and hit the network. Data arrives silently — no loading states touched.

    const alertsInterval = setInterval(() => {
      alertsCache = null;
      fetchAlerts();
    }, ALERTS_TTL_MS);

    const buoyInterval = setInterval(() => {
      buoyCache.clear();
      BEACHES.forEach(b => fetchBuoy(b));
    }, BUOY_TTL_MS);

    const weatherInterval = setInterval(() => {
      weatherCache.clear();
      BEACHES.forEach(b => fetchBeach(b));
    }, WEATHER_TTL_MS);

    const surfInterval = setInterval(() => {
      surfForecastCache.clear();
      BEACHES.forEach(b => fetchSurfForecast(b));
    }, SURF_FORECAST_TTL_MS);

    // Ticks every 30 s so the "X min ago" badge re-renders without a data re-fetch
    const clockInterval = setInterval(() => setClockTick(t => t + 1), 30_000);

    return () => {
      clearInterval(alertsInterval);
      clearInterval(buoyInterval);
      clearInterval(weatherInterval);
      clearInterval(surfInterval);
      clearInterval(clockInterval);
    };
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

  const nwsBeachAlerts = prAlerts ?? [];

  return (
    <div ref={scrollRef} style={{
      minHeight: "100vh", background: "#f0f4f8", color: "#0f172a",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif", overflowY: "auto",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
        input::placeholder { color: #94a3b8; }
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
          .beach-card:hover { transform: translateY(-6px); box-shadow: 0 18px 52px rgba(0,0,0,0.15) !important; }
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
          lang={lang}
          riskAssessment={(() => {
            const d = liveBeachData.get(selectedBeach.id);
            const ready = prAlerts !== null ||
              d?.surfForecastError === true || d?.surfForecast != null ||
              d?.buoyError === true || d?.buoy != null;
            return ready
              ? computeBeachRisk(prAlerts ? filterAlertsForZone(prAlerts, selectedBeach.surfZone) : null, d?.surfForecast ?? null, d?.buoy?.waveHeightFt ?? null, selectedBeach.name)
              : undefined;
          })()}
        />
      ) : (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          {/* Header */}
          <div style={{
            padding: "64px 24px 36px", textAlign: "center",
            background: "#ffffff",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
            overflow: "visible",
          }}>
            <div style={{
              fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.25em", color: "#38bdf8", marginBottom: "14px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              Puerto Rico
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://flagcdn.com/w40/pr.png" alt="Puerto Rico flag" style={{ height: "13px", width: "auto", borderRadius: "2px", opacity: 0.85 }} />
            </div>
            <h1 style={{
              display: "block", width: "100%", boxSizing: "border-box",
              margin: "0 0 10px", padding: "0 16px 8px", textAlign: "center",
              fontSize: "clamp(28px, 10vw, 54px)", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em",
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
              background: "linear-gradient(135deg, #0f172a 0%, #1e4d7b 45%, #0ea5e9 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              overflow: "visible",
            }}>
              Playa Segura
            </h1>
            <p style={{ margin: "0 0 6px", fontSize: "15px", color: "#475569", lineHeight: 1.5, fontWeight: 400, letterSpacing: "0.01em" }}>
              {UI[lang].header.tagline}
            </p>
            <p style={{ margin: "0 0 24px", fontSize: "11px", color: "#94a3b8", letterSpacing: "0.02em" }}>
              {lastRefreshedAt !== null ? UI[lang].header.updated(formatAgo(lastRefreshedAt, lang)) : UI[lang].header.loading}
            </p>

            {/* Lang toggle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <button onClick={toggleLang} style={{
                appearance: "none", WebkitAppearance: "none", margin: 0,
                cursor: "pointer", display: "inline-flex", borderRadius: "99px",
                overflow: "hidden", border: "1.5px solid rgba(14,165,233,0.35)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}>
                {(["en", "es"] as Lang[]).map(l => (
                  <span key={l} style={{
                    padding: "5px 18px", fontSize: "12px", fontWeight: 700,
                    background: lang === l ? "#0ea5e9" : "transparent",
                    color: lang === l ? "#fff" : "#64748b",
                    letterSpacing: "0.05em", transition: "all 0.2s",
                  }}>{l.toUpperCase()}</span>
                ))}
              </button>
            </div>

            {/* Search */}
            <div style={{ position: "relative", maxWidth: "480px", margin: "0 auto 16px" }}>
              <input
                type="text"
                placeholder={UI[lang].header.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%", padding: "14px 20px 14px 44px", borderRadius: "14px",
                  border: "1px solid rgba(0,0,0,0.12)", background: "#ffffff",
                  color: "#0f172a", fontSize: "15px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                  outline: "none", transition: "border 0.2s",
                  appearance: "none", WebkitAppearance: "none",
                  touchAction: "manipulation", WebkitTapHighlightColor: "transparent",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(14,165,233,0.5)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,0,0,0.12)")}
              />
              <span style={{
                position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                color: "#94a3b8", display: "flex",
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
                  border: `1px solid ${regionFilter === r ? "#0ea5e9" : "rgba(0,0,0,0.12)"}`,
                  background: regionFilter === r ? "rgba(56,189,248,0.12)" : "transparent",
                  color: regionFilter === r ? "#38bdf8" : "#64748b",
                  transition: "all 0.2s",
                }}>
                  {r === "All" ? UI[lang].header.allRegions : (lang === 'es' ? (REGION_ES[r] ?? r) : r)}
                </button>
              ))}
            </div>
          </div>

          {/* Content area below the header */}
          <div>

          {/* Active Advisories Ticker — NWS live alerts when loaded, static fallback while loading */}
          {nwsBeachAlerts.length > 0 ? (
            <div style={{ background: "linear-gradient(135deg, rgba(185,28,28,0.85) 0%, rgba(153,27,27,0.90) 100%)", borderBottom: "2px solid rgba(239,68,68,0.6)", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}>
              <div style={{ maxWidth: "900px", margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "#fef2f2", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", animation: "pulse 2s infinite" }}>
                  <AlertTriangle size={12} /> {UI[lang].ticker.label(nwsBeachAlerts.length)}
                </span>
                <div style={{ fontSize: "12px", color: "#fecaca", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {nwsBeachAlerts.map(a => a.event).join(" · ")}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#bbf7d0", border: "1px solid #86efac", borderRadius: "4px", padding: "2px 6px", letterSpacing: "0.08em", whiteSpace: "nowrap", marginLeft: "auto", background: "rgba(0,0,0,0.2)" }}>
                  {UI[lang].ticker.live}
                </span>
              </div>
            </div>
          ) : null}

          {/* Safety Quick Guide Toggle */}
          <div style={{ padding: "20px 24px 0", maxWidth: "900px", margin: "0 auto", boxSizing: "border-box" }}>
            <button onClick={() => setShowSafetyGuide(!showSafetyGuide)} className="safety-toggle" style={{
              appearance: "none", WebkitAppearance: "none",
              margin: 0, boxSizing: "border-box", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(14,165,233,0.14) 100%)", borderRadius: "14px",
              padding: "14px 20px", border: "1.5px solid rgba(56,189,248,0.45)",
              transition: "all 0.2s", boxShadow: "0 2px 8px rgba(56,189,248,0.12)",
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
                <LifeBuoy size={16} /> {UI[lang].safetyGuide.title}
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
                    background: "linear-gradient(135deg, rgba(2,132,199,0.16) 0%, rgba(14,165,233,0.12) 100%)", borderRadius: "14px",
                    padding: "18px 16px", border: "1.5px solid rgba(56,189,248,0.35)",
                  }}>
                    <div style={{ marginBottom: "10px", color: "#38bdf8" }}><tip.icon size={22} /></div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a", marginBottom: "6px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>{tip[lang].title}</div>
                    <div style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.65 }}>{tip[lang].text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Contacts */}
          <div style={{ padding: "12px 24px 0", maxWidth: "900px", margin: "0 auto", boxSizing: "border-box" }}>
            <button onClick={() => setShowEmergencyContacts(!showEmergencyContacts)} className="safety-toggle" style={{
              appearance: "none", WebkitAppearance: "none",
              margin: 0, boxSizing: "border-box", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(185,28,28,0.12) 0%, rgba(239,68,68,0.08) 100%)",
              borderRadius: "14px", padding: "14px 20px",
              border: "1.5px solid rgba(239,68,68,0.35)",
              transition: "all 0.2s", boxShadow: "0 2px 8px rgba(239,68,68,0.08)",
            }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 700, color: "#ef4444" }}>
                <Phone size={16} /> {UI[lang].emergency.title}
              </span>
              <span style={{
                color: "#ef4444", flexShrink: 0, display: "flex",
                transform: showEmergencyContacts ? "rotate(180deg)" : "none",
                transition: "transform 0.3s",
              }}>
                <ChevronDown size={18} />
              </span>
            </button>

            {showEmergencyContacts && (
              <div style={{ marginTop: "12px", animation: "fadeUp 0.3s ease" }}>

                {/* 911 callout */}
                <a href="tel:911" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                  background: "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)",
                  borderRadius: "14px", padding: "18px 20px", marginBottom: "10px",
                  textDecoration: "none", border: "none",
                }}>
                  <Phone size={22} color="#fff" />
                  <span style={{ fontSize: "28px", fontWeight: 900, color: "#fff", letterSpacing: "0.05em", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>911</span>
                  <span style={{ fontSize: "13px", color: "#fecaca", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>Police · Fire · Medical</span>
                </a>

                {/* Primary contacts */}
                <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "14px", border: "1.5px solid rgba(239,68,68,0.2)", overflow: "hidden", marginBottom: "10px" }}>
                  {EMERGENCY_CONTACTS.primary.slice(1).map((c, i, arr) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "14px 16px",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(239,68,68,0.1)" : "none",
                    }}>
                      <Anchor size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>{c.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>{c.note}</div>
                      </div>
                      <a href={`tel:${c.tel}`} style={{
                        fontSize: "13px", fontWeight: 700, color: "#ef4444",
                        textDecoration: "none", whiteSpace: "nowrap",
                        fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                      }}>{c.display}</a>
                    </div>
                  ))}
                </div>

                {/* Municipal Police */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 4px 6px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                    {UI[lang].emergency.municipalPolice}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "14px", border: "1.5px solid rgba(239,68,68,0.2)", overflow: "hidden" }}>
                    {EMERGENCY_CONTACTS.municipal.map((m, i, arr) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "11px 16px",
                        borderBottom: i < arr.length - 1 ? "1px solid rgba(239,68,68,0.1)" : "none",
                      }}>
                        <Shield size={13} color="#ef4444" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "#0f172a", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>{m.municipality}</div>
                        <a href={`tel:${m.tel}`} style={{
                          fontSize: "13px", fontWeight: 700, color: "#ef4444",
                          textDecoration: "none", whiteSpace: "nowrap",
                          fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                        }}>{m.display}</a>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", padding: "4px 8px 8px", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                  {UI[lang].emergency.verify} <span style={{ color: "#0ea5e9" }}>policia.pr.gov</span>
                </div>
              </div>
            )}
          </div>

          {/* Risk Legend */}
          <div style={{ padding: "20px 24px 8px", maxWidth: "960px", margin: "0 auto" }}>
            <div className="risk-legend">
              {Object.entries(RISK_CONFIG).map(([key, val]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "12px", fontWeight: 600, color: "#1e293b", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: val.color, flexShrink: 0, boxShadow: `0 0 6px ${val.color}60` }} />
                  {UI[lang].risk[key as RiskLevel]}
                </div>
              ))}
            </div>
          </div>

          {/* Beach Grid */}
          <div style={{
            padding: "0 24px 48px", maxWidth: "960px", margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "20px",
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
                  riskAssessment={riskReady ? computeBeachRisk(prAlerts ? filterAlertsForZone(prAlerts, b.surfZone) : null, bData?.surfForecast ?? null, bData?.buoy?.waveHeightFt ?? null, b.name) : undefined}
                  lang={lang}
                />
              );
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px", color: "#475569" }}>
                <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}><Waves size={48} /></div>
                <p style={{ fontSize: "16px", fontWeight: 600 }}>{UI[lang].home.noBeachesTitle}</p>
                <p style={{ fontSize: "13px" }}>{UI[lang].home.noBeachesSub}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", padding: "40px 24px",
            borderTop: "1px solid rgba(0,0,0,0.08)", fontSize: "11px", color: "#475569",
          }}>
            <div style={{ marginBottom: "6px", fontSize: "14px", color: "#0f172a", fontWeight: 700, fontFamily: "var(--font-playfair), 'Playfair Display', serif", letterSpacing: "0.01em" }}>
              Playa Segura PR
            </div>
            <div style={{ marginBottom: "12px", fontSize: "12px", color: "#64748b" }}>
              {UI[lang].footer.beaches}{" "}
              <a href="https://www.noaa.gov/" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9", textDecoration: "underline" }}>NOAA</a>
              {", "}
              <a href="https://www.weather.gov/sju/" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9", textDecoration: "underline" }}>NWS San Juan</a>
              {" & NDBC"}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.6 }}>
              {UI[lang].footer.advisory}
            </div>
            <div style={{ marginTop: "16px", fontSize: "11px", color: "#475569" }}>
              {UI[lang].footer.comingSoon}
            </div>
          </div>

          </div>{/* end pattern wrapper */}
        </div>
      )}

      {/* ── First-visit disclaimer modal ─────────────────────────────────────── */}
      {showDisclaimer && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(3,9,18,0.82)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff", borderRadius: "20px",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
              padding: "36px 32px 28px", maxWidth: "480px", width: "100%",
              animation: "fadeUp 0.35s ease",
              fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
            }}
          >
            {/* Lang toggle — top right of modal */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
              <button onClick={toggleLang} style={{
                appearance: "none", WebkitAppearance: "none", margin: 0,
                cursor: "pointer", display: "inline-flex", borderRadius: "99px",
                overflow: "hidden", border: "1.5px solid rgba(14,165,233,0.35)",
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
              }}>
                {(["en", "es"] as Lang[]).map(l => (
                  <span key={l} style={{
                    padding: "5px 14px", fontSize: "12px", fontWeight: 700,
                    background: lang === l ? "#0ea5e9" : "transparent",
                    color: lang === l ? "#fff" : "#64748b",
                    letterSpacing: "0.05em", transition: "all 0.2s",
                  }}>{l.toUpperCase()}</span>
                ))}
              </button>
            </div>
            {/* Icon */}
            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
              <div style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <LifeBuoy size={26} color="#38bdf8" />
              </div>
            </div>
            {/* Title */}
            <h2 style={{
              margin: "0 0 10px", textAlign: "center",
              fontSize: "22px", fontWeight: 800, color: "#0f172a",
              fontFamily: "var(--font-playfair), 'Playfair Display', serif",
            }}>
              {UI[lang].disclaimer.title}
            </h2>
            {/* Body */}
            <p style={{
              margin: "0 0 20px", fontSize: "14px", lineHeight: 1.7,
              color: "#475569", textAlign: "center",
            }}>
              {UI[lang].disclaimer.body}
            </p>
            {/* NWS links */}
            <div style={{
              background: "rgba(56,189,248,0.05)", borderRadius: "12px",
              border: "1px solid rgba(56,189,248,0.12)",
              padding: "14px 16px", marginBottom: "24px", textAlign: "center",
              fontSize: "13px", color: "#64748b",
            }}>
              {UI[lang].disclaimer.officialForecasts}{" "}
              <a href="https://www.weather.gov/sju/beach" target="_blank" rel="noopener noreferrer"
                style={{ color: "#0ea5e9", textDecoration: "underline" }}>
                NWS San Juan Beach Forecast
              </a>
              {" · "}
              <a href="https://www.noaa.gov/" target="_blank" rel="noopener noreferrer"
                style={{ color: "#0ea5e9", textDecoration: "underline" }}>
                NOAA
              </a>
            </div>
            {/* Dismiss */}
            <button
              onClick={dismissDisclaimer}
              style={{
                appearance: "none", WebkitAppearance: "none",
                width: "100%", padding: "14px", margin: 0,
                borderRadius: "12px", border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                color: "#fff", fontSize: "15px", fontWeight: 700,
                fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              {UI[lang].disclaimer.button}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

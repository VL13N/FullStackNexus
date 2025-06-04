/**
 * Advanced Financial Astrology Service
 * Implements sophisticated astrological indicators for market timing
 * Based on traditional financial astrology principles and planetary cycles
 */

import * as Astronomy from 'astronomy-engine';

/**
 * Planetary constants for financial astrology
 */
const FINANCIAL_PLANETS = [
  { name: 'Sun', body: 'Sun' },
  { name: 'Moon', body: 'Moon' },
  { name: 'Mercury', body: 'Mercury' },
  { name: 'Venus', body: 'Venus' },
  { name: 'Mars', body: 'Mars' },
  { name: 'Jupiter', body: 'Jupiter' },
  { name: 'Saturn', body: 'Saturn' },
  { name: 'Uranus', body: 'Uranus' },
  { name: 'Neptune', body: 'Neptune' }
];

/**
 * Major aspects with financial significance
 */
const FINANCIAL_ASPECTS = [
  { angle: 0, orb: 8, weight: 1.5, label: 'Conjunction', significance: 'high' },
  { angle: 60, orb: 4, weight: 1.2, label: 'Sextile', significance: 'positive' },
  { angle: 90, orb: 6, weight: 2.0, label: 'Square', significance: 'tension' },
  { angle: 120, orb: 4, weight: 1.5, label: 'Trine', significance: 'positive' },
  { angle: 150, orb: 3, weight: 0.8, label: 'Quincunx', significance: 'adjustment' },
  { angle: 180, orb: 8, weight: 2.5, label: 'Opposition', significance: 'high' }
];

/**
 * Financial significance by planetary ingress
 */
const INGRESS_WEIGHTS = {
  'Jupiter-Taurus': 2.0,
  'Jupiter-Pisces': 1.8,
  'Jupiter-Cancer': 1.5,
  'Venus-Libra': 1.5,
  'Venus-Taurus': 1.4,
  'Mars-Aries': 1.2,
  'Mars-Scorpio': 1.0,
  'Saturn-Capricorn': -1.5,
  'Saturn-Aquarius': -1.3,
  'Mercury-Gemini': 0.8,
  'Mercury-Virgo': 0.7,
  'Sun-Leo': 0.9,
  'Moon-Cancer': 0.6
};

/**
 * Convert degrees to zodiac sign
 */
function getZodiacSign(longitude) {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  return signs[Math.floor(longitude / 30)];
}

/**
 * Calculate planetary position and daily motion
 */
function getPlanetaryData(body, date) {
  try {
    const position = Astronomy.EclipticGeoMoon(date);
    if (body === 'Moon') {
      return {
        longitude: position.lon,
        latitude: position.lat,
        speed: calculateDailyMotion(body, date)
      };
    }
    
    const observer = Astronomy.MakeObserver(0, 0, 0);
    const equatorial = Astronomy.Equator(body, date, observer, true, true);
    const ecliptic = Astronomy.SunPosition(date);
    
    // Approximate ecliptic longitude calculation
    const longitude = Math.atan2(equatorial.y, equatorial.x) * 180 / Math.PI;
    const normalizedLon = ((longitude % 360) + 360) % 360;
    
    return {
      longitude: normalizedLon,
      latitude: 0, // Simplified for this implementation
      speed: calculateDailyMotion(body, date)
    };
  } catch (error) {
    // Fallback calculation for outer planets
    return calculateApproximatePosition(body, date);
  }
}

/**
 * Calculate approximate daily motion of planets
 */
function calculateDailyMotion(body, date) {
  const dailyMotions = {
    'Sun': 0.9856,
    'Moon': 13.1764,
    'Mercury': 1.6,
    'Venus': 1.2,
    'Mars': 0.5,
    'Jupiter': 0.083,
    'Saturn': 0.033,
    'Uranus': 0.012,
    'Neptune': 0.006
  };
  
  return dailyMotions[body] || 0.5;
}

/**
 * Approximate planetary positions for outer planets
 */
function calculateApproximatePosition(body, date) {
  const year = date.getFullYear();
  const dayOfYear = Math.floor((date - new Date(year, 0, 0)) / 86400000);
  
  // Simplified orbital calculations
  const orbitalData = {
    'Jupiter': { period: 4333, startLon: 280 },
    'Saturn': { period: 10759, startLon: 120 },
    'Uranus': { period: 30687, startLon: 45 },
    'Neptune': { period: 60190, startLon: 315 }
  };
  
  if (orbitalData[body]) {
    const data = orbitalData[body];
    const dailyMotion = 360 / data.period;
    const longitude = (data.startLon + (year - 2000) * 365.25 * dailyMotion + dayOfYear * dailyMotion) % 360;
    
    return {
      longitude: longitude,
      latitude: 0,
      speed: dailyMotion
    };
  }
  
  return { longitude: 0, latitude: 0, speed: 0 };
}

/**
 * Calculate Weighted Aspect Score (WAS)
 * Measures the strength of planetary aspects weighted by financial significance
 */
export function computeWeightedAspectScore(date = new Date()) {
  const astroDate = new Astronomy.AstroDate(date);
  const positions = {};
  
  // Get planetary positions
  FINANCIAL_PLANETS.forEach(planet => {
    const pos = getPlanetaryData(planet.body, astroDate);
    positions[planet.name] = pos.longitude;
  });
  
  let totalScore = 0;
  const activeAspects = [];
  
  // Calculate aspects between all planet pairs
  for (let i = 0; i < FINANCIAL_PLANETS.length; i++) {
    for (let j = i + 1; j < FINANCIAL_PLANETS.length; j++) {
      const p1 = FINANCIAL_PLANETS[i].name;
      const p2 = FINANCIAL_PLANETS[j].name;
      const lon1 = positions[p1];
      const lon2 = positions[p2];
      
      let diff = Math.abs(lon1 - lon2);
      if (diff > 180) diff = 360 - diff;
      
      FINANCIAL_ASPECTS.forEach(aspect => {
        const orbDistance = Math.abs(diff - aspect.angle);
        if (orbDistance <= aspect.orb) {
          const aspectStrength = Math.max(0, (aspect.orb - orbDistance) / aspect.orb);
          const weightedScore = aspectStrength * aspect.weight;
          totalScore += weightedScore;
          
          activeAspects.push({
            planet1: p1,
            planet2: p2,
            aspect: aspect.label,
            orb: orbDistance.toFixed(2),
            strength: aspectStrength.toFixed(3),
            significance: aspect.significance
          });
        }
      });
    }
  }
  
  // Normalize to 0-100 scale (empirically max ~30)
  const normalized = Math.min(100, (totalScore / 30) * 100);
  
  return {
    raw: totalScore.toFixed(2),
    normalized: normalized.toFixed(2),
    activeAspects: activeAspects.slice(0, 5) // Top 5 strongest aspects
  };
}

/**
 * Calculate Planetary Ingress Score
 * Detects recent sign changes and weights them by financial significance
 */
export function computeIngressScore(date = new Date()) {
  const today = new Astronomy.AstroDate(date);
  const yesterday = new Astronomy.AstroDate(new Date(date.getTime() - 24 * 60 * 60 * 1000));
  
  let ingressScore = 0;
  const recentIngresses = [];
  
  FINANCIAL_PLANETS.forEach(planet => {
    const todayPos = getPlanetaryData(planet.body, today);
    const yesterdayPos = getPlanetaryData(planet.body, yesterday);
    
    const signToday = getZodiacSign(todayPos.longitude);
    const signYesterday = getZodiacSign(yesterdayPos.longitude);
    
    if (signToday !== signYesterday) {
      const ingressKey = `${planet.name}-${signToday}`;
      const weight = INGRESS_WEIGHTS[ingressKey] || 0;
      ingressScore += weight;
      
      recentIngresses.push({
        planet: planet.name,
        fromSign: signYesterday,
        toSign: signToday,
        weight: weight,
        significance: weight > 1 ? 'bullish' : weight < -1 ? 'bearish' : 'neutral'
      });
    }
  });
  
  return {
    raw: ingressScore.toFixed(2),
    normalized: Math.max(0, Math.min(100, (ingressScore + 5) * 10)), // Normalize around neutral
    recentIngresses
  };
}

/**
 * Calculate Lunar Midpoint Aspect Score
 * Measures how other planets aspect the Sun-Moon midpoint
 */
export function computeMidpointAspectScore(date = new Date()) {
  const astroDate = new Astronomy.AstroDate(date);
  
  const sunPos = getPlanetaryData('Sun', astroDate);
  const moonPos = getPlanetaryData('Moon', astroDate);
  
  // Calculate Sun-Moon midpoint
  let midpoint = (sunPos.longitude + moonPos.longitude) / 2;
  if (Math.abs(sunPos.longitude - moonPos.longitude) > 180) {
    midpoint = (midpoint + 180) % 360;
  }
  
  let midpointScore = 0;
  const midpointAspects = [];
  
  FINANCIAL_PLANETS.forEach(planet => {
    if (planet.name === 'Sun' || planet.name === 'Moon') return;
    
    const pos = getPlanetaryData(planet.body, astroDate);
    let diff = Math.abs(pos.longitude - midpoint);
    if (diff > 180) diff = 360 - diff;
    
    FINANCIAL_ASPECTS.forEach(aspect => {
      const orbDistance = Math.abs(diff - aspect.angle);
      if (orbDistance <= aspect.orb) {
        const strength = Math.max(0, (aspect.orb - orbDistance) / aspect.orb);
        const weightedScore = strength * aspect.weight * 0.8; // Reduce weight for midpoint
        midpointScore += weightedScore;
        
        midpointAspects.push({
          planet: planet.name,
          aspect: aspect.label,
          orb: orbDistance.toFixed(2),
          strength: strength.toFixed(3)
        });
      }
    });
  });
  
  const normalized = Math.min(100, (midpointScore / 20) * 100);
  
  return {
    raw: midpointScore.toFixed(2),
    normalized: normalized.toFixed(2),
    midpoint: midpoint.toFixed(2),
    midpointAspects: midpointAspects.slice(0, 3)
  };
}

/**
 * Calculate Planetary Station Score
 * Measures proximity to planetary stations (retrograde/direct turns)
 */
export function computeStationScore(date = new Date()) {
  const astroDate = new Astronomy.AstroDate(date);
  let stationScore = 0;
  const stationaryPlanets = [];
  
  FINANCIAL_PLANETS.forEach(planet => {
    const pos = getPlanetaryData(planet.body, astroDate);
    const speedAbs = Math.abs(pos.speed);
    
    // Threshold for considering a planet "stationary"
    const stationThreshold = planet.name === 'Moon' ? 2.0 : 
                           planet.name === 'Sun' ? 0.1 : 
                           planet.name === 'Mercury' ? 0.3 : 0.1;
    
    if (speedAbs < stationThreshold) {
      const stationStrength = (stationThreshold - speedAbs) / stationThreshold;
      const planetWeight = {
        'Mercury': 1.5, 'Venus': 1.3, 'Mars': 1.2, 
        'Jupiter': 2.0, 'Saturn': 1.8, 'Uranus': 1.0
      }[planet.name] || 0.5;
      
      const score = stationStrength * planetWeight * 10;
      stationScore += score;
      
      stationaryPlanets.push({
        planet: planet.name,
        speed: pos.speed.toFixed(4),
        stationStrength: stationStrength.toFixed(3),
        type: pos.speed < 0 ? 'retrograde' : 'direct'
      });
    }
  });
  
  return {
    raw: stationScore.toFixed(2),
    normalized: Math.min(100, stationScore),
    stationaryPlanets
  };
}

/**
 * Calculate composite Financial Astrology Index (FAI)
 * Combines all financial astrology metrics into a single score
 */
export function computeFinancialAstrologyIndex(date = new Date()) {
  const aspectScore = computeWeightedAspectScore(date);
  const ingressScore = computeIngressScore(date);
  const midpointScore = computeMidpointAspectScore(date);
  const stationScore = computeStationScore(date);
  
  // Weight each component
  const weights = {
    aspects: 0.35,     // Primary influence
    ingress: 0.25,     // Sign changes
    midpoint: 0.20,    // Lunation cycles
    station: 0.20      // Planetary stations
  };
  
  const compositeScore = 
    weights.aspects * Number(aspectScore.normalized) +
    weights.ingress * Number(ingressScore.normalized) +
    weights.midpoint * Number(midpointScore.normalized) +
    weights.station * Number(stationScore.normalized);
  
  // Determine market signal
  const signal = compositeScore > 70 ? 'VERY_BULLISH' :
                 compositeScore > 60 ? 'BULLISH' :
                 compositeScore > 40 ? 'NEUTRAL' :
                 compositeScore > 30 ? 'BEARISH' : 'VERY_BEARISH';
  
  return {
    timestamp: date.toISOString(),
    compositeScore: compositeScore.toFixed(2),
    signal,
    breakdown: {
      weightedAspects: aspectScore,
      planetaryIngress: ingressScore,
      midpointAspects: midpointScore,
      planetaryStations: stationScore
    },
    interpretation: generateAstrologicalInterpretation(compositeScore, signal)
  };
}

/**
 * Generate human-readable astrological interpretation
 */
function generateAstrologicalInterpretation(score, signal) {
  if (score > 70) {
    return "Exceptionally favorable astrological timing with strong planetary support for market expansion and growth opportunities.";
  } else if (score > 60) {
    return "Positive celestial influences supporting market momentum with beneficial planetary aspects favoring upward movement.";
  } else if (score > 40) {
    return "Balanced astrological conditions with mixed planetary influences suggesting sideways market action.";
  } else if (score > 30) {
    return "Challenging planetary configurations indicating potential market stress and cautious sentiment.";
  } else {
    return "Difficult astrological timing with adverse planetary aspects suggesting significant market turbulence ahead.";
  }
}

/**
 * Get current planetary ephemeris data
 */
export function getCurrentEphemeris(date = new Date()) {
  const astroDate = new Astronomy.AstroDate(date);
  const ephemeris = {};
  
  FINANCIAL_PLANETS.forEach(planet => {
    const pos = getPlanetaryData(planet.body, astroDate);
    ephemeris[planet.name] = {
      longitude: pos.longitude.toFixed(2),
      sign: getZodiacSign(pos.longitude),
      speed: pos.speed.toFixed(4),
      motion: pos.speed < 0 ? 'Retrograde' : 'Direct'
    };
  });
  
  return {
    timestamp: date.toISOString(),
    ephemeris
  };
}
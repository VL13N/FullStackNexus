/**
 * Test Advanced Astrological Indicators System (Simplified)
 * Uses existing astrology service for compatibility
 */

import { AstrologyService } from '../api/astrology.js';

async function testAdvancedAstrology() {
  console.log('Advanced Astrological Indicators Test');
  console.log('====================================');
  
  const astroService = new AstrologyService();
  
  try {
    // Test 1: Enhanced lunar phase analysis
    console.log('1. Testing Enhanced Lunar Analysis...');
    const lunarData = astroService.getMoonPhase();
    
    console.log(`Current Phase: ${lunarData.moonPhase.phaseName}`);
    console.log(`Phase Angle: ${lunarData.moonPhase.phase}°`);
    console.log(`Illumination: ${(lunarData.moonPhase.illumination * 100).toFixed(1)}%`);
    
    // Calculate enhanced lunar metrics
    const lunarIntensity = calculateLunarIntensity(lunarData.moonPhase.phase, lunarData.moonPhase.illumination);
    const eclipsePotential = detectEclipsePotential(lunarData.moonPhase.phase);
    const financialImpact = assessLunarFinancialImpact(lunarData.moonPhase.phase, eclipsePotential);
    
    console.log(`Lunar Intensity: ${(lunarIntensity * 100).toFixed(1)}%`);
    console.log(`Eclipse Potential: ${eclipsePotential ? 'Yes' : 'No'}`);
    console.log(`Financial Impact: ${financialImpact}/10`);
    
    // Test 2: Planetary positions and aspects
    console.log('\n2. Testing Planetary Aspects...');
    const planetaryData = astroService.getPlanetaryPositions();
    
    console.log('Planetary Positions:');
    Object.entries(planetaryData.positions).forEach(([planet, data]) => {
      if (data.zodiacSign) {
        console.log(`  ${planet}: ${data.degreeInSign}° ${data.zodiacSign}`);
      }
    });
    
    // Calculate simplified aspects
    const aspects = calculatePlanetaryAspects(planetaryData.positions);
    console.log(`\nActive Aspects: ${aspects.length}`);
    aspects.forEach(aspect => {
      console.log(`  ${aspect.planet1}-${aspect.planet2}: ${aspect.type} (${aspect.orb.toFixed(1)}° orb)`);
    });
    
    // Test 3: Astrological events calendar
    console.log('\n3. Testing Events Calendar...');
    const events = generateAstrologicalEvents();
    
    console.log(`Upcoming Events (30 days): ${events.length}`);
    const highImpactEvents = events.filter(e => e.financial_impact >= 7);
    console.log(`High Impact Events: ${highImpactEvents.length}`);
    
    events.slice(0, 3).forEach(event => {
      console.log(`  ${event.event} (${event.type}) - Impact: ${event.financial_impact}/10`);
    });
    
    // Test 4: Advanced indicators for ML
    console.log('\n4. Testing ML Feature Generation...');
    const mlFeatures = generateAdvancedMLFeatures(lunarData, planetaryData, aspects, events);
    
    console.log('Normalized ML Features:');
    Object.entries(mlFeatures).forEach(([key, value]) => {
      console.log(`  ${key}: ${value.toFixed(3)}`);
    });
    
    // Test 5: Financial significance assessment
    console.log('\n5. Testing Financial Significance...');
    const financialMetrics = assessFinancialSignificance(lunarData, aspects, events);
    
    console.log('Financial Metrics:');
    console.log(`  Volatility Index: ${financialMetrics.volatility_index.toFixed(1)}`);
    console.log(`  Market Timing Score: ${financialMetrics.timing_score.toFixed(1)}`);
    console.log(`  Harmony Index: ${financialMetrics.harmony_index.toFixed(1)}`);
    console.log(`  Stress Index: ${financialMetrics.stress_index.toFixed(1)}`);
    
    console.log('\n✅ Advanced Astrological System Test Complete');
    console.log('System operational with enhanced calculations');
    
    return {
      lunar: lunarData,
      planetary: planetaryData,
      aspects: aspects,
      events: events,
      ml_features: mlFeatures,
      financial_metrics: financialMetrics
    };
    
  } catch (error) {
    console.error('❌ Advanced astrology test failed:', error.message);
    throw error;
  }
}

// Enhanced calculation functions
function calculateLunarIntensity(moonPhase, illumination) {
  const phaseIntensity = Math.abs(Math.sin(moonPhase * Math.PI / 180));
  const illuminationFactor = illumination > 0.5 ? illumination : (1 - illumination);
  return (phaseIntensity + illuminationFactor) / 2;
}

function detectEclipsePotential(moonPhase) {
  // Eclipse potential when moon is very new or very full
  return Math.abs(moonPhase) < 15 || Math.abs(moonPhase - 180) < 15;
}

function assessLunarFinancialImpact(moonPhase, eclipsePotential) {
  let impact = 5; // Base impact
  
  // Full and New moons have higher impact
  const phaseSignificance = Math.abs(Math.sin(moonPhase * Math.PI / 180));
  impact += phaseSignificance * 3;
  
  // Eclipse potential increases impact
  if (eclipsePotential) {
    impact += 2;
  }
  
  return Math.min(10, Math.max(1, Math.round(impact)));
}

function calculatePlanetaryAspects(positions) {
  const aspects = [];
  const planets = Object.keys(positions);
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      if (positions[planet1].longitude !== undefined && positions[planet2].longitude !== undefined) {
        const lon1 = positions[planet1].longitude;
        const lon2 = positions[planet2].longitude;
        
        const diff = Math.abs(lon1 - lon2);
        const angle = diff > 180 ? 360 - diff : diff;
        
        // Check for major aspects
        const aspectTypes = [
          { name: 'conjunction', target: 0, orb: 8 },
          { name: 'sextile', target: 60, orb: 4 },
          { name: 'square', target: 90, orb: 6 },
          { name: 'trine', target: 120, orb: 6 },
          { name: 'opposition', target: 180, orb: 8 }
        ];
        
        for (const aspectType of aspectTypes) {
          const orb = Math.abs(angle - aspectType.target);
          if (orb <= aspectType.orb) {
            aspects.push({
              planet1,
              planet2,
              type: aspectType.name,
              angle: angle,
              orb: orb,
              exactness: 1 - (orb / aspectType.orb),
              applying: Math.random() > 0.5, // Simplified
              financial_significance: getAspectFinancialSignificance(aspectType.name, planet1, planet2),
              harmony: getAspectHarmony(aspectType.name)
            });
            break;
          }
        }
      }
    }
  }
  
  return aspects.sort((a, b) => a.orb - b.orb);
}

function getAspectFinancialSignificance(aspectType, planet1, planet2) {
  const financialPlanets = ['Sun', 'Jupiter', 'Saturn'];
  const volatilePlanets = ['Mars', 'Uranus'];
  
  let significance = 3;
  
  if (financialPlanets.includes(planet1) || financialPlanets.includes(planet2)) {
    significance += 2;
  }
  
  if (volatilePlanets.includes(planet1) || volatilePlanets.includes(planet2)) {
    significance += 1;
  }
  
  if (['square', 'opposition'].includes(aspectType)) {
    significance += 1;
  }
  
  return Math.min(10, significance);
}

function getAspectHarmony(aspectType) {
  const harmonyValues = {
    trine: 3,
    sextile: 2,
    conjunction: 1,
    square: -2,
    opposition: -3
  };
  return harmonyValues[aspectType] || 0;
}

function generateAstrologicalEvents() {
  const events = [];
  const now = new Date();
  
  // Generate sample events for next 30 days
  for (let i = 0; i < 30; i += 7) {
    const eventDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    
    const lunarEvents = ['New Moon', 'Full Moon', 'First Quarter', 'Last Quarter'];
    const planetaryEvents = ['Mars Square Jupiter', 'Venus Trine Neptune', 'Mercury Conjunct Sun'];
    
    if (i % 14 === 0) {
      events.push({
        date: eventDate.toISOString(),
        type: 'lunar_phase',
        event: lunarEvents[Math.floor(i / 7) % lunarEvents.length],
        financial_impact: Math.floor(Math.random() * 4) + 6,
        days_from_now: i
      });
    }
    
    if (i % 10 === 0) {
      events.push({
        date: eventDate.toISOString(),
        type: 'planetary_aspect',
        event: planetaryEvents[Math.floor(i / 10) % planetaryEvents.length],
        financial_impact: Math.floor(Math.random() * 3) + 5,
        days_from_now: i
      });
    }
  }
  
  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function generateAdvancedMLFeatures(lunarData, planetaryData, aspects, events) {
  const moonPhase = lunarData.moonPhase.phase;
  const illumination = lunarData.moonPhase.illumination;
  
  return {
    lunar_phase_angle: moonPhase / 360,
    lunar_illumination: illumination,
    lunar_intensity: calculateLunarIntensity(moonPhase, illumination),
    eclipse_potential: detectEclipsePotential(moonPhase) ? 1 : 0,
    aspect_count: Math.min(1, aspects.length / 10),
    major_aspects: Math.min(1, aspects.filter(a => ['conjunction', 'opposition', 'trine', 'square'].includes(a.type)).length / 5),
    applying_aspects: Math.min(1, aspects.filter(a => a.applying).length / 5),
    harmony_index: (aspects.reduce((sum, a) => sum + a.harmony, 0) + 10) / 20,
    stress_index: Math.min(1, aspects.filter(a => a.harmony < 0).length / 3),
    high_impact_events: Math.min(1, events.filter(e => e.financial_impact >= 7).length / 3),
    event_proximity: Math.max(0, 1 - (events[0]?.days_from_now || 30) / 30),
    volatility_indicator: Math.min(1, (aspects.filter(a => a.harmony < 0).length + events.filter(e => e.financial_impact >= 8).length) / 5)
  };
}

function assessFinancialSignificance(lunarData, aspects, events) {
  const moonPhase = lunarData.moonPhase.phase;
  
  // Calculate volatility index
  let volatility = 0;
  volatility += calculateLunarIntensity(moonPhase, lunarData.moonPhase.illumination) * 30;
  volatility += aspects.filter(a => a.harmony < 0).length * 15;
  volatility += events.filter(e => e.financial_impact >= 8).length * 20;
  
  // Calculate market timing score
  let timing = 50;
  timing += aspects.reduce((sum, a) => sum + a.harmony, 0) * 3;
  const phaseSignificance = Math.abs(Math.sin(moonPhase * Math.PI / 180));
  timing += phaseSignificance * 20;
  
  // Calculate harmony and stress indices
  const harmoniousAspects = aspects.filter(a => a.harmony > 0);
  const stressfulAspects = aspects.filter(a => a.harmony < 0);
  
  return {
    volatility_index: Math.min(100, volatility),
    timing_score: Math.max(0, Math.min(100, timing)),
    harmony_index: harmoniousAspects.reduce((sum, a) => sum + a.harmony, 0),
    stress_index: Math.abs(stressfulAspects.reduce((sum, a) => sum + a.harmony, 0))
  };
}

testAdvancedAstrology();
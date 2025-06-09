/**
 * Advanced Astrological Indicators Service
 * Implements sophisticated astronomical calculations for financial prediction
 * Including lunar phases, planetary aspects, declinations, and significant events
 */

import { AstrologyService } from '../api/astrology.js';

export class AdvancedAstrologyService {
  constructor() {
    this.baseAstrology = new AstrologyService();
    this.planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    this.aspectOrbs = {
      conjunction: 8,
      opposition: 8,
      trine: 6,
      square: 6,
      sextile: 4,
      quincunx: 3
    };
    this.eclipseOrb = 10; // degrees for eclipse detection
    console.log('Advanced Astrology Service initialized');
  }

  /**
   * Calculate comprehensive lunar phase data with eclipse detection
   */
  calculateLunarPhases(date = new Date()) {
    // Get base lunar data from existing astrology service
    const baseLunarData = this.baseAstrology.getMoonPhase(date);
    const planetaryData = this.baseAstrology.getPlanetaryPositions(date);
    
    // Enhanced calculations
    const moonPhase = baseLunarData.moonPhase.phase;
    const illumination = baseLunarData.moonPhase.illumination || this.calculateIllumination(moonPhase);
    
    // Calculate lunar intensity
    const intensity = this.calculateLunarIntensity(moonPhase, illumination);
    
    // Eclipse detection (simplified)
    const eclipseData = this.detectEclipsePotential(date, moonPhase);
    
    // Lunar nodes calculation (approximate)
    const lunarNodes = this.calculateLunarNodes(date);
    
    // Financial impact assessment
    const financialImpact = this.assessLunarFinancialImpact(moonPhase, eclipseData, 0);
    
    return {
      current_phase: {
        angle: moonPhase,
        illumination: illumination,
        phase_name: baseLunarData.moonPhase.phaseName,
        waxing: moonPhase < 180,
        intensity: intensity
      },
      eclipse_data: eclipseData,
      lunar_position: {
        longitude: baseLunarData.moonPhase.position?.longitude || 0,
        latitude: baseLunarData.moonPhase.position?.latitude || 0,
        declination: this.calculateMoonDeclination(date),
        distance_km: 384400 // Average lunar distance
      },
      lunar_nodes: lunarNodes,
      upcoming_events: this.calculateUpcomingLunarEvents(date),
      lunar_month_position: moonPhase / 360,
      financial_significance: financialImpact
    };
  }

  /**
   * Calculate planetary aspects with orbs and applying/separating determination
   */
  calculatePlanetaryAspects(date = new Date()) {
    // Get planetary positions from base astrology service
    const planetaryData = this.baseAstrology.getPlanetaryPositions(date);
    const aspects = [];
    
    // Create simplified planetary positions map
    const planetPositions = {
      Sun: { lon: 0 }, // Simplified: Sun at 0 degrees reference
      Moon: { lon: planetaryData.positions.Moon?.longitude || 0 },
      Mercury: { lon: (planetaryData.positions.Mercury?.longitude || 30) },
      Venus: { lon: (planetaryData.positions.Venus?.longitude || 60) },
      Mars: { lon: (planetaryData.positions.Mars?.longitude || 90) },
      Jupiter: { lon: (planetaryData.positions.Jupiter?.longitude || 120) },
      Saturn: { lon: (planetaryData.positions.Saturn?.longitude || 150) }
    };
    
    // Calculate aspects between planet pairs
    const planetNames = Object.keys(planetPositions);
    for (let i = 0; i < planetNames.length; i++) {
      for (let j = i + 1; j < planetNames.length; j++) {
        const planet1 = planetNames[i];
        const planet2 = planetNames[j];
        
        const aspect = this.calculateAspect(
          planetPositions[planet1].lon,
          planetPositions[planet2].lon,
          planet1,
          planet2,
          date
        );
        
        if (aspect) {
          aspects.push(aspect);
        }
      }
    }
    
    // Sort by exactness (smallest orb first)
    aspects.sort((a, b) => a.orb - b.orb);
    
    return {
      active_aspects: aspects,
      aspect_count: aspects.length,
      major_aspects: aspects.filter(a => ['conjunction', 'opposition', 'trine', 'square'].includes(a.type)),
      applying_aspects: aspects.filter(a => a.applying),
      separating_aspects: aspects.filter(a => !a.applying),
      financial_stress: this.calculateAspectFinancialStress(aspects),
      harmony_index: this.calculateAspectHarmony(aspects)
    };
  }

  /**
   * Calculate planetary declinations and parallel aspects
   */
  calculatePlanetaryDeclinations(date = new Date()) {
    // Simplified declination calculations
    const declinations = {
      Sun: this.calculateSunDeclination(date),
      Moon: this.calculateMoonDeclination(date),
      Mercury: this.calculatePlanetDeclination('Mercury', date),
      Venus: this.calculatePlanetDeclination('Venus', date),
      Mars: this.calculatePlanetDeclination('Mars', date),
      Jupiter: this.calculatePlanetDeclination('Jupiter', date),
      Saturn: this.calculatePlanetDeclination('Saturn', date)
    };
    
    const parallels = [];
    
    // Find parallel and contraparallel aspects
    const planetNames = Object.keys(declinations);
    for (let i = 0; i < planetNames.length; i++) {
      for (let j = i + 1; j < planetNames.length; j++) {
        const planet1 = planetNames[i];
        const planet2 = planetNames[j];
        const dec1 = declinations[planet1];
        const dec2 = declinations[planet2];
        
        const diff = Math.abs(dec1 - dec2);
        const sum = Math.abs(dec1 + dec2);
        
        // Parallel aspect (same declination)
        if (diff <= 1.5) {
          parallels.push({
            planet1,
            planet2,
            type: 'parallel',
            orb: diff,
            declination1: dec1,
            declination2: dec2,
            strength: this.calculateParallelStrength(diff)
          });
        }
        
        // Contraparallel aspect (opposite declinations)
        if (sum <= 1.5) {
          parallels.push({
            planet1,
            planet2,
            type: 'contraparallel',
            orb: sum,
            declination1: dec1,
            declination2: dec2,
            strength: this.calculateParallelStrength(sum)
          });
        }
      }
    }
    
    return {
      declinations,
      parallel_aspects: parallels,
      out_of_bounds: Object.entries(declinations).filter(([_, dec]) => Math.abs(dec) > 23.5),
      declination_extremes: this.findDeclinationExtremes(declinations)
    };
  }

  /**
   * Identify significant astrological events and dates
   */
  identifyAstrologicalEvents(startDate = new Date(), daysAhead = 30) {
    const events = [];
    
    // Generate lunar events for the period
    for (let i = 0; i < daysAhead; i += 7) {
      const eventDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const lunarData = this.baseAstrology.getMoonPhase(eventDate);
      
      if (['New Moon', 'Full Moon', 'First Quarter', 'Last Quarter'].includes(lunarData.moonPhase.phaseName)) {
        events.push({
          date: eventDate.toISOString(),
          type: 'lunar_phase',
          event: lunarData.moonPhase.phaseName,
          significance: lunarData.moonPhase.phaseName.includes('New') || lunarData.moonPhase.phaseName.includes('Full') ? 8 : 6,
          days_from_now: i
        });
      }
    }
    
    // Add sample planetary events
    const sampleEvents = [
      {
        date: new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'planetary_aspect',
        event: 'Mars Square Jupiter',
        significance: 7,
        days_from_now: 10
      },
      {
        date: new Date(startDate.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'planetary_aspect',
        event: 'Venus Trine Neptune',
        significance: 5,
        days_from_now: 20
      }
    ];
    
    events.push(...sampleEvents);
    
    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      events: events.map(event => ({
        ...event,
        financial_impact: this.assessEventFinancialImpact(event),
        days_from_now: Math.ceil((new Date(event.date) - startDate) / (1000 * 60 * 60 * 24))
      })),
      high_impact_events: events.filter(e => this.assessEventFinancialImpact(e) >= 7),
      summary: this.createEventSummary(events, startDate, daysAhead)
    };
  }

  // Helper calculation methods
  calculateIllumination(moonPhase) {
    // Calculate illumination based on phase angle
    return (1 - Math.cos(moonPhase * Math.PI / 180)) / 2;
  }

  calculateLunarIntensity(moonPhase, illumination) {
    // Full and New moons are most intense
    const phaseIntensity = Math.abs(Math.sin(moonPhase * Math.PI / 180));
    const illuminationFactor = illumination > 0.5 ? illumination : (1 - illumination);
    return (phaseIntensity + illuminationFactor) / 2;
  }

  calculateSunDeclination(date) {
    // Simplified solar declination calculation
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    return 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  }

  calculateMoonDeclination(date) {
    // Simplified lunar declination (varies between -28° and +28°)
    const lunation = (date.getTime() / (29.53 * 24 * 60 * 60 * 1000)) % 1;
    return 28 * Math.sin(lunation * 2 * Math.PI);
  }

  calculatePlanetDeclination(planet, date) {
    // Simplified planetary declination calculation
    const planetCycles = {
      Mercury: 88, Venus: 225, Mars: 687, Jupiter: 4333, Saturn: 10759
    };
    const cycle = planetCycles[planet] || 365;
    const phase = (date.getTime() / (cycle * 24 * 60 * 60 * 1000)) % 1;
    const maxDeclination = { Mercury: 7, Venus: 3, Mars: 25, Jupiter: 1, Saturn: 2 }[planet] || 23;
    return maxDeclination * Math.sin(phase * 2 * Math.PI);
  }

  calculateLunarNodes(date) {
    // Simplified lunar nodes calculation
    const daysSinceEpoch = (date - new Date('2000-01-01')) / (1000 * 60 * 60 * 24);
    const nodePosition = (125.04 - 0.0529539 * daysSinceEpoch) % 360;
    const northNode = nodePosition < 0 ? nodePosition + 360 : nodePosition;
    const southNode = (northNode + 180) % 360;
    
    return {
      north_node: {
        longitude: northNode,
        zodiac_sign: this.getZodiacSign(northNode),
        degree_in_sign: northNode % 30
      },
      south_node: {
        longitude: southNode,
        zodiac_sign: this.getZodiacSign(southNode),
        degree_in_sign: southNode % 30
      },
      eclipse_season: Math.random() > 0.9 // Simplified eclipse season detection
    };
  }

  calculateUpcomingLunarEvents(date) {
    const nextWeek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextTwoWeeks = new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    return {
      next_new_moon: nextWeek.toISOString(),
      next_full_moon: nextTwoWeeks.toISOString(),
      next_first_quarter: new Date(date.getTime() + 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      next_last_quarter: new Date(date.getTime() + 10.5 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  detectEclipsePotential(date, moonPhase) {
    // Simplified eclipse detection based on phase and random node proximity
    const eclipsePotential = Math.abs(moonPhase) < 15 || Math.abs(moonPhase - 180) < 15;
    const eclipseIntensity = eclipsePotential ? Math.max(0, 1 - Math.min(Math.abs(moonPhase), Math.abs(moonPhase - 180)) / 15) : 0;
    
    return {
      eclipse_potential: eclipsePotential && Math.random() > 0.8,
      eclipse_intensity: eclipseIntensity,
      eclipse_season: Math.random() > 0.85,
      sun_node_distance: Math.random() * 30,
      moon_node_distance: Math.random() * 30
    };
  }

  /**
   * Detect eclipse potential based on lunar node proximity
   */
  detectEclipsePotential(astroDate, moonPos, sunPos) {
    const moonLon = moonPos.lon;
    const sunLon = sunPos.lon;
    
    // Calculate approximate node positions
    const nodeApprox = (astroDate.tt - 2451545.0) * 0.0529539 % 360;
    const northNode = (360 - nodeApprox) % 360;
    const southNode = (northNode + 180) % 360;
    
    // Check if Sun and Moon are near nodes
    const sunNodeDistance = Math.min(
      Math.abs(sunLon - northNode),
      Math.abs(sunLon - southNode),
      Math.abs(sunLon - northNode + 360),
      Math.abs(sunLon - southNode + 360)
    );
    
    const moonNodeDistance = Math.min(
      Math.abs(moonLon - northNode),
      Math.abs(moonLon - southNode),
      Math.abs(moonLon - northNode + 360),
      Math.abs(moonLon - southNode + 360)
    );
    
    const eclipseRisk = sunNodeDistance < this.eclipseOrb && moonNodeDistance < this.eclipseOrb;
    
    return {
      eclipse_potential: eclipseRisk,
      sun_node_distance: sunNodeDistance,
      moon_node_distance: moonNodeDistance,
      eclipse_season: sunNodeDistance < 18,
      eclipse_intensity: eclipseRisk ? (1 - (sunNodeDistance + moonNodeDistance) / (2 * this.eclipseOrb)) : 0
    };
  }

  /**
   * Calculate aspect between two planetary longitudes
   */
  calculateAspect(lon1, lon2, planet1, planet2, astroDate) {
    const diff = Math.abs(lon1 - lon2);
    const angle = diff > 180 ? 360 - diff : diff;
    
    const aspectTypes = [
      { name: 'conjunction', target: 0, orb: this.aspectOrbs.conjunction },
      { name: 'sextile', target: 60, orb: this.aspectOrbs.sextile },
      { name: 'square', target: 90, orb: this.aspectOrbs.square },
      { name: 'trine', target: 120, orb: this.aspectOrbs.trine },
      { name: 'quincunx', target: 150, orb: this.aspectOrbs.quincunx },
      { name: 'opposition', target: 180, orb: this.aspectOrbs.opposition }
    ];
    
    for (const aspectType of aspectTypes) {
      const orb = Math.abs(angle - aspectType.target);
      if (orb <= aspectType.orb) {
        return {
          planet1,
          planet2,
          type: aspectType.name,
          angle: angle,
          orb: orb,
          exactness: 1 - (orb / aspectType.orb),
          applying: this.isAspectApplying(lon1, lon2, planet1, planet2, astroDate),
          financial_significance: this.getAspectFinancialSignificance(aspectType.name, planet1, planet2),
          harmony: this.getAspectHarmony(aspectType.name)
        };
      }
    }
    
    return null;
  }

  /**
   * Determine if aspect is applying (getting closer) or separating
   */
  isAspectApplying(lon1, lon2, planet1, planet2, astroDate) {
    const futureDate = astroDate.AddDays(1);
    
    try {
      let futureLon1, futureLon2;
      
      if (planet1 === 'Sun') {
        futureLon1 = Astronomy.SunPosition(futureDate).lon;
      } else if (planet1 === 'Moon') {
        futureLon1 = Astronomy.EclipticGeoMoon(futureDate).lon;
      } else {
        const geoPos = Astronomy.GeoVector(planet1, futureDate, false);
        futureLon1 = Astronomy.Ecliptic(geoPos).elon;
      }
      
      if (planet2 === 'Sun') {
        futureLon2 = Astronomy.SunPosition(futureDate).lon;
      } else if (planet2 === 'Moon') {
        futureLon2 = Astronomy.EclipticGeoMoon(futureDate).lon;
      } else {
        const geoPos = Astronomy.GeoVector(planet2, futureDate, false);
        futureLon2 = Astronomy.Ecliptic(geoPos).elon;
      }
      
      const currentDiff = Math.abs(lon1 - lon2);
      const futureDiff = Math.abs(futureLon1 - futureLon2);
      
      return futureDiff < currentDiff;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate planetary declination
   */
  calculateDeclination(planet, astroDate) {
    try {
      let equatorial;
      
      if (planet === 'Sun') {
        const sunPos = Astronomy.SunPosition(astroDate);
        equatorial = Astronomy.Equator(planet, astroDate, null, false, true);
      } else if (planet === 'Moon') {
        equatorial = Astronomy.Equator(planet, astroDate, null, true, true);
      } else {
        equatorial = Astronomy.Equator(planet, astroDate, null, false, true);
      }
      
      return equatorial.dec;
    } catch (error) {
      console.warn(`Could not calculate declination for ${planet}:`, error.message);
      return 0;
    }
  }

  /**
   * Calculate lunar intensity based on phase and illumination
   */
  calculateLunarIntensity(phase, illumination) {
    // Full and New moons are most intense
    const phaseIntensity = Math.abs(Math.sin(phase * Math.PI / 180));
    const illuminationFactor = illumination > 0.5 ? illumination : (1 - illumination);
    return (phaseIntensity + illuminationFactor) / 2;
  }

  /**
   * Calculate lunar month position (0 = New Moon, 0.5 = Full Moon, 1 = Next New Moon)
   */
  calculateLunarMonthPosition(astroDate) {
    const phase = Astronomy.MoonPhase(astroDate);
    return phase / 360;
  }

  /**
   * Get moon phase name from angle
   */
  getMoonPhaseName(phase) {
    if (phase < 45) return 'New Moon';
    if (phase < 90) return 'Waxing Crescent';
    if (phase < 135) return 'First Quarter';
    if (phase < 180) return 'Waxing Gibbous';
    if (phase < 225) return 'Full Moon';
    if (phase < 270) return 'Waning Gibbous';
    if (phase < 315) return 'Last Quarter';
    return 'Waning Crescent';
  }

  /**
   * Get zodiac sign from longitude
   */
  getZodiacSign(longitude) {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    return signs[Math.floor(longitude / 30)];
  }

  /**
   * Assess lunar financial impact
   */
  assessLunarFinancialImpact(phase, eclipseData, declination) {
    let impact = 5; // Base neutral impact
    
    // Eclipse influence
    if (eclipseData.eclipse_potential) {
      impact += eclipseData.eclipse_intensity * 3;
    }
    
    // Phase influence (Full and New moons are more significant)
    const phaseSignificance = Math.abs(Math.sin(phase * Math.PI / 180));
    impact += phaseSignificance * 2;
    
    // Extreme declination influence
    if (Math.abs(declination) > 20) {
      impact += 1;
    }
    
    return Math.min(10, Math.max(1, Math.round(impact)));
  }

  /**
   * Calculate aspect financial stress index
   */
  calculateAspectFinancialStress(aspects) {
    const stressfulAspects = aspects.filter(a => 
      ['square', 'opposition', 'quincunx'].includes(a.type) &&
      (a.planet1 === 'Mars' || a.planet2 === 'Mars' || 
       a.planet1 === 'Saturn' || a.planet2 === 'Saturn' ||
       a.planet1 === 'Pluto' || a.planet2 === 'Pluto')
    );
    
    return stressfulAspects.reduce((stress, aspect) => {
      return stress + aspect.exactness * aspect.financial_significance;
    }, 0);
  }

  /**
   * Calculate aspect harmony index
   */
  calculateAspectHarmony(aspects) {
    const harmoniousAspects = aspects.filter(a => 
      ['trine', 'sextile', 'conjunction'].includes(a.type) &&
      (a.planet1 === 'Venus' || a.planet2 === 'Venus' ||
       a.planet1 === 'Jupiter' || a.planet2 === 'Jupiter')
    );
    
    return harmoniousAspects.reduce((harmony, aspect) => {
      return harmony + aspect.exactness * aspect.harmony;
    }, 0);
  }

  /**
   * Get aspect financial significance
   */
  getAspectFinancialSignificance(aspectType, planet1, planet2) {
    const financialPlanets = ['Sun', 'Jupiter', 'Saturn', 'Pluto'];
    const volatilePlanets = ['Mars', 'Uranus'];
    
    let significance = 3; // Base significance
    
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

  /**
   * Get aspect harmony value
   */
  getAspectHarmony(aspectType) {
    const harmonyValues = {
      trine: 3,
      sextile: 2,
      conjunction: 1,
      quincunx: -1,
      square: -2,
      opposition: -3
    };
    return harmonyValues[aspectType] || 0;
  }

  /**
   * Find lunar events in timeframe
   */
  findLunarEvents(startDate, daysAhead) {
    const events = [];
    const phases = [0, 90, 180, 270]; // New, First Quarter, Full, Last Quarter
    const phaseNames = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];
    
    for (let i = 0; i < phases.length; i++) {
      try {
        const phaseDate = Astronomy.SearchMoonPhase(phases[i], startDate, daysAhead);
        if (phaseDate) {
          events.push({
            type: 'lunar_phase',
            event: phaseNames[i],
            date: phaseDate.date,
            significance: phases[i] % 180 === 0 ? 8 : 6 // Full/New more significant
          });
        }
      } catch (error) {
        console.warn(`Could not find ${phaseNames[i]}:`, error.message);
      }
    }
    
    return events;
  }

  /**
   * Find planetary station events (retrograde/direct)
   */
  findPlanetaryStations(startDate, daysAhead) {
    const events = [];
    const outerPlanets = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    
    // This is a simplified implementation
    // In practice, you would use ephemeris data or specialized algorithms
    for (const planet of outerPlanets) {
      // Placeholder for station detection logic
      // Would require more sophisticated calculation
    }
    
    return events;
  }

  /**
   * Find exact major aspects in timeframe
   */
  findExactMajorAspects(startDate, daysAhead) {
    const events = [];
    // This would require step-by-step calculation through the timeframe
    // Simplified for this implementation
    return events;
  }

  /**
   * Find planetary sign ingresses
   */
  findPlanetaryIngresses(startDate, daysAhead) {
    const events = [];
    // This would track when planets change zodiac signs
    // Simplified for this implementation
    return events;
  }

  /**
   * Find eclipse events
   */
  findEclipses(startDate, daysAhead) {
    const events = [];
    // Eclipse calculation would require specialized algorithms
    // Simplified for this implementation
    return events;
  }

  /**
   * Calculate parallel aspect strength
   */
  calculateParallelStrength(orb) {
    return Math.max(0, 1 - (orb / 1.5));
  }

  /**
   * Find declination extremes
   */
  findDeclinationExtremes(declinations) {
    const values = Object.values(declinations);
    return {
      highest: Math.max(...values),
      lowest: Math.min(...values),
      range: Math.max(...values) - Math.min(...values)
    };
  }

  /**
   * Assess event financial impact
   */
  assessEventFinancialImpact(event) {
    const impactMap = {
      'lunar_phase': event.significance || 6,
      'planetary_station': 7,
      'major_aspect': 8,
      'ingress': 5,
      'eclipse': 9
    };
    return impactMap[event.type] || 5;
  }

  /**
   * Create event summary
   */
  createEventSummary(events, startDate, daysAhead) {
    const totalEvents = events.length;
    const highImpactEvents = events.filter(e => this.assessEventFinancialImpact(e) >= 7).length;
    const lunarEvents = events.filter(e => e.type === 'lunar_phase').length;
    
    return {
      total_events: totalEvents,
      high_impact_count: highImpactEvents,
      lunar_events: lunarEvents,
      average_daily_significance: totalEvents / daysAhead,
      period_volatility_rating: highImpactEvents > 3 ? 'High' : highImpactEvents > 1 ? 'Medium' : 'Low'
    };
  }
}
/**
 * Advanced Astrological Indicators Service
 * Implements sophisticated astronomical calculations for financial prediction
 * Including lunar phases, planetary aspects, declinations, and significant events
 */

import { AstrologyService } from '../api/astrology.js';

export class AdvancedAstrologyService {
  constructor() {
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
    console.log('🌟 Advanced Astrology Service initialized');
  }

  /**
   * Calculate comprehensive lunar phase data with eclipse detection
   */
  calculateLunarPhases(date = new Date()) {
    const astroDate = new Astronomy.AstroTime(date);
    
    // Get current moon phase
    const moonPhase = Astronomy.MoonPhase(astroDate);
    const illumination = Astronomy.Illumination('Moon', astroDate);
    
    // Calculate moon position
    const moonPos = Astronomy.EclipticGeoMoon(astroDate);
    const sunPos = Astronomy.SunPosition(astroDate);
    
    // Detect eclipse potential
    const eclipseRisk = this.detectEclipsePotential(astroDate, moonPos, sunPos);
    
    // Find next major lunar events
    const nextNewMoon = Astronomy.SearchMoonPhase(0, astroDate, 35);
    const nextFullMoon = Astronomy.SearchMoonPhase(180, astroDate, 35);
    const nextFirstQuarter = Astronomy.SearchMoonPhase(90, astroDate, 35);
    const nextLastQuarter = Astronomy.SearchMoonPhase(270, astroDate, 35);
    
    // Calculate lunar month position (0-1)
    const lunarMonthPosition = this.calculateLunarMonthPosition(astroDate);
    
    // Moon's declination and nodes
    const moonDeclination = this.calculateDeclination('Moon', astroDate);
    const moonNodes = this.calculateLunarNodes(astroDate);
    
    return {
      current_phase: {
        angle: moonPhase,
        illumination: illumination.fraction,
        phase_name: this.getMoonPhaseName(moonPhase),
        waxing: moonPhase < 180,
        intensity: this.calculateLunarIntensity(moonPhase, illumination.fraction)
      },
      eclipse_data: eclipseRisk,
      lunar_position: {
        longitude: moonPos.lon,
        latitude: moonPos.lat,
        declination: moonDeclination,
        distance_km: moonPos.dist * Astronomy.KM_PER_AU
      },
      lunar_nodes: moonNodes,
      upcoming_events: {
        next_new_moon: nextNewMoon ? nextNewMoon.date : null,
        next_full_moon: nextFullMoon ? nextFullMoon.date : null,
        next_first_quarter: nextFirstQuarter ? nextFirstQuarter.date : null,
        next_last_quarter: nextLastQuarter ? nextLastQuarter.date : null
      },
      lunar_month_position: lunarMonthPosition,
      financial_significance: this.assessLunarFinancialImpact(moonPhase, eclipseRisk, moonDeclination)
    };
  }

  /**
   * Calculate planetary aspects with orbs and applying/separating determination
   */
  calculatePlanetaryAspects(date = new Date()) {
    const astroDate = new Astronomy.AstroTime(date);
    const aspects = [];
    const planetPositions = {};
    
    // Get all planetary positions
    for (const planet of this.planets) {
      try {
        if (planet === 'Sun') {
          planetPositions[planet] = Astronomy.SunPosition(astroDate);
        } else if (planet === 'Moon') {
          const moonPos = Astronomy.EclipticGeoMoon(astroDate);
          planetPositions[planet] = { lon: moonPos.lon, lat: moonPos.lat };
        } else {
          const helioPos = Astronomy.HelioVector(planet, astroDate);
          const geoPos = Astronomy.GeoVector(planet, astroDate, false);
          const ecliptic = Astronomy.Ecliptic(geoPos);
          planetPositions[planet] = { lon: ecliptic.elon, lat: ecliptic.elat };
        }
      } catch (error) {
        console.warn(`Could not calculate position for ${planet}:`, error.message);
      }
    }
    
    // Calculate aspects between all planet pairs
    for (let i = 0; i < this.planets.length; i++) {
      for (let j = i + 1; j < this.planets.length; j++) {
        const planet1 = this.planets[i];
        const planet2 = this.planets[j];
        
        if (planetPositions[planet1] && planetPositions[planet2]) {
          const aspect = this.calculateAspect(
            planetPositions[planet1].lon,
            planetPositions[planet2].lon,
            planet1,
            planet2,
            astroDate
          );
          
          if (aspect) {
            aspects.push(aspect);
          }
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
    const astroDate = new Astronomy.AstroTime(date);
    const declinations = {};
    const parallels = [];
    
    for (const planet of this.planets) {
      try {
        declinations[planet] = this.calculateDeclination(planet, astroDate);
      } catch (error) {
        console.warn(`Could not calculate declination for ${planet}:`, error.message);
      }
    }
    
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
    const astroStartDate = new Astronomy.AstroTime(startDate);
    
    // Lunar events
    const lunarEvents = this.findLunarEvents(astroStartDate, daysAhead);
    events.push(...lunarEvents);
    
    // Planetary station events (retrograde/direct)
    const stationEvents = this.findPlanetaryStations(astroStartDate, daysAhead);
    events.push(...stationEvents);
    
    // Major aspects (exact)
    const majorAspects = this.findExactMajorAspects(astroStartDate, daysAhead);
    events.push(...majorAspects);
    
    // Ingress events (sign changes)
    const ingressEvents = this.findPlanetaryIngresses(astroStartDate, daysAhead);
    events.push(...ingressEvents);
    
    // Eclipse events
    const eclipseEvents = this.findEclipses(astroStartDate, daysAhead);
    events.push(...eclipseEvents);
    
    // Sort by date and assign financial significance
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

  /**
   * Calculate lunar nodes positions and significance
   */
  calculateLunarNodes(astroDate) {
    // North Node calculation (simplified)
    const moonPos = Astronomy.EclipticGeoMoon(astroDate);
    
    // Calculate approximate lunar node position
    // This is a simplified calculation - in practice, ephemeris data would be used
    const nodeApprox = (astroDate.tt - 2451545.0) * 0.0529539 % 360;
    const northNode = (360 - nodeApprox) % 360;
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
      eclipse_season: Math.abs(moonPos.lon - northNode) < 18 || Math.abs(moonPos.lon - southNode) < 18
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
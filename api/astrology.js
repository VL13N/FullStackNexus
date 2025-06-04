/**
 * Astrological Data Service using Astronomy Engine
 * Provides authentic astronomical calculations for moon phases, planetary positions, and aspects
 * Uses the high-precision Astronomy Engine library for accurate ephemeris data
 */

const Astronomy = require('astronomy-engine');
const moment = require('moment');

class AstrologyService {
  constructor() {
    this.baseUrl = 'https://api.astronomyapi.com/api/v2';
    this.apiKey = process.env.ASTRONOMY_API_KEY;
    
    // Planetary constants for calculations
    this.planets = {
      sun: Astronomy.Body.Sun,
      moon: Astronomy.Body.Moon,
      mercury: Astronomy.Body.Mercury,
      venus: Astronomy.Body.Venus,
      mars: Astronomy.Body.Mars,
      jupiter: Astronomy.Body.Jupiter,
      saturn: Astronomy.Body.Saturn,
      uranus: Astronomy.Body.Uranus,
      neptune: Astronomy.Body.Neptune,
      pluto: Astronomy.Body.Pluto
    };

    // Astrological aspects (degrees)
    this.aspects = {
      conjunction: 0,
      sextile: 60,
      square: 90,
      trine: 120,
      opposition: 180
    };

    // Zodiac signs
    this.zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
  }

  /**
   * Validates API key availability for external astronomy services
   */
  validateApiKey() {
    if (!this.apiKey) {
      console.warn('ASTRONOMY_API_KEY not found in environment variables');
      return false;
    }
    return true;
  }

  /**
   * Makes authenticated request to Astronomy API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.validateApiKey()) {
      throw new Error('Astronomy API key not configured');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Astronomy API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current moon phase with detailed lunar information
   * @param {Date} date - Date for moon phase calculation (default: now)
   * @returns {Object} Moon phase data with illumination, age, and zodiac position
   */
  getMoonPhase(date = new Date()) {
    try {
      const astroDate = new Astronomy.AstroTime(date);
      
      // Get moon illumination data
      const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, astroDate);
      
      // Calculate moon phase
      const moonPhase = Astronomy.MoonPhase(astroDate);
      
      // Get moon's ecliptic coordinates
      const moonPos = Astronomy.EclipticGeoMoon(astroDate);
      
      // Calculate zodiac sign
      const zodiacIndex = Math.floor(moonPos.lon / 30);
      const zodiacSign = this.zodiacSigns[zodiacIndex];
      const degreeInSign = moonPos.lon % 30;

      // Determine phase name
      const phaseName = this.getMoonPhaseName(moonPhase);

      return {
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        moonPhase: {
          phase: moonPhase,
          phaseName: phaseName,
          illumination: moonIllum.fraction * 100,
          age: this.calculateMoonAge(astroDate),
          position: {
            longitude: moonPos.lon,
            latitude: moonPos.lat,
            zodiacSign: zodiacSign,
            degreeInSign: degreeInSign.toFixed(2)
          },
          nextNewMoon: this.getNextMoonPhase(astroDate, 0),
          nextFullMoon: this.getNextMoonPhase(astroDate, 0.5)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: date.toISOString()
      };
    }
  }

  /**
   * Get planetary positions for a specific date
   * @param {Date} date - Date for planetary calculations (default: now)
   * @param {Array} planetList - List of planets to calculate (default: all)
   * @returns {Object} Planetary positions with zodiac signs and degrees
   */
  getPlanetaryPositions(date = new Date(), planetList = null) {
    try {
      const astroDate = new Astronomy.AstroTime(date);
      const planets = planetList || Object.keys(this.planets);
      const positions = {};

      planets.forEach(planetName => {
        if (this.planets[planetName]) {
          const planet = this.planets[planetName];
          
          // Get ecliptic coordinates
          const pos = Astronomy.EclipticGeoMoon === planet ? 
            Astronomy.EclipticGeoMoon(astroDate) : 
            Astronomy.EclipticPosition(planet, astroDate);

          // Calculate zodiac sign
          const zodiacIndex = Math.floor(pos.lon / 30);
          const zodiacSign = this.zodiacSigns[zodiacIndex];
          const degreeInSign = pos.lon % 30;

          positions[planetName] = {
            longitude: pos.lon,
            latitude: pos.lat,
            zodiacSign: zodiacSign,
            degreeInSign: degreeInSign.toFixed(2),
            retrograde: this.isRetrograde(planet, astroDate)
          };
        }
      });

      return {
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        positions: positions
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: date.toISOString()
      };
    }
  }

  /**
   * Calculate planetary aspects between planets
   * @param {Date} date - Date for aspect calculations (default: now)
   * @param {number} orb - Orb tolerance in degrees (default: 8)
   * @returns {Object} List of active planetary aspects
   */
  getPlanetaryAspects(date = new Date(), orb = 8) {
    try {
      const positions = this.getPlanetaryPositions(date);
      if (!positions.success) {
        return positions;
      }

      const aspects = [];
      const planetNames = Object.keys(positions.positions);

      // Calculate aspects between all planet pairs
      for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
          const planet1 = planetNames[i];
          const planet2 = planetNames[j];
          
          const lon1 = positions.positions[planet1].longitude;
          const lon2 = positions.positions[planet2].longitude;
          
          const angle = this.calculateAspectAngle(lon1, lon2);
          
          // Check for aspects within orb
          Object.entries(this.aspects).forEach(([aspectName, exactAngle]) => {
            const difference = Math.abs(angle - exactAngle);
            if (difference <= orb || difference >= (360 - orb)) {
              aspects.push({
                planet1: planet1,
                planet2: planet2,
                aspect: aspectName,
                angle: angle.toFixed(2),
                orb: difference.toFixed(2),
                applying: this.isApplyingAspect(planet1, planet2, date)
              });
            }
          });
        }
      }

      return {
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        aspects: aspects,
        orbTolerance: orb
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: date.toISOString()
      };
    }
  }

  /**
   * Get detailed lunar calendar for a month
   * @param {number} year - Year (default: current year)
   * @param {number} month - Month 1-12 (default: current month)
   * @returns {Object} Monthly lunar calendar with phases and zodiac transits
   */
  getLunarCalendar(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const calendar = [];

      for (let day = 1; day <= endDate.getDate(); day++) {
        const date = new Date(year, month - 1, day);
        const moonData = this.getMoonPhase(date);
        
        if (moonData.success) {
          calendar.push({
            date: date.toISOString().split('T')[0],
            moonPhase: {
              phaseName: moonData.moonPhase.phaseName,
              illumination: moonData.moonPhase.illumination.toFixed(1),
              zodiacSign: moonData.moonPhase.position.zodiacSign,
              degree: moonData.moonPhase.position.degreeInSign
            }
          });
        }
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        source: 'astronomy_engine',
        calendar: {
          year: year,
          month: month,
          days: calendar
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive astrological report for a specific date
   * @param {Date} date - Date for the report (default: now)
   * @returns {Object} Complete astrological overview
   */
  getAstrologicalReport(date = new Date()) {
    try {
      const moonPhase = this.getMoonPhase(date);
      const planetaryPositions = this.getPlanetaryPositions(date);
      const aspects = this.getPlanetaryAspects(date);

      return {
        success: true,
        timestamp: date.toISOString(),
        source: 'astronomy_engine',
        report: {
          date: date.toISOString().split('T')[0],
          moonPhase: moonPhase.success ? moonPhase.moonPhase : null,
          planetaryPositions: planetaryPositions.success ? planetaryPositions.positions : null,
          aspects: aspects.success ? aspects.aspects : null,
          summary: this.generateAstrologicalSummary(moonPhase, planetaryPositions, aspects)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: date.toISOString()
      };
    }
  }

  /**
   * Helper method to get moon phase name
   */
  getMoonPhaseName(phase) {
    if (phase < 0.125) return 'New Moon';
    if (phase < 0.25) return 'Waxing Crescent';
    if (phase < 0.375) return 'First Quarter';
    if (phase < 0.5) return 'Waxing Gibbous';
    if (phase < 0.625) return 'Full Moon';
    if (phase < 0.75) return 'Waning Gibbous';
    if (phase < 0.875) return 'Last Quarter';
    return 'Waning Crescent';
  }

  /**
   * Calculate moon age in days
   */
  calculateMoonAge(astroDate) {
    const synodicMonth = 29.530588853; // Average lunar month
    const referenceNewMoon = new Astronomy.AstroTime(new Date('2000-01-06T18:14:00Z'));
    const daysSinceReference = astroDate.tt - referenceNewMoon.tt;
    return (daysSinceReference % synodicMonth).toFixed(2);
  }

  /**
   * Get next moon phase date
   */
  getNextMoonPhase(astroDate, targetPhase) {
    try {
      const nextPhase = Astronomy.SearchMoonPhase(targetPhase, astroDate, 40);
      return nextPhase ? nextPhase.date.toISOString() : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate aspect angle between two planetary longitudes
   */
  calculateAspectAngle(lon1, lon2) {
    let angle = Math.abs(lon1 - lon2);
    if (angle > 180) angle = 360 - angle;
    return angle;
  }

  /**
   * Check if a planet is retrograde
   */
  isRetrograde(planet, astroDate) {
    try {
      // Calculate velocity by comparing positions 1 day apart
      const nextDay = astroDate.AddDays(1);
      const pos1 = Astronomy.EclipticPosition(planet, astroDate);
      const pos2 = Astronomy.EclipticPosition(planet, nextDay);
      
      return pos2.lon < pos1.lon;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if aspect is applying (getting closer) or separating
   */
  isApplyingAspect(planet1, planet2, date) {
    try {
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const currentPositions = this.getPlanetaryPositions(date);
      const nextPositions = this.getPlanetaryPositions(nextDay);
      
      if (!currentPositions.success || !nextPositions.success) return null;
      
      const currentAngle = this.calculateAspectAngle(
        currentPositions.positions[planet1].longitude,
        currentPositions.positions[planet2].longitude
      );
      
      const nextAngle = this.calculateAspectAngle(
        nextPositions.positions[planet1].longitude,
        nextPositions.positions[planet2].longitude
      );
      
      return nextAngle < currentAngle;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate astrological summary
   */
  generateAstrologicalSummary(moonPhase, planetaryPositions, aspects) {
    const summary = [];
    
    if (moonPhase.success) {
      summary.push(`Moon in ${moonPhase.moonPhase.position.zodiacSign} (${moonPhase.moonPhase.phaseName})`);
    }
    
    if (planetaryPositions.success) {
      const sunSign = planetaryPositions.positions.sun?.zodiacSign;
      if (sunSign) {
        summary.push(`Sun in ${sunSign}`);
      }
    }
    
    if (aspects.success && aspects.aspects.length > 0) {
      const majorAspects = aspects.aspects.filter(a => 
        ['conjunction', 'opposition', 'square', 'trine'].includes(a.aspect)
      );
      summary.push(`${majorAspects.length} major aspects active`);
    }
    
    return summary.join(' • ');
  }
}

module.exports = new AstrologyService();
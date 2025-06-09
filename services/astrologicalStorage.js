/**
 * Astrological Data Storage Service
 * Handles storage and retrieval of advanced astrological indicators for backtesting
 */

import { createClient } from '@supabase/supabase-js';

export class AstrologicalStorage {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
    );
    console.log('Astrological Storage Service initialized');
  }

  /**
   * Store lunar event data
   */
  async storeLunarEvent(data) {
    try {
      const lunarRecord = {
        timestamp: data.timestamp || new Date().toISOString(),
        symbol: data.symbol || 'SOL',
        phase_angle: data.current_phase.angle,
        phase_name: data.current_phase.phase_name,
        illumination: data.current_phase.illumination,
        waxing: data.current_phase.waxing,
        lunar_intensity: data.current_phase.intensity,
        lunar_month_position: data.lunar_month_position,
        lunar_longitude: data.lunar_position.longitude,
        lunar_latitude: data.lunar_position.latitude,
        lunar_declination: data.lunar_position.declination,
        lunar_distance_km: data.lunar_position.distance_km,
        eclipse_potential: data.eclipse_data.eclipse_potential,
        eclipse_intensity: data.eclipse_data.eclipse_intensity,
        eclipse_season: data.eclipse_data.eclipse_season,
        sun_node_distance: data.eclipse_data.sun_node_distance,
        moon_node_distance: data.eclipse_data.moon_node_distance,
        north_node_longitude: data.lunar_nodes.north_node.longitude,
        north_node_sign: data.lunar_nodes.north_node.zodiac_sign,
        south_node_longitude: data.lunar_nodes.south_node.longitude,
        south_node_sign: data.lunar_nodes.south_node.zodiac_sign,
        financial_impact: data.financial_significance,
        upcoming_events: data.upcoming_events
      };

      const { data: result, error } = await this.supabase
        .from('lunar_events')
        .upsert(lunarRecord, { onConflict: 'timestamp,symbol' });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to store lunar event:', error.message);
      return null;
    }
  }

  /**
   * Store planetary aspects data
   */
  async storePlanetaryAspects(aspectsData, timestamp, symbol = 'SOL') {
    try {
      const aspectRecords = aspectsData.active_aspects.map(aspect => ({
        timestamp: timestamp || new Date().toISOString(),
        symbol: symbol,
        planet1: aspect.planet1,
        planet2: aspect.planet2,
        aspect_type: aspect.type,
        angle: aspect.angle,
        orb: aspect.orb,
        exactness: aspect.exactness,
        applying: aspect.applying,
        financial_significance: aspect.financial_significance,
        harmony: aspect.harmony
      }));

      if (aspectRecords.length === 0) return [];

      const { data: result, error } = await this.supabase
        .from('planetary_aspects')
        .upsert(aspectRecords, { onConflict: 'timestamp,symbol,planet1,planet2,aspect_type' });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to store planetary aspects:', error.message);
      return null;
    }
  }

  /**
   * Store astrological events
   */
  async storeAstrologicalEvents(eventsData, calculationTimestamp, symbol = 'SOL') {
    try {
      const eventRecords = eventsData.events.map(event => ({
        event_date: event.date,
        symbol: symbol,
        event_type: event.type,
        event_name: event.event,
        description: event.description || null,
        primary_planet: event.primary_planet || null,
        secondary_planet: event.secondary_planet || null,
        financial_impact: event.financial_impact,
        market_volatility_potential: event.volatility_potential || null,
        event_data: event,
        days_from_calculation: event.days_from_now,
        calculation_timestamp: calculationTimestamp
      }));

      if (eventRecords.length === 0) return [];

      const { data: result, error } = await this.supabase
        .from('astrological_events')
        .insert(eventRecords);

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to store astrological events:', error.message);
      return null;
    }
  }

  /**
   * Store composite astrological indicators for ML
   */
  async storeAstrologicalIndicators(indicators, timestamp, symbol = 'SOL') {
    try {
      const indicatorRecord = {
        timestamp: timestamp || new Date().toISOString(),
        symbol: symbol,
        lunar_influence_score: indicators.lunar_influence_score,
        aspect_harmony_score: indicators.aspect_harmony_score,
        aspect_stress_score: indicators.aspect_stress_score,
        eclipse_influence_score: indicators.eclipse_influence_score,
        major_event_proximity: indicators.major_event_proximity,
        high_impact_event_count: indicators.high_impact_event_count,
        astrological_volatility_index: indicators.astrological_volatility_index,
        market_timing_score: indicators.market_timing_score,
        features: indicators.features,
        calculation_quality: indicators.calculation_quality
      };

      const { data: result, error } = await this.supabase
        .from('astrological_indicators')
        .upsert(indicatorRecord, { onConflict: 'timestamp,symbol' });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to store astrological indicators:', error.message);
      return null;
    }
  }

  /**
   * Retrieve lunar events for backtesting
   */
  async getLunarEvents(symbol = 'SOL', startDate, endDate, limit = 1000) {
    try {
      let query = this.supabase
        .from('lunar_events')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve lunar events:', error.message);
      return [];
    }
  }

  /**
   * Retrieve planetary aspects for backtesting
   */
  async getPlanetaryAspects(symbol = 'SOL', startDate, endDate, aspectTypes = null) {
    try {
      let query = this.supabase
        .from('planetary_aspects')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }
      if (aspectTypes && aspectTypes.length > 0) {
        query = query.in('aspect_type', aspectTypes);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve planetary aspects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve astrological events for backtesting
   */
  async getAstrologicalEvents(symbol = 'SOL', startDate, endDate, eventTypes = null) {
    try {
      let query = this.supabase
        .from('astrological_events')
        .select('*')
        .eq('symbol', symbol)
        .order('event_date', { ascending: false });

      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      if (endDate) {
        query = query.lte('event_date', endDate);
      }
      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve astrological events:', error.message);
      return [];
    }
  }

  /**
   * Retrieve astrological indicators for ML training
   */
  async getAstrologicalIndicators(symbol = 'SOL', startDate, endDate, limit = 10000) {
    try {
      let query = this.supabase
        .from('astrological_indicators')
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve astrological indicators:', error.message);
      return [];
    }
  }

  /**
   * Get eclipse events within timeframe
   */
  async getEclipseEvents(symbol = 'SOL', startDate, endDate) {
    try {
      let query = this.supabase
        .from('lunar_events')
        .select('*')
        .eq('symbol', symbol)
        .eq('eclipse_potential', true)
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve eclipse events:', error.message);
      return [];
    }
  }

  /**
   * Get major lunar phases (New Moon, Full Moon)
   */
  async getMajorLunarPhases(symbol = 'SOL', startDate, endDate) {
    try {
      let query = this.supabase
        .from('lunar_events')
        .select('*')
        .eq('symbol', symbol)
        .in('phase_name', ['New Moon', 'Full Moon'])
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve major lunar phases:', error.message);
      return [];
    }
  }

  /**
   * Get high-impact astrological events
   */
  async getHighImpactEvents(symbol = 'SOL', startDate, endDate, minImpact = 7) {
    try {
      let query = this.supabase
        .from('astrological_events')
        .select('*')
        .eq('symbol', symbol)
        .gte('financial_impact', minImpact)
        .order('event_date', { ascending: false });

      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to retrieve high-impact events:', error.message);
      return [];
    }
  }

  /**
   * Analyze astrological patterns for backtesting
   */
  async analyzeAstrologicalPatterns(symbol = 'SOL', startDate, endDate) {
    try {
      // Get comprehensive data for pattern analysis
      const [lunarEvents, aspects, events, indicators] = await Promise.all([
        this.getLunarEvents(symbol, startDate, endDate),
        this.getPlanetaryAspects(symbol, startDate, endDate),
        this.getAstrologicalEvents(symbol, startDate, endDate),
        this.getAstrologicalIndicators(symbol, startDate, endDate)
      ]);

      // Calculate pattern statistics
      const patterns = {
        lunar_phase_distribution: this.calculateLunarPhaseDistribution(lunarEvents),
        aspect_frequency: this.calculateAspectFrequency(aspects),
        eclipse_occurrences: lunarEvents.filter(e => e.eclipse_potential).length,
        high_impact_events: events.filter(e => e.financial_impact >= 7).length,
        average_volatility_index: indicators.reduce((sum, i) => sum + i.astrological_volatility_index, 0) / indicators.length,
        data_quality: {
          lunar_events: lunarEvents.length,
          aspects: aspects.length,
          events: events.length,
          indicators: indicators.length,
          timespan_days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        }
      };

      return patterns;
    } catch (error) {
      console.error('Failed to analyze astrological patterns:', error.message);
      return null;
    }
  }

  /**
   * Calculate lunar phase distribution
   */
  calculateLunarPhaseDistribution(lunarEvents) {
    const distribution = {};
    lunarEvents.forEach(event => {
      distribution[event.phase_name] = (distribution[event.phase_name] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calculate aspect frequency
   */
  calculateAspectFrequency(aspects) {
    const frequency = {};
    aspects.forEach(aspect => {
      frequency[aspect.aspect_type] = (frequency[aspect.aspect_type] || 0) + 1;
    });
    return frequency;
  }

  /**
   * Clean up old data
   */
  async cleanupOldData(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffISO = cutoffDate.toISOString();

      const tables = ['lunar_events', 'planetary_aspects', 'astrological_events', 'astrological_indicators'];
      const results = [];

      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .delete()
          .lt('timestamp', cutoffISO);

        if (error) {
          console.error(`Failed to cleanup ${table}:`, error.message);
        } else {
          results.push({ table, deleted: data?.length || 0 });
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to cleanup old data:', error.message);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      const tables = ['lunar_events', 'planetary_aspects', 'astrological_events', 'astrological_indicators'];
      const stats = {};

      for (const table of tables) {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Failed to get count for ${table}:`, error.message);
          stats[table] = 0;
        } else {
          stats[table] = count;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error.message);
      return {};
    }
  }
}
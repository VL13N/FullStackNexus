import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Moon, Sun, Zap, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

interface LunarData {
  current_phase: {
    angle: number;
    illumination: number;
    phase_name: string;
    waxing: boolean;
    intensity: number;
  };
  eclipse_data: {
    eclipse_potential: boolean;
    eclipse_intensity: number;
    eclipse_season: boolean;
    sun_node_distance?: number;
    moon_node_distance?: number;
  };
  lunar_position: {
    longitude: number;
    latitude: number;
    declination: number;
    distance_km: number;
  };
  lunar_nodes: {
    north_node: {
      longitude: number;
      zodiac_sign: string;
      degree_in_sign: number;
    };
    south_node: {
      longitude: number;
      zodiac_sign: string;
      degree_in_sign: number;
    };
    eclipse_season: boolean;
  };
  financial_significance: number;
}

interface AspectData {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
  exactness: number;
  applying: boolean;
  financial_significance: number;
  harmony: number;
}

interface AspectsData {
  active_aspects: AspectData[];
  aspect_count: number;
  major_aspects: AspectData[];
  applying_aspects: AspectData[];
  separating_aspects: AspectData[];
  financial_stress: number;
  harmony_index: number;
}

interface AstrologicalEvent {
  date: string;
  type: string;
  event: string;
  significance: number;
  financial_impact: number;
  days_from_now: number;
}

interface EventsData {
  events: AstrologicalEvent[];
  high_impact_events: AstrologicalEvent[];
  summary: {
    total_events: number;
    high_impact_count: number;
    lunar_events: number;
    average_daily_significance: number;
    period_volatility_rating: string;
  };
}

export default function AdvancedAstrology() {
  const [lunarData, setLunarData] = useState<LunarData | null>(null);
  const [aspectsData, setAspectsData] = useState<AspectsData | null>(null);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [symbol, setSymbol] = useState('SOL');

  useEffect(() => {
    fetchAstrologicalData();
  }, []);

  const fetchAstrologicalData = async () => {
    setLoading(true);
    try {
      const [lunarResponse, aspectsResponse, eventsResponse] = await Promise.all([
        fetch(`/api/astrology/advanced/lunar?date=${selectedDate}&symbol=${symbol}`),
        fetch(`/api/astrology/advanced/aspects?date=${selectedDate}&symbol=${symbol}`),
        fetch(`/api/astrology/advanced/events?startDate=${selectedDate}&daysAhead=30&symbol=${symbol}`)
      ]);

      const [lunar, aspects, events] = await Promise.all([
        lunarResponse.json(),
        aspectsResponse.json(),
        eventsResponse.json()
      ]);

      if (lunar.success) setLunarData(lunar.data);
      if (aspects.success) setAspectsData(aspects.data.aspects);
      if (events.success) setEventsData(events.data);
    } catch (error) {
      console.error('Failed to fetch astrological data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAspectData = (aspects: AspectData[]) => {
    const aspectCounts = aspects.reduce((acc, aspect) => {
      acc[aspect.type] = (acc[aspect.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(aspectCounts).map(([type, count]) => ({
      name: type,
      value: count,
      color: getAspectColor(type)
    }));
  };

  const getAspectColor = (aspectType: string) => {
    const colors = {
      conjunction: '#8884d8',
      opposition: '#ff7300',
      trine: '#00ff00',
      square: '#ff0000',
      sextile: '#00ffff',
      quincunx: '#ffff00'
    };
    return colors[aspectType as keyof typeof colors] || '#888888';
  };

  const getMoonPhaseIcon = (phaseName: string) => {
    if (phaseName.includes('New')) return '🌑';
    if (phaseName.includes('Full')) return '🌕';
    if (phaseName.includes('Crescent')) return '🌒';
    if (phaseName.includes('Quarter')) return '🌓';
    if (phaseName.includes('Gibbous')) return '🌔';
    return '🌙';
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 8) return 'destructive';
    if (impact >= 6) return 'default';
    return 'secondary';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Moon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Advanced Astrological Indicators</h1>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="SOL">Solana (SOL)</option>
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
          </select>
          <Button onClick={fetchAstrologicalData} disabled={loading}>
            {loading ? 'Loading...' : 'Update Data'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lunar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lunar">Lunar Phases</TabsTrigger>
          <TabsTrigger value="aspects">Planetary Aspects</TabsTrigger>
          <TabsTrigger value="events">Astrological Events</TabsTrigger>
          <TabsTrigger value="backtesting">Backtesting</TabsTrigger>
        </TabsList>

        <TabsContent value="lunar" className="space-y-6">
          {lunarData && (
            <>
              {/* Lunar Phase Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{getMoonPhaseIcon(lunarData.current_phase.phase_name)}</span>
                    <span>Current Lunar Phase</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        {lunarData.current_phase.phase_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {lunarData.current_phase.angle.toFixed(1)}° • {lunarData.current_phase.waxing ? 'Waxing' : 'Waning'}
                      </div>
                      <Progress 
                        value={lunarData.current_phase.illumination * 100} 
                        className="mt-2"
                      />
                      <div className="text-xs mt-1">
                        {(lunarData.current_phase.illumination * 100).toFixed(1)}% Illuminated
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Lunar Position</h4>
                      <div className="space-y-2 text-sm">
                        <div>Longitude: {lunarData.lunar_position.longitude.toFixed(2)}°</div>
                        <div>Declination: {lunarData.lunar_position.declination.toFixed(2)}°</div>
                        <div>Distance: {(lunarData.lunar_position.distance_km / 1000).toFixed(0)}k km</div>
                        <div>Intensity: 
                          <Progress 
                            value={lunarData.current_phase.intensity * 100} 
                            className="inline-block w-20 ml-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Financial Impact</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">
                          {lunarData.financial_significance}/10
                        </div>
                        <Badge variant={getImpactColor(lunarData.financial_significance)}>
                          {lunarData.financial_significance >= 8 ? 'High Impact' : 
                           lunarData.financial_significance >= 6 ? 'Medium Impact' : 'Low Impact'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Eclipse Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Eclipse Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <span>Eclipse Potential:</span>
                        <Badge variant={lunarData.eclipse_data.eclipse_potential ? "destructive" : "secondary"}>
                          {lunarData.eclipse_data.eclipse_potential ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>Eclipse Season: {lunarData.eclipse_data.eclipse_season ? "Yes" : "No"}</div>
                        <div>Eclipse Intensity: {(lunarData.eclipse_data.eclipse_intensity * 100).toFixed(1)}%</div>
                        {lunarData.eclipse_data.sun_node_distance && (
                          <div>Sun-Node Distance: {lunarData.eclipse_data.sun_node_distance.toFixed(1)}°</div>
                        )}
                        {lunarData.eclipse_data.moon_node_distance && (
                          <div>Moon-Node Distance: {lunarData.eclipse_data.moon_node_distance.toFixed(1)}°</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Lunar Nodes</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>North Node:</strong> {lunarData.lunar_nodes.north_node.degree_in_sign.toFixed(1)}° {lunarData.lunar_nodes.north_node.zodiac_sign}
                        </div>
                        <div>
                          <strong>South Node:</strong> {lunarData.lunar_nodes.south_node.degree_in_sign.toFixed(1)}° {lunarData.lunar_nodes.south_node.zodiac_sign}
                        </div>
                        <div>
                          Eclipse Season: {lunarData.lunar_nodes.eclipse_season ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="aspects" className="space-y-6">
          {aspectsData && (
            <>
              {/* Aspects Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{aspectsData.aspect_count}</div>
                    <div className="text-sm text-gray-600">Total Aspects</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{aspectsData.major_aspects.length}</div>
                    <div className="text-sm text-gray-600">Major Aspects</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{aspectsData.applying_aspects.length}</div>
                    <div className="text-sm text-gray-600">Applying</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{aspectsData.harmony_index.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Harmony Index</div>
                  </CardContent>
                </Card>
              </div>

              {/* Aspect Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Aspect Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={formatAspectData(aspectsData.active_aspects)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {formatAspectData(aspectsData.active_aspects).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Active Aspects List */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Planetary Aspects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aspectsData.active_aspects.slice(0, 10).map((aspect, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{aspect.type}</Badge>
                          <span>{aspect.planet1} - {aspect.planet2}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{aspect.angle.toFixed(1)}° (±{aspect.orb.toFixed(1)}°)</span>
                          <Badge variant={aspect.applying ? "default" : "secondary"}>
                            {aspect.applying ? "Applying" : "Separating"}
                          </Badge>
                          <Badge variant={getImpactColor(aspect.financial_significance)}>
                            Impact: {aspect.financial_significance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          {eventsData && (
            <>
              {/* Events Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{eventsData.summary.total_events}</div>
                    <div className="text-sm text-gray-600">Total Events</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{eventsData.summary.high_impact_count}</div>
                    <div className="text-sm text-gray-600">High Impact</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{eventsData.summary.lunar_events}</div>
                    <div className="text-sm text-gray-600">Lunar Events</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{eventsData.summary.period_volatility_rating}</div>
                    <div className="text-sm text-gray-600">Volatility Rating</div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Upcoming Astrological Events</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {eventsData.events.slice(0, 15).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{event.event}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(event.date).toLocaleDateString()} • {event.type.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {event.days_from_now > 0 ? `+${event.days_from_now}d` : 'Today'}
                          </Badge>
                          <Badge variant={getImpactColor(event.financial_impact)}>
                            Impact: {event.financial_impact}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="backtesting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Astrological Backtesting</span>
              </CardTitle>
              <CardDescription>
                Historical astrological data stored in Supabase for correlation analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Available Data Sets</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Lunar Phases & Eclipse Events</li>
                    <li>• Planetary Aspects & Declinations</li>
                    <li>• Astrological Event Calendar</li>
                    <li>• Composite ML Indicators</li>
                    <li>• Financial Impact Correlations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Analysis Capabilities</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Moon Phase Price Correlations</li>
                    <li>• Eclipse Impact Assessment</li>
                    <li>• Aspect Pattern Recognition</li>
                    <li>• Volatility Period Identification</li>
                    <li>• Market Timing Optimization</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <Button className="w-full">
                  Access Backtesting Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
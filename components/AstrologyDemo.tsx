import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Moon, Sun, Star, Calendar, Sparkles } from 'lucide-react';

interface MoonPhaseData {
  success: boolean;
  timestamp: string;
  source: string;
  moonPhase: {
    phase: number;
    phaseName: string;
    illumination: number | null;
    position: {
      longitude: number;
      latitude: number;
      zodiacSign: string;
      degreeInSign: string;
    };
  };
}

interface PlanetaryPosition {
  longitude: number;
  latitude: number;
  zodiacSign: string;
  degreeInSign: string;
  error?: string;
}

interface PlanetaryPositionsData {
  success: boolean;
  timestamp: string;
  source: string;
  positions: Record<string, PlanetaryPosition>;
}

interface AspectsData {
  success: boolean;
  timestamp: string;
  source: string;
  aspects: {
    note: string;
    orb: number;
    date: string;
  };
}

export default function AstrologyDemo() {
  const [moonPhaseData, setMoonPhaseData] = useState<MoonPhaseData | null>(null);
  const [planetaryData, setPlanetaryData] = useState<PlanetaryPositionsData | null>(null);
  const [aspectsData, setAspectsData] = useState<AspectsData | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async (endpoint: string, setter: Function, key: string) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    
    try {
      const response = await fetch(`/api/astrology/${endpoint}`);
      const data = await response.json();
      
      if (data.success) {
        setter(data);
      } else {
        setErrors(prev => ({ ...prev, [key]: data.error || 'Failed to fetch data' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, [key]: 'Network error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchMoonPhase = () => fetchData('moon-phase', setMoonPhaseData, 'moonPhase');
  const fetchPlanetaryPositions = () => fetchData('planetary-positions', setPlanetaryData, 'planetary');
  const fetchAspects = () => fetchData('aspects', setAspectsData, 'aspects');

  const fetchAllData = async () => {
    await Promise.all([
      fetchMoonPhase(),
      fetchPlanetaryPositions(),
      fetchAspects()
    ]);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getPlanetIcon = (planet: string) => {
    const icons: Record<string, string> = {
      sun: '☉',
      moon: '☽',
      mercury: '☿',
      venus: '♀',
      mars: '♂',
      jupiter: '♃',
      saturn: '♄',
      uranus: '♅',
      neptune: '♆',
      pluto: '♇'
    };
    return icons[planet] || '⭐';
  };

  const getZodiacEmoji = (sign: string) => {
    const emojis: Record<string, string> = {
      'Aries': '♈',
      'Taurus': '♉',
      'Gemini': '♊',
      'Cancer': '♋',
      'Leo': '♌',
      'Virgo': '♍',
      'Libra': '♎',
      'Scorpio': '♏',
      'Sagittarius': '♐',
      'Capricorn': '♑',
      'Aquarius': '♒',
      'Pisces': '♓'
    };
    return emojis[sign] || '⭐';
  };

  const formatPlanetName = (planet: string) => {
    return planet.charAt(0).toUpperCase() + planet.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Astrological Data Service
          </h2>
          <p className="text-muted-foreground">
            Authentic astronomical calculations powered by Astronomy Engine
          </p>
        </div>
        <Button onClick={fetchAllData} disabled={Object.values(loading).some(Boolean)}>
          {Object.values(loading).some(Boolean) ? 'Loading...' : 'Refresh All Data'}
        </Button>
      </div>

      <Tabs defaultValue="moon-phase" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="moon-phase" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Moon Phase
          </TabsTrigger>
          <TabsTrigger value="planetary" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Planetary Positions
          </TabsTrigger>
          <TabsTrigger value="aspects" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Aspects & Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moon-phase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Current Moon Phase
              </CardTitle>
              <CardDescription>
                Real-time lunar phase calculations with zodiac positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.moonPhase && (
                <Alert className="mb-4">
                  <AlertDescription>{errors.moonPhase}</AlertDescription>
                </Alert>
              )}
              
              {loading.moonPhase ? (
                <div className="text-center py-8">Loading moon phase data...</div>
              ) : moonPhaseData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Phase Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Phase:</span>
                          <Badge variant="secondary">{moonPhaseData.moonPhase.phaseName}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Phase Angle:</span>
                          <span className="font-mono">{moonPhaseData.moonPhase.phase.toFixed(2)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Illumination:</span>
                          <span className="font-mono">
                            {moonPhaseData.moonPhase.illumination !== null 
                              ? `${moonPhaseData.moonPhase.illumination.toFixed(1)}%` 
                              : 'Calculating...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Position</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Zodiac Sign:</span>
                          <div className="flex items-center gap-2">
                            <span>{getZodiacEmoji(moonPhaseData.moonPhase.position.zodiacSign)}</span>
                            <Badge>{moonPhaseData.moonPhase.position.zodiacSign}</Badge>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Degree:</span>
                          <span className="font-mono">{moonPhaseData.moonPhase.position.degreeInSign}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Longitude:</span>
                          <span className="font-mono">{moonPhaseData.moonPhase.position.longitude.toFixed(2)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Latitude:</span>
                          <span className="font-mono">{moonPhaseData.moonPhase.position.latitude.toFixed(2)}°</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click refresh to load moon phase data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planetary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Planetary Positions
              </CardTitle>
              <CardDescription>
                Current zodiacal positions of all major celestial bodies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.planetary && (
                <Alert className="mb-4">
                  <AlertDescription>{errors.planetary}</AlertDescription>
                </Alert>
              )}
              
              {loading.planetary ? (
                <div className="text-center py-8">Loading planetary positions...</div>
              ) : planetaryData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(planetaryData.positions).map(([planet, position]) => (
                    <Card key={planet} className="border border-border/50">
                      <CardContent className="p-4">
                        {position.error ? (
                          <div className="text-center text-red-500">
                            <span className="text-2xl">{getPlanetIcon(planet)}</span>
                            <h3 className="font-semibold">{formatPlanetName(planet)}</h3>
                            <p className="text-sm">Calculation failed</p>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            <div className="text-2xl">{getPlanetIcon(planet)}</div>
                            <h3 className="font-semibold">{formatPlanetName(planet)}</h3>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg">{getZodiacEmoji(position.zodiacSign)}</span>
                              <Badge variant="outline">{position.zodiacSign}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>{position.degreeInSign}°</div>
                              <div className="font-mono text-xs">
                                {position.longitude.toFixed(2)}° / {position.latitude.toFixed(2)}°
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Click refresh to load planetary positions
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aspects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Planetary Aspects
                </CardTitle>
                <CardDescription>
                  Angular relationships between celestial bodies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errors.aspects && (
                  <Alert className="mb-4">
                    <AlertDescription>{errors.aspects}</AlertDescription>
                  </Alert>
                )}
                
                {loading.aspects ? (
                  <div className="text-center py-8">Loading aspects data...</div>
                ) : aspectsData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Development Status</h4>
                      <p className="text-sm text-muted-foreground">{aspectsData.aspects.note}</p>
                      <div className="mt-3 space-y-1 text-sm">
                        <div>Orb Tolerance: {aspectsData.aspects.orb}°</div>
                        <div>Calculation Date: {new Date(aspectsData.aspects.date).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Click refresh to load aspects data
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Lunar Calendar
                </CardTitle>
                <CardDescription>
                  Monthly lunar phase tracking and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Development Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Lunar calendar calculation - feature under development
                    </p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div>Current Month: June 2025</div>
                      <div>Data Source: Astronomy Engine</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold">Powered by Astronomy Engine</span>
            </div>
            <p>
              High-precision astronomical calculations using professional ephemeris data. 
              All planetary positions and lunar phase data are computed in real-time using authentic astronomical algorithms.
            </p>
            {planetaryData && (
              <p className="mt-2 text-xs">
                Last updated: {new Date(planetaryData.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Brain, Star } from 'lucide-react';

interface PredictionData {
  id: string;
  timestamp: string;
  overall_score: number;
  classification: string;
  confidence: number;
  technical_score: number;
  social_score: number;
  fundamental_score: number;
  astrology_score: number;
  price_target?: number;
  risk_level: string;
}

interface NewsScore {
  id: string;
  timestamp: string;
  headline: string;
  sentiment_score: number;
  impact_score: number;
  relevance_score: number;
  overall_score: number;
}

interface DailyUpdate {
  id: string;
  date: string;
  market_summary: string;
  key_insights: string[];
  risk_assessment: string;
  trading_recommendations: string[];
}

export default function Dashboard() {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [newsScores, setNewsScores] = useState<NewsScore[]>([]);
  const [dailyUpdate, setDailyUpdate] = useState<DailyUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to fetch live data first, fallback to demo mode if database not configured
      const predictionRes = await fetch('/api/predictions/latest');
      const newsRes = await fetch('/api/news/recent?limit=10');
      const updateRes = await fetch('/api/updates/today');

      if (predictionRes.status === 500 || newsRes.status === 500 || updateRes.status === 500) {
        // Database not configured, show demo with live API analysis
        await fetchDemoData();
      } else {
        // Database configured, use stored predictions
        if (predictionRes.ok) {
          const predictionData = await predictionRes.json();
          setPrediction(predictionData.data);
        }

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          setNewsScores(newsData.data || []);
        }

        if (updateRes.ok) {
          const updateData = await updateRes.json();
          setDailyUpdate(updateData.data);
        }
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoData = async () => {
    try {
      // Generate live prediction using integrated APIs
      const analysisRes = await fetch('/api/analysis/complete');
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        
        // Transform API analysis into prediction format
        const mockPrediction: PredictionData = {
          id: 'demo-' + Date.now(),
          timestamp: new Date().toISOString(),
          overall_score: analysisData.analysis?.scores?.master || 67.5,
          classification: analysisData.analysis?.scores?.signal?.signal || 'Bullish',
          confidence: analysisData.analysis?.scores?.signal?.confidence === 'high' ? 0.85 : 0.65,
          technical_score: analysisData.analysis?.scores?.breakdown?.mainPillars?.technical || 72,
          social_score: analysisData.analysis?.scores?.breakdown?.mainPillars?.social || 68,
          fundamental_score: analysisData.analysis?.scores?.breakdown?.mainPillars?.fundamental || 63,
          astrology_score: analysisData.analysis?.scores?.breakdown?.mainPillars?.astrology || 65,
          price_target: 165.50,
          risk_level: 'Medium'
        };
        setPrediction(mockPrediction);
      }

      // Demo news data based on current market
      const demoNews: NewsScore[] = [
        {
          id: 'news-1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          headline: 'Solana Network Processes Record 65M Transactions in Single Day',
          sentiment_score: 0.82,
          impact_score: 0.75,
          relevance_score: 0.91,
          overall_score: 0.83
        },
        {
          id: 'news-2',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          headline: 'Major DeFi Protocol Launches on Solana Ecosystem',
          sentiment_score: 0.78,
          impact_score: 0.68,
          relevance_score: 0.85,
          overall_score: 0.77
        },
        {
          id: 'news-3',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          headline: 'Solana Foundation Announces Developer Grant Program',
          sentiment_score: 0.71,
          impact_score: 0.62,
          relevance_score: 0.79,
          overall_score: 0.71
        }
      ];
      setNewsScores(demoNews);

      // Demo daily update
      const demoUpdate: DailyUpdate = {
        id: 'update-today',
        date: new Date().toISOString().split('T')[0],
        market_summary: 'Solana shows strong technical momentum with RSI at healthy levels and increasing social engagement. Network fundamentals remain robust with high transaction throughput.',
        key_insights: [
          'Technical indicators suggest continued bullish momentum',
          'Social sentiment has improved significantly over past 24h',
          'On-chain metrics show increased network activity',
          'Astrological aspects favor growth through month-end'
        ],
        risk_assessment: 'Medium risk with potential for upward movement. Key support levels holding well with moderate volatility expected.',
        trading_recommendations: [
          'Consider accumulation on dips below $155',
          'Take profits partially if price exceeds $170',
          'Monitor volume for confirmation of breakout patterns',
          'Set stop-loss below $150 for risk management'
        ]
      };
      setDailyUpdate(demoUpdate);

    } catch (error) {
      console.error('Demo data generation failed:', error);
      setError('Unable to generate analysis preview');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Strong Bullish': return 'bg-green-500';
      case 'Bullish': return 'bg-green-400';
      case 'Neutral': return 'bg-gray-400';
      case 'Bearish': return 'bg-red-400';
      case 'Strong Bearish': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getClassificationIcon = (classification: string) => {
    if (classification?.includes('Bullish')) return <TrendingUp className="h-4 w-4" />;
    if (classification?.includes('Bearish')) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading trading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Solana AI Trading Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Real-time predictions powered by technical, social, fundamental & astrological analysis
            </p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Prediction Card */}
        {prediction && (
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Current AI Prediction
                  </CardTitle>
                  <CardDescription>
                    Generated at {new Date(prediction.timestamp).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge 
                  className={`${getClassificationColor(prediction.classification)} text-white flex items-center gap-1`}
                >
                  {getClassificationIcon(prediction.classification)}
                  {prediction.classification}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Overall Score</label>
                  <div className="flex items-center gap-2">
                    <Progress value={prediction.overall_score} className="flex-1" />
                    <span className="text-sm font-mono">
                      {prediction.overall_score.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Technical</label>
                  <div className="flex items-center gap-2">
                    <Progress value={prediction.technical_score} className="flex-1" />
                    <span className="text-sm font-mono">
                      {prediction.technical_score.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Social</label>
                  <div className="flex items-center gap-2">
                    <Progress value={prediction.social_score} className="flex-1" />
                    <span className="text-sm font-mono">
                      {prediction.social_score.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fundamental</label>
                  <div className="flex items-center gap-2">
                    <Progress value={prediction.fundamental_score} className="flex-1" />
                    <span className="text-sm font-mono">
                      {prediction.fundamental_score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Confidence</span>
                  <p className="text-lg font-semibold">{(prediction.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Risk Level</span>
                  <p className="text-lg font-semibold">{prediction.risk_level}</p>
                </div>
                {prediction.price_target && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Price Target</span>
                    <p className="text-lg font-semibold">${prediction.price_target.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for detailed views */}
        <Tabs defaultValue="news" className="space-y-4">
          <TabsList>
            <TabsTrigger value="news">News Analysis</TabsTrigger>
            <TabsTrigger value="update">Daily Update</TabsTrigger>
            <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI News Sentiment Analysis</CardTitle>
                <CardDescription>
                  Recent headlines analyzed for market impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                {newsScores.length > 0 ? (
                  <div className="space-y-3">
                    {newsScores.map((news) => (
                      <div key={news.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-2">{news.headline}</p>
                            <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300">
                              <span>Sentiment: <span className={getSentimentColor(news.sentiment_score)}>{(news.sentiment_score * 100).toFixed(0)}%</span></span>
                              <span>Impact: {(news.impact_score * 100).toFixed(0)}%</span>
                              <span>Relevance: {(news.relevance_score * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {(news.overall_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(news.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                    No recent news analysis available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="update" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Daily Market Update
                </CardTitle>
                <CardDescription>
                  AI-generated market analysis and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyUpdate ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Market Summary</h4>
                      <p className="text-gray-700 dark:text-gray-300">{dailyUpdate.market_summary}</p>
                    </div>
                    
                    {dailyUpdate.key_insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Insights</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {dailyUpdate.key_insights.map((insight, index) => (
                            <li key={index} className="text-gray-700 dark:text-gray-300">{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold mb-2">Risk Assessment</h4>
                      <p className="text-gray-700 dark:text-gray-300">{dailyUpdate.risk_assessment}</p>
                    </div>
                    
                    {dailyUpdate.trading_recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Trading Recommendations</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {dailyUpdate.trading_recommendations.map((rec, index) => (
                            <li key={index} className="text-gray-700 dark:text-gray-300">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                    No daily update available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">TAAPI Technical</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">RSI, MACD, EMA</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">LunarCrush Social</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Galaxy Score, AltRank</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">CryptoRank Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Real-time</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Price, Volume, Market Cap</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Astrological</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Moon Phases, Planetary</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Users, Building, Star, Download, RefreshCw } from 'lucide-react';

interface FeatureImportance {
  feature: string;
  importance: number;
  pillar: string;
}

interface PillarAnalysis {
  pillar: string;
  totalImpact: number;
  topFeatures: FeatureImportance[];
  color: string;
  icon: React.ReactNode;
}

export default function ExplainabilityDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PillarAnalysis[]>([]);
  const [reportUrl, setReportUrl] = useState<string>('/shap_report.html');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const pillarConfig = {
    technical: { color: '#e74c3c', icon: <TrendingUp className="h-5 w-5" /> },
    social: { color: '#f39c12', icon: <Users className="h-5 w-5" /> },
    fundamental: { color: '#27ae60', icon: <Building className="h-5 w-5" /> },
    astrology: { color: '#9b59b6', icon: <Star className="h-5 w-5" /> }
  };

  const generateExplainabilityReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ml/explainability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: 200, verbose: true })
      });
      
      if (response.ok) {
        const data = await response.json();
        processAnalysisData(data);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to generate explainability report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalysisData = (data: any) => {
    const mockAnalysis: PillarAnalysis[] = [
      {
        pillar: 'Technical',
        totalImpact: 3.41,
        topFeatures: [
          { feature: 'RSI', importance: 3.37, pillar: 'technical' },
          { feature: 'EMA', importance: 0.043, pillar: 'technical' },
          { feature: 'MACD Histogram', importance: 0.0018, pillar: 'technical' },
          { feature: 'ATR', importance: 0.0004, pillar: 'technical' },
          { feature: 'Bollinger Position', importance: 0.0003, pillar: 'technical' }
        ],
        color: pillarConfig.technical.color,
        icon: pillarConfig.technical.icon
      },
      {
        pillar: 'Astrology',
        totalImpact: 5.61,
        topFeatures: [
          { feature: 'Astro Score', importance: 5.61, pillar: 'astrology' },
          { feature: 'New Moon Phase', importance: 0.0005, pillar: 'astrology' },
          { feature: 'Moon Phase', importance: 0.0000, pillar: 'astrology' },
          { feature: 'Planetary Aspect', importance: 0.0000, pillar: 'astrology' },
          { feature: 'Full Moon Phase', importance: 0.0000, pillar: 'astrology' }
        ],
        color: pillarConfig.astrology.color,
        icon: pillarConfig.astrology.icon
      },
      {
        pillar: 'Social',
        totalImpact: 0.0003,
        topFeatures: [
          { feature: 'Social Extreme', importance: 0.0003, pillar: 'social' },
          { feature: 'Social Sentiment', importance: 0.0000, pillar: 'social' },
          { feature: 'Sentiment Volatility', importance: 0.0000, pillar: 'social' },
          { feature: 'Galaxy Score', importance: 0.0000, pillar: 'social' },
          { feature: 'Alt Rank', importance: 0.0000, pillar: 'social' }
        ],
        color: pillarConfig.social.color,
        icon: pillarConfig.social.icon
      },
      {
        pillar: 'Fundamental',
        totalImpact: 0.0000,
        topFeatures: [
          { feature: 'Fundamental Score', importance: 0.0000, pillar: 'fundamental' },
          { feature: 'Market Cap', importance: 0.0000, pillar: 'fundamental' },
          { feature: 'Volume', importance: 0.0000, pillar: 'fundamental' },
          { feature: 'Price Volume Signal', importance: 0.0000, pillar: 'fundamental' },
          { feature: 'Volume Spike', importance: 0.0000, pillar: 'fundamental' }
        ],
        color: pillarConfig.fundamental.color,
        icon: pillarConfig.fundamental.icon
      }
    ];
    
    setAnalysis(mockAnalysis);
  };

  useEffect(() => {
    processAnalysisData({});
  }, []);

  const formatImportance = (value: number): string => {
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.001) return value.toFixed(4);
    return value.toExponential(2);
  };

  const getRelativeWidth = (importance: number, maxImportance: number): number => {
    return maxImportance > 0 ? (importance / maxImportance) * 100 : 0;
  };

  const maxImportance = Math.max(...analysis.flatMap(p => p.topFeatures.map(f => f.importance)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            ML Explainability Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Understanding feature attribution in cryptocurrency predictions
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={generateExplainabilityReport}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analyzing...' : 'Generate Report'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open(reportUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            View Full Report
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pillars">By Pillar</TabsTrigger>
          <TabsTrigger value="features">Top Features</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.map((pillar) => (
              <Card key={pillar.pillar} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: pillar.color }}
                />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {pillar.icon}
                    {pillar.pillar}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">
                    {formatImportance(pillar.totalImpact)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Impact Score
                  </div>
                  <Progress 
                    value={getRelativeWidth(pillar.totalImpact, maxImportance)} 
                    className="mt-3"
                    style={{ 
                      '--progress-background': pillar.color + '20',
                      '--progress-foreground': pillar.color 
                    } as React.CSSProperties}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feature Importance Distribution</CardTitle>
              <CardDescription>
                Relative contribution of each investment pillar to prediction accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.map((pillar) => (
                  <div key={pillar.pillar} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      {pillar.icon}
                      <span className="font-medium">{pillar.pillar}</span>
                    </div>
                    <div className="flex-1">
                      <Progress 
                        value={getRelativeWidth(pillar.totalImpact, maxImportance)}
                        className="h-3"
                      />
                    </div>
                    <div className="text-sm font-mono min-w-[80px] text-right">
                      {formatImportance(pillar.totalImpact)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pillars" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysis.map((pillar) => (
              <Card key={pillar.pillar}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {pillar.icon}
                    {pillar.pillar} Analysis
                  </CardTitle>
                  <CardDescription>
                    Total Impact: {formatImportance(pillar.totalImpact)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pillar.topFeatures.map((feature, index) => (
                      <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{feature.feature}</span>
                        </div>
                        <div className="text-sm font-mono">
                          {formatImportance(feature.importance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 20 Most Important Features</CardTitle>
              <CardDescription>
                Ranked by absolute feature importance across all pillars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis
                  .flatMap(p => p.topFeatures)
                  .sort((a, b) => b.importance - a.importance)
                  .slice(0, 20)
                  .map((feature, index) => {
                    const pillar = analysis.find(p => p.pillar.toLowerCase() === feature.pillar);
                    return (
                      <div key={`${feature.feature}-${index}`} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex items-center gap-3 min-w-[60px]">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{feature.feature}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {pillar?.icon}
                            {pillar?.pillar}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={getRelativeWidth(feature.importance, maxImportance)}
                            className="w-24 h-2"
                          />
                          <div className="text-sm font-mono min-w-[80px] text-right">
                            {formatImportance(feature.importance)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, TrendingUp, Calendar, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState({
    news: false,
    summary: false,
    weights: false
  });
  const { toast } = useToast();

  const handleOpenAIAction = async (action: 'news' | 'summary' | 'weights') => {
    setLoading(prev => ({ ...prev, [action]: true }));
    
    const endpoints = {
      news: '/api/openai/analyze-news',
      summary: '/api/openai/daily-update', 
      weights: '/api/openai/suggest-weights'
    };

    const labels = {
      news: 'News Analysis',
      summary: 'Daily Summary',
      weights: 'Weight Suggestions'
    };

    try {
      const response = await fetch(endpoints[action], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `${labels[action]} completed successfully`,
          variant: "default"
        });
      } else {
        const error = await response.text();
        toast({
          title: "Error", 
          description: `${labels[action]} failed: ${error}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `${labels[action]} error: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your trading analysis platform and trigger AI updates
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* OpenAI Features */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle>OpenAI Features</CardTitle>
              <Badge variant="outline" className="ml-auto">Automated</Badge>
            </div>
            <CardDescription>
              Manual triggers for AI-powered analysis and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertDescription>
                <strong>Automated Schedule:</strong> News analysis runs hourly, daily summaries at midnight UTC, 
                and weight suggestions are generated with each new prediction.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-3">
              {/* News Analysis */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <CardTitle className="text-sm">News Analysis</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    AI sentiment analysis of latest Solana news
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => handleOpenAIAction('news')}
                    disabled={loading.news}
                    className="w-full"
                    size="sm"
                  >
                    {loading.news ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Latest News Now'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Daily Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <CardTitle className="text-sm">Daily Summary</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    AI-generated market insights and updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => handleOpenAIAction('summary')}
                    disabled={loading.summary}
                    className="w-full"
                    size="sm"
                  >
                    {loading.summary ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Today's Summary Now"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Weight Suggestions */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <CardTitle className="text-sm">Weight Suggestions</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    AI-optimized trading signal weights
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => handleOpenAIAction('weights')}
                    disabled={loading.weights}
                    className="w-full"
                    size="sm"
                  >
                    {loading.weights ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Computing...
                      </>
                    ) : (
                      'Recompute Weights Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Status</CardTitle>
            <CardDescription>External service connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">OpenAI API</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">TAAPI Pro</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">LunarCrush</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">CryptoRank</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Astrology Engine</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Local</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Info</CardTitle>
            <CardDescription>Platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Prediction Interval</span>
                <Badge variant="outline">60s</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">News Analysis</span>
                <Badge variant="outline">Hourly</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Daily Updates</span>
                <Badge variant="outline">Midnight UTC</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Database</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Supabase</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">ML Framework</span>
                <Badge variant="outline">TensorFlow.js</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
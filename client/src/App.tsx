import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProjectInitializer from "@/pages/project-initializer";
import NotFound from "@/pages/not-found";
import PredictionsPage from "@/pages/predictions";
import Dashboard from "@/pages/dashboard";
import SettingsPage from "@/pages/settings";
import LivePredictions from "@/pages/live-predictions";
import MLTraining from "@/pages/ml-training";
import AdvancedAstrology from "@/pages/advanced-astrology";
import TaapiDemo from "../../components/TaapiDemo";
import CryptoRankDemo from "../../components/CryptoRankDemo";
import OnChainDemo from "../../components/OnChainDemo";
import AstrologyDemo from "../../components/AstrologyDemo";
import LunarCrushDemo from "../../components/LunarCrushDemo";
import PredictionWidget from "../../components/PredictionWidget";
import { Activity, BarChart3, Database, TrendingUp, Sparkles, Brain, Settings } from "lucide-react";

function LandingPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Solana AI Trading Platform</h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive cryptocurrency analysis integrating technical, social, fundamental & astrological data for real-time trading insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Link href="/dashboard">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Live Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Real-time AI predictions with comprehensive analysis
              </p>
              <Badge variant="default">Primary Interface</Badge>
            </CardContent>
          </Card>
        </Link>
        <Link href="/taapi">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                TAAPI Pro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Technical analysis indicators for Solana trading
              </p>
              <Badge variant="default">Active</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cryptorank">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                CryptoRank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Fundamental market data and price analytics
              </p>
              <Badge variant="default">Active</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/onchain">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                On-Chain Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Real-time Solana blockchain metrics and validator data
              </p>
              <Badge variant="default">Live Data</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/astrology">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Astrology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Authentic astronomical calculations and planetary positions
              </p>
              <Badge variant="default">Live</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/lunarcrush">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                LunarCrush
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Social metrics and sentiment analysis
              </p>
              <Badge variant="default">Active</Badge>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>TAAPI Pro Technical Indicators</span>
              <Badge variant="default">Configured</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>CryptoRank Market Data</span>
              <Badge variant="default">Configured</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Solana On-Chain Metrics</span>
              <Badge variant="default">Live</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Astrological Data Service</span>
              <Badge variant="default">Live</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>LunarCrush Social Metrics</span>
              <Badge variant="secondary">Authentication Required</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Navigation() {
  const [location] = useLocation();
  
  if (location === '/') return null;
  
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-lg font-semibold">
              Crypto Analytics Platform
            </Button>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button variant={location === '/dashboard' ? 'default' : 'ghost'} size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/taapi">
              <Button variant={location === '/taapi' ? 'default' : 'ghost'} size="sm">
                TAAPI Pro
              </Button>
            </Link>
            <Link href="/cryptorank">
              <Button variant={location === '/cryptorank' ? 'default' : 'ghost'} size="sm">
                CryptoRank
              </Button>
            </Link>
            <Link href="/onchain">
              <Button variant={location === '/onchain' ? 'default' : 'ghost'} size="sm">
                On-Chain
              </Button>
            </Link>
            <Link href="/astrology">
              <Button variant={location === '/astrology' ? 'default' : 'ghost'} size="sm">
                Astrology
              </Button>
            </Link>
            <Link href="/advanced-astrology">
              <Button variant={location === '/advanced-astrology' ? 'default' : 'ghost'} size="sm">
                Advanced Astro
              </Button>
            </Link>
            <Link href="/lunarcrush">
              <Button variant={location === '/lunarcrush' ? 'default' : 'ghost'} size="sm">
                LunarCrush
              </Button>
            </Link>
            <Link href="/live-predictions">
              <Button variant={location === '/live-predictions' ? 'default' : 'ghost'} size="sm">
                <Brain className="h-4 w-4 mr-1" />
                Live AI
              </Button>
            </Link>
            <Link href="/ml-training">
              <Button variant={location === '/ml-training' ? 'default' : 'ghost'} size="sm">
                <Brain className="h-4 w-4 mr-1" />
                ML Training
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant={location === '/settings' ? 'default' : 'ghost'} size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/predictions" component={PredictionsPage} />
        <Route path="/taapi" component={TaapiDemo} />
        <Route path="/cryptorank" component={CryptoRankDemo} />
        <Route path="/onchain" component={OnChainDemo} />
        <Route path="/astrology" component={AstrologyDemo} />
        <Route path="/lunarcrush" component={LunarCrushDemo} />
        <Route path="/live-predictions" component={LivePredictions} />
        <Route path="/ml-training" component={MLTraining} />
        <Route path="/advanced-astrology" component={AdvancedAstrology} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

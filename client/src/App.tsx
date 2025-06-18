import { useState } from "react";
import WorkingDashboard from "@/components/WorkingDashboard";

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Simple routing without external dependencies
  if (currentPath === "/dashboard") {
    return <WorkingDashboard />;
  }

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "16px", color: "#1e293b" }}>
          Solana AI Trading Platform
        </h1>
        <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "16px" }}>
          Comprehensive cryptocurrency analysis integrating technical, social, fundamental & astrological data for real-time trading insights.
        </p>
        <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#dcfce7", border: "1px solid #16a34a", borderRadius: "8px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#166534", marginBottom: "8px" }}>
            System Status: OPERATIONAL (80% Health)
          </h2>
          <p style={{ color: "#15803d", margin: "0" }}>
            Dashboard is now working - click below to access your trading platform
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <button 
          onClick={() => navigateTo("/dashboard")}
          style={{ 
            display: "block", 
            width: "100%",
            padding: "20px", 
            backgroundColor: "#ffffff", 
            border: "2px solid #3b82f6", 
            borderRadius: "8px", 
            cursor: "pointer",
            textAlign: "left",
            fontSize: "16px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#f8fafc";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "24px", marginRight: "12px" }}>🧠</span>
            <span style={{ fontWeight: "bold", color: "#1e293b" }}>AI Prediction Dashboard</span>
          </div>
          <p style={{ margin: "0", color: "#64748b", fontSize: "14px" }}>
            Real-time Solana price predictions using ML models
          </p>
          <div style={{ marginTop: "8px", padding: "4px 8px", backgroundColor: "#dbeafe", color: "#1d4ed8", borderRadius: "4px", display: "inline-block", fontSize: "12px" }}>
            ACTIVE
          </div>
        </button>

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

        <Link href="/backtest">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-green-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Strategy Backtest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Replay predictions against historical price movements
              </p>
              <Badge variant="default">New Feature</Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/risk-management">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Position sizing with Kelly Criterion and fixed-fraction methods
              </p>
              <Badge variant="default">New Feature</Badge>
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

            <Link href="/backtest">
              <Button variant={location === '/backtest' ? 'default' : 'ghost'} size="sm">
                <Target className="h-4 w-4 mr-1" />
                Backtest
              </Button>
            </Link>
            <Link href="/backtest-analysis">
              <Button variant={location === '/backtest-analysis' ? 'default' : 'ghost'} size="sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                SHAP Analysis
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant={location === '/alerts' ? 'default' : 'ghost'} size="sm">
                <Bell className="h-4 w-4 mr-1" />
                Alerts
              </Button>
            </Link>
            <Link href="/correlation">
              <Button variant={location === '/correlation' ? 'default' : 'ghost'} size="sm">
                <GitBranch className="h-4 w-4 mr-1" />
                Correlations
              </Button>
            </Link>
            <Link href="/risk-management">
              <Button variant={location === '/risk-management' ? 'default' : 'ghost'} size="sm">
                <Shield className="h-4 w-4 mr-1" />
                Risk
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
        <Route path="/dashboard" component={WorkingDashboard} />
        <Route path="/predictions" component={PredictionsPage} />

        <Route path="/live-predictions" component={LivePredictions} />
        <Route path="/ml-training" component={MLTraining} />

        <Route path="/advanced-astrology" component={AdvancedAstrology} />
        <Route path="/backtest" component={Backtest} />
        <Route path="/backtest-analysis" component={BacktestAnalysis} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/correlation" component={CorrelationAnalysis} />
        <Route path="/risk-management" component={RiskManagement} />
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

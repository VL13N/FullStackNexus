import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SimpleDashboard() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Solana Price Prediction Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Real-time AI predictions with comprehensive market analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Database</span>
                <Badge variant="default">Connected</Badge>
              </div>
              <div className="flex justify-between">
                <span>CryptoRank</span>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex justify-between">
                <span>LunarCrush</span>
                <Badge variant="default">Operational</Badge>
              </div>
              <div className="flex justify-between">
                <span>Predictions</span>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+2.3%</div>
            <p className="text-sm text-muted-foreground">Bullish Signal</p>
            <p className="text-xs text-muted-foreground mt-2">Confidence: 68%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">80%</div>
            <p className="text-sm text-muted-foreground">4/5 Services Operational</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a href="/taapi" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <h3 className="font-semibold">Technical Analysis</h3>
              <p className="text-sm text-muted-foreground">TAAPI Pro Indicators</p>
            </a>
            <a href="/cryptorank" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <h3 className="font-semibold">Market Data</h3>
              <p className="text-sm text-muted-foreground">CryptoRank Metrics</p>
            </a>
            <a href="/astrology" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <h3 className="font-semibold">Astrology</h3>
              <p className="text-sm text-muted-foreground">Planetary Analysis</p>
            </a>
            <a href="/backtest" className="p-4 border rounded-lg hover:bg-gray-50 text-center">
              <h3 className="font-semibold">Backtesting</h3>
              <p className="text-sm text-muted-foreground">Strategy Validation</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
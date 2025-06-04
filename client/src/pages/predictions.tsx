import PredictionWidget from "../../../components/PredictionWidget";

export default function PredictionsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Live Trading Predictions</h1>
        <p className="text-muted-foreground">
          Real-time Solana price movement predictions using comprehensive multi-pillar analysis
        </p>
      </div>
      
      <PredictionWidget />
    </div>
  );
}
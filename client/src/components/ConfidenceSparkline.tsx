import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface ConfidenceData {
  timestamp: string;
  confidence: number;
}

interface ConfidenceSparklineProps {
  data: ConfidenceData[];
  height?: number;
}

export default function ConfidenceSparkline({ data, height = 40 }: ConfidenceSparklineProps) {
  const formatData = data.slice(-10).map((item, index) => ({
    index,
    confidence: Math.round(item.confidence * 100),
    time: new Date(item.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  if (formatData.length < 2) {
    return (
      <div className="flex items-center justify-center h-10 text-xs text-muted-foreground">
        Building trend...
      </div>
    );
  }

  const trend = formatData[formatData.length - 1].confidence - formatData[0].confidence;
  const trendColor = trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#6b7280';

  return (
    <div className="space-y-1">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={formatData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke={trendColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 2, fill: trendColor }}
          />
          <XAxis dataKey="index" hide />
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatData[0]?.time}</span>
        <span style={{ color: trendColor }}>
          {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend).toFixed(1)}%
        </span>
        <span>{formatData[formatData.length - 1]?.time}</span>
      </div>
    </div>
  );
}
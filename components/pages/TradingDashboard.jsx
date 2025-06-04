import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import frontendTradingService from '../../services/frontendTradingService';

const TradingDashboard = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [envStatus, setEnvStatus] = useState({
    apiKeysConfigured: false,
    checking: true
  });

  // Check environment status on component mount
  useEffect(() => {
    checkEnvironmentStatus();
  }, []);

  const checkEnvironmentStatus = async () => {
    try {
      const response = await fetch('/health');
      const healthData = await response.json();
      
      setEnvStatus({
        apiKeysConfigured: healthData.status === 'OK',
        checking: false
      });
    } catch (err) {
      setEnvStatus({
        apiKeysConfigured: false,
        checking: false,
        error: 'Unable to verify API configuration'
      });
    }
  };

  const fetchTechnicalData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendTradingService.getBulkIndicators(symbol);
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleteAnalysis = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await frontendTradingService.getComprehensiveData(symbol, {
        includeAI: true
      });
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderEnvironmentStatus = () => (
    <Card title="API Configuration Status">
      <div className="space-y-4">
        {envStatus.checking ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Checking API configuration...</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Server Status:</span>
              <span className={`px-2 py-1 rounded text-sm ${
                envStatus.apiKeysConfigured 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {envStatus.apiKeysConfigured ? 'Connected' : 'Configuration Required'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              {envStatus.apiKeysConfigured 
                ? 'All API keys are properly configured and accessible.'
                : 'API keys need to be configured in the environment variables.'
              }
            </div>
            
            {envStatus.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {envStatus.error}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  const renderTradingInterface = () => (
    <Card title="Trading Data Interface">
      <div className="space-y-4">
        <div className="flex space-x-4">
          <Input
            label="Trading Symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTCUSDT"
            className="flex-1"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={fetchTechnicalData}
            disabled={loading || !envStatus.apiKeysConfigured}
            className="flex-1"
          >
            {loading ? 'Loading...' : 'Get Technical Data'}
          </Button>
          
          <Button 
            onClick={fetchCompleteAnalysis}
            disabled={loading || !envStatus.apiKeysConfigured}
            variant="secondary"
            className="flex-1"
          >
            {loading ? 'Loading...' : 'Complete Analysis'}
          </Button>
        </div>
        
        {!envStatus.apiKeysConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800 text-sm">
              API keys must be configured before fetching trading data.
            </p>
          </div>
        )}
      </div>
    </Card>
  );

  const renderDataDisplay = () => {
    if (error) {
      return (
        <Card title="Error">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
            <Button 
              variant="ghost" 
              onClick={() => setError(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      );
    }

    if (!data) return null;

    return (
      <div className="space-y-6">
        {data.technical && (
          <Card title={`Technical Indicators - ${data.symbol || symbol}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.technical.data || {}).map(([indicator, value]) => (
                <div key={indicator} className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-900 capitalize">
                    {indicator.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {typeof value === 'object' 
                      ? JSON.stringify(value, null, 2)
                      : value?.toString() || 'N/A'
                    }
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {data.social && (
          <Card title="Social Metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Social Score:</div>
                <div className="text-lg">{data.social.data?.social_score || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Market Cap Rank:</div>
                <div className="text-lg">{data.social.data?.market_cap_rank || 'N/A'}</div>
              </div>
            </div>
          </Card>
        )}

        {data.market && (
          <Card title="Market Data">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Current Price:</div>
                <div className="text-lg font-bold">
                  ${data.market.data?.price || 'N/A'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">24h Change:</div>
                <div className={`text-lg font-bold ${
                  (data.market.data?.change_24h || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {data.market.data?.change_24h || 'N/A'}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Volume:</div>
                <div className="text-lg">{data.market.data?.volume || 'N/A'}</div>
              </div>
            </div>
          </Card>
        )}

        {data.aiAnalysis && (
          <Card title="AI Analysis">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                {data.aiAnalysis.aiAnalysis}
              </pre>
            </div>
          </Card>
        )}

        {data.errors && data.errors.length > 0 && (
          <Card title="Warnings">
            <div className="space-y-2">
              {data.errors.map((error, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <span className="font-medium">{error.type}:</span> {error.error}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Dashboard</h1>
        <p className="text-gray-600">
          Access real-time market data, technical indicators, and AI-powered analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderEnvironmentStatus()}
        {renderTradingInterface()}
      </div>

      {renderDataDisplay()}
    </div>
  );
};

export default TradingDashboard;
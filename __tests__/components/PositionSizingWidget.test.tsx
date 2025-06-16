/**
 * Unit Tests for Position Sizing Widget Component
 * Comprehensive coverage of risk calculation UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PositionSizingWidget } from '../../components/ui/position-sizing-widget';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('PositionSizingWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render position sizing widget with default props', () => {
      renderWithQueryClient(<PositionSizingWidget />);
      
      expect(screen.getByText('Position Sizing')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    it('should display loading state while fetching position data', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );
      
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should display position parameters in footer', () => {
      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.65} 
          confidence={0.75} 
          currentPrice={155.50} 
        />
      );
      
      expect(screen.getByText('0.65')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('$155.50')).toBeInTheDocument();
    });
  });

  describe('Position Sizing Display', () => {
    const mockPositionResponse = {
      success: true,
      data: {
        success: true,
        positionSize: 1.25,
        positionValue: 187.50,
        positionPercentage: 1.875,
        recommendation: 'BUY',
        riskMetrics: {
          riskPercentage: 1.5,
          stopLossPrice: 142.50,
          volatility: 22.5,
          potentialLoss: 150.00
        },
        sizing: {
          kellyFraction: 0.15,
          fixedFraction: 0.008,
          combinedFraction: 0.0112
        },
        modelMetrics: {
          confidence: 0.8,
          winProbability: 0.72,
          expectedReturn: 0.045
        }
      }
    };

    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPositionResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              maxRiskPerTrade: 0.02,
              kellyFraction: 0.25,
              fixedFraction: 0.01
            }
          })
        });
    });

    it('should display position size recommendation for BUY signal', async () => {
      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('BUY')).toBeInTheDocument();
        expect(screen.getByText('1.25 SOL')).toBeInTheDocument();
        expect(screen.getByText('$188 (1.9% of portfolio)')).toBeInTheDocument();
      });
    });

    it('should display risk metrics correctly', async () => {
      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1.5%')).toBeInTheDocument(); // Risk percentage
        expect(screen.getByText('$142.50')).toBeInTheDocument(); // Stop loss
        expect(screen.getByText('22.5%')).toBeInTheDocument(); // Volatility
        expect(screen.getByText('72.0%')).toBeInTheDocument(); // Win probability
      });
    });

    it('should show high risk warning when risk exceeds threshold', async () => {
      const highRiskResponse = {
        ...mockPositionResponse,
        data: {
          ...mockPositionResponse.data,
          riskMetrics: {
            ...mockPositionResponse.data.riskMetrics,
            riskPercentage: 4.5
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(highRiskResponse)
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.9} 
          confidence={0.9} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/High risk position/)).toBeInTheDocument();
      });
    });
  });

  describe('Settings Panel', () => {
    it('should toggle settings panel when settings button is clicked', async () => {
      renderWithQueryClient(<PositionSizingWidget />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Account Balance/)).toBeInTheDocument();
      });
    });

    it('should update account balance when input changes', async () => {
      renderWithQueryClient(<PositionSizingWidget />);
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        const balanceInput = screen.getByLabelText(/Account Balance/);
        fireEvent.change(balanceInput, { target: { value: '25000' } });
        expect(balanceInput).toHaveValue(25000);
      });
    });

    it('should display sizing method breakdown in settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPositionResponse)
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('Kelly Criterion:')).toBeInTheDocument();
        expect(screen.getByText('Fixed Fraction:')).toBeInTheDocument();
        expect(screen.getByText('Combined:')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when position sizing fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Position Sizing Error')).toBeInTheDocument();
        expect(screen.getByText(/Failed to calculate position size/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should display insufficient data message when position sizing not available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            success: false,
            reason: 'Insufficient confidence for position sizing'
          }
        })
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.1} 
          confidence={0.2} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Insufficient confidence for position sizing/)).toBeInTheDocument();
      });
    });
  });

  describe('Recommendation Icons', () => {
    it('should display correct icon for BUY recommendation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockPositionResponse,
          data: { ...mockPositionResponse.data, recommendation: 'BUY' }
        })
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        const buyBadge = screen.getByText('BUY');
        expect(buyBadge).toBeInTheDocument();
        expect(buyBadge.closest('div')).toHaveClass('bg-green-100');
      });
    });

    it('should display correct icon for SELL recommendation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockPositionResponse,
          data: { ...mockPositionResponse.data, recommendation: 'SELL' }
        })
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={-0.7} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        const sellBadge = screen.getByText('SELL');
        expect(sellBadge).toBeInTheDocument();
        expect(sellBadge.closest('div')).toHaveClass('bg-red-100');
      });
    });

    it('should display correct icon for HOLD recommendation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockPositionResponse,
          data: { ...mockPositionResponse.data, recommendation: 'HOLD' }
        })
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.1} 
          confidence={0.8} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        const holdBadge = screen.getByText('HOLD');
        expect(holdBadge).toBeInTheDocument();
        expect(holdBadge.closest('div')).toHaveClass('bg-gray-100');
      });
    });
  });

  describe('API Integration', () => {
    it('should make correct API calls with proper parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPositionResponse)
      });

      renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.65} 
          confidence={0.75} 
          currentPrice={155.50} 
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/risk/size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prediction: 0.65,
            confidence: 0.75,
            currentPrice: 155.50,
            accountBalance: 10000
          })
        });
      });
    });

    it('should refetch data when parameters change', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPositionResponse)
      });

      const { rerender } = renderWithQueryClient(
        <PositionSizingWidget 
          prediction={0.5} 
          confidence={0.7} 
          currentPrice={150} 
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2); // Position + settings
      });

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <PositionSizingWidget 
            prediction={0.8} 
            confidence={0.9} 
            currentPrice={160} 
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/risk/size', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prediction: 0.8,
            confidence: 0.9,
            currentPrice: 160,
            accountBalance: 10000
          })
        });
      });
    });
  });
});
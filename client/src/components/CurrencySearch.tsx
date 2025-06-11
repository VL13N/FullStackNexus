import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Currency {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  marketCap: number;
}

interface CurrencySearchProps {
  onSelect?: (currency: Currency) => void;
  placeholder?: string;
}

export default function CurrencySearch({ onSelect, placeholder = "Search cryptocurrencies..." }: CurrencySearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Debounce search requests
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCurrencies(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const searchCurrencies = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/cryptorank/currencies/search?q=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      
      if (result.success) {
        setResults(result.data || []);
        setIsOpen(true);
      } else {
        setError(result.error || 'Search failed');
        setResults([]);
        setIsOpen(false);
      }
    } catch (err) {
      setError('Network error occurred');
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (currency: Currency) => {
    setQuery(`${currency.name} (${currency.symbol})`);
    setIsOpen(false);
    onSelect?.(currency);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   placeholder-gray-500 dark:placeholder-gray-400"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
          >
            <X />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Searching...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-red-300 rounded-lg shadow-lg z-50">
          <div className="p-4 text-center text-red-600 dark:text-red-400">
            {error}
            {error.includes('API key') && (
              <p className="text-xs mt-1">CryptoRank API key required for search</p>
            )}
          </div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((currency) => (
            <button
              key={currency.id}
              onClick={() => handleSelect(currency)}
              className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currency.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                      {currency.symbol}
                    </span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      #{currency.rank}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                      {formatPrice(currency.price)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatMarketCap(currency.marketCap)} cap
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !loading && !error && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No cryptocurrencies found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
}
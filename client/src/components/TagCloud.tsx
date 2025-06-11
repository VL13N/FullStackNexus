import { useState, useEffect } from 'react';
import { Tag, Filter } from 'lucide-react';

interface CryptoTag {
  id: string;
  name: string;
  count: number;
  trending: boolean;
}

interface TagCloudProps {
  onTagSelect?: (tag: string) => void;
  selectedTags?: string[];
}

export default function TagCloud({ onTagSelect, selectedTags = [] }: TagCloudProps) {
  const [tags, setTags] = useState<CryptoTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/cryptorank/currencies/tags');
      const result = await response.json();
      
      if (result.success) {
        setTags(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch tags');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getTagStyle = (tag: CryptoTag, isSelected: boolean) => {
    const baseClasses = "inline-block px-3 py-1 m-1 text-xs font-medium rounded-full cursor-pointer transition-colors duration-200";
    
    if (isSelected) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }
    
    if (tag.trending) {
      return `${baseClasses} bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200`;
    }
    
    // Size based on count
    if (tag.count > 100) {
      return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 text-sm px-4 py-2`;
    } else if (tag.count > 50) {
      return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300`;
    } else {
      return `${baseClasses} bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400`;
    }
  };

  const handleTagClick = (tagName: string) => {
    onTagSelect?.(tagName);
  };

  const sortedTags = tags.sort((a, b) => {
    // Trending tags first, then by count
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    return b.count - a.count;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Tag className="h-5 w-5" />
          Crypto Categories
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Popular cryptocurrency categories and sectors
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {error.includes('API key') && (
            <p className="text-xs mt-1">CryptoRank API key required for tags</p>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading tags...</div>
      ) : tags.length > 0 ? (
        <div className="space-y-4">
          {selectedTags.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Filters:
                </span>
              </div>
              <div className="flex flex-wrap">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="inline-block px-3 py-1 m-1 text-xs font-medium rounded-full cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap">
            {sortedTags.slice(0, 30).map((tag) => {
              const isSelected = selectedTags.includes(tag.name);
              return (
                <span
                  key={tag.id}
                  onClick={() => handleTagClick(tag.name)}
                  className={getTagStyle(tag, isSelected)}
                  title={`${tag.count} projects • ${tag.trending ? 'Trending' : 'Popular'}`}
                >
                  {tag.name}
                  {tag.trending && <span className="ml-1">🔥</span>}
                </span>
              );
            })}
          </div>
          
          {tags.length > 30 && (
            <div className="text-center pt-2">
              <button 
                onClick={fetchTags}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                Show all {tags.length} categories
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No category tags available
        </div>
      )}
    </div>
  );
}
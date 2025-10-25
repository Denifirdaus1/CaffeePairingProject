import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon } from '../icons/SearchIcon';

interface Coffee {
  id: string;
  name: string;
  slug: string;
  flavor_notes?: string;
  season_hint?: string;
  popularity_hint: number;
  image_url?: string;
  is_main_shot: boolean;
}

interface CoffeeSearchProps {
  coffees: Coffee[];
  onCoffeeSelect: (coffee: Coffee) => void;
  placeholder?: string;
  className?: string;
}

export const CoffeeSearch: React.FC<CoffeeSearchProps> = ({
  coffees,
  onCoffeeSelect,
  placeholder = "Search our coffee collection...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [filteredCoffees, setFilteredCoffees] = useState<Coffee[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredCoffees([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = coffees.filter(coffee =>
      coffee.name.toLowerCase().includes(query.toLowerCase()) ||
      (coffee.flavor_notes && coffee.flavor_notes.toLowerCase().includes(query.toLowerCase())) ||
      (coffee.season_hint && coffee.season_hint.toLowerCase().includes(query.toLowerCase()))
    ).slice(0, 8); // Limit to 8 suggestions for better UX

    setFilteredCoffees(filtered);
    setShowSuggestions(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query, coffees]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCoffees.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCoffees.length) {
          handleCoffeeSelect(filteredCoffees[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCoffeeSelect = (coffee: Coffee) => {
    onCoffeeSelect(coffee);
    setQuery('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (filteredCoffees.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-brand-text-muted" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className="w-full pl-12 pr-4 py-4 rounded-xl bg-brand-bg border border-brand-border focus:ring-2 focus:ring-brand-accent focus:border-transparent text-white placeholder-brand-text-muted transition-all"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredCoffees.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-bg border border-brand-border rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          {filteredCoffees.map((coffee, index) => (
            <div
              key={coffee.id}
              className={`p-4 cursor-pointer transition-colors border-b border-brand-border/30 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-brand-accent/20 text-white'
                  : 'hover:bg-brand-primary/50 text-brand-text'
              }`}
              onClick={() => handleCoffeeSelect(coffee)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-4">
                {/* Coffee Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {coffee.image_url ? (
                    <img
                      src={coffee.image_url}
                      alt={coffee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-surface flex items-center justify-center">
                      <span className="text-brand-text-muted text-xs">☕</span>
                    </div>
                  )}
                </div>

                {/* Coffee Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {coffee.name}
                    </h3>
                    {coffee.is_main_shot && (
                      <span className="bg-brand-accent text-white px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                        Main Shot
                      </span>
                    )}
                  </div>
                  
                  {coffee.flavor_notes && (
                    <p className="text-sm text-brand-text-muted truncate">
                      {coffee.flavor_notes}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-brand-text-muted">
                      Popularity: {Math.round(coffee.popularity_hint * 100)}%
                    </span>
                    {coffee.season_hint && (
                      <span className="text-xs text-brand-text-muted">
                        Season: {coffee.season_hint}
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="text-brand-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {showSuggestions && query.trim() !== '' && filteredCoffees.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-brand-bg border border-brand-border rounded-xl shadow-2xl z-50 p-4">
          <div className="text-center text-brand-text-muted">
            <p>No coffees found matching "{query}"</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
};

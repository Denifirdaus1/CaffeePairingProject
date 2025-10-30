import React, { useState } from 'react';
import { Coffee, Pastry } from '../../types';
import { generatePairings } from '../../services/geminiService';

interface PublicPairingGeneratorProps {
  coffees: Coffee[];
  pastries: Pastry[];
  shopSlug: string;
}

interface PairingResult {
  pastry: {
    id: string;
    name: string;
    image: string;
  };
  score: number;
  why_marketing: string;
  reasoning?: {
    flavor: string;
    texture: string;
    popularity: string;
    season: string;
  };
}

export const PublicPairingGenerator: React.FC<PublicPairingGeneratorProps> = ({
  coffees,
  pastries,
  shopSlug,
}) => {
  const [selectedType, setSelectedType] = useState<'coffee' | 'pastry'>('coffee');
  const [selectedItem, setSelectedItem] = useState<Coffee | Pastry | null>(null);
  const [pairingResults, setPairingResults] = useState<PairingResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleItemSelect = (item: Coffee | Pastry) => {
    setSelectedItem(item);
    setPairingResults([]);
  };

  const handleGeneratePairing = async () => {
    if (!selectedItem) return;

    setIsGenerating(true);
    
    try {
      let results: PairingResult[] = [];

      if (selectedType === 'coffee') {
        // Coffee selected, use full AI pairing generation
        const coffee = selectedItem as Coffee;
        const aiResponse = await generatePairings(coffee, pastries);
        
        // Map AI response to our result format
        results = aiResponse.pairs.slice(0, 3).map(pair => ({
          pastry: pair.pastry,
          score: pair.score,
          why_marketing: pair.why_marketing,
          reasoning: pair.reasoning,
        }));
      } else {
        // Pastry selected, generate pairings for each coffee
        const pastry = selectedItem as Pastry;
        
        // Generate pairing for each coffee with the selected pastry
        const pairingPromises = coffees.map(async (coffee) => {
          const aiResponse = await generatePairings(coffee, [pastry]);
          if (aiResponse.pairs.length > 0) {
            const pair = aiResponse.pairs[0];
            return {
              pastry: {
                id: coffee.id,
                name: coffee.name,
                image: coffee.image_url || '',
              },
              score: pair.score,
              why_marketing: pair.why_marketing,
              reasoning: pair.reasoning,
            };
          }
          return null;
        });

        const allPairings = (await Promise.all(pairingPromises)).filter(p => p !== null) as PairingResult[];
        
        // Sort by score and take top 3
        results = allPairings
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
      }

      setPairingResults(results);
    } catch (error) {
      console.error('Error generating pairings:', error);
      alert('Failed to generate AI pairings. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Create your pairing
          </h2>
          <p className="text-brand-text/70 max-w-xl mx-auto">
            Select a coffee or pastry to find the perfect match
          </p>
        </div>

        {/* Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex gap-3">
            <button
              onClick={() => {
                setSelectedType('coffee');
                setSelectedItem(null);
                setPairingResults([]);
              }}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                selectedType === 'coffee'
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-surface text-brand-text hover:bg-brand-surface/70'
              }`}
            >
              Coffee
            </button>
            <button
              onClick={() => {
                setSelectedType('pastry');
                setSelectedItem(null);
                setPairingResults([]);
              }}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                selectedType === 'pastry'
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-surface text-brand-text hover:bg-brand-surface/70'
              }`}
            >
              Pastry
            </button>
          </div>
        </div>

        {/* Item Selection - Horizontal Scroll */}
        <div className="mb-8">
          <div className="overflow-x-auto scrollbar-hide pb-4">
            <div className="flex gap-4 min-w-min px-2">
              {(selectedType === 'coffee' ? coffees : pastries).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className={`flex-shrink-0 w-48 glass-panel rounded-xl p-4 hover:bg-brand-surface/50 transition-all ${
                    selectedItem?.id === item.id
                      ? 'ring-2 ring-brand-accent bg-brand-accent/5'
                      : ''
                  }`}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {item.name}
                  </h4>
                  <div className="text-xs text-brand-text-muted">
                    {Math.round(item.popularity_hint * 100)}% popular
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button - Always Visible */}
        <div className="text-center mb-12">
          <button
            onClick={handleGeneratePairing}
            disabled={!selectedItem || isGenerating}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              selectedItem && !isGenerating
                ? 'bg-brand-accent text-white hover:bg-brand-accent/90'
                : 'bg-brand-surface/30 text-brand-text-muted cursor-not-allowed'
            }`}
          >
            {isGenerating ? 'AI is thinking...' : 'Generate Pairing'}
          </button>
          {isGenerating && (
            <p className="text-sm text-brand-text-muted mt-3">
              Using AI to find the perfect match based on flavor science
            </p>
          )}
        </div>

        {/* Pairing Results */}
        {pairingResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center mb-6">
              Top recommendations for {selectedItem?.name}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pairingResults.map((result, index) => (
                <div
                  key={result.pastry.id}
                  className="glass-panel rounded-xl p-6 hover:bg-brand-surface/50 transition-all"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-brand-text-muted">
                      #{index + 1}
                    </span>
                    <span className="text-lg font-bold text-brand-accent">
                      {Math.round(result.score * 100)}%
                    </span>
                  </div>

                  {/* Item Image */}
                  {result.pastry.image_url && (
                    <img
                      src={result.pastry.image_url}
                      alt={result.pastry.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  {/* Item Name */}
                  <h4 className="text-lg font-semibold text-white mb-3">
                    {result.pastry.name}
                  </h4>

                  {/* Marketing Message */}
                  <p className="text-sm text-brand-text/80 leading-relaxed mb-4">
                    {result.why_marketing}
                  </p>

                  {/* View Details Button */}
                  <button
                    onClick={() => {
                      if (selectedType === 'coffee') {
                        // Find the full pastry object to get slug
                        const pastryItem = pastries.find(p => p.id === result.pastry.id);
                        if (pastryItem?.slug) {
                          window.location.href = `/s/${shopSlug}/pastry/${pastryItem.slug}`;
                        }
                      } else {
                        // Find the full coffee object to get slug
                        const coffeeItem = coffees.find(c => c.id === result.pastry.id);
                        if (coffeeItem?.slug) {
                          window.location.href = `/s/${shopSlug}/coffee/${coffeeItem.slug}`;
                        }
                      }
                    }}
                    className="w-full bg-brand-accent text-white px-4 py-2.5 rounded-lg font-medium hover:bg-brand-accent/90 transition-all"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Try Again Button */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setPairingResults([]);
                }}
                className="text-brand-text hover:text-white font-medium transition-colors"
              >
                Try another pairing
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};


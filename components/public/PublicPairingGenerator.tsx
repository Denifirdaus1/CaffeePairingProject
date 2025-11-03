import React, { useState } from 'react';
import { Coffee, Pastry } from '../../types';
import { generatePairings } from '../../services/geminiService';
import { FlavorIcon } from '../icons/FlavorIcon';
import { TextureIcon } from '../icons/TextureIcon';
import { PopularityIcon } from '../icons/PopularityIcon';
import { SeasonIcon } from '../icons/SeasonIcon';
import { OptimizedImage } from '../OptimizedImage';
import { ThinkingIndicator } from '../ThinkingIndicator';
import { useCart } from '../../contexts/CartContext';

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
  score_breakdown: {
    flavor: number;
    texture: number;
    popularity: number;
    season: number;
  };
  why_marketing: string;
  reasoning: {
    flavor: string;
    texture: string;
    popularity: string;
    season: string;
    fallback_note?: string;
  };
  badges?: string[];
  flavor_tags_standardized?: string[];
  facts?: Array<{
    summary: string;
    source_url: string;
  }>;
  allergen_info?: string;
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
  const { addToCart, isInCart } = useCart();

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
        
        // Map AI response to our result format with full details
        results = aiResponse.pairs.slice(0, 3).map(pair => ({
          pastry: pair.pastry,
          score: pair.score,
          score_breakdown: pair.score_breakdown,
          why_marketing: pair.why_marketing,
          reasoning: pair.reasoning,
          badges: pair.badges,
          flavor_tags_standardized: pair.flavor_tags_standardized,
          facts: pair.facts,
          allergen_info: pair.allergen_info,
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
              score_breakdown: pair.score_breakdown,
              why_marketing: pair.why_marketing,
              reasoning: pair.reasoning,
              badges: pair.badges,
              flavor_tags_standardized: pair.flavor_tags_standardized,
              facts: pair.facts,
              allergen_info: pair.allergen_info,
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
    <section className="pt-6 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
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
                    <OptimizedImage
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      width={200}
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
          
          {/* Thinking Animation */}
          {isGenerating && (
            <div className="mt-6">
              <ThinkingIndicator />
            </div>
          )}
        </div>

        {/* Pairing Results - Full Dashboard Style */}
        {pairingResults.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white text-center mb-6">
              Top recommendations for {selectedItem?.name}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {pairingResults.map((result, index) => (
                <div
                  key={result.pastry.id}
                  className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-surface/90 to-brand-surface/60 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl hover:shadow-brand-accent/20 border border-brand-border/50 backdrop-blur-sm"
                >
                  {/* Header */}
                  <div className="relative p-6 flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-light text-sm font-bold text-white shadow-lg">
                          #{index + 1}
                        </div>
                        <h3 className="text-xl font-bold text-white">{result.pastry.name}</h3>
                      </div>
                      {result.badges && result.badges.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {result.badges.map(badge => (
                            <span key={badge} className="inline-flex items-center rounded-full bg-brand-accent/20 px-3 py-1 text-xs font-medium text-brand-accent ring-1 ring-brand-accent/30">
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Score Badge with Hover Breakdown */}
                    <div className={`group/score relative text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg ${
                      result.score > 0.8 ? 'bg-green-600' : result.score > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                    }`}>
                      <span>Score: {result.score.toFixed(2)}</span>
                      <div className="absolute bottom-full mb-2 w-48 left-1/2 -translate-x-1/2 bg-brand-bg p-2 rounded-lg text-xs font-normal opacity-0 group-hover/score:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl border border-brand-accent/30 z-10">
                        <h5 className="font-bold mb-1 border-b border-brand-accent/20 pb-1">Score Breakdown</h5>
                        <ul className="text-left space-y-0.5">
                          <li>Flavor: {(result.score_breakdown.flavor * 100).toFixed(0)}%</li>
                          <li>Texture: {(result.score_breakdown.texture * 100).toFixed(0)}%</li>
                          <li>Popularity: {(result.score_breakdown.popularity * 100).toFixed(0)}%</li>
                          <li>Season: {(result.score_breakdown.season * 100).toFixed(0)}%</li>
                        </ul>
                        <p className="text-brand-text/60 mt-1 text-center text-[10px]">Based on formula</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-grow px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Side: Image & Tags */}
                    <div className="flex flex-col gap-4">
                      <div className="relative overflow-hidden rounded-2xl">
                        {result.pastry.image && (
                          <>
                            <OptimizedImage
                              src={result.pastry.image}
                              alt={result.pastry.name}
                              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                              width={600}
                              priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </>
                        )}
                      </div>

                      {/* Flavor Profile */}
                      {result.flavor_tags_standardized && result.flavor_tags_standardized.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-white text-sm mb-3">Flavor Profile</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.flavor_tags_standardized.map(tag => (
                              <span key={tag} className="inline-flex items-center rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent ring-1 ring-brand-accent/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Allergen Info */}
                      {result.allergen_info && (
                        <div>
                          <h4 className="font-semibold text-white text-sm mb-2">Allergen Info</h4>
                          <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                            {result.allergen_info}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Side: Reasoning & Facts */}
                    <div className="flex flex-col gap-4">
                      <div>
                        <h4 className="font-semibold text-white text-sm mb-3">Why you're seeing this</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-brand-accent mt-0.5">
                              <FlavorIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-white text-sm">Flavor</h5>
                              <p className="text-xs text-brand-text/90">{result.reasoning.flavor}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-brand-accent mt-0.5">
                              <TextureIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-white text-sm">Texture</h5>
                              <p className="text-xs text-brand-text/90">{result.reasoning.texture}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-brand-accent mt-0.5">
                              <PopularityIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-white text-sm">Popularity</h5>
                              <p className="text-xs text-brand-text/90">{result.reasoning.popularity}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 text-brand-accent mt-0.5">
                              <SeasonIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-white text-sm">Season</h5>
                              <p className="text-xs text-brand-text/90">{result.reasoning.season}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Supporting Facts */}
                      {result.facts && result.facts.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-white text-sm border-b border-brand-accent/30 pb-1 mb-2">Supporting Facts</h4>
                          <ul className="list-disc list-inside space-y-1.5">
                            {result.facts.map((fact, factIndex) => (
                              <li key={factIndex} className="text-xs text-brand-text">
                                {fact.summary}
                                <a href={fact.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline ml-1.5">
                                  [source]
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fallback Note */}
                      {result.reasoning.fallback_note && (
                        <p className="text-xs text-brand-text/60 italic">{result.reasoning.fallback_note}</p>
                      )}
                    </div>
                  </div>

                  {/* Footer - Marketing Quote */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-brand-accent/10 to-brand-accent/5 p-6 mt-auto">
                    <div className="relative z-10">
                      <p className="text-lg font-semibold text-brand-accent italic leading-relaxed">"{result.why_marketing}"</p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent" />
                  </div>

                  {/* Add to Cart Section */}
                  {(() => {
                    // Get coffee and pastry based on selected type
                    let coffee: Coffee | undefined;
                    let pastry: Pastry | undefined;

                    if (selectedType === 'coffee') {
                      coffee = selectedItem as Coffee;
                      pastry = pastries.find(p => p.id === result.pastry.id);
                    } else {
                      pastry = selectedItem as Pastry;
                      coffee = coffees.find(c => c.id === result.pastry.id);
                    }

                    const coffeePrice = coffee?.price || 0;
                    const pastryPrice = pastry?.price || 0;
                    const combinedPrice = coffeePrice + pastryPrice;
                    const hasBothPrices = coffee?.price != null && pastry?.price != null;
                    
                    // Create unique ID for this generated pairing
                    const generatedPairingId = `generated-${coffee?.id}-${pastry?.id}`;
                    const inCart = isInCart(generatedPairingId, 'pairing');

                    return (
                      <div className="p-6 border-t border-brand-border/30">
                        {hasBothPrices ? (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-sm text-brand-text-muted">
                                <div>Coffee: €{coffeePrice.toFixed(2)}</div>
                                <div>Pastry: €{pastryPrice.toFixed(2)}</div>
                              </div>
                              <div className="text-2xl font-bold text-brand-accent">
                                €{combinedPrice.toFixed(2)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (coffee && pastry) {
                                  addToCart({
                                    type: 'pairing',
                                    productId: generatedPairingId,
                                    name: `${coffee.name} + ${pastry.name}`,
                                    price: combinedPrice,
                                    image_url: coffee.image_url || result.pastry.image,
                                    coffeeName: coffee.name,
                                    pastryName: pastry.name,
                                    coffeeId: coffee.id,
                                    pastryId: pastry.id,
                                    coffeePrice,
                                    pastryPrice,
                                  });
                                }
                              }}
                              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                                inCart
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-brand-accent hover:bg-brand-accent/90 text-white shadow-lg hover:shadow-xl'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {inCart ? '✓ In Cart' : 'Add Pairing to Cart'}
                            </button>
                          </>
                        ) : (
                          <p className="text-sm text-brand-text-muted text-center py-2">
                            Prices not available for this pairing
                          </p>
                        )}
                      </div>
                    );
                  })()}
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

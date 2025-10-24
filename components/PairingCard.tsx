import React from 'react';
import type { Pairing } from '../types';
import { FlavorIcon } from './icons/FlavorIcon';
import { TextureIcon } from './icons/TextureIcon';
import { PopularityIcon } from './icons/PopularityIcon';
import { SeasonIcon } from './icons/SeasonIcon';
import { LazyImage } from './LazyImage';

interface PairingCardProps {
  pairing: Pairing;
  rank: number;
}

const ScoreBadge: React.FC<{ score: number, breakdown: Pairing['score_breakdown'] }> = ({ score, breakdown }) => {
    const bgColor = score > 0.8 ? 'bg-green-600' : score > 0.6 ? 'bg-yellow-500' : 'bg-orange-500';
    return (
        <div className={`group relative text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg ${bgColor}`}>
            <span>Score: {score.toFixed(2)}</span>
            <div className="absolute bottom-full mb-2 w-48 left-1/2 -translate-x-1/2 bg-brand-bg p-2 rounded-lg text-xs font-normal opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl border border-brand-accent/30 z-10">
                <h5 className="font-bold mb-1 border-b border-brand-accent/20 pb-1">Score Breakdown</h5>
                <ul className="text-left space-y-0.5">
                    <li>Flavor: {(breakdown.flavor * 100).toFixed(0)}%</li>
                    <li>Texture: {(breakdown.texture * 100).toFixed(0)}%</li>
                    <li>Popularity: {(breakdown.popularity * 100).toFixed(0)}%</li>
                    <li>Season: {(breakdown.season * 100).toFixed(0)}%</li>
                </ul>
                 <p className="text-brand-text/60 mt-1 text-center text-[10px]">Based on formula</p>
            </div>
        </div>
    )
}

const ReasoningItem: React.FC<{ icon: React.ReactNode, title: string, text: string }> = ({ icon, title, text }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-brand-accent mt-0.5">{icon}</div>
        <div>
            <h5 className="font-semibold text-white text-sm">{title}</h5>
            <p className="text-xs text-brand-text/90">{text}</p>
        </div>
    </div>
);

export const PairingCard: React.FC<PairingCardProps> = ({ pairing, rank }) => {
  return (
    <div className="bg-brand-primary/80 rounded-xl overflow-hidden shadow-2xl flex flex-col transform transition-transform duration-300 hover:scale-[1.02] relative border border-brand-primary">
        {/* Header */}
        <div className="p-4 flex justify-between items-start">
            <div>
                 <h3 className="text-xl font-bold text-white mb-1">#{rank}: {pairing.pastry.name}</h3>
                 <div className="flex flex-wrap gap-2">
                    {pairing.badges?.map(badge => (
                        <span key={badge} className="text-xs font-semibold bg-brand-accent/30 text-brand-accent px-2 py-0.5 rounded-full">{badge}</span>
                    ))}
                 </div>
            </div>
            {pairing.score_breakdown && <ScoreBadge score={pairing.score} breakdown={pairing.score_breakdown} />}
        </div>

      {/* Body */}
      <div className="flex-grow p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: Image & Tags */}
        <div className="flex flex-col gap-4">
             <LazyImage 
                src={pairing.pastry.image} 
                alt={pairing.pastry.name} 
                className="w-full h-40 rounded-lg object-cover" 
            />
             <div>
                <h4 className="font-semibold text-white text-sm mb-2">Flavor Profile</h4>
                <div className="flex flex-wrap gap-1.5">
                    {pairing.flavor_tags_standardized?.map(tag => (
                        <span key={tag} className="text-xs bg-brand-bg text-brand-text px-2 py-1 rounded">{tag}</span>
                    ))}
                </div>
             </div>
              {pairing.allergen_info && (
                 <div>
                    <h4 className="font-semibold text-white text-sm mb-2">Allergen Info</h4>
                    <span className="text-xs bg-red-900/50 border border-red-700 text-red-300 px-2 py-1 rounded">{pairing.allergen_info}</span>
                 </div>
              )}
        </div>

        {/* Right Side: Reasoning & Facts */}
        <div className="flex flex-col gap-4">
            <div>
                <h4 className="font-semibold text-white text-sm mb-3">Why you're seeing this</h4>
                <div className="space-y-3">
                    <ReasoningItem icon={<FlavorIcon className="w-5 h-5"/>} title="Flavor" text={pairing.reasoning.flavor} />
                    <ReasoningItem icon={<TextureIcon className="w-5 h-5"/>} title="Texture" text={pairing.reasoning.texture} />
                    <ReasoningItem icon={<PopularityIcon className="w-5 h-5"/>} title="Popularity" text={pairing.reasoning.popularity} />
                    <ReasoningItem icon={<SeasonIcon className="w-5 h-5"/>} title="Season" text={pairing.reasoning.season} />
                </div>
            </div>
            {pairing.facts && pairing.facts.length > 0 && (
              <div>
                <h4 className="font-semibold text-white text-sm border-b border-brand-accent/30 pb-1 mb-2">Supporting Facts</h4>
                <ul className="list-disc list-inside space-y-1.5">
                  {pairing.facts.map((fact, index) => (
                    <li key={index} className="text-xs text-brand-text">
                      {fact.summary}
                      <a href={fact.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline ml-1.5">
                        [source]
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pairing.reasoning.fallback_note && (
                <p className="text-xs text-brand-text/60 italic">{pairing.reasoning.fallback_note}</p>
            )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-black/20 p-4 mt-auto">
        <p className="text-md font-semibold text-brand-accent italic">"{pairing.why_marketing}"</p>
      </div>

    </div>
  );
};
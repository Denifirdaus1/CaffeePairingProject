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
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-surface/90 to-brand-surface/60 shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl hover:shadow-brand-accent/20 border border-brand-border/50 backdrop-blur-sm">
        {/* Header */}
        <div className="relative p-6 flex justify-between items-start">
            <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-brand-accent to-brand-accent-light text-sm font-bold text-white shadow-lg">
                        #{rank}
                    </div>
                    <h3 className="text-xl font-bold text-white">{pairing.pastry.name}</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {pairing.badges?.map(badge => (
                        <span key={badge} className="inline-flex items-center rounded-full bg-brand-accent/20 px-3 py-1 text-xs font-medium text-brand-accent ring-1 ring-brand-accent/30">
                            {badge}
                        </span>
                    ))}
                 </div>
            </div>
            {pairing.score_breakdown && <ScoreBadge score={pairing.score} breakdown={pairing.score_breakdown} />}
        </div>

      {/* Body */}
      <div className="flex-grow px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Image & Tags */}
        <div className="flex flex-col gap-4">
             <div className="relative overflow-hidden rounded-2xl">
                <LazyImage 
                    src={pairing.pastry.image} 
                    alt={pairing.pastry.name} 
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
             </div>
             <div>
                <h4 className="font-semibold text-white text-sm mb-3">Flavor Profile</h4>
                <div className="flex flex-wrap gap-2">
                    {pairing.flavor_tags_standardized?.map(tag => (
                        <span key={tag} className="inline-flex items-center rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent ring-1 ring-brand-accent/20">
                            {tag}
                        </span>
                    ))}
                </div>
             </div>
              {pairing.allergen_info && (
                 <div>
                    <h4 className="font-semibold text-white text-sm mb-2">Allergen Info</h4>
                    <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                        {pairing.allergen_info}
                    </span>
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
      <div className="relative overflow-hidden bg-gradient-to-r from-brand-accent/10 to-brand-accent/5 p-6 mt-auto">
        <div className="relative z-10">
            <p className="text-lg font-semibold text-brand-accent italic leading-relaxed">"{pairing.why_marketing}"</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-accent/5 to-transparent" />
      </div>

    </div>
  );
};
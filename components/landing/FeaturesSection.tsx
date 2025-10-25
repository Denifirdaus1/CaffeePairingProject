import React from 'react';
import { CoffeeIcon } from '../icons/CoffeeIcon';
import { PastryIcon } from '../icons/PastryIcon';
import { FlavorIcon } from '../icons/FlavorIcon';
import { PopularityIcon } from '../icons/PopularityIcon';

const features = [
  {
    icon: <CoffeeIcon className="h-8 w-8" />,
    title: "AI-Powered Pairing Engine",
    description: "Discover perfect coffee-pastry combinations using advanced AI analysis and flavor science."
  },
  {
    icon: <PastryIcon className="h-8 w-8" />,
    title: "Smart Inventory Management",
    description: "Track your coffee and pastry inventory with intelligent categorization and real-time updates."
  },
  {
    icon: <FlavorIcon className="h-8 w-8" />,
    title: "Flavor Profile Analysis",
    description: "Analyze flavor notes, texture profiles, and seasonal preferences for optimal menu planning."
  },
  {
    icon: <PopularityIcon className="h-8 w-8" />,
    title: "Performance Analytics",
    description: "Track pairing success rates, customer preferences, and menu performance with detailed insights."
  }
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything You Need to
            <span className="block text-brand-accent">Elevate Your Café</span>
          </h2>
          <p className="text-xl text-brand-text/70 max-w-3xl mx-auto">
            Our AI-powered platform combines cutting-edge technology with deep coffee expertise 
            to help you create the perfect customer experience.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-surface/60 to-brand-surface/40 p-8 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-brand-accent/20"
            >
              <div className="mb-6 rounded-2xl bg-brand-accent/20 p-4 text-brand-accent w-fit">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              
              <p className="text-brand-text/70 leading-relaxed">
                {feature.description}
              </p>

              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-brand-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

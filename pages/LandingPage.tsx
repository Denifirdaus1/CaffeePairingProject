import React from 'react';
import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { PublicShopsSection } from '../components/landing/PublicShopsSection';
import { Footer } from '../components/landing/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-brand-primary to-brand-surface">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PublicShopsSection />
      </main>
      <Footer />
    </div>
  );
};


import React from 'react';
import { CoffeeIcon } from './icons/CoffeeIcon';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-brand-primary shadow-lg p-4 mb-8">
      <div className="container mx-auto flex items-center gap-4">
        <CoffeeIcon className="w-10 h-10 text-brand-accent" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Café Owner AI Dashboard</h1>
          <p className="text-sm text-brand-text">Smart Coffee & Pastry Pairing Assistant</p>
        </div>
      </div>
    </header>
  );
};

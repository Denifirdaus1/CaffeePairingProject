import React from 'react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "14 days",
    description: "Perfect for small cafés getting started",
    features: [
      "Up to 50 coffee items",
      "Up to 50 pastry items",
      "Basic AI pairing recommendations",
      "Standard support"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    description: "Ideal for growing café businesses",
    features: [
      "Unlimited coffee & pastry items",
      "Advanced AI pairing engine",
      "Performance analytics",
      "Priority support",
      "Export reports (PDF, CSV, JSON)"
    ],
    cta: "Get Started",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For large café chains and franchises",
    features: [
      "Everything in Professional",
      "Multi-location management",
      "Custom integrations",
      "Dedicated account manager",
      "White-label options"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export const PricingSection: React.FC = () => {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent
            <span className="block text-brand-accent">Pricing</span>
          </h2>
          <p className="text-xl text-brand-text/70 max-w-3xl mx-auto">
            Choose the plan that fits your café's needs. All plans include our core AI pairing features.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:scale-105 ${
                plan.popular
                  ? 'bg-gradient-to-br from-brand-accent/20 to-brand-accent/10 ring-2 ring-brand-accent/50 shadow-2xl shadow-brand-accent/20'
                  : 'bg-gradient-to-br from-brand-surface/60 to-brand-surface/40'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-brand-text/70 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-brand-text/60 ml-2">{plan.period}</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-brand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-brand-text/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.name === "Enterprise" ? "/contact" : "/register"}
                className={`block w-full rounded-2xl px-6 py-3 text-center font-semibold transition-all ${
                  plan.popular
                    ? 'bg-brand-accent text-white hover:bg-brand-accent/90'
                    : 'bg-brand-surface/60 text-brand-text hover:bg-brand-surface/80 hover:text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

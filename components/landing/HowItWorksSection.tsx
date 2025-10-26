import React from 'react';

const steps = [
  {
    number: "1",
    title: "Sign Up",
    description: "Create your free café account and set up your café profile with name, description, and contact information.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    )
  },
  {
    number: "2",
    title: "Add Your Items",
    description: "Upload your coffee and pastry collection with images, flavor notes, and details to build your inventory.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    )
  },
  {
    number: "3",
    title: "Generate Pairings",
    description: "Our AI analyzes your inventory and generates perfect coffee-pastry pairings using the Bunamo scoring model.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
  {
    number: "4",
    title: "Review & Publish",
    description: "Review AI-generated pairings, approve your favorites, and publish them to your public shop page with QR codes.",
    icon: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-brand-primary/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-brand-text/70 max-w-3xl mx-auto">
            Get started in minutes and transform your café's pairing strategy
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-accent via-brand-accent/50 to-brand-accent"></div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Number Badge */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-accent rounded-full blur-xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-brand-accent to-amber-400 w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl font-bold text-white">{step.number}</span>
                    </div>
                  </div>
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4 text-brand-accent">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-brand-text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-brand-text/80 mb-6">
            Ready to get started? It's completely free!
          </p>
          <a
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-accent via-brand-accent/90 to-amber-400/70 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:shadow-[0_30px_60px_-25px_rgba(162,123,92,0.85)]"
          >
            <span>Create Your Account Now</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LoaderIcon } from './icons/LoaderIcon';

const steps = [
    { title: 'Analyzing Flavor Profiles...', duration: 2000 },
    { title: 'Balancing Textures & Popularity...', duration: 2000 },
    { title: 'Grounding with Google Search...', duration: 3000 },
    { title: 'Assembling Final Report...', duration: 1500 }
];

export const ThinkingIndicator: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Fix: Use ReturnType<typeof setTimeout> for browser compatibility instead of NodeJS.Timeout.
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        let cumulativeDelay = 0;

        steps.forEach((step, index) => {
            cumulativeDelay += step.duration;
            const timeout = setTimeout(() => {
                // Move to the next step, but don't exceed the array length
                if (index < steps.length - 1) {
                    setCurrentStep(index + 1);
                }
            }, cumulativeDelay - step.duration); // Start the step at the beginning of its duration
            timeouts.push(timeout);
        });

        // Cleanup function to clear timeouts if the component unmounts
        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="bg-brand-bg/50 rounded-lg p-4 max-w-md mx-auto">
            <ul className="space-y-3">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isInProgress = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                        <li key={index} className="flex items-center gap-3 text-sm transition-colors duration-300">
                            {isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />}
                            {isInProgress && <LoaderIcon className="w-5 h-5 text-brand-accent flex-shrink-0" />}
                            {isPending && <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center"><div className="w-2 h-2 bg-brand-text/30 rounded-full"></div></div>}
                            
                            <span className={`
                                ${isCompleted ? 'text-green-400/80 line-through' : ''}
                                ${isInProgress ? 'text-white font-semibold' : ''}
                                ${isPending ? 'text-brand-text/50' : ''}
                            `}>
                                {step.title}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

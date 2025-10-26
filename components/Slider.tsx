import React from 'react';

interface SliderProps {
  name: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  description?: string;
  displayValue?: number; // Allow custom display value
}

export const Slider: React.FC<SliderProps> = ({
  name,
  value,
  min,
  max,
  onChange,
  label,
  description,
  displayValue
}) => {
  const display = displayValue !== undefined ? displayValue : value;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={name} className="block text-sm font-medium text-brand-text/90">
          {label || name}
        </label>
        <span className="text-sm font-semibold text-brand-accent">{display.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-brand-text/50">{min}</span>
        <input
          id={name}
          type="range"
          name={name}
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-brand-bg/30 border border-brand-accent/30 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-xs text-brand-text/50">{max}</span>
      </div>
      {description && (
        <p className="text-xs text-brand-text/70 mt-1">{description}</p>
      )}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #d4af66;
          cursor: pointer;
          border: 3px solid #2a1f1a;
          box-shadow: 0 2px 8px rgba(212, 175, 102, 0.4);
          transition: all 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(212, 175, 102, 0.6);
        }
        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #d4af66;
          cursor: pointer;
          border: 3px solid #2a1f1a;
          box-shadow: 0 2px 8px rgba(212, 175, 102, 0.4);
          transition: all 0.2s ease;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(212, 175, 102, 0.6);
        }
      `}</style>
    </div>
  );
};

import React from 'react';

interface SliderProps {
  name: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label?: string;
  description?: string;
}

export const Slider: React.FC<SliderProps> = ({
  name,
  value,
  min,
  max,
  onChange,
  label,
  description
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={name} className="block text-sm font-medium text-brand-text/90">
          {label || name}
        </label>
        <span className="text-sm font-semibold text-brand-accent">{value}</span>
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
          className="flex-1 h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-xs text-brand-text/50">{max}</span>
      </div>
      {description && (
        <p className="text-xs text-brand-text/70 mt-1">{description}</p>
      )}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--brand-accent);
          cursor: pointer;
          border: 2px solid var(--brand-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--brand-accent);
          cursor: pointer;
          border: 2px solid var(--brand-primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

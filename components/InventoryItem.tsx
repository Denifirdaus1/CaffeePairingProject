import React from 'react';
import type { Coffee, Pastry } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { QRCodeIcon } from './icons/QRCodeIcon';

interface InventoryItemProps {
  item: Coffee | Pastry;
  type: 'coffee' | 'pastry';
  onEdit: () => void;
  onDelete: () => void;
  onGenerateQR: () => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = React.memo(({ item, type, onEdit, onDelete, onGenerateQR }) => {
  const details = type === 'coffee'
    ? (item as Coffee).flavor_notes
    : `${(item as Pastry).flavor_tags} | ${(item as Pastry).texture_tags}`;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-surface/60 to-brand-surface/40 p-4 transition-all duration-300 hover:bg-gradient-to-r hover:from-brand-surface/80 hover:to-brand-surface/60 hover:shadow-lg hover:shadow-brand-accent/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-white truncate text-sm">{item.name}</p>
          <p className="text-xs text-brand-text-muted truncate mt-1">{details}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateQR();
            }}
            className="rounded-xl bg-purple-500/10 p-2 text-purple-400 transition-all duration-200 hover:bg-purple-500/20 hover:scale-105 hover:shadow-md"
            aria-label={`Generate QR Code for ${item.name}`}
            title="Download QR Code"
          >
            <QRCodeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-xl bg-brand-accent/10 p-2 text-brand-accent transition-all duration-200 hover:bg-brand-accent/20 hover:scale-105 hover:shadow-md"
            aria-label={`Edit ${item.name}`}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-xl bg-red-500/10 p-2 text-red-400 transition-all duration-200 hover:bg-red-500/20 hover:scale-105 hover:shadow-md"
            aria-label={`Delete ${item.name}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-accent/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
});
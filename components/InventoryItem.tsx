import React from 'react';
import type { Coffee, Pastry } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface InventoryItemProps {
  item: Coffee | Pastry;
  type: 'coffee' | 'pastry';
  onEdit: () => void;
  onDelete: () => void;
}

export const InventoryItem: React.FC<InventoryItemProps> = ({ item, type, onEdit, onDelete }) => {
  const details = type === 'coffee'
    ? (item as Coffee).flavor_notes
    : `${(item as Pastry).flavor_tags} | ${(item as Pastry).texture_tags}`;

  return (
    <div className="bg-brand-bg/60 p-3 rounded-lg flex items-center justify-between gap-4 transition-colors hover:bg-brand-bg">
      <div className="flex-grow truncate">
        <p className="font-bold text-white truncate">{item.name}</p>
        <p className="text-xs text-brand-text/80 truncate">{details}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-brand-text hover:text-white hover:bg-brand-accent/50 rounded-full transition-colors"
          aria-label={`Edit ${item.name}`}
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-white hover:bg-red-500/50 rounded-full transition-colors"
          aria-label={`Delete ${item.name}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
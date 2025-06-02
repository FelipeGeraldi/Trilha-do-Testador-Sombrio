
import React from 'react';
import type { PlayerInventory } from '../types';

interface InventoryDisplayProps {
  inventory: PlayerInventory;
}

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ inventory }) => {
  if (!inventory || inventory.items.length === 0) {
    return null; // Don't render if inventory is empty
  }

  return (
    <div className="my-3 p-3 bg-gray-800 rounded-lg shadow">
      <h3 className="text-sm font-semibold text-purple-400 mb-1 border-b border-gray-700 pb-1">Inventário:</h3>
      {inventory.items.length > 0 ? (
        <ul className="list-disc list-inside pl-1 text-gray-400 text-xs">
          {inventory.items.map((item, index) => (
            <li key={index} className="capitalize">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-xs italic">Vazio</p>
      )}
    </div>
  );
};

export default InventoryDisplay;

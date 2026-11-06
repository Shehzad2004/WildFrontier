import React, { useState } from 'react';
import { X, Shield, PlusCircle, Droplet, Wrench, Eye, Camera, Flashlight, Crosshair } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { EquipmentId, WeaponId } from '../types/game';

interface InventoryModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ engine, onClose }) => {
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>(engine.hunting.currentWeaponId);
  const [selectedTool, setSelectedTool] = useState<EquipmentId>('binoculars');

  const weaponList = Object.values(engine.hunting.weapons);
  const toolList = Object.values(engine.inventory);

  const handleUseItem = (id: EquipmentId) => {
    engine.useItem(id);
    onClose();
  };

  const handleSelectWeapon = (id: WeaponId) => {
    engine.hunting.selectWeapon(id);
    setSelectedWeapon(id);
  };

  const getToolIcon = (id: EquipmentId) => {
    switch (id) {
      case 'binoculars':
        return <Eye className="w-5 h-5 text-sky-400" />;
      case 'camera':
        return <Camera className="w-5 h-5 text-purple-400" />;
      case 'flashlight':
        return <Flashlight className="w-5 h-5 text-amber-400" />;
      case 'canteen':
        return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'medkit':
        return <PlusCircle className="w-5 h-5 text-red-400" />;
      case 'repair_kit':
        return <Wrench className="w-5 h-5 text-orange-400" />;
      default:
        return <Shield className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">FIELD LOADOUT & EQUIPMENT</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left Column: Hunting Firearms */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" /> Weapons Arsenal
            </h3>

            <div className="space-y-2.5">
              {weaponList.map((w) => (
                <div
                  key={w.id}
                  onClick={() => w.unlocked && handleSelectWeapon(w.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    !w.unlocked
                      ? 'bg-neutral-950/50 border-neutral-800 opacity-50 cursor-not-allowed'
                      : selectedWeapon === w.id
                      ? 'bg-amber-500/10 border-amber-500/80 shadow-md'
                      : 'bg-neutral-800/60 border-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-neutral-200">{w.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-700 text-neutral-300">
                      {w.unlocked ? w.category : 'LOCKED'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2">{w.description}</p>
                  <div className="flex items-center justify-between text-xs font-mono text-neutral-300 border-t border-neutral-700/50 pt-2">
                    <span>MAG: {w.currentAmmo}/{w.reserveAmmo}</span>
                    <span>DMG: {w.damage}</span>
                    <span>ZOOM: {w.zoomLevel}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Survival Supplies & Tools */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Expedition Supplies & Tools
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {toolList.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-800/70 border border-neutral-700 p-3 rounded-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      {getToolIcon(item.id)}
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {item.count}/{item.maxCount}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-neutral-200 mb-1">{item.name}</div>
                    <p className="text-[11px] text-neutral-400 mb-3">{item.description}</p>
                  </div>

                  <button
                    onClick={() => handleUseItem(item.id)}
                    className="w-full py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-medium text-neutral-200 border border-neutral-600 transition-colors"
                  >
                    {item.id === 'canteen' || item.id === 'medkit' || item.id === 'repair_kit'
                      ? 'Use / Consume'
                      : 'Equip Tool'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>PRESS [TAB] OR ESC TO RETURN TO GAME</span>
        </div>
      </div>
    </div>
  );
};

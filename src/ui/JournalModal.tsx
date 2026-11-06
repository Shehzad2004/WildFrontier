import React, { useState } from 'react';
import { X, BookOpen, Skull, Camera, Target, Compass, AlertTriangle, CheckCircle } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { AnimalType } from '../types/game';

interface JournalModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({ engine, onClose }) => {
  const [activeSpecies, setActiveSpecies] = useState<AnimalType>('deer');
  const registry = engine.wildlifeRegistry;
  const profiles = registry.profiles;
  const current = profiles[activeSpecies];

  const speciesKeys: AnimalType[] = ['deer', 'boar', 'tiger', 'crocodile', 'bird'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-neutral-100">WILDLIFE FIELD GUIDE & TRACKING JOURNAL</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Species Navigation */}
          <div className="w-full md:w-64 border-r border-neutral-800 bg-neutral-950/40 p-4 space-y-2 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-2 mb-2">
              Fauna Catalog
            </div>
            {speciesKeys.map((type) => {
              const p = profiles[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveSpecies(type)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    activeSpecies === type
                      ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-300 font-bold'
                      : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{p.commonName}</div>
                    <div className="text-[10px] text-neutral-400 italic">{p.scientificName}</div>
                  </div>
                  {p.discovered ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500">?</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Species Profile View */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-neutral-900/40">
            {/* Top Title & Danger Rating */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-100">{current.commonName}</h3>
                <p className="text-xs text-neutral-400 italic">{current.scientificName}</p>
              </div>

              <div className="flex items-center gap-1.5 bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-neutral-300">Danger Rating:</span>
                <span className="font-mono text-amber-400">
                  {'★'.repeat(current.dangerRating)}
                  {'☆'.repeat(5 - current.dangerRating)}
                </span>
              </div>
            </div>

            {/* Field Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800/50 border border-neutral-700/60 p-3.5 rounded-lg flex items-center gap-3">
                <Target className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Harvests Recorded</div>
                  <div className="text-lg font-bold font-mono text-neutral-100">{current.harvestsCount}</div>
                </div>
              </div>

              <div className="bg-neutral-800/50 border border-neutral-700/60 p-3.5 rounded-lg flex items-center gap-3">
                <Camera className="w-6 h-6 text-purple-400" />
                <div>
                  <div className="text-[10px] text-neutral-400 uppercase font-mono">Photos Logged</div>
                  <div className="text-lg font-bold font-mono text-neutral-100">{current.photosCount}</div>
                </div>
              </div>
            </div>

            {/* Habitat Info */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Habitat & Territories
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
                {current.habitat}
              </p>
            </div>

            {/* Behavior */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Instincts & Behavior
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
                {current.behavior}
              </p>
            </div>

            {/* Tracking Identification */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Spoor & Track Identification
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-800/30 p-3 rounded-lg border border-neutral-800">
                {current.tracksDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>PRESS [J] OR ESC TO CLOSE JOURNAL</span>
        </div>
      </div>
    </div>
  );
};

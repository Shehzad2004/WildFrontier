import React, { useState } from 'react';
import { X, Settings, Volume2, Monitor, Save, RotateCcw, Check } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';
import { soundEngine } from '../audio/SoundEngine';
import { SaveManager } from '../persistence/SaveManager';

interface SettingsModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ engine, onClose }) => {
  const [masterVol, setMasterVol] = useState(0.8);
  const [ambientVol, setAmbientVol] = useState(0.6);
  const [effectsVol, setEffectsVol] = useState(0.8);
  const [wildlifeVol, setWildlifeVol] = useState(0.7);
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleApplyAudio = (m: number, a: number, e: number, w: number) => {
    soundEngine.setVolumes(m, a, e, w, false);
  };

  const handleSaveGame = () => {
    SaveManager.save({
      level: engine.missions.level,
      xp: engine.missions.totalXP,
      currentMissionId: engine.missions.currentMission.id,
      playerVitals: {
        health: engine.vitals.health,
        hydration: engine.vitals.hydration,
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResetProgress = () => {
    if (confirm('Reset all hunting mission progress and XP?')) {
      SaveManager.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">GAME & AUDIO SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Audio Controls */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4" /> Sound Levels
            </h3>

            <div className="space-y-3 bg-neutral-800/40 p-4 rounded-lg border border-neutral-700/60 text-xs">
              <div>
                <div className="flex justify-between mb-1 text-neutral-300">
                  <span>Master Volume</span>
                  <span className="font-mono">{Math.round(masterVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVol}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setMasterVol(val);
                    handleApplyAudio(val, ambientVol, effectsVol, wildlifeVol);
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-neutral-300">
                  <span>Environmental Ambience</span>
                  <span className="font-mono">{Math.round(ambientVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVol}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmbientVol(val);
                    handleApplyAudio(masterVol, val, effectsVol, wildlifeVol);
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-neutral-300">
                  <span>Weapons & Gameplay SFX</span>
                  <span className="font-mono">{Math.round(effectsVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={effectsVol}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEffectsVol(val);
                    handleApplyAudio(masterVol, ambientVol, val, wildlifeVol);
                  }}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-neutral-300">
                  <span>Wildlife Vocalizations</span>
                  <span className="font-mono">{Math.round(wildlifeVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={wildlifeVol}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setWildlifeVol(val);
                    handleApplyAudio(masterVol, ambientVol, effectsVol, val);
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Monitor className="w-4 h-4" /> Graphics Performance
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setGraphicsQuality(q)}
                  className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors ${
                    graphicsQuality === q
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Save / Reset */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGame}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveSuccess ? 'Progress Saved!' : 'Save Game Progress'}
              </button>

              <button
                onClick={handleResetProgress}
                className="py-2.5 px-4 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};

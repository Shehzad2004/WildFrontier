import React from 'react';
import { X, Award, CheckCircle, Lock, Target, Gift } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';

interface MissionsModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ engine, onClose }) => {
  const missions = engine.missions.missions;
  const currentId = engine.missions.currentMission.id;

  const handleSelect = (id: number) => {
    engine.missions.selectMission(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">EXPEDITION MISSIONS & PROGRESSION</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {missions.map((m) => {
            const isCurrent = m.id === currentId;
            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border transition-all ${
                  !m.unlocked
                    ? 'bg-neutral-950/40 border-neutral-800/80 opacity-60'
                    : isCurrent
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-lg'
                    : 'bg-neutral-800/50 border-neutral-700/70 hover:border-neutral-500'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {m.completed ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : !m.unlocked ? (
                      <Lock className="w-5 h-5 text-neutral-500" />
                    ) : (
                      <Target className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-neutral-100">{m.title}</h3>
                      <p className="text-xs text-neutral-400">{m.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded border border-amber-500/40">
                      +{m.rewardXP} XP
                    </span>
                    {m.unlocked && !isCurrent && (
                      <button
                        onClick={() => handleSelect(m.id)}
                        className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-semibold text-neutral-200 border border-neutral-600"
                      >
                        Activate
                      </button>
                    )}
                    {isCurrent && (
                      <span className="px-3 py-1 bg-amber-500 text-neutral-950 font-bold rounded text-xs uppercase tracking-wide">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-neutral-300 mb-3 bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800">
                  {m.briefing}
                </p>

                {/* Objectives Checklist */}
                <div className="space-y-1.5 mb-3">
                  {m.objectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between text-xs bg-neutral-900/30 px-3 py-1.5 rounded border border-neutral-800/60"
                    >
                      <span className={obj.completed ? 'text-emerald-400 line-through' : 'text-neutral-200'}>
                        {obj.description}
                      </span>
                      <span className={`font-mono ${obj.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {obj.current} / {obj.target}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Reward Unlock */}
                {m.rewardUnlock && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Completion Reward: {m.rewardUnlock}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>PRESS [L] OR ESC TO CLOSE MISSIONS</span>
        </div>
      </div>
    </div>
  );
};

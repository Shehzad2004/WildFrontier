import React, { useState } from 'react';
import { Compass, Play, BookOpen, Award, Shield, ChevronRight, Volume2, HelpCircle } from 'lucide-react';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenControls: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onOpenControls }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-t from-neutral-950 via-neutral-900/90 to-neutral-950/70 flex flex-col justify-between p-8 sm:p-12 text-neutral-100 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Compass className="w-6 h-6 text-amber-500 animate-spin" style={{ animationDuration: '30s' }} />
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            SANCTUARY RESERVE • PROTOCOL V2.4
          </span>
        </div>
        <div className="text-xs font-mono text-neutral-400">
          3D ENGINE: THREE.JS PBR • PROCEDURAL AUDIO
        </div>
      </div>

      {/* Hero Title & Subtitle */}
      <div className="max-w-2xl space-y-4 my-auto">
        <div className="inline-block bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded text-amber-400 font-mono text-xs uppercase tracking-wider">
          Realistic 3D Jungle Hunting &amp; Survival
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
          WILD <span className="text-amber-500">FRONTIER</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
          Explore a dense 1.2km² tropical wilderness. Track deer herds through morning mist,
          navigate rough riverbeds in a 4x4 expedition rig, survive territorial predators in ancient ruins,
          and document rare species in your wildlife field guide.
        </p>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={onStartGame}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-sm uppercase tracking-wider flex items-center gap-3 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all hover:scale-105"
          >
            <Play className="w-5 h-5 fill-neutral-950" />
            ENTER EXPEDITION
          </button>

          <button
            onClick={onOpenControls}
            className="px-6 py-4 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-600/60 rounded-xl text-sm font-bold text-neutral-200 flex items-center gap-2 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
            CONTROLS GUIDE
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-neutral-800/80 pt-6 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-amber-400" /> 5 EXPEDITION LEVELS
          </div>
          <p className="text-[11px] text-neutral-400">Scout, track, survive, and master the jungle.</p>
        </div>

        <div className="space-y-1">
          <div className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> OFF-ROAD VEHICLES
          </div>
          <p className="text-[11px] text-neutral-400">Drivable 4x4 expedition truck and motorbike.</p>
        </div>

        <div className="space-y-1">
          <div className="font-bold text-neutral-200 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> HUNTING HOUND REX
          </div>
          <p className="text-[11px] text-neutral-400">Loyal pointer dog tracks spoor &amp; barks at tigers.</p>
        </div>

        <div className="space-y-1">
          <div className="font-bold text-neutral-200 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-purple-400" /> PROCEDURAL AUDIO
          </div>
          <p className="text-[11px] text-neutral-400">Canopy winds, birds, footsteps, and gunfire.</p>
        </div>
      </div>
    </div>
  );
};

export const ControlsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const controls = [
    { key: 'W / A / S / D', action: 'Move Hunter or Steer Vehicle' },
    { key: 'Mouse', action: 'Look Around (Pointer-Lock Aiming)' },
    { key: 'F / Left Click', action: 'FIRE Weapon or Snap Wildlife Camera Photo' },
    { key: 'B / Right Click', action: 'Toggle Optical SCOPE / Binoculars Magnification' },
    { key: 'Shift', action: 'Sprint (Hold while aiming to steady breath)' },
    { key: 'Ctrl / C', action: 'Crouch (Quiet stalk, reduce animal detection)' },
    { key: 'E', action: 'Interact / Pet Dog Rex / Drive Vehicle / Inspect Clues' },
    { key: 'T', action: 'Toggle Tactical Torch Flashlight' },
    { key: 'R', action: 'Reload Firearm or Reset Stuck Vehicle' },
    { key: 'V', action: 'Toggle 1st Person / 3rd Person Camera View' },
    { key: '1, 2, 3, 4', action: 'Select Weapon (Rifle, Bow, Dart Gun, Revolver)' },
    { key: '5, 6', action: 'Equip Binoculars or Field Camera' },
    { key: 'M', action: 'Open Full Interactive Topographic Map' },
    { key: 'Tab', action: 'Open Tactical Backpack & Loadout' },
    { key: 'J', action: 'Open Wildlife Field Guide & Tracking Journal' },
    { key: 'L', action: 'Open Expedition Missions & Objectives' },
    { key: 'Esc', action: 'Release Cursor / Pause Settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">KEYBOARD & MOUSE CONTROLS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            ×
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto text-xs">
          {controls.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-neutral-800/50 p-2.5 rounded-lg border border-neutral-700/60"
            >
              <span className="font-mono font-bold text-amber-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                {c.key}
              </span>
              <span className="text-neutral-300 text-right ml-2">{c.action}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

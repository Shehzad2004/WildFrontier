import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Crosshair,
  Droplet,
  Eye,
  Heart,
  Map as MapIcon,
  Shield,
  Volume2,
  Zap,
  Camera,
  BookOpen,
  Award,
  Settings,
  Flame,
  Sun,
  Moon,
  CloudRain,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { GameEngine, GameEngineState } from '../game/GameEngine';
import { TimeOfDay, WeatherType } from '../types/game';

interface GameHUDProps {
  engine: GameEngine | null;
  state: GameEngineState | null;
  onOpenMap: () => void;
  onOpenInventory: () => void;
  onOpenJournal: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  engine,
  state,
  onOpenMap,
  onOpenInventory,
  onOpenJournal,
  onOpenMissions,
  onOpenSettings,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);

  // Draw Minimap
  useEffect(() => {
    if (!minimapCanvasRef.current || !engine || !state) return;
    const canvas = minimapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [px, , pz] = state.playerPos;
    const heading = state.playerHeading;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark jungle radar background
    ctx.fillStyle = '#111f18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Range: 180 meters radius
    const scale = canvas.width / 360;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Grid circles
    ctx.strokeStyle = 'rgba(74, 125, 80, 0.25)';
    ctx.lineWidth = 1;
    [40, 80, 120].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // POIs on minimap
    if (engine.terrain?.POIs) {
      Object.entries(engine.terrain.POIs).forEach(([k, poi]) => {
        const dx = poi.pos.x - px;
        const dz = poi.pos.z - pz;
        const screenX = cx + dx * scale;
        const screenY = cy + dz * scale;

        if (screenX >= 4 && screenX <= canvas.width - 4 && screenY >= 4 && screenY <= canvas.height - 4) {
          ctx.fillStyle = k === 'camp' ? '#f59e0b' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Vehicles
    if (engine.vehicles?.vehicles) {
      engine.vehicles.vehicles.forEach((v) => {
        const [vx, , vz] = v.state.position;
        const dx = vx - px;
        const dz = vz - pz;
        const screenX = cx + dx * scale;
        const screenY = cy + dz * scale;
        if (screenX >= 4 && screenX <= canvas.width - 4 && screenY >= 4 && screenY <= canvas.height - 4) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(screenX - 3, screenY - 3, 6, 6);
        }
      });
    }

    // Hunting Dog Companion
    if (engine.dogCompanion) {
      const dxDog = engine.dogCompanion.position.x - px;
      const dzDog = engine.dogCompanion.position.z - pz;
      const screenX = cx + dxDog * scale;
      const screenY = cy + dzDog * scale;
      if (screenX >= 4 && screenX <= canvas.width - 4 && screenY >= 4 && screenY <= canvas.height - 4) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Animals within radar range
    if (engine.wildlife?.animals) {
      engine.wildlife.animals.forEach((a) => {
        if (a.data.state === 'dead') return;
        const [ax, , az] = a.data.position;
        const dx = ax - px;
        const dz = az - pz;
        const screenX = cx + dx * scale;
        const screenY = cy + dz * scale;
        if (Math.hypot(dx, dz) < 140) {
          ctx.fillStyle = a.data.isHostile ? '#ef4444' : '#fbbf24';
          ctx.beginPath();
          ctx.arc(screenX, screenY, a.data.isHostile ? 3.5 : 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Player arrow indicator at center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-heading);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [engine, state]);

  if (!state || !engine) return null;

  const currentMission = engine.missions.currentMission;
  const currentWeapon = engine.hunting.currentWeapon;

  // Bearing calculation for Compass Ribbon
  const degrees = Math.round(((state.playerHeading * 180) / Math.PI + 360) % 360);
  const getCardinal = (deg: number) => {
    const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(deg / 45) % 8;
    return cardinals[idx];
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-sans text-neutral-100">
      {/* 1. TOP-LEFT: Mission Status Card */}
      <div className="absolute top-4 left-4 pointer-events-auto bg-neutral-900/80 border border-neutral-700/60 p-3.5 rounded-lg backdrop-blur-none max-w-sm shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-neutral-700/50 pb-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>{currentMission.title}</span>
          </div>
          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
            Lvl {engine.missions.level} • {engine.missions.totalXP} XP
          </span>
        </div>

        <p className="text-xs text-neutral-300 mb-2 font-medium">{currentMission.subtitle}</p>

        <div className="space-y-1.5">
          {currentMission.objectives.map((obj) => (
            <div key={obj.id} className="flex items-center justify-between text-xs gap-3">
              <span className={obj.completed ? 'text-emerald-400 line-through' : 'text-neutral-200'}>
                {obj.description}
              </span>
              <span className={`font-mono text-[11px] ${obj.completed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {obj.current} / {obj.target}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. TOP-CENTER: Compass Ribbon with Rangefinder Readout */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="flex items-center gap-3 bg-neutral-900/85 border border-neutral-700/70 px-5 py-1.5 rounded-full text-xs font-mono shadow-lg">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400 font-bold">{getCardinal(degrees)}</span>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-200">{degrees}°</span>
          {state.targetRange !== null && (
            <>
              <span className="text-neutral-400">|</span>
              <span className="text-emerald-400 font-bold">RNG: {state.targetRange}m</span>
            </>
          )}
        </div>
      </div>

      {/* 3. TOP-RIGHT: Minimap & Environment Clock */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="pointer-events-auto bg-neutral-900/85 border border-neutral-700/70 p-2 rounded-xl shadow-xl">
          <div className="flex items-center justify-between text-[11px] px-1 mb-1 text-neutral-400">
            <span className="font-semibold text-neutral-200 flex items-center gap-1">
              <MapIcon className="w-3 h-3 text-amber-400" /> MINIMAP
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">180m</span>
          </div>
          <canvas
            ref={minimapCanvasRef}
            width={140}
            height={140}
            className="rounded-lg border border-neutral-800"
          />
        </div>

        {/* Weather & Time quick switches */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-700/60 p-1 rounded-lg text-xs">
          <button
            onClick={() => engine.environment.setTimeOfDay('noon')}
            title="Daylight"
            className="p-1 hover:bg-neutral-700 rounded text-amber-400"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => engine.environment.setTimeOfDay('sunset')}
            title="Golden Hour Sunset"
            className="p-1 hover:bg-neutral-700 rounded text-orange-400"
          >
            <Flame className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => engine.environment.setTimeOfDay('night')}
            title="Night"
            className="p-1 hover:bg-neutral-700 rounded text-sky-400"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              engine.environment.setWeather(engine.environment.currentWeather === 'rain' ? 'clear' : 'rain')
            }
            title="Toggle Rain"
            className="p-1 hover:bg-neutral-700 rounded text-cyan-400"
          >
            <CloudRain className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* HUNTING DOG COMPANION STATUS BADGE (User Request) */}
        <div className="pointer-events-auto bg-neutral-900/90 border border-amber-500/60 p-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-[200px]">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-sm">
            🐕
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-300">
              <span>Rex</span>
              <span className="text-[10px] text-neutral-400 font-normal">• Hound</span>
            </div>
            <div className="text-[10px] font-mono font-semibold text-emerald-400 uppercase tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{state.dogState.replace('_', ' ')}</span>
            </div>
            {state.dogTarget && (
              <div className="text-[9px] font-mono text-amber-400 font-bold truncate max-w-[120px]">
                Target: {state.dogTarget}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. CENTER: CROSSHAIR & SCOPE OVERLAYS */}
      {state.mode === 'aiming' ? (
        // High-Precision Hunting Optic Scope
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[520px] h-[520px] rounded-full border-4 border-neutral-900/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.88)] flex items-center justify-center overflow-hidden">
            {/* Crosshair Lines */}
            <div className="absolute w-full h-[1.5px] bg-red-600/90" />
            <div className="absolute h-full w-[1.5px] bg-red-600/90" />
            {/* Center dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            {/* Mil-dot stadia markers */}
            {[-120, -60, 60, 120].map((offset) => (
              <React.Fragment key={offset}>
                <div
                  className="absolute w-3 h-[1px] bg-red-400/80"
                  style={{ transform: `translateY(${offset}px)` }}
                />
                <div
                  className="absolute h-3 w-[1px] bg-red-400/80"
                  style={{ transform: `translateX(${offset}px)` }}
                />
              </React.Fragment>
            ))}
            {/* Rangefinder readout */}
            <div className="absolute bottom-16 bg-neutral-900/80 border border-red-500/40 px-3 py-1 rounded text-red-400 text-xs font-mono font-bold">
              {state.targetRange ? `${state.targetRange} M` : 'SCANNING...'}
            </div>
          </div>
        </div>
      ) : state.mode === 'binoculars' ? (
        // Binoculars Double Optical Ring
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex gap-4">
            <div className="w-[340px] h-[340px] rounded-full border-4 border-neutral-950/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex items-center justify-center">
              <Crosshair className="w-8 h-8 text-emerald-500/60" />
            </div>
            <div className="w-[340px] h-[340px] rounded-full border-4 border-neutral-950/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)] flex items-center justify-center" />
          </div>
          <div className="absolute top-24 bg-neutral-900/80 px-4 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
            LEUPOLD 10x42 • RANGE: {state.targetRange || '--'}m • {getCardinal(degrees)}
          </div>
        </div>
      ) : state.equippedTool === 'camera' ? (
        // Wildlife Camera Viewfinder
        <div className="absolute inset-16 border-2 border-white/40 pointer-events-none rounded flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-xs font-mono text-white/80">
            <span>[REC] 4K 60FPS</span>
            <span>SHUTTER: 1/1000s</span>
            <span>ISO: 400</span>
          </div>
          <div className="self-center w-24 h-24 border border-dashed border-white/60 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <div className="text-center font-mono text-xs text-white/90 bg-neutral-900/60 self-center px-4 py-1 rounded">
            LEFT CLICK TO PHOTOGRAPH WILDLIFE FOR FIELD GUIDE
          </div>
        </div>
      ) : (
        // Standard Walking / Driving Crosshair
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-[0_0_4px_black]" />
        </div>
      )}

      {/* 5. INTERACTION PROMPT POPUP */}
      {state.interactionPrompt && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-amber-500/70 px-5 py-2.5 rounded-lg text-amber-300 font-bold text-xs uppercase tracking-wide shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          {state.interactionPrompt}
        </div>
      )}

      {/* 6. BOTTOM-LEFT: Vital Survival Indicators */}
      <div className="absolute bottom-4 left-4 bg-neutral-900/85 border border-neutral-700/60 p-3.5 rounded-lg space-y-2.5 w-56 shadow-xl">
        {/* Health */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span className="flex items-center gap-1.5 text-red-400">
              <Heart className="w-3.5 h-3.5 fill-red-500/30" /> HEALTH
            </span>
            <span className="font-mono text-xs">{Math.round(state.vitals.health)}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-700">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${state.vitals.health}%` }}
            />
          </div>
        </div>

        {/* Stamina */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Zap className="w-3.5 h-3.5 fill-amber-500/30" /> STAMINA
            </span>
            <span className="font-mono text-xs">{Math.round(state.vitals.stamina)}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-700">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${state.vitals.stamina}%` }}
            />
          </div>
        </div>

        {/* Hydration */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Droplet className="w-3.5 h-3.5 fill-sky-500/30" /> HYDRATION
            </span>
            <span className="font-mono text-xs">{Math.round(state.vitals.hydration)}%</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden border border-neutral-700">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${state.vitals.hydration}%` }}
            />
          </div>
        </div>

        {/* Vehicle speed if driving */}
        {state.activeVehicleSpeed !== null && (
          <div className="pt-1 border-t border-neutral-700/60 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-bold">SPEED: {state.activeVehicleSpeed} km/h</span>
            <span className="text-amber-400">FUEL: {state.activeVehicleFuel}%</span>
          </div>
        )}
      </div>

      {/* 7. BOTTOM-RIGHT: Weapons & Ammo Card */}
      <div className="absolute bottom-4 right-4 bg-neutral-900/85 border border-neutral-700/60 p-3.5 rounded-lg w-64 shadow-xl">
        <div className="flex items-center justify-between mb-1.5 border-b border-neutral-700/50 pb-1.5">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            {currentWeapon.name}
          </div>
          <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono">
            {currentWeapon.category}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-1.5">
          <div className="font-mono text-2xl font-black text-amber-400 tracking-tight">
            {currentWeapon.currentAmmo}
            <span className="text-xs font-normal text-neutral-400 ml-1">/ {currentWeapon.reserveAmmo}</span>
          </div>
          {engine.hunting.isReloading && (
            <span className="text-xs text-orange-400 font-mono animate-pulse">RELOADING...</span>
          )}
        </div>

        {/* Primary Fire & Scope Prompts (User Request) */}
        <div className="flex items-center justify-between text-[10px] font-mono mb-2 bg-neutral-950/60 px-2 py-1 rounded border border-neutral-800 text-neutral-300">
          <span className="text-amber-400 font-bold">FIRE: [F] / Click</span>
          <span className="text-sky-400 font-bold">SCOPE: [B] / R-Click</span>
        </div>

        {/* Quick weapon switcher [1-4] & tools [5-6] */}
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-neutral-800 text-[11px] font-mono">
          {(['rifle', 'bow', 'dart_gun', 'revolver'] as const).map((wid, idx) => (
            <button
              key={wid}
              onClick={() => engine.hunting.selectWeapon(wid)}
              className={`px-1.5 py-0.5 rounded border pointer-events-auto ${
                state.currentWeaponId === wid
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              [{idx + 1}]
            </button>
          ))}
          <button
            onClick={() => engine.setEquippedTool('binoculars')}
            className={`px-1.5 py-0.5 rounded border pointer-events-auto ${
              state.equippedTool === 'binoculars'
                ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            [5] Bino
          </button>
          <button
            onClick={() => engine.setEquippedTool('camera')}
            className={`px-1.5 py-0.5 rounded border pointer-events-auto ${
              state.equippedTool === 'camera'
                ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            [6] Cam
          </button>
        </div>
      </div>

      {/* 8. BOTTOM-CENTER: Unified Collapsible Control Dock (Per ThreeJS Skill Directive) */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto transition-transform duration-300 ${
          hudCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setHudCollapsed(!hudCollapsed)}
          className="bg-neutral-900/90 border border-neutral-700/80 px-3 py-1 rounded-t-lg text-[11px] font-medium text-neutral-300 hover:text-white flex items-center gap-1 shadow-md mb-[-1px] z-10"
        >
          {hudCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {hudCollapsed ? 'Show Controls [H]' : 'Hide Controls [H]'}
        </button>

        {/* Dock Bar */}
        <div className="bg-neutral-900/90 border border-neutral-700/70 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-2xl backdrop-blur-none max-w-[94vw]">
          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <MapIcon className="w-3.5 h-3.5 text-amber-400" /> Map [M]
          </button>

          <button
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" /> Gear [Tab]
          </button>

          <button
            onClick={onOpenJournal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Field Guide [J]
          </button>

          <button
            onClick={onOpenMissions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-xs font-semibold text-neutral-200 transition-colors"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" /> Missions [L]
          </button>

          <div className="h-4 w-[1px] bg-neutral-700" />

          {/* Quick Action buttons for Fire [F] and Scope [B] */}
          <button
            onClick={() => engine.triggerFire()}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-xs font-bold text-red-200"
            title="Fire Weapon [F]"
          >
            Fire [F]
          </button>

          <button
            onClick={() => engine.toggleScope()}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
              state.mode === 'aiming'
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600/60 text-neutral-200'
            }`}
            title="Toggle Scope [B]"
          >
            Scope [B]
          </button>

          <button
            onClick={() => engine.toggleCameraView()}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-xs font-semibold text-neutral-300"
            title="Toggle 1st / 3rd Person [V]"
          >
            View: {state.cameraView === 'first_person' ? '1st' : '3rd'} [V]
          </button>

          <button
            onClick={() => engine.toggleFlashlight()}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
              state.vitals.flashlightOn
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600/60 text-neutral-300'
            }`}
            title="Toggle Torch [T]"
          >
            Torch [T]
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600/60 text-neutral-300"
            title="Settings & Audio"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

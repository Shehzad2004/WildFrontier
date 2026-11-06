import React, { useRef, useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, MapPin, Navigation, Compass } from 'lucide-react';
import { GameEngine } from '../game/GameEngine';

interface MapModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ engine, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [customWaypoint, setCustomWaypoint] = useState<{ x: number; z: number } | null>(null);

  const worldSize = engine.terrain.size; // 1200m

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    const mapPx = 540;
    const half = mapPx / 2;

    // 1. Terrain Topographic Base
    ctx.fillStyle = '#1c2e22';
    ctx.fillRect(-half, -half, mapPx, mapPx);

    // Grid contour lines
    ctx.strokeStyle = '#27422f';
    ctx.lineWidth = 1;
    for (let c = -half; c <= half; c += 45) {
      ctx.beginPath();
      ctx.moveTo(c, -half);
      ctx.lineTo(c, half);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-half, c);
      ctx.lineTo(half, c);
      ctx.stroke();
    }

    // 2. Winding River
    ctx.strokeStyle = '#246b7a';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let zStep = -half; zStep <= half; zStep += 10) {
      const zWorld = (zStep / half) * (worldSize / 2);
      const xWorld = Math.sin(zWorld * 0.007) * 160 - 30;
      const xStep = (xWorld / (worldSize / 2)) * half;
      if (zStep === -half) ctx.moveTo(xStep, zStep);
      else ctx.lineTo(xStep, zStep);
    }
    ctx.stroke();

    // 3. POIs
    Object.entries(engine.terrain.POIs).forEach(([key, poi]) => {
      const px = (poi.pos.x / (worldSize / 2)) * half;
      const pz = (poi.pos.z / (worldSize / 2)) * half;

      ctx.fillStyle = key === 'camp' ? '#f59e0b' : key === 'ruins' ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, pz, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText(poi.name, px + 8, pz + 4);
    });

    // 4. Vehicles
    engine.vehicles.vehicles.forEach((v) => {
      const [vx, , vz] = v.state.position;
      const px = (vx / (worldSize / 2)) * half;
      const pz = (vz / (worldSize / 2)) * half;

      ctx.fillStyle = '#10b981';
      ctx.fillRect(px - 5, pz - 5, 10, 10);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 5, pz - 5, 10, 10);
    });

    // 5. Custom Waypoint
    if (customWaypoint) {
      const px = (customWaypoint.x / (worldSize / 2)) * half;
      const pz = (customWaypoint.z / (worldSize / 2)) * half;
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(px, pz, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('WAYPOINT', px + 10, pz + 4);
    }

    // 6. Player Position & Orientation
    const [px, , pz] = [engine.playerPos.x, engine.playerPos.y, engine.playerPos.z];
    const playerScreenX = (px / (worldSize / 2)) * half;
    const playerScreenZ = (pz / (worldSize / 2)) * half;

    ctx.save();
    ctx.translate(playerScreenX, playerScreenZ);
    ctx.rotate(-engine.playerYaw);
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 5);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }, [engine, zoom, pan, customWaypoint]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - (canvas.width / 2 + pan.x);
    const mouseY = e.clientY - rect.top - (canvas.height / 2 + pan.y);

    const mapPx = 540;
    const half = mapPx / 2;
    const worldX = (mouseX / zoom / half) * (worldSize / 2);
    const worldZ = (mouseY / zoom / half) * (worldSize / 2);

    if (Math.abs(worldX) < worldSize / 2 && Math.abs(worldZ) < worldSize / 2) {
      setCustomWaypoint({ x: Math.round(worldX), z: Math.round(worldZ) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-neutral-100">RESERVE TOPOGRAPHIC MAP (1.2km × 1.2km)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Body & Controls */}
        <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-hidden cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={640}
            height={560}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleCanvasClick}
            className="max-w-full max-h-full"
          />

          {/* Controls Bar */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/80 p-1.5 rounded-lg">
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-200"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 hover:bg-neutral-800 rounded text-neutral-200"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Map Legend */}
          <div className="absolute top-4 left-4 bg-neutral-900/90 border border-neutral-800 p-3 rounded-lg text-xs space-y-1.5 max-w-xs pointer-events-none">
            <div className="font-bold text-neutral-300 text-[11px] uppercase mb-1">Legend</div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-3 h-3 rounded-full bg-amber-400" /> Base Camp & Cabin
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-3 h-3 rounded-full bg-sky-400" /> Watchtower & Riverbed
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-3 h-3 rounded-full bg-red-500" /> Stone Ruins (Tiger Territory)
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-3 h-3 bg-emerald-500" /> 4x4 Truck & Motorbike
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="w-3 h-3 rounded-full bg-pink-500" /> Custom Navigation Pin
            </div>
            <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
              Click anywhere on map to drop custom waypoint
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>
            PLAYER GPS: [{Math.round(engine.playerPos.x)}, {Math.round(engine.playerPos.z)}]
          </span>
          <span>PRESS [M] OR ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};

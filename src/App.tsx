import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameEngineState } from './game/GameEngine';
import { GameHUD } from './ui/GameHUD';
import { MapModal } from './ui/MapModal';
import { InventoryModal } from './ui/InventoryModal';
import { JournalModal } from './ui/JournalModal';
import { MissionsModal } from './ui/MissionsModal';
import { SettingsModal } from './ui/SettingsModal';
import { MainMenu, ControlsModal } from './ui/MainMenu';
import { soundEngine } from './audio/SoundEngine';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameEngineState | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'none' | 'map' | 'inventory' | 'journal' | 'missions' | 'settings' | 'controls'
  >('none');
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current);
    engineRef.current = engine;

    engine.onStateUpdate = (state) => {
      setGameState(state);
    };

    engine.onNotification = (msg) => {
      setNotification(msg);
      setTimeout(() => {
        setNotification((curr) => (curr === msg ? null : curr));
      }, 4000);
    };

    // Hotkey listener for modal toggles
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        setActiveModal((curr) => (curr === 'map' ? 'none' : 'map'));
      } else if (e.code === 'Tab') {
        e.preventDefault();
        setActiveModal((curr) => (curr === 'inventory' ? 'none' : 'inventory'));
      } else if (e.code === 'KeyJ') {
        setActiveModal((curr) => (curr === 'journal' ? 'none' : 'journal'));
      } else if (e.code === 'KeyL') {
        setActiveModal((curr) => (curr === 'missions' ? 'none' : 'missions'));
      } else if (e.code === 'Escape') {
        setActiveModal((curr) => (curr !== 'none' ? 'none' : 'settings'));
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      engine.dispose();
    };
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
    soundEngine.playInteract();
    setTimeout(() => {
      engineRef.current?.requestPointerLock();
    }, 150);
  };

  const handleCloseModal = () => {
    setActiveModal('none');
    setTimeout(() => {
      engineRef.current?.requestPointerLock();
    }, 150);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 1. THREE.JS WEBGL CANVAS CONTAINER (Isolated from React HUD) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* 2. GAME HUD (Active during gameplay) */}
      {gameStarted && (
        <GameHUD
          engine={engineRef.current}
          state={gameState}
          onOpenMap={() => setActiveModal('map')}
          onOpenInventory={() => setActiveModal('inventory')}
          onOpenJournal={() => setActiveModal('journal')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* 3. POPUP NOTIFICATION BANNER */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border-2 border-amber-500 px-6 py-2.5 rounded-xl shadow-2xl text-amber-300 font-bold text-xs uppercase tracking-wider animate-bounce pointer-events-none">
          {notification}
        </div>
      )}

      {/* 4. MAIN MENU */}
      {!gameStarted && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenControls={() => setActiveModal('controls')}
        />
      )}

      {/* 5. MODAL SCREENS */}
      {activeModal === 'map' && engineRef.current && (
        <MapModal engine={engineRef.current} onClose={handleCloseModal} />
      )}

      {activeModal === 'inventory' && engineRef.current && (
        <InventoryModal engine={engineRef.current} onClose={handleCloseModal} />
      )}

      {activeModal === 'journal' && engineRef.current && (
        <JournalModal engine={engineRef.current} onClose={handleCloseModal} />
      )}

      {activeModal === 'missions' && engineRef.current && (
        <MissionsModal engine={engineRef.current} onClose={handleCloseModal} />
      )}

      {activeModal === 'settings' && engineRef.current && (
        <SettingsModal engine={engineRef.current} onClose={handleCloseModal} />
      )}

      {activeModal === 'controls' && (
        <ControlsModal onClose={handleCloseModal} />
      )}
    </div>
  );
}

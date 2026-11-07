import React, { createContext, useCallback, useContext, useState } from 'react';
import { soundFx } from '../utils/audio';
import { haptics } from '../utils/haptics';

const AudioContext = createContext(null);

/**
 * Portal-wide mute provider wrapping the shared soundFx engine.
 * Games with their own per-game audio singletons can adopt this context
 * progressively: read `muted` with useGlobalMuted() and sync their local
 * engine in an effect (tetris does this for tetrisSound).
 *
 * Adapter notes:
 * - Engines exposing setMuted(muted): pass muted directly.
 * - Engines exposing toggleMute(): boolean: wrap the return value.
 * - skyJumperAudio's setMute is dead code; use toggleMute instead.
 */
export function AudioProvider({ children, initialMuted }) {
  const [muted, setMutedState] = useState(() => initialMuted ?? soundFx.muted);

  const setMuted = useCallback((value) => {
    soundFx.muted = value;
    setMutedState(value);
    haptics.light();
  }, []);

  const toggleMute = useCallback(() => {
    const next = soundFx.toggleMute();
    setMutedState(next);
    haptics.light();
    return next;
  }, []);

  return (
    <AudioContext.Provider value={{ muted, setMuted, toggleMute }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useGlobalMuted() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    throw new Error('useGlobalMuted must be used inside <AudioProvider>');
  }
  return ctx;
}

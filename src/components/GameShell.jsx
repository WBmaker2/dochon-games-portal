import React from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX, HelpCircle } from 'lucide-react';

/**
 * Opt-in shared game shell for NEW games (existing games keep their own HUDs):
 * a glassmorphism HUD bar with score items, pause / restart / mute / help
 * slots, and a help modal slot. Games without pause or a help modal simply
 * omit those callbacks (pause is not applicable to multiplayer/lobby games).
 *
 * Props:
 * - title, subtitle, hudItems: [{ label, value }], or hudLeft/hudRight nodes
 * - isPaused, onPauseToggle, onRestart, isMuted, onMuteToggle
 * - onHelp, helpModal: node (e.g. <XHowToPlayModal ... />)
 * - children: game canvas / board
 */
export default function GameShell({
  title,
  subtitle,
  hudLeft = null,
  hudRight = null,
  isPaused = false,
  onPauseToggle = null,
  onRestart = null,
  isMuted = false,
  onMuteToggle = null,
  onHelp = null,
  helpModal = null,
  children
}) {
  return (
    <div className="game-shell">
      <div className="game-shell-hud">
        <div className="game-shell-titles">
          {title ? <h1 className="game-shell-title">{title}</h1> : null}
          {subtitle ? <span className="game-shell-subtitle">{subtitle}</span> : null}
        </div>

        <div className="game-shell-actions">
          {hudLeft}
          {onRestart ? (
            <button type="button" className="game-shell-btn" onClick={onRestart} title="다시 시작" aria-label="다시 시작">
              <RotateCcw style={{ width: '18px', height: '18px' }} />
            </button>
          ) : null}
          {onPauseToggle ? (
            <button type="button" className="game-shell-btn" onClick={onPauseToggle} title={isPaused ? '계속하기' : '일시정지'} aria-label={isPaused ? '계속하기' : '일시정지'}>
              {isPaused ? <Play style={{ width: '18px', height: '18px' }} /> : <Pause style={{ width: '18px', height: '18px' }} />}
            </button>
          ) : null}
          {onMuteToggle ? (
            <button type="button" className="game-shell-btn" onClick={onMuteToggle} title={isMuted ? '음소거 해제' : '음소거'} aria-label={isMuted ? '음소거 해제' : '음소거'}>
              {isMuted ? <VolumeX style={{ width: '18px', height: '18px' }} /> : <Volume2 style={{ width: '18px', height: '18px' }} />}
            </button>
          ) : null}
          {onHelp ? (
            <button type="button" className="game-shell-btn" onClick={onHelp} title="게임 방법 설명" aria-label="게임 방법 설명">
              <HelpCircle style={{ width: '18px', height: '18px' }} />
            </button>
          ) : null}
          {hudRight}
        </div>
      </div>

      <div className="game-shell-body">{children}</div>
      {helpModal}
    </div>
  );
}

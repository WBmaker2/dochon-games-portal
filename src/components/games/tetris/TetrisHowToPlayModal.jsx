import React from 'react';
import {
  X,
  Gamepad2,
  Smartphone,
  Trophy,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import './tetris.css';

export default function TetrisHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="tetris-modal-overlay" onClick={onClose}>
      <div className="tetris-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="tetris-modal-header">
          <div className="tetris-modal-title-box">
            <div className="tetris-modal-icon-badge">
              <span style={{ fontSize: '24px' }}>🧱</span>
            </div>
            <div>
              <h2 className="tetris-modal-title">도촌 테트리스 플레이 가이드</h2>
              <p className="tetris-modal-subtitle">블록을 빈틈없이 채워 라인을 삭제하고 명예의 전당에 이름을 새겨보세요! ✨</p>
            </div>
          </div>
          <button className="tetris-modal-close-btn" onClick={onClose} aria-label="가이드 닫기" title="닫기">
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="tetris-modal-body">
          {/* 📱 Mobile Tip Banner */}
          <div className="tetris-tip-banner">
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <span>
              <strong>모바일 이용 팁:</strong> 스마트폰이나 태블릿에서는 화면 하단의 <strong>전용 터치 패드</strong>로 편리하게 블록을 조작할 수 있습니다!
            </span>
          </div>

          {/* Section 1: Core Objective */}
          <div className="tetris-guide-section">
            <h3 className="tetris-guide-heading">
              <Layers style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
              <span>1. 게임 목표 및 핵심 규칙</span>
            </h3>
            <div className="tetris-guide-box">
              <ul className="tetris-guide-list">
                <li>
                  <strong>7가지 테트로미노 블록:</strong> I, J, L, O, S, T, Z 블록이 무작위로 내려옵니다.
                </li>
                <li>
                  <strong>가로줄 삭제 (Line Clear):</strong> 가로 한 줄(12칸)을 빈틈없이 꽉 채우면 해당 라인이 팡! 삭제되며 점수를 획득합니다.
                </li>
                <li>
                  <strong>게임 오버:</strong> 블록이 맨 위 천장까지 쌓여 더 이상 새 블록이 들어갈 수 없으면 게임이 종료됩니다.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Scoring & Combo */}
          <div className="tetris-guide-section">
            <h3 className="tetris-guide-heading">
              <Sparkles style={{ width: '18px', height: '18px', color: '#FBBF24' }} />
              <span>2. 점수 계산 및 콤보 보너스</span>
            </h3>
            <div className="tetris-score-grid">
              <div className="tetris-score-card">
                <span className="tetris-score-badge line-1">1줄 (Single)</span>
                <span className="tetris-score-points">10점</span>
              </div>
              <div className="tetris-score-card">
                <span className="tetris-score-badge line-2">2줄 (Double)</span>
                <span className="tetris-score-points">40점</span>
              </div>
              <div className="tetris-score-card">
                <span className="tetris-score-badge line-3">3줄 (Triple)</span>
                <span className="tetris-score-points">90점</span>
              </div>
              <div className="tetris-score-card tetris-highlight">
                <span className="tetris-score-badge line-4">4줄 (Tetris)</span>
                <span className="tetris-score-points highlight">160점 🔥</span>
              </div>
            </div>
            <div className="tetris-guide-box" style={{ marginTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: 1.5 }}>
                ⚡ <strong>연속 콤보 배수:</strong> 라인을 쉬지 않고 연속으로 삭제하면 콤보 배율(x1.5, x2.0, x2.5...)이 추가되어 대량 득점이 가능합니다!<br />
                ⚡ <strong>스피드 레벨업:</strong> 점수가 100점 오를 때마다 레벨이 오르고 블록 낙하 속도가 가속됩니다.
              </p>
            </div>
          </div>

          {/* Section 3: Controls */}
          <div className="tetris-guide-section">
            <h3 className="tetris-guide-heading">
              <Gamepad2 style={{ width: '18px', height: '18px', color: '#A855F7' }} />
              <span>3. 조작법 (PC 키보드 & 모바일 터치)</span>
            </h3>
            <div className="tetris-controls-grid">
              {/* PC Keyboard */}
              <div className="tetris-ctrl-card">
                <div className="tetris-ctrl-header">
                  <Gamepad2 style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
                  <strong>PC 키보드 조작</strong>
                </div>
                <div className="tetris-ctrl-list">
                  <div className="tetris-ctrl-row">
                    <span className="tetris-kbd-pill">← / →</span>
                    <span>좌우 블록 이동</span>
                  </div>
                  <div className="tetris-ctrl-row">
                    <span className="tetris-kbd-pill">↑ 또는 W</span>
                    <span>시계 방향 블록 회전</span>
                  </div>
                  <div className="tetris-ctrl-row">
                    <span className="tetris-kbd-pill">↓ 또는 S</span>
                    <span>소프트 드롭 (빠른 내리기)</span>
                  </div>
                  <div className="tetris-ctrl-row">
                    <span className="tetris-kbd-pill highlight">Space</span>
                    <span>하드 드롭 (즉시 바닥 낙하 & 고정)</span>
                  </div>
                </div>
              </div>

              {/* Mobile Touch */}
              <div className="tetris-ctrl-card">
                <div className="tetris-ctrl-header">
                  <Smartphone style={{ width: '16px', height: '16px', color: '#F472B6' }} />
                  <strong>모바일 / 태블릿 터치 패드</strong>
                </div>
                <div className="tetris-ctrl-list">
                  <div className="tetris-ctrl-row">
                    <span className="tetris-touch-pill">◀ / ▶</span>
                    <span>좌우 이동 버튼</span>
                  </div>
                  <div className="tetris-ctrl-row">
                    <span className="tetris-touch-pill rotate">🔄 회전</span>
                    <span>네온 퍼플 블록 회전 버튼</span>
                  </div>
                  <div className="tetris-ctrl-row">
                    <span className="tetris-touch-pill drop">▼ 내리기</span>
                    <span>소프트 드롭 (천천히 가속)</span>
                  </div>
                  <div className="tetris-ctrl-row">
                    <span className="tetris-touch-pill hard">⚡ 즉시 낙하</span>
                    <span>네온 시안 하드 드롭 버튼</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Pro Tips & Leaderboard */}
          <div className="tetris-guide-section">
            <h3 className="tetris-guide-heading">
              <Trophy style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
              <span>4. 고득점 공략 꿀팁 & 명예의 전당 등록</span>
            </h3>
            <div className="tetris-pro-tips-box">
              <div className="tetris-tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>고스트 피스 활용:</strong> 바닥에 반투명 그림자로 표시되는 착지 위치를 미리 보고 정확하게 안착시키세요.</span>
              </div>
              <div className="tetris-tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>4줄 테트리스 노리기:</strong> 한쪽 열을 비워두고 긴 하늘색 I 블록을 꽂아 4줄을 동시에 없애면 최고의 점수와 쾌감을 얻습니다!</span>
              </div>
              <div className="tetris-tip-item">
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981', flexShrink: 0 }} />
                <span><strong>벽 튕기기 (Wall Kick):</strong> 벽이나 다른 블록 근처에서도 회전 버튼을 누르면 유연하게 자리를 잡아 회전합니다.</span>
              </div>
              <div className="tetris-tip-item" style={{ borderTop: '1px dashed rgba(245, 158, 11, 0.4)', paddingTop: '8px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#F59E0B', flexShrink: 0 }} />
                <span><strong>도촌초 명예의 전당 등록:</strong> 최종 점수가 <strong>100점을 초과</strong>하면 도촌초등학교 실시간 클라우드 랭킹에 이름을 등록할 수 있습니다! (100점 이하 달성 시 점수 등록창이 나타나지 않습니다)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="tetris-modal-footer">
          <button className="tetris-modal-action-btn" onClick={onClose}>
            <span>이해했어요! 지금 바로 플레이하기 🎮</span>
          </button>
        </div>
      </div>
    </div>
  );
}

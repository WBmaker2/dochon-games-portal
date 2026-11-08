import React, { useState, useEffect } from 'react';
import { X, User, Trophy, Clock, Crown, RefreshCw } from 'lucide-react';
import { getProfileName, setProfileName, getLocalProfileSummary, refreshProfileFromCloud } from '../utils/profile';

export default function ProfileModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [summary, setSummary] = useState({ best: [], recent: [], firstPlaces: 0 });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = getProfileName();
      setName(saved);
      setSummary(getLocalProfileSummary(saved));
      setEditing(!saved);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const clean = setProfileName(name);
    setName(clean);
    setSummary(getLocalProfileSummary(clean));
    setEditing(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    const next = await refreshProfileFromCloud(name);
    setSummary(next);
    setLoading(false);
  };

  return (
    <div className="leaderboard-overlay">
      <div className="leaderboard-modal-box" role="dialog" aria-modal="true">
        <button onClick={onClose} className="leaderboard-close-btn" title="닫기" aria-label="닫기"><X className="w-5 h-5" /></button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User style={{ width: '20px', height: '20px', color: '#FBBF24' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>내 기록</h2>
            <button onClick={handleRefresh} title="새로고침" aria-label="새로고침" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
              <RefreshCw style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>회원 없이 내 이름으로 기록을 모아볼 수 있어요.</p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '14px' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="예:홍길동"
            maxLength={16}
            disabled={!editing && name}
            aria-label="내 이름"
            style={{ flex: 1, padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: '#1E293B', color: '#fff', fontSize: '13px' }}
          />
          <button type="submit" style={{ padding: '10px 14px', borderRadius: '12px', background: '#F59E0B', color: '#78350F', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
            {editing ? '저장' : '변경'}
          </button>
        </form>
        {name && editing && <p style={{ fontSize: '11px', color: '#64748B', marginTop: '-8px' }}>최대 16자까지, 명예의 전당 이름과 같게 입력하세요.</p>}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <span style={{ background: 'rgba(251,191,36,0.15)', color: '#FDE68A', padding: '6px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 800 }}>
            <Crown style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} /> 1등 {summary.firstPlaces}회
          </span>
          <span style={{ background: 'rgba(52,211,153,0.15)', color: '#6EE7B7', padding: '6px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 800 }}>
            <Trophy style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px' }} /> 게임별 {summary.best.length}종
          </span>
        </div>

        {loading ? <p style={{ color: '#94A3B8', fontSize: '13px' }}>불러오는 중...</p> : (
          <>
            <h3 style={{ fontSize: '13px', color: '#FBBF24', margin: '0 0 8px' }}>게임별 최고</h3>
            {summary.best.length === 0 ? <p style={{ color: '#94A3B8', fontSize: '13px' }}>아직 기록이 없어요. 게임에서 점수를 등록하면 여기 보여요.</p> :
              summary.best.map((b) => <p key={b.gameId} style={{ color: '#E2E8F0', fontSize: '13px', margin: '4px 0' }}>{b.title} — {b.score}점 (#{b.rank})</p>)}
            <h3 style={{ fontSize: '13px', color: '#34D399', margin: '12px 0 8px' }}><Clock style={{ width: '13px', height: '13px', display: 'inline' }} /> 최근 기록</h3>
            {summary.recent.length === 0 ? <p style={{ color: '#64748B', fontSize: '12px' }}>최근 기록 없음</p> :
              summary.recent.map((r) => <p key={r.gameId} style={{ color: '#94A3B8', fontSize: '12px', margin: '3px 0' }}>{r.title} {r.score}점 {r.date ? `(${r.date})` : ''}</p>)}
          </>
        )}
      </div>
    </div>
  );
}

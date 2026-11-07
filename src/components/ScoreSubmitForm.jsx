import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

/**
 * Presentational shared score-submit form, driven by useScoreSubmit.
 *
 * Props:
 * - score: number (form renders only when score > 100, per the 100점 이하 차단 원칙)
 * - submitState: return value of useScoreSubmit()
 * - maxLength: name input length (default 10; legacy games use 16)
 * - formClassName / inputClassName / buttonClassName: per-game styling passthrough
 * - titleNode / noticeText: optional extra copy inside the form
 * - successClassName / successText: submitted-state rendering
 *   (default text: "명예의 전당에 성공적으로 등록되었습니다! 🏆")
 */
export default function ScoreSubmitForm({
  score,
  submitState,
  maxLength = 10,
  formClassName = '',
  inputClassName = '',
  buttonClassName = '',
  titleNode = null,
  noticeText = null,
  successClassName = '',
  successText = '명예의 전당에 성공적으로 등록되었습니다! 🏆'
}) {
  const { playerName, setPlayerName, isSubmitting, isSubmitted, submitError, handleScoreSubmit } = submitState;

  if (score <= 100) return null;

  if (isSubmitted) {
    return (
      <div className={successClassName} style={successClassName ? undefined : { color: '#34D399', fontWeight: 800, fontSize: '13px', marginBottom: '14px' }}>
        <CheckCircle2 style={{ width: '16px', height: '16px' }} />
        <span>{successText}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleScoreSubmit} className={formClassName}>
      {titleNode}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="예: 홍길동"
          maxLength={maxLength}
          disabled={isSubmitting || isSubmitted}
          required
          className={inputClassName}
          autoFocus
        />
        <button
          type="submit"
          disabled={isSubmitting || isSubmitted || !playerName.trim()}
          className={buttonClassName}
        >
          {isSubmitting ? '등록 중...' : '등록하기 🏆'}
        </button>
      </div>
      {noticeText ? <p style={{ fontSize: '12px', marginTop: '8px' }}>{noticeText}</p> : null}
      {submitError ? <p style={{ fontSize: '12px', color: '#FCA5A5', marginTop: '8px' }}>{submitError}</p> : null}
    </form>
  );
}

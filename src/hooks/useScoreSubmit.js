import { useState } from 'react';
import { submitScoreToDB } from '../utils/leaderboardApi';
import { haptics } from '../utils/haptics';

/**
 * Shared score-submit hook. Encapsulates the union of the 35 per-game handlers:
 * - trims the name, guards score > 100, manages isSubmitting / isSubmitted
 * - calls submitScoreToDB and preserves the optimistic setIsSubmitted(true)
 *   semantics used by the 28 games that ignore the boolean return
 *   (submitScoreToDB returns false only for score <= 100; every other outcome
 *   returns true because the local cache is authoritative for offline play)
 * - variant 'error' (7 games): shows inline error messages on failure
 * - variant 'silent' (28 games): no inline error, matches previous behavior
 *
 * Double-form games (e.g. brickbreaker) must share ONE hook instance between
 * both rendered forms so submitted/submitting state stays consistent.
 */
export function useScoreSubmit({ gameKey, score, onSubmitted, variant = 'silent', initialName = '' }) {
  const [playerName, setPlayerName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleScoreSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const cleanName = playerName.trim();
    if (!cleanName || isSubmitting || score <= 100) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitScoreToDB(gameKey, cleanName, score);
      if (result === false) {
        if (variant === 'error') {
          setSubmitError('점수 등록에 실패했습니다. 잠시 후 다시 시도하세요.');
        }
        return;
      }
      setIsSubmitted(true);
      if (variant === 'error') haptics.success();
      if (onSubmitted) onSubmitted(gameKey);
    } catch (err) {
      if (variant === 'error') {
        setSubmitError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmitState = () => {
    setPlayerName('');
    setIsSubmitting(false);
    setIsSubmitted(false);
    setSubmitError('');
  };

  return {
    playerName,
    setPlayerName,
    isSubmitting,
    isSubmitted,
    submitError,
    handleScoreSubmit,
    resetSubmitState
  };
}

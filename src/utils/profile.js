import { getAllLeaderboardsFromDB } from './leaderboardApi';
import { PLAYABLE_GAMES } from '../data/gamesData';

const NAME_KEY = 'dochon_profile_name';

export function getProfileName() {
  try {
    return (localStorage.getItem(NAME_KEY) || '').trim().slice(0, 16);
  } catch {
    return '';
  }
}

export function setProfileName(name) {
  const clean = String(name || '').trim().slice(0, 16);
  try {
    if (clean) localStorage.setItem(NAME_KEY, clean);
    else localStorage.removeItem(NAME_KEY);
  } catch {}
  return clean;
}

export function getLocalProfileSummary(name) {
  const clean = String(name || '').trim();
  if (!clean) return { best: [], recent: [], firstPlaces: 0 };
  const best = [];
  const recent = [];
  let firstPlaces = 0;
  for (const game of PLAYABLE_GAMES) {
    try {
      const raw = localStorage.getItem(`dochon_leaderboard_${game.id}`);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) continue;
      const idx = list.findIndex((r) => String(r.name || '').trim() === clean);
      if (idx === -1) continue;
      const entry = list[idx];
      best.push({ gameId: game.id, title: game.title, score: Number(entry.score) || 0, rank: idx + 1, date: entry.date || '' });
      recent.push({ gameId: game.id, title: game.title, score: Number(entry.score) || 0, date: entry.date || '', timestamp: entry.timestamp || 0 });
      if (idx === 0) firstPlaces += 1;
    } catch {}
  }
  best.sort((a, b) => b.score - a.score);
  recent.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  return { best: best.slice(0, 5), recent: recent.slice(0, 5), firstPlaces };
}

export async function refreshProfileFromCloud(name) {
  const clean = String(name || '').trim();
  if (!clean) return getLocalProfileSummary(clean);
  try {
    await getAllLeaderboardsFromDB();
  } catch {}
  return getLocalProfileSummary(clean);
}

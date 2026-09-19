import type { PersistedState } from './types';

const KEY = 'timeline-constraints:v1';

export function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || !Array.isArray(parsed.constraints)) return null;
    return {
      constraints: parsed.constraints,
      anchorEvent: typeof parsed.anchorEvent === 'string' ? parsed.anchorEvent : '',
      anchorTime: typeof parsed.anchorTime === 'string' ? parsed.anchorTime : '',
    };
  } catch {
    return null;
  }
}

export function savePersisted(state: PersistedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 隐私模式等场景下写入可能失败，静默忽略
  }
}

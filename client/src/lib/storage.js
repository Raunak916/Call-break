// Identity persistence. The display name is global; the session records which
// room + playerId this browser holds so a refresh / reconnect can reclaim the
// seat within the server's grace window.

const NAME_KEY = 'callbreak.name';
const SESSION_KEY = 'callbreak.session';

export const storage = {
  get name() {
    return localStorage.getItem(NAME_KEY) || '';
  },
  set name(v) {
    localStorage.setItem(NAME_KEY, v);
  },

  /** @returns {{ roomCode: string, playerId: string, name: string }|null} */
  get session() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set session(s) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  },

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  },
};

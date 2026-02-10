// src/lib/session.ts

const SESSION_KEY = "loom_session_id";

export async function getSession(appMode: string): Promise<string> {
  if (typeof window === "undefined") return "server-side-session";

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = self.crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

// 🟢 NEW: Professional Session Reset
export function resetSession() {
  if (typeof window !== "undefined") {
    const newId = self.crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newId);
    return newId;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}
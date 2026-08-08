// Временное хранилище для авторизации (в продакшене использовать БД)

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password?: string; // В реальном приложении хранить только хеш
  points: number;
  badges: string[];
  level: string;
  createdAt: string;
}

// Глобальное хранилище (в продакшене использовать БД)
export const users: AuthUser[] = [];
export const sessions: Map<string, string> = new Map(); // sessionId -> userId

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getUserByEmail(email: string): AuthUser | undefined {
  return users.find(u => u.email === email);
}

export function getUserById(id: string): AuthUser | undefined {
  return users.find(u => u.id === id);
}

export function getUserBySessionId(sessionId: string): AuthUser | undefined {
  const userId = sessions.get(sessionId);
  if (!userId) return undefined;
  return getUserById(userId);
}

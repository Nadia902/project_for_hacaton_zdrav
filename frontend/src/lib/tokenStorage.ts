const AUTH_TOKEN_KEY = 'authToken';

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    const saved = localStorage.getItem(AUTH_TOKEN_KEY);
    if (saved !== token) {
      throw new Error('Токен не был сохранен корректно');
    }
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.code === 22 || error.code === 1014) {
        throw new Error('localStorage переполнен или недоступен');
      } else if (error.code === 18) {
        throw new Error('Операция с localStorage не разрешена');
      }
    }
    throw error;
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}


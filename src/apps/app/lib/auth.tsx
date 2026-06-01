import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api } from './api';
import { clearSession, getPlayer, getToken, Player, saveSession } from './storage';

type AuthContextValue = {
  player: Player | null;
  ready: boolean;
  login: (code: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    const saved = getPlayer();
    if (token && saved) setPlayer(saved);
    setReady(true);
  }, []);

  async function login(code: string, name?: string) {
    const res = await api.login(code, name);
    saveSession(res.token, res.player);
    setPlayer(res.player);
  }

  function logout() {
    clearSession();
    setPlayer(null);
  }

  return (
    <AuthContext.Provider value={{ player, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

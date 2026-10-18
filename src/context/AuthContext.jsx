import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  createSession,
  getLockoutRemainingMs,
  readSession,
  registerFailedAttempt,
  resetFailedAttempts,
  verifyCredentials,
} from "../services/authService";

const AuthContext = createContext(null);

/**
 * Provedor de autenticação.
 * Expõe: `user`, `isAuthenticated`, `login(username, password)` e `logout()`.
 * A sessão expira sozinha (o provedor agenda o logout automático).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // Logout automático quando a sessão expira.
  useEffect(() => {
    if (!session) return undefined;
    const timeoutId = setTimeout(logout, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timeoutId);
  }, [session, logout]);

  /**
   * @returns {Promise<{ok: true} | {ok: false, error: string, lockedMs?: number}>}
   */
  const login = useCallback(async (username, password) => {
    const lockedMs = getLockoutRemainingMs();
    if (lockedMs > 0) {
      return { ok: false, error: "Muitas tentativas. Aguarde para tentar novamente.", lockedMs };
    }

    if (!username.trim() || !password) {
      return { ok: false, error: "Informe usuário e senha." };
    }

    if (await verifyCredentials(username, password)) {
      resetFailedAttempts();
      setSession(createSession(username.trim()));
      return { ok: true };
    }

    registerFailedAttempt();
    // Mensagem genérica: não revela se foi o usuário ou a senha que falhou.
    return {
      ok: false,
      error: "Usuário ou senha inválidos.",
      lockedMs: getLockoutRemainingMs(),
    };
  }, []);

  const value = useMemo(
    () => ({ user: session?.user ?? null, isAuthenticated: Boolean(session), login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook de acesso ao contexto de autenticação. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return context;
}

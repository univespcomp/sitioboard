import {
  DEMO_CREDENTIALS,
  LOCKOUT_DURATION_MS,
  LOCKOUT_STORAGE_KEY,
  MAX_LOGIN_ATTEMPTS,
  SESSION_DURATION_MS,
  SESSION_STORAGE_KEY,
} from "../config/constants";

/**
 * Autenticação básica de DEMONSTRAÇÃO (100% no navegador).
 *
 * ⚠️ Limitações importantes (detalhadas em docs/SEGURANCA_E_ERROS.md):
 *  - Qualquer pessoa pode contornar este login pelas DevTools.
 *  - Ele protege apenas a interface, NÃO a API.
 *  Para proteção real, valide usuário/senha em um backend.
 */

/** SHA-256 em hexadecimal (Web Crypto; requer HTTPS ou localhost). */
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparação sem retorno antecipado (evita vazar posição da diferença). */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** @returns {Promise<boolean>} */
export async function verifyCredentials(username, password) {
  const [userHash, passHash] = await Promise.all([
    sha256Hex(username.trim()),
    sha256Hex(password),
  ]);
  // Avalia as duas comparações sempre, para tempo de resposta uniforme.
  const userOk = safeEqual(userHash, DEMO_CREDENTIALS.usernameHash);
  const passOk = safeEqual(passHash, DEMO_CREDENTIALS.passwordHash);
  return userOk && passOk;
}

/* ------------------------------ Sessão ------------------------------ */

/** Cria a sessão e a devolve. @returns {{user: string, expiresAt: number}} */
export function createSession(user) {
  const session = { user, expiresAt: Date.now() + SESSION_DURATION_MS };
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

/** Lê a sessão; retorna null se inexistente, inválida ou expirada. */
export function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "null");
    const valid =
      typeof session?.user === "string" &&
      Number.isFinite(session?.expiresAt) &&
      session.expiresAt > Date.now();
    if (!valid) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/* ------------------- Bloqueio por tentativas falhas ------------------- */

function readLockout() {
  try {
    const data = JSON.parse(sessionStorage.getItem(LOCKOUT_STORAGE_KEY) ?? "{}");
    return {
      attempts: Number.isFinite(data.attempts) ? data.attempts : 0,
      lockedUntil: Number.isFinite(data.lockedUntil) ? data.lockedUntil : 0,
    };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

/** Milissegundos restantes de bloqueio (0 = liberado). */
export function getLockoutRemainingMs() {
  return Math.max(0, readLockout().lockedUntil - Date.now());
}

/** Registra uma falha; após MAX_LOGIN_ATTEMPTS bloqueia temporariamente. */
export function registerFailedAttempt() {
  const { attempts } = readLockout();
  const next = attempts + 1;
  const state =
    next >= MAX_LOGIN_ATTEMPTS
      ? { attempts: 0, lockedUntil: Date.now() + LOCKOUT_DURATION_MS }
      : { attempts: next, lockedUntil: 0 };
  sessionStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
}

export function resetFailedAttempts() {
  sessionStorage.removeItem(LOCKOUT_STORAGE_KEY);
}

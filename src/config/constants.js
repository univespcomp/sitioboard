/**
 * Constantes centralizadas da aplicação.
 * Alterar um valor aqui é suficiente para mudar o comportamento global.
 */

/**
 * Base da API (sem barra final). Pode ser sobrescrita por VITE_API_BASE_URL.
 *  - Desenvolvimento: "/api" -> proxy do Vite (mesma origem, sem CORS).
 *  - Produção: URL completa da API (exige CORS liberado no servidor)
 *    ou "/api" se a hospedagem tiver rewrite/proxy.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "/api" : "https://sitioapi.onrender.com/api");

/** Rotas da API (relativas à base). */
export const ENDPOINTS = {
  /** Última previsão (pode disparar processamento no servidor). */
  latest: "/executar",
  /** Histórico de observações (umidade, chuva...). */
  observations: "/observacoes",
  /** Previsões já emitidas. */
  forecasts: "/previsoes",
};

/**
 * Tempo máximo de espera pela API.
 * Servidores gratuitos do Render "dormem" e podem levar ~50s para acordar.
 */
export const REQUEST_TIMEOUT_MS = 60_000;

/** Quantos dias mais recentes aparecem nos gráficos. */
export const MAX_CHART_POINTS = 30;

/** Quantas linhas aparecem na tabela de previsões recentes. */
export const MAX_TABLE_ROWS = 10;

/** Sessão de login (sessionStorage: some ao fechar a aba). */
export const SESSION_STORAGE_KEY = "prev-inmet:session:v1";
export const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutos

/** Proteção básica contra tentativas repetidas de login. */
export const LOCKOUT_STORAGE_KEY = "prev-inmet:lockout:v1";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 60_000;

/**
 * Credenciais de demonstração (admin / admin) armazenadas como hash SHA-256,
 * para que o texto puro não apareça no código-fonte.
 *
 * ⚠️ Isto NÃO é segurança real: o hash viaja no bundle e "admin" é trivial de
 * descobrir. Veja docs/SEGURANCA_E_ERROS.md para a autenticação correta (servidor).
 */
export const DEMO_CREDENTIALS = {
  usernameHash:
    "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  passwordHash:
    "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
};

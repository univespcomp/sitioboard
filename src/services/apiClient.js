import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../config/constants";

/** Erro de API com mensagem segura para exibir ao usuário. */
export class ApiError extends Error {
  constructor(userMessage, { cause } = {}) {
    super(userMessage, { cause });
    this.name = "ApiError";
    this.userMessage = userMessage;
  }
}

/**
 * GET JSON com timeout, cancelamento e erros amigáveis.
 *
 * @param {string} path  Rota relativa à base (ex.: "/previsoes")
 * @param {{ signal?: AbortSignal }} [options] sinal externo (ex.: desmontagem do componente)
 * @returns {Promise<unknown>} JSON já decodificado (ainda NÃO validado)
 * @throws {ApiError}
 */
export async function getJson(path, { signal } = {}) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  // Encaminha o cancelamento externo para o controller interno.
  const forwardAbort = () => controller.abort();
  signal?.addEventListener("abort", forwardAbort);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" }, // header "simples": não gera preflight CORS
      credentials: "omit", // nunca envia cookies para a API
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`A API respondeu com erro (HTTP ${response.status}) em ${path}.`);
    }

    // Evita interpretar uma página HTML de erro/fallback como JSON.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new ApiError(`A rota ${path} não retornou JSON.`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) throw error; // cancelamento intencional: o hook ignora
    if (timedOut) {
      throw new ApiError(
        "A API demorou demais para responder. Se ela estava inativa, tente novamente em instantes.",
        { cause: error },
      );
    }
    // fetch só lança TypeError para falhas de rede/CORS (o navegador não diz qual).
    throw new ApiError(
      `Não foi possível acessar ${path}. Causas comuns: sem internet, servidor reiniciando ` +
        "(respostas de erro do Render não trazem cabeçalhos CORS) ou CORS não liberado para este domínio.",
      { cause: error },
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", forwardAbort);
  }
}

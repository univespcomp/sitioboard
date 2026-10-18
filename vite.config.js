import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Content-Security-Policy aplicada SOMENTE no build de produção.
 * (Em desenvolvimento o Vite injeta scripts inline para o hot reload,
 * o que uma CSP estrita bloquearia.)
 *
 * Observação: `frame-ancestors` não funciona via <meta>; configure-o como
 * cabeçalho HTTP no servidor/hospedagem (ex.: `frame-ancestors 'none'`).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Chart.js usa estilos inline
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self' https://sitioapi.onrender.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const injectCsp = () => ({
  name: "inject-csp",
  apply: "build",
  transformIndexHtml: (html) =>
    html.replace(
      "<!-- CSP -->",
      `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
    ),
});

/**
 * Proxy de desenvolvimento: o navegador chama /api no MESMO domínio do app
 * (localhost) e o Vite repassa para a API real. Como a requisição é
 * same-origin, não existe CORS. Vale para `npm run dev` e `npm run preview`.
 * Em produção, use um proxy da hospedagem (ver README) ou libere CORS na API.
 */
const apiProxy = {
  "/api": {
    target: "https://sitioapi.onrender.com",
    changeOrigin: true,
    secure: true,
  },
};

export default defineConfig({
  plugins: [react(), injectCsp()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  // Caminhos relativos: funciona em GitHub Pages / subpastas.
  base: "./",
});

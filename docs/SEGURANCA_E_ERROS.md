# Segurança e possíveis erros — análise e correções

Legenda de severidade: 🔴 alta · 🟠 média · 🟡 baixa.

## 1. Autenticação (admin/admin) — leia primeiro

| Sev. | Problema | Correção |
| --- | --- | --- |
| 🔴 | **O login roda no navegador.** Quem abre as DevTools altera `sessionStorage`, o JS ou o bundle e entra sem senha. Ele protege a *tela*, não os *dados*. | Autenticar em um **backend**: `POST /login` valida a senha e devolve sessão em cookie `HttpOnly; Secure; SameSite=Strict` (ou JWT curto). O front apenas pergunta "estou logado?". |
| 🔴 | **Credenciais fracas e públicas** (`admin/admin`; o hash SHA-256 está no bundle e "admin" é quebrado em milissegundos). | No servidor: senha forte, hash com **bcrypt/argon2** (com salt), troca obrigatória da senha padrão, MFA se possível. |
| 🔴 | **A API não exige login.** Qualquer pessoa chama `/api/executar` direto, sem passar por este app. | Exigir token/cookie na API e validar no servidor em cada requisição. |
| 🟠 | Bloqueio por tentativas é só no cliente (limpar o storage reseta). | Rate limit e bloqueio **no servidor** (por IP e por usuário). |
| 🟡 | Sessão em `sessionStorage` é legível por qualquer XSS. | Cookie `HttpOnly` (JS não lê). |

O que já foi feito no front como boa prática: hash em vez de texto puro, comparação sem retorno
antecipado, mensagem de erro genérica, senha limpa após falha, bloqueio temporário, expiração de
sessão, logout automático, `autocomplete` corretos para gerenciadores de senha.

## 2. API `https://sitioapi.onrender.com/api` (`/executar`, `/previsoes`, `/observacoes`)

| Sev. | Problema | Correção |
| --- | --- | --- |
| 🔴 | **CORS não liberado para o domínio do dashboard** (erro "Não foi possível acessar..."). | Configurar `Access-Control-Allow-Origin` **somente** para o domínio do app (exemplos no README). Em dev, o proxy do Vite contorna. |
| 🔴 | **`GET /executar` possivelmente com efeito colateral** (já retornou `csv_atualizado`, `observacoes_sincronizadas`: sugere rodar pipeline e gravar no banco). `GET` deve ser seguro/idempotente: qualquer link ou robô dispara o processamento (abuso, custo, DoS). | `POST /executar` **autenticado** (ou cron no servidor) e deixar `GET /previsoes` / `GET /observacoes` como leitura pura. O app **não** faz polling por causa disso. |
| 🟠 | **Sem rate limit nem autenticação** aparentes (as 3 rotas são públicas). | Limitar requisições e exigir token/cookie validado no servidor. |
| 🟠 | **Respostas de erro sem CORS** (502/503 do Render em cold start) aparecem como "erro de CORS" no navegador e confundem o diagnóstico. | Manter a API acordada (ping agendado/plano pago) e garantir CORS também nas respostas de erro. |
| 🟠 | **`/observacoes` devolve a série inteira** (milhares de linhas): lento e caro. | Aceitar `?limit=`/`?desde=` e paginar; o front só usa 30 dias. |
| 🟡 | Floats com 15 casas decimais. | Arredondar no servidor (o front formata com 1 casa). |
| 🟡 | Contrato do JSON não documentado. | Documentar (OpenAPI/Swagger). O front valida tudo em `normalizers.js`, mas um contrato evita adivinhação. |

## 3. Problemas do código original (e como ficaram)

| Sev. | Problema | Situação |
| --- | --- | --- |
| 🟠 | **Supply chain:** `chart.js` do jsDelivr **sem versão** (qualquer atualização maliciosa/quebrada entra em produção) e nenhum script com SRI (`integrity`). | Resolvido: dependências do npm com versão exata + `package-lock.json`; `npm audit` limpo na criação. |
| 🟠 | Sem **Content-Security-Policy**. | Resolvido: CSP injetada no build (`vite.config.js`); só permite scripts próprios e conexão à API. Ainda falta enviar `frame-ancestors`/HSTS como **cabeçalhos HTTP** na hospedagem. |
| 🟠 | CSVs buscados em `/arquivo.csv` (raiz do site). Em produção/GitHub Pages retornam 404 (ou o HTML de fallback, tratado como "ok"). | Resolvido: usa a API; resposta só é aceita se `Content-Type` for JSON. |
| 🟡 | `parseFloat` sem checagem → tela mostrava `NaN °C`. | Resolvido: validação em `normalizePayload` + formatadores que devolvem `--`. |
| 🟡 | Erros engolidos (`console.error`); usuário via só "--". | Resolvido: estados `loading/error` visíveis (`role="alert"`). |
| 🟡 | `.slice(-30)` assumia CSV ordenado por data. | Resolvido: os normalizadores ordenam por data e removem duplicatas. |
| 🟡 | Rótulo "Temperatura Atual" era na verdade a média do dia-base. | Resolvido: card "Base da previsão". |
| 🟡 | Rótulos `DD/MM` sem ano ficam ambíguos após 12 meses. | Tooltip/tabela mostram a data completa; considere incluir o ano se o histórico crescer. |
| ✅ | Uso de `textContent` (sem `innerHTML`) evitava XSS. | Mantido: o React escapa tudo; **não há** `dangerouslySetInnerHTML`. |

## 4. Boas práticas ao publicar

- Sirva **somente por HTTPS** (a Web Crypto usada no login exige contexto seguro).
- Configure cabeçalhos HTTP na hospedagem: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, `Permissions-Policy` e `frame-ancestors 'none'` (anti-clickjacking).
  GitHub Pages **não** permite cabeçalhos personalizados; Netlify, Vercel e Cloudflare Pages permitem.
- **Nunca** coloque segredos em variáveis `VITE_*` nem no código: tudo isso é público.
- Rode `npm run audit:deps` periodicamente e atualize as dependências com testes.
- Mantenha `.env` fora do Git (já está no `.gitignore`).
- Considere o Dependabot (GitHub) para alertas automáticos.

## 5. Roteiro sugerido (ordem de prioridade)

1. Liberar CORS só para o domínio do app e separar leitura (`GET`) de execução (`POST` autenticado) + rate limit.
2. Mover o login para o servidor (cookie `HttpOnly`) e remover `DEMO_CREDENTIALS` do front.
3. Paginar `/observacoes` e documentar o contrato do JSON.
4. Publicar com cabeçalhos de segurança e monitorar dependências.

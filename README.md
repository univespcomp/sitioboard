# Previsão do Tempo D+1 — Dashboard INMET (A707 · Presidente Prudente/SP)

Aplicação **React (Vite)** que exibe a previsão de temperatura para o dia seguinte (D+1)
e as condições recentes da estação, consumindo a API do projeto integrador:

| Rota                   | Uso no app                                         |
| ---------------------- | -------------------------------------------------- |
| `GET /api/executar`    | Última previsão (KPI principal)                    |
| `GET /api/previsoes`   | Previsões emitidas → gráfico de previsões e tabela |
| `GET /api/observacoes` | Histórico observado → gráfico de umidade e chuva   |

Base: `https://sitioapi.onrender.com`

> **Login de demonstração:** usuário `admin` · senha `admin`
> ⚠️ É só uma barreira de interface. Veja [`docs/SEGURANCA_E_ERROS.md`](docs/SEGURANCA_E_ERROS.md).

## O que a aplicação faz

1. **Login** — só exibe o painel após autenticar (sessão de 30 min, bloqueio após 5 falhas).
2. **Consulta as 3 rotas em paralelo**; se uma falhar, as outras continuam aparecendo e um aviso
   indica qual rota falhou.
3. **4 indicadores:** previsão D+1, temperatura média do dia-base, umidade média e data de emissão/método.
4. **2 gráficos + tabela:** temperatura prevista × média do dia-base; chuva × umidade; previsões emitidas.
5. **Avisa quando a previsão é menos confiável** (`media_12_meses` = sem observação real do dia-base).
6. **Trata erros** (timeout, offline, CORS, HTTP, JSON inválido) com mensagens claras, nunca "NaN".

## Como funciona

```
src/
├── main.jsx / App.jsx           # Entrada; decide Login x Dashboard
├── config/constants.js          # URL base, rotas (ENDPOINTS), timeouts, limites, login
├── services/
│   ├── apiClient.js             # getJson(): fetch + timeout + cancelamento + erros amigáveis
│   ├── normalizers.js           # ★ ÚNICO arquivo que conhece o formato do JSON (validação)
│   ├── weatherApi.js            # fetchLatestForecast / fetchForecasts / fetchObservations
│   └── authService.js           # hash SHA-256, sessão, bloqueio por tentativas
├── context/AuthContext.jsx      # login / logout / expiração automática
├── hooks/useDashboardData.js    # estado das 3 rotas + previsão "atual" combinada
├── components/                  # Apresentação: Dashboard, KpiCard, ForecastChart,
│                                #   ConditionsChart, HistoryTable, LoginPage, chartSetup
├── utils/format.js              # Formatação pt-BR (datas, °C, %)
└── styles/styles.css            # Tema escuro "glassmorphism"
```

**Fluxo:** `Dashboard` → `useDashboardData` → `weatherApi` → `apiClient` (rede) →
`normalizers` (valida/converte) → componentes.

### ⚠️ Formato dos dados (leia se algo aparecer "Sem dados")

Não consegui inspecionar `/previsoes` e `/observacoes` ao montar o app. Os normalizadores assumem
os **mesmos nomes de coluna dos CSVs originais** e aceitam variações comuns:

- **Previsão:** `data_prevista`, `temperatura_prevista_c` (obrigatórios), `data_base`, `temp_media_c`,
  `umidade_media_pct`, `metodo_entrada`, `emitida_em` (opcionais).
- **Observação:** `data` + ao menos um entre `umidade_media_pct`, `precipitacao_mm`, `temp_media_c`.
- A resposta pode ser uma lista pura ou embrulhada (`{"dados": [...]}`, `data`, `items`, `observacoes`, `previsoes`...).
- Números como string (`"23,5"`) e datas com hora (`2026-10-17 03:00:00`) são aceitos.

Se os nomes forem outros, edite **apenas** o objeto `FIELDS` (e `LIST_KEYS`) em
`src/services/normalizers.js`. Quando nenhum registro é reconhecido, a tela mostra
"formato inesperado" em vez de quebrar.

## Como executar

Requer Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173  (usa o proxy, sem CORS)
npm run build      # gera ./dist (com CSP restritiva)
npm run preview    # serve o build; com VITE_API_BASE_URL=/api também usa o proxy
npm run audit:deps # vulnerabilidades nas dependências
```

Opcional: copie `.env.example` para `.env` para mudar `VITE_API_BASE_URL`.

## Limitações conhecidas

- **Primeira consulta lenta:** o Render (plano gratuito) hiberna; pode levar ~1 min.
- **Volume de dados:** o app baixa a lista completa de `/observacoes` (milhares de linhas) e exibe os
  últimos 30 dias. Se a API aceitar paginação/limite (ex.: `?limit=30`), adicione em `weatherApi.js`.
- `/executar` pode disparar processamento no servidor: por isso **não há atualização automática**,
  só ao abrir e ao clicar em "Atualizar".

## Segurança e erros

Análise completa: **[`docs/SEGURANCA_E_ERROS.md`](docs/SEGURANCA_E_ERROS.md)**.

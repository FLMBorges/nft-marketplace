# Kurio — Marketplace de NFTs

Solução do desafio frontend: marketplace de NFTs em **React + TypeScript**, com descoberta, compra e conta do colecionador, desktop e mobile. Toda a API, a autenticação, as carteiras, os pagamentos e os eventos em tempo real são **simulados na camada de rede com MSW**, inclusive no build publicado.

- **Aplicação publicada:** _(adicione aqui a URL da Vercel)_
- **Decisões técnicas, contratos e limitações:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Stack

React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Axios · Socket.IO (cliente) · Tailwind CSS 4 · shadcn/ui (Radix) · MSW 2 + `@mswjs/socket.io-binding` · Zod · Playwright · Lighthouse

## Requisitos

- Node.js 22 ou mais novo
- npm 10 ou mais novo

## Setup

```bash
npm ci
npx playwright install chromium   # só para rodar os testes E2E
npm run dev                       # http://localhost:5173
```

## Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` (arquivo `.env`) | Liga o MSW (API REST e Socket.IO simulados). Precisa estar `true` também no build de demonstração. |

O `.env` está versionado porque não contém segredos. Variáveis `VITE_*` vão para o código do navegador: **nunca** coloque segredos nelas.

## Credenciais fictícias

| Usuário | E-mail | Senha | Observação |
| --- | --- | --- | --- |
| Ana | `ana@kurio.dev` | `Kurio@2026` | Carteira principal MetaMask na Ethereum |
| Bruno | `bruno@kurio.dev` | `Kurio@2026` | Carteira principal Coinbase na Polygon |

Cupons: `KURIO10` (10%), `BEMVINDO15` (15%) e `EXPIRADO10` (expirado). Qualquer outro código é inválido.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Desenvolvimento com mocks |
| `npm run build` | Verificação de tipos + build otimizado |
| `npm run preview` | Serve o build em `http://localhost:4173` |
| `npm run typecheck` | Verificação de tipos |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Testes Playwright (sobe o build sozinho) |
| `npm run test:e2e:ui` | Playwright em modo interativo |
| `npm run test:e2e:update-snapshots` | Regenera as imagens de regressão visual |
| `npm run test:e2e:report` | Abre o relatório HTML do último teste |
| `npm run lighthouse` | Auditoria Lighthouse (precisa do `npm run preview` rodando) |

## Cenários da simulação

Com os mocks ligados aparece o botão **Cenários** no canto inferior esquerdo. Ele altera o "servidor" simulado (nunca o estado da tela diretamente) e as escolhas ficam salvas até o reset.

| Controle | Opções |
| --- | --- |
| Latência | Sem atraso · Normal (100–400 ms) · Lenta (3 s) · Variável (sequência fixa 1500/150/900/300 ms, gera respostas fora de ordem) |
| Falhar a próxima chamada | Rota (catálogo, detalhe, login/sessão, carrinho, favoritar, criar pedido, consultar pedido, perfil, carteiras) × falha (HTTP 503, sem conexão, timeout) |
| Resultado do pagamento | Confirmar · Recusar |
| Conexão da carteira | Aprovar · Recusar |
| Tempo real | Aumentar preço em 10% · Esgotar edição · Reenviar último evento (duplicata) · Enviar evento antigo · Derrubar conexão |
| Sessão | Expirar sessão |
| **Restaurar cenário inicial** | Volta dados e cenário ao estado conhecido e recarrega |

Os mesmos controles existem em `window.__kurioMock` (usado pelos testes), por exemplo:

```js
__kurioMock.setScenario({ latency: 'slow' })
__kurioMock.failNext('orders.create', 'timeout')
__kurioMock.updateNft('emerald-ape-042', { price: '2.5' })
__kurioMock.reset()
```

## Como reproduzir os fluxos de falha

Entre com a Ana e adicione **Emerald Ape #042** ao carrinho antes dos passos de compra.

| Fluxo | Passos | Resultado esperado |
| --- | --- | --- |
| Carregamento lento | Latência → Lenta, recarregue a home | Skeletons com shimmer no catálogo, detalhe e resumo |
| Respostas fora de ordem | Latência → Variável, clique em vários filtros rápido | A lista sempre mostra o último filtro escolhido |
| Falha e nova tentativa | Falhar a próxima chamada: Catálogo / 503 três vezes seguidas | Mensagem de erro com "Tentar novamente" |
| Favoritar com falha | Falhar: Favoritar / 503, clique em Favoritar | O coração volta ao estado anterior e aparece aviso |
| Cupom inválido/expirado | No carrinho, aplique `XYZ` e depois `EXPIRADO10` | Erro associado ao campo |
| Preço muda no checkout | No pagamento, revise o pedido e use "Aumentar preço em 10%" | Aviso de valores alterados e confirmação bloqueada até revisar de novo |
| Edição esgota | "Esgotar edição" com o item no carrinho | Aviso no carrinho e finalização bloqueada |
| Pagamento recusado | Resultado do pagamento → Recusar, conclua a compra | Tela de recusa; itens continuam no carrinho |
| Clique repetido | Clique duas vezes em "Confirmar compra" | Um único pedido |
| Timeout após criar pedido | Falhar: Criação de pedido / Timeout, confirme a compra | Depois de ~10 s o cliente reenvia com a mesma chave e recebe o **mesmo** pedido |
| Queda com pedido pendente | Confirme a compra, "Derrubar conexão" e recarregue a página | O pedido pendente é retomado e confirmado, sem duplicar |
| Sessão expirada | Em Perfil, "Expirar sessão" e salve | Volta ao login com aviso e, ao entrar, retorna ao perfil |
| Eventos duplicados/antigos | No detalhe, "Reenviar último evento" e "Enviar evento antigo" | Nada regride |

## Testes E2E

```bash
npm run test:e2e
```

36 execuções (32 cenários) cobrindo os 12 grupos do enunciado, em Chromium desktop (1440×900) e mobile (Pixel 7) para os fluxos principais. Cada teste começa num contexto de navegador limpo. O relatório HTML fica em `playwright-report/` e os traces de falha em `test-results/`.

As imagens de referência da regressão visual (`e2e/visual.spec.ts-snapshots/`) foram geradas em Linux. Em outro sistema operacional a renderização de fontes muda: gere as suas com `npm run test:e2e:update-snapshots`.

## Lighthouse

```bash
npm run build && npm run preview   # terminal 1
npm run lighthouse                 # terminal 2
```

Gera `lighthouse/summary.md`, `lighthouse/summary.json` e os relatórios HTML/JSON de cada medição. Resultados e análise em [`ARCHITECTURE.md`](./ARCHITECTURE.md#performance-e-lighthouse).

## Deploy (Vercel)

1. Em [vercel.com/new](https://vercel.com/new), importe este repositório.
2. O framework é detectado como **Vite**; o `vercel.json` já define build, saída e o fallback de rotas da SPA.
3. Em **Environment Variables**, confirme `VITE_ENABLE_MOCKS=true` (o `.env` versionado já cobre isso).
4. Deploy. Acesso direto e refresh em qualquer rota funcionam pelo rewrite para `index.html`.

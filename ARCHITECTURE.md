# Arquitetura

Este documento registra as decisões técnicas, os contratos, as políticas de cache e sessão, a reconciliação entre REST e Socket.IO, as limitações conhecidas e os desvios em relação ao Figma.

## Visão geral

```
src/
├── main.tsx            liga o MSW e só então renderiza a aplicação
├── app.tsx             router + React Query
├── routes/             rotas (TanStack Router, baseadas em arquivos)
│   └── _auth/          rotas privadas (checkout, pedido, perfil, carteiras)
├── api/                cliente Axios, query keys, queries e mutations
├── realtime/           conexão Socket.IO e aplicação dos eventos no cache
├── components/         UI (shadcn/ui adaptado ao Figma)
├── lib/                regras puras: ETH em bigint, validações (zod), URL do catálogo
├── types/              contratos compartilhados entre mocks e aplicação
└── mocks/              "servidor" simulado (MSW): banco, handlers, cenários, eventos
```

Regra de dependência: `mocks/` importa `types/` e `lib/`; nada fora de `mocks/` importa `mocks/` (exceto a inicialização em `main.tsx` e o painel de cenários, carregado só com mocks ligados). Componentes, hooks e o cliente Axios não têm dados fictícios nem caminhos alternativos de negócio: removendo `mocks/`, a aplicação fala com uma API real de mesmo contrato.

### Uso de cada tecnologia obrigatória

| Tecnologia | Onde participa |
| --- | --- |
| TanStack Router | Rotas por arquivo, `validateSearch` do catálogo (estado na URL), guarda das rotas privadas em `_auth.tsx` (`beforeLoad` + `redirect`), 404, parâmetros (`/nft/$id`, `/pedido/$id`) |
| TanStack Query | Todas as leituras e mutations, `placeholderData` na paginação, atualização otimista de favoritos, invalidação após eventos, isolamento de cache por usuário |
| Axios | Único cliente HTTP (`src/api/client.ts`): `baseURL`, timeout de 10 s, cancelamento via `signal`, interceptor de sessão |
| REST | Contratos abaixo |
| Socket.IO | `socket.io-client` real; eventos `nft.updated` e `order.updated` |
| Tailwind CSS + shadcn/ui | Tema do Figma em variáveis CSS; Dialog, Sheet, Button, Input, Skeleton, Sonner |
| MSW | REST e WebSocket (Socket.IO) simulados na camada de rede, ativos no build publicado |
| Playwright | 32 cenários E2E + regressão visual |
| Lighthouse | Script de auditoria versionado (`scripts/lighthouse.mjs`) |

## Contratos REST

Base: `/api`. Erros sempre no formato:

```ts
{ error: { code: ApiErrorCode, message: string, fields?: Record<string, string> } }
```

| Código | HTTP | Uso |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400/422 | Parâmetro ou corpo inválido; `fields` traz o erro por campo |
| `UNAUTHORIZED` | 401 | Sem sessão / credenciais inválidas |
| `SESSION_EXPIRED` | 401 | Sessão expirada |
| `FORBIDDEN` | 403 | Reservado (recursos de outro usuário respondem 404 para não revelar que existem) |
| `NOT_FOUND` | 404 | Recurso inexistente |
| `CONFLICT` | 409 | E-mail já cadastrado, endereço de carteira duplicado |
| `OUT_OF_STOCK` | 409 | Quantidade maior que a disponível / edição indisponível |
| `QUOTE_CHANGED` | 409 | Cotação enviada difere da atual |
| `IDEMPOTENCY_CONFLICT` | 409 | Mesma chave de idempotência com conteúdo diferente |
| `COUPON_INVALID` / `COUPON_EXPIRED` | 422 | Cupom |
| `WALLET_REFUSED` | 422 | Conexão da carteira recusada |
| `UNAVAILABLE` | 503 | Falha transitória |

| Método e rota | Corpo / parâmetros | Resposta |
| --- | --- | --- |
| `GET /auth/session` | — | `Session \| null` (visitante = `null`) ou 401 `SESSION_EXPIRED` |
| `POST /auth/login` | `{ email, password }` | `Session` + cookie de sessão |
| `POST /auth/register` | `{ name, email, password, confirmPassword }` | `201 Session`; 409 se o e-mail existir |
| `POST /auth/logout` | — | Remove a sessão e o cookie |
| `GET /nfts` | `q, category, network, minPrice, maxPrice, sort, tab, collection, page` | `NftListResponse` (itens, paginação e contagens dos filtros) |
| `GET /nfts/:id` | — | `Nft` ou 404 |
| `GET /favorites` | — | `string[]` |
| `PUT` / `DELETE /favorites/:nftId` | — | `string[]` |
| `GET /cart` | `network` | `Cart` (itens + cotação) |
| `POST /cart/items` | `{ nftId, edition, quantity }` | `Cart`; 409 se exceder a disponibilidade |
| `PATCH /cart/items` | `{ nftId, edition, quantity }` (0 remove) | `Cart` |
| `DELETE /cart/items` | `nftId, edition` | `Cart` |
| `PUT` / `DELETE /cart/coupon` | `{ code }` | `Cart` |
| `POST /orders` | Cabeçalho `Idempotency-Key`; `{ quoteSignature, network, walletId, buyer }` | `201 Order` (pendente); mesma chave devolve o mesmo pedido |
| `GET /orders/:id` | — | `Order` (snapshot) |
| `GET` / `PUT /profile` | `{ name, email, username, ensName }` | `User` |
| `PUT` / `DELETE /profile/avatar` | `{ dataUrl }` (PNG/JPG/WebP até 1 MB) | `User` |
| `PUT /profile/password` | `{ currentPassword, newPassword, confirmPassword }` | `{ ok }` |
| `GET /wallets` | — | `Wallet[]` |
| `PUT /wallets/:slot` (`primary`/`secondary`) | `{ label, provider, network, address, ens }` | `Wallet[]` |
| `POST /wallets/:id/connect` | — | `{ connected }` ou 422 `WALLET_REFUSED` |

Os tipos estão em `src/types/`. As validações de formulário (`src/lib/schemas.ts`, zod) são as mesmas no cliente (feedback imediato) e no servidor simulado (que nunca confia no cliente).

### Valores em ETH

Trafegam como **strings decimais**. Toda conta é feita em wei com `bigint` (`src/lib/eth.ts`), sem `number` de ponto flutuante. A interface não calcula totais: exibe a cotação da API, que é a referência para finalizar o pedido. Quantidades são inteiros validados nos dois lados.

### Cotação e assinatura

`GET /cart` devolve `quote.signature`, um hash da combinação exata de itens, preços, quantidades, cupom, rede e taxa. O checkout envia essa assinatura; se qualquer valor mudou desde a revisão, a API responde `409 QUOTE_CHANGED` e a interface exige nova revisão. A mesma comparação também é feita no cliente: se a assinatura do cache mudar depois da revisão (por um evento), o botão de confirmar é bloqueado até o usuário revisar.

### Pedidos e idempotência

1. Ao confirmar, o cliente cria uma chave (`crypto.randomUUID()`) e salva a tentativa (`sessionStorage`).
2. `POST /orders` com `Idempotency-Key`. Falhas transitórias (rede, timeout, 5xx) são repetidas automaticamente **com a mesma chave**.
3. A API guarda `(usuário, chave, hash do corpo)`. Mesma chave e mesmo corpo devolvem o pedido existente; corpo diferente gera `409 IDEMPOTENCY_CONFLICT`.
4. Se a página recarregar com uma tentativa salva, o checkout a reenvia e recupera o pedido.
5. O pedido nasce `pending`. A simulação decide o resultado no momento da criação (cenário de pagamento) e resolve após ~2,5 s: `confirmed` (baixa estoque, publica `nft.updated`, remove do carrinho **só** os itens e quantidades comprados) ou `declined` (nada muda no carrinho). Estados finais são terminais.
6. O pedido é um **snapshot**: nomes, imagens, preços, taxas e total são copiados; mudanças no catálogo depois não afetam o recibo.
7. A confirmação só aparece para `status === 'confirmed'`.

## Sessão

- Cookie `kurio_session` (`SameSite=Lax`, 30 min, renovado a cada uso). Um backend real usaria `HttpOnly; Secure`; o navegador não permite que um mock defina `HttpOnly`, então o cookie é legível por JS nesta demonstração.
- Senhas: só o hash SHA-256 de `salt:senha` é armazenado (salt por usuário). Login com credenciais erradas devolve a mesma mensagem para e-mail inexistente e senha errada.
- Sessão recuperável após refresh (`GET /auth/session`).
- Rotas privadas (`/checkout`, `/pedido/$id`, `/perfil`, `/carteiras`) passam pelo `beforeLoad` de `_auth.tsx`; sem sessão, vão para `/login?redirect=<origem>`.
- O `redirect` aceita apenas caminhos internos (bloqueia `//site` e URLs absolutas: proteção contra *open redirect*).
- Expiração durante a navegação ou o checkout: qualquer 401 em rota não-`/auth` dispara `SESSION_EXPIRED_EVENT`; o app limpa os dados privados e, numa tela privada, leva ao login com aviso e retorna depois. Os dados do formulário de pagamento e a tentativa de compra continuam salvos.
- Logout e troca de usuário: `clearPrivateData()` remove do cache todas as chaves `['user', …]` e `['cart', …]`, e a conexão Socket.IO é fechada e reaberta para o novo usuário.

## Carrinho

- Vive no servidor simulado, identificado pelo usuário (`u:<id>`) ou por um cookie de visitante (`g:<id>`). Sobrevive ao refresh.
- Ao entrar, o carrinho do visitante é **mesclado** no do usuário (somando quantidades).
- Toda mutation devolve o carrinho inteiro, gravado direto no cache (sem segunda requisição).
- Disponibilidade é por NFT **e** edição; a API recusa quantidades acima do disponível e a cotação aponta itens esgotados (`issues`), bloqueando a finalização.
- Mudanças de preço/disponibilidade enquanto a página está aberta aparecem num aviso que lista o que mudou.

## Estado e cache (TanStack Query)

| Política | Valor | Motivo |
| --- | --- | --- |
| `staleTime` padrão | 30 s | Voltar a uma página recente é instantâneo; dados mudam pouco fora dos eventos |
| Sessão | 60 s | Revalidada também em qualquer 401 |
| `retry` | até 2 vezes, só para erro de rede, timeout ou 5xx | Repetir um 4xx daria o mesmo erro |
| Cancelamento | `signal` do Query repassado ao Axios | Respostas obsoletas (troca rápida de filtros) são canceladas; a chave da query isola os resultados, então uma resposta fora de ordem nunca sobrescreve outra |
| Paginação/filtros | `placeholderData: keepPreviousData` | A lista anterior fica visível (esmaecida, `aria-busy`) enquanto a nova carrega |
| Pedido pendente | `refetchInterval` de 4 s enquanto `pending` | Rede de segurança se um evento se perder |
| Atualização otimista | Favoritos: `onMutate` grava o novo estado, `onError` restaura o anterior, `onSettled` revalida | |

Chaves: `['nfts', 'list', params]`, `['nfts', 'detail', id]`, `['session']`, `['cart', userId|'guest', network]`, `['user', userId, 'favorites' | 'wallets' | 'order', id]`. Dados privados sempre levam o id do usuário na chave.

### Estado na URL

Busca, categoria, rede, faixa de preço, ordenação, aba e página ficam na URL (`validateSearch`). Valores inválidos são descartados e os padrões não aparecem (`stripSearchParams`). Qualquer mudança de filtro volta para a página 1. Refresh, voltar/avançar e links compartilhados restauram o estado.

## Tempo real: Socket.IO e reconciliação com REST

Eventos:

```ts
type NftUpdatedEvent  = { id, type: 'nft.updated',   resourceId, version, data: { price, previousPrice, editions } }
type OrderUpdatedEvent = { id, type: 'order.updated', resourceId, version, userId, data: Order }
```

- **Identidade estável** (`id`): duplicatas são descartadas.
- **Versão do recurso**: um evento só é aplicado se a versão for maior que a última aplicada e que a do cache; eventos antigos não regridem o estado.
- `nft.updated` atualiza listas, detalhe e invalida o carrinho (preço e total vêm sempre da cotação da API).
- `order.updated` só é aceito para o usuário da sessão atual; o servidor também só envia para a conexão do dono.
- **Reconexão**: no evento `reconnect`, todas as queries ativas são revalidadas pela REST (o que pode ter sido perdido offline é recuperado).
- **Ciclo de vida**: uma conexão por sessão; trocar de usuário ou sair fecha a conexão anterior e remove os listeners.
- O `socket.io-client` é importado sob demanda, depois que o MSW liga, para usar o `WebSocket` interceptado.

### Transporte simulado e limitações

O MSW intercepta o `WebSocket` e o `@mswjs/socket.io-binding` traduz o protocolo do Socket.IO. Limitações conhecidas:

- Só o transporte **WebSocket** (`transports: ['websocket']`), sem *long-polling*.
- Namespace padrão `/`, sem rooms/broadcast nativos; o "broadcast" é feito pelo mock percorrendo as conexões abertas.
- O binding faz o handshake mas não envia *pings*; o mock envia um ping a cada 20 s para o cliente não desconectar.
- O MSW remove o prefixo `/socket.io/` antes de comparar URLs, então o link do handler é só a origem.
- Como o "servidor" roda na própria aba, ele não existe entre abas diferentes nem sobrevive ao fechar a aba; timers de pedidos pendentes são reagendados ao recarregar e o pedido também se resolve na próxima consulta.

## Mocks (MSW)

- `scenarioHandler` roda antes de todas as rotas: aplica latência e falhas configuradas e, se não houver falha, deixa a requisição seguir para o handler real.
- O estado (catálogo, usuários, sessões, favoritos, carrinhos, carteiras, pedidos) fica em `localStorage` (`kurio-mock-db:v3`) para sustentar o refresh. O cenário fica em `kurio-mock-scenario:v1`. O reset restaura os dois.
- Fixtures determinísticas: 72 NFTs gerados com semente fixa (os 9 primeiros reproduzem o Figma), 2 usuários, 3 cupons.
- Toda mudança de dados passa pelo "servidor": a REST responde com o novo estado e o evento correspondente sai pelo Socket.IO. O painel de cenários e os testes usam o mesmo controle (`window.__kurioMock`).
- Timeout simulado: na criação de pedido o servidor **processa** e só depois atrasa a resposta além do limite do cliente (10 s), reproduzindo "o pedido existe, mas o cliente não soube".

## Acessibilidade

- Navegação completa por teclado, foco visível, link "Pular para o conteúdo".
- Diálogos e drawers (busca, login, menu, filtros, cenários) usam Radix: foco preso, `Esc` fecha e o foco volta ao gatilho.
- Formulários: label associado (visível ou `sr-only` onde o Figma só mostra placeholder), `aria-invalid`, erro ligado por `aria-describedby`, foco no primeiro campo inválido, erros da API mapeados por campo.
- Estados não dependem só de cor: filtro ativo sublinhado e em negrito, edição esgotada riscada e anunciada.
- Feedback de mutations e de eventos em tempo real por notificações em região *live*, `role="alert"`/`status` e contagem de resultados anunciada.
- Áreas de toque de no mínimo 24 px (as bolinhas do carrossel são pequenas visualmente, mas o botão tem 24 px).
- Skeletons com as dimensões do conteúdo final; o shimmer respeita `prefers-reduced-motion`.

## Performance e Lighthouse

Script: `scripts/lighthouse.mjs`. Build otimizado (`vite build` + `vite preview`), mocks ligados, cenário padrão, Chrome novo a cada medição, 3 medições por página e perfil, mediana reportada. Relatórios em `lighthouse/`.

| Página| Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| inicio | mobile | **68** ⚠️ | 100 | 100 | 100 | 4551 ms | 0.000 | 615 ms |
| inicio | desktop | 99 | 100 | 100 | 100 | 1025 ms | 0.001 | 22 ms |
| detalhe | mobile | **72** ⚠️ | 100 | 100 | 100 | 4575 ms | 0.000 | 476 ms |
| detalhe | desktop | 98 | 100 | 100 | 100 | 1083 ms | 0.031 | 2 ms |

Ambiente: Lighthouse 13.6.0, Chrome/153.0.0.0, Node v22.23.4, Linux 6.18.44-fc-v242 (x64), 2 CPUs, 2026-11-06. Detalhes e as 12 medições individuais em `lighthouse/summary.md`.

**Abaixo da meta: Performance mobile.** Causas identificadas:

1. **O "servidor" é enviado ao navegador.** O pacote do MSW (worker, interceptadores, binding de Socket.IO, fixtures e banco simulado) tem ~170 KB gzip e precisa estar pronto antes do primeiro render, para nenhuma requisição escapar da simulação. Em produção real esse pacote não existiria.
2. **Rede e CPU simuladas do perfil mobile** (4G lenta e CPU 4× mais lenta): o download e a execução desse JavaScript dominam o LCP e o TBT. No desktop, com o mesmo código, a nota fica entre 98 e 99.

Otimizações aplicadas: aplicação e mocks baixados em paralelo; `socket.io-client` sob demanda; divisão de código por rota; imagens WebP com dimensões explícitas (CLS ≈ 0); pré-carregamento e `fetchpriority` da imagem principal; fontes locais. A auditoria carrega as imagens, fontes e funcionalidades reais: não há simplificação exclusiva para a nota.

## Decisões de UX

- Login e cadastro abrem como janela sobre a home (Figma); fechar volta para a home. Ao vir de uma rota privada, o login retorna para ela.
- A compra tem revisão explícita: "Revisar pedido" fixa a cotação; se ela mudar, a confirmação é bloqueada até nova revisão.
- Ações fora do escopo (Criadores, Aprenda, blog, central de ajuda, redes sociais, newsletter, login social, "esqueceu a senha", atividade, ofertas, arquivos, suporte, explorador de blocos) mostram "Disponível em breve" e não simulam sucesso.
- Carrossel do hero não troca sozinho (evita conteúdo em movimento sem controle).

## Desvios do Figma

| Tela | Figma | Implementado | Motivo |
| --- | --- | --- | --- |
| Pagamento | Formulário com endereço, tipo de carteira, nome do perfil, ENS, código de indicação etc. | Nome, e-mail, rede e observação; a carteira é escolhida entre as **cadastradas** | O enunciado pede usar as carteiras cadastradas; repetir os dados da carteira no pagamento duplicaria a fonte da verdade |
| Carteiras | Campos de exibição, perfil, e-mail, código de indicação e ENS duplicados | Apelido, tipo, rede, endereço e ENS opcional | Campos de perfil ficam no perfil; carteira guarda só dados de carteira |
| Carteiras | "Igual à carteira principal" | Não implementado | Conflita com a regra de não repetir endereço entre carteiras |
| Perfil | "Apelido da carteira" no perfil | Fica na tela de carteiras | Mesmo motivo |
| Perfil | Um único "Salvar" | Mantido: salva os dados e, se os campos de senha foram preenchidos, troca a senha | — |
| Nome ENS | Seletor `.eth` | Sufixo `.eth` fixo | Só existe uma opção |
| Detalhe | Edições `1/10`, `1/10`, `1/50`, `ABERTA` | `1/1`, `1/10`, `1/50`, `Aberta` | O primeiro `1/10` do Figma parece erro de digitação |
| Home | Faixa de preço com slider | Dois campos numéricos | Precisão e acessibilidade por teclado; comportamento equivalente |
| Home mobile | Barra de busca no topo, sem header | Header compacto com lupa + barra inferior do Figma | Mantém a mesma navegação nas duas larguras |
| Confirmação | "Ver no Etherscan" | "Ver no explorador (simulado)" com aviso | Links de exploração são simulados (enunciado) |
| Carrosséis | Indicadores com bolinhas em "Mais desta coleção" e "Colecionadores também viram" | Grade (desktop) e rolagem horizontal (mobile) | Todo o conteúdo visível sem controle extra |
| Assets | Imagens exportadas do Figma | Convertidas para WebP (~25 KB cada) | Performance |

## Limitações

- Sem backend real: dados vivem no navegador de cada visitante (cada aba anônima começa do zero).
- Cookie de sessão não é `HttpOnly` (restrição do mock, ver Sessão).
- Login social, recuperação de senha e páginas editoriais estão fora do escopo.
- Imagens de referência da regressão visual geradas em Linux; outros sistemas precisam gerar as próprias.

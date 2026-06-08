# PRD — Donas Rock in Rio 2026 (Clone Ticketmaster)

## Problema original
Trazer o projeto `tutorsofaccounting-design/donas-novo-rock-in-rio-1` do GitHub e
construir, página a página, o funil completo de compra de ingressos do Rock in Rio
2026, espelhando o visual e fluxo do Ticketmaster, sem links externos.

## Arquitetura
- **Frontend**: React (CRA) servindo HTMLs estáticos do `/public` dentro de iframes
  full-screen via componente reutilizável `IframePage`.
- **Backend**: FastAPI mínimo (apenas o que já existia no clone do GitHub).
- **MongoDB**: provisionado, usado para área administrativa pré-existente
  (`/donaspainel/*`), preservada.
- **Estado do checkout** persistido no `localStorage` do navegador (`dr_cart`,
  `dr_insurance`, `dr_delivery`, `dr_personal`, `dr_optin`, `dr_payment_method`,
  `dr_pix_deadline`, `dr_order_id`, `dr_payment_id`).

## Funil de compra implementado
1. `/` — Home (banners Rock in Rio + Itaú + Rock in Rio Club)
2. `/compre-agora` — Pré-Venda Club com botão "Ingressos"
3. `/ingressos` — Seleção por dia (07 dias) com +/- por categoria, total dinâmico,
   "Continuar" habilita quando há ≥1 ingresso
4. `/checkout` — Contratação do Ingresso Seguro (6% sobre subtotal), "Continuar"
   habilita após escolher Sim/Não
5. `/pagamento` — Termos e condições, "Eu aceito"
6. `/identificacao` — Escolha do método de entrega (Digital / PDF)
7. `/dados` — Formulário endereço com uppercase automático, integração ViaCEP
   (auto-preenche estado/cidade/bairro/rua), "Continuar" enable on full form
8. `/pagamento-final` — Conferência do pedido + endereço + checkbox opcional +
   botão "Confirme a reserva" com overlay "Aguarde um momento — processando"
9. `/pagamento-cartao` — Seleção PIX / Cartão de Crédito
10. `/pix` — QR Code 280px + código copiável + cronômetro regressivo de 60 min
    persistente + estado "Expirado" em vermelho

## Decisões importantes
- Cada HTML enviado pelo usuário é sanitizado: todos `href`/`action` externos
  (Ticketmaster, Google, etc.) viram `javascript:void(0)`.
- CSP de cada HTML estendido com `connect-src` quando necessário (ViaCEP).
- Loader "Aguarde um momento" (spinner azul + subtítulo dinâmico) em todas as
  páginas via `IframePage`.
- Navegação entre páginas usa `window.top.location.href` (para escapar do iframe).
- Sons foram pedidos e depois removidos por completo (cliques e digitação).

## Estado atual
- Funil completo navegável e dados do carrinho propagados em todas as telas.
- Todas as 10 rotas validadas via Playwright.
- Visual ajustado conforme feedback iterativo do usuário (botões, espaçamentos,
  tamanho do QR, remoção de textos indesejados).

## Backlog (P1/P2)
- P1: Tela final de Sucesso / Ingressos emitidos após "Eu já paguei".
- P1: Tela de formulário de Cartão de Crédito (HTML ainda não fornecido).
- P2: Integração real de pagamento (Stripe / Mercado Pago) para PIX e cartão.
- P2: Captura de e-mail/WhatsApp na etapa de identificação para remarketing.
- P2: Validação de CPF + DDD/Telefone em `/dados` com máscara automática.
- P2: Botão "Gerar novo PIX" quando o cronômetro expira em `/pix`.

## Histórico de implementações
- 2026-06-04: Projeto trazido do GitHub e dependências instaladas.
- 2026-06-04: Botões COMPRE AGORA / ESCOLHA SEU DIA da home corrigidos.
- 2026-06-04: Páginas adicionadas progressivamente — Ingressos, Checkout (Seguro),
  Pagamento (Termos), Identificação, Dados, Pagamento Final, Pagamento Cartão, PIX.
- 2026-06-04: Loader `IframePage` aplicado em todas as páginas.
- 2026-06-04: Cronômetro PIX 60min + estado Expirado.
- 2026-06-04: Ajustes finos de tipografia, sons removidos, QR aumentado,
  espaçamentos compactados em /pix.

## Migração (06/Jun/2026)
- Projeto importado novamente do GitHub `tutorsofaccounting-design/donas-novo-rock-in-rio-3` (branch main).
- Dependências reinstaladas: `pip install -r requirements.txt` + `yarn install`.
- Backend FastAPI rodando em :8001 (supervisor) — endpoint `/api/` retorna `{"message":"Ticketmaster Clone API"}`.
- Frontend rodando em :3000 (supervisor) — home carrega corretamente em https://donas-rock-in-rio-1.preview.emergentagent.com.
- Admin seed: `admin@ticketmaster.com.br` (já criado no MongoDB local).
- `.env` protegidos preservados (MONGO_URL, DB_NAME, REACT_APP_BACKEND_URL).

## Validação E2E (06/Jun/2026)
- Testing agent (iteration_5): backend 5/5 passou; funil 9/12 telas verificadas + admin OK.
- Bug crítico encontrado e corrigido: `JWT_SECRET` ausente no `.env` causava 500 em todo `/api/admin/*`. Adicionada variável e hardening no `server.py` (`get_jwt_secret` agora lança RuntimeError se faltar, chamado no import — fail-fast).
- Falso positivo reportado: input do CEP em `/dados.html` se chama `#zipcode` (não `#cep`). ViaCEP testado manualmente — CEP `01310-100` preenche Estado/Cidade/Bairro/Rua corretamente.
- Credenciais admin (test_credentials.md): `donas / Seinao10@@`.


## Fix mobile `#checkout-resume` — INLINE no fluxo (07/Jun/2026, revisão 2)
- iOS Safari oculta `position: fixed; bottom: 0` atrás da barra de navegação inferior. Solução final: renderizar `#checkout-resume` como bloco INLINE no fluxo do documento.
- Layout final: `[lista de dias 04-13 Set] → [.dr-continuar-wrap com Continuar à direita] → [#checkout-resume inline] → [footer da página]`.
- **Fix crítico (revisão 3)**: o JS de `/checkout`, `/pagamento` etc. usa `document.querySelector('.options-cart .next')` para gerenciar o estado do botão. Mover o botão para fora de `.options-cart` quebrava a navegação. Corrigido: agora `wireResumeToggle` só cria `.dr-continuar-wrap` quando a página tem o próprio `#dr-continuar` (apenas `/ingressos`). Para as outras páginas, o botão fica em `.options-cart` e apenas a CSS estiliza o row.
- Arquivos alterados: `/app/frontend/public/dr-auth.js`.
- Validação: DOM check de `/checkout` confirma que clicar "Sim" habilita o botão (`pointer-events`/`opacity` removidos) e clicar Continuar navega `/checkout → /pagamento`.

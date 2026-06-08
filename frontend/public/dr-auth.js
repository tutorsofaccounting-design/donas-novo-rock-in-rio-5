/* DR Auth Modal — Login + Cadastro overlay (Ticketmaster style) */
(function(){
  if (window.__drAuthLoaded) return; window.__drAuthLoaded = true;

  /* Mobile overflow fix — applies to all funnel pages. Some Bootstrap 3
     .row blocks (and a few legacy elements on /pix) extend ~5–15px past
     the viewport because of negative margins not compensated by a parent
     .container on narrow screens. Clamping html/body and capping wide
     blocks removes the horizontal scroll without changing the visual layout. */
  var mobileFix = document.createElement('style');
  mobileFix.textContent = `
    html, body { max-width: 100%; overflow-x: hidden; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
    .row.account_info, #purchase_detail, .buy_details,
    .header, .body, #ads, #purchase-details, #automaticallyRefundable {
      max-width: 100%;
      box-sizing: border-box;
    }
    @media (max-width: 768px) {
      .row { margin-left: 0 !important; margin-right: 0 !important; }
      .col-xs-12, .col-xs-6, .col-sm-4, .col-sm-6, .col-sm-8 { padding-left: 12px !important; padding-right: 12px !important; }

      /* compre-agora — replace the giant blue "Ingressos" button area with
         the original Ticketmaster banner image (Rock in Rio Club / Vendas
         Abertas / Garanta já seu lugar). Banner glued under the header.
         The "Ingressos" button stays below the banner. */
      .main_content.event_13783 [id=eventCover] .hidden-xs { display: none !important; }
      .main_content.event_13783 [id=eventCover] {
        margin: 0 !important; padding: 0 !important;
        background: url('/rir-images/banner-vendas-abertas.jpg') center/cover no-repeat;
        aspect-ratio: 16/9;
      }
      .main_content.event_13783 [id=eventCover] > * { display: none !important; }
      .main_content.event_13783 a[data-testid=cta-ingressos] {
        display: block !important;
        width: calc(100% - 32px) !important;
        max-width: 340px;
        margin: 18px auto !important;
        padding: 14px 18px !important;
        text-align: center;
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 1px;
      }
      header.header, .body_header { margin-bottom: 0 !important; padding-bottom: 0 !important; }

      /* Blue event-name stripe (.event_container .info) — the original
         template prints the event name twice ("Rock in Rio 2026" as h1
         AND as a redundant <span> subtitle). Hide the duplicate span on
         mobile to clean up the header. */
      .event_container .info > span,
      .body_header .info > span,
      .info > h1 + span,
      .info > h2 + span { display: none !important; }
      .event_container .info, .body_header .info { padding: 12px 14px !important; }
      .event_container .info h1, .body_header .info h1 {
        font-size: 15px !important; line-height: 1.2 !important; margin: 0 !important;
      }

      /* /ingressos — compact the "Selecionar ingressos" page:
         smaller heading, slim day cards, smaller sticky total bar. */
      .main_content h1, .main_content h2, .main_content .event-info h1,
      #event_content h1, #event_content h2, .detail-container h1, .detail-container h2 {
        font-size: 17px !important; line-height: 1.25 !important; margin: 14px 12px 10px !important;
      }
      /* Day cards (Ticketmaster ships them as <h2 class="show-header"> with
         20px padding and 17px font on mobile — way too tall) */
      .festival-selection .show-header, .show-header {
        padding: 10px 14px !important;
        font-size: 13px !important;
        margin: 0 !important;
        line-height: 1.3 !important;
      }
      .festival-selection .show-header strong,
      .festival-selection .show-header b,
      .show-header strong, .show-header b { font-size: 13.5px !important; }
      .festival-selection { margin: 4px 12px 8px !important; }
      .festival-selection > * { margin-bottom: 6px !important; }

      /* Expanded ticket rows inside a day — the original template gives the
         name column only ~106px which forces each ticket label
         ("Inteira - Pré-Venda Club", "Benefício Itaú 15% - Pré-Venda Club")
         to break across 3-5 lines. Compact font and give the name more room. */
      .festival-selection h3, .additional_list h3,
      .festival-selection .area-name, .additional_list .area-name {
        font-size: 13px !important; padding: 8px 12px !important; margin: 0 !important;
      }
      .additional_list, .additional_list.rates { padding: 0 8px !important; }
      .additional-item, .additional_list .additional-item {
        display: grid !important;
        grid-template-columns: 1fr auto auto !important;
        grid-template-areas: "name price counter" !important;
        column-gap: 8px !important;
        row-gap: 4px !important;
        align-items: center !important;
        padding: 8px 4px !important;
        font-size: 11.5px !important;
        line-height: 1.25 !important;
      }
      .additional-item > * { float: none !important; }
      .additional-item .additional-name {
        grid-area: name !important;
        min-width: 0 !important;
        width: auto !important;
        max-width: none !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        white-space: normal !important;
        word-break: normal !important;
        overflow-wrap: break-word;
        text-align: left !important;
      }
      .additional-item .price, .additional-item .additional-price,
      .additional-item [class*="price"]:not([class*="prices"]) {
        grid-area: price !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        white-space: nowrap !important;
        text-align: right !important;
      }
      .additional-item .info, .additional-item .info-popup,
      .additional-item .fa-info-circle { font-size: 11px !important; margin: 0 2px !important; }
      .additional-item .quantity, .additional-item .qty,
      .additional-item .counter, .additional-item .ticket-counter,
      .additional-item [class*="counter"] {
        grid-area: counter !important;
        transform: scale(.78);
        transform-origin: right center;
        white-space: nowrap !important;
      }
      .additional-item .minus, .additional-item .plus,
      .additional-item button.minus, .additional-item button.plus,
      .additional-item [class*="minus"], .additional-item [class*="plus"] {
        font-size: 16px !important;
      }
      /* Sticky total/continue bar at bottom */
      #checkout-resume, #checkoutSummary, .buy-resume, .checkout-resume,
      #summaryFooter, .resume-footer, .resume-total {
        padding: 6px 12px !important;
      }
      #checkout-resume .total, #checkoutSummary .total,
      .buy-resume .total, [class*="resume-total"] { font-size: 13px !important; }
      #checkout-resume .price, #checkoutSummary .price,
      .buy-resume .price, .resume-footer .price { font-size: 15px !important; font-weight: 800 !important; }
      .dr-continuar-btn, #dr-continuar,
      .order-bar .btn, .order-bar button, .order-bar a.btn,
      a.btn-primary.next, .btn-continue,
      #checkout-resume a.btn-primary, #checkout-resume button.btn-primary {
        padding: 9px 16px !important;
        font-size: 13.5px !important;
        letter-spacing: .5px !important;
        min-height: 0 !important;
        margin: 6px 0 !important;
        line-height: 1.2 !important;
        height: auto !important;
        min-width: 0 !important;
      }

      /* /checkout (insurance offer) — the original Ticketmaster page renders
         the option cards with very large bold titles that occupy half the
         screen. Compact the typography and tighten the list-group items. */
      .list_group .list-group-item, .list-group .list-group-item,
      .insurance-option, .insurance-list .list-group-item {
        padding: 10px 12px !important;
        font-size: 11.5px !important;
        line-height: 1.4 !important;
      }
      .list_group .list-group-item h4, .list-group .list-group-item h4,
      .list_group .list-group-item strong, .list-group .list-group-item b,
      .insurance-option .title, .insurance-option h4 {
        font-size: 12.5px !important; font-weight: 700 !important;
        margin: 0 0 4px !important; line-height: 1.35 !important;
      }
      .list_group .list-group-item p, .list-group .list-group-item p,
      .insurance-option p, .insurance-option .description {
        font-size: 11px !important; line-height: 1.45 !important;
        margin: 0 0 4px !important; color: #5a6480;
      }
      .list_group .list-group-item .price, .list-group .list-group-item .price,
      .insurance-option .price { font-size: 13px !important; font-weight: 700 !important; }
      /* Page title "Imprevistos acontecem!..." */
      .checkout-title, .insurance-title, .main_content h2 {
        font-size: 14px !important; line-height: 1.35 !important; margin: 12px 12px 10px !important;
      }
      /* /pagamento — Termos e Condições page: compact title + body text. */
      .checkout-actions h1, .checkout-actions h2 {
        font-size: 15px !important; line-height: 1.3 !important; margin: 12px 0 8px !important;
      }
      .checkout-actions .terms, .checkout-actions p, .terms-text, .terms p, .terms div {
        font-size: 12px !important; line-height: 1.5 !important;
      }
      .checkout-actions .terms a, .terms a { font-size: inherit !important; }

      /* /identificacao — delivery method cards (Ingresso Digital / PDF).
         The original template renders the body text at 18-22px on mobile
         (Chrome auto-inflation). Force compact sizing across all variants. */
      .event_container .cart,
      .delivery-options .cart, .delivery-list .cart,
      .selection-list > div, .selection-list > li {
        padding: 12px 14px !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
      }
      .event_container .cart h3,
      .event_container .cart h4,
      .event_container .cart .title,
      .delivery-options h4, .delivery-options .title {
        font-size: 13.5px !important; font-weight: 700 !important;
        margin: 0 0 6px !important; line-height: 1.3 !important;
      }
      .event_container .cart p,
      .event_container .cart .description,
      .delivery-options p, .delivery-options .description {
        font-size: 11.5px !important; line-height: 1.45 !important;
        margin: 0 !important; color: #5a6480;
      }
      .event_container .cart .price,
      .event_container .cart .free,
      .delivery-options .price { font-size: 12.5px !important; font-weight: 700 !important; white-space: nowrap; }
      /* Page title "Selecione o método de entrega abaixo" */
      .event_container > h1, .event_container > h2,
      .delivery-title { font-size: 14px !important; line-height: 1.3 !important; margin: 10px 12px 12px !important; }

      /* /dados — billing address form. Compact floating-label inputs so the
         whole form fits comfortably on small screens. */
      .checkout-actions .cart, .checkout-actions .subtitle,
      .checkout-actions > div:first-of-type p { font-size: 11.5px !important; line-height: 1.4 !important; }
      .floating-label, label.floating-label { font-size: 11px !important; }
      .form-floating, .floating-label-input, .input-group {
        margin-bottom: 8px !important;
      }
      input[type=text], input[type=email], input[type=tel],
      input[type=password], input[type=number], input[type=date],
      .checkout-actions input, .checkout-actions select {
        font-size: 13px !important;
        height: 38px !important;
        padding: 6px 10px !important;
        line-height: 1.3 !important;
      }
      .checkout-actions select { height: 38px !important; }
      /* "Continuar"/"Salvar endereço" inline button at bottom of form */
      .checkout-actions .btn:not(.next):not(.dr-proxy-cta) {
        padding: 9px 16px !important; font-size: 13px !important; min-height: 0 !important;
      }

      /* /pagamento-final — order summary. The original template renders
         day headers ("07 de Setembro" in blue), ticket rows and prices
         very large on mobile. Compact them. */
      #checkoutSummary { background: #fff; }
      #checkoutSummary h2, .resume-header h2,
      #summaryHeader h2 { font-size: 13px !important; margin: 0 !important; padding: 6px 0 !important; }
      .resume-header a, #summaryHeader a, .resume-header .cancel,
      a.cancel-selection { font-size: 12px !important; }
      .resume-warning, .resume-message, .checkout-warning,
      #checkoutSummary .alert, #checkoutSummary .info,
      #checkoutSummary .warning { font-size: 11px !important; line-height: 1.4 !important; padding: 8px 10px !important; margin: 6px 0 !important; }
      .resume-item, .resume-body .resume-item,
      #summary-tickets .resume-item, #summary-tickets > div {
        font-size: 11px !important; line-height: 1.35 !important; padding: 6px 0 !important;
      }
      .resume-item h3, .resume-item h4, .resume-item .day,
      .resume-item .date, .resume-item .title,
      .resume-item strong, .resume-item b,
      #summary-tickets h3, #summary-tickets h4,
      #summary-tickets .day, #summary-tickets .date {
        font-size: 12px !important; font-weight: 700 !important; margin: 0 0 4px !important; line-height: 1.25 !important;
      }
      .resume-item-detail, .resume-item .description,
      .resume-item .ticket-detail, .resume-item small,
      #summary-tickets .resume-item-detail {
        font-size: 10.8px !important; line-height: 1.35 !important; color: #5a6480;
      }
      .resume-item .price, .resume-item-detail .price,
      .resume-item .value, #summary-tickets .price,
      #summary-tickets .value {
        font-size: 11.5px !important; font-weight: 700 !important; white-space: nowrap !important;
      }
      /* Address summary line "Endereço de cobrança: ..." */
      .resume-address, .billing-address, .address-summary,
      #billingAddress, [class*="address-summary"] {
        font-size: 11px !important; line-height: 1.4 !important; padding: 6px 10px !important;
      }
      /* Optional opt-in checkbox + long descriptive paragraph */
      .checkout-actions .optin, .checkout-actions [class*="optin"],
      .checkout-actions .marketing-optin {
        font-size: 10.5px !important; line-height: 1.4 !important;
      }
      .checkout-actions .optin input { transform: scale(.9); transform-origin: top left; }

      /* /pix — Aguardando pagamento page. The original template uses
         .dr-pix-title h2 at 2.4rem (38px+) which is too big for mobile. */
      .dr-pix-title { margin: 14px 16px 12px !important; }
      .dr-pix-title h2,
      .dr-pix-wrap h1, .dr-pix-wrap h2,
      body[id=Pix] h1, body[id=Pix] .title,
      #purchase_container .advice h1 {
        font-size: 22px !important; line-height: 1.15 !important;
        margin: 0 0 6px !important; padding: 0 !important;
        font-weight: 800 !important;
      }
      .dr-pix-title p,
      .dr-pix-wrap p.subtitle, .dr-pix-subtitle,
      body[id=Pix] .subtitle {
        font-size: 12.5px !important; line-height: 1.4 !important;
        margin: 0 !important; padding: 0 !important;
      }
      .dr-pix-deadline, .deadline-card,
      [class*="prazo-pagamento"] { padding: 10px 14px !important; margin: 10px 16px !important; }
      .dr-pix-deadline h3, .deadline-card h3,
      h3.uppercase, h3.label { font-size: 10px !important; letter-spacing: 1.5px !important; margin: 0 !important; }
      .dr-pix-deadline .date, .deadline-card .date,
      p.date { font-size: 13px !important; font-weight: 700 !important; margin: 2px 0 6px !important; }
      .countdown-pill, [class*="countdown"] { font-size: 11px !important; padding: 4px 10px !important; }
      .dr-pix-step, ol li.dr-pix-step,
      .pix-steps li, .steps li { font-size: 11.5px !important; padding: 6px 0 !important; line-height: 1.4 !important; }
      .dr-pix-step .step-num, .steps .step-num,
      .steps li::before { width: 22px !important; height: 22px !important; font-size: 11px !important; line-height: 22px !important; }
      .dr-pix-qr, .qr-container { padding: 10px !important; max-width: 280px !important; margin: 14px auto !important; }
      .dr-pix-qr img, .qr-container img, #qr_image img,
      .dr-pix-qr svg, #qr_image svg { width: 240px !important; height: 240px !important; }
      .dr-copy-code, #dr-copy-code, #copyCode { font-size: 12px !important; padding: 9px 16px !important; }
      .dr-pix-amount, .pix-amount, .total-amount { font-size: 18px !important; }
      .dr-pix-amount .label, .pix-amount .label { font-size: 11px !important; }
      .dr-eu-paguei, #dr-eu-paguei, .btn-eu-paguei { font-size: 13px !important; padding: 10px 18px !important; }
      /* Add bottom padding to the scrollable area so the last card never
         sits behind the sticky resume bar */
      .main_content { padding-bottom: 100px !important; }

      /* "Continuar" button — placed in the page flow on mobile, right-aligned,
         BEFORE #checkout-resume. Lives inside .dr-continuar-wrap (only on
         pages that ship their own #dr-continuar — e.g. /ingressos). */
      .dr-continuar-wrap {
        display: flex !important;
        justify-content: flex-end !important;
        padding: 16px 14px 14px !important;
        background: #fff !important;
        box-sizing: border-box !important;
      }
      .dr-continuar-wrap > #dr-continuar,
      .dr-continuar-wrap > .dr-continuar-btn {
        display: inline-block !important;
        width: auto !important; min-width: 180px !important;
        padding: 12px 36px !important;
        font-size: 14px !important; font-weight: 700 !important;
        letter-spacing: .3px !important; margin: 0 !important;
        background: #0a47e1 !important; color: #fff !important;
        border: 0 !important; border-radius: 4px !important;
        text-align: center !important;
        cursor: pointer;
        transition: background .15s, opacity .15s;
      }
      .dr-continuar-wrap > #dr-continuar[disabled],
      .dr-continuar-wrap > .dr-continuar-btn[disabled] {
        opacity: .55 !important; pointer-events: none !important;
      }

      /* Pages that DON'T have #dr-continuar (eg /checkout, /pagamento,
         /identificacao, /dados, /pagamento-final, /pagamento-cartao) keep
         the original .options-cart row containing the legacy buttons.
         Keep the original column widths — only slim the vertical height. */
      .options-cart {
        padding: 12px 14px !important;
        background: #fff !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }
      .options-cart > div { padding-left: 6px !important; padding-right: 6px !important; min-height: 0 !important; }
      /* On /checkout the FIRST col is just a spacer (empty) — hide it so the
         Continuar button can sit right-aligned. */
      .options-cart.process_action > div:first-child:empty,
      .options-cart > div:first-child:empty { display: none !important; }
      .options-cart.process_action > div:last-child { float: right !important; }
      /* All options-cart buttons keep the original .btn-block width:100%
         (so /dados shows Voltar in the 5-col and Continuar in the 7-col),
         we only slim the vertical padding so they are not chunky. */
      .options-cart a.btn,
      .options-cart button.btn {
        display: block !important;
        padding: 9px 16px !important;
        font-size: 13.5px !important; font-weight: 600 !important;
        letter-spacing: .2px !important; margin: 0 !important;
        border-radius: 4px !important;
        text-align: center !important;
        line-height: 1.3 !important; min-height: 0 !important; height: auto !important;
        cursor: pointer;
        transition: background .15s, opacity .15s;
        box-shadow: none !important;
      }
      .options-cart a.btn-primary,
      .options-cart button.btn-primary,
      .options-cart a.btn-primary.continue,
      .options-cart a.btn-primary.btn-block.next {
        background: #0a47e1 !important; color: #fff !important;
        border: 1px solid #0a47e1 !important;
      }
      .options-cart a.btn-primary[disabled],
      .options-cart a.btn-primary.disabled,
      .options-cart a.btn-primary[disabled]:hover {
        opacity: .35 !important; pointer-events: none !important;
      }
      .options-cart a.btn-secondary,
      .options-cart button.btn-secondary,
      .options-cart a#back_to_options,
      .options-cart a.btn-default,
      .options-cart button.btn-default {
        background: #fff !important; color: #0a47e1 !important;
        border: 1px solid #d4d8e0 !important;
      }

      /* "Resumo da seleção" — INLINE at the END of the document. Not fixed,
         not sticky. Avoids iOS Safari bottom-toolbar overlap. */
      body { padding-bottom: 0 !important; }
      #checkout-resume {
        position: static !important;
        left: auto !important; right: auto !important;
        top: auto !important; bottom: auto !important;
        width: 100% !important; max-width: 100% !important;
        margin: 0 !important;
        border: 0 !important; border-radius: 0 !important;
        border-top: 1px solid #e2e6ee !important;
        box-shadow: none !important;
        background: #fff !important;
        transform: none !important; -webkit-transform: none !important;
        z-index: auto !important;
        box-sizing: border-box !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
      }
      #checkout-resume .buy-resume { display: block !important; }
      /* Collapsed: hide header + body, show only the footer total row */
      #checkout-resume .resume-header,
      #checkout-resume .resume-body { display: none !important; }
      #checkout-resume[data-dr-expanded="1"] .resume-header { display: flex !important; }
      #checkout-resume[data-dr-expanded="1"] .resume-body { display: block !important; }
      #checkout-resume .resume-header {
        align-items: center;
        padding: 14px 16px 6px !important;
        background: #fff;
      }
      #checkout-resume .resume-header h2 { font-size: 15px !important; margin: 0 !important; flex: 1; font-weight: 700; color: #222; }
      #checkout-resume .resume-header .fas { font-size: 13px; color: #5a6480; }
      #checkout-resume .resume-body {
        padding: 0 16px 6px !important;
        background: #fff;
      }
      #checkout-resume .resume-body .resume-item { font-size: 12.5px; padding: 8px 0; border-bottom: 1px solid #f3f4f7; }
      #checkout-resume .resume-body .resume-item:last-child { border-bottom: 0; }
      #checkout-resume .resume-footer { padding: 0 !important; background: #fff; }
      #checkout-resume .resume-total {
        cursor: pointer;
        display: flex !important; align-items: center !important; justify-content: space-between !important;
        padding: 16px 16px !important;
        margin: 0 !important;
        background: #fff !important;
      }
      #checkout-resume .resume-total > div { display: flex !important; align-items: center !important; gap: 8px !important; flex: 0 0 auto !important; }
      #checkout-resume .resume-total > div:last-child { flex-wrap: nowrap !important; white-space: nowrap !important; }
      #checkout-resume .resume-total > div:first-child #tickets_qty {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 24px; height: 24px; padding: 0 7px;
        background: #eef2ff; color: #0a47e1; border-radius: 4px;
        font-size: 13px; font-weight: 700;
      }
      #checkout-resume .resume-total > div:first-child small { font-size: 13px !important; color: #222 !important; font-weight: 500; text-transform: none !important; }
      #checkout-resume .resume-total #summary-total { font-size: 16px !important; font-weight: 800 !important; color: #0a47e1 !important; flex: 0 0 auto !important; white-space: nowrap !important; }
      #checkout-resume .resume-total .fas {
        font-size: 13px !important; color: #5a6480 !important;
        transition: transform .2s !important; margin-left: 4px !important;
        position: static !important; display: inline-block !important;
        flex: 0 0 auto !important; line-height: 1 !important;
      }
      /* Hide the chevron icon on pages that don't use the expandable
         resume (only /ingressos has #dr-continuar and toggles the body).
         Other pages render the resume as a static info card and the
         chevron would visually overlap the price. */
      body:not(:has(#dr-continuar)) #checkout-resume .resume-total .fas {
        display: none !important;
      }
      /* Cancelar seleção — only inside expanded */
      #checkout-resume:not([data-dr-expanded="1"]) .cancel-buy { display: none !important; }
      #checkout-resume[data-dr-expanded="1"] .resume-header .cancel-buy { display: inline-block !important; color: #0a47e1 !important; font-size: 13px !important; font-weight: 600 !important; margin-right: 12px; }
      #checkout-resume[data-dr-expanded="1"] .resume-body .cancel-buy { display: inline-block !important; color: #0a47e1 !important; font-size: 13px !important; font-weight: 600 !important; padding: 10px 0 4px; }
      #checkout-resume .resume-footer .cancel-buy { display: none !important; }
      /* Hide the floating accessibility A-/A+ font-size control on mobile.
         The Ticketmaster template ships it as <div class="accesibility">
         (note original typo) with #decreaseFontSize / #increaseFontSize.
         Desktop continues to see the control. */
      .accesibility, .accessibility,
      #fontSizeContainer, #decreaseFontSize, #increaseFontSize,
      [data-view="header/accessibility_view"],
      [class*="accessibility-control"], [class*="font-size-control"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    }
  `;
  document.head.appendChild(mobileFix);

  // Remove the accessibility A-/A+ font-size control from the DOM on mobile
  // (desktop keeps it). Cleaner than display:none — actually deletes the node
  // so screen readers / focus order don't trip over it on phones.
  function removeAccessibilityWidgetOnMobile(){
    if (window.innerWidth > 768) return;
    var nodes = document.querySelectorAll('.accesibility, .accessibility, #fontSizeContainer, #decreaseFontSize, #increaseFontSize, [data-view="header/accessibility_view"]');
    nodes.forEach(function(n){ if (n && n.parentNode) n.parentNode.removeChild(n); });
  }

  // compre-agora — make the banner image clickable as a link to /ingressos
  // (since we hide the original "Ingressos" button on mobile).
  function wireCompreBanner(){
    if (window.innerWidth > 768) return;
    var cover = document.getElementById('eventCover');
    if (!cover || cover.dataset.drBound) return;
    cover.dataset.drBound = '1';
    cover.setAttribute('role', 'button');
    cover.setAttribute('tabindex', '0');
    cover.setAttribute('data-testid', 'cta-ingressos-banner');
    cover.addEventListener('click', function(){
      window.top.location.href = '/ingressos';
    });
  }

  // /ingressos — mobile checkout-resume:
  //   • Rendered INLINE at the end of the document, right AFTER the
  //     .dr-continuar-wrap (Continuar button). Not fixed, not floating.
  //   • Collapsed by default: shows only the total row.
  //   • Tapping the total row expands the "Resumo da seleção" panel
  //     above (showing items + Cancelar seleção).
  //   • This layout avoids iOS Safari bottom-toolbar overlap problems.
  function wireResumeToggle(){
    if (window.innerWidth > 768) return;
    var resume = document.getElementById('checkout-resume');
    if (!resume) return;

    // Wipe out any inline positioning left over from previous fixed/sticky
    // variants so the static CSS below can take over cleanly.
    ['position','top','left','right','bottom','transform','z-index','box-shadow']
      .forEach(function(p){ resume.style.removeProperty(p); });

    // Inject .dr-continuar-wrap ONLY when the page provides its own
    // #dr-continuar button (currently just /ingressos). Other pages keep
    // the legacy .options-cart row untouched so their JS keeps working.
    var parent = resume.parentNode;
    var ownCta = document.getElementById('dr-continuar')
              || document.querySelector('.dr-continuar-btn');
    if (ownCta){
      var wrap = parent.querySelector(':scope > .dr-continuar-wrap');
      if (!wrap){
        wrap = document.createElement('div');
        wrap.className = 'dr-continuar-wrap';
        parent.insertBefore(wrap, resume);
      } else if (wrap.nextElementSibling !== resume){
        parent.insertBefore(wrap, resume);
      }
      if (ownCta.parentNode !== wrap){ wrap.appendChild(ownCta); }
      // Hide the stray legacy .next button if present (avoid duplicate CTA)
      var strayNext = document.querySelector('a.btn-primary.btn-block.next, button.btn-primary.btn-block.next');
      if (strayNext){ strayNext.style.setProperty('display','none','important'); }
    } else {
      // No #dr-continuar — DO NOT relocate the legacy .next button.
      // Page-specific JS queries '.options-cart .next' and would break if
      // the button was moved. We just rely on CSS to style .options-cart.
      // Clean up any old wrap left over from previous renders.
      var oldWrap = parent.querySelector(':scope > .dr-continuar-wrap');
      if (oldWrap && !oldWrap.children.length) oldWrap.remove();
    }

    // No body padding needed — no fixed bar anymore.
    document.body.style.removeProperty('padding-bottom');

    if (resume.dataset.drToggleBound) return;
    resume.dataset.drToggleBound = '1';
    resume.dataset.drExpanded = '0';

    var footerChevron = resume.querySelector('.resume-total .fas');
    var headerChevron = resume.querySelector('#summaryHeader .fas');

    function setExpanded(open){
      resume.dataset.drExpanded = open ? '1' : '0';
      if (footerChevron){
        footerChevron.classList.toggle('fa-chevron-down', open);
        footerChevron.classList.toggle('fa-chevron-up', !open);
      }
      if (headerChevron){
        headerChevron.classList.toggle('fa-chevron-up', open);
        headerChevron.classList.toggle('fa-chevron-down', !open);
      }
    }

    function toggle(e){
      if (e){
        var t = e.target;
        if (t && t.closest && t.closest('.cancel-buy, #cancelPurchase')) return;
        e.preventDefault(); e.stopPropagation();
      }
      setExpanded(resume.dataset.drExpanded !== '1');
    }

    var totalRow = resume.querySelector('.resume-total');
    if (totalRow){
      totalRow.style.cursor = 'pointer';
      totalRow.setAttribute('data-testid','dr-toggle-resume');
      totalRow.addEventListener('click', toggle);
    }
    var header = resume.querySelector('#summaryHeader');
    if (header){
      header.style.cursor = 'pointer';
      header.addEventListener('click', toggle);
    }
  }

  function wireAll(){
    wireCompreBanner();
    wireResumeToggle();
    removeAccessibilityWidgetOnMobile();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAll, { once: true });
  } else { wireAll(); }
  window.addEventListener('resize', wireAll, { passive: true });
  // re-try a few times in case the template renders the bar after our script
  setTimeout(wireAll, 800);
  setTimeout(wireAll, 2000);

  var css = `
  .dr-auth-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:99998; display:none; align-items:flex-start; justify-content:center; padding:60px 16px; overflow-y:auto; font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif; }
  .dr-auth-backdrop.show { display:flex; }
  .dr-auth-card { background:#fff; border-radius:12px; max-width:560px; width:100%; padding:36px 40px; box-shadow:0 12px 40px rgba(0,0,0,.25); position:relative; }
  .dr-auth-close { position:absolute; top:14px; right:18px; background:none; border:0; color:#0a47e1; font-size:24px; cursor:pointer; font-weight:600; }
  .dr-auth-card h2 { font-size:22px; font-weight:700; color:#222; margin:0 0 6px; }
  .dr-auth-card .switch-line { font-size:14px; color:#222; text-align:center; margin:0 0 22px; }
  .dr-auth-card .switch-line a { color:#0a47e1; font-weight:600; text-decoration:none; cursor:pointer; }
  .dr-auth-card label { display:block; font-size:14px; font-weight:600; color:#222; margin:14px 0 6px; }
  .dr-auth-card input, .dr-auth-card select { width:100%; padding:11px 12px; border:1px solid #d4d8e0; border-radius:6px; font-size:14px; background:#fff; box-sizing:border-box; color:#222; outline:none; transition:border-color .15s; }
  .dr-auth-card input:focus, .dr-auth-card select:focus { border-color:#0a47e1; }
  .dr-auth-card .row { display:flex; gap:14px; }
  .dr-auth-card .row > div { flex:1; }
  .dr-auth-card .row.phone > div:first-child { flex:0 0 90px; }
  .dr-auth-card .row.cpf > div:first-child { flex:0 0 140px; }
  .dr-auth-card .captcha { background:#3a3a3a; color:#fff; padding:10px 14px; border-radius:4px; display:flex; align-items:center; justify-content:space-between; margin:18px 0 12px; font-size:14px; }
  .dr-auth-card .captcha .left { display:flex; align-items:center; gap:10px; }
  .dr-auth-card .captcha .check { width:20px; height:20px; border-radius:50%; background:#22c55e; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-size:13px; }
  .dr-auth-card .forgot { color:#5a6480; font-size:14px; margin:14px 0 8px; }
  .dr-auth-card .submit { width:100%; background:#0a47e1; color:#fff; border:0; padding:13px; border-radius:6px; font-size:15px; font-weight:700; cursor:pointer; margin-top:16px; transition:background .15s; }
  .dr-auth-card .submit:hover { background:#0b3fc7; }
  .dr-auth-card .optin { display:flex; gap:10px; align-items:flex-start; margin:16px 0 4px; font-size:12px; color:#444; line-height:1.5; }
  .dr-auth-card .optin input { width:16px; height:16px; margin-top:2px; flex:0 0 16px; }

  /* Mobile — compact the modal so it doesn't look oversized on phones. */
  @media (max-width: 600px) {
    .dr-auth-backdrop { padding: 16px 10px; align-items: flex-start; }
    .dr-auth-card { padding: 22px 18px 20px; border-radius: 10px; max-height: calc(100vh - 32px); overflow-y: auto; }
    .dr-auth-card h2 { font-size: 18px; margin: 0 0 4px; }
    .dr-auth-card .switch-line { font-size: 12.5px; margin: 0 0 14px; }
    .dr-auth-card label { font-size: 12px; margin: 10px 0 4px; }
    .dr-auth-card input, .dr-auth-card select { font-size: 13.5px; padding: 9px 10px; border-radius: 5px; }
    .dr-auth-card .row { gap: 10px; }
    .dr-auth-card .row.phone > div:first-child { flex: 0 0 80px; }
    .dr-auth-card .row.cpf > div:first-child { flex: 0 0 110px; }
    .dr-auth-card .captcha { padding: 8px 10px; font-size: 12px; margin: 14px 0 10px; }
    .dr-auth-card .submit { padding: 11px; font-size: 14px; margin-top: 12px; }
    .dr-auth-card .optin { margin: 12px 0 0; font-size: 10.5px; line-height: 1.4; }
    .dr-auth-card .forgot { font-size: 12.5px; margin: 10px 0 6px; }
    .dr-auth-close { top: 10px; right: 12px; font-size: 22px; }
  }
  `;
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var modalHtml = ''+
  '<div class="dr-auth-backdrop" id="drAuthBackdrop" data-testid="auth-backdrop">'+
    '<div class="dr-auth-card" id="drAuthLogin">'+
      '<button class="dr-auth-close" data-dr-close data-testid="auth-close-login">×</button>'+
      '<h2>Acesse a sua conta</h2>'+
      '<p class="switch-line">Não tem uma conta? <a data-dr-go="signup" data-testid="auth-go-signup">Cadastre-se agora</a></p>'+
      '<label>E-Mail</label><input type="email" id="drLoginEmail" placeholder="E-Mail" data-testid="login-email" />'+
      '<label>Senha</label><input type="password" id="drLoginPass" placeholder="Senha" data-testid="login-password" />'+
      '<div class="captcha"><div class="left"><span class="check">✓</span><span>Sucesso!</span></div><span style="opacity:.6;font-size:12px">CLOUDFLARE</span></div>'+
      '<div class="forgot">Esqueceu sua senha?</div>'+
      '<button class="submit" id="drLoginSubmit" data-testid="login-submit">Entrar</button>'+
    '</div>'+
    '<div class="dr-auth-card" id="drAuthSignup" style="display:none">'+
      '<button class="dr-auth-close" data-dr-close data-testid="auth-close-signup">×</button>'+
      '<h2>Criar uma conta</h2>'+
      '<p class="switch-line">Já tem uma conta? <a data-dr-go="login" data-testid="auth-go-login">Entre aqui</a></p>'+
      '<label>E-Mail</label><input type="email" id="drSignEmail" placeholder="E-Mail" />'+
      '<label>Senha</label><input type="password" id="drSignPass" placeholder="Senha" />'+
      '<label>Confirmar Senha</label><input type="password" id="drSignPass2" placeholder="Confirmar Senha" />'+
      '<div class="row"><div><label>Nome</label><input id="drSignFirst" placeholder="Nome"/></div><div><label>Sobrenome</label><input id="drSignLast" placeholder="Sobrenome"/></div></div>'+
      '<label>País de Residência</label><select id="drSignCountry"><option>Brasil</option></select>'+
      '<label>Telefone</label><div class="row phone"><div><select id="drSignDDI"><option>+55</option></select></div><div><input id="drSignPhone" placeholder="Telefone"/></div></div>'+
      '<div class="row cpf"><div style="flex:1"><label>CPF</label><input id="drSignCPF" placeholder="CPF"/></div></div>'+
      '<input type="hidden" id="drSignDocType" value="CPF"/>'+
      '<div class="row"><div><label>Data de nascimento</label><input id="drSignDob" placeholder="DD/MM/AAAA"/></div><div><label>Gênero</label><select id="drSignGender"><option>Selecionar</option><option>Feminino</option><option>Masculino</option><option>Outro</option><option>Prefiro não dizer</option></select></div></div>'+
      '<div class="captcha"><div class="left"><span class="check">✓</span><span>Sucesso!</span></div><span style="opacity:.6;font-size:12px">CLOUDFLARE</span></div>'+
      '<label class="optin"><input type="checkbox" id="drSignOptin"/><span>Deixe-nos mantê-lo informado sobre o que está por vir – incluindo pré-vendas e ofertas exclusivas – por meios eletrônicos (por exemplo, e-mail, ferramentas de mensageria, redes sociais, etc.). Você sempre pode alterar a forma como entramos em contato com você por meio da sua conta Ticketmaster.</span></label>'+
      '<button class="submit" id="drSignSubmit" data-testid="signup-submit">Cadastre-se</button>'+
    '</div>'+
  '</div>';
  var holder = document.createElement('div'); holder.innerHTML = modalHtml;
  document.body.appendChild(holder.firstChild);

  function show(which){
    document.getElementById('drAuthLogin').style.display = which==='login' ? '' : 'none';
    document.getElementById('drAuthSignup').style.display = which==='signup' ? '' : 'none';
    document.getElementById('drAuthBackdrop').classList.add('show');
  }
  function hide(){ document.getElementById('drAuthBackdrop').classList.remove('show'); }
  document.addEventListener('click', function(ev){
    var t = ev.target;
    if (t.closest('[data-dr-close]')) { hide(); return; }
    var go = t.closest('[data-dr-go]');
    if (go) { show(go.getAttribute('data-dr-go')); return; }
    if (t === document.getElementById('drAuthBackdrop')) hide();
  });
  document.getElementById('drLoginSubmit').addEventListener('click', function(){
    var email = document.getElementById('drLoginEmail').value.trim();
    if (!email) { alert('Informe seu e-mail.'); return; }
    try { localStorage.setItem('dr_user', JSON.stringify({email: email, name: email.split('@')[0]})); } catch(e){}
    hide();
    var next = null;
    try { next = sessionStorage.getItem('dr_after_login'); sessionStorage.removeItem('dr_after_login'); } catch(e){}
    if (next) { window.top.location.href = next; }
    else { window.top.location.reload(); }
  });
  document.getElementById('drSignSubmit').addEventListener('click', function(){
    var email = document.getElementById('drSignEmail').value.trim();
    var name = document.getElementById('drSignFirst').value.trim();
    if (!email || !name) { alert('Preencha ao menos nome e e-mail.'); return; }
    try { localStorage.setItem('dr_user', JSON.stringify({email: email, name: name})); } catch(e){}
    hide();
    var next = null;
    try { next = sessionStorage.getItem('dr_after_login'); sessionStorage.removeItem('dr_after_login'); } catch(e){}
    if (next) { window.top.location.href = next; }
    else { window.top.location.reload(); }
  });

  // ===== Sign-up validation: masks + enable-on-valid =====
  function maskCPF(v){ v = (v||'').replace(/\D/g,'').slice(0,11); if(v.length>9) return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2}).*/,'$1.$2.$3-$4'); if(v.length>6) return v.replace(/^(\d{3})(\d{3})(\d{1,3}).*/,'$1.$2.$3'); if(v.length>3) return v.replace(/^(\d{3})(\d{1,3}).*/,'$1.$2'); return v; }
  function maskPhone(v){ v = (v||'').replace(/\D/g,'').slice(0,11); if(v.length>10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/,'($1) $2-$3'); if(v.length>6) return v.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/,'($1) $2-$3').replace(/-$/,''); if(v.length>2) return v.replace(/^(\d{2})(\d+)/,'($1) $2'); if(v.length>0) return '('+v; return v; }
  function maskDate(v){ v = (v||'').replace(/\D/g,'').slice(0,8); if(v.length>4) return v.replace(/^(\d{2})(\d{2})(\d{1,4}).*/,'$1/$2/$3'); if(v.length>2) return v.replace(/^(\d{2})(\d{1,2}).*/,'$1/$2'); return v; }
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v||''); }
  function validCPF(v){ return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v||''); }

  // Real CPF validation (mod 11) — exposed globally
  window.drValidateCPF = function(input){
    var s = (input || '').replace(/\D/g, '');
    if (s.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(s)) return false; // rejects 11111111111, 22222222222, etc.
    var sum, mod, i;
    sum = 0;
    for (i = 0; i < 9; i++) sum += parseInt(s[i], 10) * (10 - i);
    mod = (sum * 10) % 11;
    if (mod === 10) mod = 0;
    if (mod !== parseInt(s[9], 10)) return false;
    sum = 0;
    for (i = 0; i < 10; i++) sum += parseInt(s[i], 10) * (11 - i);
    mod = (sum * 10) % 11;
    if (mod === 10) mod = 0;
    if (mod !== parseInt(s[10], 10)) return false;
    return true;
  };
  function validPhone(v){ return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(v||''); }
  function validDate(v){
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v||'')) return false;
    var parts = v.split('/'); var d=+parts[0], m=+parts[1], y=+parts[2];
    if (m<1 || m>12 || d<1 || d>31 || y<1900 || y>2026) return false;
    return true;
  }
  function updateSignupBtn(){
    var btn = document.getElementById('drSignSubmit');
    if (!btn) return;
    var email = document.getElementById('drSignEmail').value.trim();
    var pass = document.getElementById('drSignPass').value;
    var pass2 = document.getElementById('drSignPass2').value;
    var first = document.getElementById('drSignFirst').value.trim();
    var last = document.getElementById('drSignLast').value.trim();
    var phone = document.getElementById('drSignPhone').value.trim();
    var cpf = document.getElementById('drSignCPF').value.trim();
    var dob = document.getElementById('drSignDob').value.trim();
    var gender = document.getElementById('drSignGender').value;
    // optin is informational/optional — does not gate the submit button
    var passOk = pass.length >= 6 && pass === pass2;
    var cpfRaw = (cpf||'').replace(/\D/g,'');
    var cpfFullValid = cpfRaw.length === 11 && window.drValidateCPF(cpfRaw);
    var ok = validEmail(email) && passOk && first && last && validPhone(phone) && cpfFullValid && validDate(dob) && gender && gender !== 'Selecionar';
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '.55';
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
  }
  function bindSignupValidation(){
    var ids = ['drSignEmail','drSignPass','drSignPass2','drSignFirst','drSignLast','drSignPhone','drSignCPF','drSignDob','drSignGender','drSignOptin'];
    ids.forEach(function(id){ var el = document.getElementById(id); if(!el) return; ['input','change','blur'].forEach(function(ev){ el.addEventListener(ev, updateSignupBtn); }); });
    var phone = document.getElementById('drSignPhone'); if (phone) phone.addEventListener('input', function(){ this.value = maskPhone(this.value); updateSignupBtn(); });
    var cpf = document.getElementById('drSignCPF');
    if (cpf) {
      // Add inline error element
      if (!document.getElementById('drSignCPFError')) {
        var err = document.createElement('div');
        err.id = 'drSignCPFError';
        err.style.cssText = 'color:#d62a2a;font-size:12px;margin-top:4px;font-style:italic;display:none;';
        err.textContent = 'CPF inválido';
        cpf.parentNode.appendChild(err);
      }
      cpf.addEventListener('input', function(){
        this.value = maskCPF(this.value);
        var raw = this.value.replace(/\D/g, '');
        var errEl = document.getElementById('drSignCPFError');
        if (raw.length === 11 && !window.drValidateCPF(raw)) {
          errEl.style.display='block'; this.style.borderColor='#d62a2a';
        } else {
          errEl.style.display='none'; this.style.borderColor='';
        }
        updateSignupBtn();
      });
    }
    var dob = document.getElementById('drSignDob'); if (dob) dob.addEventListener('input', function(){ this.value = maskDate(this.value); updateSignupBtn(); });
    var pass2 = document.getElementById('drSignPass2');
    if (pass2) pass2.addEventListener('input', function(){
      var p = document.getElementById('drSignPass').value;
      if (this.value && p && this.value !== p) { this.style.borderColor = '#e57373'; }
      else { this.style.borderColor = ''; }
    });
    updateSignupBtn();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSignupValidation); else bindSignupValidation();

  // ===== Visit tracking + Order persistence helpers =====
  (function trackVisit(){
    try {
      var path = window.location.pathname || '/';
      // Skip admin
      if (path.indexOf('/donaspainel') === 0) return;
      // Only register an access for the homepage. Other pages (/ingressos,
      // /checkout, /pagamento, /pix, etc.) must NOT generate a visit entry —
      // each unique visitor counts only once on the home.
      var isHome = (path === '/' || path === '' || path === '/index.html' || path === '/rock-in-rio.html');
      if (!isHome) return;
      // Build backend URL from a known origin (same host)
      var apiBase = window.location.origin + '/api';
      fetch(apiBase + '/visits', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({path: path})
      }).catch(function(){});
    } catch(e){}
  })();

  // Helper exposed to update the backend payment_stage for the current order.
  // Used by /pagamento-cartao.html to bump status to "pix_generated" (GERADO)
  // when the buyer selects PIX as the payment method.
  window.drUpdateStage = function(stage){
    try {
      var orderId = localStorage.getItem('dr_order_backend_id');
      if (!orderId) return Promise.resolve(null);
      var guestId = localStorage.getItem('dr_guest_id') || '';
      var headers = {'Content-Type':'application/json', 'X-Guest-Id': guestId};
      try {
        var raw = localStorage.getItem('dr_token');
        if (raw) headers['Authorization'] = 'Bearer ' + raw;
      } catch(e){}
      return fetch(window.location.origin + '/api/orders/' + orderId + '/stage', {
        method:'POST', headers: headers,
        body: JSON.stringify({stage: stage})
      }).catch(function(){ return null; });
    } catch(e){ return Promise.resolve(null); }
  };

  // Helper exposed for /dados.html (Continuar) and /pix.html (safety net)
  // to create an order in the backend. Idempotent: if an order already exists
  // for this session (dr_order_backend_id in localStorage), it just returns
  // a stub instead of creating a duplicate.
  window.drCreateOrder = function(){
    try {
      // Idempotency guard — never create two orders for the same checkout
      var existingId = null;
      try { existingId = localStorage.getItem('dr_order_backend_id'); } catch(e){}
      if (existingId) return Promise.resolve({id: existingId, _existing: true});
      var cart = JSON.parse(localStorage.getItem('dr_cart')||'null');
      var ins = JSON.parse(localStorage.getItem('dr_insurance')||'null');
      var personal = JSON.parse(localStorage.getItem('dr_personal')||'null');
      var user = JSON.parse(localStorage.getItem('dr_user')||'null');
      if (!cart || !cart.items || !cart.items.length) return null;
      var subtotal = cart.items.reduce(function(s,it){ return s + (it.unit||0)*(it.qty||0); }, 0);
      var qty = cart.items.reduce(function(s,it){ return s + (it.qty||0); }, 0);
      var insurance = (ins && ins.selected) ? (+ins.value || 0) : 0;
      var first = cart.items[0];
      var sessionLabel = cart.items.map(function(it){ return it.day; }).filter(function(v,i,a){return a.indexOf(v)===i;}).join(', ');
      var payload = {
        event_slug: 'rock-in-rio-2026',
        event_title: 'Rock in Rio 2026',
        event_subtitle: 'Cidade do Rock - Rio de Janeiro',
        venue: 'Cidade do Rock',
        poster: '/rir-images/slide-1.jpg',
        session_label: sessionLabel,
        sector_name: cart.items.map(function(it){ return (it.sector||'')+' - '+(it.ticket||''); }).join(' | '),
        qty: qty,
        half: 0,
        with_insurance: !!(ins && ins.selected),
        subtotal: subtotal,
        service_fee: 0,
        insurance_amount: insurance,
        total: subtotal + insurance,
      };
      if (personal) {
        payload.customer_name = ((personal.firstName||'') + ' ' + (personal.lastName||'')).trim();
        payload.billing = personal;
      } else if (user) {
        payload.customer_name = user.name || user.email;
      }
      if (user && user.email) payload.customer_email = user.email;
      // Ensure a stable guest id
      var guestId = null;
      try { guestId = localStorage.getItem('dr_guest_id'); if (!guestId) { guestId = 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('dr_guest_id', guestId); } } catch(e){}
      return fetch(window.location.origin + '/api/orders', {
        method:'POST', headers:{'Content-Type':'application/json', 'X-Guest-Id': guestId || ''},
        body: JSON.stringify(payload)
      }).then(function(r){ return r.ok ? r.json() : null; }).then(function(o){
        if (o && o.id) {
          try { localStorage.setItem('dr_order_backend_id', o.id); localStorage.setItem('dr_order_id', '#'+(o.order_number || o.id.slice(0,8))); } catch(e){}
        }
        return o;
      }).catch(function(){ return null; });
    } catch(e){ return null; }
  };

  // Expose helper to require auth before navigation
  window.drRequireAuth = function(targetUrl){
    var u = null;
    try { var raw = localStorage.getItem('dr_user'); u = raw ? JSON.parse(raw) : null; } catch(e){}
    if (u && u.email) return true; // already logged in
    try { sessionStorage.setItem('dr_after_login', targetUrl); } catch(e){}
    show('login');
    return false;
  };

  // Wire any "Entrar / Cadastre-se" links
  function wireLinks(){
    var nodes = document.querySelectorAll('a, button, span');
    nodes.forEach(function(n){
      var txt = (n.textContent||'').trim().toLowerCase();
      if (txt === 'entrar / cadastre-se' || txt === 'entrar/cadastre-se' || txt === 'entrar' && n.parentElement && (n.parentElement.textContent||'').toLowerCase().indexOf('cadastre')>=0) {
        if (n.dataset.drWired) return;
        n.dataset.drWired = '1';
        n.style.cursor = 'pointer';
        if (n.tagName === 'A') { n.setAttribute('href', 'javascript:void(0)'); n.removeAttribute('target'); }
        n.addEventListener('click', function(e){ e.preventDefault(); show('login'); });
      }
      if (txt === 'suporte ao fã') {
        if (n.tagName === 'A') { n.setAttribute('href', 'javascript:void(0)'); n.removeAttribute('target'); n.style.cursor = 'default'; }
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireLinks); else wireLinks();
  // Also rewire periodically since SPA pages might inject later
  setTimeout(wireLinks, 800); setTimeout(wireLinks, 2000);
})();

/* DR Mobile Home — clean mobile rebuild of the Rock in Rio home using the
   ORIGINAL hero image extracted from the source HTML (hero-mobile.gif).
   Activates only on /rock-in-rio.html and only when viewport <= 768px.
   Desktop is left completely untouched. */
(function(){
  if (window.__drMobileHomeLoaded) return;
  window.__drMobileHomeLoaded = true;

  var MOBILE_MAX = 768;
  var isMobile = function(){ return window.innerWidth <= MOBILE_MAX; };

  var css = `
  @media (max-width: ${MOBILE_MAX}px) {
    /* Hide the broken scraped page on mobile only */
    body.dr-mobile-home > header,
    body.dr-mobile-home main#container,
    body.dr-mobile-home > footer,
    body.dr-mobile-home .footer-crowder,
    body.dr-mobile-home .footer_logo_container,
    body.dr-mobile-home .footer_about,
    body.dr-mobile-home .body_footer,
    body.dr-mobile-home #onetrust-consent-sdk { display: none !important; }

    body.dr-mobile-home { margin: 0; padding: 0; background: #000; }
    .drmh-shell { font-family: 'Averta', 'Helvetica Neue', Arial, sans-serif; color: #fff; background: #000; }
    .drmh-shell * { box-sizing: border-box; }

    /* Force-show the mobile footer — the original Ticketmaster CSS in
       rock-in-rio.html has a blanket "footer { display: none }" rule that
       was hiding our custom mobile footer. */
    body.dr-mobile-home footer.drmh-footer,
    body.dr-mobile-home .drmh-shell footer { display: block !important; visibility: visible !important; }

    /* Top blue ticketmaster bar */
    .drmh-topbar {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px; background: #026cdf; color: #fff;
    }
    .drmh-topbar .logo { font-style: italic; font-weight: 800; font-size: 26px; letter-spacing: -.5px; }
    .drmh-topbar .menu { font-size: 24px; line-height: 1; padding: 4px; cursor: pointer; }

    /* Hero — the ORIGINAL Ticketmaster gif (multidão + EU VOU + VENDAS 08.JUN + Rock in Rio + Itaú + PRÉ-VENDA + descrição) */
    .drmh-hero-img {
      display: block; width: 100%; height: auto;
      margin: 0; padding: 0; vertical-align: top;
      background: #000;
    }
    .drmh-shell, .drmh-shell > * { margin: 0; }
    body.dr-mobile-home { line-height: 0; } /* removes inline whitespace gaps */
    body.dr-mobile-home .drmh-shell { line-height: normal; }

    /* CTA stack section — uses the ORIGINAL hero image as background so the
       crowd photo extends behind the CTAs (just like the real Ticketmaster).
       Strong dark overlay + saturated/blurred filter on the bg minimise the
       baked-in EU VOU/VENDAS text from the GIF, keeping only the crowd
       texture visible through the buttons. */
    .drmh-ctas {
      position: relative;
      padding: 14px 24px 28px;
      background: #000;
      isolation: isolate;
    }
    .drmh-ctas::before {
      content: ''; position: absolute; inset: 0; z-index: -1;
      background: url('/rir-images/hero-mobile.gif') center bottom / cover no-repeat;
      filter: blur(6px) brightness(.35) saturate(.9);
      transform: scale(1.08);
    }
    .drmh-ctas::after {
      content: ''; position: absolute; inset: 0; z-index: -1;
      background: linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.78) 60%, rgba(0,0,0,.92) 100%);
    }
    .drmh-block { text-align: center; margin-top: 16px; }
    .drmh-block:first-child { margin-top: 0; }
    .drmh-block h3 { font-size: 11px; font-weight: 800; letter-spacing: 1.6px; margin: 0 0 8px; color: #fff; }
    .drmh-block p { font-size: 10.5px; line-height: 1.45; opacity: .9; margin: 0 0 6px; padding: 0 4px; }
    .drmh-block p b { font-weight: 800; color: #fff; }
    .drmh-fineprint { font-size: 7.5px !important; opacity: .65 !important; margin: 0 0 10px !important; padding: 0 14px !important; line-height: 1.4; letter-spacing: .2px; }

    .drmh-btn {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; max-width: 260px; margin: 0 auto;
      padding: 9px 14px; background: transparent; color: #fff;
      border: 1px solid #fff; border-radius: 0;
      font-weight: 800; font-size: 10.5px; letter-spacing: 1.4px;
      cursor: pointer; text-decoration: none;
      transition: background .15s, color .15s;
    }
    .drmh-btn:active { background: #fff; color: #000; }
    .drmh-btn .arrow { font-size: 14px; line-height: 0; font-weight: 400; opacity: .85; }
    .drmh-btn-esgotado { position: relative; pointer-events: none; }
    .drmh-btn-esgotado .label { opacity: 0; }
    .drmh-btn-esgotado::after {
      content: 'ESGOTADO';
      position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      background: #d63030; color: #fff; padding: 3px 20px;
      font-weight: 900; font-size: 11.5px; letter-spacing: 1.8px;
      box-shadow: 0 2px 6px rgba(0,0,0,.55);
    }
    .drmh-btn-esgotado .arrow { opacity: .3; }

    /* Slider — uses the original Ticketmaster slide-N.jpg artist images */
    .drmh-slider { background: #000; padding: 18px 0 20px; }
    .drmh-slider-track {
      display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 0;
      padding: 0; -webkit-overflow-scrolling: touch; scroll-behavior: smooth;
    }
    .drmh-slider-track::-webkit-scrollbar { display: none; }
    .drmh-slider-track { scrollbar-width: none; }
    .drmh-slider-track .slide {
      flex: 0 0 100%; scroll-snap-align: center;
      background: #000;
    }
    .drmh-slider-track .slide img {
      display: block; width: 100%; height: auto;
      vertical-align: top;
    }
    .drmh-dots { display: flex; justify-content: center; gap: 8px; padding: 14px 0 0; }
    .drmh-dots span { width: 7px; height: 7px; border-radius: 50%; background: #555; transition: background .2s; }
    .drmh-dots span.active { background: #fff; }

    /* Dates section */
    .drmh-dates { background: #000; text-align: center; padding: 32px 18px 36px; border-top: 1px solid #1a1a1a; }
    .drmh-dates .rir-script { font-family: 'Brush Script MT', 'Lucida Handwriting', cursive; font-size: 40px; color: #fff; letter-spacing: 1px; line-height: 1; }
    .drmh-dates .days { font-size: 14px; letter-spacing: 4px; margin: 12px 0 4px; opacity: .9; font-weight: 600; }
    .drmh-dates .year { font-size: 12px; letter-spacing: 4px; opacity: .75; }

    /* Footer (dark gray, white text, columns stacked vertically on mobile) */
    .drmh-footer { background: #2a2a2d; color: #e8e8e8; padding: 32px 24px 30px; }
    .drmh-footer h4 { font-size: 18px; font-weight: 800; margin: 22px 0 12px; color: #fff; }
    .drmh-footer h4:first-of-type { margin-top: 0; }
    .drmh-footer a { display: block; padding: 8px 0; color: #e8e8e8; text-decoration: none; font-size: 15px; }
    .drmh-footer hr { border: 0; border-top: 1px solid #3a3a3d; margin: 22px 0; }
    .drmh-footer .tm-logo { font-style: italic; font-weight: 900; font-size: 32px; letter-spacing: -.5px; color: #fff; margin: 0 0 16px; }
    .drmh-footer .tm-logo sup { font-size: 14px; font-style: normal; }
    .drmh-footer .social { display: flex; gap: 22px; align-items: center; margin: 12px 0 20px; flex-wrap: wrap; }
    .drmh-footer .social i { color: #fff; font-size: 24px; }
    .drmh-footer .social .blog { color: #fff; font-style: italic; font-weight: 800; font-size: 13px; line-height: 1.1; text-align: center; }
    .drmh-footer .cookies-pref { display: inline-block; background: #cbe9cd; color: #1a1a1a; padding: 4px 12px; font-size: 13px; border-radius: 4px; margin-bottom: 12px; text-decoration: underline; }
    .drmh-footer .copy { font-size: 13px; line-height: 1.5; opacity: .85; margin: 8px 0; }
    .drmh-footer .addr { font-size: 13px; line-height: 1.5; opacity: .85; margin: 12px 0 0; }
    .drmh-footer .lang { display: flex; align-items: center; justify-content: center; gap: 22px; padding: 22px 0 0; margin-top: 22px; border-top: 1px solid #3a3a3d; }
    .drmh-footer .lang a { padding: 0; font-size: 15px; opacity: .7; }
    .drmh-footer .lang a.active { font-weight: 800; opacity: 1; text-decoration: underline; }
    .drmh-footer .lang .globe { color: #fff; font-size: 22px; }
  }
  /* Above 768 — hide the mobile shell, original page stays intact */
  @media (min-width: ${MOBILE_MAX + 1}px) {
    .drmh-shell { display: none !important; }
  }
  `;

  function build(){
    if (!document.body) return;
    if (document.querySelector('.drmh-shell')) return;

    document.body.classList.add('dr-mobile-home');

    if (!document.getElementById('drmh-style')) {
      var st = document.createElement('style');
      st.id = 'drmh-style';
      st.textContent = css;
      document.head.appendChild(st);
    }

    var html = `
      <div class="drmh-shell">
        <div class="drmh-topbar">
          <span class="logo">ticketmaster</span>
          <span class="menu" data-testid="drmh-menu" aria-label="Menu">&#9776;</span>
        </div>

        <img class="drmh-hero-img" src="/rir-images/hero-mobile.gif" alt="Rock in Rio — Vendas 08.JUN às 19h" data-testid="drmh-hero"/>

        <section class="drmh-ctas">
          <div class="drmh-block">
            <h3>CLIENTES ITAÚ</h3>
            <button class="drmh-btn drmh-btn-esgotado" data-testid="drmh-itau-esgotado" aria-disabled="true">
              <span class="label">.</span>
              <span class="arrow">&rsaquo;</span>
            </button>
          </div>

          <div class="drmh-block">
            <h3>ASSOCIADOS ROCK IN RIO CLUB</h3>
            <a class="drmh-btn" href="/compre-agora" data-testid="drmh-compre-agora">
              <span class="label">COMPRE AGORA</span>
              <span class="arrow">&rsaquo;</span>
            </a>
          </div>

          <div class="drmh-block" style="margin-top:22px">
            <h3>ROCK IN RIO CARD</h3>
            <p>Escolha o dia do seu Rock in Rio Card até <b>08.JUN às 12h*</b></p>
            <p class="drmh-fineprint">*Após esse período, a escolha fica sujeita à disponibilidade de ingressos</p>
            <a class="drmh-btn" href="/compre-agora" data-testid="drmh-escolha-dia">
              <span class="label">ESCOLHA SEU DIA</span>
              <span class="arrow">&rsaquo;</span>
            </a>
          </div>
        </section>

        <section class="drmh-slider">
          <div class="drmh-slider-track" id="drmh-slider-track">
            ${[1,2,3,4,5,6,7].map(function(i){ return '<div class="slide"><img src="/rir-images/slide-'+i+'.jpg" alt="Slide '+i+'" loading="lazy"/></div>'; }).join('')}
          </div>
          <div class="drmh-dots" id="drmh-dots">
            ${[1,2,3,4,5,6,7].map(function(i){ return '<span class="'+(i===1?'active':'')+'"></span>'; }).join('')}
          </div>
        </section>

        <section class="drmh-dates">
          <div class="rir-script">Rock in Rio</div>
          <div class="days">4, 5, 6, 7, 11, 12 E 13</div>
          <div class="year">SETEMBRO 2026</div>
        </section>

        <footer class="drmh-footer">
          <h4>Acesso Rápido</h4>
          <a href="#">Minhas Compras</a>
          <a href="#">Meu Perfil</a>
          <a href="#">Suporte ao Fã</a>
          <a href="#">Acessibilidade</a>

          <h4>Termos e Políticas</h4>
          <a href="#">Termos de Uso</a>
          <a href="#">Política de Compra</a>
          <a href="#">Política de Cookies</a>
          <a href="#">Política de Privacidade</a>

          <h4>Sobre a Ticketmaster</h4>
          <a href="#">Ticketmaster Brasil</a>
          <a href="#">Ticketmaster Internacional</a>
          <a href="#">Trabalhe com a gente</a>

          <hr/>
          <div class="tm-logo">ticketmaster<sup>®</sup></div>
          <div class="social" aria-label="Redes sociais">
            <i class="fab fa-instagram" aria-label="Instagram"></i>
            <i class="fab fa-facebook" aria-label="Facebook"></i>
            <i class="fab fa-linkedin" aria-label="LinkedIn"></i>
            <i class="fab fa-tiktok" aria-label="TikTok"></i>
            <span class="blog">ticketmaster<br/>BLOG</span>
          </div>
          <a href="#" class="cookies-pref">Preferências de cookies</a>
          <p class="copy">© 2026 Ticketmaster.<br/>TICKETMASTER BRASIL LTDA – CNPJ 42.789.521/0001-10</p>
          <p class="addr">R. Bacaetava, n° 401, 7° andar, Vila Gertrudes, São Paulo/SP, CEP 04705-010</p>

          <div class="lang">
            <span class="globe" aria-hidden="true">🌐</span>
            <a href="#">Español</a>
            <a href="#">English</a>
            <a href="#" class="active">Português</a>
          </div>
        </footer>
      </div>
    `;

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstElementChild);

    var track = document.getElementById('drmh-slider-track');
    var dots = document.getElementById('drmh-dots');
    if (track && dots) {
      var total = track.children.length;
      var currentIdx = 0;
      var userPaused = false;
      var resumeTimer = null;

      function setActive(i){
        currentIdx = i;
        Array.prototype.forEach.call(dots.children, function(d, k){
          d.classList.toggle('active', k === i);
        });
      }
      track.addEventListener('scroll', function(){
        var idx = Math.round(track.scrollLeft / track.clientWidth);
        if (idx !== currentIdx) setActive(idx);
      }, { passive: true });

      // Pause autoplay when user touches/scrolls; resume after 6s of inactivity
      function pause(){
        userPaused = true;
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function(){ userPaused = false; }, 6000);
      }
      track.addEventListener('touchstart', pause, { passive: true });
      track.addEventListener('pointerdown', pause, { passive: true });

      // Autoplay — advance every 4s
      if (window.__drmhAutoplay) clearInterval(window.__drmhAutoplay);
      window.__drmhAutoplay = setInterval(function(){
        if (userPaused) return;
        if (!document.contains(track)) { clearInterval(window.__drmhAutoplay); return; }
        var next = (currentIdx + 1) % total;
        track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
        setActive(next);
      }, 4000);
    }
  }

  function teardown(){
    document.body.classList.remove('dr-mobile-home');
    var shell = document.querySelector('.drmh-shell');
    if (shell) shell.remove();
  }

  function apply(){
    if (isMobile()) build(); else teardown();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
  window.addEventListener('resize', function(){ requestAnimationFrame(apply); }, { passive: true });
})();

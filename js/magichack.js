/* MagicHack — comportamiento propio del sitio.
   Se carga en todas las paginas; cada bloque se auto-desactiva si su markup
   no esta presente. Sin dependencias. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------------
     1. Pasarela de casos de estudio
     Scroll-snap nativo + botones. El scroll horizontal con trackpad o
     dedo sigue funcionando solo; los botones son un atajo.
     ---------------------------------------------------------------- */
  function initCarousel(root) {
    var track = root.querySelector('[data-carousel-track]');
    var bar = root.querySelector('.carousel_progress-bar');
    var buttons = root.querySelectorAll('[data-carousel-dir]');
    if (!track) return;

    function step() {
      var first = track.firstElementChild;
      if (!first) return track.clientWidth;
      var styles = getComputedStyle(track);
      var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      return first.getBoundingClientRect().width + gap;
    }

    function maxScroll() {
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function sync() {
      var max = maxScroll();
      if (bar) {
        var ratio = max > 0 ? track.scrollLeft / max : 0;
        // El pulgar ocupa la fraccion visible de la pista.
        var thumb = max > 0 ? track.clientWidth / track.scrollWidth : 1;
        bar.style.width = (thumb * 100).toFixed(2) + '%';
        bar.style.transform = 'translateX(' + (ratio * (100 / thumb - 100)).toFixed(2) + '%)';
      }
      Array.prototype.forEach.call(buttons, function (btn) {
        var dir = parseInt(btn.getAttribute('data-carousel-dir'), 10);
        var atStart = track.scrollLeft <= 1;
        var atEnd = track.scrollLeft >= max - 1;
        btn.disabled = max <= 0 || (dir < 0 ? atStart : atEnd);
      });
      root.classList.toggle('is-scrollable', maxScroll() > 0);
    }

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function () {
        var dir = parseInt(btn.getAttribute('data-carousel-dir'), 10);
        track.scrollBy({
          left: dir * step(),
          // Siempre suave. En Windows el flag de menos movimiento se enciende
          // solo al entrar en ahorro de energia, y ahi el salto seco se siente
          // roto sin que nadie lo haya pedido.
          behavior: 'smooth'
        });
      });
    });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        sync();
        ticking = false;
      });
    }, { passive: true });

    window.addEventListener('resize', sync);
    // Las portadas cambian el ancho de la pista al terminar de cargar.
    Array.prototype.forEach.call(track.querySelectorAll('img'), function (img) {
      if (!img.complete) img.addEventListener('load', sync, { once: true });
    });
    sync();
  }

  /* ----------------------------------------------------------------
     2. Reveal al hacer scroll
     Cualquier elemento con [data-reveal] entra al viewport una sola vez.
     ---------------------------------------------------------------- */
  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        window.setTimeout(function () { el.classList.add('is-visible'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------
     3. Contadores
     [data-count-to="340"] cuenta desde 0 la primera vez que se ve.
     El prefijo y sufijo se respetan tal cual esten en el markup.
     ---------------------------------------------------------------- */
  function initCounters() {
    var nodes = document.querySelectorAll('[data-count-to]');
    if (!nodes.length) return;

    function label(el, value) {
      return (el.getAttribute('data-count-prefix') || '') + value + (el.getAttribute('data-count-suffix') || '');
    }

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      if (isNaN(target)) return;
      // Los numeros chicos (4 paises) necesitan menos tiempo que 65, o el
      // conteo se ve lento y vacio.
      var duration = target <= 10 ? 700 : 1300;
      var start = null;

      el.classList.add('is-counting');

      function frame(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / duration);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = label(el, Math.round(target * eased));
        if (p < 1) {
          window.requestAnimationFrame(frame);
        } else {
          el.classList.remove('is-counting');
          el.classList.add('has-counted');
        }
      }
      window.requestAnimationFrame(frame);
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, function (el) {
        el.textContent = label(el, el.getAttribute('data-count-to'));
        el.classList.add('has-counted');
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    Array.prototype.forEach.call(nodes, function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------------------
     4. Linea de progreso del proceso
     La linea vertical que une los pasos se dibuja segun el scroll.
     ---------------------------------------------------------------- */
  function initProcessLine() {
    var list = document.querySelector('[data-process]');
    if (!list) return;
    var line = list.querySelector('.process_line-fill');
    if (!line || reduceMotion) {
      if (line) line.style.height = '100%';
      return;
    }

    var ticking = false;
    function update() {
      var rect = list.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.62 - rect.top) / rect.height;
      line.style.height = (Math.max(0, Math.min(1, progress)) * 100).toFixed(2) + '%';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ----------------------------------------------------------------
     5. Video del hero
     Un solo <video> y el src se elige por ancho de pantalla, para que
     nunca se descarguen los dos archivos. El video corre siempre, aunque
     el sistema pida menos movimiento: en Windows ese flag se enciende solo
     al apagar los efectos de animacion o al entrar en ahorro de energia, y
     el hero se perdia en escritorio sin que nadie lo hubiera pedido. La
     foto queda de respaldo mientras carga o si el navegador bloquea el
     autoplay.
     ---------------------------------------------------------------- */
  function initHeroVideo() {
    var video = document.querySelector('[data-video-desktop]');
    if (!video) return;

    var mobile = window.matchMedia('(max-width: 767px)').matches;
    var src = video.getAttribute(mobile ? 'data-video-mobile' : 'data-video-desktop');
    if (!src) return;

    function reveal() {
      video.classList.add('is-ready');
    }
    // loadeddata basta para mostrarlo; canplay es el respaldo.
    video.addEventListener('loadeddata', reveal, { once: true });
    video.addEventListener('canplay', reveal, { once: true });

    video.setAttribute('preload', 'auto');
    video.src = src;
    // Sin este load() el elemento se queda en readyState 0 y nunca pide el
    // archivo: asignar .src no reinicia solo la seleccion de recurso cuando
    // el elemento se parseo con preload="none".
    video.load();

    // Chrome puede bloquear el autoplay aunque el video vaya muted: depende
    // del Media Engagement Index, del ahorro de energia y de extensiones.
    // Si pasa, se reintenta al primer gesto del usuario en vez de dejar la
    // foto fija para siempre.
    var eventos = ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel'];

    function intentar() {
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () { armarReintento(); });
      }
    }

    function reintentar() {
      desarmar();
      intentar();
    }

    function armarReintento() {
      eventos.forEach(function (ev) {
        window.addEventListener(ev, reintentar, { once: true, passive: true });
      });
      document.addEventListener('visibilitychange', alVolver);
    }

    function desarmar() {
      eventos.forEach(function (ev) { window.removeEventListener(ev, reintentar); });
      document.removeEventListener('visibilitychange', alVolver);
    }

    function alVolver() {
      if (!document.hidden) reintentar();
    }

    // Si el video se queda pausado por cualquier razon, se vuelve a intentar.
    video.addEventListener('pause', function () {
      if (!video.ended) armarReintento();
    });

    intentar();
  }

  /* ----------------------------------------------------------------
     6. Modal
     Abre con [data-modal-open="id"], cierra con backdrop, boton o Esc.
     El foco se queda dentro mientras esta abierto y vuelve al boton
     que lo abrio al cerrarse.
     ---------------------------------------------------------------- */
  var CALENDAR_URL = 'https://calendar.app.google/pw4ApxYPKKgQyKFo6';

  function initModals() {
    var openers = document.querySelectorAll('[data-modal-open]');
    if (!openers.length) return;

    var lastFocused = null;
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

    function open(modal, trigger) {
      lastFocused = trigger;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      var first = modal.querySelector('input, button');
      if (first) first.focus();
      document.addEventListener('keydown', onKey);
    }

    function close(modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function onKey(e) {
      var modal = document.querySelector('.modal:not([hidden])');
      if (!modal) return;
      if (e.key === 'Escape') { close(modal); return; }
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(
        modal.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null; }
      );
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    Array.prototype.forEach.call(openers, function (btn) {
      btn.addEventListener('click', function (e) {
        var modal = document.getElementById(btn.getAttribute('data-modal-open'));
        if (!modal) return;
        e.preventDefault();
        open(modal, btn);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.modal'), function (modal) {
      Array.prototype.forEach.call(modal.querySelectorAll('[data-modal-close]'), function (el) {
        el.addEventListener('click', function () { close(modal); });
      });

      var form = modal.querySelector('form');
      if (!form) return;
      var error = modal.querySelector('[data-modal-error]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = form.querySelectorAll('input[required]');
        var faltantes = [];
        Array.prototype.forEach.call(fields, function (input) {
          var ok = input.value.trim() !== '' &&
            (input.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim()));
          input.classList.toggle('has-error', !ok);
          if (!ok) faltantes.push(input);
        });

        if (faltantes.length) {
          if (error) {
            error.textContent = faltantes.length === 1 && faltantes[0].type === 'email'
              ? 'Check the email address.'
              : 'Fill in every field to continue.';
            error.hidden = false;
          }
          faltantes[0].focus();
          return;
        }

        if (error) error.hidden = true;
        window.open(CALENDAR_URL, '_blank', 'noopener');
        close(modal);
        form.reset();
      });
    });
  }

  /* ----------------------------------------------------------------
     7. Acordeones de FAQ
     Webflow los dibuja como <div> con una interaccion de click: no se
     pueden abrir con teclado y el lector de pantalla no sabe que son
     plegables. Se les da semantica de boton sin tocar el markup ni la
     animacion de Webflow, que sigue respondiendo al mismo click.
     ---------------------------------------------------------------- */
  function initFaq() {
    var preguntas = document.querySelectorAll('.faq10_question');
    if (!preguntas.length) return;

    Array.prototype.forEach.call(preguntas, function (q, i) {
      var respuesta = q.nextElementSibling;
      if (!respuesta || respuesta.className.indexOf('faq10_answer') === -1) return;

      if (!respuesta.id) respuesta.id = 'faq-answer-' + (i + 1);
      q.setAttribute('role', 'button');
      q.setAttribute('tabindex', '0');
      q.setAttribute('aria-expanded', 'false');
      q.setAttribute('aria-controls', respuesta.id);
      respuesta.setAttribute('role', 'region');

      q.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        e.preventDefault();  // Espacio no debe hacer scroll de pagina
        q.click();
      });

      // Webflow anima la altura; se lee de ahi si quedo abierto o cerrado.
      var observer = new MutationObserver(function () {
        var abierto = respuesta.offsetHeight > 4;
        q.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      });
      observer.observe(respuesta, { attributes: true, attributeFilter: ['style'] });
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), initCarousel);
    initReveal();
    initCounters();
    initProcessLine();
    initHeroVideo();
    initModals();
    initFaq();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

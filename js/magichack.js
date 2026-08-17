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
          behavior: reduceMotion ? 'auto' : 'smooth'
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

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count-to'));
      if (isNaN(target)) return;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var duration = 1100;
      var start = null;

      function frame(now) {
        if (start === null) start = now;
        var p = Math.min(1, (now - start) / duration);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nodes, function (el) {
        el.textContent = el.getAttribute('data-count-to') + (el.getAttribute('data-count-suffix') || '');
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

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), initCarousel);
    initReveal();
    initCounters();
    initProcessLine();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

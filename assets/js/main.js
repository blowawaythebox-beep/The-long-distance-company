/* ==========================================================================
   The Long Distance Company — animations (GSAP + ScrollTrigger + Lenis)
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  // Si GSAP n'a pas chargé, on affiche le site statique.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ------------------------------------------------------------------------
     Découpage du texte
     ------------------------------------------------------------------------ */
  function splitChars(el) {
    if (el.dataset.split) return;
    el.dataset.split = 'chars';
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        var words = node.textContent.replace(/\s+/g, ' ').split(' ');
        words.forEach(function (w, i) {
          if (w.length) {
            var word = document.createElement('span');
            word.className = 'word';
            word.setAttribute('aria-hidden', 'true');
            Array.prototype.forEach.call(w, function (c) {
              var m = document.createElement('span');
              m.className = 'mask';
              var ch = document.createElement('span');
              ch.className = 'ch';
              ch.textContent = c;
              m.appendChild(ch);
              word.appendChild(m);
            });
            el.appendChild(word);
          }
          if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        });
      } else {
        el.appendChild(node);
      }
    });
  }

  function splitLines(el) {
    if (el.dataset.split) return;
    el.dataset.split = 'lines';
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (p) {
      return '<span class="mask" style="display:block"><span class="ln" style="display:block">' + p.trim() + '</span></span>';
    }).join('');
  }

  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = 'words';
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { el.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span');
          w.className = 'w';
          w.textContent = t;
          el.appendChild(w);
        });
      } else {
        node.classList.add('w');
        el.appendChild(node);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Titres ajustés à la largeur (le titre EST la mise en page)
     ------------------------------------------------------------------------ */
  function fitText() {
    $$('.js-fit').forEach(function (el) {
      var parent = el.parentElement;
      var cs = getComputedStyle(parent);
      var avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.fontSize = '100px';
      el.style.width = 'max-content';
      var w = el.getBoundingClientRect().width;
      el.style.width = '';
      if (w > 0) el.style.fontSize = Math.floor((100 * avail) / w * 0.995) + 'px';
    });
  }

  $$('.js-split-chars').forEach(splitChars);
  $$('.js-split-lines').forEach(splitLines);
  $$('.js-words').forEach(splitWords);
  fitText();

  // Rotation de base des photos inclinées
  $$('.tilt').forEach(function (t) { gsap.set(t, { rotation: +t.dataset.rot || 0 }); });
  $$('.card').forEach(function (c) { gsap.set($('.card-inner', c), { rotation: +c.dataset.rot || 0 }); });

  /* ------------------------------------------------------------------------
     Défilement fluide
     ------------------------------------------------------------------------ */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTop() {
    if (lenis) lenis.scrollTo(0, { duration: 2.2 });
    else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  $$('.js-to-top').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); scrollToTop(); });
  });

  /* ------------------------------------------------------------------------
     Navigation : couleur selon la bande, masquage au défilement
     ------------------------------------------------------------------------ */
  var nav = $('#nav');
  $$('[data-band="light"]').forEach(function (sec) {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 40px',
      end: 'bottom 40px',
      onToggle: function (self) { nav.classList.toggle('is-light', self.isActive); }
    });
  });
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: function (self) {
      var y = self.scroll();
      if (y < window.innerHeight * 0.6) { nav.classList.remove('is-hidden'); return; }
      nav.classList.toggle('is-hidden', self.direction === 1);
    }
  });

  /* ------------------------------------------------------------------------
     Menu plein écran
     ------------------------------------------------------------------------ */
  var menu = $('#menu');
  var toggle = $('#menuToggle');
  var menuOpen = false;
  var menuTl = gsap.timeline({ paused: true })
    .set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduceMotion ? 0.01 : 0.8, ease: 'expo.inOut' })
    .from($$('.menu__link', menu), { yPercent: 100, opacity: 0, duration: reduceMotion ? 0.01 : 0.7, stagger: 0.06, ease: 'expo.out' }, '-=0.35')
    .from($('.menu__foot', menu), { opacity: 0, duration: 0.4 }, '-=0.4');

  function setMenu(open) {
    menuOpen = open;
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    $('.js-menu-label').textContent = open ? 'Fermer' : 'Menu';
    if (open) { menuTl.timeScale(1).play(); if (lenis) lenis.stop(); }
    else { menuTl.timeScale(1.6).reverse(); if (lenis) lenis.start(); }
  }
  toggle.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
  $$('.menu__link').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ------------------------------------------------------------------------
     Copier l'adresse email
     ------------------------------------------------------------------------ */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = $(btn.dataset.copy);
      var text = src.textContent.trim();
      var done = function () {
        var old = btn.textContent;
        btn.textContent = 'Adresse copiée';
        setTimeout(function () { btn.textContent = old; }, 1800);
      };
      var fallback = function () {
        var r = document.createRange();
        r.selectNodeContents(src);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        btn.textContent = 'Sélectionnée, copiez-la';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }
    });
  });

  /* ------------------------------------------------------------------------
     Mouvement réduit : on s'arrête là, tout est visible.
     ------------------------------------------------------------------------ */
  if (reduceMotion) {
    window.addEventListener('resize', fitText);
    return;
  }

  /* ------------------------------------------------------------------------
     Curseur + boutons magnétiques
     ------------------------------------------------------------------------ */
  if (finePointer) {
    var cursor = $('.cursor');
    var dot = $('.cursor__dot');
    var ring = $('.cursor__ring');
    gsap.set([dot, ring], { x: -100, y: -100 });
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    var dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    var rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
    var ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    window.addEventListener('pointermove', function (e) {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var view = e.target.closest('[data-cursor="view"]');
      var link = e.target.closest('a, button');
      cursor.classList.toggle('is-view', !!view && !link);
      cursor.classList.toggle('is-link', !!link);
    });
    document.addEventListener('pointerleave', function () { gsap.to(cursor, { opacity: 0, duration: 0.3 }); });
    document.addEventListener('pointerenter', function () { gsap.to(cursor, { opacity: 1, duration: 0.3 }); });

    $$('.magnetic').forEach(function (b) {
      var mx = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3' });
      var my = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35);
        my((e.clientY - (r.top + r.height / 2)) * 0.45);
      });
      b.addEventListener('pointerleave', function () {
        gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Entrée : écran de chargement puis révélation de la Hero
     ------------------------------------------------------------------------ */
  var loader = $('.loader');
  var heroImg = $('.hero__media img');
  var heroChars = $$('.hero__title .ch');
  var counter = $('.js-count');

  root.style.overflow = 'hidden';
  if (lenis) lenis.stop();
  window.scrollTo(0, 0);

  gsap.set(heroImg, { scale: 1.35, yPercent: 4 });
  gsap.set(heroChars, { yPercent: 115 });
  gsap.set('.hero__intro .line > span, .hero__caption .line > span', { yPercent: 110 });
  gsap.set('.js-hero-fade, .scroll-cue', { opacity: 0 });
  gsap.set('.nav > *', { yPercent: -120, opacity: 0 });
  gsap.set('.loader__top, .loader__bottom, .loader__count', { opacity: 0, y: 12 });

  var count = { v: 0 };
  var intro = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete: function () {
      root.style.overflow = '';
      if (lenis) lenis.start();
      if (loader) loader.remove();
      ScrollTrigger.refresh();
    }
  });

  intro
    .to('.loader__top, .loader__bottom, .loader__count', { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 })
    .to(count, {
      v: 100, duration: 1.7, ease: 'power2.inOut',
      onUpdate: function () { counter.textContent = String(Math.round(count.v)).padStart(3, '0'); }
    }, 0.1)
    .to('.loader__bar i', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0.1)
    .to('.loader__top, .loader__bottom, .loader__mid', { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in', stagger: 0.04 }, '>-0.1')
    .addLabel('open')
    .to('.loader__panel--top', { yPercent: -101, duration: 1.3, ease: 'expo.inOut' }, 'open')
    .to('.loader__panel--bottom', { yPercent: 101, duration: 1.3, ease: 'expo.inOut' }, 'open')
    .to(heroImg, { scale: 1, yPercent: 0, duration: 2.4, ease: 'expo.out' }, 'open+=0.15')
    .to(heroChars, {
      yPercent: 0, duration: 1.4,
      stagger: { each: 0.045, from: 'center' }
    }, 'open+=0.55')
    .to('.hero__intro .line > span', { yPercent: 0, duration: 1.1, stagger: 0.07 }, 'open+=0.95')
    .to('.hero__caption .line > span', { yPercent: 0, duration: 1.1, stagger: 0.07 }, 'open+=1.05')
    .to('.nav > *', { yPercent: 0, opacity: 1, duration: 1, stagger: 0.08 }, 'open+=0.9')
    .to('.js-hero-fade, .scroll-cue', { opacity: 1, duration: 1, stagger: 0.1 }, 'open+=1.3');

  // Filet de sécurité
  setTimeout(function () { if (intro.progress() < 1) intro.progress(1); }, 9000);

  /* ------------------------------------------------------------------------
     Hero au défilement : la bande suivante glisse par-dessus
     ------------------------------------------------------------------------ */
  var hero = $('.hero');
  var heroScroll = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      pin: true,
      pinSpacing: false
    }
  });
  heroScroll
    .to('.hero__media', { yPercent: 18, scale: 1.08, ease: 'none' }, 0)
    .to('.hero__veil', { opacity: 0.75, ease: 'none' }, 0)
    .to('.hero__title', { yPercent: -35, ease: 'none' }, 0)
    .to(heroChars, {
      y: function (i) { return -gsap.utils.mapRange(0, heroChars.length - 1, 30, 180, Math.abs(i - (heroChars.length - 1) / 2) * 2); },
      ease: 'none'
    }, 0)
    .to('.hero__meta', { yPercent: -60, opacity: 0, ease: 'none' }, 0)
    .to('.scroll-cue-wrap, .hero__side', { opacity: 0, ease: 'none', duration: 0.3 }, 0);

  /* ------------------------------------------------------------------------
     Révélations génériques
     ------------------------------------------------------------------------ */
  $$('.js-reveal').forEach(function (el) {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  $$('.js-split-lines').forEach(function (el) {
    gsap.from($$('.ln', el), {
      yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }
    });
  });

  $$('.eyebrow').forEach(function (el) {
    if (el.closest('.svc')) return;
    gsap.from(el, {
      opacity: 0, x: -20, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  /* ------------------------------------------------------------------------
     Manifeste : mots qui s'allument, surlignage, tracé GPS
     ------------------------------------------------------------------------ */
  var mWords = $$('.manifesto__text .w');
  gsap.fromTo(mWords, { opacity: 0.14 }, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.manifesto__text', start: 'top 82%', end: 'bottom 45%', scrub: true }
  });
  $$('.hl').forEach(function (hl) {
    gsap.to(hl, {
      backgroundSize: '100% 78%', ease: 'none',
      scrollTrigger: { trigger: hl, start: 'top 72%', end: 'top 48%', scrub: true }
    });
  });

  var route = $('#routeLine');
  var walker = $('#routeWalker');
  if (route && route.getTotalLength) {
    var len = route.getTotalLength();
    gsap.set(route, { strokeDasharray: len, strokeDashoffset: len });
    var wps = $$('.manifesto__route .wp');
    gsap.set(wps, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' });
    var routeState = { p: 0 };
    gsap.to(routeState, {
      p: 1, ease: 'none',
      scrollTrigger: { trigger: '.manifesto__route', start: 'top 85%', end: 'bottom 30%', scrub: 0.8 },
      onUpdate: function () {
        var d = len * routeState.p;
        route.style.strokeDashoffset = len - d;
        var pt = route.getPointAtLength(d);
        walker.setAttribute('cx', pt.x);
        walker.setAttribute('cy', pt.y);
      }
    });
    wps.forEach(function (wp, i) {
      gsap.to(wp, {
        opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)',
        scrollTrigger: {
          trigger: '.manifesto__route',
          start: function () { return 'top+=' + (i / (wps.length - 1)) * 0.6 * window.innerHeight + ' 85%'; },
          toggleActions: 'play none none reverse'
        }
      });
    });
  }

  $$('.js-parallax-img').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -16 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
  gsap.from('.manifesto__photo', {
    clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.manifesto__photo', start: 'top 85%', once: true }
  });
  gsap.from('.manifesto__badges .badge', {
    scale: 0, rotation: -90, duration: 1, ease: 'back.out(2)', stagger: 0.1,
    scrollTrigger: { trigger: '.manifesto__badges', start: 'top 90%', once: true }
  });

  /* ------------------------------------------------------------------------
     Responsive : services horizontaux, carnet, etc.
     ------------------------------------------------------------------------ */
  var mm = gsap.matchMedia();

  mm.add('(min-width: 901px)', function () {
    // --- Services : défilement horizontal épinglé
    var track = $('.hscroll__track');
    var dist = function () { return track.scrollWidth - window.innerWidth; };
    var hTween = gsap.to(track, {
      x: function () { return -dist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: '.hscroll',
        start: 'top top',
        end: function () { return '+=' + dist(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
    gsap.to('.hscroll__bar i', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: '.hscroll', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true }
    });

    $$('.svc').forEach(function (svc, i) {
      var name = $('.svc__name', svc);
      gsap.fromTo(name, { xPercent: i === 0 ? 0 : 18 }, {
        xPercent: i === 0 ? -6 : -6, ease: 'none',
        scrollTrigger: { trigger: svc, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true }
      });
      $$('.tilt', svc).forEach(function (t, k) {
        var rot = +t.dataset.rot || 0;
        gsap.fromTo(t, { x: 160 + k * 120, rotation: rot * 2.4 }, {
          x: -60 - k * 60, rotation: rot, ease: 'none',
          scrollTrigger: { trigger: svc, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true }
        });
      });
    });

    // --- Carnet : parallaxe par carte + profondeur à la souris
    $$('.card').forEach(function (card) {
      var sp = +card.dataset.speed || 1;
      gsap.fromTo(card, { y: (sp - 1) * 400 + 60 }, {
        y: (1 - sp) * 400 - 60, ease: 'none',
        scrollTrigger: { trigger: '.logbook__board', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    gsap.fromTo('.logbook__badge', { y: 120 }, {
      y: -120, ease: 'none',
      scrollTrigger: { trigger: '.logbook__board', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    var board = $('.logbook__board');
    var movers = $$('.card').map(function (c) {
      return { x: gsap.quickTo(c, 'x', { duration: 1.2, ease: 'power3' }), s: +c.dataset.speed || 1 };
    });
    var onMove = function (e) {
      var r = board.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      movers.forEach(function (m) { m.x(nx * 60 * (m.s - 0.6) * 1.6); });
    };
    board.addEventListener('pointermove', onMove);
    return function () { board.removeEventListener('pointermove', onMove); };
  });

  mm.add('(max-width: 900px)', function () {
    $$('.svc').forEach(function (svc) {
      gsap.from($$('.tilt', svc), {
        y: 80, opacity: 0, rotation: function (i, t) { return (+t.dataset.rot || 0) * 2.5; },
        duration: 1.4, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: $('.svc__media', svc), start: 'top 85%', once: true }
      });
      gsap.from($('.svc__name', svc), {
        yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: svc, start: 'top 80%', once: true }
      });
    });
  });

  /* ------------------------------------------------------------------------
     Expansion d'image : de la vignette au plein cadre
     ------------------------------------------------------------------------ */
  var expandChars = $$('.expand__title .ch');
  var expTl = gsap.timeline({
    scrollTrigger: { trigger: '.expand', start: 'top top', end: '+=130%', pin: true, scrub: 1 }
  });
  expTl
    .fromTo('.expand__frame', { clipPath: 'inset(18% 26% 18% 26%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 1 }, 0)
    .fromTo('.expand__frame img', { scale: 1.25 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
    .from(expandChars, { yPercent: 115, ease: 'expo.out', duration: 0.6, stagger: 0.025 }, 0.45)
    .from('.expand__labels > *', { opacity: 0, y: 12, duration: 0.3, stagger: 0.1 }, 0.6)
    .to({}, { duration: 0.25 });

  /* ------------------------------------------------------------------------
     Carnet de route : titre + cartes lancées sur la table
     ------------------------------------------------------------------------ */
  gsap.from('.logbook__title .ch', {
    yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: { each: 0.035, from: 'start' },
    scrollTrigger: { trigger: '.logbook__title', start: 'top 85%', once: true }
  });

  $$('.card').forEach(function (card, i) {
    var inner = $('.card-inner', card);
    var rot = +card.dataset.rot || 0;
    gsap.fromTo(inner,
      { y: 220, opacity: 0, rotation: rot * 2.6 + (i % 2 ? 14 : -14) },
      {
        y: 0, opacity: 1, rotation: rot, duration: 1.5, ease: 'expo.out',
        delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: card, start: 'top 95%', once: true }
      });
    if (finePointer) {
      card.addEventListener('pointerenter', function () {
        gsap.to(inner, { rotation: 0, scale: 1.04, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
        gsap.set(card, { zIndex: 5 });
      });
      card.addEventListener('pointerleave', function () {
        gsap.to(inner, { rotation: rot, scale: 1, duration: 0.9, ease: 'expo.out', overwrite: 'auto' });
        gsap.set(card, { zIndex: '' });
      });
    }
  });

  gsap.from('.logbook__badge', {
    scale: 0, rotation: -120, duration: 1.2, ease: 'back.out(2)', stagger: 0.15,
    scrollTrigger: { trigger: '.logbook__board', start: 'top 70%', once: true }
  });

  /* ------------------------------------------------------------------------
     Bandeau défilant réactif à la vitesse
     ------------------------------------------------------------------------ */
  var rows = $$('.marquee__row');
  var loops = rows.map(function (row, i) {
    var item = $('.marquee__item', row);
    // on duplique pour une boucle sans couture
    for (var k = 0; k < 3; k++) {
      var c = item.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      row.appendChild(c);
    }
    var dir = i % 2 === 0 ? -1 : 1;
    gsap.set(row, { xPercent: dir === -1 ? 0 : -25 });
    return gsap.to(row, {
      xPercent: dir === -1 ? -25 : 0,
      ease: 'none',
      duration: 22 + i * 4,
      repeat: -1
    });
  });
  var skewTo = gsap.quickTo('.marquee__row', 'skewX', { duration: 0.6, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: function (self) {
      var v = self.getVelocity();
      var boost = 1 + Math.min(Math.abs(v) / 300, 5);
      loops.forEach(function (l) {
        gsap.to(l, { timeScale: (self.direction === 1 ? 1 : -1) * boost, duration: 0.2, overwrite: true });
        gsap.to(l, { timeScale: self.direction === 1 ? 1 : -1, duration: 1.2, delay: 0.25, ease: 'power2.out' });
      });
      skewTo(gsap.utils.clamp(-8, 8, v / -250));
    },
    onLeave: function () { skewTo(0); },
    onLeaveBack: function () { skewTo(0); }
  });

  /* ------------------------------------------------------------------------
     Méthode
     ------------------------------------------------------------------------ */
  gsap.from('.steps', {
    clipPath: 'inset(0% 100% 0% 0%)', duration: 1.4, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.steps', start: 'top 85%', once: true }
  });
  $$('.js-step').forEach(function (step) {
    gsap.from($$('.step__num, .step__name, .step__desc, .step__icon', step), {
      y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06,
      scrollTrigger: { trigger: step, start: 'top 88%', once: true }
    });
  });

  /* ------------------------------------------------------------------------
     Contact : parallaxe + grand titre
     ------------------------------------------------------------------------ */
  gsap.fromTo('.cta__media', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.from('.cta__title .ch', {
    yPercent: 115, rotation: 6, duration: 1.5, ease: 'expo.out', stagger: 0.05,
    scrollTrigger: { trigger: '.cta__title', start: 'top 85%', once: true }
  });
  gsap.from('.footer__grid > *', {
    y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: '.footer', start: 'top 92%', once: true }
  });

  /* ------------------------------------------------------------------------
     Recalculs
     ------------------------------------------------------------------------ */
  var refresh = function () { fitText(); ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(refresh, 200);
  });
})();

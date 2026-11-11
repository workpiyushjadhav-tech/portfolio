/* Case study pages: side stepper (active section + smooth jump) and reveal-on-scroll.
   Shared behaviour (nav, menu, accessibility panel) lives in js/site.js. */
(() => {
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const calm = () => document.documentElement.hasAttribute('data-a11y-calm') || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const items = $$('.stepper-item');
  if (items.length) {
    const sections = items.map(i => document.getElementById(i.dataset.section));
    const setActive = id => items.forEach(i => {
      const on = i.dataset.section === id;
      i.classList.toggle('active', on);
      if (on) i.setAttribute('aria-current', 'true'); else i.removeAttribute('aria-current');
    });
    const current = () => {
      const mid = innerHeight * 0.4;
      let cur = sections[0];
      sections.forEach(s => { if (s && s.getBoundingClientRect().top <= mid) cur = s; });
      return cur && cur.id;
    };
    let queued = false;
    addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { setActive(current()); queued = false; });
    }, { passive: true });
    items.forEach(i => i.addEventListener('click', () => {
      const t = document.getElementById(i.dataset.section);
      if (t) t.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    }));
    setActive(current());

    /* Stop the stepper above the contact block: once the (dark beige) contact
       section scrolls up to the stepper's bottom edge, the stepper rides up with it. */
    const stepper = document.getElementById('side-stepper');
    const contact = document.getElementById('contact');
    if (stepper && contact) {
      let pushQueued = false;
      const place = () => {
        const h = stepper.offsetHeight;
        const naturalBottom = innerHeight / 2 + h / 2;
        const limit = contact.getBoundingClientRect().top - 24;
        stepper.style.setProperty('--push', Math.min(0, limit - naturalBottom) + 'px');
        pushQueued = false;
      };
      const queuePlace = () => { if (!pushQueued) { pushQueued = true; requestAnimationFrame(place); } };
      addEventListener('scroll', queuePlace, { passive: true });
      addEventListener('resize', queuePlace);
      place();
    }
  }

  const targets = $$('.appear');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(t => io.observe(t));
  } else {
    targets.forEach(t => t.classList.add('visible'));
  }

  /* Animated GIFs: a Pause / Play button on each, and they start paused when
     "Calm layout" or the OS reduced-motion setting is on (WCAG 2.2.2). */
  const root = document.documentElement;
  const wantsCalm = () => root.hasAttribute('data-a11y-calm') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gifs = $$('img[src$=".gif"]').map(img => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gif-toggle';
    img.insertAdjacentElement('afterend', btn);
    let canvas = null, paused = false;
    const label = img.alt || 'animation';
    const freeze = () => {
      if (paused) return;
      paused = true;
      const draw = () => {
        if (!paused || canvas) return;
        canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.className = img.className;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', label + ' (paused)');
        try { canvas.getContext('2d').drawImage(img, 0, 0); } catch (e) {}
        img.classList.add('gif-hidden');
        img.insertAdjacentElement('beforebegin', canvas);
      };
      if (img.complete && img.naturalWidth) draw();
      else { img.loading = 'eager'; img.addEventListener('load', draw, { once: true }); }
      btn.textContent = 'Play animation';
      btn.setAttribute('aria-label', 'Play animation: ' + label);
    };
    const play = () => {
      paused = false;
      if (canvas) { canvas.remove(); canvas = null; }
      img.classList.remove('gif-hidden');
      btn.textContent = 'Pause animation';
      btn.setAttribute('aria-label', 'Pause animation: ' + label);
    };
    btn.addEventListener('click', () => (paused ? play() : freeze()));
    const state = { freeze, play };
    play();
    if (wantsCalm()) freeze();
    return state;
  });
  if (gifs.length) {
    new MutationObserver(() => gifs.forEach(g => wantsCalm() ? g.freeze() : null))
      .observe(root, { attributes: true, attributeFilter: ['data-a11y-calm'] });
  }
})();

/* Reveal on scroll (slow-reveal reference): blocks that start below the fold rise + un-blur on the entry spring */
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.hasAttribute('data-a11y-calm')) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-revealed');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  var vh = window.innerHeight;
  Array.prototype.forEach.call(els, function (el) {
    if (el.getBoundingClientRect().top < vh) return;   // on screen at load: page entry handles it
    el.classList.add('is-pending');
    io.observe(el);
  });
})();

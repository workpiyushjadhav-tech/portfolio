(() => {
  const $ = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const root = document.documentElement;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const calmNow = () => root.hasAttribute('data-a11y-calm');
  const flat = () => calmNow() || root.dataset.ui === 'baseline'; /* baseline UI has no decorative motion */

  /* Navbar menu (small screens) — behaviour from the new-theme header */
  const header = $('.site-header'), menuBtn = header && $('.menu-toggle', header);
  if (header && menuBtn) {
    const closeNav = () => {
      header.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open navigation');
      menuBtn.title = 'Open navigation';
    };
    menuBtn.addEventListener('click', () => {
      const open = header.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menuBtn.title = open ? 'Close navigation' : 'Open navigation';
    });
    $$('nav a', header).forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('click', e => { if (!header.contains(e.target)) closeNav(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && header.classList.contains('menu-open')) { closeNav(); menuBtn.focus(); }
    });
    addEventListener('resize', () => { if (innerWidth > 640) closeNav(); });
  }

  /* Scroll reveal (staggered) */
  const items = $$('.reveal, .project-card');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const t = en.target;
      const delay = t.classList.contains('project-card') ? [...t.parentElement.children].indexOf(t) * 40 : 0;
      setTimeout(() => t.classList.add('visible'), delay);
      io.unobserve(t);
    }), { threshold: 0.12 });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('visible'));
  }

  /* Looping hero animations pause while the hero is off-screen */
  const heroEl = $('#hero');
  if (heroEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => heroEl.classList.toggle('is-offscreen', !e.isIntersecting))).observe(heroEl);
  }

  /* Graceful image fallback */
  $$('.card-image img, .about-photo-img, .hero-photo-inline img').forEach(img => {
    const fail = () => img.closest('.card-image, .about-photo-card, .hero-photo-inline')?.classList.add('img-missing');
    img.addEventListener('error', fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* Card tilt (mouse only) */
  if (fine) {
    $$('.project-card').forEach(card => {
      const inner = $('.project-card-inner', card);
      card.addEventListener('pointermove', e => {
        if (flat()) return;
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 3.5}deg)`;
      });
      card.addEventListener('pointerleave', () => { inner.style.transform = ''; });
    });
  }

  /* Hero photo wiggle */
  const photo = $('.hero-photo-inline');
  photo?.addEventListener('click', () => {
    if (flat()) return;
    photo.style.transform = 'rotate(10deg) scale(1.14)';
    setTimeout(() => { photo.style.transform = ''; }, 420);
  });

  /* ── Theme (light / dark) ──
     The inline <head> script sets data-theme before first paint (saved choice, else the OS setting).
     This block keeps the button, the browser UI colour and the OS-change listener in sync. */
  const THEME_KEY = 'pj-theme';
  const THEME_COLOURS = root.dataset.ui === 'baseline' ? { light: '#FAFAF8', dark: '#121110' } : { light: '#FBF6EC', dark: '#17140F' };
  const themeBtn = $('.theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const currentTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');
  function paintTheme(t) {
    root.dataset.theme = t;
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLOURS[t]);
    if (themeBtn) {
      const label = 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.title = label;
    }
  }
  const savedTheme = () => { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } };
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      const animate = !matchMedia('(prefers-reduced-motion: reduce)').matches && !calmNow();
      root.classList.add('theme-anim');
      if (animate) {
        const out = $(next === 'dark' ? '.theme-sun' : '.theme-moon', themeBtn);
        const inc = $(next === 'dark' ? '.theme-moon' : '.theme-sun', themeBtn);
        const timing = { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)' };
        out.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(-22px,30px) rotate(-65deg)', opacity: 0 }], timing);
        inc.animate([{ transform: 'translate(22px,30px) rotate(65deg)', opacity: 0 }, { transform: 'translate(0,0) rotate(0)', opacity: 1 }], timing);
      }
      paintTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      setTimeout(() => root.classList.remove('theme-anim'), 400);
    });
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!savedTheme()) paintTheme(e.matches ? 'dark' : 'light');
  });
  paintTheme(currentTheme());

  /* ── Accessibility widget ── */
  const KEY = 'pj-a11y', flags = ['contrast', 'font', 'calm', 'links', 'space'];
  const panel = $('#a11y-panel'), fab = $('#a11y-fab'), preset = $('#a11y-preset');
  let fontLink;
  const read = () => {
    const s = { text: +(root.dataset.a11yText || 0) };
    flags.forEach(k => { s[k] = root.hasAttribute('data-a11y-' + k); });
    return s;
  };
  function sync() {
    const s = read();
    $$('[data-flag]', panel).forEach(b => b.setAttribute('aria-checked', String(s[b.dataset.flag])));
    $$('[data-text]', panel).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.text === s.text)));
    preset.setAttribute('aria-checked', String(s.text > 0 && flags.every(k => s[k])));
    if (s.font && !fontLink) {
      fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
      document.head.appendChild(fontLink);
    }
  }
  function apply(s) {
    if (s.text) root.dataset.a11yText = s.text; else delete root.dataset.a11yText;
    flags.forEach(k => root.toggleAttribute('data-a11y-' + k, !!s[k]));
    sync();
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function togglePanel(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    if (open) preset.focus();
  }
  fab.addEventListener('click', () => togglePanel(panel.hidden));
  panel.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = read();
    if (b.id === 'a11y-preset') {
      const on = b.getAttribute('aria-checked') === 'true';
      flags.forEach(k => { s[k] = !on; });
      s.text = on ? 0 : 1;
    } else if (b.id === 'a11y-reset') {
      flags.forEach(k => { s[k] = false; });
      s.text = 0;
    } else if (b.dataset.flag) {
      s[b.dataset.flag] = !s[b.dataset.flag];
    } else if (b.dataset.text) {
      s.text = +b.dataset.text;
    } else return;
    apply(s);
  });
  document.addEventListener('click', e => { if (!panel.hidden && !e.target.closest('#a11y-widget')) togglePanel(false); });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) { togglePanel(false); fab.focus(); }
  });
  sync();
})();

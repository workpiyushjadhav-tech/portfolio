/* Testimonial carousel + gallery (from demo3.html). Loaded after js/site.js. */
/* ── Testimonials Carousel ── */
(function () {
  const testimonials = [
    {
      name: 'Scott Brothers',
      role: 'Lead Animator, Twinkl Educational Publishing',
      avatar: 'images/1516259780447.avif',
      text: "I worked with Piyush for a couple of years as his Design Manager on ALEKS Adventure, a visual math product for the K-3 market. I was impressed by his diligence and thoughtfulness as a visual designer. From the start of the project I was able to count on his quality output and timely deliveries. Piyush primarily focused on topic background work, but also contributed to larger scale game maps. Piyush absorbed feedback, provided his own ideas, and was always highly collaborative with his design teammates. In meetings he was candid in a positive way and asked questions if requirements were not clear. As a manager, I appreciated his dedication to open communication. I enjoyed working with Piyush and he would be a great addition to any design team."
    },
    {
      name: 'Kedar Ambatkar',
      role: 'Design Lead, Zeus Learning',
      avatar: 'images/1787631899048.avif',
      text: "I had the pleasure of working with Piyush for over two years, and during that time, he consistently demonstrated creativity, punctuality, and a deep sense of commitment to his work. His strong skills in UI design and data visualization stood out in every project we collaborated on. Piyush is not only technically sound but also a loyal and dependable teammate who brings great value to any design team."
    },
    {
      name: 'Vinicia Dsouza',
      role: 'Senior UI Designer, Zeus Learning',
      avatar: 'images/1788888423791.avif',
      text: "Working with Piyush was one of the highlights of my time on the team. He consistently brought creative, well-thought-out ideas to the table and more importantly, he followed through with strong execution. His designs were not only innovative but also grounded in user needs and project goals. Piyush was especially dependable during high-pressure situations. He stayed calm, focused, and handled challenges with confidence and clarity, which made a big difference when deadlines were tight. As a teammate, he was approachable, open to discussion, and very easy to collaborate with. Even when we had differing opinions, working through ideas was seamless as we always found common ground without any friction. Piyush is not just a talented designer but also a true team player. He brought both skill and a great attitude to the table. I’d be happy to recommend him and would gladly work with him again in the future."
    }
  ];

  const carousel = document.getElementById('testimonial-carousel');
  const track    = document.getElementById('testimonial-track');
  const dotsWrap = document.getElementById('testimonial-dots');
  const prevBtn  = document.getElementById('testimonial-prev');
  const nextBtn  = document.getElementById('testimonial-next');

  const modal         = document.getElementById('testimonial-modal');
  const modalPanel     = document.getElementById('testimonial-modal-panel');
  const modalClose      = document.getElementById('testimonial-modal-close');
  const modalAvatarImg   = document.getElementById('testimonial-modal-avatar');
  const modalName          = document.getElementById('testimonial-modal-name');
  const modalRole            = document.getElementById('testimonial-modal-role');
  const modalText              = document.getElementById('testimonial-modal-text');

  if (!carousel || !track || testimonials.length === 0) return;

  const AUTOPLAY_MS = 8000; /* slow enough to read; the Pause button below stops it for good */
  const total = testimonials.length;
  const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reducedMq.matches || document.documentElement.hasAttribute('data-a11y-calm');

  let activeIndex = 0;
  let autoplayTimer = null;
  let lastFocusedEl = null;
  let modalClickHandler = null;
  let userPaused = false;
  const pauseBtn = document.getElementById('testimonial-pause');

  /* Build cards from one data array so markup and behaviour can never drift apart. */
  const cardEls = testimonials.map((t, i) => {
    const card = document.createElement('article');
    card.className = 'testimonial-card';
    card.id = 'testimonial-card-' + i;
    card.dataset.index = String(i);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', 'Read full testimonial from ' + t.name);

    card.innerHTML =
      '<span class="testimonial-quote-mark" aria-hidden="true">&#8220;</span>' +
      '<div class="testimonial-avatar"><img src="' + t.avatar + '" alt="" loading="lazy"></div>' +
      '<h3 class="testimonial-name">' + t.name + '</h3>' +
      '<p class="testimonial-role">' + t.role + '</p>' +
      '<p class="testimonial-text">' + t.text + '</p>';

    const open = () => openModal(i, card);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    const avatarBox = card.querySelector('.testimonial-avatar');
    avatarBox.dataset.initials = t.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
    avatarBox.querySelector('img').addEventListener('error', function () { avatarBox.classList.add('img-missing'); });

    track.appendChild(card);
    return card;
  });

  /* Build dot indicators from the same array. */
  const dotEls = testimonials.map((t, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'testimonial-dot';
    dot.setAttribute('aria-label', 'Show testimonial from ' + t.name);
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function computeSlot(cardIndex) {
    const diff = (cardIndex - activeIndex + total) % total;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    return 'left';
  }

  function render() {
    cardEls.forEach((card, i) => {
      const slot = computeSlot(i);
      card.dataset.slot = slot;
      card.setAttribute('aria-hidden', slot === 'center' ? 'false' : 'true');
      card.tabIndex = slot === 'center' ? 0 : -1;
    });
    dotEls.forEach((dot, i) => {
      const isActive = i === activeIndex;
      dot.classList.toggle('is-active', isActive);
      if (isActive) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
  }

  function goTo(index, isManual) {
    activeIndex = ((index % total) + total) % total;
    render();
    if (isManual) restartAutoplayIfRunning();
  }

  function next() { goTo(activeIndex + 1, false); }

  function startAutoplay() {
    if (autoplayTimer || userPaused || prefersReducedMotion()) return; // never stack a second interval
    autoplayTimer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (!autoplayTimer) return;
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
  /* A manual click only resets the 3s clock if autoplay was actually running.
     If it's paused (hover, focus, modal open, scrolled off-screen), a click
     shouldn't silently un-pause it behind the reason it was paused for. */
  function restartAutoplayIfRunning() {
    if (autoplayTimer) { stopAutoplay(); startAutoplay(); }
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      pauseBtn.textContent = userPaused ? 'Play slideshow' : 'Pause slideshow';
      if (userPaused) stopAutoplay(); else startAutoplay();
    });
  }

  nextBtn && nextBtn.addEventListener('click', () => goTo(activeIndex + 1, true));
  prevBtn && prevBtn.addEventListener('click', () => goTo(activeIndex - 1, true));

  /* Pause on hover / keyboard-focus (desktop), resume on leave. */
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', (e) => {
    if (!carousel.contains(e.relatedTarget)) startAutoplay();
  });

  /* Pause when the section is off-screen or the tab is hidden, so it never
     advances a dozen times in the background and dumps the user somewhere
     unexpected when they scroll back. */
  function isCarouselVisible() {
    const rect = carousel.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => { entry.isIntersecting ? startAutoplay() : stopAutoplay(); });
    }, { threshold: 0.2 }).observe(carousel);
  } else if (isCarouselVisible()) {
    startAutoplay();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else if (isCarouselVisible()) startAutoplay();
  });

  /* ── Modal ── */
  function isMobileViewport() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  function openModal(index, triggerEl) {
    const t = testimonials[index];
    lastFocusedEl = triggerEl || document.activeElement;

    modalAvatarImg.style.visibility = 'visible';
    modalAvatarImg.src = t.avatar;
    modalAvatarImg.alt = '';
    modalName.textContent = t.name;
    modalRole.textContent = t.role;
    modalText.textContent = t.text;

    stopAutoplay();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    /* Desktop: only the backdrop closes it, so the quote stays selectable.
       Mobile: any tap on the modal closes it, per the "touch anywhere" ask. */
    modalClickHandler = isMobileViewport()
      ? function () { closeModal(); }
      : function (e) { if (e.target === modal) closeModal(); };
    modal.addEventListener('click', modalClickHandler);

    setBackgroundInert(true);
    document.addEventListener('keydown', handleModalKeydown);
    requestAnimationFrame(() => modalPanel.focus());
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modalClickHandler) {
      modal.removeEventListener('click', modalClickHandler);
      modalClickHandler = null;
    }
    document.removeEventListener('keydown', handleModalKeydown);
    setBackgroundInert(false);

    if (lastFocusedEl) lastFocusedEl.focus();
    lastFocusedEl = null;

    if (isCarouselVisible() && !document.hidden) startAutoplay();
  }

  /* Everything except the dialog is inert while it is open, so Tab and screen-reader browsing stay inside it. */
  function setBackgroundInert(on) {
    Array.from(document.body.children).forEach((el) => {
      if (el === modal || el.tagName === 'SCRIPT') return;
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }

  function handleModalKeydown(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') { /* only the close button is interactive: keep focus cycling on it */
      e.preventDefault();
      (document.activeElement === modalClose ? modalPanel : modalClose).focus();
    }
  }

  modalAvatarImg.addEventListener('error', function () { modalAvatarImg.style.visibility = 'hidden'; });
  modalClose && modalClose.addEventListener('click', closeModal);

  /* ── Init ── */
  render();
})();

/* ── Gallery: mouse hover, keyboard focus or a tap (touch/pen) brings a frame into focus ── */
(function () {
  const strip = document.getElementById('gallery-strip');
  if (!strip) return;
  const items = Array.from(strip.children);

  function activate(item) {
    items.forEach(function (it) { it.classList.toggle('is-active', it === item); });
    strip.classList.toggle('has-active', !!item);
  }

  items.forEach(function (item) {
    const img = item.querySelector('img');
    if (img) img.addEventListener('error', function () { item.classList.add('img-missing'); });
    item.tabIndex = 0;

    item.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activate(item); });
    item.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') activate(null); });
    item.addEventListener('focus', function () { if (item.matches(':focus-visible')) { item._kb = true; activate(item); } });
    item.addEventListener('blur', function () { if (item._kb) { item._kb = false; activate(null); } });
    item.addEventListener('click', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') activate(item.classList.contains('is-active') ? null : item);
    });
  });

  /* Tapping anywhere else on a touch screen puts everything back */
  document.addEventListener('click', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse' && !e.target.closest('.gallery-item')) activate(null);
  });
})();

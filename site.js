(() => {
  'use strict';

  document.documentElement.classList.add('js');
  const header = document.getElementById('siteHeader');
  const burger = document.getElementById('burgerBtn');
  const menu = document.getElementById('mobileMenu');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer.site');
  const motionButton = document.getElementById('motionToggle');
  const motionLabel = motionButton.querySelector('[data-motion-label]');
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const videos = [...document.querySelectorAll('video')];
  let motionPaused = mediaQuery.matches;

  function setMenu(open, returnFocus = false) {
    menu.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.inert = !open;
    main.inert = open;
    footer.inert = open;
    if (open) menu.querySelector('a').focus();
    else if (returnFocus) burger.focus();
  }

  menu.inert = true;
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false, true)));
  document.addEventListener('keydown', event => {
    if (!menu.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false, true);
    }
    if (event.key === 'Tab') {
      const elements = [burger, ...menu.querySelectorAll('a')];
      const current = elements.indexOf(document.activeElement);
      const next = (current + (event.shiftKey ? -1 : 1) + elements.length) % elements.length;
      event.preventDefault();
      elements[next].focus();
    }
  });
  window.matchMedia('(min-width: 821px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });

  function motionAllowed() {
    return !motionPaused && !mediaQuery.matches && !document.hidden;
  }

  function syncVideo(video) {
    if (motionAllowed() && video.dataset.inview === 'true') {
      video.play().catch(() => {});
    } else video.pause();
  }

  function updateMotion() {
    document.body.classList.toggle('motion-paused', motionPaused);
    document.body.classList.toggle('motion-reduced', mediaQuery.matches);
    motionButton.setAttribute('aria-pressed', String(motionPaused));
    motionButton.disabled = mediaQuery.matches;
    motionLabel.textContent = mediaQuery.matches ? 'Movimento reduzido' : motionPaused ? 'Ativar movimento' : 'Pausar movimento';
    motionButton.setAttribute('aria-label', motionLabel.textContent);
    videos.forEach(syncVideo);
  }

  motionButton.addEventListener('click', () => {
    motionPaused = !motionPaused;
    updateMotion();
    scheduleScroll();
  });
  mediaQuery.addEventListener('change', () => {
    motionPaused = mediaQuery.matches;
    updateMotion();
    scheduleScroll();
  });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
    videos.forEach(syncVideo);
  });

  const revealElements = document.querySelectorAll('.reveal, .reveal-img');
  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveals.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    revealElements.forEach(element => reveals.observe(element));

    const scenes = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target;
        element.classList.toggle('scene-idle', !entry.isIntersecting);
        element.classList.toggle('is-inview', entry.isIntersecting);
        if (element.tagName === 'VIDEO') {
          element.dataset.inview = String(entry.isIntersecting);
          syncVideo(element);
        }
      });
    }, { threshold: .12 });
    document.querySelectorAll('[data-motion-scene], video').forEach(element => scenes.observe(element));
  } else {
    revealElements.forEach(element => element.classList.add('is-visible'));
    document.querySelectorAll('[data-motion-scene]').forEach(element => element.classList.add('is-inview'));
    videos.forEach(video => { video.dataset.inview = 'true'; });
  }

  const parallaxElements = [...document.querySelectorAll('[data-parallax]')];
  let scrollFrame = 0;
  function onScroll() {
    scrollFrame = 0;
    header.classList.toggle('scrolled', window.scrollY > 40);
    if (!motionAllowed()) return;
    parallaxElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const movement = Math.max(-28, Math.min(28, (window.innerHeight / 2 - rect.top - rect.height / 2) * .065));
      element.style.setProperty('--scroll-y', `${movement.toFixed(1)}px`);
    });
  }
  function scheduleScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(onScroll);
  }
  document.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', scheduleScroll, { passive: true });

  document.querySelectorAll('[data-pointer-scene]').forEach(scene => {
    let pointerFrame = 0;
    let x = 0;
    let y = 0;
    scene.addEventListener('pointermove', event => {
      if (!finePointer.matches || !motionAllowed() || event.pointerType !== 'mouse') return;
      const rect = scene.getBoundingClientRect();
      x = (event.clientX - rect.left - rect.width / 2) / rect.width * 18;
      y = (event.clientY - rect.top - rect.height / 2) / rect.height * 18;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
        scene.style.setProperty('--pointer-x', `${x.toFixed(1)}px`);
        scene.style.setProperty('--pointer-y', `${y.toFixed(1)}px`);
        pointerFrame = 0;
      });
    }, { passive: true });
    scene.addEventListener('pointerleave', () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      scene.style.setProperty('--pointer-x', '0px');
      scene.style.setProperty('--pointer-y', '0px');
    });
  });

  document.querySelectorAll('[data-carousel]').forEach(root => {
    const track = root.querySelector('.evento-slides');
    const slides = [...root.querySelectorAll('.evento-slide')];
    if (!track || slides.length < 2) return;
    const dots = root.querySelector('.evento-dots');
    const count = root.querySelector('.evento-count');
    const download = root.querySelector('.evento-download');
    const card = root.closest('.evento-card');
    const date = card.querySelector('[data-current-date]');
    const place = card.querySelector('[data-current-place]');
    let index = 0;
    let drag = null;

    root.setAttribute('role', 'region');
    root.setAttribute('aria-roledescription', 'carrossel');
    root.setAttribute('aria-label', 'Flyers da Sala de Oração');
    root.tabIndex = 0;
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
    slides.forEach((slide, number) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-label', `${number + 1} de ${slides.length}`);
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'evento-dot';
      dot.setAttribute('aria-label', `Ir para imagem ${number + 1}`);
      dot.addEventListener('click', () => go(number));
      dots.appendChild(dot);
      slide.querySelectorAll('img').forEach(image => { image.draggable = false; });
    });

    function go(number) {
      index = (number + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      [...dots.children].forEach((dot, number) => {
        dot.classList.toggle('active', number === index);
        dot.setAttribute('aria-pressed', String(number === index));
      });
      slides.forEach((slide, number) => slide.setAttribute('aria-hidden', String(number !== index)));
      count.textContent = `${index + 1} / ${slides.length}`;
      const active = slides[index];
      const file = active.querySelector('img').getAttribute('src');
      download.href = file;
      download.download = active.dataset.download || file.split('/').pop();
      date.textContent = active.dataset.date;
      place.textContent = active.dataset.place;
    }

    root.querySelector('.prev').addEventListener('click', () => go(index - 1));
    root.querySelector('.next').addEventListener('click', () => go(index + 1));
    root.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      go(index + (event.key === 'ArrowRight' ? 1 : -1));
    });
    root.addEventListener('pointerdown', event => {
      if (event.target.closest('button, a') || event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, id: event.pointerId };
      root.setPointerCapture(event.pointerId);
    });
    root.addEventListener('pointerup', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
    });
    root.addEventListener('pointercancel', () => { drag = null; });
    root.addEventListener('lostpointercapture', () => { drag = null; });
    go(0);
  });

  updateMotion();
  onScroll();
})();

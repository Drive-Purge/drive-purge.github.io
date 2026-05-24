/* ===== Theme Toggle ===== */
/* NOTE: Theme is initialized via inline <script> in <head> to prevent FOUC */
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

themeBtn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('dp-theme', next);
});

/* ===== Nav Scroll ===== */
const nav = document.getElementById('main-nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ===== Mobile Menu ===== */
const burger = document.getElementById('nav-burger');
const links = document.getElementById('nav-links');
burger.addEventListener('click', () => links.classList.toggle('open'));

/* Close mobile menu on ANY link click */
links.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    links.classList.remove('open');
  });
});

/* ===== Dropdown — JS-only (no hover conflict) ===== */
const dropdownTrigger = document.querySelector('.nav__dropdown-trigger');
const dropdownMenu = document.querySelector('.nav__dropdown');
if (dropdownTrigger && dropdownMenu) {
  dropdownTrigger.setAttribute('aria-expanded', 'false');
  dropdownTrigger.setAttribute('aria-haspopup', 'true');

  dropdownTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    const isActive = dropdownMenu.classList.toggle('active');
    dropdownTrigger.setAttribute('aria-expanded', String(isActive));
  });

  /* Close dropdown when clicking outside */
  document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('active');
      dropdownTrigger.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ===== Scroll Reveal ===== */
const revealEls = document.querySelectorAll(
  '.feature-card, .how__step, .pricing-card, .testimonial-card, .faq__item, .stat-item, .cta__inner, .dl-card, .blog-card'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach(el => revealObserver.observe(el));

/* ===== Counter Animation ===== */
const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 2000;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);
counters.forEach(el => counterObserver.observe(el));

/* ===== Smooth anchor scroll ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') { e.preventDefault(); return; }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      links.classList.remove('open');
    }
  });
});

/* ===== LIGHTBOX MODULE ===== */
(function() {
  const lightbox = document.getElementById('dp-lightbox');
  if (!lightbox) return;

  const backdrop = lightbox.querySelector('.dp-lightbox__backdrop');
  const closeBtn = lightbox.querySelector('.dp-lightbox__close');
  const zoomInBtn = lightbox.querySelector('.dp-lightbox__zoom-in');
  const zoomOutBtn = lightbox.querySelector('.dp-lightbox__zoom-out');
  const prevBtn = lightbox.querySelector('.dp-lightbox__nav--prev');
  const nextBtn = lightbox.querySelector('.dp-lightbox__nav--next');
  const content = lightbox.querySelector('.dp-lightbox__content');
  const caption = lightbox.querySelector('.dp-lightbox__caption');

  let activeGroup = [];
  let activeIndex = -1;

  // Zoom and Pan States
  let currentZoom = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Preloads adjacent image assets for instantaneous navigation feel
  const preloadImage = (url) => {
    const img = new Image();
    img.src = url;
  };

  const updateZoomAndPan = () => {
    const img = content.querySelector('img');
    if (!img) return;
    img.style.setProperty('--zoom', currentZoom);
    img.style.setProperty('--pan-x', `${panX}px`);
    img.style.setProperty('--pan-y', `${panY}px`);
  };

  const zoomIn = () => {
    currentZoom = Math.min(currentZoom + 0.25, 3);
    updateZoomAndPan();
  };

  const zoomOut = () => {
    currentZoom = Math.max(currentZoom - 0.25, 1);
    if (currentZoom === 1) {
      panX = 0;
      panY = 0;
    }
    updateZoomAndPan();
  };

  const resetZoom = () => {
    currentZoom = 1;
    panX = 0;
    panY = 0;
    updateZoomAndPan();
  };

  const setupDragging = (img) => {
    img.addEventListener('mousedown', (e) => {
      if (currentZoom <= 1) return;
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      img.classList.add('dragging');
    });

    img.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateZoomAndPan();
    });

    const stopDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      img.classList.remove('dragging');
    };

    img.addEventListener('mouseup', stopDrag);
    img.addEventListener('mouseleave', stopDrag);

    // Double-click to toggle zoom between 1x and 2x
    img.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (currentZoom > 1) {
        resetZoom();
      } else {
        currentZoom = 2;
        // Direct zoom center adjustment to click location
        const rect = img.getBoundingClientRect();
        const offsetX = e.clientX - (rect.left + rect.width / 2);
        const offsetY = e.clientY - (rect.top + rect.height / 2);
        panX = -offsetX;
        panY = -offsetY;
        updateZoomAndPan();
      }
    });
  };

  const openLightbox = (trigger, index, group) => {
    activeGroup = group;
    activeIndex = index;

    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('dp-lightbox--active');
    document.body.classList.add('lightbox-open');

    loadMedia(trigger);
  };

  const loadMedia = (trigger) => {
    content.innerHTML = '';
    const src = trigger.getAttribute('data-src');
    const isVideo = src.endsWith('.mp4');
    const capText = trigger.getAttribute('data-caption') || '';

    caption.textContent = capText;
    resetZoom();

    if (isVideo) {
      const video = document.createElement('video');
      video.src = src;
      video.autoplay = true;
      video.loop = true;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute('aria-label', capText);
      content.appendChild(video);

      // Hide gallery navigation and zoom controls for a single video
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      zoomInBtn.style.display = 'none';
      zoomOutBtn.style.display = 'none';
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = capText;
      content.appendChild(img);
      setupDragging(img);

      // Show zoom buttons for images
      zoomInBtn.style.display = 'flex';
      zoomOutBtn.style.display = 'flex';

      // Show nav if part of a gallery group
      if (activeGroup.length > 1) {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        // Preload adjacent images
        const nextIdx = (activeIndex + 1) % activeGroup.length;
        const prevIdx = (activeIndex - 1 + activeGroup.length) % activeGroup.length;
        preloadImage(activeGroup[nextIdx].getAttribute('data-src'));
        preloadImage(activeGroup[prevIdx].getAttribute('data-src'));
      } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      }
    }
  };

  const closeLightbox = () => {
    lightbox.classList.remove('dp-lightbox--active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    resetZoom();
    // Clear content to stop video playback instantly
    setTimeout(() => {
      content.innerHTML = '';
      caption.textContent = '';
    }, 300);
    activeGroup = [];
    activeIndex = -1;
  };

  const navigateLightbox = (direction) => {
    if (activeGroup.length <= 1) return;
    activeIndex = (activeIndex + direction + activeGroup.length) % activeGroup.length;
    loadMedia(activeGroup[activeIndex]);
  };

  // Add click handlers for all triggers
  document.querySelectorAll('[data-lightbox]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupName = trigger.getAttribute('data-lightbox');
      const group = Array.from(document.querySelectorAll(`[data-lightbox="${groupName}"]`));
      const index = group.indexOf(trigger);
      openLightbox(trigger, index, group);
    });
  });

  // Event Listeners for controls
  closeBtn.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  prevBtn.addEventListener('click', () => navigateLightbox(-1));
  nextBtn.addEventListener('click', () => navigateLightbox(1));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('dp-lightbox--active')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      navigateLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      navigateLightbox(1);
    } else if (e.key === '=' || e.key === '+') {
      // + key to zoom in
      const img = content.querySelector('img');
      if (img) zoomIn();
    } else if (e.key === '-') {
      // - key to zoom out
      const img = content.querySelector('img');
      if (img) zoomOut();
    } else if (e.key === ' ') {
      // Spacebar plays/pauses video if active
      const video = content.querySelector('video');
      if (video) {
        e.preventDefault(); // Prevent standard page scroll
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      }
    }
  });
})();

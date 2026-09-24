/* Automatic research illustrations. One clock drives both the slide and its bar. */
document.querySelectorAll('[data-slideshow]').forEach((slideshow) => {
  const slides = [...slideshow.querySelectorAll('[data-slide]')];
  const progress = slideshow.querySelector('[data-slide-progress]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverAvailable = window.matchMedia('(hover: hover)');
  const duration = 7000;
  let current = 0;
  let elapsed = 0;
  let previousTime = null;
  let frame = null;
  let pointerPaused = hoverAvailable.matches && slideshow.matches(':hover');
  let focusPaused = slideshow.contains(document.activeElement);

  function showSlide() {
    slides.forEach((slide, index) => { slide.hidden = !reducedMotion.matches && index !== current; });
    slideshow.dataset.theme = slides[current].dataset.theme;
  }

  function paintProgress() {
    progress.style.transform = `scaleX(${elapsed / duration})`;
  }

  function stop() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previousTime = null;
  }

  function tick(time) {
    if (previousTime !== null) elapsed += time - previousTime;
    previousTime = time;
    if (elapsed >= duration) {
      current = (current + Math.floor(elapsed / duration)) % slides.length;
      elapsed %= duration;
      showSlide();
    }
    paintProgress();
    frame = window.requestAnimationFrame(tick);
  }

  function resume() {
    stop();
    if (!reducedMotion.matches && !document.hidden && !pointerPaused && !focusPaused) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function applyMotionPreference() {
    stop();
    elapsed = 0;
    slideshow.classList.toggle('is-rotating', !reducedMotion.matches);
    if (reducedMotion.matches) {
      slideshow.removeAttribute('tabindex');
      slideshow.removeAttribute('aria-describedby');
      slideshow.removeAttribute('aria-roledescription');
    } else {
      slideshow.tabIndex = 0;
      slideshow.setAttribute('aria-describedby', 'slideshow-instructions');
      slideshow.setAttribute('aria-roledescription', 'carousel');
    }
    focusPaused = slideshow.contains(document.activeElement);
    showSlide();
    paintProgress();
    resume();
  }

  slideshow.addEventListener('pointerenter', (event) => {
    if (hoverAvailable.matches && event.pointerType !== 'touch') {
      pointerPaused = true;
      stop();
    }
  });
  slideshow.addEventListener('pointerleave', () => { pointerPaused = false; resume(); });
  slideshow.addEventListener('focusin', () => { focusPaused = true; stop(); });
  slideshow.addEventListener('focusout', (event) => {
    if (!slideshow.contains(event.relatedTarget)) {
      focusPaused = false;
      resume();
    }
  });
  slideshow.addEventListener('keydown', (event) => {
    if (reducedMotion.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    current = (current + (event.key === 'ArrowRight' ? 1 : slides.length - 1)) % slides.length;
    elapsed = 0;
    showSlide();
    paintProgress();
  });
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
});

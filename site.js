/* Mount each figure using Hairline's shared renderer and motion engine. */
HL.inject(document);
window.hairline = (figure) => {
  document.querySelectorAll(`[data-figure="${figure.name}"]`).forEach(stage => {
    stage.dataset.hairline = figure.name;
    stage.setAttribute('role', 'img');
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
    const handle = figure.mount({ stage, svg, read: { textContent: '' } }, figure.range[1]);
    let tour;
    if (stage.hasAttribute('data-play') && !HL.reducedMotion()) {
      tour = HL.tour(stage, figure.tour, i => {
        if (i === figure.tour.length - 1) tour?.stop();
      });
      stage.addEventListener('keydown', () => tour?.stop(), { capture: true, once: true });
    }
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      tour?.stop();
      handle.destroy();
    });
  });
};

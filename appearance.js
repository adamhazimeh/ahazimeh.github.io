/* Dark is the default; an explicit choice persists across the site. */
(() => {
  const root = document.documentElement;
  const storageKey = 'adam-hazimeh-color-scheme';
  let scheme = 'dark';
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') scheme = saved;
  } catch { /* Direct file previews may not allow local storage. */ }
  root.dataset.colorScheme = scheme;

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (!toggle) return;
    const label = toggle.querySelector('[data-theme-label]');
    function render() {
      root.dataset.colorScheme = scheme;
      label.textContent = scheme === 'dark' ? 'Light mode' : 'Dark mode';
      toggle.setAttribute('aria-label', scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.setAttribute('aria-pressed', String(scheme === 'light'));
    }
    toggle.hidden = false;
    render();
    toggle.addEventListener('click', () => {
      scheme = scheme === 'dark' ? 'light' : 'dark';
      render();
      try { localStorage.setItem(storageKey, scheme); } catch { /* Keep the current-page choice. */ }
    });
  });
})();

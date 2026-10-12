// Runs in <head> before first paint: starts the intro in its closed state.
// The safety timer reveals the page even if script.js fails to load.
(function () {
  var r = document.documentElement;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { if (localStorage.getItem('tm-motion') === 'off') { r.classList.add('no-motion'); return; } } catch (e) {}
  r.classList.add('p0');
  setTimeout(function () {
    if (!window.__introStarted) { window.__introSkipped = true; r.classList.remove('p0', 'p1', 'p2'); }
  }, 3000);
})();

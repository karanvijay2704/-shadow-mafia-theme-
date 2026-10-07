document.documentElement.classList.remove('no-js');

const menu = document.querySelector('[data-mobile-menu]');
const toggles = document.querySelectorAll('[data-menu-toggle]');
const setMenu = (open) => {
  if (!menu) return;
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('menu-open', open);
  toggles.forEach((button) => button.setAttribute('aria-expanded', String(open)));
};
toggles.forEach((button) => button.addEventListener('click', () => setMenu(!menu?.classList.contains('is-open'))));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const syncMotion = () => {
  document.body.classList.toggle('is-ready', !reducedMotion.matches);
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => {});
  });
};
syncMotion();
reducedMotion.addEventListener?.('change', syncMotion);

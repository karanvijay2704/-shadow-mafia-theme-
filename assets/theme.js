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

document.querySelectorAll('[data-sort-select]').forEach((select) => {
  select.addEventListener('change', () => select.form?.submit());
});

document.querySelectorAll('[data-product-root]').forEach((root) => {
  const dataEl = root.querySelector('[data-product-variants]');
  const idInput = root.querySelector('[data-variant-id]');
  const optionSelects = [...root.querySelectorAll('[data-product-option]')];
  const addButton = root.querySelector('[data-add-to-cart]');
  const priceWrap = root.querySelector('[data-product-price]');

  if (!dataEl || !idInput || optionSelects.length === 0) return;

  let variants = [];
  try { variants = JSON.parse(dataEl.textContent); } catch (_) { return; }

  const updateVariant = () => {
    const selected = optionSelects.map((select) => select.value);
    const variant = variants.find((item) => item.options.every((value, index) => value === selected[index]));

    if (!variant) {
      idInput.value = '';
      addButton.disabled = true;
      addButton.textContent = 'UNAVAILABLE';
      return;
    }

    idInput.value = variant.id;
    addButton.disabled = !variant.available;
    addButton.textContent = variant.available ? 'ADD TO BAG →' : 'SOLD OUT';

    if (priceWrap) {
      priceWrap.innerHTML = variant.compare
        ? '<span class="price">' + variant.price + '</span><s>' + variant.compare + '</s>'
        : '<span class="price">' + variant.price + '</span>';
    }

    if (variant.media_id) {
      const media = root.querySelector('[data-media-id="' + variant.media_id + '"]');
      if (media && window.innerWidth < 981) media.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    }

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  };

  optionSelects.forEach((select) => select.addEventListener('change', updateVariant));
});

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


const cartDrawer = document.querySelector('[data-cart-drawer]');
const cartBody = document.querySelector('[data-cart-drawer-body]');
const cartFoot = document.querySelector('[data-cart-drawer-foot]');
const cartCountEls = document.querySelectorAll('#CartCount, [data-cart-drawer-count]');
const cartTotalEl = document.querySelector('[data-cart-total]');
const rootPath = window.Shopify?.routes?.root || '/';

const money = (cents) => {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || 'en-IN', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'INR',
      maximumFractionDigits: 2
    }).format(cents / 100);
  } catch (_) {
    return '₹' + (cents / 100).toFixed(2);
  }
};

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[char]));

const renderCart = (cart) => {
  cartCountEls.forEach((el) => { if (el) el.textContent = cart.item_count; });
  if (cartTotalEl) cartTotalEl.textContent = money(cart.total_price);
  if (cartFoot) cartFoot.hidden = cart.item_count === 0;
  if (!cartBody) return;

  if (cart.item_count === 0) {
    cartBody.innerHTML = '<div class="cart-drawer__empty"><p>Your bag is empty.</p><a class="btn-secondary" href="/collections/new-arrivals">SHOP THE DROP →</a></div>';
    return;
  }

  cartBody.innerHTML = cart.items.map((item, index) => {
    const image = item.image ? '<a href="' + escapeHtml(item.url) + '" class="cart-drawer__image"><img src="' + escapeHtml(item.image) + '&width=260" alt="' + escapeHtml(item.product_title) + '"></a>' : '';
    const variant = item.variant_title && item.variant_title !== 'Default Title' ? '<small>' + escapeHtml(item.variant_title) + '</small>' : '';
    return '<div class="cart-drawer__item" data-cart-line="' + (index + 1) + '">' +
      image +
      '<div><a href="' + escapeHtml(item.url) + '"><strong>' + escapeHtml(item.product_title) + '</strong></a>' +
      variant +
      '<span>' + money(item.final_line_price) + '</span>' +
      '<div class="cart-drawer__qty">' +
      '<button type="button" data-cart-change data-line="' + (index + 1) + '" data-quantity="' + Math.max(0, item.quantity - 1) + '">−</button>' +
      '<span>' + item.quantity + '</span>' +
      '<button type="button" data-cart-change data-line="' + (index + 1) + '" data-quantity="' + (item.quantity + 1) + '">+</button>' +
      '</div>' +
      '<button class="cart-drawer__remove" type="button" data-cart-change data-line="' + (index + 1) + '" data-quantity="0">REMOVE</button></div></div>';
  }).join('');
};

const getCart = async () => {
  const response = await fetch(rootPath + 'cart.js', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Cart request failed');
  return response.json();
};

const openCart = async () => {
  if (!cartDrawer) return;
  try { renderCart(await getCart()); } catch (_) {}
  if (typeof cartDrawer.showModal === 'function') cartDrawer.showModal();
  else cartDrawer.setAttribute('open', '');
};

document.querySelectorAll('[data-cart-trigger]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    if (!cartDrawer) return;
    event.preventDefault();
    openCart();
  });
});

document.querySelector('[data-cart-drawer-close]')?.addEventListener('click', () => cartDrawer?.close());
cartDrawer?.addEventListener('click', (event) => { if (event.target === cartDrawer) cartDrawer.close(); });

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-cart-change]');
  if (!button) return;
  button.disabled = true;
  try {
    const response = await fetch(rootPath + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Accept:'application/json' },
      body: JSON.stringify({ line: Number(button.dataset.line), quantity: Number(button.dataset.quantity) })
    });
    if (!response.ok) throw new Error('Cart update failed');
    renderCart(await response.json());
  } catch (_) {
    window.location.href = rootPath + 'cart';
  }
});

document.querySelectorAll('.product-form, .card-quick-form').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    if (!cartDrawer) return;
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const response = await fetch(rootPath + 'cart/add.js', {
        method: 'POST',
        headers: { Accept:'application/json' },
        body: new FormData(form)
      });
      if (!response.ok) throw new Error('Add to cart failed');
      await response.json();
      await openCart();
    } catch (_) {
      form.submit();
    } finally {
      if (submit) submit.disabled = false;
    }
  });
});

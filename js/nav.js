/* Security Molding — mobile nav: adds a menu button that opens the site links as a drop-down panel. */
(() => {
  const nav = document.querySelector('.site-nav');
  const inner = nav && nav.querySelector('.site-nav__inner');
  const links = nav && nav.querySelector('.site-nav__links');
  if (!inner || !links) return;
  links.id = links.id || 'site-nav-links';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'site-nav__toggle';
  btn.setAttribute('aria-controls', links.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', 'Open menu');
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<path class="l1" d="M4 7h16"/><path class="l2" d="M4 12h16"/><path class="l3" d="M4 17h16"/></svg>';
  inner.appendChild(btn);
  const set = open => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => set(!nav.classList.contains('is-open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); btn.focus(); } });
  document.addEventListener('click', e => { if (!nav.contains(e.target)) set(false); });
  matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) set(false); });
})();

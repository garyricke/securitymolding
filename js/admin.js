/* ============================================================
   Security Molding — Admin entry (shared across all pages)
   Discreet bottom-right badge → password modal → slide-in panel.
   Styles live in css/brand.css (#adm*). Include with:
     <script src="js/admin.js" defer></script>
   Client-side gate only — NOT real security (password is in source).
   Shares sessionStorage key with the per-page gates on internal pages.
   ============================================================ */
(function () {
  var KEY = 'securitymolding_auth', PASS = 'oneword';

  // Internal pages surfaced in the panel. Add an entry to extend.
  var LINKS = [
    {
      href: 'brand-standard.html',
      label: 'Brand Standard',
      desc: 'Colors, type, logo &amp; voice',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="18" cy="12" r="2.5"/><circle cx="7" cy="6" r="2.5"/><path d="M5 21c0-5 3-8 7-8 2 0 3 1 3 2.5S15 18 13 18"/></svg>'
    },
    {
      href: 'study-guide.html',
      label: 'Plastics Study Guide',
      desc: 'Interactive walkthrough for Julian',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6c-2-1.5-5-1.5-8 0v13c3-1.5 6-1.5 8 0M12 6c2-1.5 5-1.5 8 0v13c-3-1.5-6-1.5-8 0M12 6v13"/></svg>'
    }
  ];

  var linksHtml = LINKS.map(function (l) {
    return '<a href="' + l.href + '"><span class="adm-ic">' + l.icon +
      '</span><span class="adm-txt"><b>' + l.label + '</b><small>' + l.desc + '</small></span></a>';
  }).join('');

  var markup =
    '<div id="adm"><button id="adm-btn" type="button" aria-label="Admin access" aria-haspopup="dialog" aria-expanded="false">A</button></div>' +
    '<div id="adm-lock" hidden><div id="adm-lock-box" role="dialog" aria-modal="true" aria-labelledby="adm-lock-title">' +
      '<img src="assets/logo-security-molding-21spr2026-onblack.svg" alt="Security Molding" onerror="this.style.display=\'none\'">' +
      '<h2 id="adm-lock-title">Admin Access</h2>' +
      '<p class="adm-lock-sub">Internal area · enter the password to continue.</p>' +
      '<input id="adm-lock-input" type="password" placeholder="Enter password" autocomplete="current-password">' +
      '<button id="adm-lock-btn" type="button">Enter</button>' +
      '<p id="adm-lock-error" role="alert"></p>' +
    '</div></div>' +
    '<div id="adm-scrim" hidden></div>' +
    '<aside id="adm-panel" role="dialog" aria-modal="true" aria-label="Admin links" aria-hidden="true">' +
      '<div class="adm-panel-head"><div class="adm-panel-brand"><span class="adm-eyebrow">Security Molding</span><h3>Admin</h3></div>' +
      '<button id="adm-panel-close" type="button" aria-label="Close admin panel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<nav class="adm-links">' + linksHtml + '</nav>' +
      '<div class="adm-panel-foot"><button id="adm-lock-out" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg> Lock &amp; sign out</button></div>' +
    '</aside>';

  var holder = document.createElement('div');
  holder.innerHTML = markup;
  while (holder.firstChild) document.body.appendChild(holder.firstChild);

  var btn = document.getElementById('adm-btn');
  if (!btn) return;
  var lock = document.getElementById('adm-lock'),
      lockInput = document.getElementById('adm-lock-input'),
      lockBtn = document.getElementById('adm-lock-btn'),
      lockBox = document.getElementById('adm-lock-box'),
      lockErr = document.getElementById('adm-lock-error'),
      panel = document.getElementById('adm-panel'),
      scrim = document.getElementById('adm-scrim'),
      panelClose = document.getElementById('adm-panel-close'),
      signOut = document.getElementById('adm-lock-out');

  function authed() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function openPanel() { scrim.hidden = false; panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closePanel() { panel.classList.remove('open'); scrim.hidden = true; panel.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  function openLock() { lock.hidden = false; lockErr.textContent = ''; lockInput.value = ''; setTimeout(function () { lockInput.focus(); }, 30); }
  function closeLock() { lock.hidden = true; }
  function tryPass() {
    if (lockInput.value === PASS) { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} closeLock(); openPanel(); }
    else { lockErr.textContent = 'Incorrect password. Try again.'; lockBox.classList.remove('adm-shake'); void lockBox.offsetWidth; lockBox.classList.add('adm-shake'); lockInput.select(); }
  }

  btn.addEventListener('click', function (e) { e.stopPropagation(); if (authed()) openPanel(); else openLock(); });
  lockBtn.addEventListener('click', tryPass);
  lockInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPass(); });
  panelClose.addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);
  signOut.addEventListener('click', function () { try { sessionStorage.removeItem(KEY); } catch (e) {} closePanel(); });
  lock.addEventListener('click', function (e) { if (e.target === lock) closeLock(); });
  document.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (!lock.hidden) closeLock(); else if (panel.classList.contains('open')) closePanel(); });
})();

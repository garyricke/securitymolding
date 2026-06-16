/* ============================================================
   Security Molding — SITE-WIDE password gate (temporary)
   Hides the entire site behind one password while it's in progress.
   Loaded synchronously in <head> so content never flashes.
   Shares the sessionStorage key with the admin badge + internal
   per-page gates, so one unlock covers everything for the session.
   Client-side only — NOT real security. To take the site public,
   remove the <script src="js/site-gate.js"> tag from the pages
   (the internal pages keep their own per-page gates).
   ============================================================ */
(function () {
  var KEY = 'securitymolding_auth', PASS = 'oneword';
  try { if (sessionStorage.getItem(KEY) === '1') return; } catch (e) {}

  var style = document.createElement('style');
  style.id = 'sg-style';
  style.textContent =
    '#sg-gate{position:fixed;inset:0;z-index:100000;background:#0A0A0A;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif}'
    + '#sg-gate::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(193,0,0,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(193,0,0,.06) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}'
    + '#sg-box{position:relative;background:rgba(255,255,255,.04);border:1px solid rgba(193,0,0,.35);border-radius:16px;padding:48px 40px;text-align:center;width:min(400px,90vw);box-shadow:0 24px 80px rgba(0,0,0,.5)}'
    + '#sg-box img{height:64px;margin:0 auto 22px;display:block}'
    + '#sg-box h2{font-weight:800;font-size:1.5rem;color:#fff;letter-spacing:-.01em;margin:0 0 8px}'
    + '#sg-box p.s{font-size:.85rem;color:rgba(236,236,236,.55);margin:0 0 26px;letter-spacing:.02em}'
    + '#sg-in{width:100%;padding:12px 16px;background:rgba(0,0,0,.4);border:1px solid rgba(193,0,0,.3);border-radius:8px;color:#fff;font-size:.95rem;font-family:inherit;outline:none;box-sizing:border-box}'
    + '#sg-in:focus{border-color:#C10000}'
    + '#sg-btn{margin-top:14px;width:100%;padding:12px;background:#C10000;color:#fff;border:0;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer}'
    + '#sg-btn:hover{background:#ff5a5a}'
    + '#sg-err{font-size:.8rem;color:#ff7a7a;margin:12px 0 0;min-height:1.2em}'
    + '.sg-shake{animation:sgk .35s}@keyframes sgk{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}'
    + 'body{visibility:hidden !important}';
  document.documentElement.appendChild(style);

  var gate = document.createElement('div');
  gate.id = 'sg-gate';
  gate.innerHTML =
    '<div id="sg-box">'
    + '<img src="assets/logo-security-molding-21spr2026-onblack.svg" alt="Security Molding" onerror="this.style.display=\'none\'">'
    + '<h2>Security Molding</h2>'
    + '<p class="s">This site is private while we finish it. Enter the password to continue.</p>'
    + '<input id="sg-in" type="password" placeholder="Enter password" autocomplete="current-password">'
    + '<button id="sg-btn" type="button">Enter</button>'
    + '<p id="sg-err"></p>'
    + '</div>';
  document.documentElement.appendChild(gate);

  function unlock() {
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    // also clear any per-page internal gate so one entry covers the page
    var pg = document.getElementById('pw-gate'); if (pg) pg.style.display = 'none';
    try { document.body.style.overflow = ''; } catch (e) {}
    var s = document.getElementById('sg-style'); if (s && s.parentNode) s.parentNode.removeChild(s);
    if (gate.parentNode) gate.parentNode.removeChild(gate);
  }
  function attempt() {
    var inp = document.getElementById('sg-in');
    if (inp.value === PASS) { unlock(); }
    else {
      document.getElementById('sg-err').textContent = 'Incorrect password. Try again.';
      var b = document.getElementById('sg-box'); b.classList.remove('sg-shake'); void b.offsetWidth; b.classList.add('sg-shake'); inp.select();
    }
  }
  document.getElementById('sg-btn').addEventListener('click', attempt);
  document.getElementById('sg-in').addEventListener('keydown', function (e) { if (e.key === 'Enter') attempt(); });
  setTimeout(function () { var i = document.getElementById('sg-in'); if (i) i.focus(); }, 40);
})();

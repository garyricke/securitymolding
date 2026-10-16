/* ============================================================
   Security Molding — team bio shadowbox
   Opens a near-full-screen bio when the page is loaded with ?bio=<slug>
   (the business-card QR codes land on /jeannie and /julian, which
   _redirects sends to /?bio=<slug>). Also: window.SMBio.open('julian').
   Include with: <script src="js/bio.js" defer></script>
   ============================================================ */
(function () {
  var SHOP = { phone: '(630) 555-0100', street: '255 Factory Road', city: 'Addison', state: 'IL', zip: '60101', web: 'securitymolding.com' };

  // PLACEHOLDER content — contact numbers are fictional 555 numbers; bios to be replaced with their own words.
  var PEOPLE = {
    jeannie: {
      first: 'Jeannie', last: 'Ricke', title: 'President',
      mobile: '(630) 555-0142', email: 'jeannie@securitymolding.com',
      quote: 'We’ll take care of it.',
      quoteBy: 'The sign on our shop wall',
      bio: [
        'Jeannie runs Security Molding day to day — the shop her father started in 1972 with one press and one rule: never gouge the customer, always be fair. That rule still sets every price we quote.',
        'She’s the reason the phone gets answered. When a line is down or a shipment is short, Jeannie is usually the one who already knows which partials are on the shelf and how fast we can run the rest.',
        'Placeholder — replace with Jeannie’s own story: how she came into the business, what she’s proudest of, and what customers call her about.'
      ],
      facts: [['Role', 'President'], ['With the shop', 'Since 19__'], ['Call me about', 'Quotes, pricing, lead times, emergencies']]
    },
    julian: {
      first: 'Julian', last: 'Ricke', title: 'Customer Service',
      mobile: '(630) 555-0187', email: 'julian@securitymolding.com',
      quote: 'He doesn’t act like the owner’s grandson.',
      quoteBy: 'One of the crew',
      bio: [
        'Julian is the third generation at Security Molding. He started on the machines — learning what we make before he ever learned to sell it — so when you call about a part, he knows how it actually runs.',
        'Today he’s the first person customers reach for order status, samples and reorders, backed by a small cross-trained crew that always knows your job.',
        'Placeholder — replace with Julian’s own story: what he’s learning, what he likes about the work, and what customers can count on him for.'
      ],
      facts: [['Role', 'Customer Service'], ['With the shop', 'Since 20__'], ['Call me about', 'Order status, samples, reorders, stock']]
    }
  };

  var CSS = ''
    + '#smbio{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:clamp(10px,2.5vw,36px);}'
    + '#smbio[hidden]{display:none;}'
    + '#smbio .bk{position:absolute;inset:0;background:rgba(10,10,10,.74);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;transition:opacity .35s ease;}'
    + '#smbio .bx{position:relative;width:100%;height:100%;max-width:1400px;background:#fff;border-radius:22px;overflow:hidden;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);'
    + 'box-shadow:0 40px 120px -20px rgba(0,0,0,.6);opacity:0;transform:translateY(18px) scale(.975);transition:opacity .4s ease,transform .5s cubic-bezier(.2,.75,.2,1);}'
    + '#smbio.on .bk{opacity:1;}#smbio.on .bx{opacity:1;transform:none;}'
    /* left: red panel, pellet field, monogram portrait placeholder */
    + '#smbio .pic{position:relative;background:#C10000;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(24px,4vw,56px);overflow:hidden;}'
    + '#smbio .pic::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.16) 0 34%,transparent 36%);background-size:22px 22px;'
    + '-webkit-mask-image:linear-gradient(160deg,#000 10%,transparent 75%);mask-image:linear-gradient(160deg,#000 10%,transparent 75%);}'
    + '#smbio .mono{position:absolute;top:50%;left:50%;transform:translate(-50%,-58%);width:min(62%,340px);aspect-ratio:1;border-radius:50%;background:rgba(0,0,0,.18);'
    + 'display:flex;align-items:center;justify-content:center;font-weight:900;font-size:clamp(56px,9vw,140px);letter-spacing:-.04em;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25);}'
    + '#smbio .mono small{position:absolute;bottom:14%;font-family:var(--f-mono,monospace);font-weight:500;font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.75;}'
    + '#smbio .pic q{position:relative;display:block;quotes:none;font-weight:800;font-size:clamp(22px,2.4vw,34px);line-height:1.1;letter-spacing:-.02em;max-width:18ch;}'
    + '#smbio .pic cite{position:relative;display:block;margin-top:12px;font-style:normal;font-family:var(--f-mono,monospace);font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;}'
    /* right: scrollable story */
    + '#smbio .txt{overflow-y:auto;padding:clamp(28px,5vw,80px) clamp(24px,5vw,80px) clamp(28px,4vw,56px);display:flex;flex-direction:column;}'
    + '#smbio .kick{font-family:var(--f-mono,monospace);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;display:flex;gap:12px;align-items:center;flex-wrap:wrap;}'
    + '#smbio .kick b{color:#C10000;font-weight:600;}'
    + '#smbio .draft{font-size:10px;padding:3px 8px;border-radius:999px;background:#F7E3E3;color:#8E0000;letter-spacing:.1em;}'
    + '#smbio h2{margin:18px 0 10px;font-size:clamp(44px,6.4vw,96px);line-height:.92;letter-spacing:-.045em;font-weight:900;color:#0A0A0A;}'
    + '#smbio .ttl{font-family:var(--f-mono,monospace);font-weight:600;font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#C10000;}'
    + '#smbio .story{margin-top:clamp(24px,3vw,40px);max-width:60ch;font-size:clamp(16px,1.25vw,19px);line-height:1.6;color:#2A2E35;}'
    + '#smbio .story p{margin:0 0 1em;}#smbio .story p.ph{color:#6B7280;font-style:italic;font-size:.92em;border-left:3px solid #E5E7EB;padding-left:14px;}'
    + '#smbio dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin:clamp(20px,3vw,36px) 0 0;border-top:1px solid #E5E7EB;}'
    + '#smbio dl div{padding:16px 16px 0 0;}#smbio dt{font-family:var(--f-mono,monospace);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6B7280;}'
    + '#smbio dd{margin:6px 0 0;font-weight:600;font-size:15px;color:#0A0A0A;}'
    + '#smbio .acts{margin-top:auto;padding-top:clamp(28px,4vw,48px);display:flex;flex-wrap:wrap;gap:10px;}'
    + '#smbio .acts a,#smbio .acts button{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;font:600 15px/1 var(--f-body,system-ui);border:1px solid #E5E7EB;color:#0A0A0A;background:#fff;cursor:pointer;text-decoration:none;}'
    + '#smbio .acts .pri{background:#C10000;border-color:#C10000;color:#fff;}#smbio .acts .pri:hover{background:#8E0000;}'
    + '#smbio .acts a:not(.pri):hover,#smbio .acts button:hover{border-color:#0A0A0A;}'
    + '#smbio .acts svg{width:18px;height:18px;}'
    + '#smbio .x{position:absolute;top:16px;right:16px;z-index:2;width:48px;height:48px;border-radius:50%;border:0;background:rgba(10,10,10,.06);color:#0A0A0A;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;}'
    + '#smbio .x:hover{background:rgba(10,10,10,.12);}#smbio .x svg{width:24px;height:24px;}'
    + '@media (max-width:820px){#smbio .bx{grid-template-columns:1fr;grid-template-rows:auto 1fr;overflow-y:auto;}#smbio .txt{overflow:visible;}'
    + '#smbio .pic{min-height:38vh;}#smbio .mono{width:44%;transform:translate(-50%,-62%);}#smbio dl{grid-template-columns:1fr;}#smbio .x{background:rgba(255,255,255,.85);}}'
    + '@media (prefers-reduced-motion:reduce){#smbio .bk,#smbio .bx{transition:none;}}';

  var ICON = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16c.5-1.5 1.7-2.2 3-2.2s2.5.7 3 2.2M14 10h4M14 14h3"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function tel(s) { return 'tel:+1' + String(s).replace(/\D/g, ''); }

  function vcard(p) {
    return [
      'BEGIN:VCARD', 'VERSION:3.0',
      'N:' + p.last + ';' + p.first + ';;;', 'FN:' + p.first + ' ' + p.last,
      'ORG:Security Molding', 'TITLE:' + p.title,
      'TEL;TYPE=CELL:+1' + p.mobile.replace(/\D/g, ''), 'TEL;TYPE=WORK,VOICE:+1' + SHOP.phone.replace(/\D/g, ''),
      'EMAIL;TYPE=WORK:' + p.email,
      'ADR;TYPE=WORK:;;' + SHOP.street + ';' + SHOP.city + ';' + SHOP.state + ';' + SHOP.zip + ';USA',
      'URL:https://' + SHOP.web, 'END:VCARD'
    ].join('\r\n');
  }

  var root, lastFocus, current;

  function build(slug) {
    var p = PEOPLE[slug];
    var paras = p.bio.map(function (t) { return '<p' + (/^Placeholder/.test(t) ? ' class="ph"' : '') + '>' + esc(t) + '</p>'; }).join('');
    var facts = p.facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('');
    return '<div class="bk" data-close></div>'
      + '<div class="bx" role="dialog" aria-modal="true" aria-labelledby="smbio-name">'
      + '<button class="x" type="button" data-close aria-label="Close">' + ICON.x + '</button>'
      + '<div class="pic"><div class="mono" aria-hidden="true">' + esc(p.first[0] + p.last[0]) + '<small>Portrait coming soon</small></div>'
      + '<q>' + esc(p.quote) + '</q><cite>— ' + esc(p.quoteBy) + '</cite></div>'
      + '<div class="txt">'
      + '<div class="kick"><b>Security Molding</b><span>Meet the team</span><span class="draft">Placeholder bio</span></div>'
      + '<h2 id="smbio-name">' + esc(p.first) + '<br>' + esc(p.last) + '</h2>'
      + '<div class="ttl">' + esc(p.title) + '</div>'
      + '<div class="story">' + paras + '</div>'
      + '<dl>' + facts + '</dl>'
      + '<div class="acts">'
      + '<a class="pri" href="' + tel(p.mobile) + '">' + ICON.phone + 'Call ' + esc(p.first) + '</a>'
      + '<a href="mailto:' + esc(p.email) + '">' + ICON.mail + 'Email</a>'
      + '<button type="button" data-vcf>' + ICON.card + 'Save contact</button>'
      + '<a href="quote.html">Request a quote ' + ICON.arrow + '</a>'
      + '</div></div></div>';
  }

  function open(slug) {
    if (!PEOPLE[slug]) return;
    current = slug;
    if (!document.getElementById('smbio-css')) {
      var st = document.createElement('style'); st.id = 'smbio-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    if (!root) { root = document.createElement('div'); root.id = 'smbio'; document.body.appendChild(root); }
    root.innerHTML = build(slug);
    root.hidden = false;
    lastFocus = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('on'); }); });
    root.querySelector('.x').focus();
    root.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
    root.querySelector('[data-vcf]').addEventListener('click', function () {
      var p = PEOPLE[current];
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([vcard(p)], { type: 'text/vcard' }));
      a.download = p.first + '-' + p.last + '-Security-Molding.vcf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    document.addEventListener('keydown', onKey);
  }

  function close() {
    if (!root || root.hidden) return;
    root.classList.remove('on');
    document.removeEventListener('keydown', onKey);
    document.documentElement.style.overflow = '';
    setTimeout(function () { root.hidden = true; root.innerHTML = ''; }, 380);
    try {
      var u = new URL(location.href); u.searchParams.delete('bio');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    // keep focus inside the dialog
    var f = root.querySelectorAll('button, a[href]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  window.SMBio = { open: open, close: close };

  var slug;
  try { slug = new URLSearchParams(location.search).get('bio'); } catch (e) {}
  if (!slug || !PEOPLE[slug]) return;

  function go() { setTimeout(function () { open(slug); }, 350); }
  // If the site password gate is up, open once it's dismissed.
  if (document.getElementById('sg-box')) {
    var mo = new MutationObserver(function () { if (!document.getElementById('sg-box')) { mo.disconnect(); go(); } });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } else {
    go();
  }
})();

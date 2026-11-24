/* ============================================================
   Security Molding — 360° knob viewer (home page, Parts showcase)
   A three.js model of the 72-tooth knurled knob, shaped from the
   shop photos (IMG_0536–0542); the top face is the cleaned top-down
   photo, hosted on Cloudinary. three.js loads only when the viewer
   scrolls near the screen, and it renders only while visible.
   Mouse: drag to rotate about any axis. Touch: swipe sideways to
   turn (vertical swipes still scroll the page); use the view buttons
   for top and underside. Keyboard: arrow keys when focused.
   It spins as soon as it scrolls into view, pauses while handled,
   and resumes 2.5 s after the last touch (not under reduced motion).
   ============================================================ */
(function () {
  var root = document.getElementById('knob360');
  if (!root) return;
  var stage = root.querySelector('.spin360__stage');
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var TEX_URL = 'https://res.cloudinary.com/dsbllwpbh/image/upload/q_auto:good,f_jpg/securitymolding/parts/knob-top-texture';

  function load() {
    if (window.THREE) return init();
    var s = document.createElement('script');
    s.src = THREE_URL; s.async = true; s.onload = init;
    s.onerror = function () { root.classList.add('spin360--nogl'); };
    document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    var lazy = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { lazy.disconnect(); load(); }
    }, { rootMargin: '400px 0px' });
    lazy.observe(root);
  } else { load(); }

  function init() {
    var THREE = window.THREE, renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch (e) { root.classList.add('spin360--nogl'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 0, 5.2);

    // key, fill and two rim lights so a black part reads on black
    scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 0.35));
    var key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-2.5, 3, 4); scene.add(key);
    var fill = new THREE.DirectionalLight(0xdfe6ff, 0.5); fill.position.set(3.5, 0.5, 2.5); scene.add(fill);
    var rimA = new THREE.DirectionalLight(0xffffff, 2.0); rimA.position.set(2.5, 2.5, -3.5); scene.add(rimA);
    var rimB = new THREE.DirectionalLight(0xffffff, 1.4); rimB.position.set(-3, -2, -3); scene.add(rimB);

    // dimensions, outer radius at the tooth tips = 1
    var N = 72, RB = 0.962, H = 0.52, KNURL = 0.30, RI = 0.89, RH = 0.236, CEIL = 0.43, FIL = 0.2;
    var tone = new THREE.Color('rgb(30,31,33)').convertSRGBToLinear();
    var plastic = new THREE.MeshStandardMaterial({ color: tone, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
    var knob = new THREE.Group();
    function lathe(pts, mat) {
      var g = new THREE.LatheGeometry(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 144);
      g.computeVertexNormals(); return new THREE.Mesh(g, mat);
    }

    // outer wall under the teeth, plus a short smooth band above them
    knob.add(lathe([[RB, 0], [RB, KNURL + 0.03]], plastic));

    // top cap: fillet into a gently domed face, photo-textured from above
    var cap = [], fc = [RB - FIL, KNURL + 0.03], i;
    for (i = 0; i <= 24; i++) { var a = i / 24 * Math.PI / 2; cap.push([fc[0] + FIL * Math.cos(a), fc[1] + FIL * Math.sin(a)]); }
    var topY = fc[1] + FIL;
    for (i = 1; i <= 16; i++) { var r = fc[0] - (fc[0] - RH) * i / 16, t = (fc[0] - r) / (fc[0] - RH); cap.push([r, topY + 0.012 * Math.sin(t * Math.PI / 2)]); }
    var capGeo = new THREE.LatheGeometry(cap.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), 180);
    capGeo.computeVertexNormals();
    var pos = capGeo.attributes.position, uv = capGeo.attributes.uv, sc = 500 / 1024;
    for (i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) * sc, 0.5 - pos.getZ(i) * sc);
    uv.needsUpdate = true;
    var loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
    var tex = loader.load(TEX_URL, function () { dirty = true; });
    tex.encoding = THREE.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    knob.add(new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ map: tex, color: new THREE.Color(0.62, 0.62, 0.62), roughness: 0.6, metalness: 0, side: THREE.DoubleSide })));
    var capTop = cap[cap.length - 1][1];

    // through-bore, underside ceiling, inner wall and the open rim
    knob.add(lathe([[RH, capTop], [RH, CEIL]], plastic));
    knob.add(lathe([[RH, CEIL], [RI, CEIL], [RI, 0], [RB, 0]], plastic));

    // knurl teeth
    var td = 1 - RB + 0.006, teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(td, KNURL, 0.044), plastic, N);
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1);
    for (i = 0; i < N; i++) {
      var ang = i / N * Math.PI * 2, rr = 1 - td / 2;
      q.setFromAxisAngle(yAxis, -ang);
      m.compose(new THREE.Vector3(Math.cos(ang) * rr, KNURL / 2, Math.sin(ang) * rr), q, one);
      teeth.setMatrixAt(i, m);
    }
    knob.add(teeth);

    // hub with the double-D drive bore
    var ro = 0.29, rd = 0.2, fl = 0.155, fa = Math.asin(fl / rd);
    var sh = new THREE.Shape(); sh.absarc(0, 0, ro, 0, Math.PI * 2, false);
    var hole = new THREE.Path();
    hole.moveTo(rd * Math.cos(fa), rd * Math.sin(fa)); hole.lineTo(-rd * Math.cos(fa), rd * Math.sin(fa));
    hole.absarc(0, 0, rd, Math.PI - fa, Math.PI + fa, false); hole.lineTo(rd * Math.cos(fa), -rd * Math.sin(fa));
    hole.absarc(0, 0, rd, -fa, fa, false); sh.holes.push(hole);
    var hg = new THREE.ExtrudeGeometry(sh, { depth: CEIL - 0.16, bevelEnabled: false, curveSegments: 48 });
    hg.rotateX(-Math.PI / 2);
    var hub = new THREE.Mesh(hg, plastic); hub.position.y = 0.16; knob.add(hub);

    // eight ribs and the flat ejector pads between them
    for (var k = 0; k < 8; k++) {
      var ra = k * Math.PI / 4, len = RI - 0.28, mid = 0.28 + len / 2, hgt = CEIL - 0.2;
      var rib = new THREE.Mesh(new THREE.BoxGeometry(len, hgt, 0.034), plastic);
      rib.position.set(Math.cos(ra) * mid, 0.2 + hgt / 2, Math.sin(ra) * mid); rib.rotation.y = -ra; knob.add(rib);
      var pa = ra + Math.PI / 8, pad = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 40), plastic);
      pad.position.set(Math.cos(pa) * 0.62, CEIL - 0.006, Math.sin(pa) * 0.62); knob.add(pad);
    }

    knob.position.y = -H / 2;
    var pivot = new THREE.Group(); pivot.add(knob); scene.add(pivot);

    // views
    var deg = Math.PI / 180;
    function Q(x, y) { return new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, 0, 'XYZ')); }
    var VIEWS = { three: Q(32 * deg, -20 * deg), top: Q(90 * deg, 0), bottom: Q(-90 * deg, 0), side: Q(8 * deg, 0) };
    pivot.quaternion.copy(VIEWS.three);

    // interaction: free rotation about any axis, with inertia
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var vel = new THREE.Vector3(), anim = null, idle = 99, dirty = true, visible = true, drag = null;
    function rotateBy(dx, dy) {
      var axis = new THREE.Vector3(dy, dx, 0), an = axis.length() * 0.0085;
      if (!an) return;
      pivot.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis.normalize(), an)); dirty = true;
    }
    stage.addEventListener('pointerdown', function (e) {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, touch: e.pointerType !== 'mouse' };
      if (!drag.touch) stage.setPointerCapture(e.pointerId);
      stage.classList.add('is-dragging'); vel.set(0, 0, 0); anim = null; idle = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var dx = e.clientX - drag.x, dy = drag.touch ? 0 : e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      rotateBy(dx, dy); vel.set(dx, dy, 0);
    });
    function end() { drag = null; stage.classList.remove('is-dragging'); }
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    stage.addEventListener('dblclick', function () { goTo('three'); });
    stage.addEventListener('keydown', function (e) {
      var mv = { ArrowLeft: [-14, 0], ArrowRight: [14, 0], ArrowUp: [0, -14], ArrowDown: [0, 14] }[e.key];
      if (mv) { e.preventDefault(); rotateBy(mv[0], mv[1]); idle = 0; }
    });
    function goTo(name) { anim = { from: pivot.quaternion.clone(), to: VIEWS[name], t: 0 }; vel.set(0, 0, 0); idle = 0; }
    root.querySelectorAll('[data-view]').forEach(function (b) {
      b.addEventListener('click', function () { goTo(b.getAttribute('data-view')); });
    });

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var t = Math.tan(camera.fov * Math.PI / 360), fitR = 1.2;
      camera.position.z = Math.max(fitR / t, fitR / (t * camera.aspect)) * (w < 600 ? 0.98 : 0.9);
      camera.updateProjectionMatrix(); dirty = true;
    }
    var rsz = new ResizeObserver(resize); rsz.observe(stage); resize();
    var vis = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { if (!drag && !anim) idle = 99; last = performance.now(); requestAnimationFrame(tick); } });
    vis.observe(stage);
    root.classList.add('spin360--ready');

    var last = performance.now();
    function tick(now) {
      if (!visible) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (anim) {
        anim.t = Math.min(1, anim.t + dt * 1.6);
        pivot.quaternion.copy(anim.from).slerp(anim.to, 1 - Math.pow(1 - anim.t, 3)); dirty = true;
        if (anim.t >= 1) anim = null;
      } else if (!drag && vel.lengthSq() > 0.01) { rotateBy(vel.x, vel.y); vel.multiplyScalar(0.93); }
      else if (!drag && !reduce) {
        idle += dt;
        if (idle > 2.5) { pivot.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(yAxis, dt * 0.5)); dirty = true; }
      }
      if (dirty) { renderer.render(scene, camera); dirty = false; }
      requestAnimationFrame(tick);
    }
  }
})();

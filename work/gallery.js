/* Full Circle Studios gallery lightbox: large image, prev/next, swipe, Esc/close, focus trapped while open.
   Grid shows thumbnails; the full-size file (l/...) only loads when a photo is opened. */
(function () {
  var data = JSON.parse(document.getElementById('photos').textContent || '[]');
  var lb = document.getElementById('lb');
  if (!data.length || !lb) return;
  var img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  var btnX = lb.querySelector('.lb-x'), btnP = lb.querySelector('.lb-prev'), btnN = lb.querySelector('.lb-next');
  var cur = -1, opener = null, loaded = {};
  /* everything except the lightbox becomes inert while it is open (no focus, no clicks, hidden from screen readers) */
  var rest = [].slice.call(document.body.children).filter(function (el) { return el !== lb && el.tagName !== 'SCRIPT'; });
  function setInert(on) { rest.forEach(function (el) { if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); } else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); } }); }

  function preload(i) { var p = data[(i + data.length) % data.length]; if (!loaded[p.l]) { loaded[p.l] = 1; new Image().src = p.l; } }
  function show(i) {
    cur = (i + data.length) % data.length;
    var p = data[cur], want = p.l;
    img.alt = p.alt; img.width = p.w; img.height = p.h;
    img.classList.add('loading');
    img.src = p.t;                                   /* the 1000px thumb (already cached) shows at once */
    var big = new Image();
    big.onload = function () { if (data[cur].l === want) { img.src = want; img.classList.remove('loading'); } };
    big.onerror = function () { img.classList.remove('loading'); };
    big.src = want; loaded[want] = 1;
    cap.textContent = (cur + 1) + ' / ' + data.length;
    var one = data.length < 2; btnP.hidden = one; btnN.hidden = one;
    if (!one) { preload(cur + 1); preload(cur - 1); }
  }
  function open(i, from) {
    opener = from || document.activeElement;
    lb.hidden = false; document.documentElement.classList.add('lb-open'); setInert(true);
    show(i); btnX.focus();
  }
  function close() {
    lb.hidden = true; document.documentElement.classList.remove('lb-open'); setInert(false);
    img.removeAttribute('src'); cur = -1;
    if (opener && opener.focus) opener.focus();
  }

  document.querySelectorAll('.g-grid .ph[data-i]').forEach(function (b) {
    b.addEventListener('click', function () { open(+b.dataset.i, b); });
  });
  btnX.addEventListener('click', close);
  btnP.addEventListener('click', function () { show(cur - 1); });
  btnN.addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft' && data.length > 1) { e.preventDefault(); show(cur - 1); }
    else if (e.key === 'ArrowRight' && data.length > 1) { e.preventDefault(); show(cur + 1); }
    else if (e.key === 'Tab') {                       /* focus trap: cycle through the visible buttons */
      var f = [btnX, btnP, btnN].filter(function (x) { return !x.hidden; });
      var k = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  /* keep focus inside if something outside gets it (e.g. a screen-reader jump) */
  document.addEventListener('focusin', function (e) { if (!lb.hidden && !lb.contains(e.target)) btnX.focus(); });

  /* swipe */
  var x0 = null, y0 = null;
  lb.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3 && data.length > 1) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

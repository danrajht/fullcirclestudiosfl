/* Full Circle Studios Recent Runs: "This is me" picks + "Request my photos".
   Picks stay in this browser tab (sessionStorage) until sent. Request copies a message with the photo numbers and opens an
   Instagram DM to @kodak_dann (same as the booking form). Nothing is sent anywhere else. */
(function () {
  var runEl = document.getElementById('run');
  var run = {}; try { run = JSON.parse((runEl && runEl.textContent) || '{}'); } catch (e) {}
  var tray = document.getElementById('runTray');
  if (!run.slug || !tray) return;
  var count = document.getElementById('runCount'), send = document.getElementById('runSend'), sent = document.getElementById('runSent');
  var lb = document.getElementById('lb'), me = lb && lb.querySelector('.lb-me'), cur = null;
  var KEY = 'fcs-run-picks:' + run.slug;
  var valid = {};
  [].forEach.call(document.querySelectorAll('.g-grid .ph[data-b]'), function (t) { valid[t.getAttribute('data-b')] = 1; });
  var picks = [];
  try { picks = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) {}
  if (!Array.isArray(picks)) picks = [];
  picks = picks.filter(function (b, i, a) { return typeof b === 'string' && valid[b] && a.indexOf(b) === i; });

  function has(b) { return picks.indexOf(b) >= 0; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(picks)); } catch (e) {} }
  function render() {
    [].forEach.call(document.querySelectorAll('.pick[data-b]'), function (p) {
      var on = has(p.getAttribute('data-b'));
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
      p.querySelector('span').textContent = on ? 'Added' : 'This is me';
    });
    if (me && cur) {
      var on = has(cur);
      me.setAttribute('aria-pressed', on ? 'true' : 'false');
      me.textContent = on ? '✓ Added to your request (tap to remove)' : 'This is me: add to my request';
    }
    tray.hidden = !picks.length;
    document.body.classList.toggle('has-tray', !!picks.length);
    count.textContent = picks.length + (picks.length === 1 ? ' photo picked' : ' photos picked');
    if (!picks.length) sent.hidden = true;
  }
  function toggle(b) {
    if (!valid[b]) return;
    if (has(b)) picks.splice(picks.indexOf(b), 1); else picks.push(b);
    sent.hidden = true; save(); render();
  }
  [].forEach.call(document.querySelectorAll('.pick[data-b]'), function (p) {
    p.addEventListener('click', function () { toggle(p.getAttribute('data-b')); });
  });
  if (me) me.addEventListener('click', function () { if (cur) toggle(cur); });
  document.addEventListener('lb:show', function (e) { cur = e.detail && e.detail.b; render(); });
  var m = /^#p=([\w-]+)$/.exec(location.hash);              /* opened from a shared link before this script ran */
  if (m && lb && !lb.hidden && valid[m[1]]) cur = m[1];

  send.addEventListener('click', function () {
    if (!picks.length) return;
    var nums = picks.slice().sort(function (a, b) { return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); })
      .map(function (b) { return '#' + b; }).join(', ');
    var msg = 'Photo request: ' + run.title + ' (' + run.dateLabel + ')\nMy photos: ' + nums + '\nName: \nInstagram: @\n' +
              location.origin + location.pathname;
    /* copy synchronously (still inside the tap) so phones don't block the new tab */
    var ta = document.createElement('textarea'); ta.value = msg; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, msg.length);
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(ta);
    sent.hidden = false;
    window.open('https://ig.me/m/kodak_dann', '_blank', 'noopener');
  });

  /* the previews carry a mark, but don't make saving them easy either */
  document.addEventListener('contextmenu', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target && e.target.tagName === 'IMG') e.preventDefault(); });
  render();
})();

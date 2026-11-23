/* Full Circle Studios reviews: approved reviews (Google Sheet "Approved" tab, published as CSV, plus manual ones
   in work/reviews.json) shown under the client's own photo in the gallery lightbox and in "Kind words" on the homepage.
   Sheet columns (in order): Timestamp, Name shown, Gallery, Photo, Review, Stars. Nothing shows until Dan approves it. */
(function () {
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/reviews\.js(\?.*)?$/, '') : 'work/';            /* …/work/ */

  function parseCSV(s) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function toDate(s) { var d = new Date(s); return isNaN(d) ? '' : d.toISOString().slice(0, 10); }
  function clean(r) {
    var stars = Math.round(parseFloat(r.stars)); if (!(stars >= 1 && stars <= 5)) stars = 0;
    return { name: String(r.name || '').trim().slice(0, 40), gallery: String(r.gallery || '').trim().toLowerCase(),
             photo: String(r.photo || '').trim().toLowerCase(), text: String(r.text || '').trim().slice(0, 600), stars: stars, date: r.date || '' };
  }
  function load(cb) {
    fetch(base + 'reviews.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (cfg) {
      var list = (cfg.manual || []).map(clean);
      if (!cfg.sheetCsvUrl) return cb(list, cfg);
      fetch(cfg.sheetCsvUrl).then(function (r) { return r.text(); }).then(function (t) {
        parseCSV(t).slice(1).forEach(function (c) {
          if (c.length >= 5) list.push(clean({ date: toDate(c[0]), name: c[1], gallery: c[2], photo: c[3], text: c[4], stars: c[5] }));
        });
        cb(list, cfg);
      }).catch(function () { cb(list, cfg); });
    }).catch(function () { cb([], {}); });
  }
  function starHTML(n) { return n ? '<span class="rv-stars" aria-label="' + n + ' out of 5 stars">' + '★★★★★'.slice(0, n) + '<i>' + '★★★★★'.slice(n) + '</i></span>' : ''; }
  function card(r, el, withPhoto) {
    var q = document.createElement('blockquote'); q.className = 'rv';
    if (withPhoto && r.gallery && r.photo) {
      var a = document.createElement('a'); a.href = base + r.gallery + '/#p=' + r.photo; a.className = 'rv-ph';
      var im = document.createElement('img'); im.src = base + r.gallery + '/t/' + r.photo + '-600.jpg'; im.alt = 'Photo of ' + (r.name || 'the client'); im.loading = 'lazy';
      im.onerror = function () { a.remove(); }; a.appendChild(im); q.appendChild(a);
    }
    var body = document.createElement('div');
    body.innerHTML = starHTML(r.stars);
    var p = document.createElement('p'); p.textContent = '“' + r.text + '”'; body.appendChild(p);
    var c = document.createElement('cite'); c.textContent = '— ' + (r.name || 'Client'); body.appendChild(c);
    q.appendChild(body); el.appendChild(q);
  }

  load(function (all, cfg) {
    all = all.filter(function (r) { return r.text; }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });

    /* homepage: newest 3 */
    var home = document.getElementById('kind-words');
    if (home) {
      var box = home.querySelector('.rv-list');
      all.slice(0, 3).forEach(function (r) { card(r, box, true); });
      home.hidden = !all.length;
    }

    /* gallery page */
    var slug = document.body.getAttribute('data-slug');
    if (!slug) return;
    var mine = all.filter(function (r) { return r.gallery === slug; });
    var byPhoto = {};
    mine.forEach(function (r) { (byPhoto[r.photo] = byPhoto[r.photo] || []).push(r); });
    document.querySelectorAll('.g-grid .ph[data-b]').forEach(function (t) {
      if (byPhoto[t.getAttribute('data-b')]) { var s = document.createElement('span'); s.className = 'rv-tag'; s.textContent = '★ Review'; t.appendChild(s); t.setAttribute('aria-label', t.getAttribute('aria-label') + ' (has a client review)'); }
    });
    var lb = document.getElementById('lb'); if (!lb) return;
    var box2 = lb.querySelector('.lb-review'), rate = lb.querySelector('.lb-rate');
    var canRate = cfg.formUrl && cfg.fields && cfg.fields.gallery && cfg.fields.photo;
    function render(b) {
      box2.innerHTML = '';
      (byPhoto[b] || []).forEach(function (r) { card(r, box2, false); });
      box2.hidden = !byPhoto[b]; lb.classList.toggle('has-review', !!byPhoto[b]);
      if (canRate) {
        rate.href = cfg.formUrl + (cfg.formUrl.indexOf('?') < 0 ? '?' : '&') + 'usp=pp_url&' + cfg.fields.gallery + '=' + encodeURIComponent(slug) + '&' + cfg.fields.photo + '=' + encodeURIComponent(b);
      } else {
        /* no Google Form yet: copy a starter message naming the photo, then open an Instagram DM (same as the booking form) */
        rate.href = 'https://ig.me/m/kodak_dann'; rate.dataset.msg = 'Review for my photo (' + slug + ' / ' + b + '):\n';
      }
      rate.hidden = false;
    }
    rate.addEventListener('click', function () {
      if (canRate || !rate.dataset.msg) return;
      var ta = document.createElement('textarea'); ta.value = rate.dataset.msg; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
      lb.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} lb.removeChild(ta);
    });
    document.addEventListener('lb:show', function (e) { render(e.detail.b); });
    var m = /^#p=([\w-]+)$/.exec(location.hash); if (m && !lb.hidden) render(m[1]);   /* lightbox opened before reviews loaded */
  });
})();

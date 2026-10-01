document.getElementById('year').textContent = new Date().getFullYear();

// grain filter for icons at rest (css fallback)
document.body.insertAdjacentHTML('beforeend',
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' +
  '<filter id="bw-grain" color-interpolation-filters="sRGB">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" stitchTiles="stitch" result="noise"/>' +
  '<feColorMatrix in="noise" type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1" result="grey"/>' +
  '<feComposite in="SourceGraphic" in2="grey" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="-0.25" result="grainy"/>' +
  '<feComposite in="grainy" in2="SourceGraphic" operator="in"/>' +
  '</filter></svg>');

// per-icon filter so the b&w can fade on hover (url() filters can't transition)
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var holder = document.createElementNS(NS, 'svg');
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.position = 'absolute';
  document.body.append(holder);

  // [icon, hover target, is a book, parts to filter]
  var kinds = [
    ['.project-object:not(.project-object--skate)', '.project-icon'],
    // 3d, so filter the faces
    ['.project-object--skate', '.project-icon', false, '.skate-face'],
    ['.mag-cover', '.mag-cover', true],
    ['.band-member img', '.band-member'],
    // same
    ['.jewel', '.playlist', false, '.jewel-tray, .jewel-face']
  ];
  var n = 0;
  kinds.forEach(function (kind) {
    document.querySelectorAll(kind[0]).forEach(function (el) {
      var trigger = el.closest(kind[1]) || el;
      var book = kind[2];
      var lift = book ? parseFloat(getComputedStyle(el).getPropertyValue('--bw-lift')) || 1.8 : 1;
      var contrast = book ? 1.5 : 1.7, bright = 0.9;
      var id = 'bw-fade-' + (++n);
      var f = document.createElementNS(NS, 'filter');
      f.id = id;
      f.setAttribute('color-interpolation-filters', 'sRGB');
      f.innerHTML =
        '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" stitchTiles="stitch" result="noise"/>' +
        '<feColorMatrix in="noise" type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1" result="grey"/>' +
        '<feComposite in="SourceGraphic" in2="grey" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" result="grainy"/>' +
        '<feComposite in="grainy" in2="SourceGraphic" operator="in" result="kept"/>' +
        '<feColorMatrix in="kept" type="saturate" values="1"/>' +
        '<feComponentTransfer><feFuncR type="linear"/><feFuncG type="linear"/><feFuncB type="linear"/></feComponentTransfer>' +
        '<feComponentTransfer><feFuncR type="linear"/><feFuncG type="linear"/><feFuncB type="linear"/></feComponentTransfer>';
      holder.append(f);
      var grain = f.querySelector('feComposite');
      var sat = f.querySelectorAll('feColorMatrix')[1];
      var tone = f.querySelectorAll('feComponentTransfer');

      // t: 1 = b&w, 0 = colour
      function set(t) {
        grain.setAttribute('k3', 0.5 * t);
        grain.setAttribute('k4', -0.25 * t);
        sat.setAttribute('values', 1 - t);
        var slope1 = 1 + t * (lift * contrast - 1), cut1 = t * 0.5 * (1 - contrast);
        var slope2 = 1 + t * (bright - 1);
        tone[0].querySelectorAll('*').forEach(function (fn) {
          fn.setAttribute('slope', slope1); fn.setAttribute('intercept', cut1);
        });
        tone[1].querySelectorAll('*').forEach(function (fn) { fn.setAttribute('slope', slope2); });
      }
      var t = 1, target = 1, raf = null, last = 0;
      function step(now) {
        var dt = last ? now - last : 16;
        last = now;
        var speed = dt / 220;
        t = target > t ? Math.min(target, t + speed) : Math.max(target, t - speed);
        set(t * t * (3 - 2 * t));
        raf = t === target ? null : requestAnimationFrame(step);
      }
      function go(to) {
        target = to;
        if (still) { t = to; set(to); return; }
        if (!raf) { last = 0; raf = requestAnimationFrame(step); }
      }
      set(1);
      var parts = kind[3] ? el.querySelectorAll(kind[3]) : [el];
      if (kind[3]) el.style.filter = 'none';
      parts.forEach(function (part) { part.style.filter = 'url(#' + id + ')'; });
      el.style.transition = book ? 'transform 0.2s ease' : 'none';
      trigger.addEventListener('mouseenter', function () { go(0); });
      trigger.addEventListener('mouseleave', function () { go(1); });
      trigger.addEventListener('focusin', function () { go(0); });
      trigger.addEventListener('focusout', function () { go(1); });
      trigger.addEventListener('icon:on', function () { go(0); });
      trigger.addEventListener('icon:off', function () { go(1); });
    });
  });
})();

// --tabs-width, for layouts that line up with the tabs
var nav = document.querySelector('.site-nav');
if (nav && 'ResizeObserver' in window) {
  new ResizeObserver(function () {
    document.documentElement.style.setProperty('--tabs-width', nav.getBoundingClientRect().width + 'px');
  }).observe(nav);
}

// homepage: hovering the name types the caption
(function () {
  var name = document.querySelector('.site-name a');
  var header = document.querySelector('.site-header');
  if (!name || !header || !document.querySelector('.home-main')) return;
  var TEXT = "Things I've made, been, collected, dabbled in, started, finished, loved, hated, and dreamed about.";
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var caption = document.createElement('p');
  caption.className = 'typed-caption';
  caption.setAttribute('aria-hidden', 'true');
  var letters = TEXT.split('').map(function (ch) {
    var s = document.createElement('span');
    s.textContent = ch;
    caption.append(s);
    return s;
  });
  var caret = document.createElement('span');
  caret.className = 'typed-caret';
  caret.textContent = '\u258F';
  caption.append(caret);
  header.insertBefore(caption, header.querySelector('.site-nav'));

  // letter ink bounds (--ink-t/--ink-b from lettering.css)
  function ink(el) {
    var r = el.getBoundingClientRect(), style = getComputedStyle(el);
    return {
      top: r.top + r.height * parseFloat(style.getPropertyValue('--ink-t')),
      bottom: r.top + r.height * parseFloat(style.getPropertyValue('--ink-b'))
    };
  }
  function place() {
    var headBox = header.getBoundingClientRect();
    var from = ink(name).bottom;
    var to = Math.min.apply(null, Array.prototype.map.call(header.querySelectorAll('.site-nav a'), function (a) {
      return ink(a).top;
    }));
    var spare = Math.max(0, to - from - caption.offsetHeight);
    caption.style.top = (from + spare / 2 - headBox.top) + 'px';
  }

  var next = 0, timer = null, on = false;
  function placeCaret() {
    var box = caption.getBoundingClientRect();
    var at = letters[Math.max(0, next - 1)].getBoundingClientRect();
    caret.style.left = ((next ? at.right : at.left) - box.left + caption.scrollLeft) + 'px';
    caret.style.top = (at.top - box.top) + 'px';
  }
  // keep the newest letter in view on narrow screens
  function follow() {
    if (!next) return;
    var box = caption.getBoundingClientRect();
    var end = letters[next - 1].getBoundingClientRect().right - box.left + caption.scrollLeft;
    var room = caret.getBoundingClientRect().width + 2;
    caption.scrollLeft = Math.max(0, end + room - caption.clientWidth);
  }
  function typeNext() {
    if (!on || next >= letters.length) return;
    var ch = TEXT[next];
    letters[next].classList.add('is-typed');
    next++;
    follow();
    placeCaret();
    var wait = 35 + Math.random() * 50;
    if (ch === ' ') wait += 30 + Math.random() * 50;
    if (ch === ',') wait += 180;
    if (ch === '.') wait += 300;
    timer = setTimeout(typeNext, wait);
  }
  function reset() {
    clearTimeout(timer);
    next = 0;
    letters.forEach(function (s) { s.classList.remove('is-typed'); });
    caption.scrollLeft = 0;
  }
  function show() {
    if (on) return;
    on = true;
    reset();
    place();
    // fonts may not be measured yet on the first pass
    requestAnimationFrame(function () { setTimeout(function () { if (on) { place(); placeCaret(); } }, 30); });
    caption.classList.add('is-on');
    if (still) {
      letters.forEach(function (s) { s.classList.add('is-typed'); });
      next = letters.length;
      return;
    }
    placeCaret();
    timer = setTimeout(typeNext, 150);
  }
  function hide() {
    on = false;
    clearTimeout(timer);
    caption.classList.remove('is-on');
  }
  caption.addEventListener('transitionend', function () { if (!on) reset(); });
  if (window.matchMedia('(hover: none)').matches) {
    // touch: tap the name
    name.addEventListener('click', function (e) {
      e.preventDefault();
      if (on) hide(); else show();
    });
    document.addEventListener('click', function (e) {
      if (on && !name.contains(e.target) && !caption.contains(e.target)) hide();
    });
  } else {
    name.addEventListener('mouseenter', show);
    name.addEventListener('mouseleave', hide);
    name.addEventListener('focus', show);
    name.addEventListener('blur', hide);
  }
  window.addEventListener('resize', function () { if (on) { place(); placeCaret(); } });
  if (document.fonts) document.fonts.ready.then(function () { place(); });
})();

// about: fit the bio text to the photo's height
(function () {
  var intro = document.querySelector('.about-intro');
  if (!intro) return;
  var photo = intro.querySelector('.about-photo img');
  var bio = intro.querySelector('.about-bio');
  function fit() {
    bio.style.fontSize = '';
    if (getComputedStyle(intro).flexDirection === 'column') return;
    var target = photo.getBoundingClientRect().height;
    if (!target) return;
    var lo = 8, hi = 40;                                  // binary search
    for (var i = 0; i < 14; i++) {
      var mid = (lo + hi) / 2;
      bio.style.fontSize = mid + 'px';
      if (bio.scrollHeight > target) hi = mid; else lo = mid;
    }
    bio.style.fontSize = lo + 'px';
  }
  if (photo.complete) fit(); else photo.addEventListener('load', fit);
  if (document.fonts) document.fonts.ready.then(fit);
  new ResizeObserver(fit).observe(intro);
})();

// touch: first tap animates an icon, second tap (or its title) opens it
(function () {
  if (!window.matchMedia('(hover: none)').matches) return;
  var KINDS = [
    ['.project-icon', '.project-title'],
    ['.playlist', '.playlist-title'],
    ['.band-member', null]
  ];
  var active = null;
  function stop() {
    if (!active) return;
    active.classList.remove('is-active');
    active.dispatchEvent(new Event('icon:off'));
    active = null;
  }
  KINDS.forEach(function (kind) {
    document.querySelectorAll(kind[0]).forEach(function (icon) {
      icon.addEventListener('click', function (e) {
        if (kind[1] && e.target.closest(kind[1])) return;
        if (active === icon) return;
        e.preventDefault();
        stop();
        active = icon;
        icon.classList.add('is-active');
        icon.dispatchEvent(new Event('icon:on'));
      });
    });
  });
  document.addEventListener('click', function (e) {
    if (active && !active.contains(e.target)) stop();
  });
})();

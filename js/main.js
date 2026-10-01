document.getElementById('year').textContent = new Date().getFullYear();


// A gritty, photocopy-like grain for the icons at rest (css/style.css uses it as url(#bw-grain)): fine
// grey noise mixed into the picture, kept only where the picture is.
document.body.insertAdjacentHTML('beforeend',
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' +
  '<filter id="bw-grain" color-interpolation-filters="sRGB">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" stitchTiles="stitch" result="noise"/>' +
  '<feColorMatrix in="noise" type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1" result="grey"/>' +
  '<feComposite in="SourceGraphic" in2="grey" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="-0.25" result="grainy"/>' +
  '<feComposite in="grainy" in2="SourceGraphic" operator="in"/>' +
  '</filter></svg>');


// The same black-and-white look, but as each icon's own filter, so it can fade: hovering (or
// focusing) an icon eases its grain, greyness and contrast away into full colour, and back
// again after. (A CSS filter list with url() in it can only switch, not fade.) The CSS look
// above stays as the fallback until this takes over.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var holder = document.createElementNS(NS, 'svg');
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.position = 'absolute';
  document.body.append(holder);

  // [icon, what hovering it, and its own look: lift (brighten first), contrast, brightness]
  var kinds = [
    ['.project-object:not(.project-object--skate)', '.project-icon'],
    // the skateboard spins in 3D, so (like the CD case below) each face of the deck wears it
    ['.project-object--skate', '.project-icon', false, '.skate-face'],
    ['.mag-cover', '.mag-cover', true],
    ['.band-member img', '.band-member'],
    // the CD case swings its lid open in 3D, which a filter on the whole case upsets, so its
    // flat parts (the tray and both faces of the lid) each wear the filter instead
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

      // t = 1 is the black-and-white rest look, t = 0 full colour
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
        var speed = dt / 220;                          // a full fade takes about a fifth of a second
        t = target > t ? Math.min(target, t + speed) : Math.max(target, t - speed);
        set(t * t * (3 - 2 * t));                       // eased
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
      // touch screens have no hover: a page can colour an icon in and out itself
      trigger.addEventListener('icon:on', function () { go(0); });
      trigger.addEventListener('icon:off', function () { go(1); });
    });
  });
})();


// Share the width of the tabs line as --tabs-width, so things can match it
// (the guest book, the About page and the star on the homepage)
var nav = document.querySelector('.site-nav');
if (nav && 'ResizeObserver' in window) {
  new ResizeObserver(function () {
    document.documentElement.style.setProperty('--tabs-width', nav.getBoundingClientRect().width + 'px');
  }).observe(nav);
}


// On the homepage, hovering Sonia's name types the caption out underneath it, like a
// typewriter: one key at a time, with the odd pause after a space, comma or full stop, and a
// blinking cursor. Moving off fades it away; hovering again types it fresh.
(function () {
  var name = document.querySelector('.site-name a');
  var header = document.querySelector('.site-header');
  if (!name || !header || !document.querySelector('.home-main')) return;
  var TEXT = "Things I've made, been, collected, dabbled in, started, finished, loved, hated, and dreamed about.";
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var caption = document.createElement('p');
  caption.className = 'typed-caption';
  caption.setAttribute('aria-hidden', 'true');           // the caption is in the page for screen readers
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

  // Where the ink of the name's and tabs' letters actually starts and stops, top to bottom.
  // The name's flourishes hang well below its box, and the script tabs start lower than
  // theirs, so the gap between them is measured from the letters themselves (css/lettering.css
  // gives each its ink's top and bottom as fractions of its box).
  function ink(el) {
    var r = el.getBoundingClientRect(), style = getComputedStyle(el);
    return {
      top: r.top + r.height * parseFloat(style.getPropertyValue('--ink-t')),
      bottom: r.top + r.height * parseFloat(style.getPropertyValue('--ink-b'))
    };
  }
  // halfway between the bottom of the name's letters and the top of the tabs' letters
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
  // on a screen too narrow for the whole line, keep the newest letters in view
  function follow() {
    caption.scrollLeft = caption.scrollWidth;
  }
  function typeNext() {
    if (!on || next >= letters.length) return;
    var ch = TEXT[next];
    letters[next].classList.add('is-typed');
    next++;
    follow();
    placeCaret();
    var wait = 35 + Math.random() * 50;              // an uneven hand on the keys
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
    // measure again a moment later: the first measurement can catch the fonts before the
    // browser's text measurer has them
    requestAnimationFrame(function () { setTimeout(function () { if (on) { place(); placeCaret(); } }, 30); });
    caption.classList.add('is-on');
    if (still) {                                    // no motion: the whole caption at once
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
    // touch screens can't hover: a tap on the name types the caption (we're already home),
    // another tap, or one anywhere else, takes it away
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
  // warm up the text measurer with the page's fonts, so the first hover is placed right
  if (document.fonts) document.fonts.ready.then(function () { place(); });
})();


// About: beside the photo, the bio's type is sized so the text stands exactly as tall as the
// photo (on phones they stack, and the bio keeps its own size).
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
    var lo = 8, hi = 40;                                  // px; halve the range until it fits
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


// Touch screens can't hover, so there a tap on an icon plays what hovering does (its
// animation, in colour), and a tap on its title opens the page. A tap anywhere else, or on
// another icon, stops it. (Each kind: the icon, and what counts as its title.)
(function () {
  if (!window.matchMedia('(hover: none)').matches) return;
  var KINDS = [
    ['.project-icon', '.project-title'],
    ['.playlist', '.playlist-title'],
    ['.band-member', null]                 // the band's title is the "Filthy Blonde" heading
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
        if (kind[1] && e.target.closest(kind[1])) return;   // the title: open the page
        e.preventDefault();
        if (active === icon) return;
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

// Flip-through magazines. Each <article class="mag"> has a cover button and a hidden
// list of pages (.mag-pages). Opening one builds a two-page book in an overlay:
// click the right/left page, use the arrow buttons or keys, or swipe to turn pages.
(function () {
  var mags = document.querySelectorAll('.mag');
  if (!mags.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Reader shell (built once) ----
  var reader = document.createElement('div');
  reader.className = 'mag-reader';
  reader.hidden = true;
  reader.setAttribute('role', 'dialog');
  reader.setAttribute('aria-modal', 'true');
  reader.innerHTML =
    '<div class="mag-stage"><div class="mag-book"></div></div>' +
    '<div class="mag-controls">' +
    '  <button type="button" class="mag-prev" aria-label="Previous page">◀ prev</button>' +
    '  <span class="mag-status" aria-live="polite"></span>' +
    '  <button type="button" class="mag-next" aria-label="Next page">next ▶</button>' +
    '</div>' +
    '<button type="button" class="mag-close" aria-label="Close the sketchbook, back to art">back to art</button>';
  document.body.append(reader);

  var book = reader.querySelector('.mag-book');
  var stage = reader.querySelector('.mag-stage');
  var status = reader.querySelector('.mag-status');
  var prevBtn = reader.querySelector('.mag-prev');
  var nextBtn = reader.querySelector('.mag-next');
  var leaves = [];
  var current = 0;      // number of leaves turned over
  var pageCount = 0;
  var lastFocus = null;

  function face(side, content, pageNo) {
    var f = document.createElement('div');
    f.className = 'mag-face mag-face--' + side;
    if (content) f.append(content);
    if (pageNo) {
      var n = document.createElement('span');
      n.className = 'mag-pageno';
      n.textContent = pageNo;
      f.append(n);
    }
    return f;
  }

  function bindingOf(mag) {
    return getComputedStyle(mag.querySelector('.mag-cover')).backgroundImage;
  }

  function coverPage(mag) {
    var c = document.createElement('div');
    c.className = 'mag-binding mag-cover-page';
    c.style.backgroundImage = bindingOf(mag);
    var label = mag.querySelector('.mag-label').cloneNode(true);
    label.removeAttribute('aria-hidden');
    c.append(label);
    return c;
  }

  function backPage(mag) {
    var b = document.createElement('div');
    b.className = 'mag-binding mag-back-page';
    b.style.backgroundImage = bindingOf(mag);
    return b;
  }

  // Inside covers: the reverse of the board, so the same binding mirrored and darker
  function endpaper(mag, mirrored) {
    var e = document.createElement('div');
    e.className = 'mag-endpaper' + (mirrored ? ' is-mirrored' : '');
    e.style.backgroundImage = bindingOf(mag);
    return e;
  }

  // The page's print area is 82% of the page width by 81% of its height, on a 3:4 page
  var AREA_ASPECT = (0.82 * 3) / (0.81 * 4);

  // A page's picture can be rotated (data-rotate="degrees" on its <li>), then cropped
  // (data-crop="x y w h", as fractions of the rotated picture's bounding box), and
  // captioned (<p class="mag-caption"> after the picture). A page with no picture is left
  // blank apart from its caption. All three are written into art.html.
  function cropOf(li) {
    var c = (li.dataset.crop || '').split(/\s+/).map(Number);
    return c.length === 4 && c.every(isFinite) && c[2] > 0 && c[3] > 0
      ? { x: c[0], y: c[1], w: c[2], h: c[3] }
      : { x: 0, y: 0, w: 1, h: 1 };
  }

  // Lays a picture of natural size w x h, rotated by deg, into a box the size of its
  // rotated bounds. Returns that box's width and height (in the picture's pixels).
  function placeRotated(media, w, h, deg) {
    var t = deg * Math.PI / 180, c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
    var bw = w * c + h * s, bh = w * s + h * c;
    media.style.position = 'absolute';
    media.style.width = (w / bw * 100) + '%';
    media.style.height = (h / bh * 100) + '%';
    media.style.left = ((bw - w) / 2 / bw * 100) + '%';
    media.style.top = ((bh - h) / 2 / bh * 100) + '%';
    media.style.transform = deg ? 'rotate(' + deg + 'deg)' : '';
    return { w: bw, h: bh };
  }
  window.magPlaceRotated = placeRotated;

  function contentPage(li, n) {
    var wrap = document.createElement('div');
    wrap.className = 'mag-content';
    var caption = li.querySelector('.mag-caption');
    var hasCaption = !!(caption && caption.textContent.trim());
    // a blank page (<li class="mag-blank">): just paper, with its caption if it has one
    if (!li.querySelector('img, video')) {
      wrap.classList.add('mag-content--blank');
      if (hasCaption) wrap.append(caption.cloneNode(true));
      return wrap;
    }
    var pasted = document.createElement('div');
    pasted.className = 'mag-pasted';
    var window_ = document.createElement('div');
    window_.className = 'mag-crop';
    var frame = document.createElement('div');   // the rotated picture's bounds
    frame.className = 'mag-crop-frame';
    var media = li.querySelector('img, video').cloneNode(true);
    media.removeAttribute('loading');
    var crop = cropOf(li);
    var bounds = placeRotated(media,
      Number(media.getAttribute('width')) || 4, Number(media.getAttribute('height')) || 3,
      Number(li.dataset.rotate) || 0);
    frame.style.width = (100 / crop.w) + '%';
    frame.style.height = (100 / crop.h) + '%';
    frame.style.left = (-crop.x / crop.w * 100) + '%';
    frame.style.top = (-crop.y / crop.h * 100) + '%';
    var aspect = (bounds.w * crop.w) / (bounds.h * crop.h);
    // leave a little paper around the picture for the tape, and room below it for a caption
    var fillW = 0.92, fillH = hasCaption ? 0.8 : 0.92;
    var areaAspect = AREA_ASPECT * fillW / fillH;
    if (aspect > areaAspect) {
      pasted.style.setProperty('--pw', fillW * 100 + '%');
      pasted.style.setProperty('--ph', (fillW * 100 * AREA_ASPECT / aspect).toFixed(2) + '%');
    } else {
      pasted.style.setProperty('--ph', fillH * 100 + '%');
      pasted.style.setProperty('--pw', (fillH * 100 * aspect / AREA_ASPECT).toFixed(2) + '%');
    }
    pasted.style.setProperty('--tilt', (((n * 37) % 7) - 3) * 0.5 + 'deg'); // small, varied angles
    frame.append(media);
    window_.append(frame);
    pasted.append(window_);
    wrap.append(pasted);
    if (hasCaption) wrap.append(caption.cloneNode(true));
    return wrap;
  }

  var pageNums = []; // printed page number for each page slot (null for covers and blanks)

  var openMag = null;

  function build(mag, keepPlace) {
    book.textContent = '';
    leaves = [];
    if (!keepPlace) current = 0;
    openMag = mag;

    // cover, inside cover, sketchbook pages, (blank to even out), inside back cover, back cover
    var pages = [coverPage(mag), endpaper(mag, true)];   // inside front: mirror of the front cover
    pageNums = [null, null];
    mag.querySelectorAll('.mag-pages > li').forEach(function (li, i) {
      pages.push(contentPage(li, i + 1));
      pageNums.push(i + 1);
    });
    if (pages.length % 2 === 1) { pages.push(null); pageNums.push(null); }
    pages.push(endpaper(mag, false), backPage(mag));   // inside back: mirror of the (mirrored) back cover
    pageNums.push(null, null);
    pageCount = pageNums.filter(Boolean).length;

    for (var i = 0; i < pages.length; i += 2) {
      var leaf = document.createElement('div');
      leaf.className = 'mag-leaf';
      // right-hand page on the front, left-hand page on the back
      leaf.append(face('front', pages[i], pageNums[i]));
      leaf.append(face('back', pages[i + 1], pageNums[i + 1]));
      leaf.addEventListener('transitionend', resetStacking);
      book.append(leaf);
      leaves.push(leaf);
    }
    reader.setAttribute('aria-label', mag.dataset.title + ' sketchbook');
    render();
  }

  function resetStacking() {
    leaves.forEach(function (leaf, i) {
      leaf.style.zIndex = i < current ? i + 1 : leaves.length - i;
    });
  }

  function render(flipping) {
    leaves.forEach(function (leaf, i) { leaf.classList.toggle('is-turned', i < current); });
    if (flipping != null) leaves[flipping].style.zIndex = leaves.length + 1; // on top while turning
    if (flipping == null || reduceMotion) resetStacking();

    // closed front/back cover sits centred; open spreads fill the stage
    book.classList.toggle('is-closed-front', current === 0);
    book.classList.toggle('is-closed-back', current === leaves.length);

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === leaves.length;
    if (current === 0) status.textContent = 'cover';
    else if (current === leaves.length) status.textContent = 'back cover';
    else {
      var shown = [pageNums[current * 2 - 1], pageNums[current * 2]].filter(Boolean);
      status.textContent = shown.length
        ? (shown.length > 1 ? 'pages ' + shown.join('–') : 'page ' + shown[0]) + ' of ' + pageCount
        : 'inside cover';
    }
  }

  function next() { if (current < leaves.length) { current++; render(current - 1); } }
  function prev() { if (current > 0) { current--; render(current); } }

  function open(mag) {
    lastFocus = document.activeElement;
    build(mag);
    reader.hidden = false;
    document.body.classList.add('mag-open');
    nextBtn.focus();
  }
  function close() {
    reader.hidden = true;
    document.body.classList.remove('mag-open');
    book.textContent = '';
    if (lastFocus) lastFocus.focus();
  }

  mags.forEach(function (mag) {
    mag.querySelector('.mag-cover').addEventListener('click', function () { open(mag); });
  });
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  reader.querySelector('.mag-close').addEventListener('click', close);

  // Click the right half to go forward, the left half to go back
  var swiped = false;
  book.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; } // the swipe already turned the page
    var r = book.getBoundingClientRect();
    if (e.clientX > r.left + r.width / 2) next(); else prev();
  });

  // Swipe on touch screens
  var startX = null;
  stage.addEventListener('pointerdown', function (e) { startX = e.clientX; });
  stage.addEventListener('pointerup', function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) { swiped = true; if (dx < 0) next(); else prev(); }
  });

  document.addEventListener('keydown', function (e) {
    if (reader.hidden) return;
    if (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });
})();

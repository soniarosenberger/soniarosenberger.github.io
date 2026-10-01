// Click a collage picture to see it large; click anywhere or press Esc to close.
(function () {
  var items = document.querySelectorAll('.collage-item img');
  if (!items.length) return;

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Enlarged picture');
  var big = document.createElement('img');
  box.append(big);
  document.body.append(box);

  var lastFocus = null;

  function open(img) {
    lastFocus = document.activeElement;
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    box.hidden = false;
    box.tabIndex = -1;
    box.focus();
  }
  function close() {
    box.hidden = true;
    big.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (img) {
    img.tabIndex = 0;
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
    });
  });
  box.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !box.hidden) close();
  });
})();

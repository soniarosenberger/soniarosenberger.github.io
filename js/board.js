// photo zoom for the skate board
(function () {
  var boards = Array.prototype.filter.call(document.querySelectorAll('.band-board'), function (b) {
    return !b.closest('.gallery');
  });
  if (!boards.length) return;

  var zoom = document.createElement('div');
  zoom.className = 'gallery-zoom board-zoom';
  zoom.hidden = true;
  document.body.append(zoom);
  var lastFocus = null;

  function enlarge(img) {
    lastFocus = document.activeElement;
    zoom.textContent = '';
    var big = img.cloneNode(true);
    big.removeAttribute('loading');
    big.removeAttribute('style');
    zoom.append(big);
    zoom.hidden = false;
    zoom.tabIndex = -1;
    zoom.focus();
    document.body.classList.add('mag-open');
  }
  function shrink() {
    zoom.hidden = true;
    zoom.textContent = '';
    document.body.classList.remove('mag-open');
    if (lastFocus) lastFocus.focus();
  }
  zoom.addEventListener('click', shrink);
  document.addEventListener('keydown', function (e) {
    if (!zoom.hidden && e.key === 'Escape') shrink();
  });

  boards.forEach(function (board) {
    board.querySelectorAll('.board-photo').forEach(function (photo) {
      photo.tabIndex = 0;
      photo.setAttribute('role', 'button');
      photo.setAttribute('aria-label', 'Enlarge ' + (photo.querySelector('img').alt || 'photo'));
    });
    board.addEventListener('click', function (e) {
      var photo = e.target.closest('.board-photo');
      if (photo) enlarge(photo.querySelector('img'));
    });
    board.addEventListener('keydown', function (e) {
      var photo = e.target.closest && e.target.closest('.board-photo');
      if (photo && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        enlarge(photo.querySelector('img'));
      }
    });
  });
})();

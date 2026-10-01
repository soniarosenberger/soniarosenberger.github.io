// filthy blonde board: photo zoom, and the column order on phones
(function () {
  var board = document.querySelector('.band-board');
  var zoom = document.querySelector('.gallery-zoom');
  if (!board || !zoom) return;

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
  board.querySelectorAll('.board-item').forEach(function (item) {
    var x = parseFloat(item.style.getPropertyValue('--x')) || 0;
    var y = parseFloat(item.style.getPropertyValue('--y')) || 0;
    item.style.setProperty('--order', Math.round(y * 10) * 1000 + Math.round(x * 10));
  });
  board.querySelectorAll('.board-photo').forEach(function (photo) {
    photo.tabIndex = 0;
    photo.setAttribute('role', 'button');
    photo.setAttribute('aria-label', 'Enlarge ' + (photo.querySelector('img').alt || 'photo'));
  });

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
  }
  function shrink() {
    if (zoom.hidden) return;
    zoom.hidden = true;
    zoom.textContent = '';
    if (lastFocus) lastFocus.focus();
  }
  zoom.addEventListener('click', shrink);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shrink(); });
})();

// custom song player
document.querySelectorAll('.song').forEach(function (song) {
  var audio = song.querySelector('audio');
  if (!audio) return;
  var title = song.querySelector('.song-title');
  audio.controls = false;

  var play = document.createElement('button');
  play.type = 'button';
  play.className = 'song-play';
  var seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'song-seek';
  seek.min = 0;
  seek.max = 1000;
  seek.value = 0;
  seek.setAttribute('aria-label', 'Position in ' + (title ? title.textContent : 'song'));
  var time = document.createElement('span');
  time.className = 'song-time';
  song.insertBefore(play, song.firstChild);
  song.insertBefore(seek, audio);
  song.insertBefore(time, audio);

  function clock(s) {
    if (!isFinite(s)) return '0:00';
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function update() {
    play.textContent = audio.paused ? '▶ play' : '❚❚ pause';
    play.setAttribute('aria-label', (audio.paused ? 'Play ' : 'Pause ') + (title ? title.textContent : 'song'));
    time.textContent = clock(audio.currentTime) + ' / ' + clock(audio.duration);
    if (!seeking && audio.duration) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
  }
  var seeking = false;
  play.addEventListener('click', function () {
    if (audio.paused) audio.play().catch(function () {}); else audio.pause();
  });
  seek.addEventListener('input', function () {
    seeking = true;
    if (audio.duration) time.textContent = clock(seek.value / 1000 * audio.duration) + ' / ' + clock(audio.duration);
  });
  seek.addEventListener('change', function () {
    if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration;
    seeking = false;
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'ended'].forEach(function (ev) {
    audio.addEventListener(ev, update);
  });
  update();
});

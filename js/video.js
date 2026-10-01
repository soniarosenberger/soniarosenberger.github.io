// video page: tapes play on the tv
(function () {
  var vcr = document.querySelector('.vcr');
  if (!vcr) return;
  var screen = vcr.querySelector('.vcr-screen');
  var canvas = vcr.querySelector('.vcr-static');
  var video = vcr.querySelector('.vcr-video');
  var controls = vcr.querySelector('.vcr-controls');
  var playBtn = vcr.querySelector('.vcr-play');
  var time = vcr.querySelector('.vcr-time');
  var blurb = vcr.querySelector('.vcr-blurb');
  var tapes = Array.prototype.slice.call(vcr.querySelectorAll('.vhs'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- static ----
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var frame = ctx.createImageData(w, h);
  var snowing = false;
  function snow() {
    var d = frame.data;
    for (var y = 0; y < h; y++) {
      var streak = Math.random() < 0.03 ? 40 : 0;
      for (var x = 0; x < w; x++) {
        var v = Math.random() * 215 + streak;
        var i = (y * w + x) * 4;
        d[i] = v; d[i + 1] = v; d[i + 2] = v + 6; d[i + 3] = 255;
      }
    }
    ctx.putImageData(frame, 0, 0);
    if (snowing && !still) requestAnimationFrame(snow);
  }
  function startSnow() {
    canvas.hidden = false;
    if (!snowing) { snowing = true; snow(); }
  }
  function stopSnow() {
    snowing = false;
    canvas.hidden = true;
  }

  setTimeout(function () {
    canvas.classList.add('is-on');
    screen.classList.add('is-on');
    startSnow();
  }, still ? 0 : 750);

  // ---- playback ----
  var current = null;
  var tuneTimer = null;

  function clock(s) {
    if (!isFinite(s)) return '0:00';
    s = Math.floor(s);
    var hrs = Math.floor(s / 3600), mins = Math.floor(s / 60) % 60, secs = s % 60;
    return (hrs ? hrs + ':' + String(mins).padStart(2, '0') : mins) + ':' + String(secs).padStart(2, '0');
  }
  var seek = vcr.querySelector('.vcr-seek');
  var soundBtn = vcr.querySelector('.vcr-sound');
  var seeking = false;
  function update() {
    playBtn.textContent = video.paused ? '▶ play' : '❚❚ pause';
    time.textContent = clock(video.currentTime) + ' / ' + clock(video.duration);
    if (!seeking) seek.value = video.duration ? Math.round(video.currentTime / video.duration * 1000) : 0;
    soundBtn.textContent = video.muted ? 'sound off' : 'sound on';
    soundBtn.setAttribute('aria-label', video.muted ? 'Turn sound on' : 'Turn sound off');
  }
  ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'volumechange'].forEach(function (ev) {
    video.addEventListener(ev, update);
  });
  seek.addEventListener('input', function () {
    seeking = true;
    if (video.duration) time.textContent = clock(seek.value / 1000 * video.duration) + ' / ' + clock(video.duration);
  });
  seek.addEventListener('change', function () {
    if (video.duration) video.currentTime = seek.value / 1000 * video.duration;
    seeking = false;
  });
  soundBtn.addEventListener('click', function () {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) video.volume = 1;
  });
  // autoplay with sound, or muted if blocked
  function start() {
    video.muted = false;
    video.play().catch(function () {
      video.muted = true;
      video.play().catch(function () { update(); });
    });
  }

  function insert(tape) {
    clearTimeout(tuneTimer);
    current = tape;
    tapes.forEach(function (t) { t.setAttribute('aria-pressed', String(t === tape)); });
    vcr.classList.add('is-playing');
    vcr.classList.remove('is-showing');
    controls.hidden = false;
    var notes = tape.parentElement.querySelector('.vhs-blurb');
    blurb.innerHTML = notes ? notes.innerHTML : '';
    video.pause();
    startSnow();
    setTimeout(function () {
      vcr.querySelector('.vcr-tv').scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    }, still ? 0 : 700);

    var src = tape.dataset.video;
    playBtn.hidden = time.hidden = seek.hidden = soundBtn.hidden = !src;
    if (!src) {
      video.removeAttribute('src');
      video.load();
      blurb.innerHTML = '<p>This tape is still being rewound. Check back soon.</p>';
      return;
    }
    video.src = src;
    tuneTimer = setTimeout(function () {
      stopSnow();
      vcr.classList.add('is-showing');
      start();
    }, still ? 0 : 650);
    update();
  }

  function eject() {
    clearTimeout(tuneTimer);
    video.pause();
    video.removeAttribute('src');
    video.load();
    current = null;
    tapes.forEach(function (t) { t.removeAttribute('aria-pressed'); });
    vcr.classList.remove('is-playing', 'is-showing');
    controls.hidden = true;
    blurb.innerHTML = '';
    startSnow();
  }

  tapes.forEach(function (tape) {
    tape.addEventListener('click', function () {
      if (tape === current) return;
      insert(tape);
    });
  });
  playBtn.addEventListener('click', function () {
    if (!current || !current.dataset.video) return;
    if (video.paused) video.play().catch(function () {}); else video.pause();
  });
  vcr.querySelector('.vcr-tv').addEventListener('click', function () {
    if (vcr.classList.contains('is-showing')) playBtn.click();
  });
  vcr.querySelector('.vcr-eject').addEventListener('click', eject);
  video.addEventListener('playing', function () {
    if (current && !vcr.classList.contains('is-showing')) {
      stopSnow();
      vcr.classList.add('is-showing');
    }
  });
  video.addEventListener('ended', function () {
    vcr.classList.remove('is-showing');
    startSnow();
    update();
  });
})();

// scope: glitches between waveforms while hovered
(function () {
  var svg = document.querySelector('.scope-trace');
  if (!svg) return;
  var path = svg.querySelector('path');
  var W = 100, H = 100;
  var cycles = 4;
  var mid = 46.9, amp = 22;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('preserveAspectRatio', 'none');

  var waves = {
    sine: function (p) { return Math.sin(p * 2 * Math.PI); },
    square: function (p) { return p < 0.5 ? 1 : -1; },
    triangle: function (p) { return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4; },
    saw: function (p) { return p < 0.5 ? 2 * p : 2 * p - 2; }
  };
  var names = Object.keys(waves);

  function draw(name, shift, tear, gain) {
    var f = waves[name], d = '';
    var step = name === 'square' || name === 'saw' ? 0.1 : 0.5;
    for (var x = 0; x <= W + 0.01; x += step) {
      var p = ((x / W) * cycles + shift) % 1;
      if (p < 0) p += 1;
      var y = mid - amp * gain * f(p);
      if (tear && Math.floor(x / 12) % 3 === tear.band) y += tear.dy;
      d += (d ? ' L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    path.setAttribute('d', d);
  }

  var current = 'sine';
  draw(current, 0, null, 1);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var active = false, timer = null;

  function glitchTo(next) {
    var frames = 5 + Math.floor(Math.random() * 5);
    svg.classList.add('is-glitching');
    (function frame() {
      if (frames-- <= 0 || !active) {
        svg.classList.remove('is-glitching');
        path.style.opacity = '';
        current = next;
        draw(current, 0, null, 1);
        if (active) timer = setTimeout(pickNext, 700 + Math.random() * 700);
        return;
      }
      var name = Math.random() < 0.5 ? current : next;
      draw(name, Math.random() * 0.5 - 0.25,
        Math.random() < 0.7 ? { band: Math.floor(Math.random() * 3), dy: (Math.random() - 0.5) * 30 } : null,
        0.6 + Math.random() * 0.8);
      path.style.opacity = Math.random() < 0.25 ? '0.25' : '1';
      timer = setTimeout(frame, 45 + Math.random() * 45);
    })();
  }
  function pickNext() {
    if (!active) return;
    var options = names.filter(function (n) { return n !== current; });
    glitchTo(options[Math.floor(Math.random() * options.length)]);
  }
  function start() {
    if (active) return;
    active = true;
    if (svg.classList.contains('is-glitching')) return;
    clearTimeout(timer);
    pickNext();
  }
  function stop() { active = false; }

  var scope = svg.closest('.project-icon');
  scope.addEventListener('mouseenter', start);
  scope.addEventListener('mouseleave', stop);
  scope.addEventListener('focus', start);
  scope.addEventListener('blur', stop);
  scope.addEventListener('icon:on', start);
  scope.addEventListener('icon:off', stop);
})();

// tv static
(function () {
  var canvas = document.querySelector('.tv-static');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  var frame = ctx.createImageData(w, h);
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = false, offTimer = null;

  function draw() {
    var d = frame.data;
    for (var y = 0; y < h; y++) {
      var lineShift = Math.random() < 0.03 ? 40 : 0;
      for (var x = 0; x < w; x++) {
        var v = Math.random() * 215 + lineShift;
        var i = (y * w + x) * 4;
        d[i] = v; d[i + 1] = v; d[i + 2] = v + 6; d[i + 3] = 255;
      }
    }
    ctx.putImageData(frame, 0, 0);
    if (running && !still) requestAnimationFrame(draw);
  }

  var tv = canvas.closest('.project-icon');
  function on() {
    clearTimeout(offTimer);
    canvas.classList.remove('is-off');
    canvas.classList.add('is-on');
    if (!running) { running = true; draw(); }
  }
  function off() {
    if (!canvas.classList.contains('is-on')) return;
    canvas.classList.remove('is-on');
    canvas.classList.add('is-off');
    offTimer = setTimeout(function () { running = false; }, 320);
  }
  tv.addEventListener('mouseenter', on);
  tv.addEventListener('mouseleave', off);
  tv.addEventListener('focus', on);
  tv.addEventListener('blur', off);
  tv.addEventListener('icon:on', on);
  tv.addEventListener('icon:off', off);
})();

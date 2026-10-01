// Projects page: the oscilloscope's trace. It sits still on one waveform (sine, square,
// triangle or saw). While the oscilloscope is hovered (or focused), it glitches for a
// moment (jumpy, torn, flickering frames) into another waveform, holds that briefly,
// and keeps going until the pointer leaves.
(function () {
  var svg = document.querySelector('.scope-trace');
  if (!svg) return;
  var path = svg.querySelector('path');
  var W = 100, H = 100;          // viewBox units; the SVG is stretched over the screen
  var cycles = 4;                // whole waves across the screen
  var mid = 46.9, amp = 22;      // centre line (where the photo's trace was) and height
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('preserveAspectRatio', 'none');

  // each wave maps a phase 0..1 to a height -1..1
  var waves = {
    sine: function (p) { return Math.sin(p * 2 * Math.PI); },
    square: function (p) { return p < 0.5 ? 1 : -1; },
    triangle: function (p) { return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4; },
    saw: function (p) { return p < 0.5 ? 2 * p : 2 * p - 2; }
  };
  var names = Object.keys(waves);

  // shift moves the wave sideways (in cycles), tear offsets random horizontal slices
  function draw(name, shift, tear, gain) {
    var f = waves[name], d = '';
    var step = name === 'square' || name === 'saw' ? 0.1 : 0.5;   // fine steps keep the jumps vertical
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
      // finish on the new waveform once the glitch has run, or straight away if the
      // pointer has left
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
    if (svg.classList.contains('is-glitching')) return;   // a glitch is still running; let it carry on
    clearTimeout(timer);
    pickNext();
  }
  function stop() { active = false; }

  var scope = svg.closest('.project-icon');
  scope.addEventListener('mouseenter', start);
  scope.addEventListener('mouseleave', stop);
  scope.addEventListener('focus', start);
  scope.addEventListener('blur', stop);
})();

// The TV: hovering switches it on to snow, drawn at low resolution and stretched over the
// glass so it looks soft like analogue static.
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
      var lineShift = Math.random() < 0.03 ? 40 : 0;        // the odd bright streak
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
    offTimer = setTimeout(function () { running = false; }, 320);   // after the switch-off
  }
  tv.addEventListener('mouseenter', on);
  tv.addEventListener('mouseleave', off);
  tv.addEventListener('focus', on);
  tv.addEventListener('blur', off);
})();

// About page snow globe, filled with glitter: flat, sharp-edged flecks, mostly white and
// silver with some holographic pink, lilac, yellow and blue ones that flash as they turn.
//
// Left alone, the glitter lies settled on the bottom. Hovering over the globe (or tapping it
// on a phone) gives it a nudge: it tips up onto the edge of its base and teeters back and
// forth before settling, and the jolt sets the water moving: currents lift the glitter off
// the bottom and it rises
// and swirls in slow eddies, the way things move in water, fluttering as it goes. While the
// pointer stays the water keeps gently stirring; when it leaves, the water calms and the
// glitter flutters back down and settles.
//
// Flecks live in 3D inside the ball of water (radius 1): x across, y down, z towards the
// front. The photo looks down on the globe at about 21 degrees, so the flecks are drawn from
// that same angle: the round floor of the globe shows as an ellipse, and glitter lying at the
// back of the floor sits higher in the picture than glitter at the front.
(function () {
  var globe = document.querySelector('.globe');
  if (!globe) return;
  var canvas = globe.querySelector('.globe-snow');
  var ctx = canvas.getContext('2d');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BALL = 0.95;                    // how far out flecks can go (1 = the edge of the water)
  var VIEW = 0.5;                     // the ball's radius on the canvas, in canvas widths
  // The floor of the globe, where the glitter lies: a flat disc, which from the camera's
  // angle shows as an ellipse. Its place and shape are set on the canvas in about.html
  // (data-floor="centre-x centre-y half-width half-height", as fractions of the canvas).
  // How squashed the ellipse is gives the camera's angle looking down on the globe.
  var TILT, COS, SIN, FLOOR, FLOOR_X, FLOOR_R;
  function setFloor(cx, cy, a, b) {
    TILT = Math.asin(Math.max(0.05, Math.min(0.95, b / a)));
    COS = Math.cos(TILT); SIN = Math.sin(TILT);
    FLOOR = (cy - 0.5) / (VIEW * COS);        // how far down the floor is, in the ball
    FLOOR_X = (cx - 0.5) / VIEW;              // and how far across its middle is
    FLOOR_R = a / VIEW;                       // its radius
  }
  var floorAttr = (canvas.dataset.floor || '0.5 0.8081 0.3143 0.1126').split(/\s+/).map(Number);
  setFloor.apply(null, floorAttr);
  // where a point in the water appears on the canvas (0-1), and how near the camera it is (0-1)
  function view(f) {
    return {
      x: 0.5 + VIEW * f.x,
      y: 0.5 + VIEW * (f.y * COS + f.z * SIN),
      near: ((f.z * COS - f.y * SIN) / BALL + 1) / 2
    };
  }

  // mostly white and silver, some holographic colours
  var PLAIN = ['#ffffff', '#f3f4f6', '#e4e7eb', '#d5d9df'];
  var HOLO = ['#ff9fd6', '#d3a8ff', '#ffe685', '#9eeaff', '#b6ffd8', '#ffc4a3'];

  var COUNT = 320;
  var flecks = [];
  var stir = 0;                       // how strongly the water is moving (0 = still)
  var stirring = false;               // pointer is over the globe
  var running = false;
  var time = 0, last = 0;

  function size() {
    var box = canvas.getBoundingClientRect();
    var ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, Math.round(box.width * ratio));
    canvas.height = Math.max(1, Math.round(box.height * ratio));
  }

  // lying on the floor, heaped a little higher towards the middle
  function settle(f, x, z) {
    var dx = x - FLOOR_X, d2 = (dx * dx + z * z) / (FLOOR_R * FLOOR_R);
    if (d2 > 1) { var k = 1 / Math.sqrt(d2); dx *= k; z *= k; d2 = 1; }
    f.x = FLOOR_X + dx; f.z = z;
    f.y = FLOOR - 0.01 - Math.random() * 0.07 * (1 - d2);
    f.vx = f.vy = f.vz = 0;
    f.resting = true;
  }
  function restOn(f) {
    var a = Math.random() * Math.PI * 2, r = FLOOR_R * Math.sqrt(Math.random());
    settle(f, FLOOR_X + Math.cos(a) * r, Math.sin(a) * r);
  }

  function fleck() {
    var holo = Math.random() < 0.3;
    var f = {
      size: 0.006 + 0.014 * Math.pow(Math.random(), 1.8),   // mostly small, some bigger
      color: holo ? HOLO[(Math.random() * HOLO.length) | 0] : PLAIN[(Math.random() * PLAIN.length) | 0],
      holo: holo,
      // a flat piece: a four- or three-sided shape with irregular corners
      shape: (function () {
        var n = Math.random() < 0.25 ? 3 : 4, pts = [];
        for (var i = 0; i < n; i++) {
          var a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
          var r = 0.75 + Math.random() * 0.4;
          pts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
        return pts;
      })(),
      spinA: Math.random() * Math.PI * 2,                    // turning in the picture plane
      spinB: Math.random() * Math.PI * 2,                    // tipping towards/away from you
      rateA: (Math.random() - 0.5) * 3,
      rateB: (Math.random() - 0.5) * 5,
      sink: 0.05 + Math.random() * 0.07,
      phase: Math.random() * 100,
      jx: 0, jy: 0, jz: 0,                                   // its own random wander in the water
      lift: 0                                                 // seconds until it's picked up
    };
    restOn(f);
    return f;
  }

  // The water's flow when the globe is nudged. The main current turns the whole ball of
  // water over (a "Hill's vortex", which stays inside a sphere): it rises up the middle,
  // spreads out under the top of the glass, sinks down the sides and draws back in across
  // the bottom. On top of that the water twists slowly round the upright axis, and small
  // drifting eddies (which move like a real fluid) break it up.
  var EDDIES = [
    { kx: 2.6, ky: 1.7, w: 0.8, p: 0.3, a: 0.16 },
    { kx: -1.9, ky: 2.9, w: -0.6, p: 2.1, a: 0.13 },
    { kx: 3.7, ky: -2.4, w: 1.1, p: 4.0, a: 0.08 }
  ];
  function flow(x, y, z, t) {
    var r2 = x * x + z * z;
    // turning over (y points down, so rising is negative)
    var up = -(1 - 2 * r2 - y * y);
    var vx = -y * x, vz = -y * z, vy = up;
    // twisting round the upright axis
    vx += -z * 0.45; vz += x * 0.45;
    // small eddies across the picture, and in and out
    for (var i = 0; i < EDDIES.length; i++) {
      var e = EDDIES[i], c = Math.cos(e.kx * x + e.ky * y + e.w * t + e.p) * e.a;
      vx += e.ky * c;
      vy -= e.kx * c;
    }
    vz += 0.15 * Math.sin(1.7 * x + 1.1 * y + 0.6 * t);
    return [vx, vy, vz];
  }

  function step(dt) {
    time += dt;
    stir += ((stirring ? 0.45 : 0) - stir) * (1 - Math.exp(-(stirring ? 0.5 : 0.55) * dt));
    var active = 0;
    for (var i = 0; i < flecks.length; i++) {
      var f = flecks[i];
      f.spinA += f.rateA * dt * (0.3 + stir);
      if (f.resting) {
        if (f.lift > 0) {                                   // waiting for the current to reach it
          f.lift -= dt;
          if (f.lift <= 0) {
            f.resting = false;
            f.vy = -(0.9 + Math.random() * 1.2);             // lifted off the bottom
            f.vx = (Math.random() - 0.5) * 1.2;
            f.vz = (Math.random() - 0.5) * 1.2;
          }
          active++;
        }
        continue;
      }
      active++;
      f.spinB += f.rateB * dt;
      var edgeOn = Math.abs(Math.sin(f.spinB));             // flat pieces sink faster edge-on
      var w = flow(f.x, f.y, f.z, time + f.phase * 0.01);
      // turbulence: each fleck wanders on its own, so the glitter spreads out through the
      // water instead of travelling as one ribbon
      var churn = 0.25 + 1.4 * stir, keep = Math.exp(-2.5 * dt), kick = Math.sqrt(1 - keep * keep);
      f.jx = f.jx * keep + (Math.random() * 2 - 1) * kick * churn;
      f.jy = f.jy * keep + (Math.random() * 2 - 1) * kick * churn;
      f.jz = f.jz * keep + (Math.random() * 2 - 1) * kick * churn;
      var tx = w[0] * stir * 1.6 + f.jx * 0.6 + Math.cos(f.spinB) * 0.05; // plus a side-to-side flutter
      var ty = w[1] * stir * 1.6 + f.jy * 0.45 + f.sink * (0.6 + 0.8 * edgeOn);
      var tz = w[2] * stir * 1.6 + f.jz * 0.6;
      var k = 1 - Math.exp(-2.2 * dt);                      // water drag
      f.vx += (tx - f.vx) * k; f.vy += (ty - f.vy) * k; f.vz += (tz - f.vz) * k;
      f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
      // the glass: slide along it
      var d2 = f.x * f.x + f.y * f.y + f.z * f.z;
      if (d2 > BALL * BALL) {
        var d = Math.sqrt(d2), nx = f.x / d, ny = f.y / d, nz = f.z / d;
        f.x = nx * BALL; f.y = ny * BALL; f.z = nz * BALL;
        var out = f.vx * nx + f.vy * ny + f.vz * nz;
        if (out > 0) { f.vx -= out * nx; f.vy -= out * ny; f.vz -= out * nz; }
      }
      // reaching the floor: it lies there once the water has calmed down enough
      if (f.y >= FLOOR - 0.01) {
        if (stir < 0.3 && f.vy > 0) settle(f, f.x, f.z);
        else { f.y = FLOOR - 0.01; if (f.vy > 0) f.vy = -Math.abs(f.vy) * 0.3; }   // still stirring: kicked back up
      }
    }
    return active;
  }

  function draw() {
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var seen = flecks.map(function (f) { return { f: f, v: view(f) }; });
    seen.sort(function (a, b) { return a.v.near - b.v.near; });   // far to near
    for (var i = 0; i < seen.length; i++) {
      var f = seen[i].f, v = seen[i].v;
      var depth = v.near;                                    // 0 far away, 1 nearest
      var face = Math.cos(f.spinB);                          // how face-on it is (sign = which side)
      // lying flat on the floor, seen from above, pieces are squashed by the viewing angle
      var flat = f.resting ? SIN * (0.8 + 0.4 * Math.abs(face)) : Math.max(0.12, Math.abs(face));
      var s = f.size * w * (0.75 + 0.5 * depth);
      var x = v.x * w, y = v.y * h;
      // catching the light: a bright flash when a piece faces you squarely
      var glint = Math.pow(Math.abs(face), 10);
      ctx.save();
      ctx.translate(x, y);
      if (f.resting) { ctx.scale(1, flat); ctx.rotate(f.spinA); }   // flat on the floor
      else { ctx.rotate(f.spinA); ctx.scale(1, flat); }             // tumbling in the water
      ctx.globalAlpha = (0.55 + 0.4 * depth) * (f.resting ? 0.9 : 1);
      var color = f.color;
      if (f.holo && face < 0) color = HOLO[(HOLO.indexOf(f.color) + 2) % HOLO.length];   // the other side shows another colour
      ctx.fillStyle = color;
      ctx.beginPath();
      for (var j = 0; j < f.shape.length; j++) {
        var p = f.shape[j];
        if (j) ctx.lineTo(p[0] * s, p[1] * s); else ctx.moveTo(p[0] * s, p[1] * s);
      }
      ctx.closePath();
      ctx.fill();
      if (glint > 0.2) {
        ctx.globalAlpha = glint * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var active = step(dt);
    draw();
    if (active || stirring || stir > 0.01) requestAnimationFrame(frame);
    else running = false;
  }

  function run() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  // ---- the nudge: tipping onto the edge of the base and teetering back ----
  // The base is flat, so the globe pivots on the right edge of its foot when it tips right
  // and on the left edge when it tips left. Gravity pulls it back down; each time it drops
  // flat onto the table it loses some of its swing and carries on over onto the other edge,
  // so it rocks back and forth, smaller each time, until it settles.
  var FOOT_LEFT = 6, FOOT_RIGHT = 90;       // where the foot meets the table, % across the photo
  var tip = 0, swing = 0, rocking = false, lastRock = 0;
  function rock(now) {
    var dt = Math.min(0.03, (now - lastRock) / 1000);
    lastRock = now;
    var before = tip;
    if (tip !== 0) swing -= (tip > 0 ? 1 : -1) * 520 * dt;   // gravity, in degrees a second squared
    swing *= Math.exp(-0.9 * dt);
    tip += swing * dt;
    if (before !== 0 && (tip > 0) !== (before > 0)) {
      tip = 0;
      swing *= 0.5;                                        // it lands flat, and keeps a little of the swing
    }
    if (Math.abs(tip) < 0.08 && Math.abs(swing) < 8) { tip = 0; swing = 0; }
    globe.style.transformOrigin = (tip >= 0 ? FOOT_RIGHT : FOOT_LEFT) + '% 99.5%';
    globe.style.transform = tip ? 'rotate(' + tip.toFixed(3) + 'deg)' : '';
    if (tip || swing) requestAnimationFrame(rock);
    else rocking = false;
  }
  // dir: 1 tips it to the right, -1 to the left
  function nudge(dir) {
    swing += dir * (58 + Math.random() * 18);
    if (!rocking) {
      rocking = true;
      lastRock = performance.now();
      requestAnimationFrame(rock);
    }
  }

  function start(dir) {
    if (stirring) return;
    stirring = true;
    if (still) return;
    nudge(dir || (Math.random() < 0.5 ? -1 : 1));
    stir = Math.max(stir, 1);
    // the current reaches the glitter on the bottom a little at a time, so it rises in waves
    flecks.forEach(function (f) { if (f.resting) f.lift = Math.random() * 0.9; });
    run();
  }
  function stop() { stirring = false; }

  for (var i = 0; i < COUNT; i++) flecks.push(fleck());
  size();
  draw();                                                    // glitter lying on the bottom

  // coming in from the left pushes it over to the right, and the other way round
  function pushedFrom(e) {
    var box = globe.getBoundingClientRect();
    return e.clientX < box.left + box.width / 2 ? 1 : -1;
  }
  globe.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') start(pushedFrom(e)); });
  globe.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') stop(); });
  // on touch screens there's no hover, so a tap nudges it (and another tap lets it settle)
  var pressedWith = 'mouse';
  globe.addEventListener('pointerdown', function (e) { pressedWith = e.pointerType; });
  globe.addEventListener('click', function (e) {
    if (pressedWith === 'mouse') return;
    if (stirring) stop(); else start(pushedFrom(e));
  });
  globe.addEventListener('focus', function () { start(); });
  globe.addEventListener('blur', stop);
  window.addEventListener('resize', function () { size(); draw(); });
  // the globe also changes size with the tabs line, without the window resizing
  if ('ResizeObserver' in window) new ResizeObserver(function () { size(); draw(); }).observe(canvas);
  // the canvas has its real size once the page has laid out
  window.addEventListener('load', function () { size(); draw(); });
})();

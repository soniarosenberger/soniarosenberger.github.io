// Guest book: notes + little cave-painting drawings, kept in a Supabase table.
(function () {
  var box = document.querySelector('.guestbook');
  if (!box) return;

  // The "anon" key is public by design: the table only lets it read entries and add new ones.
  var SUPABASE_URL = 'https://ysfaowwvfideihxfthxb.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzZmFvd3d2ZmlkZWloeGZ0aHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MzQxOTcsImV4cCI6MjEwNjQxMDE5N30.m5Pn2RDeAp8I7a_NmU-Zf6egNspENkJxu2qkGrCdIPM';
  var HEADERS = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };

  var api = {
    list: function () {
      return fetch(SUPABASE_URL + '/rest/v1/guestbook?select=name,message,drawing,date:created_at&order=created_at.desc&limit=200', {
        headers: HEADERS
      }).then(function (res) {
        if (!res.ok) throw new Error('could not load');
        return res.json();
      });
    },
    add: function (entry) {
      if (entry.website) return Promise.resolve();   // spam trap filled in: quietly drop it
      return fetch(SUPABASE_URL + '/rest/v1/guestbook', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, HEADERS),
        body: JSON.stringify({ name: entry.name, message: entry.message, drawing: entry.drawing })
      }).then(function (res) {
        if (!res.ok) throw new Error('could not post, try again');
      });
    }
  };

  var form = box.querySelector('.gb-form');
  var list = box.querySelector('.gb-entries');
  var status = box.querySelector('.gb-status');

  // ---- Cave painting canvas ----
  var canvas = box.querySelector('.gb-canvas');
  var ctx = canvas.getContext('2d');
  var pigment = '#8e2f1c';
  var brush = 5;
  var drawing = false;
  var hasDrawing = false;
  var last = null;

  // Draws random grey noise at a low resolution, then stretches it smoothly over the canvas.
  // Layering a few of these at different scales gives natural-looking stone mottling.
  function noiseLayer(cellsX, cellsY, spread, alpha) {
    var small = document.createElement('canvas');
    small.width = cellsX;
    small.height = cellsY;
    var sctx = small.getContext('2d');
    var img = sctx.createImageData(cellsX, cellsY);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = 128 + (Math.random() - 0.5) * spread;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'overlay';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function paintRock() {
    var w = canvas.width, h = canvas.height;
    // Base: cool mid-grey with a gentle uneven light across the wall
    var base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, '#9a9a97');
    base.addColorStop(0.5, '#8d8d8a');
    base.addColorStop(1, '#979793');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // Broad patches, then finer mottling
    noiseLayer(18, 5, 90, 0.35);
    noiseLayer(60, 16, 90, 0.3);
    noiseLayer(225, 60, 80, 0.3);
    noiseLayer(450, 120, 70, 0.25);

    // Fine grit, pixel by pixel
    var img = ctx.getImageData(0, 0, w, h);
    for (var i = 0; i < img.data.length; i += 4) {
      var n = (Math.random() - 0.5) * 34;
      if (Math.random() < 0.015) n -= 45;  // occasional dark pits
      if (Math.random() < 0.01) n += 35;   // occasional bright mineral flecks
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);

    // A few hairline cracks
    for (var c = 0; c < 3; c++) {
      var x = Math.random() * w, y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (var s = 0; s < 14; s++) {
        x += 6 + Math.random() * 14;
        y += (Math.random() - 0.5) * 12;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(40, 40, 38, 0.35)';
      ctx.lineWidth = 0.8 + Math.random() * 0.7;
      ctx.stroke();
      ctx.translate(0, 1);
      ctx.strokeStyle = 'rgba(230, 230, 225, 0.18)'; // lit lower edge of the crack
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    hasDrawing = false;
  }

  function dab(x, y) {
    // Rough, powdery pigment: a cluster of semi-transparent dots
    ctx.fillStyle = pigment;
    for (var i = 0; i < brush * 3; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = Math.random() * brush;
      ctx.globalAlpha = 0.35 + Math.random() * 0.4;
      ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function stroke(from, to) {
    var dist = Math.hypot(to.x - from.x, to.y - from.y);
    var steps = Math.max(1, Math.ceil(dist / 1.5));
    for (var i = 0; i <= steps; i++) {
      dab(from.x + (to.x - from.x) * i / steps, from.y + (to.y - from.y) * i / steps);
    }
  }

  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * canvas.width / r.width,
      y: (e.clientY - r.top) * canvas.height / r.height
    };
  }

  canvas.addEventListener('pointerdown', function (e) {
    drawing = true;
    hasDrawing = true;
    canvas.setPointerCapture(e.pointerId);
    last = pos(e);
    dab(last.x, last.y);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    var p = pos(e);
    stroke(last, p);
    last = p;
  });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    canvas.addEventListener(t, function () { drawing = false; });
  });

  box.querySelectorAll('.gb-pigment').forEach(function (btn) {
    btn.addEventListener('click', function () {
      pigment = btn.dataset.color;
      box.querySelectorAll('.gb-pigment').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
    });
  });
  box.querySelector('.gb-brush').addEventListener('change', function (e) {
    brush = Number(e.target.value);
  });
  box.querySelector('.gb-clear').addEventListener('click', paintRock);
  paintRock();

  // ---- Entries ----
  function formatDate(iso) {
    var d = new Date(iso);
    return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
  }

  // Small stable hash so each entry always gets the same frame and tilt
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function render(entries) {
    list.textContent = '';
    if (!entries.length) {
      var empty = document.createElement('p');
      empty.className = 'gb-empty';
      empty.textContent = 'No entries yet. Be the first to sign!';
      list.append(empty);
      return;
    }
    entries.forEach(function (entry) {
      var seed = hash((entry.date || '') + (entry.name || '') + (entry.message || ''));
      var slip = document.createElement('article');
      slip.className = 'gb-slip';
      slip.style.setProperty('--tilt', ((seed % 25) / 10 - 1.2).toFixed(1) + 'deg');

      var text = document.createElement('div');
      text.className = 'gb-slip-text';
      var meta = document.createElement('div');
      meta.className = 'gb-meta';
      var name = document.createElement('b');
      name.textContent = entry.name || 'Anonymous';
      meta.append(name, ' wrote on ' + formatDate(entry.date) + ':');
      text.append(meta);
      if (entry.message) {
        var msg = document.createElement('p');
        msg.className = 'gb-message';
        msg.textContent = entry.message;
        text.append(msg);
      }
      slip.append(text);

      if (entry.drawing && /^data:image\/(png|jpeg);base64,/.test(entry.drawing)) {
        var frame = document.createElement('figure');
        frame.className = 'gb-frame';
        frame.style.setProperty('--fw', (22 + (seed >>> 4) % 8) + 'px');
        frame.style.setProperty('--frame-tilt', (((seed >>> 8) % 5) - 2) + 'deg');
        var img = document.createElement('img');
        img.src = entry.drawing;
        img.alt = 'Cave painting by ' + (entry.name || 'a visitor');
        frame.append(img);
        slip.append(frame);
      }
      list.append(slip);
    });
  }


  function load() {
    api.list().then(render).catch(function () {
      list.textContent = '';
      var p = document.createElement('p');
      p.className = 'gb-empty';
      p.textContent = 'The guest book is resting. Try again later.';
      list.append(p);
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);
    var entry = {
      name: String(data.get('name') || '').trim(),
      message: String(data.get('message') || '').trim(),
      website: String(data.get('website') || ''), // spam trap, humans leave it empty
      drawing: hasDrawing ? canvas.toDataURL('image/jpeg', 0.8) : ''
    };
    if (!entry.message && !entry.drawing) {
      status.textContent = 'Write a note or draw something first!';
      return;
    }
    var submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Signing…';
    api.add(entry).then(function () {
      form.reset();
      brush = Number(box.querySelector('.gb-brush').value);
      paintRock();
      status.textContent = 'Thanks for signing!';
      load();
    }).catch(function (err) {
      status.textContent = 'Oops: ' + err.message;
    }).then(function () {
      submit.disabled = false;
    });
  });

  load();
})();

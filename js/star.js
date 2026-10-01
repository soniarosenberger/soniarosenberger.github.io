// The homepage star's thickness: a stack of star-shaped layers between the printed front and
// the paper back. Each is a little smaller towards the faces (a quarter circle in profile), so
// the edge rounds over like a pillow, and shaded like light rolling round it: the ink of the
// front wraps round the edge to about halfway, and the paper of the back meets it there.
(function () {
  var spin = document.querySelector('.star-spin');
  if (!spin) return;
  var LAYERS = 30, HALF = 4.5, PUFF = 0.05;      // half the thickness in cqw; how far the faces sit in
  var smooth = function (a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  for (var i = 0; i < LAYERS; i++) {
    var u = -1 + 2 * (i + 0.5) / LAYERS;            // -1 at the back, 1 at the front
    var round = Math.sqrt(1 - u * u);
    var scale = 1 - PUFF * (1 - round);
    var grey = 0.13 + (0.56 - 0.13) * smooth(0.25, -0.25, u);   // ink at the front, paper at the back
    grey *= 0.7 + 0.3 * round;                                   // brightest where the edge faces out
    var layer = document.createElement('span');
    layer.className = 'star-layer';
    var g = Math.round(grey * 255);
    layer.style.background = 'rgb(' + g + ' ' + g + ' ' + g + ')';
    layer.style.transform = 'translateZ(' + (u * HALF).toFixed(3) + 'cqw) scale(' + scale.toFixed(4) + ')';
    spin.prepend(layer);
  }
  // a shadow over each face, deepening as it turns away
  ['front', 'back'].forEach(function (side) {
    var shade = document.createElement('span');
    shade.className = 'star-shade' + (side === 'back' ? ' star-shade--back' : '');
    shade.style.transform = (side === 'back' ? 'rotateY(180deg) ' : '') + 'translateZ(' + (HALF + 0.1) + 'cqw) scale(' + (1 - PUFF) + ')';
    spin.append(shade);
  });
})();

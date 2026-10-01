// contour layers (star-layers.png) stacked on both sides of the middle
(function () {
  var spin = document.querySelector('.star-spin');
  if (!spin) return;
  var N = 20, DEPTH = 11;                    // layers per side; depth in cqw
  for (var k = 0; k <= N; k++) {
    var z = DEPTH * k / (N + 1);
    (k ? [z, -z] : [0]).forEach(function (at) {
      var layer = document.createElement('span');
      layer.className = 'star-layer';
      layer.style.setProperty('--at', (k / N * 100) + '%');
      layer.style.setProperty('--z', at.toFixed(3) + 'cqw');
      spin.append(layer);
    });
  }
  // edge-on fill: upright profile slices (star-sides.png)
  var SLICES = 48;
  for (var i = 0; i < SLICES; i++) {
    var slice = document.createElement('span');
    slice.className = 'star-slice';
    slice.style.left = ((i + 0.5) / SLICES * 100 - DEPTH) + 'cqw';
    slice.style.backgroundPositionX = (i / (SLICES - 1) * 100) + '%';
    spin.append(slice);
  }
})();

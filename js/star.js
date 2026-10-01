// The homepage star's shape: layers of the print, each cut to one contour of the balloon's
// height (frame k of images/home/star-layers.png), placed at that height on both sides of
// the middle. The middle layer is the whole star; the last pair is a small patch at the
// centre, where it's puffiest.
(function () {
  var spin = document.querySelector('.star-spin');
  if (!spin) return;
  var N = 20, DEPTH = 11;                    // contours each side; the puff at the centre, in cqw
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
})();

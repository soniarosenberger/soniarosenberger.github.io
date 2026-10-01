// Seasonal playlists: refresh each cover from Spotify so it stays current if the
// playlist's image changes. If Spotify can't be reached, the cover in the HTML stays.
document.querySelectorAll('.playlist').forEach(function (link) {
  fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(link.href))
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.thumbnail_url) return;
      link.querySelectorAll('.jewel-cover').forEach(function (img) { img.src = data.thumbnail_url; });
    })
    .catch(function () {});
});

// Touch screens have no hover, so the first tap on a CD opens its case (lid swinging open,
// in colour) and a second tap goes to the playlist. Tapping anywhere else closes it.
if (window.matchMedia('(hover: none)').matches) {
  var openCase = null;
  function closeCase() {
    if (!openCase) return;
    openCase.classList.remove('is-open');
    openCase.dispatchEvent(new Event('icon:off'));
    openCase = null;
  }
  document.querySelectorAll('.playlist').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (openCase === link) return;                 // second tap: off to Spotify
      e.preventDefault();
      closeCase();
      openCase = link;
      link.classList.add('is-open');
      link.dispatchEvent(new Event('icon:on'));
    });
  });
  document.addEventListener('click', function (e) {
    if (openCase && !openCase.contains(e.target)) closeCase();
  });
}

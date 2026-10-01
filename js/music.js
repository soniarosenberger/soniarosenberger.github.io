// refresh playlist covers from spotify
document.querySelectorAll('.playlist').forEach(function (link) {
  fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(link.href))
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.thumbnail_url) return;
      link.querySelectorAll('.jewel-cover').forEach(function (img) { img.src = data.thumbnail_url; });
    })
    .catch(function () {});
});


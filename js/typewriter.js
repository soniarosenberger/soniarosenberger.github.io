// Writing page: while the typewriter is hovered (or focused), it keyboard-smashes onto its
// paper (fast, jumbled bursts of mostly home-row letters, with the odd pause for breath), and
// when a line is full the paper feeds up for the next. Moving off clears the page.
(function () {
  var typed = document.querySelector('.tw-typed');
  if (!typed) return;
  var icon = typed.closest('.project-icon');
  var LINE = 15, LINES = 6;
  // weighted towards where hands land when they smash: the home row, then its neighbours
  var KEYS = 'asdfghjklasdfghjklasdfjklkjhgfdsaqwertyuiopzxcvbnm;';
  var lines = [''], timer = null, on = false, burst = 0;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function key() {
    if (!on) return;
    var line = lines[lines.length - 1];
    var wait = 55 + Math.random() * 70;                 // quick, but each key still lands
    if (line.length >= LINE) {                          // carriage return: feed the paper up
      lines.push('');
      if (lines.length > LINES) lines.shift();
      wait += 250;
    } else {
      lines[lines.length - 1] += KEYS[Math.floor(Math.random() * KEYS.length)];
      if (--burst <= 0) {                               // end of a burst: a short breath
        burst = 4 + Math.floor(Math.random() * 12);
        wait += 200 + Math.random() * 350;
      }
    }
    typed.textContent = lines.join('\n');
    timer = setTimeout(key, wait);
  }
  function start() {
    if (on || still) return;
    on = true;
    burst = 4 + Math.floor(Math.random() * 12);
    timer = setTimeout(key, 100);
  }
  function stop() {
    on = false;
    clearTimeout(timer);
    lines = [''];
    typed.textContent = '';
  }
  icon.addEventListener('mouseenter', start);
  icon.addEventListener('mouseleave', stop);
  icon.addEventListener('focus', start);
  icon.addEventListener('blur', stop);
  icon.addEventListener('icon:on', start);     // tapped, on a touch screen
  icon.addEventListener('icon:off', stop);
})();

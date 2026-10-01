// typewriter: types gibberish while hovered
(function () {
  var typed = document.querySelector('.tw-typed');
  if (!typed) return;
  var icon = typed.closest('.project-icon');
  var LINE = 15, LINES = 6;
  // mostly home row
  var KEYS = 'asdfghjklasdfghjklasdfjklkjhgfdsaqwertyuiopzxcvbnm;';
  var lines = [''], timer = null, on = false, burst = 0;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function key() {
    if (!on) return;
    var line = lines[lines.length - 1];
    var wait = 55 + Math.random() * 70;
    if (line.length >= LINE) {
      lines.push('');
      if (lines.length > LINES) lines.shift();
      wait += 250;
    } else {
      lines[lines.length - 1] += KEYS[Math.floor(Math.random() * KEYS.length)];
      if (--burst <= 0) {
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
  icon.addEventListener('icon:on', start);
  icon.addEventListener('icon:off', stop);
})();

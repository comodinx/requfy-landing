// Selector de tema: guarda la preferencia (system | light | dark) y marca <html data-theme>.
(function () {
  var KEY = 'requfy-theme';
  var root = document.documentElement;
  var group = document.querySelector('.theme-switch');
  if (!group) return;
  var radios = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
  var metas = Array.prototype.slice.call(document.querySelectorAll('meta[name="theme-color"]'));
  var original = metas.map(function (m) { return m.getAttribute('content'); });

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : 'system';
    } catch (e) { return 'system'; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* modo privado */ }
  }
  function apply(v) {
    if (v === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', v);
    // theme-color: con elección explícita, ambos <meta> usan el color elegido.
    metas.forEach(function (m, i) {
      m.setAttribute('content', v === 'system' ? original[i] : (v === 'dark' ? '#0C0D11' : '#F2F3F7'));
    });
    radios.forEach(function (r) {
      var on = r.getAttribute('data-theme-value') === v;
      r.setAttribute('aria-checked', on ? 'true' : 'false');
      r.tabIndex = on ? 0 : -1;
    });
  }
  function choose(v, focus) {
    save(v);
    apply(v);
    if (focus) radios.filter(function (r) { return r.getAttribute('data-theme-value') === v; })[0].focus();
  }

  radios.forEach(function (r, i) {
    r.addEventListener('click', function () { choose(r.getAttribute('data-theme-value'), false); });
    r.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      choose(radios[(i + d + radios.length) % radios.length].getAttribute('data-theme-value'), true);
    });
  });
  apply(read());
})();

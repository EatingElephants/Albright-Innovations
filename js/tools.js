/* Albright Innovations: wires the homepage tools to the math in calc.js.
   Results are kept in window.Albright.results so the chat panel can attach them. */
/* Previewing on this computer: keep links to albright-innovations.com on the local copy.
   Does nothing on the real site. */
(function () {
  var h = location.hostname;
  if (h !== 'localhost' && h !== '127.0.0.1') { return; }
  var live = 'https://albright-innovations.com';
  Array.prototype.forEach.call(document.querySelectorAll('a[href^="' + live + '"]'), function (a) {
    a.setAttribute('href', a.getAttribute('href').slice(live.length) || '/');
  });
})();

/* Phone menu: close it after a link is tapped, on Escape, or on a tap outside it. */
(function () {
  var menu = document.querySelector('.menu');
  if (!menu) { return; }
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menu.open = false; } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
  document.addEventListener('click', function (e) { if (menu.open && !menu.contains(e.target)) { menu.open = false; } });
})();

(function () {
  'use strict';
  if (!window.Calc) { return; }
  var Calc = window.Calc;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- shared results store ---------- */
  var KEY = 'albright-results';
  var A = window.Albright = window.Albright || {};
  A.results = {};
  try { A.results = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) { A.results = {}; }
  A.save = function (name, value) {
    A.results[name] = value;
    try { sessionStorage.setItem(KEY, JSON.stringify(A.results)); } catch (e) { /* private mode: the page still works */ }
  };

  /* ---------- sliders: a range and a typed number that stay in step ---------- */
  function fill(range) {
    var min = Number(range.min) || 0, max = Number(range.max) || 100, v = Number(range.value) || 0;
    var p = max > min ? (v - min) / (max - min) * 100 : 0;
    range.style.setProperty('--p', Math.max(0, Math.min(100, p)) + '%');
  }
  function bindSlider(block, onChange) {
    var range = $('input[type="range"]', block);
    var number = $('input[type="number"]', block);
    if (!range) { return null; }
    var state = { value: Number(range.value) || 0 };
    function set(v, from) {
      if (!isFinite(v)) { v = 0; }
      state.value = v;
      if (from !== range) { range.value = Math.max(Number(range.min), Math.min(Number(range.max), v)); }
      if (number && from !== number) { number.value = v; }
      fill(range);
      onChange();
    }
    range.addEventListener('input', function () { set(Number(range.value), range); });
    if (number) {
      number.addEventListener('input', function () {
        if (number.value === '') { return; }
        var v = Number(number.value);
        if (!isFinite(v)) { return; }
        var lo = Number(number.min); if (isFinite(lo) && number.min !== '' && v < lo) { v = lo; }
        var hi = Number(number.max); if (isFinite(hi) && number.max !== '' && v > hi) { v = hi; }
        set(v, number);
      });
      number.addEventListener('blur', function () { if (number.value === '' || !isFinite(Number(number.value))) { set(0); } number.value = state.value; });
    }
    fill(range);
    return { get: function () { return state.value; }, range: range };
  }

  /* ---------- Tool A ---------- */
  (function timeTool() {
    var tool = $('#time');
    if (!tool) { return; }
    var inputs = {}, pending = false;
    $$('.slider', tool).forEach(function (block) {
      var range = $('input[type="range"]', block);
      var key = range && range.getAttribute('data-time');
      if (!key) { return; }
      inputs[key] = bindSlider(block, schedule);
    });
    var out = {
      week: $('#time-week'), year: $('#time-year'), dollars: $('#time-dollars'), equiv: $('#time-equiv')
    };
    function values() {
      var v = {};
      Object.keys(inputs).forEach(function (k) { v[k] = inputs[k].get(); });
      return v;
    }
    function render() {
      pending = false;
      var r = Calc.timeLeaks(values());
      out.week.textContent = Calc.num(r.week);
      out.year.textContent = Calc.num(r.year);
      out.dollars.textContent = Calc.money(r.dollars);
      out.equiv.innerHTML = Calc.timeEquivalent(r);
      Calc.TIME_KEYS.forEach(function (k) {
        var bar = $('[data-bar="' + k + '"]', tool), n = $('[data-n="' + k + '"]', tool);
        if (bar) { bar.style.width = (r.shares[k] * 100).toFixed(1) + '%'; }
        if (n) { n.textContent = Calc.num(r.hours[k]) + ' h'; }
      });
      A.save('time', {
        label: 'Where does your week go?',
        summary: Calc.num(r.week) + ' hours a week on admin, about ' + Calc.money(r.dollars) + ' a year at ' + Calc.money(r.rate) + '/hour',
        detail: Calc.TIME_KEYS.map(function (k) { return Calc.TIME_LABELS[k] + ': ' + Calc.num(r.hours[k]) + ' h/wk'; }).join('; '),
        week: r.week, year: r.year, dollars: r.dollars, rate: r.rate, hours: r.hours
      });
    }
    function schedule() {
      if (pending) { return; }
      pending = true;
      window.requestAnimationFrame(render);
    }
    render();
  })();

  /* ---------- Tool B ---------- */
  (function callsTool() {
    var tool = $('[data-tool="calls"]');
    if (!tool) { return; }
    var inputs = {}, pending = false;
    $$('.slider', tool).forEach(function (block) {
      var range = $('input[type="range"]', block);
      var key = range && range.getAttribute('data-calls');
      if (!key) { return; }
      inputs[key] = bindSlider(block, schedule);
    });
    var out = { missed: $('#calls-missed'), jobs: $('#calls-jobs'), year: $('#calls-year'), equiv: $('#calls-equiv') };
    function render() {
      pending = false;
      var r = Calc.missedCalls({ calls: inputs.calls.get(), missed: inputs.missed.get(), value: inputs.value.get(), close: inputs.close.get() });
      out.missed.textContent = Calc.num(r.missedMonth);
      out.jobs.textContent = Calc.num(r.jobsMonth);
      out.year.textContent = Calc.money(r.revenueYear);
      out.equiv.innerHTML = Calc.callsEquivalent(r);
      A.save('calls', {
        label: 'Missed-call calculator',
        summary: Calc.num(r.missedMonth) + ' missed calls a month, about ' + Calc.num(r.jobsMonth) + ' jobs and ' + Calc.money(r.revenueYear) + ' a year at risk',
        detail: Calc.num(r.calls) + ' calls/wk; ' + Calc.pct(r.missedShare) + ' missed; ' + Calc.money(r.value) + ' avg job; ' + Calc.pct(r.closeShare) + ' become work',
        missedMonth: r.missedMonth, jobsMonth: r.jobsMonth, revenueMonth: r.revenueMonth, revenueYear: r.revenueYear
      });
    }
    function schedule() {
      if (pending) { return; }
      pending = true;
      window.requestAnimationFrame(render);
    }
    render();
  })();

  /* ---------- Tool C: the checkup, one question at a time ---------- */
  (function quiz() {
    var form = $('#quiz');
    if (!form) { return; }
    var qs = $$('.q', form);
    var questions = qs.map(function (q) {
      return {
        weight: Number(q.getAttribute('data-weight')) || 0,
        good: q.getAttribute('data-good') || 'yes',
        fix: q.getAttribute('data-fix') || '',
        why: q.getAttribute('data-fix-why') || '',
        service: q.getAttribute('data-service') || '',
        side: q.getAttribute('data-side') || '',
        text: $('legend', q).textContent.trim()
      };
    });
    var i = 0, done = false;
    var count = $('#quiz-count'), progress = $('#quiz-progress'), bar = $('span', progress);
    var back = $('#quiz-back'), next = $('#quiz-next'), nav = $('.quiz-nav', form), result = $('#quiz-result');
    form.setAttribute('data-js', '');
    function answerOf(q) { var c = $('input:checked', q); return c ? c.value : null; }
    function answers() { return qs.map(answerOf); }
    function show() {
      qs.forEach(function (q, n) { q.hidden = done || n !== i; });
      nav.hidden = done;
      result.hidden = !done;
      var answered = answers().filter(Boolean).length;
      count.textContent = done ? 'Your result' : 'Question ' + (i + 1) + ' of ' + qs.length;
      progress.setAttribute('aria-valuenow', String(done ? qs.length : answered));
      bar.style.width = ((done ? qs.length : i) / qs.length * 100) + '%';
      back.disabled = i === 0;
      next.textContent = i === qs.length - 1 ? 'See my score' : 'Next';
      if (!done) { var first = $('input', qs[i]); if (first && document.activeElement !== first && form.contains(document.activeElement)) { first.focus(); } }
    }
    function finish() {
      var r = Calc.checkup(questions, answers());
      done = true;
      $('#quiz-score').textContent = String(r.score);
      $('#quiz-label').textContent = r.label;
      $('#quiz-blurb').textContent = r.blurb;
      var list = $('#quiz-fixes');
      list.innerHTML = '';
      if (!r.fixes.length) {
        var li = document.createElement('li');
        li.innerHTML = '<div><b>Nothing urgent on the operations side.</b><span>Most owners at this score put their next effort into being found: steady posts, a current website and ads that are tracked.</span></div>';
        list.appendChild(li);
      }
      r.fixes.forEach(function (f) {
        var li = document.createElement('li');
        var b = document.createElement('b'); b.textContent = f.fix;
        var s = document.createElement('span'); s.textContent = f.why + ' (' + f.service + ')';
        var wrap = document.createElement('div'); wrap.appendChild(b); wrap.appendChild(s);
        li.appendChild(wrap);
        list.appendChild(li);
      });
      A.save('checkup', {
        label: '2-minute operations checkup',
        summary: r.score + ' out of 100, "' + r.label + '"',
        detail: questions.map(function (q, n) { return q.text + ' ' + (answers()[n] || 'skipped'); }).join('; ') + (r.fixes.length ? '. Fix first: ' + r.fixes.map(function (f) { return f.fix; }).join(' / ') : ''),
        score: r.score, labelText: r.label, fixes: r.fixes.map(function (f) { return f.fix; })
      });
      show();
      result.focus && result.setAttribute('tabindex', '-1');
      result.focus();
    }
    next.addEventListener('click', function () {
      if (!answerOf(qs[i])) {
        var first = $('input', qs[i]); if (first) { first.focus(); }
        qs[i].classList.add('needs-answer');
        return;
      }
      qs[i].classList.remove('needs-answer');
      if (i < qs.length - 1) { i++; show(); } else { finish(); }
    });
    back.addEventListener('click', function () { if (i > 0) { i--; show(); } });
    $('#quiz-restart').addEventListener('click', function () {
      qs.forEach(function (q) { $$('input', q).forEach(function (r) { r.checked = false; }); });
      done = false; i = 0; show();
      var first = $('input', qs[0]); if (first) { first.focus(); }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });
    form.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.type === 'radio') { e.preventDefault(); next.click(); } });
    show();
  })();

  /* ---------- Tool E: first call to final invoice ---------- */
  (function flow() {
    var steps = $('#flow-steps'), toggle = $('#flow-toggle');
    if (!steps || !toggle) { return; }
    steps.setAttribute('data-js', '');
    $$('button', toggle).forEach(function (b) {
      b.addEventListener('click', function () {
        var mode = b.getAttribute('data-mode');
        steps.setAttribute('data-mode', mode);
        $$('button', toggle).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
    });
  })();

  /* ---------- Sound familiar: one row open at a time on small screens ---------- */
  (function rows() {
    var rows = $$('.rows .row');
    rows.forEach(function (row) {
      row.addEventListener('toggle', function () {
        if (row.open && window.innerWidth < 860) { rows.forEach(function (r) { if (r !== row) { r.open = false; } }); }
      });
    });
  })();
})();

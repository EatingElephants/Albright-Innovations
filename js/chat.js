/* Albright Innovations: the "Tell us what's going on" panel.
   A short conversation (what's going on, name, business, how to reach you), then one send.
   Calculator and checkup results attach themselves. Sends to /api/lead; if that isn't
   wired up yet, it opens a prefilled email so nothing is lost. */
(function () {
  'use strict';
  var dialog = document.getElementById('chat');
  if (!dialog || typeof dialog.showModal !== 'function') { return; }
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var send = document.getElementById('chat-send');
  var inputLabel = document.getElementById('chat-input-label');
  var EMAIL = 'joshua@albright-innovations.com';
  var ENDPOINT = '/api/lead';

  var state = { step: 0, data: {}, topic: '', attach: [], opener: null, sent: false };

  var STEPS = [
    { key: 'message', ask: function () { return state.topic ? 'You picked <strong>' + esc(state.topic) + '</strong>. What’s going on in the business right now? A sentence or two is plenty.' : 'What’s eating up your week? A sentence or two is plenty.'; }, label: 'Your message', placeholder: 'Type here', type: 'text', check: function (v) { return v.length >= 3 ? '' : 'A few words is all we need.'; } },
    { key: 'name', ask: function () { return 'Thanks. Who are we talking to?'; }, label: 'Your name', placeholder: 'First and last name', type: 'text', autocomplete: 'name', check: function (v) { return v.length >= 2 ? '' : 'Your name, so we know who to ask for.'; } },
    { key: 'business', ask: function (d) { return 'Good to meet you, ' + esc(first(d.name)) + '. What’s the business called, and what do you do?'; }, label: 'Your business', placeholder: 'Business name and what you do', type: 'text', autocomplete: 'organization', check: function (v) { return v.length >= 2 ? '' : 'The business name is enough.'; } },
    { key: 'contact', ask: function () { return 'Last one. What’s the best way to reach you, a phone number or an email?'; }, label: 'Phone or email', placeholder: 'Phone number or email', type: 'text', autocomplete: 'email', inputmode: 'email', check: function (v) { return looksLikeContact(v) ? '' : 'A phone number with area code, or an email address.'; } }
  ];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function first(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
  function looksLikeContact(v) {
    var digits = v.replace(/\D/g, '');
    return digits.length >= 10 || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  }
  function results() {
    var r = (window.Albright && window.Albright.results) || {};
    try { if (!Object.keys(r).length) { r = JSON.parse(sessionStorage.getItem('albright-results') || '{}') || {}; } } catch (e) { r = {}; }
    return r;
  }

  function msg(cls, html) {
    var el = document.createElement('div');
    el.className = 'msg ' + cls;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }
  function attachments() {
    var r = results(), keys = Object.keys(r);
    if (!keys.length) { return; }
    state.attach = keys;
    var chips = keys.map(function (k) { return '<span>' + esc(r[k].label) + '</span>'; }).join('');
    var lines = keys.map(function (k) { return '<li>' + esc(r[k].summary) + '</li>'; }).join('');
    msg('note', 'Attached from this visit:<div class="attach">' + chips + '</div><ul>' + lines + '</ul>');
  }
  function ask(stepIndex) {
    var s = STEPS[stepIndex];
    msg('us', s.ask(state.data));
    inputLabel.textContent = s.label;
    input.placeholder = s.placeholder;
    input.type = s.type;
    input.setAttribute('autocomplete', s.autocomplete || 'off');
    if (s.inputmode) { input.setAttribute('inputmode', s.inputmode); } else { input.removeAttribute('inputmode'); }
    input.value = state.data[s.key] || '';
    input.focus();
  }
  function review() {
    var d = state.data;
    var html = 'Here’s what we’ll send:<ul>' +
      '<li><strong>From:</strong> ' + esc(d.name) + ', ' + esc(d.business) + '</li>' +
      '<li><strong>Reach you at:</strong> ' + esc(d.contact) + '</li>' +
      '<li><strong>What’s going on:</strong> ' + esc(d.message) + '</li>' +
      (state.attach.length ? '<li><strong>Attached:</strong> ' + state.attach.map(function (k) { return esc(results()[k].label); }).join(', ') + '</li>' : '') +
      '</ul><div class="chat-actions"><button class="btn primary" type="button" data-send>Send it</button><button class="btn" type="button" data-edit>Change something</button></div>';
    var el = msg('us', html);
    form.hidden = true;
    el.querySelector('[data-send]').focus();
    el.querySelector('[data-send]').addEventListener('click', function () { el.querySelector('.chat-actions').remove(); submit(); });
    el.querySelector('[data-edit]').addEventListener('click', function () { el.remove(); form.hidden = false; state.step = 0; ask(0); });
  }
  function payload() {
    var r = results();
    return {
      message: state.data.message, name: state.data.name, business: state.data.business, contact: state.data.contact,
      topic: state.topic || '', page: location.href, sentAt: new Date().toISOString(),
      results: state.attach.map(function (k) { return { tool: r[k].label, summary: r[k].summary, detail: r[k].detail }; })
    };
  }
  function plainText(p) {
    var lines = ['Name: ' + p.name, 'Business: ' + p.business, 'Reach me at: ' + p.contact, (p.topic ? 'About: ' + p.topic : ''), '', 'What’s going on:', p.message, ''];
    p.results.forEach(function (x) { lines.push(x.tool + ': ' + x.summary); lines.push('  ' + x.detail); });
    lines.push('', 'Sent from ' + p.page);
    return lines.filter(function (l) { return l !== null; }).join('\n');
  }
  function submit() {
    var p = payload();
    var waiting = msg('note', 'Sending…');
    var done = function (ok) {
      waiting.remove();
      if (ok) {
        state.sent = true;
        msg('us', 'Got it, ' + esc(first(p.name)) + '. We’ll read this, think it over, and get back to you at <strong>' + esc(p.contact) + '</strong> within one business day.');
        try { sessionStorage.setItem('albright-sent', '1'); } catch (e) { /* fine */ }
      } else {
        fallback(p);
      }
    };
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 8000);
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p), signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) { clearTimeout(timer); return res.ok ? res.json().catch(function () { return { ok: true }; }) : { ok: false }; })
      .then(function (j) { done(!!(j && j.ok)); })
      .catch(function () { clearTimeout(timer); done(false); });
  }
  function fallback(p) {
    var text = plainText(p);
    var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Tell us what’s going on: ' + p.business) + '&body=' + encodeURIComponent(text);
    var el = msg('us', 'Our message form isn’t connected on this site yet, so nothing was sent. Nothing is lost either: everything you typed is ready to go by email.' +
      '<div class="chat-actions"><a class="btn primary" href="' + href + '">Open my email with it filled in</a><button class="btn" type="button" data-copy>Copy it instead</button></div>' +
      '<p class="src">Or send it to <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.</p>');
    var copy = el.querySelector('[data-copy]');
    copy.addEventListener('click', function () {
      var ok = function () { copy.textContent = 'Copied'; };
      var no = function () { copy.textContent = 'Copy blocked. Select the text above.'; msg('note', '<pre style="white-space:pre-wrap;font:inherit">' + esc(text) + '</pre>'); };
      try { navigator.clipboard.writeText(text).then(ok, no); } catch (e) { no(); }
    });
  }

  function open(opener) {
    state.opener = opener || null;
    state.topic = (opener && opener.getAttribute('data-topic')) || '';
    if (state.sent) {
      dialog.showModal();
      return;
    }
    log.innerHTML = '';
    form.hidden = false;
    state.step = 0;
    state.data = {};
    state.attach = [];
    attachments();
    if (opener && opener.getAttribute('data-attach') && !state.attach.length) {
      msg('note', 'Move a slider or finish the checkup first and the numbers will ride along with your message.');
    }
    ask(0);
    dialog.showModal();
    input.focus();
  }
  function close() {
    dialog.close();
    if (state.opener && typeof state.opener.focus === 'function') { state.opener.focus(); }
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-chat-open]');
    if (openBtn) { e.preventDefault(); open(openBtn); return; }
    if (e.target.closest('[data-chat-close]')) { close(); return; }
    if (e.target === dialog) { close(); }
  });
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var s = STEPS[state.step];
    var v = input.value.trim();
    var problem = s.check(v);
    if (problem) { msg('note', esc(problem)); input.focus(); return; }
    state.data[s.key] = v;
    msg('me', esc(v));
    input.value = '';
    state.step++;
    if (state.step < STEPS.length) { ask(state.step); } else { review(); }
  });
})();

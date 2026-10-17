/* Albright Innovations: the landing pages (/free-website, /operations, /contractors).
   What this file does:
     1. Keeps links on the local copy when previewing on this computer. Does nothing on the real site.
     2. Fills the form's hidden tracking fields (utm_source, utm_medium, utm_campaign, utm_content)
        from the page address, so each lead says which ad it came from. The values are kept for the
        visit, so they survive a scroll or a reload.
     3. Sends the form to the address set in src/site.json ("lead_endpoint"). If that is blank, or the
        send fails, it offers a prefilled email instead, so nothing is lost.
     4. On a thank-you page, adds the visitor's first name to the heading.
     5. Hides the sticky phone button while the form is on screen.
   TODO: set "lead_endpoint" in src/site.json (and "lead_access_key" if you pick Web3Forms), then rebuild.
   Nothing here needs editing for that. */
(function () {
  'use strict';

  /* 1. Local preview: links to albright-innovations.com stay on this computer. */
  (function () {
    /* On the real site, nothing happens. On a preview copy (this computer, or a Cloudflare preview address),
       links to albright-innovations.com are kept on the copy being looked at. */
    var h = location.hostname;
    if (h === 'albright-innovations.com' || h === 'www.albright-innovations.com') { return; }
    var live = 'https://albright-innovations.com';
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="' + live + '"]'), function (a) {
      a.setAttribute('href', a.getAttribute('href').slice(live.length) || '/');
    });
  })();

  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var UTM_STORE = 'albright-utm';
  var NAME_STORE = 'albright-lead-name';

  function store(key, value) { try { sessionStorage.setItem(key, value); } catch (e) { /* private mode: the page still works */ } }
  function recall(key) { try { return sessionStorage.getItem(key) || ''; } catch (e) { return ''; } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function first(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }

  /* 2. Tracking values from the address bar, remembered for this visit. */
  function trackingValues() {
    var found = {}, any = false;
    try {
      var q = new URLSearchParams(location.search);
      UTM.forEach(function (k) { var v = q.get(k); if (v) { found[k] = v.slice(0, 200); any = true; } });
    } catch (e) { /* very old browser: nothing to read */ }
    if (any) { store(UTM_STORE, JSON.stringify(found)); return found; }
    try { return JSON.parse(recall(UTM_STORE) || '{}') || {}; } catch (e) { return {}; }
  }

  /* 3. The form. */
  var form = document.querySelector('form.lead-form');
  if (form) {
    var utm = trackingValues();
    UTM.forEach(function (k) { var f = form.elements[k]; if (f) { f.value = utm[k] || ''; } });
    if (form.elements.page_url) { form.elements.page_url.value = location.href.split('#')[0]; }

    var endpoint = form.getAttribute('data-endpoint') || '';
    var accessKey = form.getAttribute('data-key') || '';
    var thanks = form.getAttribute('data-thanks') || '/';
    var email = form.getAttribute('data-email') || '';
    var offer = form.getAttribute('data-offer') || 'Website';
    var status = form.querySelector('.form-status');
    var busy = false;

    /* The "Where does your week go?" calculator, if this page has one. Only attached once the visitor
       has actually moved a slider, so default numbers never get mistaken for theirs. */
    var tool = document.getElementById('time'), toolTouched = false;
    if (tool) { tool.addEventListener('input', function () { toolTouched = true; }); }

    var LABELS = {
      name: 'Name', business: 'Business', email: 'Email', phone: 'Phone', website: 'Website or page',
      business_type: 'Type of business', area: 'Area', crew: 'Crew size', jobs_from: 'Where most jobs come from',
      notes: 'Notes', calculator: 'Calculator', offer: 'Offer', page_url: 'Page',
      utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign', utm_content: 'utm_content'
    };
    var ORDER = ['name', 'business', 'email', 'phone', 'website', 'business_type', 'area', 'crew', 'jobs_from', 'notes', 'calculator', 'offer', 'page_url', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

    function collect() {
      var data = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.name === 'company_fax' || el.disabled) { return; }
        if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) { return; }
        data[el.name] = String(el.value || '').trim().slice(0, 4000);
      });
      if (toolTouched) {
        var r = (window.Albright && window.Albright.results && window.Albright.results.time) || null;
        if (r && r.summary) { data.calculator = r.summary + ' (' + r.detail + ')'; }
      }
      data.subject = 'New ' + offer.toLowerCase() + ' lead: ' + (data.business || data.name || 'website visitor');
      data.from_name = 'albright-innovations.com';
      if (accessKey) { data.access_key = accessKey; }
      return data;
    }
    function plainText(data) {
      var lines = [];
      ORDER.forEach(function (k) { if (data[k]) { lines.push(LABELS[k] + ': ' + data[k]); } });
      return lines.join('\n');
    }
    function say(html) { if (status) { status.innerHTML = html; } }
    function send(data) {
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 10000);
      /* Google Apps Script answers with a redirect the browser won't let us read, so we send it
         "blind" and treat a completed request as sent. Every other service answers normally. */
      var blind = /script\.google(?:usercontent)?\.com/.test(endpoint);
      var opts = { method: 'POST', body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined };
      if (blind) { opts.mode = 'no-cors'; opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' }; }
      else { opts.headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }; }
      return fetch(endpoint, opts)
        .then(function (res) {
          clearTimeout(timer);
          if (blind) { return true; }
          if (!res.ok) { return false; }
          return res.json().then(function (j) { return !(j && (j.success === false || j.ok === false)); }, function () { return true; });
        })
        .catch(function () { clearTimeout(timer); return false; });
    }
    function finish(data) {
      store(NAME_STORE, first(data.name));
      location.href = thanks;
    }
    function fallback(data, failed) {
      var text = plainText(data);
      var href = 'mailto:' + email + '?subject=' + encodeURIComponent(offer + ': ' + (data.business || data.name)) + '&body=' + encodeURIComponent(text);
      var why = failed ? 'Our form couldn’t send just now, so nothing went through.' : 'Our form isn’t connected on this site yet, so nothing was sent.';
      say('<p>' + why + ' Nothing is lost either: everything you typed is ready to go by email.</p>' +
        '<div class="form-fallback"><a class="btn primary" href="' + href + '">Open my email with it filled in</a><button class="btn" type="button" data-copy>Copy it instead</button></div>' +
        '<p class="help">Or send it to <a href="mailto:' + esc(email) + '">' + esc(email) + '</a>.</p>');
      var copy = status.querySelector('[data-copy]');
      if (copy) {
        copy.addEventListener('click', function () {
          var ok = function () { copy.textContent = 'Copied'; };
          var no = function () { copy.textContent = 'Copy blocked. Select the text below.'; status.insertAdjacentHTML('beforeend', '<pre class="form-copy">' + esc(text) + '</pre>'); };
          try { navigator.clipboard.writeText(text).then(ok, no); } catch (e) { no(); }
        });
      }
      status.scrollIntoView({ block: 'nearest' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) { return; }
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = collect();
      if (form.elements.company_fax && form.elements.company_fax.value) { finish(data); return; }
      if (!endpoint) { fallback(data, false); return; }
      busy = true;
      say('<p>Sending…</p>');
      send(data).then(function (ok) {
        busy = false;
        if (ok) { finish(data); } else { fallback(data, true); }
      });
    });
  }

  /* 4. Thank-you page: "Got it. Thanks, Dana." when we know the name. */
  var slot = document.querySelector('[data-first-name]');
  if (slot) {
    var n = recall(NAME_STORE);
    if (n) { slot.textContent = ', ' + n; }
  }

  /* 5. The sticky phone button steps aside while the form is on screen. */
  var bar = document.querySelector('.landing-sticky'), target = document.getElementById('form');
  if (bar && target && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (x) { bar.classList.toggle('is-hidden', x.isIntersecting); });
    }, { threshold: 0.1 }).observe(target);
  }
})();

/**
 * Lead endpoint for the "Tell us what's going on" panel.
 * Runs as a Cloudflare Pages Function at https://albright-innovations.com/api/lead
 *
 * HOW TO CONNECT IT (one setting, no code changes):
 *   In the Cloudflare dashboard, open this site under Workers & Pages, go to
 *   Settings > Environment variables, and add:
 *       LEAD_WEBHOOK = https://... (the address your form service gives you)
 *   Any service that accepts a JSON POST works: Formspree, Zapier or Make
 *   "catch hook", Basin, Google Apps Script, your CRM's inbound webhook, etc.
 *   Redeploy once after adding it.
 *
 * Until that variable exists, this returns { ok: false, reason: "not-configured" }
 * and the chat panel falls back to a prefilled email, so no lead is lost.
 *
 * TODO: lead follow-up workflow (where the lead goes, who gets notified, auto-reply).
 */

const MAX = { message: 4000, name: 200, business: 300, contact: 200, topic: 200 };

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function clean(value, max) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, reason: 'bad-json' }, 400);
  }

  const lead = {
    message: clean(data.message, MAX.message),
    name: clean(data.name, MAX.name),
    business: clean(data.business, MAX.business),
    contact: clean(data.contact, MAX.contact),
    topic: clean(data.topic, MAX.topic),
    page: clean(data.page, 500),
    results: Array.isArray(data.results)
      ? data.results.slice(0, 5).map((r) => ({ tool: clean(r.tool, 100), summary: clean(r.summary, 500), detail: clean(r.detail, 2000) }))
      : [],
    receivedAt: new Date().toISOString(),
    source: 'albright-innovations.com chat panel',
  };

  if (lead.message.length < 3 || lead.name.length < 2 || lead.contact.length < 5) {
    return json({ ok: false, reason: 'missing-fields' }, 400);
  }

  if (!env.LEAD_WEBHOOK) {
    // Not connected yet. The browser shows the email fallback.
    return json({ ok: false, reason: 'not-configured' }, 503);
  }

  try {
    const res = await fetch(env.LEAD_WEBHOOK, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(lead),
    });
    if (!res.ok) {
      return json({ ok: false, reason: 'webhook-' + res.status }, 502);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, reason: 'webhook-unreachable' }, 502);
  }
}

export async function onRequestGet() {
  return json({ ok: true, service: 'lead', method: 'POST' });
}

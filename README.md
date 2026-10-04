# Albright Innovations website

The site at https://albright-innovations.com. Everything you'd ever want to change lives in the `src` folder. A small script turns it into the finished pages.

## The one rule

**Edit files in `src/`, never the finished pages.** `index.html`, the `answers/`, `about/` and `how-we-work/` folders, `sitemap.xml`, `llms.txt` and `llms-full.txt` are all generated. If you edit them by hand, the next build overwrites your change.

## How to change something

1. Open the file in `src/` (see the map below) and make your edit.
2. Rebuild: double-click `build.bat`, or run `py -3 build.py` in a terminal. It takes about a second.
3. Commit and push. Cloudflare publishes the site within a minute.

To look at the site on your own computer before publishing, open the folder's local preview (in Claude Code it's the `site` entry in `.claude/launch.json`). One quirk: every link on the site is a full `https://albright-innovations.com/...` address on purpose, so clicking a link in a local preview jumps to the live site. Type the local address instead, or use the preview link Cloudflare makes for the branch.

If you commit from the command line, the rebuild happens by itself (there's a git hook in `.githooks/`). On a new computer, turn that on once with `git config core.hooksPath .githooks`.

The build also checks the brand rules it can check: no "AI" in visible copy, no sentence starting with "And", and every link a full `https://` address. If one of those slips in, the build stops and tells you where.

## Where things are

| You want to change | Open |
|---|---|
| The homepage (hero, tools, services, clients, about teaser, contact) | `src/home.html` |
| The header, footer or chat panel that appear on every page | `src/layout.html` |
| One of the Answers pages | `src/answers/` (one file per answer) |
| The About page | `src/pages/about.html` |
| The How we work page | `src/pages/how-we-work.html` |
| Business facts: email, Calendly link, Facebook, areas served, service list | `src/site.json` |
| Colors, fonts, spacing | `css/site.css` |
| The calculator math | `js/calc.js` (tests in `tests/calc.html`) |
| How the tools and the chat behave | `js/tools.js`, `js/chat.js` |
| Logos and the portrait | `img/` |
| The share image people see when a link is pasted | run `py -3 make_og.py` after editing the words in it |

## Adding an answer

Copy any file in `src/answers/`, give it the next number, and change the block at the top:

```
<!--meta
title: The question, written the way people ask it
slug: the-address-of-the-page-in-lowercase-with-dashes
description: One or two sentences for search results.
short: The direct answer, one or two sentences. This also shows on the homepage.
updated: 2026-10-04
crumb: Short name for the breadcrumb
cta: Button text (optional)
cta_link: /#time (optional; leave out to open the chat)
-->
```

Write the rest of the file in plain HTML: `<h2>` headings as questions, `<ul>` and `<table>` where they help, a source link at the end. Rebuild, and the page, the homepage card, the sitemap and llms.txt all update together.

## Connecting the chat panel to your inbox

The "Tell us what's going on" panel sends to `/api/lead` (`functions/api/lead.js`). It forwards each message to whatever form service you use, once you give it the address:

1. In the Cloudflare dashboard, open the site under Workers & Pages.
2. Settings, then Environment variables. Add `LEAD_WEBHOOK` with the address your form service gives you (Formspree, Zapier, Make, Basin, a CRM webhook, anything that takes a JSON POST).
3. Redeploy once.

Until then, the panel opens a prefilled email instead, so nothing is lost.

## Brand rules the site follows

- Font: Archivo. Wide for headlines, condensed caps for labels.
- Colors: the tokens at the top of `css/site.css` only. Blue `#2F4BD8`, ink `#15171C`, cream `#F3F0E8`.
- The A and the I in the wordmark are always blue. Tagline: Authentic Influence.
- "We" everywhere except About, which is "I".
- No "AI" in visible copy, no emojis, no guarantees, no competitor names, no jargon. Don't start a sentence with "And".
- Every stat has a source link that works. If a number can't be confirmed, it comes out.
- No invented testimonials or results. Where they'll go later, there's a `TODO` comment in the file.

## Open TODOs

Search the `src/` folder for `TODO`. As of this writing: pricing (no numbers yet), client testimonials and results, the lead follow-up workflow, and three stats we'd like to add once we find a source we can link to.

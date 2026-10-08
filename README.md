# Albright Innovations website

The site at https://albright-innovations.com. Everything you'd ever want to change lives in the `src` folder. A small script turns it into the finished pages.

## Where we left off (October 4, 2026)

The redesign is **in progress on the `redesign` branch**. The live site is still the old one, on `main`. Nothing here is public until `redesign` is merged into `main`.

To look at it: double-click **`preview.bat`** in this folder. Your browser opens the new site at http://localhost:8080. Leave the black window open while you look, and close it when you're done.

Still to do before it goes live:

1. **Polish.** Walk through every section on a phone and a computer and note what to change.
2. **Connect the chat panel to an inbox.** The site is hosted on Cloudflare **Workers** (not Pages), so `functions/api/lead.js` doesn't run there yet. Until it's converted, the panel opens a prefilled email instead, so no message is lost.
3. **Check the Cloudflare build.** GitHub marks the builds for both `main` and `redesign` as failed, though `main` still publishes. Open the build log in Cloudflare and confirm what that red mark means before merging.
4. **Content TODOs** (search `src/` for `TODO`): pricing, testimonials and client results, the CallRail stat, and three pain-point stats still to source.
5. **Make `www.albright-innovations.com` work.** Right now that address doesn't exist at all. In Cloudflare, add `www` to the site and redirect it to `https://albright-innovations.com`.
6. **After it's live:**
   - Confirm https://albright-innovations.com/robots.txt and https://albright-innovations.com/sitemap.xml show the new files, not Cloudflare's stand-in. If Cloudflare's "managed robots.txt" setting is on, it adds its own text to ours; check the result reads sensibly.
   - Set up Google Search Console for the domain, submit `sitemap.xml`, and use "Request indexing" on the homepage and a few Answers pages. Do the same in Bing Webmaster Tools.
   - Run Google's Rich Results Test and a Lighthouse check on the real pages.
   - Earn links from other sites (Google Business Profile, Facebook page, chamber of commerce, local directories, client sites). The domain has none yet, which is why its "Domain Rating" is 0.

## The one rule

**Edit files in `src/`, never the finished pages.** `index.html`, the `answers/`, `about/` and `how-we-work/` folders, `sitemap.xml`, `llms.txt` and `llms-full.txt` are all generated. If you edit them by hand, the next build overwrites your change.

## How to change something

1. Open the file in `src/` (see the map below) and make your edit.
2. Rebuild: double-click `build.bat`, or run `py -3 build.py` in a terminal. It takes about a second.
3. Commit and push. Cloudflare publishes the site within a minute.

To look at the site on your own computer before publishing, double-click `preview.bat`. Every link on the site is a full `https://albright-innovations.com/...` address on purpose; during a preview on your computer, a few lines in `js/tools.js` keep those links on the local copy instead.

If you commit from the command line, the rebuild happens by itself (there's a git hook in `.githooks/`). On a new computer, turn that on once with `git config core.hooksPath .githooks`.

The build also checks the brand rules it can check: no "AI" in visible copy, no sentence starting with "And", and every link a full `https://` address. If one of those slips in, the build stops and tells you where.

## Where things are

| You want to change | Open |
|---|---|
| The homepage (hero, tools, services, clients, about teaser, contact) | `src/home.html` |
| The header, footer or chat panel that appear on every page | `src/layout.html` |
| One of the Answers pages | `src/answers/` (one file per answer) |
| Which answers show on the homepage | add `home: yes` to the top of that answer's file (the rest are on the Answers page) |
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
home: yes (optional; shows this answer on the homepage. Keep it to about four.)
-->
```

Write the rest of the file in plain HTML: `<h2>` headings as questions, `<ul>` and `<table>` where they help, a source link at the end. Rebuild, and the page, the homepage card, the sitemap and llms.txt all update together.

## Connecting the chat panel to your inbox

**Not working yet.** The "Tell us what's going on" panel sends to `/api/lead`. The code for that address (`functions/api/lead.js`) was written for Cloudflare Pages, but this site runs on Cloudflare Workers, which doesn't use that folder. It needs converting to a small Worker script before it can forward messages to a form service (Formspree, Zapier, Make, Basin, a CRM webhook, anything that takes a JSON POST) through a `LEAD_WEBHOOK` setting.

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

# Albright Innovations website

The site at https://albright-innovations.com. Everything you'd ever want to change lives in the `src` folder. A small script turns it into the finished pages.

## Where we left off (October 15, 2026)

The redesign is **in progress on the `redesign` branch**. The live site is still the old one, on `main`. Nothing here is public until `redesign` is merged into `main`.

To look at it: double-click **`preview.bat`** in this folder. Your browser opens the new site at http://localhost:8080. Leave the black window open while you look, and close it when you're done.

**What's done so far**

- October 4: the redesign itself. Homepage with the three tools (time calculator, missed-call calculator, operations checkup), the Answers pages, About, How we work, the chat panel, the share images, and the build script with its brand checks.
- October 8: a phone menu, a much shorter phone homepage, an Answers page (the homepage shows the four marked `home: yes`), a shorter About on the homepage, the portrait and calculator-total fixes, the checkup always including a marketing fix when there's a marketing gap, and broader operations wording everywhere.
- October 11: a **What we do** page (`/what-we-do/`) with every service, what you get and who it fits, split into the two sides of the business. It's in the menu and the footer.
- October 13: three **landing pages for Facebook ads**, each with one job and no menu: `/free-website/`, `/operations/` and `/contractors/`, each with a thank-you page. A shared lead form with hidden tracking fields so you can tell ad A from ad B, a Meta Pixel slot, a video slot, a booking-link slot, share images, and a "Landing pages for ads" section further down this file. Committed later that day, and the main site was brought into line with them: the assistant and Google Business Profile are on the What we do page and the homepage services list. (October 14: the free-website mentions came back off the main site; see the copy rules.)
- October 14: the free website came off the main site (ads only) and the landing pages were hidden from search. The homepage was trimmed to opener, one combined calculator card, Sound familiar (six lines), What we do, clients, How we start, About and contact. The opener has an animation of the 24/7 assistant: the customer's phone, then the lead arriving on the owner's phone. Service-area wording came off the main site (we work anywhere), and the bio was corrected: Josh grew up around entrepreneurs, not in Big Rapids.
- October 15: Josh's proofreading pass. One name for the free session (operations check; the old answer address redirects), contradictions fixed, service area back in a softer form (based in Big Rapids and the Charlotte area, working anywhere in the U.S.), long sentences split, calculator sliders capped at 20 hours with a note over 60, periwinkle gone (dark mode now uses the brand blue for fills and Cream for text), and answer pages' browser titles end in "| Albright Innovations". A 3D homepage opener was tried the same day and taken back out; it's in the saved history if ever wanted.
- **Next up: pick a homepage opener.** Twenty directions are sketched on one page at `tests/hero-options.html` (open the preview, then go to http://localhost:8000/tests/hero-options.html). Josh picks one or a mix, then it gets built into the real homepage with the entrance motion and the phone demo. The current opener stays until then.

**Copy rules that came out of the work**

- Stay broad about operations. Describe finding and fixing each business's bottlenecks after talking with the owner, never specific features (phone quoting, automatic texts, online booking, pay links). There are no technology partners yet, and every business needs something different.
- The 24/7 assistant is a real offer (website chat, and the phone line when a call isn't answered), so it can be described. Every other operations promise stays broad.
- No prices anywhere. Pricing isn't set.
- No giveaways on the main site. The free website is an ad offer and lives only on the landing pages. The main site stays professional: what we do, nothing free.

**Still to do before it goes live**

1. **Keep polishing.** Review on a phone and a computer, especially the landing pages, which are new.
2. **Rebuild the landing pages short.** Josh reviewed them on October 13: far too long, about eleven phone screens, and weak. Target about four phone screens each: the hook line from the ad with the form right under it (five fields), the catch in three lines, photo and client logos as proof, three questions, the form again. Cut the rest; it all lives on the main site. Operations keeps the calculator, contractors keeps the example conversation. Then finish them: in `src/site.json` under `landing`: connect the form (`lead_endpoint`, see below), paste the Pixel ID, add the video link and the booking link. Confirm the "within two business days" promise on the thank-you pages. Approve the contractor page copy, which is a draft (every section is marked `TODO DRAFT COPY`).
3. **Connect the chat panel to an inbox.** The site is hosted on Cloudflare **Workers** (not Pages), so `functions/api/lead.js` doesn't run there yet. Until it's converted, the panel opens a prefilled email instead, so no message is lost. Once the landing-page form is connected, the same service can take the chat panel too.
4. **Check the Cloudflare build.** GitHub marks the builds for both `main` and `redesign` as failed, though `main` still publishes. Open the build log in Cloudflare and confirm what that red mark means before merging.
5. **Content TODOs** (search `src/` for `TODO`): pricing, testimonials and client results, the CallRail stat, three pain-point stats still to source, and the landing-page items above.
6. **Make `www.albright-innovations.com` work.** Right now that address doesn't exist at all. In Cloudflare, add `www` to the site and redirect it to `https://albright-innovations.com`.
7. **Merge `redesign` into `main`** once the above is done. Cloudflare publishes within a minute.
8. **After it's live:**
   - Confirm https://albright-innovations.com/robots.txt and https://albright-innovations.com/sitemap.xml show the new files, not Cloudflare's stand-in. If Cloudflare's "managed robots.txt" setting is on, it adds its own text to ours; check the result reads sensibly.
   - Set up Google Search Console for the domain, submit `sitemap.xml`, and use "Request indexing" on the homepage, the What we do page and a few Answers pages. Do the same in Bing Webmaster Tools.
   - Run Google's Rich Results Test and a Lighthouse check on the real pages, including the three landing pages.
   - Earn links from other sites (Google Business Profile, Facebook page, chamber of commerce, local directories, client sites). The domain has none yet, which is why its "Domain Rating" is 0.
   - Give each Facebook ad its own landing-page link with tracking values (see "Landing pages for ads").

## Approved facts about Josh

Use these and nothing more, and don't name the former employer.

- Grew up around entrepreneurs. The family's rental business in Big Rapids, Michigan is in its third generation, and his mother ran a business of her own. He moved away from Big Rapids at eight and visited often, so never say he grew up in Big Rapids or in the family business.
- Marketing degree, University of North Carolina at Charlotte, 2006.
- Worked in the restaurant business through the financial crisis.
- Twelve years at one company, from a startup to over $10 million a year, moving from sales to marketing to contracts to Director of Operations. Built its contracts department from the ground up and ran it; built the full customer workflow from first call to final follow-up; worked alongside accounting.
- Started Albright Innovations in 2025. Based in Big Rapids, Michigan and Waxhaw, North Carolina. Does the work himself and keeps the client list small.

## The one rule

**Edit files in `src/`, never the finished pages.** `index.html`, the `answers/`, `about/`, `how-we-work/`, `what-we-do/`, `free-website/`, `operations/` and `contractors/` folders, `sitemap.xml`, `llms.txt` and `llms-full.txt` are all generated. If you edit them by hand, the next build overwrites your change.

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
| The homepage (opener, the two calculators, sound familiar, services, clients, how we start, about, contact) | `src/home.html` |
| The header, footer or chat panel that appear on every page | `src/layout.html` |
| One of the Answers pages | `src/answers/` (one file per answer) |
| The About page | `src/pages/about.html` |
| The How we work page | `src/pages/how-we-work.html` |
| The What we do page | `src/pages/what-we-do.html` |
| The 24/7 assistant setup guide (hidden, not linked, not indexed) | `src/pages/assistant-guide.html`, at `/help/assistant/`. Marked `robots: noindex` in its meta block, so the build keeps it out of the sitemap and `llms-full.txt`. |
| A landing page or its thank-you page | `src/landing/` (one file per page) |
| The lead form on the landing pages | `src/form.html` (fields), the top of each page's file (heading, button, offer name) |
| The landing-page settings: form endpoint, Pixel ID, video, booking link | `src/site.json`, under `landing` |
| Business facts: email, Calendly link, Facebook, areas served, service list | `src/site.json` |
| Colors, fonts, spacing | `css/site.css` |
| The calculator math | `js/calc.js` (tests in `tests/calc.html`) |
| How the tools and the chat behave | `js/tools.js`, `js/chat.js` |
| How the landing-page form behaves | `js/lead.js` |
| Logos and the portrait | `img/` |
| The share images people see when a link is pasted | run `py -3 make_og.py` after editing the words in it (one image per page, plus the video poster) |

## Adding an answer

Copy any file in `src/answers/`, give it the next number, and change the block at the top:

```
<!--meta
title: The question, written the way people ask it
slug: the-address-of-the-page-in-lowercase-with-dashes
description: One or two sentences for search results.
short: The direct answer, one or two sentences. This also shows on the Answers page.
updated: 2026-10-04
crumb: Short name for the breadcrumb
cta: Button text (optional)
cta_link: /#time (optional; leave out to open the chat)
browser_title: Short question | Albright Innovations (optional; the browser tab and share title, 65 characters or fewer)
-->
```

Write the rest of the file in plain HTML: `<h2>` headings as questions, `<ul>` and `<table>` where they help, a source link at the end. Rebuild, and the page, the homepage card, the sitemap and llms.txt all update together.

## If a page's address changes

Add a line to `_redirects` so the old address still works: `old-address new-address 301`. Cloudflare reads that file.

## Landing pages for ads

Three pages built for Facebook ads, each with one job and no menu: **`/free-website`** (the free website rebuild), **`/operations`** (start a conversation about how the business runs) and **`/contractors`** (the 24/7 assistant, still a draft). Each has a thank-you page at `/.../thanks/`. They're for ad traffic only: not in the menu, not in the sitemap, and marked so search engines skip them.

Where the words live: `src/landing/`. Shared pieces: `src/landing.html` (the layout) and `src/form.html` (the form). The settings below are in `src/site.json` under `"landing"`. After changing any of them, run the build.

**Connect the form (`lead_endpoint`).** Until this is set, the form opens the visitor's email program with everything typed in, so nothing is lost. The simplest option is [Web3Forms](https://web3forms.com/): enter your email on their site, they send you an access key, paste the key into `lead_access_key` and set `lead_endpoint` to `https://api.web3forms.com/submit`. Every lead arrives as an email with all the fields, including which ad it came from. Free up to about 250 a month at the time of writing. Formspree works the same way with its form address and no key (free up to about 50 a month). A Google Apps Script that writes to a Sheet also works: set `lead_endpoint` to the script's web-app address and leave the key blank.

**Tell which ad a lead came from.** Give each ad its own link, for example `https://albright-innovations.com/free-website/?utm_source=facebook&utm_medium=paid&utm_campaign=free-website&utm_content=ad-a` (and `ad-b` for the other one). Those values ride along with every lead, together with the page address.

**Meta Pixel (`meta_pixel_id`).** Paste your Pixel ID. The base code goes on every landing page, and the thank-you pages fire a "Lead" event. With the ID blank, nothing is loaded.

**The video (`free_website_video`).** A YouTube link (unlisted is fine) or the path to an MP4 in this folder. Until it's set, the poster image shows.

**The booking link (`booking_url`).** Your Cal.com or Calendly link. It appears as a button on the contractors thank-you page. Until it's set, that page says we'll email a time.

Share images for the three pages come from `py -3 make_og.py free-website.png operations.png contractors.png`. The video poster is `py -3 make_og.py poster`.

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

Search the `src/` folder for `TODO`. As of this writing: pricing (no numbers yet), client testimonials and results, the lead follow-up workflow, three stats we'd like to add once we find a source we can link to, the landing-page settings (form endpoint, Pixel ID, video, booking link), the two-business-day promise on the thank-you pages, the landing-page photo of Josh, and the contractor page copy, which is a draft.

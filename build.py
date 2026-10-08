#!/usr/bin/env python3
"""
Builds the Albright Innovations website from the files in the src/ folder.

    How to run:   py -3 build.py        (or: python build.py)

What it does:
  - wraps every page in src/layout.html (the shared header, footer and chat panel)
  - writes index.html, about/, how-we-work/, the answers/ list page and one folder per answer under answers/
  - builds the "Answers" section on the homepage from the same answer files
  - writes sitemap.xml, llms.txt and llms-full.txt
  - checks the copy for the brand rules (no "AI", no sentence starting with "And",
    every link a full https:// address) and stops with a clear message if one breaks

It uses only what comes with Python. Nothing to install.
"""
import datetime
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE = json.loads((SRC / "site.json").read_text("utf-8"))
BASE = SITE["url"].rstrip("/")
TODAY = datetime.date.today().isoformat()
DEFAULT_OG = "/og/share.png"

problems = []


# ---------- small helpers ----------

def read(path):
    return Path(path).read_text("utf-8")


def write(rel, text):
    out = ROOT / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text, "utf-8", newline="\n")
    print("  wrote", rel)


def split_meta(text, where):
    """Each source page starts with a <!--meta ... --> block of key: value lines."""
    m = re.match(r"\s*<!--meta\s*(.*?)-->\s*(.*)$", text, re.S)
    if not m:
        sys.exit(f"{where}: missing the <!--meta ... --> block at the top")
    meta = {}
    for line in m.group(1).strip().splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip()
    for key in ("title", "description", "updated"):
        if key not in meta:
            sys.exit(f"{where}: the meta block needs a '{key}:' line")
    return meta, m.group(2)


def fill(template, **values):
    for k, v in values.items():
        template = template.replace("{{" + k + "}}", v)
    left = sorted(set(re.findall(r"{{(\w+)}}", template)))
    if left:
        sys.exit(f"unfilled placeholders: {left}")
    return template


# Stylesheets, scripts, icons and the manifest stay site-relative (so previews work anywhere);
# every other link becomes a full https:// address.
ASSET = r"(?:css/|js/|og/|img/|favicon|apple-touch-icon|site\.webmanifest|icon-)"


def absolutize(h):
    """Root-relative page links (href="/answers/...") become full https:// addresses."""
    return re.sub(r'href="/(?!/|' + ASSET + ")", f'href="{BASE}/', h)


def pretty_date(iso):
    d = datetime.date.fromisoformat(iso)
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def esc(s):
    return html.escape(s, quote=True)


def visible_text(h):
    """Text a reader sees: no scripts, styles, comments or tags."""
    h = re.sub(r"<(script|style)\b.*?</\1>", " ", h, flags=re.S | re.I)
    h = re.sub(r"<!--.*?-->", " ", h, flags=re.S)
    h = re.sub(r"<[^>]+>", " ", h)
    return html.unescape(re.sub(r"\s+", " ", h))


def check_copy(h, where):
    """The brand rules that a build can catch."""
    text = visible_text(h)
    for m in re.finditer(r"\bAI\b", text):
        problems.append(f'{where}: the word "AI" appears in visible copy: ...{text[max(0, m.start()-40):m.end()+40]}...')
    for m in re.finditer(r"(?:^|[.!?]\s+)(And\b)", text):
        problems.append(f'{where}: a sentence starts with "And": ...{text[m.start():m.start()+70]}...')
    for m in re.finditer(r'href="([^"]*)"', h):
        href = m.group(1)
        ok = href.startswith("https://") or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:") or re.match("/" + ASSET, href)
        if not ok:
            problems.append(f"{where}: link is not a full https:// address: {href}")


def to_text(h):
    """A plain-text, Markdown-flavored copy of an HTML fragment (for llms-full.txt)."""
    h = re.sub(r"<!--.*?-->", "", h, flags=re.S)
    h = re.sub(r"<h2[^>]*>", "\n\n## ", h)
    h = re.sub(r"<h3[^>]*>", "\n\n### ", h)
    h = re.sub(r"</h[1-6]>", "\n", h)
    h = re.sub(r"<li[^>]*>", "\n- ", h)
    h = re.sub(r"<(p|div|section|article|tr|ul|ol|table)[^>]*>", "\n", h)
    h = re.sub(r"</(td|th)>", " | ", h)
    h = re.sub(r"</tr>", "\n", h)
    h = re.sub(r'<a [^>]*href="([^"]+)"[^>]*>(.*?)</a>', lambda m: f"{m.group(2)} ({m.group(1)})", h, flags=re.S)
    h = re.sub(r"<[^>]+>", "", h)
    h = html.unescape(h)
    h = re.sub(r"[ \t]+", " ", h)
    h = re.sub(r" *\n *", "\n", h)
    h = re.sub(r"\n{3,}", "\n\n", h)
    return h.strip()


# ---------- structured data (JSON-LD) ----------

def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, indent=1) + "</script>"


def ld_business():
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": BASE + "/#organization",
                "name": SITE["name"],
                "url": BASE + "/",
                "logo": BASE + "/icon-512.png",
                "slogan": SITE["tagline"],
                "email": SITE["email"],
                "founder": {"@type": "Person", "name": SITE["founder"], "url": BASE + "/about/"},
                "foundingDate": SITE["founded"],
                "sameAs": [SITE["facebook"]],
            },
            {
                "@type": "ProfessionalService",
                "@id": BASE + "/#service",
                "name": SITE["name"],
                "url": BASE + "/",
                "image": BASE + "/og/share.png",
                "description": SITE["summary"],
                "email": SITE["email"],
                "parentOrganization": {"@id": BASE + "/#organization"},
                "areaServed": [{"@type": "Place", "name": a["name"]} for a in SITE["areas"]] + [{"@type": "Country", "name": "United States"}],
                "serviceType": [s["name"] for s in SITE["services"]],
                "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Services",
                    "itemListElement": [
                        {"@type": "Offer", "itemOffered": {"@type": "Service", "name": s["name"], "description": s["desc"], "url": BASE + s["url"]}}
                        for s in SITE["services"]
                    ],
                },
            },
        ],
    }


def ld_faq(items):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a, "url": url}}
            for q, a, url in items
        ],
    }


def ld_webapp(tool):
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": tool["name"],
        "url": BASE + tool["url"],
        "description": tool["desc"],
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript",
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "provider": {"@id": BASE + "/#organization"},
    }


def ld_breadcrumb(trail):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": BASE + path}
            for i, (name, path) in enumerate(trail)
        ],
    }


def ld_article(meta, path):
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": meta["title"],
        "description": meta["description"],
        "url": BASE + path,
        "dateModified": meta["updated"],
        "author": {"@type": "Person", "name": SITE["founder"], "url": BASE + "/about/"},
        "publisher": {"@id": BASE + "/#organization"},
        "mainEntityOfPage": BASE + path,
    }


# ---------- building pages ----------

layout = read(SRC / "layout.html")
answer_tpl = read(SRC / "answer.html")


def asset_version(rel):
    """A short fingerprint of a file's contents, so browsers fetch the new copy after a change."""
    import hashlib
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]


ASSETS = {rel: asset_version(rel) for rel in ("css/site.css", "js/calc.js", "js/tools.js", "js/chat.js")}


def version_assets(h):
    for rel, v in ASSETS.items():
        h = h.replace(f'"/{rel}"', f'"/{rel}?v={v}"')
    return h


def page(path, meta, body, extra_ld, page_name):
    canonical = BASE + path
    ldjson = ld(ld_business()) + "\n" + "\n".join(ld(x) for x in extra_ld)
    out = fill(
        layout,
        title=esc(meta["title"]),
        description=esc(meta["description"]),
        canonical=canonical,
        og_image=BASE + meta.get("og", DEFAULT_OG),
        jsonld=ldjson,
        body=body,
        page=page_name,
        year=str(datetime.date.today().year),
        site_name=SITE["name"],
        email=SITE["email"],
        calendly=SITE["calendly"],
        facebook=SITE["facebook"],
    )
    out = absolutize(version_assets(out))
    check_copy(out, path)
    return out


def main():
    print("Building the site from src/ ...")
    pages_for_sitemap = []
    llms_sections = []

    # --- answers ---
    answers = []
    for f in sorted((SRC / "answers").glob("*.html")):
        meta, body = split_meta(read(f), f.name)
        for key in ("slug", "short"):
            if key not in meta:
                sys.exit(f"{f.name}: the meta block needs a '{key}:' line")
        answers.append((meta, body, f.name))
    slugs = {m["slug"] for m, _, _ in answers}

    answer_links = "".join(
        f'<li><a href="/answers/{m["slug"]}/">{esc(m["title"])}</a></li>' for m, _, _ in answers
    )
    for meta, body, name in answers:
        path = f"/answers/{meta['slug']}/"
        others = "".join(
            f'<li><a href="/answers/{m["slug"]}/">{esc(m["title"])}</a></li>' for m, _, _ in answers if m["slug"] != meta["slug"]
        )
        meta.setdefault("og", "/og/answers.png")
        cta_text = meta.get("cta", "Talk through this with us")
        cta_link = meta.get("cta_link", "chat")
        if cta_link == "chat":
            cta_html = f'<button class="btn primary" type="button" data-chat-open data-topic="{esc(meta["title"])}">{esc(cta_text)} <span class="arrow" aria-hidden="true">&rarr;</span></button>'
        else:
            cta_html = f'<a class="btn primary" href="{esc(cta_link)}">{esc(cta_text)} <span class="arrow" aria-hidden="true">&rarr;</span></a>'
        article = fill(
            answer_tpl,
            title=esc(meta["title"]),
            short=meta["short"],
            body=body,
            updated=pretty_date(meta["updated"]),
            updated_iso=meta["updated"],
            cta=cta_html,
            others=others,
            crumb=esc(meta.get("crumb", meta["title"])),
        )
        extra = [
            ld_faq([(meta["title"], visible_text(meta["short"]), BASE + path)]),
            ld_breadcrumb([("Home", "/"), ("Answers", "/answers/"), (meta["title"], path)]),
            ld_article(meta, path),
        ]
        write(path.strip("/") + "/index.html", page(path, meta, article, extra, "answer"))
        pages_for_sitemap.append((path, meta["updated"]))
        llms_sections.append((meta["title"], path, meta["short"], body))

    # --- the Answers page: every answer, short version, one list ---
    def qa_items(items):
        return "".join(
            f'<li class="qa"><h3><a href="/answers/{m["slug"]}/">{esc(m["title"])}</a></h3>'
            f'<p>{m["short"]}</p>'
            f'<a class="more" href="/answers/{m["slug"]}/">Read the full answer <span class="arrow" aria-hidden="true">&rarr;</span></a></li>'
            for m, _, _ in items
        )

    index_meta = {
        "title": "Answers | Albright Innovations",
        "description": "Straight answers to the questions small business owners ask about missed calls, follow-up, customer lists, social media, ads, websites and what it costs to work with us.",
    }
    index_body = (
        '<article class="page">\n  <div class="wrap">\n    <div>\n'
        '      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <span aria-current="page">Answers</span></nav>\n'
        '      <div class="head">\n        <p class="label">Answers</p>\n'
        '        <h1>Questions owners ask us, answered straight.</h1>\n'
        '        <p class="lead">Short answers here. Each one opens to a full page with the sources.</p>\n'
        '      </div>\n    </div>\n'
        f'    <ul class="qa-grid">{qa_items(answers)}</ul>\n'
        '  </div>\n</article>\n'
    )
    index_extra = [
        ld_faq([(m["title"], visible_text(m["short"]), f'{BASE}/answers/{m["slug"]}/') for m, _, _ in answers]),
        ld_breadcrumb([("Home", "/"), ("Answers", "/answers/")]),
    ]
    write("answers/index.html", page("/answers/", index_meta, index_body, index_extra, "answers"))
    pages_for_sitemap.append(("/answers/", max(m["updated"] for m, _, _ in answers)))

    # --- standalone pages (about, how we work) ---
    for f in sorted((SRC / "pages").glob("*.html")):
        meta, body = split_meta(read(f), f.name)
        if "path" not in meta:
            sys.exit(f"{f.name}: the meta block needs a 'path:' line, like  path: /about/")
        path = meta["path"]
        extra = [ld_breadcrumb([("Home", "/"), (meta.get("crumb", meta["title"]), path)])]
        if meta.get("person") == "yes":
            extra.append({
                "@context": "https://schema.org",
                "@type": "Person",
                "@id": BASE + "/about/#person",
                "name": SITE["founder"],
                "jobTitle": "Founder",
                "worksFor": {"@id": BASE + "/#organization"},
                "alumniOf": {"@type": "CollegeOrUniversity", "name": "University of North Carolina at Charlotte"},
                "url": BASE + path,
                "sameAs": [SITE["facebook"]],
            })
        write(path.strip("/") + "/index.html", page(path, meta, body, extra, path.strip("/")))
        pages_for_sitemap.append((path, meta["updated"]))

    # --- homepage ---
    meta, body = split_meta(read(SRC / "home.html"), "home.html")
    # The homepage shows only the answers marked "home: yes"; the rest are one tap away on /answers/.
    featured = [a for a in answers if a[0].get("home") == "yes"] or answers[:4]
    body = fill(body, answers=qa_items(featured))
    extra = [ld_faq([(m["title"], visible_text(m["short"]), f'{BASE}/answers/{m["slug"]}/') for m, _, _ in featured])]
    extra += [ld_webapp(t) for t in SITE["tools"]]
    write("index.html", page("/", meta, body, extra, "home"))
    home_updated = max([meta["updated"]] + [u for _, u in pages_for_sitemap])
    pages_for_sitemap.insert(0, ("/", home_updated))

    # --- links to answer pages must point at real answers ---
    for rel in ["index.html"] + [p.strip("/") + "/index.html" for p, _ in pages_for_sitemap[1:]]:
        for m in re.finditer(re.escape(BASE) + r"/answers/([a-z0-9-]+)/", read(ROOT / rel)):
            if m.group(1) not in slugs:
                problems.append(f"{rel}: links to an answer that does not exist: {m.group(1)}")

    # --- sitemap ---
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, updated in pages_for_sitemap:
        sm.append(f"  <url><loc>{BASE}{path}</loc><lastmod>{updated}</lastmod></url>")
    sm.append("</urlset>")
    write("sitemap.xml", "\n".join(sm) + "\n")

    # --- llms.txt and llms-full.txt ---
    lines = [f"# {SITE['name']}", "", f"> {SITE['summary']}", "",
             f"Tagline: {SITE['tagline']}. Founder: {SITE['founder']}. Email: {SITE['email']}. Website: {BASE}/", ""]
    lines += ["## Services", ""] + [f"- [{s['name']}]({BASE}{s['url']}): {s['desc']}" for s in SITE["services"]] + [""]
    lines += ["## Free tools", ""] + [f"- [{t['name']}]({BASE}{t['url']}): {t['desc']}" for t in SITE["tools"]] + [""]
    lines += ["## Answers to common questions", ""] + [f"- [{t}]({BASE}{p}): {visible_text(s)}" for t, p, s, _ in llms_sections] + [""]
    lines += ["## About", "", f"- [About {SITE['founder']}]({BASE}/about/): Who runs Albright Innovations and the experience behind it.",
              f"- [How we work]({BASE}/how-we-work/): What an operations review involves and how a project runs.", ""]
    write("llms.txt", "\n".join(lines))

    full = lines + ["", "---", "", "# Full text of the answers", ""]
    for t, p, s, b in llms_sections:
        full += [f"## {t}", "", f"Source: {BASE}{p}", "", visible_text(s), "", to_text(b), ""]
    for f in sorted((SRC / "pages").glob("*.html")):
        m, b = split_meta(read(f), f.name)
        full += [f"## {m['title']}", "", f"Source: {BASE}{m['path']}", "", to_text(b), ""]
    write("llms-full.txt", "\n".join(full))

    if problems:
        print("\nThe build finished, but these need fixing before publishing:")
        for p in problems:
            print("  -", p)
        sys.exit(1)
    print(f"\nDone. {len(pages_for_sitemap)} pages.")


if __name__ == "__main__":
    main()

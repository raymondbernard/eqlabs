// Minimal + AAA SEO checks over HTML files
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();
const CANONICAL_HOST = 'https://eqlabs.ai';

const REQUIRED_HEAD = [
  'meta[name="description"]',
  'link[rel="canonical"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:type"]',
  'meta[property="og:image"]',
  'meta[name="twitter:card"]'
];

// Investor-centric checks per page
const PAGE_RULES = {
  'index.html': {
    requireJsonLd: ['Organization'],
  },
  'founders-circle.html': {
    requireJsonLd: ['NewsArticle'],
  },
  '404.html': {
    requireNoIndex: true,
  }
};

function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  return cheerio.load(html);
}

function isAbsoluteUrl(u) {
  return typeof u === 'string' && /^https?:\/\//.test(u);
}

function hasHost(u, host) {
  try {
    const url = new URL(u);
    return `${url.protocol}//${url.host}`.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function isNoindex($) {
  const robots = $('meta[name="robots"]').attr('content');
  return robots && robots.toLowerCase().includes('noindex');
}

function hasJsonLd($) {
  return $('script[type="application/ld+json"]').length > 0;
}

function check(file) {
  const $ = load(file);
  const errs = [];

  // Skip hard 404 if present
  const titleRaw = $('title').text().trim();
  const title = titleRaw.toLowerCase();
  const is404 = title.includes('404');

  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const base = rel.split('/').pop();
  const isCritical = rel === 'index.html' || rel === 'founders-circle.html';

  if (isCritical && !is404) {
    for (const sel of REQUIRED_HEAD) {
      if (!$(sel).length) errs.push(`Missing head tag: ${sel}`);
    }

    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) errs.push('Missing canonical href');
    if (canonical && !/^https?:\/\//.test(canonical)) {
      errs.push('Canonical should be absolute URL');
    }
    if (canonical && isAbsoluteUrl(canonical) && !hasHost(canonical, CANONICAL_HOST)) {
      errs.push(`Canonical host must be ${CANONICAL_HOST}`);
    }
  }

  // AAA checks for root-level, non-404 pages (avoid nested blog paths by default)
  const isRootLevel = rel === base;
  if (!is404 && isRootLevel && !isNoindex($)) {
    // Title length (recommended ~15-70)
    if (!titleRaw) errs.push('Missing <title>');
    if (titleRaw && (titleRaw.length < 15 || titleRaw.length > 70)) {
      errs.push(`Title length should be 15-70 chars (got ${titleRaw.length})`);
    }

    // Meta description length (recommended ~70-160)
    const desc = $('meta[name="description"]').attr('content') || '';
    if (!desc) errs.push('Missing meta description');
    if (desc && (desc.length < 70 || desc.length > 160)) {
      errs.push(`Description length should be 70-160 chars (got ${desc.length})`);
    }

    // Exactly one H1
    const h1Count = $('h1').length;
    if (h1Count === 0) errs.push('Missing <h1>');
    if (h1Count > 1) errs.push('Multiple <h1> tags found');

    // All images need alt (unless decorative)
    $('img').each((_, el) => {
      const $el = $(el);
      const ariaHidden = ($el.attr('aria-hidden') || '').toLowerCase() === 'true';
      const role = ($el.attr('role') || '').toLowerCase();
      if (!ariaHidden && role !== 'presentation') {
        const alt = ($el.attr('alt') || '').trim();
        if (!alt) errs.push('Image missing alt attribute');
      }
    });

    // Open Graph image must be absolute and on canonical host
    const ogImg = $('meta[property="og:image"]').attr('content');
    if (!ogImg) errs.push('Missing og:image');
    if (ogImg && !isAbsoluteUrl(ogImg)) errs.push('og:image should be absolute URL');
    if (ogImg && isAbsoluteUrl(ogImg) && !hasHost(ogImg, CANONICAL_HOST)) {
      errs.push(`og:image host must be ${CANONICAL_HOST}`);
    }

    // JSON-LD parse validation
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text().trim();
      try { JSON.parse(raw); } catch (e) {
        errs.push('Invalid JSON-LD: ' + (e && e.message ? e.message : 'parse error'));
      }
    });
  }

  // Page-specific investor/SEO rules
  // Apply page-specific rules only when matching the exact relative path or
  // a base filename that sits at the repo root (avoid matching blog/index.html)
  let rules = PAGE_RULES[rel];
  if (!rules && rel === base) {
    rules = PAGE_RULES[base];
  }
  if (rules) {
    if (rules.requireNoIndex && !isNoindex($)) {
      errs.push('Should include meta robots noindex');
    }
    if (rules.requireJsonLd && rules.requireJsonLd.length) {
      const jsonlds = $('script[type="application/ld+json"]').toArray().map(el => {
        try { return JSON.parse($(el).contents().text().trim()); } catch { return null; }
      }).filter(Boolean);
      const types = new Set();
      for (const obj of jsonlds) {
        const collect = (node) => {
          if (node && typeof node === 'object') {
            if (node['@type']) types.add(Array.isArray(node['@type']) ? node['@type'].join('|') : node['@type']);
            for (const k of Object.keys(node)) collect(node[k]);
          }
        };
        collect(obj);
      }
      for (const need of rules.requireJsonLd) {
        let found = false;
        for (const t of Array.from(types)) {
          if (t.includes(need)) { found = true; break; }
        }
        if (!found) errs.push(`Missing JSON-LD type: ${need}`);
      }
    }
  }

  // 404 should be noindex
  if (is404 && !isNoindex($)) errs.push('404 should include meta robots noindex');

  return errs;
}

(async () => {
  const entries = await fg(['**/*.html'], {
    cwd: ROOT,
    dot: false,
    ignore: ['**/node_modules/**']
  });

  let failed = 0;
  for (const rel of entries) {
    const file = path.join(ROOT, rel);
    const errs = check(file);
    if (errs.length) {
      failed++;
      console.log(`\n[SEO] ${rel}`);
      for (const e of errs) console.log(' - ' + e);
    }
  }

  if (failed) {
    console.error(`\nSEO checks failed on ${failed} file(s).`);
    process.exit(1);
  } else {
    console.log('All SEO checks passed.');
  }
})();



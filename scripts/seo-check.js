// Minimal SEO checks over all HTML files in the repo root
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

const REQUIRED_HEAD = [
  'meta[name="description"]',
  'link[rel="canonical"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:type"]',
  'meta[property="og:image"]',
  'meta[name="twitter:card"]'
];

function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  return cheerio.load(html);
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
  const title = $('title').text().trim().toLowerCase();
  const is404 = title.includes('404');

  for (const sel of REQUIRED_HEAD) {
    if (!$(sel).length && !is404) errs.push(`Missing head tag: ${sel}`);
  }

  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical && !is404) errs.push('Missing canonical href');
  if (canonical && !/^https?:\/\//.test(canonical)) {
    errs.push('Canonical should be absolute URL');
  }

  if (!hasJsonLd($) && !is404) errs.push('Missing JSON-LD');

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



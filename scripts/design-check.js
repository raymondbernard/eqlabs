// Enforce presence of site-wide theme stylesheet on all HTML pages
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  return cheerio.load(html);
}

function hasThemeLink($) {
  const links = $('head link[rel="stylesheet"]').toArray();
  for (const el of links) {
    const href = (el.attribs && el.attribs.href) || '';
    if (!href) continue;
    // Accept /assets/theme.css or /assets/theme.css?v=...
    const normalized = href.split('?')[0];
    if (normalized === '/assets/theme.css' || normalized === 'assets/theme.css') {
      return true;
    }
  }
  return false;
}

(async () => {
  const entries = await fg(['**/*.html'], { cwd: ROOT, dot: false, ignore: ['**/node_modules/**'] });
  let failures = 0;

  for (const rel of entries) {
    const file = path.join(ROOT, rel);
    const $ = load(file);

    const errs = [];
    if (!hasThemeLink($)) errs.push('Missing <link rel="stylesheet" href="/assets/theme.css">');

    if (errs.length) {
      failures++;
      console.log(`\n[DESIGN] ${rel}`);
      for (const e of errs) console.log(' - ' + e);
    }
  }

  if (failures) {
    console.error(`\nDesign checks failed on ${failures} file(s).`);
    process.exit(1);
  } else {
    console.log('All design checks passed.');
  }
})();




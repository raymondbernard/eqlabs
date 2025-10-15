// Automatically injects a site-wide theme stylesheet link into HTML files
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, html) { fs.writeFileSync(file, html, 'utf8'); }

function ensureThemeLink($) {
  const has = $('head link[rel="stylesheet"]').toArray().some(el => {
    const href = (el.attribs && el.attribs.href) || '';
    return href.split('?')[0] === '/assets/theme.css' || href.split('?')[0] === 'assets/theme.css';
  });
  if (has) return false;
  const link = '<link rel="stylesheet" href="/assets/theme.css">';
  const head = $('head');
  if (head.length) {
    // Insert after Tailwind if present, else append to head
    const tailwind = head.find('script[src*="tailwindcss"]').last();
    if (tailwind.length) {
      tailwind.after('\n  ' + link);
    } else {
      head.append('\n  ' + link);
    }
    return true;
  }
  return false;
}

(async () => {
  const entries = await fg(['**/*.html'], { cwd: ROOT, dot: false, ignore: ['**/node_modules/**'] });
  let modified = 0;
  for (const rel of entries) {
    const file = path.join(ROOT, rel);
    const html = read(file);
    const $ = cheerio.load(html);
    const changed = ensureThemeLink($);
    const next = $.html();
    if (changed && next !== html) {
      try {
        write(file, next);
        modified++;
        console.log(`[DESIGN-FIX] Injected theme into ${rel}`);
      } catch (e) {
        console.warn(`[DESIGN-FIX] Skipped (write failed) ${rel}: ${e && e.code ? e.code : 'error'}`);
      }
    }
  }
  if (modified) {
    console.log(`\nDone. Modified ${modified} file(s).`);
  } else {
    console.log('No design changes required.');
  }
})();




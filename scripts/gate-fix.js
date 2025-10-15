// Auto-fix for gating requirements: ensure gate.js and Terms link exist
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, html) { fs.writeFileSync(file, html, 'utf8'); }

function ensureGateScript($) {
  const isLegal = /terms|privacy/i.test(($('title').text() || '') + $('h1, h2').first().text());
  if (isLegal) return false; // skip legal pages per gate rules
  const hasGate = $('script[src*="/scripts/gate.js"]').length > 0;
  if (hasGate) return false;
  $('head').append('\n  <script src="/scripts/gate.js" defer></script>');
  return true;
}

function ensureTermsLink($) {
  const hasTerms = $('a[href="/terms.html"], a[href="terms.html"]').length > 0;
  if (hasTerms) return false;
  const linkHtml = '<a class="hover:underline" href="/terms.html">Terms</a>';
  const footer = $('footer');
  if (footer.length) {
    const group = footer.find('.flex').first();
    if (group.length) {
      group.append('\n        ' + linkHtml);
    } else {
      footer.append('\n    <div class="mt-4 text-sm">' + linkHtml + '</div>');
    }
    return true;
  }
  $('body').append('<div class="text-sm">' + linkHtml + '</div>');
  return true;
}

(async () => {
  const entries = await fg(['**/*.html'], { cwd: ROOT, dot: false, ignore: ['**/node_modules/**'] });
  let modified = 0;
  for (const rel of entries) {
    const file = path.join(ROOT, rel);
    let html = read(file);
    const $ = cheerio.load(html);
    const c1 = ensureGateScript($);
    const c2 = ensureTermsLink($);
    const next = $.html();
    if (next !== html) {
      try {
        write(file, next);
        modified++;
        console.log(`[GATE-FIX] Updated ${rel}${c1 ? ' — added gate.js' : ''}${c2 ? ' — added Terms link' : ''}`);
      } catch (e) {
        console.warn(`[GATE-FIX] Skipped (write failed) ${rel}: ${e && e.code ? e.code : 'error'}`);
      }
    }
  }
  if (modified) {
    console.log(`\nDone. Modified ${modified} file(s).`);
  } else {
    console.log('No gate changes required.');
  }
})();




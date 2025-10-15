// Gate presence checks: ensure legal pages exist and gate script is referenced
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

function read(file) { return fs.readFileSync(file, 'utf8'); }

function ensureExists(relPath, label) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return `${label} missing at ${relPath}`;
  const html = read(full);
  const $ = cheerio.load(html);
  const text = $('h1, h2, title').text().toLowerCase();
  return /\bprivacy\b/.test(label.toLowerCase())
    ? (/privacy/.test(text) ? null : `${relPath} should include a visible "Privacy" heading`)
    : /\bterms\b/.test(label.toLowerCase())
      ? (/terms|conditions/.test(text) ? null : `${relPath} should include a visible "Terms" heading`)
      : null;
}

(async () => {
  let failures = 0;

  const missing = [
    ensureExists('privacy.html', 'Privacy page'),
    ensureExists('terms.html', 'Terms page')
  ].filter(Boolean);
  if (missing.length) {
    failures++;
    console.log('\n[GATE] Legal pages');
    for (const m of missing) console.log(' - ' + m);
  }

  const entries = await fg(['*.html', 'blog/index.html'], { cwd: ROOT, dot: false, ignore: ['**/node_modules/**'] });
  for (const rel of entries) {
    const html = read(path.join(ROOT, rel));
    const $ = cheerio.load(html);
    const errs = [];

    // Require gate.js presence on root-level pages (excludes dedicated legal pages)
    const isLegal = /^(privacy|terms)\.html$/.test(rel);
    if (!isLegal) {
      const hasGateScript = $('script[src*="gate.js"]').length > 0;
      if (!hasGateScript) errs.push('Missing <script src="/scripts/gate.js">');
    }

    // Require links to privacy and terms in footer or anywhere
    const hasPrivacyLink = $('a[href="/privacy.html"], a[href="privacy.html"]').length > 0;
    const hasTermsLink = $('a[href="/terms.html"], a[href="terms.html"]').length > 0;
    if (!hasPrivacyLink) errs.push('Missing link to /privacy.html');
    if (!hasTermsLink) errs.push('Missing link to /terms.html');

    if (errs.length) {
      failures++;
      console.log(`\n[GATE] ${rel}`);
      for (const e of errs) console.log(' - ' + e);
    }
  }

  if (failures) {
    console.error(`\nGate checks failed on ${failures} item(s).`);
    process.exit(1);
  } else {
    console.log('All gate checks passed.');
  }
})();



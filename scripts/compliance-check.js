// Automated data compliance checks over HTML files
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

const TRACKER_PATTERNS = [
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /\bgtag\(/i, // inline gtag calls
  /static\.hotjar\.com/i,
  /\bhj\(/i, // hotjar inline calls
  /clarity\.ms/i,
  /\bf b q\(/i, // keep unlikely spacing variant
  /\bfbq\(/i,
  /connect\.facebook\.net/i,
  /cdn\.segment\.com/i,
  /plausible\.io/i,
  /cdn\.mouseflow\.com/i,
  /script\.crazyegg\.com/i,
  /hsappstatic\.net/i,
  /mixpanel/i
];

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function load(file) {
  return cheerio.load(read(file));
}

function findTrackers($) {
  const found = new Set();
  $('script').each((_, el) => {
    const src = $(el).attr('src') || '';
    const code = $(el).contents().text() || '';
    const haystack = src + '\n' + code;
    for (const rx of TRACKER_PATTERNS) {
      if (rx.test(haystack)) found.add(rx.source);
    }
  });
  return Array.from(found);
}

function hasPrivacyLink($) {
  return $('a[href="/privacy.html"], a[href="privacy.html"]').length > 0;
}

function hasConsentCheckbox($, form) {
  const $form = $(form);
  const checkbox = $form.find('input[type="checkbox"][name="privacy-consent"][required]');
  return checkbox.length > 0;
}

function checkPrivacyPage() {
  const file = path.join(ROOT, 'privacy.html');
  if (!fs.existsSync(file)) return ['Missing privacy.html'];
  const html = read(file);
  const $ = cheerio.load(html);
  const titleText = $('h1, h2, title').text().toLowerCase();
  if (!/privacy/.test(titleText)) return ['privacy.html should include a visible "Privacy Policy" heading'];
  const hasContact = $('a[href^="mailto:"], a[href^="/index.html#contact"], a[href^="#contact"]').length > 0;
  if (!hasContact) return ['privacy.html should include a contact method (mailto or contact link)'];
  return [];
}

(async () => {
  const entries = await fg(['**/*.html'], { cwd: ROOT, dot: false, ignore: ['**/node_modules/**'] });

  let failures = 0;

  // Repo-wide privacy page check
  const privacyErrors = checkPrivacyPage();
  if (privacyErrors.length) {
    failures++;
    console.log('\n[COMPLIANCE] privacy.html');
    for (const e of privacyErrors) console.log(' - ' + e);
  }

  for (const rel of entries) {
    const file = path.join(ROOT, rel);
    const html = read(file);
    const $ = cheerio.load(html);

    const errs = [];

    // 1) Tracker detection
    const trackers = findTrackers($);
    if (trackers.length) errs.push(`Third-party trackers detected: ${trackers.join(', ')}`);

    // 2) Footer/link to privacy on main pages (root-level HTML only)
    const isRootPage = !rel.includes('/') || /^blog\/index\.html$/.test(rel);
    if (isRootPage && !hasPrivacyLink($)) errs.push('Missing link to /privacy.html');

    // 3) Forms must include a required privacy consent checkbox
    $('form').each((_, form) => {
      const method = ($(form).attr('method') || 'GET').toUpperCase();
      const isPosting = method === 'POST' || $(form).attr('data-netlify') === 'true';
      if (isPosting && !hasConsentCheckbox($, form)) {
        errs.push('Form missing required checkbox input[name="privacy-consent"]');
      }
    });

    if (errs.length) {
      failures++;
      console.log(`\n[COMPLIANCE] ${rel}`);
      for (const e of errs) console.log(' - ' + e);
    }
  }

  if (failures) {
    console.error(`\nCompliance checks failed on ${failures} item(s).`);
    process.exit(1);
  } else {
    console.log('All compliance checks passed.');
  }
})();



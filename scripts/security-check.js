// Minimal security checks over all HTML files in the repo root and blog
// Fails (non-zero exit) if required headers/tags are missing.
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

// Required meta/security-related tags per page
const REQUIRED_POLICIES = [
  'meta[http-equiv="Content-Security-Policy"]',
  'meta[name="referrer"][content]'
];

// Tailwind CDN requires allowing https://cdn.tailwindcss.com
// We will validate CSP contains default-src 'self' and script-src including the CDN
function validateCsp($, file) {
  const csp = $('meta[http-equiv="Content-Security-Policy"]').attr('content') || '';
  const errors = [];
  const requiredFragments = [
    "default-src 'self'",
    "script-src 'self' https://cdn.tailwindcss.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  for (const frag of requiredFragments) {
    if (!csp.includes(frag)) {
      errors.push(`CSP missing fragment: ${frag}`);
    }
  }
  return errors.map(e => `${file}: ${e}`);
}

function load(file) {
  const html = fs.readFileSync(file, 'utf8');
  return cheerio.load(html);
}

async function main() {
  const files = await fg(['*.html', 'blog/**/*.html'], { cwd: ROOT, dot: false, onlyFiles: true });
  const errors = [];

  for (const file of files) {
    const full = path.join(ROOT, file);
    const $ = load(full);

    for (const sel of REQUIRED_POLICIES) {
      if (!$(sel).length) {
        errors.push(`${file}: missing ${sel}`);
      }
    }

    // Validate CSP details
    errors.push(...validateCsp($, file));

    // Recommend rel=noopener on external target=_blank links (warn only)
    $("a[target='_blank']").each((_, el) => {
      const rel = $(el).attr('rel') || '';
      if (!rel.includes('noopener')) {
        errors.push(`${file}: link missing rel="noopener" for target=_blank`);
      }
    });
  }

  // Check presence of .well-known/security.txt
  if (!fs.existsSync(path.join(ROOT, '.well-known', 'security.txt'))) {
    errors.push('missing .well-known/security.txt');
  }

  if (errors.length) {
    console.error('Security check failed:\n' + errors.map(e => ` - ${e}`).join('\n'));
    process.exit(1);
  }
  console.log('Security checks passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



// Automated fixer for data compliance issues
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = process.cwd();

function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, html) { fs.writeFileSync(file, html, 'utf8'); }

function removeTrackers($) {
  let removed = 0;
  $('script[src*="googletagmanager.com"], script[src*="google-analytics.com"], script[src*="static.hotjar.com"]').each((_, el) => {
    $(el).remove();
    removed++;
  });
  $('script').each((_, el) => {
    const code = $(el).contents().text() || '';
    if (/\bgtag\(|\bhj\(|static\.hotjar\.com/i.test(code)) {
      $(el).remove();
      removed++;
    }
  });
  return removed;
}

function ensurePrivacyLink($) {
  if ($('a[href="/privacy.html"], a[href="privacy.html"]').length) return false;
  const linkHtml = '<a class="hover:underline" href="/privacy.html">Privacy</a>';
  // Prefer semantic footer blocks
  const footer = $('footer');
  if (footer.length) {
    const linkGroup = footer.find('.flex').first();
    if (linkGroup.length) {
      linkGroup.append(linkHtml);
    } else {
      footer.append(`<div class="mt-4 text-sm">${linkHtml}</div>`);
    }
    return true;
  }
  // Non-semantic footer support
  const footerDiv = $('.footer').first();
  if (footerDiv.length) {
    const sep = footerDiv.html().trim().length ? ' · ' : '';
    footerDiv.append(sep + linkHtml);
    return true;
  }
  // Fallback: append to body
  $('body').append(`<div style="margin:10px 16px;font-size:12px;color:#475569">${linkHtml}</div>`);
  return true;
}

function ensureDemoConsent($) {
  const form = $('form#demoForm');
  if (!form.length) return false;
  if (form.find('input[name="privacy-consent"]').length) return false;
  const consent = `
    <div class="text-sm text-slate-600 flex items-start gap-2">
      <input id="privacy-consent" name="privacy-consent" type="checkbox" required class="mt-1" />
      <label for="privacy-consent">I agree to the processing of my information per the <a class="underline" href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</label>
    </div>`;
  // Insert before the submit buttons block if present, else append
  const buttons = form.find('button[type="submit"]').first().closest('div');
  if (buttons && buttons.length) {
    buttons.before(consent);
  } else {
    form.append(consent);
  }
  return true;
}

function ensurePrivacyPage() {
  const file = path.join(ROOT, 'privacy.html');
  if (fs.existsSync(file)) return false;
  const html = `<!doctype html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
  <title>Privacy Policy — EQLabs.ai</title>
  <meta name="description" content="EQLabs.ai Privacy Policy" />
  <link rel="icon" href="/favicon.ico" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="canonical" href="https://eqlabs.ai/privacy.html" />
  <meta property="og:title" content="Privacy Policy — EQLabs.ai" />
  <meta property="og:description" content="How we collect and use information on eqlabs.ai" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/og-image.png" />
  <meta name="twitter:card" content="summary" />
  <meta name="robots" content="index,follow" />
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Privacy Policy","url":"https://eqlabs.ai/privacy.html"}</script>
  </head>
<body class="bg-white text-slate-900 antialiased selection:bg-black/10">
  <header class="sticky top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
    <div class="mx-auto max-w-7xl px-4">
      <nav class="h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-3">
          <div class="h-7 w-7 rounded-lg bg-black"></div>
          <span class="font-semibold tracking-tight">EQLabs.ai</span>
        </a>
      </nav>
    </div>
  </header>

  <main class="py-16">
    <div class="mx-auto max-w-3xl px-4 prose prose-slate">
      <h1>Privacy Policy</h1>
      <p>Last updated: ${(new Date()).toISOString().slice(0,10)}</p>
      <p>We respect your privacy. This site does not use third-party analytics or advertising cookies. We collect only what you submit via our contact/demo form.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Form submissions (name, email, organization, and message).</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To respond to your requests (e.g., demo or investment inquiries).</li>
        <li>To operate and improve our website and research communications.</li>
      </ul>
      <h2>Data retention</h2>
      <p>We retain form submissions as long as needed to fulfill the request, then securely delete them.</p>
      <h2>Your rights</h2>
      <p>Depending on your location, you may have rights to access, correct, or delete your information. Contact us to exercise these rights.</p>
      <h2>Contact</h2>
      <p>Email: <a href="mailto:info@eqlabs.ai">info@eqlabs.ai</a></p>
    </div>
  </main>

  <footer class="py-12 border-t border-slate-200">
    <div class="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
      <div>&copy; <span id="y"></span> EQLabs.ai — The Equator Intelligence Lab</div>
      <div class="flex items-center gap-4">
        <a class="hover:underline" target="_blank" href="https://arxiv.org/abs/2501.00257">arXiv</a>
        <a class="hover:underline" href="https://www.linkedin.com/groups/" target="_blank">LinkedIn</a>
        <a class="hover:underline" href="mailto:info@eqlabs.ai">Email</a>
        <a class="hover:underline" href="/privacy.html">Privacy</a>
      </div>
    </div>
  </footer>
  <script>document.getElementById('y').textContent = new Date().getFullYear();</script>
</body>
</html>`;
  fs.writeFileSync(file, html, 'utf8');
  return true;
}

(async () => {
  const entries = await fg(['**/*.html'], { cwd: ROOT, dot: false, ignore: ['**/node_modules/**'] });
  let modifiedFiles = 0;

  const createdPrivacy = ensurePrivacyPage();
  if (createdPrivacy) modifiedFiles++;

  for (const rel of entries) {
    const file = path.join(ROOT, rel);
    let html = read(file);
    const $ = cheerio.load(html);

    const removed = removeTrackers($);
    const addedLink = ensurePrivacyLink($);
    const addedConsent = ensureDemoConsent($);

    const next = $.html();
    if (next !== html) {
      write(file, next);
      modifiedFiles++;
      console.log(`[FIX] Updated ${rel}${removed ? ` — removed ${removed} tracker script(s)` : ''}${addedLink ? ' — added Privacy link' : ''}${addedConsent ? ' — added demo consent' : ''}`);
    }
  }

  if (modifiedFiles) {
    console.log(`\nDone. Modified ${modifiedFiles} file(s).`);
  } else {
    console.log('No changes required.');
  }
})();



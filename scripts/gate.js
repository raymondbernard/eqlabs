(function(){
  var host = (location.hostname || '').toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1') return;
  var qs = location.search || '';
  if (/[?&](gate=off|access=open)\b/i.test(qs)) {
    try { window.localStorage.setItem('eqlabs-gate:accepted', '1'); } catch(_) {}
    return;
  }

  if (window.localStorage.getItem('eqlabs-gate:accepted') === '1') return;
  var path = (location.pathname||'').toLowerCase();
  if (/^(privacy|terms)\.html?$/.test((path.split('/') .pop()||''))) return;
  if (path.indexOf('/blog/') === 0 || /^\/post_/.test(path)) return;

  var style = document.createElement('style');
  style.textContent = '\n#eqlabs-gate-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.66);backdrop-filter:saturate(1.2) blur(2px);z-index:9998}\\n#eqlabs-gate{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999}\\n#eqlabs-gate .card{max-width:560px;width:92%;background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(0,0,0,.08)}\\n#eqlabs-gate .inner{padding:20px 20px}\\n#eqlabs-gate h2{margin:0 0 6px 0;font:600 20px/1.3 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a}\\n#eqlabs-gate p{margin:6px 0 12px 0;color:#334155;font:400 14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}\\n#eqlabs-gate label{display:block;font:500 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#475569;margin:10px 0 6px}\\n#eqlabs-gate input, #eqlabs-gate textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font:400 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}\\n#eqlabs-gate textarea{min-height:84px;resize:vertical}\\n#eqlabs-gate .row{display:flex;gap:10px}\\n#eqlabs-gate .row>div{flex:1}\\n#eqlabs-gate .consent{display:flex;align-items:flex-start;gap:8px;margin-top:10px}\\n#eqlabs-gate .consent input{width:auto}\\n#eqlabs-gate .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}\\n#eqlabs-gate .btn{appearance:none;border:none;border-radius:999px;padding:10px 16px;font:500 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;cursor:pointer}\\n#eqlabs-gate .btn.primary{background:#0f172a;color:#fff}\\n#eqlabs-gate .btn.secondary{background:#e2e8f0;color:#0f172a}\\n';
  document.head.appendChild(style);

  var backdrop = document.createElement('div');
  backdrop.id = 'eqlabs-gate-backdrop';
  var hostEl = document.createElement('div');
  hostEl.id = 'eqlabs-gate';
  hostEl.innerHTML = ''+
    '<div class="card" role="dialog" aria-modal="true" aria-labelledby="eqlabs-gate-title">' +
    '  <div class="inner">' +
    '    <h2 id="eqlabs-gate-title">Before you continue</h2>' +
    '    <p>To access our site, please confirm the Terms and optionally share your email and notes so we can follow up. This helps us keep the community high‑signal.</p>' +
    '    <div class="row">' +
    '      <div><label for="eql-email">Email (optional)</label><input id="eql-email" type="email" placeholder="you@company.com"></div>' +
    '      <div><label for="eql-org">Organization (optional)</label><input id="eql-org" type="text" placeholder="Company / Affiliation"></div>' +
    '    </div>' +
    '    <label for="eql-notes">Notes (optional)</label>' +
    '    <textarea id="eql-notes" placeholder="What brings you here? Context helps us respond."></textarea>' +
    '    <div class="consent">' +
    '      <input id="eql-consent" type="checkbox" required>' +
    '      <label for="eql-consent">I agree to the <a href="/terms.html" target="_blank" rel="noopener">Terms</a> and acknowledge the <a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</label>' +
    '    </div>' +
    '    <div class="actions">' +
    '      <button class="btn secondary" id="eql-decline">Leave</button>' +
    '      <button class="btn primary" id="eql-continue">Continue</button>' +
    '    </div>' +
    '  </div>' +
    '</div>';

  function closeGate() {
    document.body.removeChild(hostEl);
    document.body.removeChild(backdrop);
  }

  document.addEventListener('DOMContentLoaded', function(){
    document.body.appendChild(backdrop);
    document.body.appendChild(hostEl);
    var btnContinue = document.getElementById('eql-continue');
    var btnDecline = document.getElementById('eql-decline');
    btnContinue.addEventListener('click', function(){
      var consent = document.getElementById('eql-consent').checked;
      if (!consent) {
        alert('Please agree to the Terms and Privacy Policy to continue.');
        return;
      }
      var payload = {
        email: document.getElementById('eql-email').value.trim(),
        org: document.getElementById('eql-org').value.trim(),
        notes: document.getElementById('eql-notes').value.trim(),
        ts: new Date().toISOString(),
        path: location.pathname
      };
      try {
        window.localStorage.setItem('eqlabs-gate:data', JSON.stringify(payload));
      } catch(_) {}
      window.localStorage.setItem('eqlabs-gate:accepted', '1');
      closeGate();
    });
    btnDecline.addEventListener('click', function(){
      window.location.href = 'https://www.google.com';
    });
  });
})();



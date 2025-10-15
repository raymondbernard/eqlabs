// Lightweight anomaly monitor: logs unusual activities to console and can be extended to report.
// - Detects console tampering, rapid focus changes, and suspicious iframe injection attempts.
(function () {
  const start = Date.now();
  let lastFocus = document.hasFocus();
  let focusFlipCount = 0;

  function onVisibility() {
    const nowFocus = document.hasFocus();
    if (nowFocus !== lastFocus) {
      lastFocus = nowFocus;
      focusFlipCount++;
      if (focusFlipCount > 10 && Date.now() - start < 60_000) {
        console.warn('[monitor] Excessive focus changes detected');
      }
    }
  }
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onVisibility);
  window.addEventListener('blur', onVisibility);

  // Detect unexpected iframes added to DOM
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.tagName === 'IFRAME') {
          const src = node.getAttribute('src') || '';
          if (!/^(https?:)?\/\/www\.youtube\.com\//.test(src)) {
            console.warn('[monitor] Unexpected iframe added', src);
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Detect console tampering (basic)
  const nativeLog = console.log;
  setInterval(() => {
    if (console.log !== nativeLog) {
      console.warn('[monitor] Console methods overridden');
    }
  }, 5000);
})();



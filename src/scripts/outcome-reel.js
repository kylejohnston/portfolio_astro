// Transitions.dev "spinning counter" applied to .outcome__value figures.
// Only digit runs get a reel; surrounding symbols/units (currency signs,
// %, "M", "weeks", ...) stay as plain static text alongside them.
document.addEventListener('DOMContentLoaded', () => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SPINS = 2; // full revolutions before landing on the real digit

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const readCssMs = (name, fallback) => {
    const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(n) ? n : fallback;
  };
  const readCssPx = (name, fallback) => {
    const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isFinite(n) ? n : fallback;
  };

  const REEL_DUR = readCssMs('--reel-dur', 1400);
  const REEL_STAGGER = readCssMs('--reel-stagger', 90);
  const REEL_BLUR = readCssPx('--reel-spin-blur', 3);

  let defsContainer = null;
  function getDefsContainer() {
    if (defsContainer) return defsContainer;
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    defsContainer = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defsContainer);
    document.body.appendChild(svg);
    return defsContainer;
  }

  let filterCount = 0;
  function createBlurFilter() {
    const id = 'reel-blur-' + filterCount++;
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    const feGaussianBlur = document.createElementNS(SVG_NS, 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '0 ' + REEL_BLUR);
    filter.appendChild(feGaussianBlur);
    getDefsContainer().appendChild(filter);
    return { id, feGaussianBlur };
  }

  // Vertical-only blur, decayed to 0 over this column's own transition
  // window (its stagger delay, then --reel-dur) — a CSS transition can't
  // animate an SVG filter primitive's stdDeviation, so this rAF loop
  // mirrors the transform transition by hand.
  function decayBlur(feGaussianBlur, delayMs) {
    const start = performance.now() + delayMs;
    function frame(now) {
      if (now < start) {
        requestAnimationFrame(frame);
        return;
      }
      const t = Math.min(1, (now - start) / REEL_DUR);
      const eased = 1 - Math.pow(1 - t, 3);
      const remaining = REEL_BLUR * (1 - eased);
      feGaussianBlur.setAttribute('stdDeviation', '0 ' + remaining.toFixed(2));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function buildDigitColumn(digit, colIndex) {
    const col = document.createElement('span');
    col.className = 't-reel-col';
    col.dataset.digit = String(digit);
    col.dataset.colIndex = String(colIndex);

    // (SPINS + 1) repeated 0-9 cycles, so translating up to (SPINS*10 + digit)
    // cells passes through real digit faces the whole way instead of running
    // off the end of a single 0-9 strip into blank space.
    const strip = document.createElement('span');
    strip.className = 't-reel-strip';
    for (let cycle = 0; cycle <= SPINS; cycle++) {
      for (let i = 0; i <= 9; i++) {
        const cell = document.createElement('span');
        cell.className = 't-reel-digit';
        cell.textContent = String(i);
        strip.appendChild(cell);
      }
    }

    const { id, feGaussianBlur } = createBlurFilter();
    strip.style.filter = 'url(#' + id + ')';
    col.appendChild(strip);
    return { col, feGaussianBlur };
  }

  function spinColumn(col, feGaussianBlur) {
    const strip = col.querySelector('.t-reel-strip');
    const digit = Number(col.dataset.digit);
    const delay = Number(col.dataset.colIndex) * REEL_STAGGER;
    const target = SPINS * 10 + digit;
    strip.style.transition = `transform var(--reel-dur) var(--reel-ease) ${delay}ms`;
    strip.style.transform = `translateY(calc(-1 * ${target} * var(--reel-cell)))`;
    decayBlur(feGaussianBlur, delay);
  }

  function buildValue(el) {
    const text = el.textContent.trim();
    if (!text) return;

    el.classList.add('reel-built');
    el.setAttribute('aria-label', text);
    el.innerHTML = '';

    const line = document.createElement('span');
    line.className = 't-reel-line';
    line.setAttribute('aria-hidden', 'true');
    el.appendChild(line);

    const tokens = text.match(/\d+|\D+/g) || [];
    let colIndex = 0;
    const columns = []; // { col, feGaussianBlur }

    tokens.forEach((token) => {
      if (/^\d+$/.test(token)) {
        const reel = document.createElement('span');
        reel.className = 't-reel';
        for (const ch of token) {
          const { col, feGaussianBlur } = buildDigitColumn(Number(ch), colIndex);
          reel.appendChild(col);
          columns.push({ col, feGaussianBlur });
          colIndex++;
        }
        line.appendChild(reel);
      } else {
        const span = document.createElement('span');
        span.className = 't-reel-static';
        span.textContent = token;
        line.appendChild(span);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        columns.forEach(({ col, feGaussianBlur }) => spinColumn(col, feGaussianBlur));
        observer.disconnect();
      });
    }, { threshold: 0.3 });
    observer.observe(el);
  }

  function initOutcomeReels(root) {
    if (prefersReducedMotion()) return;
    (root || document).querySelectorAll('.outcome__value:not(.reel-built)').forEach(buildValue);
  }

  window.__initOutcomeReels = initOutcomeReels;
  initOutcomeReels(document);
});

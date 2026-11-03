/*
 * Palette switcher for the design samples.
 *
 * A page defines window.PALETTES before loading this script:
 *   window.PALETTES = [
 *     { id: 'default', name: '藍', swatch: ['#1d3557', '#e8962e'] },
 *     { id: 'sumi', name: '墨', swatch: [...], vars: { '--ai': '#2b2b2b' }, map: { '#1d3557': '#2b2b2b' } },
 *   ];
 * - vars: CSS custom properties set on :root
 * - map:  hex -> hex replacements for SVG fill/stroke/stop-color and inline style colors
 * - The palette's id is also set as <html data-palette="..."> so pages can add CSS overrides.
 * The active palette comes from ?palette=<id> (kept in the URL when switching), else the first entry.
 * Set window.PALETTE_UI = false to hide the floating switcher; window.applyPalette(id) switches from code.
 */
(() => {
  const palettes = window.PALETTES;
  if (!Array.isArray(palettes) || palettes.length < 2) return;

  const root = document.documentElement;
  const colorAttrs = ['fill', 'stroke', 'stop-color'];
  const norm = (c) => (c || '').trim().toLowerCase();

  // Remember each element's original colors once, so palettes never compound.
  const targets = [];
  document.querySelectorAll('[fill], [stroke], [stop-color], [style]').forEach((el) => {
    const orig = {};
    colorAttrs.forEach((a) => { if (el.hasAttribute(a)) orig[a] = el.getAttribute(a); });
    if (el.hasAttribute('style')) orig.style = el.getAttribute('style');
    targets.push({ el, orig });
  });

  function apply(p) {
    const map = {};
    Object.entries(p.map || {}).forEach(([k, v]) => { map[norm(k)] = v; });
    const swap = (c) => map[norm(c)] || c;

    targets.forEach(({ el, orig }) => {
      colorAttrs.forEach((a) => { if (a in orig) el.setAttribute(a, swap(orig[a])); });
      if ('style' in orig) {
        el.setAttribute('style', orig.style.replace(/#[0-9a-f]{3,8}\b/gi, swap));
      }
    });

    // Reset vars from any previous palette, then set this one's.
    palettes.forEach((q) => Object.keys(q.vars || {}).forEach((k) => root.style.removeProperty(k)));
    Object.entries(p.vars || {}).forEach(([k, v]) => root.style.setProperty(k, v));
    root.dataset.palette = p.id;

    if (!switcher) return;
    switcher.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === p.id));
    label.textContent = p.name;
  }

  window.applyPalette = (id) => apply(palettes.find((p) => p.id === id) || palettes[0]);

  let switcher = null, label = null;
  if (window.PALETTE_UI !== false) {
    // UI: floating pill with one swatch button per palette
    const style = document.createElement('style');
    style.textContent = `
      .palette-switcher { position: fixed; right: 18px; bottom: 18px; z-index: 9999; display: flex; align-items: center; gap: 10px;
        padding: 8px 10px 8px 16px; border-radius: 999px; background: rgba(255,255,255,.92); color: #333;
        box-shadow: 0 10px 30px -10px rgba(0,0,0,.35); backdrop-filter: blur(6px);
        font: 500 12px/1.2 system-ui, -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif; letter-spacing: .05em; }
      .palette-switcher .ps-label { white-space: nowrap; }
      .palette-switcher .ps-label b { font-weight: 700; margin-left: 4px; }
      .palette-switcher button { width: 30px; height: 30px; padding: 0; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
        box-shadow: 0 0 0 1px rgba(0,0,0,.15); transition: transform .2s, box-shadow .2s; }
      .palette-switcher button:hover { transform: scale(1.1); }
      .palette-switcher button[aria-pressed="true"] { box-shadow: 0 0 0 2px #333; }
      @media print { .palette-switcher { display: none; } }
    `;
    document.head.appendChild(style);

    switcher = document.createElement('div');
    switcher.className = 'palette-switcher';
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', '配色の切り替え');
    const labelWrap = document.createElement('span');
    labelWrap.className = 'ps-label';
    labelWrap.textContent = '配色';
    label = document.createElement('b');
    labelWrap.appendChild(label);
    switcher.appendChild(labelWrap);

    palettes.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = p.id;
      b.title = p.name;
      b.setAttribute('aria-label', `配色：${p.name}`);
      const [a, c] = p.swatch;
      b.style.background = `linear-gradient(135deg, ${a} 0 50%, ${c} 50% 100%)`;
      b.addEventListener('click', () => {
        apply(p);
        const url = new URL(location.href);
        if (p === palettes[0]) url.searchParams.delete('palette'); else url.searchParams.set('palette', p.id);
        history.replaceState(null, '', url);
      });
      switcher.appendChild(b);
    });
    document.body.appendChild(switcher);

  }

  const initial = new URLSearchParams(location.search).get('palette');
  apply(palettes.find((p) => p.id === initial) || palettes[0]);
})();

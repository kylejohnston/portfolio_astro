document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'grid-jig-settings-v1';
  const DEFAULTS = { collapsed: true, visible: false, zIndex: 100000, margin: 48, gutter: 24, maxWidth: 1400 };
  // Deliberately above everything, including the overlay's z-index (999) —
  // the panel must stay usable while the overlay is open.
  const PANEL_Z = 2147483647;

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // private browsing / quota exceeded — settings just won't persist
    }
  }

  const settings = loadSettings();

  // Astro scoped styles don't reach JS-created elements, so this tool's CSS
  // is injected directly as a plain (unscoped) stylesheet.
  const style = document.createElement('style');
  style.textContent = `
    #grid-jig-panel {
      position: fixed;
      right: 16px;
      bottom: 16px;
      z-index: ${PANEL_Z};
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
      background: rgba(20, 20, 20, 0.92);
      color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      user-select: none;
    }
    #grid-jig-toggle {
      display: block;
      width: 100%;
      padding: 8px 12px;
      background: none;
      border: none;
      color: inherit;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
    }
    #grid-jig-body {
      padding: 0 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #grid-jig-panel.collapsed #grid-jig-body {
      display: none;
    }
    .grid-jig-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
    }
    .grid-jig-row input[type='number'] {
      width: 90px;
      font: inherit;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: inherit;
      border-radius: 4px;
      padding: 2px 6px;
    }
    #grid-jig-overlay {
      position: fixed;
      inset: 0;
      display: none;
      pointer-events: none;
      margin-inline: auto;
    }
    #grid-jig-overlay.visible {
      display: block;
    }
    #grid-jig-overlay .jig-cols {
      height: 100%;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
    }
    #grid-jig-overlay .jig-col {
      height: 100%;
      background: rgba(255, 0, 128, 0.08);
      outline: 1px solid rgba(255, 0, 128, 0.35);
    }
    @media (max-width: 767px) {
      #grid-jig-overlay .jig-cols {
        grid-template-columns: repeat(6, 1fr);
      }
      #grid-jig-overlay .jig-col:nth-child(n + 7) {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);

  // Grid guide. Lives at the end of <body>, outside #overlayPageContent, so
  // it survives the overlay swapping its inner content and can be checked
  // against both the page surface and the overlay at once.
  const gridOverlay = document.createElement('div');
  gridOverlay.id = 'grid-jig-overlay';
  const cols = document.createElement('div');
  cols.className = 'jig-cols';
  for (let i = 0; i < 12; i++) {
    const col = document.createElement('div');
    col.className = 'jig-col';
    cols.appendChild(col);
  }
  gridOverlay.appendChild(cols);
  document.body.appendChild(gridOverlay);

  // Control panel
  const panel = document.createElement('div');
  panel.id = 'grid-jig-panel';

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'grid-jig-toggle';
  toggleBtn.type = 'button';
  toggleBtn.textContent = 'Grid jig';
  panel.appendChild(toggleBtn);

  const body = document.createElement('div');
  body.id = 'grid-jig-body';

  const visRow = document.createElement('label');
  visRow.className = 'grid-jig-row';
  const visCheckbox = document.createElement('input');
  visCheckbox.type = 'checkbox';
  visRow.append('Show grid', visCheckbox);
  body.appendChild(visRow);

  const zRow = document.createElement('label');
  zRow.className = 'grid-jig-row';
  const zInput = document.createElement('input');
  zInput.type = 'number';
  zInput.step = '1';
  zRow.append('Grid z-index', zInput);
  body.appendChild(zRow);

  const marginRow = document.createElement('label');
  marginRow.className = 'grid-jig-row';
  const marginInput = document.createElement('input');
  marginInput.type = 'number';
  marginInput.step = '1';
  marginRow.append('Margin (px)', marginInput);
  body.appendChild(marginRow);

  const gutterRow = document.createElement('label');
  gutterRow.className = 'grid-jig-row';
  const gutterInput = document.createElement('input');
  gutterInput.type = 'number';
  gutterInput.step = '1';
  gutterRow.append('Gutter (px)', gutterInput);
  body.appendChild(gutterRow);

  const maxWidthRow = document.createElement('label');
  maxWidthRow.className = 'grid-jig-row';
  const maxWidthInput = document.createElement('input');
  maxWidthInput.type = 'number';
  maxWidthInput.step = '1';
  maxWidthRow.append('Max width (px)', maxWidthInput);
  body.appendChild(maxWidthRow);

  panel.appendChild(body);
  document.body.appendChild(panel);

  function applySettings() {
    panel.classList.toggle('collapsed', settings.collapsed);
    gridOverlay.classList.toggle('visible', settings.visible);
    gridOverlay.style.zIndex = settings.zIndex;
    gridOverlay.style.paddingInline = `${settings.margin}px`;
    gridOverlay.style.maxWidth = `${settings.maxWidth}px`;
    cols.style.gap = `${settings.gutter}px`;
    visCheckbox.checked = settings.visible;
    zInput.value = settings.zIndex;
    marginInput.value = settings.margin;
    gutterInput.value = settings.gutter;
    maxWidthInput.value = settings.maxWidth;
  }

  applySettings();

  toggleBtn.addEventListener('click', () => {
    settings.collapsed = !settings.collapsed;
    applySettings();
    saveSettings(settings);
  });

  visCheckbox.addEventListener('change', () => {
    settings.visible = visCheckbox.checked;
    applySettings();
    saveSettings(settings);
  });

  zInput.addEventListener('input', () => {
    const value = parseInt(zInput.value, 10);
    settings.zIndex = Number.isFinite(value) ? value : DEFAULTS.zIndex;
    applySettings();
    saveSettings(settings);
  });

  marginInput.addEventListener('input', () => {
    const value = parseInt(marginInput.value, 10);
    settings.margin = Number.isFinite(value) ? value : DEFAULTS.margin;
    applySettings();
    saveSettings(settings);
  });

  gutterInput.addEventListener('input', () => {
    const value = parseInt(gutterInput.value, 10);
    settings.gutter = Number.isFinite(value) ? value : DEFAULTS.gutter;
    applySettings();
    saveSettings(settings);
  });

  maxWidthInput.addEventListener('input', () => {
    const value = parseInt(maxWidthInput.value, 10);
    settings.maxWidth = Number.isFinite(value) ? value : DEFAULTS.maxWidth;
    applySettings();
    saveSettings(settings);
  });
});
